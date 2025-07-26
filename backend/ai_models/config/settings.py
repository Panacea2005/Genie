# config/settings.py
"""
Central configuration management for Genie AI
All system-wide settings and configurations
"""

import os
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from dotenv import load_dotenv
from pathlib import Path

# Setup logger
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

@dataclass
class ModelConfig:
    """LLM and embedding model configurations"""
    # LLM Configuration - OPTIMIZED FOR RTX 3060
    llm_model: str = "llama-3.3-70b-versatile"  # Groq model
    groq_api_key: str = os.getenv("GROQ_API_KEY")
    
    # Local model settings - OPTIMIZED FOR LONGER RESPONSES
    local_model_path: str = "./model/llama1b-qlora-mh"
    local_max_length: int = 800  # Increased from 512 for longer responses
    local_temperature: float = 0.8  # Increased for more creative responses
    local_top_p: float = 0.95  # Increased for better coherence
    local_repetition_penalty: float = 1.15  # Added to reduce repetition
    
    # Enhanced generation settings for RTX 3060
    use_fp16: bool = True  # Enable for faster inference on GPU
    gpu_memory_fraction: float = 0.85  # Use 85% of 6GB GPU memory
    batch_size: int = 8  # Optimized for 6GB GPU
    
    # Embedding Configuration
    embedding_model: str = "BAAI/bge-large-en-v1.5"
    reranker_model: str = "BAAI/bge-reranker-large"
    chunk_size: int = 512
    chunk_overlap: int = 50
    max_tokens: int = 600  # Increased from 400 for longer responses
    
    # Temperature settings for different response types
    temperature_by_type: Dict[str, float] = field(default_factory=lambda: {
        "emotional_support": 0.7,  # More creative/empathetic
        "factual_explanation": 0.3,  # More focused/accurate
        "practical_guidance": 0.5,   # Balanced
        "conversational": 0.6        # Natural flow
    })
    
    # Embedding settings
    embedding_dim: int = 1024
    
    # API keys
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

@dataclass
class RetrievalConfig:
    """Retrieval and RAG configurations"""
    # Retrieval counts
    vector_top_k: int = 30
    bm25_top_k: int = 20
    graph_top_k: int = 10
    web_top_k: int = 10
    final_top_k: int = 10
    max_results: int = 20  # Maximum results to return
    
    # Chunking settings
    chunk_size: int = 512
    chunk_overlap: int = 128
    
    # Relevance thresholds
    min_relevance_score: float = 0.5
    rerank_threshold: float = 0.7
    high_confidence_threshold: float = 0.8
    
    # Strategy thresholds
    use_multi_method_threshold: float = 0.7  # When to use multiple retrieval methods

@dataclass
class AgentConfig:
    """Agent behavior configurations"""
    # Processing settings
    max_refinement_iterations: int = 1  # Optimized for speed
    confidence_threshold: float = 0.8
    min_confidence_threshold: float = 0.5
    
    # Feature flags
    enable_web_search: bool = True
    enable_cove: bool = True  # Keep enabled but optimized
    enable_fact_checking: bool = True
    enable_parallel_retrieval: bool = True
    enable_response_caching: bool = True  # Cache responses
    
    # Timeouts (seconds) - INCREASED FOR COMPLEX OPERATIONS
    retrieval_timeout: int = 30  # Increased from 10 for complex queries
    web_search_timeout: int = 10  # Increased from 5 for better reliability  
    total_timeout: int = 60  # Increased from 30 for full processing
    
    # Verification settings
    max_to_verify: int = 5  # Limit verification for speed
    verification_batch_size: int = 3  # Process in small batches

