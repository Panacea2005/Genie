# retrieval/vector_store.py
"""
FAISS vector store for similarity search
"""

import numpy as np
import faiss
import pickle
import os
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class VectorStore:
    """FAISS-based vector store for semantic search"""
    
    def __init__(self, embedding_manager: Any, index_path: str = None):
        self.embedding_manager = embedding_manager
        self.dimension = embedding_manager.get_embedding_dimension()
        
        # Set default index path if not provided
        if index_path is None:
            from config.settings import config
            index_path = os.path.join(config.data.vector_store_path, "mental_health_index")
        
        self.index_path = index_path
        self.index = None
        self.documents = []
        self.metadata = []
        
        if os.path.exists(f"{index_path}.faiss"):
            self.load_index(index_path)
        else:
            self._initialize_index()
    
    def _initialize_index(self):
        """Initialize FAISS index"""
        import torch
        
        # Check if GPU is available for FAISS
        if torch.cuda.is_available():
            try:
                import faiss
                # Try to use GPU
                res = faiss.StandardGpuResources()
                
                # Using IndexFlatIP for inner product (cosine similarity with normalized vectors)
                cpu_index = faiss.IndexFlatIP(self.dimension)
                
                # Convert to GPU index
                self.index = faiss.index_cpu_to_gpu(res, 0, cpu_index)
                
                # Add IndexIDMap to track document IDs
                self.index = faiss.IndexIDMap(self.index)
                
                logger.info("✅ Using GPU-accelerated FAISS index")
            except Exception as e:
                logger.warning(f"Failed to create GPU index: {e}. Falling back to CPU.")
                self._initialize_cpu_index()
        else:
            self._initialize_cpu_index()
    
    def _initialize_cpu_index(self):
        """Initialize CPU FAISS index"""
        # Using IndexFlatIP for inner product (cosine similarity with normalized vectors)
        self.index = faiss.IndexFlatIP(self.dimension)
        
        # Add IndexIDMap to track document IDs
        self.index = faiss.IndexIDMap(self.index)
        logger.info("Using CPU FAISS index")
    
    def add_documents(self, documents: List[Dict[str, Any]], batch_size: int = None):
        """Add documents to the vector store with optimized batching and detailed progress monitoring"""
        from config.settings import config
        import time
        import psutil
        import os
        
        # Use config batch size if not specified
        if batch_size is None:
            batch_size = config.system.embedding_batch_size
        
        # Initialize monitoring
        process = psutil.Process(os.getpid())
        initial_cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
        initial_memory = process.memory_info().rss / 1024 / 1024 / 1024  # GB
        
        logger.info("="*80)
        logger.info(f"VECTOR STORE INDEXING - STARTING")
        logger.info("="*80)
        logger.info(f"Total documents to process: {len(documents):,}")
        logger.info(f"Batch size: {batch_size}")
        logger.info(f"CPU cores available: {psutil.cpu_count()} (using {config.system.max_workers} workers)")
        logger.info(f"Initial RAM usage: {initial_memory:.2f} GB / {psutil.virtual_memory().total / 1024 / 1024 / 1024:.2f} GB")
        logger.info(f"Embedding model: {self.embedding_manager.embedding_model.device}")
        logger.info("="*80)
        
        start_time = time.time()
        
        # Process in chunks to avoid memory issues
        chunk_size = config.system.vector_index_batch_size  # How many to add to FAISS at once
        
        all_embeddings = []
        all_ids = []
        
        # Track performance metrics
        batch_times = []
        docs_processed = 0
        
        for i in range(0, len(documents), batch_size):
            batch_start_time = time.time()
            batch = documents[i:i + batch_size]
            texts = [doc.get("text", "") for doc in batch]
            current_batch_size = len(texts)
            
            # Log batch start
            logger.info(f"\n--- Batch {i//batch_size + 1}/{(len(documents) + batch_size - 1)//batch_size} ---")
            logger.info(f"Processing documents {i+1} to {min(i+current_batch_size, len(documents))}")
            
            # Monitor CPU usage before encoding
            cpu_before = psutil.cpu_percent(interval=0.1, percpu=True)
            active_cores = sum(1 for cpu in cpu_before if cpu > 50)
            logger.info(f"Active CPU cores: {active_cores}/{len(cpu_before)} | CPU usage: {[f'{cpu:.1f}%' for cpu in cpu_before[:8]]}...")
            
            # Generate embeddings
            logger.info("Generating embeddings...")
            embed_start = time.time()
            embeddings = self.embedding_manager.encode(texts, 
                                                     show_progress_bar=True,
                                                     batch_size=batch_size)
            embed_time = time.time() - embed_start
            
            # Monitor CPU usage after encoding
            cpu_after = psutil.cpu_percent(interval=0.1, percpu=True)
            avg_cpu = sum(cpu_after) / len(cpu_after)
            logger.info(f"Embedding generation took {embed_time:.2f}s ({current_batch_size/embed_time:.1f} docs/sec)")
            logger.info(f"Average CPU usage during encoding: {avg_cpu:.1f}%")
            
            # Normalize embeddings for cosine similarity
            embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
            
            # Generate IDs
            start_id = len(self.documents)
            ids = np.arange(start_id, start_id + len(batch))
            
            # Store documents and metadata immediately
            self.documents.extend(texts)
            self.metadata.extend([doc.get("metadata", {}) for doc in batch])
            
            # Collect embeddings and ids
            all_embeddings.append(embeddings)
            all_ids.append(ids)
            
            # Add to FAISS index in chunks
            if len(all_embeddings) * batch_size >= chunk_size or i + batch_size >= len(documents):
                # Combine and add to index
                combined_embeddings = np.vstack(all_embeddings)
                combined_ids = np.hstack(all_ids)
                logger.info(f"Adding {len(combined_ids)} embeddings to FAISS index...")
                faiss_start = time.time()
                self.index.add_with_ids(combined_embeddings, combined_ids)
                faiss_time = time.time() - faiss_start
                logger.info(f"FAISS indexing took {faiss_time:.2f}s")
                
                # Clear for next chunk
                all_embeddings = []
                all_ids = []
            
            # Update metrics
            batch_time = time.time() - batch_start_time
            batch_times.append(batch_time)
            docs_processed += current_batch_size
            
            # Memory monitoring
            current_memory = process.memory_info().rss / 1024 / 1024 / 1024  # GB
            memory_increase = current_memory - initial_memory
            
            # Calculate detailed statistics
            elapsed_time = time.time() - start_time
            overall_rate = docs_processed / elapsed_time
            recent_rate = current_batch_size / batch_time if batch_time > 0 else 0
            
            # Estimate remaining time
            docs_remaining = len(documents) - docs_processed
            if len(batch_times) >= 3:
                # Use recent average for better estimate
                recent_avg_time = sum(batch_times[-3:]) / len(batch_times[-3:])
                recent_avg_rate = batch_size / recent_avg_time
                eta_seconds = docs_remaining / recent_avg_rate
            else:
                eta_seconds = docs_remaining / overall_rate if overall_rate > 0 else 0
            
            eta_minutes = eta_seconds / 60
            eta_hours = eta_minutes / 60
            
            # Progress percentage
            progress_percent = (docs_processed / len(documents)) * 100
            
            # Create progress bar
            bar_length = 40
            filled_length = int(bar_length * docs_processed // len(documents))
            bar = '█' * filled_length + '░' * (bar_length - filled_length)
            
            # Log comprehensive progress
            logger.info(f"\n{'='*80}")
            logger.info(f"PROGRESS: [{bar}] {progress_percent:.1f}%")
            logger.info(f"Documents: {docs_processed:,} / {len(documents):,} processed")
            logger.info(f"Speed: {recent_rate:.1f} docs/sec (current) | {overall_rate:.1f} docs/sec (average)")
            logger.info(f"Time: {elapsed_time/60:.1f} min elapsed | {eta_minutes:.1f} min remaining")
            if eta_hours > 1:
                logger.info(f"ETA: ~{eta_hours:.1f} hours ({time.strftime('%H:%M', time.localtime(time.time() + eta_seconds))})")
            logger.info(f"Memory: {current_memory:.2f} GB used (+{memory_increase:.2f} GB)")
            logger.info(f"Batch processing time: {batch_time:.2f}s (embed: {embed_time:.2f}s)")
            logger.info(f"{'='*80}")
            
            # Save checkpoint every N documents
            if (i + batch_size) % config.system.save_checkpoint_interval == 0:
                if self.index_path:  # Only save checkpoint if we have a path
                    logger.info("\n🔧 SAVING CHECKPOINT...")
                    checkpoint_path = f"{self.index_path}_checkpoint_{docs_processed}"
                    checkpoint_start = time.time()
                    self.save_index(checkpoint_path)
                    checkpoint_time = time.time() - checkpoint_start
                    checkpoint_size_mb = os.path.getsize(f"{checkpoint_path}.faiss") / 1024 / 1024
                    logger.info(f"✅ Checkpoint saved: {checkpoint_path} ({checkpoint_size_mb:.1f} MB in {checkpoint_time:.1f}s)")
        
        # Final statistics
        total_time = time.time() - start_time
        final_memory = process.memory_info().rss / 1024 / 1024 / 1024
        
        logger.info("\n" + "="*80)
        logger.info("VECTOR STORE INDEXING - COMPLETED")
        logger.info("="*80)
        logger.info(f"✅ Successfully indexed {len(self.documents):,} documents")
        logger.info(f"⏱️  Total time: {total_time/60:.1f} minutes ({total_time/3600:.2f} hours)")
        logger.info(f"📊 Average speed: {len(documents)/total_time:.1f} docs/sec")
        logger.info(f"💾 Memory used: {final_memory:.2f} GB (increased by {final_memory - initial_memory:.2f} GB)")
        logger.info(f"🔢 Index size: {self.index.ntotal:,} vectors")
        logger.info("="*80)
    
    def search(self, query: str, top_k: int = 10, filters: Dict = None) -> List[Dict]:
        """Synchronous search for similar documents"""
        # Check if we have any documents
        if not self.documents:
            logger.warning("Vector store has no documents loaded")
            return []
            
        if self.index is None:
            logger.warning("Vector store index is None")
            return []
            
        if self.index.ntotal == 0:
            logger.warning("Vector store index has 0 vectors")
            return []
        
        try:
            # Log the search request
            logger.debug(f"Searching for: '{query[:50]}...' with top_k={top_k}")
            
            # Get query embedding (synchronous)
            query_embedding = self.embedding_manager.encode(query)
            
            # Ensure it's 2D
            if query_embedding.ndim == 1:
                query_embedding = query_embedding.reshape(1, -1)
            
            # Normalize query embedding (IMPORTANT for cosine similarity)
            query_norm = np.linalg.norm(query_embedding, axis=1, keepdims=True)
            if query_norm[0] > 0:
                query_embedding = query_embedding / query_norm
            else:
                logger.error("Query embedding has zero norm!")
                return []
            
            # Ensure float32 type
            query_embedding = query_embedding.astype('float32')
            
            # Log embedding stats
            logger.debug(f"Query embedding shape: {query_embedding.shape}, norm: {np.linalg.norm(query_embedding):.4f}")
            
            # Search
            k = min(top_k, self.index.ntotal)  # Don't search for more than we have
            logger.debug(f"Searching for {k} nearest neighbors in index with {self.index.ntotal} vectors")
            
            scores, indices = self.index.search(query_embedding, k)
            
            # Log raw search results
            logger.debug(f"Raw search results - scores shape: {scores.shape}, indices shape: {indices.shape}")
            logger.debug(f"First 5 scores: {scores[0][:5] if len(scores[0]) > 0 else 'empty'}")
            logger.debug(f"First 5 indices: {indices[0][:5] if len(indices[0]) > 0 else 'empty'}")
            
            results = []
            valid_results = 0
            invalid_indices = []
            
            for i, (idx, score) in enumerate(zip(indices[0], scores[0])):
                # Convert to Python int to ensure proper type
                idx = int(idx)
                score = float(score)
                
                # Check for invalid index (-1 means not found in FAISS)
                if idx == -1:
                    logger.debug(f"Skipping invalid index: {idx} at position {i}")
                    invalid_indices.append((i, idx))
                    continue
                
                # Check if index is within bounds
                if idx < 0 or idx >= len(self.documents):
                    logger.warning(f"Index {idx} out of bounds (documents: {len(self.documents)}) at position {i}")
                    invalid_indices.append((i, idx))
                    continue
                
                # Get the document
                try:
                    doc_text = self.documents[idx]
                    
                    # Check if document exists and is valid
                    if doc_text is None:
                        logger.warning(f"Document at index {idx} is None")
                        continue
                    
                    if not isinstance(doc_text, str):
                        logger.warning(f"Document at index {idx} is not a string: {type(doc_text)}")
                        continue
                    
                    if len(doc_text) == 0:
                        logger.warning(f"Document at index {idx} is empty")
                        continue
                    
                    # Get metadata
                    doc_metadata = {}
                    if idx < len(self.metadata):
                        doc_metadata = self.metadata[idx]
                        if doc_metadata is None:
                            doc_metadata = {}
                    else:
                        logger.debug(f"No metadata for index {idx}")
                    
                    # Create result
                    result = {
                        "text": doc_text,
                        "score": score,
                        "metadata": doc_metadata,
                        "index": idx
                    }
                    
                    # Apply filters if provided
                    if filters:
                        # Log filter application
                        logger.debug(f"Applying filters: {filters}")
                        match = True
                        for key, value in filters.items():
                            if key not in doc_metadata:
                                logger.debug(f"Filter key '{key}' not in metadata for doc {idx}")
                                match = False
                                break
                            if doc_metadata.get(key) != value:
                                logger.debug(f"Filter mismatch: {key}={doc_metadata.get(key)} != {value}")
                                match = False
                                break
                        
                        if not match:
                            logger.debug(f"Document {idx} filtered out")
                            continue
                    
                    results.append(result)
                    valid_results += 1
                    
                except Exception as e:
                    logger.error(f"Error retrieving document at index {idx}: {e}", exc_info=True)
                    continue
            
            # Final logging
            logger.info(f"Vector search found {len(results)} valid results (out of {k} searched) for query: {query[:50]}...")
            
            # If no results, log more debugging info
            if len(results) == 0:
                logger.warning(f"No valid results found. Index stats: ntotal={self.index.ntotal}, docs={len(self.documents)}, metadata={len(self.metadata)}")
                if len(indices[0]) > 0:
                    logger.warning(f"All indices were: {indices[0].tolist()}")
                    logger.warning(f"All scores were: {scores[0].tolist()}")
                if invalid_indices:
                    logger.warning(f"Invalid indices: {invalid_indices}")
                if filters:
                    logger.warning(f"Filters applied: {filters}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error during vector search: {e}", exc_info=True)
            return []
    
    async def asearch(self, query: str, top_k: int = 10, filters: Dict = None) -> List[Dict]:
        """Async wrapper for search"""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.search, query, top_k, filters)
    
    def save_index(self, path: str = None):
        """Save index to disk"""
        save_path = path or self.index_path
        if not save_path:
            raise ValueError("No save path specified")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, f"{save_path}.faiss")
        
        # Save documents and metadata
        with open(f"{save_path}.pkl", "wb") as f:
            pickle.dump({
                "documents": self.documents,
                "metadata": self.metadata
            }, f)
        
        logger.info(f"Saved vector store to {save_path}")
    
    def load_index(self, path: str):
        """Load index from disk"""
        try:
            # Load FAISS index
            logger.info(f"Loading FAISS index from {path}.faiss")
            self.index = faiss.read_index(f"{path}.faiss")
            
            # Load documents and metadata
            logger.info(f"Loading documents and metadata from {path}.pkl")
            with open(f"{path}.pkl", "rb") as f:
                data = pickle.load(f)
                self.documents = data.get("documents", [])
                self.metadata = data.get("metadata", [])
            
            # Validate loaded data
            if not self.documents:
                logger.error("No documents found in loaded index!")
            elif len(self.documents) != self.index.ntotal:
                logger.warning(f"Document count mismatch: {len(self.documents)} documents vs {self.index.ntotal} vectors in index")
            else:
                logger.info(f"✅ Loaded vector store from {path} with {len(self.documents)} documents")
                
        except Exception as e:
            logger.error(f"Error loading index from {path}: {e}", exc_info=True)
            raise