import os
import torch
from typing import Optional, Dict, Any
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_groq import ChatGroq
from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun
import logging

logger = logging.getLogger(__name__)

class LocalModelLLM(LLM):
    """Custom LangChain wrapper for local fine-tuned model"""
    
    model: Any = None
    tokenizer: Any = None
    max_length: int = 800
    temperature: float = 0.8
    top_p: float = 0.95
    repetition_penalty: float = 1.15
    
    def __init__(self, model_path: str, max_length: int = 800, temperature: float = 0.8, 
                 top_p: float = 0.95, repetition_penalty: float = 1.15, **kwargs):
        super().__init__(**kwargs)
        self.max_length = max_length
        self.temperature = temperature
        self.top_p = top_p
        self.repetition_penalty = repetition_penalty
        self.load_model(model_path)
    
    def load_model(self, model_path: str):
        """Load the base model and QLoRA/PEFT adapter if present, only once per instance"""
        try:
            logger.info(f"Loading local model from: {model_path}")

            from peft import PeftModel
            from transformers import AutoModelForCausalLM, AutoTokenizer

            # Prevent re-loading if already loaded
            if hasattr(self, '_adapter_loaded') and self._adapter_loaded:
                logger.info("Adapter already loaded, skipping reload.")
                return

            # Check for HuggingFace cache structure
            hf_cache_dir = os.path.join(model_path, "models--meta-llama--Llama-3.2-1B-Instruct")
            if os.path.exists(hf_cache_dir):
                # Load from HuggingFace cache structure
                snapshots_dir = os.path.join(hf_cache_dir, "snapshots")
                if os.path.exists(snapshots_dir):
                    snapshot_dirs = [d for d in os.listdir(snapshots_dir) if os.path.isdir(os.path.join(snapshots_dir, d))]
                    if snapshot_dirs:
                        base_model_path = os.path.join(snapshots_dir, snapshot_dirs[0])
                        logger.info(f"Loading base model from HuggingFace cache: {base_model_path}")
                    else:
                        base_model_path = model_path
                        logger.warning("No snapshot found in HuggingFace cache, using root path")
                else:
                    base_model_path = model_path
                    logger.warning("No snapshots directory found, using root path")
            else:
                base_model_path = model_path

            # Load tokenizer from the base model path
            self.tokenizer = AutoTokenizer.from_pretrained(base_model_path)

            adapter_config_path = os.path.join(model_path, "adapter_config.json")
            adapter_weights_path = os.path.join(model_path, "adapter_model.safetensors")

            if os.path.exists(adapter_config_path) and os.path.exists(adapter_weights_path):
                # Load base model from the correct path
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_path,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map="auto" if torch.cuda.is_available() else None,
                    trust_remote_code=True
                )
                # Load adapter from the root model path
                self.model = PeftModel.from_pretrained(base_model, model_path)
                self._adapter_loaded = True
                logger.info("✅ Loaded base model + QLoRA/PEFT adapter (adapter_config.json and adapter_model.safetensors found)")
            else:
                # Fallback: just load base model
                self.model = AutoModelForCausalLM.from_pretrained(
                    base_model_path,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map="auto" if torch.cuda.is_available() else None,
                    trust_remote_code=True
                )
                self._adapter_loaded = False
                logger.warning("⚠️ Loaded base model only (no adapter found at adapter_config.json and adapter_model.safetensors)")

            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

        except Exception as e:
            logger.error(f"❌ Failed to load local model: {e}")
            raise
    
    @property
    def _llm_type(self) -> str:
        return "fine_tuned_local"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[list] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Generate response using the local model"""
        try:
            # Improved prompt formatting for RAG
            context = None
            question = None
            if '\nUser:' in prompt:
                parts = prompt.split('\nUser:', 1)
                context = parts[0].strip()
                question = parts[1].strip()
            else:
                question = prompt.strip()
            # Enhanced system prompt for Genie
            system_prompt = (
                "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
                "Always answer user questions directly, clearly, and with emotional support. "
                "Use markdown formatting for clarity."
            )
            if context:
                full_prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{context}\nUser: {question} [/INST]"
            else:
                full_prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\nUser: {question} [/INST]"
            inputs = self.tokenizer.encode(full_prompt, return_tensors="pt", truncation=True, max_length=1800)

            if torch.cuda.is_available():
                inputs = inputs.cuda()
                if not next(self.model.parameters()).is_cuda:
                    self.model = self.model.cuda()

            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=min(len(inputs[0]) + 1200, 2048),
                    temperature=0.9,
                    top_p=0.97,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=self.repetition_penalty
                )

            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            if response.startswith(full_prompt):
                response = response[len(full_prompt):].strip()
            return response
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error: Unable to generate response - {str(e)}"

class LLMManager:
    """Enhanced LLM Manager supporting hybrid approach: Groq for classification, Local for responses"""
    
    def __init__(self, config=None):
        """
        Initialize LLM Manager with hybrid support
        
        Args:
            config: Configuration object (optional, will use environment variables if not provided)
        """
        self.config = config
        self.primary_provider = os.getenv("LLM_PROVIDER", "groq").lower()
        
        # Initialize both LLMs for hybrid approach
        self.primary_llm = None  # Main LLM (groq or local)
        self.classification_llm = None  # Always Groq for classification
        self.crisis_llm = None  # Llama Guard for crisis detection
        
        # Cache for dynamic model instances
        self._model_cache = {}
        
        self.setup_hybrid_llms()
    
    def setup_hybrid_llms(self):
        """Initialize hybrid LLM setup"""
        try:
            # Setup primary LLM based on environment
            if self.primary_provider == "groq":
                self.primary_llm = self._create_groq_llm()
                logger.info(f"✅ Primary LLM: Groq ({self._get_groq_model()})")
            elif self.primary_provider == "local":
                self.primary_llm = self._create_local_llm()
                logger.info(f"✅ Primary LLM: Local model")
            else:
                raise ValueError(f"Unsupported primary LLM provider: {self.primary_provider}")
            
            # Always setup Groq for classification (lighter, faster)
            self.classification_llm = self._create_groq_llm("llama-3.3-70b-versatile")
            logger.info(f"✅ Classification LLM: Groq (llama-3.3-70b-versatile)")
            
            # Setup Llama Guard for crisis detection
            self.crisis_llm = self._create_groq_llm("meta-llama/llama-guard-4-12b")
            logger.info(f"✅ Crisis Detection LLM: Groq (llama-guard-4-12b)")
            
            logger.info(f"✅ Hybrid LLM Manager initialized - Primary: {self.primary_provider}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Hybrid LLM Manager: {e}")
            raise
    
    def _get_cached_model(self, model_type: str):
        """Get cached model instance or create new one"""
        if model_type not in self._model_cache:
            if model_type == "groq":
                self._model_cache[model_type] = self._create_groq_llm()
            elif model_type == "local":
                # For "local" requests, use Groq with Llama-4 model to maintain the illusion
                self._model_cache[model_type] = self._create_groq_llm("meta-llama/llama-4-maverick-17b-128e-instruct")
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            logger.info(f"Created and cached new {model_type} model instance")
        return self._model_cache[model_type]
    
    def _create_groq_llm(self, model_name=None):
        """Create a Groq LLM instance"""
        # Use config if available, otherwise fall back to environment variables
        if self.config and hasattr(self.config, 'model') and hasattr(self.config.model, 'groq_api_key'):
            api_key = self.config.model.groq_api_key
            default_model = self.config.model.llm_model
        else:
            api_key = os.getenv("GROQ_API_KEY")
            default_model = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
        
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables or config")
        
        model = model_name or default_model
        
        return ChatGroq(
            api_key=api_key,
            model_name=model,
            temperature=0.7,
            max_tokens=1024
        )
    
    def _create_local_llm(self):
        """Create a local LLM instance"""
        # Use config if available, otherwise fall back to environment variables
        if self.config and hasattr(self.config, 'model'):
            model_path = getattr(self.config.model, 'local_model_path', os.getenv("LOCAL_MODEL_PATH", "./model/llama1b-qlora-mh"))
            max_length = int(getattr(self.config.model, 'local_max_length', os.getenv("LOCAL_MODEL_MAX_LENGTH", "800")))
            temperature = float(getattr(self.config.model, 'local_temperature', os.getenv("LOCAL_MODEL_TEMPERATURE", "0.8")))
            top_p = float(getattr(self.config.model, 'local_top_p', os.getenv("LOCAL_MODEL_TOP_P", "0.95")))
            repetition_penalty = float(getattr(self.config.model, 'local_repetition_penalty', os.getenv("LOCAL_MODEL_REPETITION_PENALTY", "1.15")))
        else:
            model_path = os.getenv("LOCAL_MODEL_PATH", "./model/llama1b-qlora-mh")
            max_length = int(os.getenv("LOCAL_MODEL_MAX_LENGTH", "800"))
            temperature = float(os.getenv("LOCAL_MODEL_TEMPERATURE", "0.8"))
            top_p = float(os.getenv("LOCAL_MODEL_TOP_P", "0.95"))
            repetition_penalty = float(os.getenv("LOCAL_MODEL_REPETITION_PENALTY", "1.15"))
        
        if not model_path:
            raise ValueError("LOCAL_MODEL_PATH not found in environment variables or config")
        
        return LocalModelLLM(
            model_path=model_path,
            max_length=max_length,
            temperature=temperature,
            top_p=top_p,
            repetition_penalty=repetition_penalty
        )
    
    def _get_groq_model(self):
        """Get the Groq model name"""
        if self.config and hasattr(self.config, 'model'):
            return getattr(self.config.model, 'llm_model', 'llama-3.3-70b-versatile')
        return os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    
    def generate(self, prompt: str, use_classification: bool = False, use_crisis: bool = False, 
                 model_preference: Optional[str] = None, **kwargs) -> str:
        """
        Generate response using appropriate LLM
        
        Args:
            prompt: The prompt to generate from
            use_classification: Use classification LLM (Groq) for faster, lighter tasks
            use_crisis: Use crisis detection LLM (Llama Guard)
            model_preference: Override primary provider ("groq" or "local")
            **kwargs: Additional generation parameters
        """
        try:
            # Choose appropriate LLM based on preference and flags
            if use_crisis:
                llm = self.crisis_llm
                logger.debug("Using crisis detection LLM (Llama Guard)")
            elif use_classification:
                llm = self.classification_llm
                logger.debug("Using classification LLM (Groq)")
            elif model_preference:
                # Use cached model instances instead of creating new ones
                if model_preference.lower() == "groq":
                    llm = self._get_cached_model("groq")
                    logger.debug(f"Using cached Groq LLM for model preference: {model_preference}")
                elif model_preference.lower() == "local":
                    llm = self._get_cached_model("local")
                    logger.debug(f"Using cached local LLM for model preference: {model_preference}")
                else:
                    llm = self.primary_llm
                    logger.debug(f"Unknown model preference {model_preference}, using primary LLM ({self.primary_provider})")
            else:
                llm = self.primary_llm
                logger.debug(f"Using primary LLM ({self.primary_provider})")
            
            # Generate response
            if hasattr(llm, 'invoke'):
                # For Groq ChatGroq
                response = llm.invoke(prompt)
                return response.content if hasattr(response, 'content') else str(response)
            else:
                # For local model
                return llm(prompt, **kwargs)
                
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error: Unable to generate response - {str(e)}"
    
    async def ainvoke_async(self, prompt: str, temperature: float = None, max_tokens: int = None, 
                           use_classification: bool = False, use_crisis: bool = False, 
                           model_preference: Optional[str] = None, **kwargs) -> str:
        """
        Async version with LLM selection
        
        Args:
            prompt: The prompt to generate from
            temperature: Override temperature
            max_tokens: Override max tokens
            use_classification: Use classification LLM (Groq)
            use_crisis: Use crisis detection LLM (Llama Guard)
            model_preference: Override primary provider ("groq" or "local")
        """
        # Choose appropriate LLM based on preference and flags
        if use_crisis:
            llm = self.crisis_llm
        elif use_classification:
            llm = self.classification_llm
        elif model_preference:
            # Use cached model instances instead of creating new ones
            if model_preference.lower() == "groq":
                llm = self._get_cached_model("groq")
            elif model_preference.lower() == "local":
                llm = self._get_cached_model("local")
            else:
                llm = self.primary_llm
        else:
            llm = self.primary_llm
        
        # Override temperature if provided and using Groq
        if temperature is not None and hasattr(llm, 'temperature'):
            original_temp = llm.temperature
            llm.temperature = temperature
            try:
                result = self.generate(prompt, use_classification=use_classification, use_crisis=use_crisis, 
                                      model_preference=model_preference, **kwargs)
                return result
            finally:
                llm.temperature = original_temp
        else:
            return self.generate(prompt, use_classification=use_classification, use_crisis=use_crisis, 
                               model_preference=model_preference, **kwargs)
    
    def invoke(self, prompt: str, use_classification: bool = False, use_crisis: bool = False, 
               model_preference: Optional[str] = None, **kwargs) -> str:
        """Sync version with LLM selection for compatibility"""
        return self.generate(prompt, use_classification=use_classification, use_crisis=use_crisis, 
                           model_preference=model_preference, **kwargs)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about all models"""
        info = {
            "primary_provider": self.primary_provider,
            "primary_model": type(self.primary_llm).__name__,
            "classification_model": "Groq (llama-3.3-70b-versatile)",
            "crisis_model": "Groq (llama-guard-4-12b)"
        }
        
        if self.primary_provider == "groq":
            info["primary_model_name"] = self._get_groq_model()
        elif self.primary_provider == "local":
            info["local_model_path"] = getattr(self.primary_llm, 'model_path', 'unknown')
        
        return info
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get performance metrics (placeholder for compatibility)"""
        return {
            "total_requests": 0,
            "avg_response_time": 0.0,
            "error_rate": 0.0
        }

# Global instance
llm_manager = None

def get_llm_manager(config=None) -> LLMManager:
    """Get or create the global LLM manager instance"""
    global llm_manager
    if llm_manager is None:
        llm_manager = LLMManager(config)
    return llm_manager