@dataclass
class QualityConfig:
    """Response quality configurations"""
    # Quality thresholds
    min_response_length: int = 100
    max_response_length: int = 200
    target_response_length: int = 150
    
    # Confidence thresholds for responses
    high_confidence_threshold: float = 0.8
    medium_confidence_threshold: float = 0.6
    low_confidence_threshold: float = 0.4
    
    # Enhancement settings
    enable_cove_enhancement: bool = True
    cove_quality_threshold: float = 0.7  # Only enhance if below this quality
    
    # Response characteristics
    require_citations: bool = True
    require_empathy_for_emotional: bool = True
    require_professional_disclaimer: bool = True
    require_actionable_advice: bool = True
    
    # Source quality weights
    source_confidence_weights: Dict[str, float] = field(default_factory=lambda: {
        "vector_search": 0.9,   # Your curated KB
        "bm25_search": 0.85,    # Keyword-matched KB
        "graph_search": 0.8,    # Entity relationships
        "web_search": 0.7       # External sources
    })
    
    # Response type characteristics
    response_characteristics: Dict[str, Dict] = field(default_factory=lambda: {
        "emotional_support": {
            "tone": "warm_empathetic",
            "structure": "flowing",
            "citations": "minimal",
            "personal_pronouns": "frequent",
            "professional_disclaimer": True
        },
        "factual_explanation": {
            "tone": "clear_informative",
            "structure": "logical",
            "citations": "comprehensive",
            "personal_pronouns": "moderate",
            "examples": True
        },
        "practical_guidance": {
            "tone": "encouraging_directive",
            "structure": "step_by_step",
            "citations": "supporting",
            "personal_pronouns": "frequent",
            "actionable_items": True
        },
        "conversational": {
            "tone": "friendly_natural",
            "structure": "flexible",
            "citations": "as_needed",
            "personal_pronouns": "natural",
            "follow_up": True
        }
    })

@dataclass
class DataConfig:
    """Data paths and settings"""
    # Fix base paths to point to correct locations
    ai_models_dir: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ai_models
    backend_dir: str = os.path.dirname(ai_models_dir)  # backend
    data_dir: str = os.path.join(backend_dir, "data")  # backend/data
    
    # Training data paths
    training_dir: str = os.path.join(data_dir, "training")
    processed_dir: str = os.path.join(data_dir, "processed")
    
    # Vector store paths - keep these inside ai_models for easier management
    vector_store_path: str = os.path.join(ai_models_dir, "indexes", "vector_store")
    graph_store_path: str = os.path.join(ai_models_dir, "indexes", "graph_store")
    
    # Cache settings
    enable_cache: bool = True
    cache_ttl: int = 3600  # 1 hour
    cache_dir: str = os.path.join(ai_models_dir, "cache")

@dataclass
class SystemConfig:
    """System-wide configurations"""
    # Logging
    log_level: str = "INFO"
    log_file: str = "genie_ai.log"
    
    # Performance - OPTIMIZED FOR FASTER PROCESSING
    max_workers: int = 12  # Increased from 4 (use more CPU cores)
    batch_size: int = 512  # Increased from 32 (process more at once)
    
    # Additional performance settings
    embedding_batch_size: int = 512  # Batch size for embedding generation
    vector_index_batch_size: int = 1000  # Batch size for adding to FAISS
    save_checkpoint_interval: int = 10000  # Save every N documents
    
    # Memory management - ENHANCED FOR LONG CONVERSATIONS
    max_memory_tokens: int = 8000  # Increased from 2000 for longer memory
    conversation_window: int = 50   # Increased from 10 to keep more messages
    max_conversation_length: int = 100  # Maximum messages to store
    enable_conversation_summarization: bool = True  # Summarize old messages
    summary_frequency: int = 20  # Summarize every N messages
    preserve_critical_context: bool = True  # Keep important info like names
    
    # GPU settings (if available)
    use_gpu_if_available: bool = True
    gpu_memory_fraction: float = 0.8  # Use 80% of GPU memory
    
    # Response optimization
    enable_response_streaming: bool = False  # For future implementation
    enable_parallel_synthesis: bool = True   # Process multiple aspects in parallel

@dataclass
class MetricsConfig:
    """Metrics and monitoring configurations"""
    enable_metrics: bool = True
    metrics_window: int = 100  # Track last N queries
    log_slow_queries: bool = True
    slow_query_threshold: float = 5.0  # seconds
    
    # Quality metrics to track
    track_metrics: List[str] = field(default_factory=lambda: [
        "response_time",
        "confidence_score",
        "retrieval_count",
        "verification_rate",
        "user_satisfaction",  # If feedback available
        "citation_rate",
        "response_length"
    ])

