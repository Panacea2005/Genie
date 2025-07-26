# core/embeddings.py
"""
Embedding model management
Handles text embeddings for vector search
"""

import numpy as np
from typing import List, Union, Any
import torch
import logging
import warnings
import multiprocessing

# Suppress TensorFlow warnings
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

# Try to import sentence transformers with error handling
try:
    from sentence_transformers import SentenceTransformer, CrossEncoder
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError as e:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None
    CrossEncoder = None
    logging.warning(f"Could not import sentence_transformers: {e}")

logger = logging.getLogger(__name__)

class EmbeddingManager:
    """Manages embedding models and operations"""
    
    def __init__(self, config: Any):
        self.config = config
        self.embedding_model = None
        self.cross_encoder = None
        self.device = 'cuda' if torch.cuda.is_available() and config.system.use_gpu_if_available else 'cpu'
        self.pool = None  # Multi-process pool for CPU encoding
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize embedding and reranking models"""
        try:
            # Check for GPU availability
            if torch.cuda.is_available() and self.config.system.use_gpu_if_available:
                self.device = 'cuda'
                # Clear GPU cache
                torch.cuda.empty_cache()
                logger.info(f"🚀 GPU detected: {torch.cuda.get_device_name(0)}")
                logger.info(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
            else:
                self.device = 'cpu'
                logger.info("Using CPU for encoding")
            
            # Initialize embedding model
            logger.info(f"Loading embedding model: {self.config.model.embedding_model}")
            self.embedding_model = SentenceTransformer(
                self.config.model.embedding_model,
                device=self.device
            )
            
            # Optimize model settings
            if hasattr(self.embedding_model, 'max_seq_length'):
                # Limit sequence length for faster processing
                self.embedding_model.max_seq_length = min(512, self.embedding_model.max_seq_length)
            
            # For GPU: optimize for larger batches
            if self.device == 'cuda':
                # Keep FP32 for stability (FP16 can cause issues)
                logger.info("Using FP32 precision on GPU for stability")
            
            # Initialize cross-encoder for reranking
            logger.info(f"Loading reranker model: {self.config.model.reranker_model}")
            self.cross_encoder = CrossEncoder(
                self.config.model.reranker_model,
                device=self.device,
                max_length=512
            )
            
            logger.info(f"✅ Models loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding models: {e}")
            raise
    
    def encode(self, texts: Union[str, List[str]], 
               batch_size: int = None,
               show_progress_bar: bool = False) -> np.ndarray:
        """Encode texts to embeddings with optimized batching"""
        if isinstance(texts, str):
            texts = [texts]
        
        # Use config batch size if not specified
        if batch_size is None:
            batch_size = self.config.system.embedding_batch_size
        
        try:
            # For large batches on CPU, try to use all cores efficiently
            if self.device == 'cpu' and len(texts) > batch_size:
                # Set PyTorch threads for better CPU utilization
                import torch
                torch.set_num_threads(self.config.system.max_workers)
                logger.info(f"Set PyTorch to use {self.config.system.max_workers} threads")
            
            # Standard encoding with optimizations
            if self.device == 'cuda':
                embeddings = self.embedding_model.encode(
                    texts,
                    batch_size=batch_size,
                    show_progress_bar=show_progress_bar,
                    convert_to_tensor=True,  # <-- Keep as GPU tensor
                    normalize_embeddings=True,
                    device=self.device
                )
                # Only convert to CPU numpy at the end
                embeddings = embeddings.cpu().numpy()
            else:
                embeddings = self.embedding_model.encode(
                    texts,
                    batch_size=batch_size,
                    show_progress_bar=show_progress_bar,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    device=self.device,
                    num_workers=self.config.system.max_workers
                )
            
            return embeddings.astype('float32')
            
        except Exception as e:
            logger.error(f"Error encoding texts: {e}")
            # Fallback to smaller batch size if memory error
            if "out of memory" in str(e).lower() and batch_size > 1:
                logger.warning(f"Reducing batch size from {batch_size} to {batch_size // 2}")
                return self.encode(texts, batch_size=batch_size // 2, show_progress_bar=show_progress_bar)
            raise
    
    async def aencode(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Async encode texts (runs in thread pool)"""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.encode, texts)
    
    def rerank(self, query: str, documents: List[str], top_k: int = None) -> List[tuple]:
        """Rerank documents using cross-encoder"""
        if not documents:
            return []
        
        # Create query-document pairs
        pairs = [[query, doc] for doc in documents]
        
        # Get scores from cross-encoder
        scores = self.cross_encoder.predict(pairs)
        
        # Sort by score (descending)
        results = list(zip(documents, scores))
        results.sort(key=lambda x: x[1], reverse=True)
        
        if top_k:
            results = results[:top_k]
        
        return results
    
    def compute_similarity(self, embeddings1: np.ndarray, embeddings2: np.ndarray) -> np.ndarray:
        """Compute cosine similarity between embeddings"""
        # Ensure 2D arrays
        if embeddings1.ndim == 1:
            embeddings1 = embeddings1.reshape(1, -1)
        if embeddings2.ndim == 1:
            embeddings2 = embeddings2.reshape(1, -1)
        
        # Compute cosine similarity
        similarity = np.dot(embeddings1, embeddings2.T)
        return similarity
    
    def get_embedding_dimension(self) -> int:
        """Get embedding dimension"""
        return self.embedding_model.get_sentence_embedding_dimension()
    
    def __del__(self):
        """Cleanup resources"""
        # Stop multi-process pool if it exists
        if hasattr(self, 'pool') and self.pool is not None:
            try:
                self.embedding_model.stop_multi_process_pool(self.pool)
                logger.info("Stopped multi-process pool")
            except:
                pass