class Config:
    """Main configuration class"""
    def __init__(self):
        self.model = ModelConfig()
        self.retrieval = RetrievalConfig()
        self.agent = AgentConfig()
        self.data = DataConfig()
        self.system = SystemConfig()
        self.quality = QualityConfig()
        self.metrics = MetricsConfig()
        
        # Validate configuration
        self._validate()
        
        # Auto-adjust based on system capabilities
        self._auto_adjust_settings()
        
        # Create necessary directories
        self._create_directories()
    
    def _validate(self):
        """Validate configuration settings"""
        if not self.model.groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Validate response length settings
        if self.quality.min_response_length > self.quality.max_response_length:
            raise ValueError("min_response_length cannot be greater than max_response_length")
    
    def _create_directories(self):
        """Create necessary directories"""
        directories = [
            self.data.vector_store_path,
            self.data.graph_store_path,
            self.data.cache_dir,
            os.path.join(self.data.ai_models_dir, "indexes"),
            os.path.join(self.data.ai_models_dir, "logs")
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def _auto_adjust_settings(self):
        """Auto-adjust settings based on system capabilities"""
        import multiprocessing
        
        # Get CPU count
        cpu_count = multiprocessing.cpu_count()
        
        # Adjust workers based on CPU count (leave 2 cores for system)
        self.system.max_workers = max(1, min(cpu_count - 2, 16))
        
        # Check available memory
        try:
            import psutil
            available_memory_gb = psutil.virtual_memory().available / (1024**3)
            
            # Adjust batch sizes based on available memory
            if available_memory_gb < 8:
                # Low memory: reduce batch sizes
                self.system.batch_size = 128
                self.system.embedding_batch_size = 256
                self.system.vector_index_batch_size = 2000
                self.agent.verification_batch_size = 2
            elif available_memory_gb < 16:
                # Medium memory: moderate batch sizes
                self.system.batch_size = 256
                self.system.embedding_batch_size = 512
                self.system.vector_index_batch_size = 5000
                self.agent.verification_batch_size = 3
            else:
                # High memory: use large batch sizes
                self.system.batch_size = 512
                self.system.embedding_batch_size = 1024
                self.system.vector_index_batch_size = 10000
                self.agent.verification_batch_size = 5
            
            # Check if GPU is available
            try:
                import torch
                if torch.cuda.is_available():
                    gpu_name = torch.cuda.get_device_name(0)
                    gpu_memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                    logger.info(f"GPU detected: {gpu_name} with {gpu_memory_gb:.1f}GB memory")
                    
                    # Adjust embedding batch size for GPU
                    if gpu_memory_gb >= 6:
                        self.system.embedding_batch_size = min(1024, self.system.embedding_batch_size * 2)
            except ImportError:
                pass
            
            print(f"Auto-adjusted settings: {cpu_count} CPUs, {available_memory_gb:.1f}GB available RAM")
            print(f"Workers: {self.system.max_workers}, Batch size: {self.system.batch_size}")
            print(f"Embedding batch size: {self.system.embedding_batch_size}")
            
        except ImportError:
            print("psutil not available, using default settings")
    
    def get_model_config(self) -> Dict:
        """Get model configuration as dict"""
        return {
            "provider": "groq",
            "model": self.model.llm_model,
            "temperature": self.model.local_temperature,
            "max_tokens": self.model.max_tokens,
            "top_p": self.model.local_top_p,
            "temperature_by_type": self.model.temperature_by_type
        }
    
    def get_quality_config(self) -> Dict:
        """Get quality configuration as dict"""
        return {
            "response_lengths": {
                "min": self.quality.min_response_length,
                "max": self.quality.max_response_length,
                "target": self.quality.target_response_length
            },
            "confidence_thresholds": {
                "high": self.quality.high_confidence_threshold,
                "medium": self.quality.medium_confidence_threshold,
                "low": self.quality.low_confidence_threshold
            },
            "requirements": {
                "citations": self.quality.require_citations,
                "empathy": self.quality.require_empathy_for_emotional,
                "disclaimer": self.quality.require_professional_disclaimer,
                "actionable": self.quality.require_actionable_advice
            }
        }
    
    def get_processing_info(self) -> Dict:
        """Get current processing configuration"""
        return {
            "max_workers": self.system.max_workers,
            "batch_size": self.system.batch_size,
            "embedding_batch_size": self.system.embedding_batch_size,
            "vector_index_batch_size": self.system.vector_index_batch_size,
            "save_checkpoint_interval": self.system.save_checkpoint_interval,
            "verification_batch_size": self.agent.verification_batch_size,
            "caching_enabled": self.agent.enable_response_caching,
            "parallel_synthesis": self.system.enable_parallel_synthesis,
            "estimated_docs_per_hour": self.system.batch_size * self.system.max_workers * 60
        }
    
    def get_response_config_for_type(self, response_type: str) -> Dict:
        """Get configuration for a specific response type"""
        return {
            "temperature": self.model.temperature_by_type.get(response_type, self.model.local_temperature),
            "characteristics": self.quality.response_characteristics.get(response_type, {}),
            "max_tokens": self.model.max_tokens
        }

# Global config instance
config = Config()