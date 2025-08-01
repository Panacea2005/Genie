# data_processing/adapter.py
"""
Adapter to use existing data processing scripts from /data/scripts/
"""

import sys
import os
from pathlib import Path
import pandas as pd
import json
from typing import List, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fix the path - go up one level from ai_models to reach data
current_file = Path(__file__).resolve()  # Get absolute path
data_processing_dir = current_file.parent  # data_processing
ai_models_dir = data_processing_dir.parent  # ai_models
backend_dir = ai_models_dir.parent  # backend (parent of ai_models)
data_dir = backend_dir / "data"  # data folder
scripts_dir = data_dir / "scripts"  # scripts folder

# Add scripts directory to Python path
if scripts_dir.exists():
    sys.path.insert(0, str(scripts_dir))
    logger.info(f"Added {scripts_dir} to Python path")
else:
    logger.error(f"Scripts directory not found: {scripts_dir}")

# Try to import data processing functions
clean_text = None
preprocess_text = None
load_mental_health_data = None

try:
    from data_cleaner import clean_text, preprocess_text  # type: ignore
    logger.info("✓ Successfully imported functions from data_cleaner.py")
except ImportError as e:
    logger.warning(f"Could not import from data_cleaner: {e}")

try:
    import importlib
    combine_module = importlib.import_module("data_combiner")
    combine_mental_health_conversations = combine_module.combine_mental_health_conversations
    logger.info("✓ Successfully imported from data_combiner.py")
except ImportError as e:
    logger.warning(f"Could not import from data_combiner: {e}")

# If imports failed, define fallback functions
if clean_text is None:
    def clean_text(text):
        """Simple text cleaning fallback"""
        if not isinstance(text, str):
            return ""
        return text.lower().strip()

if preprocess_text is None:
    def preprocess_text(text):
        """Simple preprocessing fallback"""
        if not isinstance(text, str):
            return ""
        return text.lower().strip()

class DataLoader:
    """Adapter for existing data loading functionality"""
    
    def __init__(self, config: Any):
        self.config = config
        # Use absolute paths based on config
        self.backend_dir = Path(config.data.backend_dir)
        self.data_dir = Path(config.data.data_dir)
        self.training_dir = Path(config.data.training_dir)
        self.processed_dir = Path(config.data.processed_dir)
        
        logger.info(f"DataLoader initialized with:")
        logger.info(f"  Data dir: {self.data_dir}")
        logger.info(f"  Training dir: {self.training_dir}")
        logger.info(f"  Processed dir: {self.processed_dir}")
    
    def load_all_data(self) -> List[Dict[str, Any]]:
        """Load all training data using existing scripts"""
        all_data = []
        
        # First try to use the model.py function
        try:
            model_path = self.backend_dir / "ai_models" / "model"
            if model_path.exists():
                sys.path.insert(0, str(model_path))
                from model import load_mental_health_data
                
                logger.info("Using load_mental_health_data from model.py")
                df = load_mental_health_data()
                
                if not df.empty:
                    for _, row in df.iterrows():
                        all_data.append({
                            "text": str(row.get('text', '')),
                            "source": str(row.get('source', 'unknown')),
                            "type": "mental_health",
                            "metadata": {
                                "relevance": float(row.get('relevance', 1.0)),
                                "category": str(row.get('category', '')),
                                "sentiment": str(row.get('sentiment', ''))
                            }
                        })
                    logger.info(f"Loaded {len(df)} examples from model.py")
                    return all_data
        except Exception as e:
            logger.error(f"Error using model.py: {e}")
        
        # Fallback to loading from training directory
        logger.info("Falling back to loading from training directory")
        return self._load_from_training_dir()
    
    def _load_from_training_dir(self) -> List[Dict]:
        """Fallback method to load from training directory"""
        data = []
        
        # Check what files exist in training directory
        if self.training_dir.exists():
            logger.info(f"Files in training directory: {list(self.training_dir.glob('*'))}")
        
        # Load from training directory files
        training_files = {
            'conversations_training.csv': 'conversation',
            'mental_health_conversations.csv': 'conversation',
            'sentiment_analysis.csv': 'sentiment',
            'dialogues_training.csv': 'dialogue',
            'combined_intents.json': 'intent'
        }
        
        for filename, data_type in training_files.items():
            filepath = self.training_dir / filename
            if filepath.exists():
                logger.info(f"Loading {filename}")
                try:
                    if filename.endswith('.json'):
                        with open(filepath, 'r', encoding='utf-8') as f:
                            json_data = json.load(f)
                            # Process intents
                            for intent in json_data.get('intents', []):
                                for pattern in intent.get('patterns', []):
                                    data.append({
                                        "text": pattern,
                                        "source": filename,
                                        "type": data_type,
                                        "metadata": {"intent": intent.get('tag', '')}
                                    })
                                for response in intent.get('responses', []):
                                    data.append({
                                        "text": response,
                                        "source": filename,
                                        "type": f"{data_type}_response",
                                        "metadata": {"intent": intent.get('tag', '')}
                                    })
                    else:
                        df = pd.read_csv(filepath)
                        logger.info(f"  Loaded {len(df)} rows from {filename}")
                        
                        for _, row in df.iterrows():
                            # Try different column names
                            text = (row.get('text', '') or 
                                   row.get('input', '') or 
                                   row.get('question', '') or
                                   row.get('Text', ''))  # Check capital T
                            
                            if text:
                                data.append({
                                    "text": str(text),
                                    "source": filename,
                                    "type": data_type,
                                    "metadata": dict(row)
                                })
                except Exception as e:
                    logger.error(f"Error loading {filename}: {e}")
        
        logger.info(f"Loaded {len(data)} total examples from training directory")
        return data

class TextPreprocessor:
    """Adapter for existing text preprocessing functionality"""
    
    def __init__(self):
        pass
    
    def preprocess(self, text: str) -> str:
        """Use existing clean_text function"""
        return clean_text(text)
    
    def chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 128) -> List[str]:
        """Simple chunking implementation"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks if chunks else [text]  # Return at least the original text
    
    def extract_metadata(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Extract metadata from document"""
        metadata = document.get("metadata", {})
        text = document.get("text", "")
        
        metadata["char_count"] = len(text)
        metadata["word_count"] = len(text.split())
        
        return metadata

class DataIndexer:
    """Adapter for indexing functionality"""
    
    def __init__(self, config: Any):
        self.config = config
        self.vector_store = None
        self.bm25_search = None
        self.graph_store = None
    
    def build_all_indexes(self, documents: List[Dict[str, Any]]):
        """Build indexes from documents with maximum parallelization"""
        import concurrent.futures
        import threading
        
        logger.info(f"🚀 Building indexes for {len(documents)} documents using ALL CPU cores")
        logger.info(f"📊 Available CPU cores: {self.config.system.max_workers}")
        
        if not documents:
            logger.warning("No documents to index!")
            return

        # Use TextPreprocessor with parallel processing
        preprocessor = TextPreprocessor()
        
        # Parallel preprocessing of documents
        logger.info("⚡ Parallel preprocessing documents...")
        processed_docs = []
        
        def preprocess_batch(doc_batch):
            """Process a batch of documents"""
            batch_processed = []
            for doc in doc_batch:
                if doc.get("text"):
                    doc["processed_text"] = preprocessor.preprocess(doc["text"])
                    doc["metadata"] = preprocessor.extract_metadata(doc)
                    batch_processed.append(doc)
            return batch_processed
        
        # Split documents into batches for parallel processing
        batch_size = max(100, len(documents) // (self.config.system.max_workers * 4))
        doc_batches = [documents[i:i + batch_size] for i in range(0, len(documents), batch_size)]
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.config.system.max_workers) as executor:
            # Submit all batches for parallel preprocessing
            futures = [executor.submit(preprocess_batch, batch) for batch in doc_batches]
            
            # Collect results
            for future in concurrent.futures.as_completed(futures):
                batch_result = future.result()
                processed_docs.extend(batch_result)
                logger.info(f"✅ Preprocessed batch: {len(processed_docs)}/{len(documents)} documents")

        logger.info(f"✅ Preprocessed {len(processed_docs)} documents using parallel processing")
        
        # Build indexes in parallel where possible
        index_futures = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # Vector store (most CPU intensive - gets priority)
            if self.vector_store and processed_docs:
                logger.info("🔧 Starting vector index build (parallel embeddings)...")
                vector_future = executor.submit(self._build_vector_index, processed_docs)
                index_futures.append(("vector", vector_future))
            
            # BM25 search (CPU intensive but different operations)
            if self.bm25_search and processed_docs:
                logger.info("🔧 Starting BM25 index build...")
                bm25_future = executor.submit(self._build_bm25_index, processed_docs)
                index_futures.append(("bm25", bm25_future))
            
            # Knowledge graph (less CPU intensive)
            if self.graph_store and processed_docs:
                logger.info("🔧 Starting knowledge graph build...")
                graph_future = executor.submit(self._build_graph_index, processed_docs)
                index_futures.append(("graph", graph_future))
            
            # Wait for all indexes to complete
            for index_name, future in index_futures:
                try:
                    future.result()
                    logger.info(f"✅ {index_name.upper()} index completed successfully")
                except Exception as e:
                    logger.error(f"❌ {index_name.upper()} index failed: {e}")

        logger.info("🎉 All indexes built successfully with parallel processing!")
    
    def build_specific_indexes(self, documents: List[Dict[str, Any]], missing_indexes: List[str]):
        """Build only specific missing indexes to avoid unnecessary rebuilds"""
        import concurrent.futures
        
        logger.info(f"🎯 Building ONLY missing indexes: {', '.join(missing_indexes)}")
        logger.info(f"📊 Processing {len(documents)} documents")
        
        if not documents:
            logger.warning("No documents to index!")
            return

        # Always need to preprocess documents
        preprocessor = TextPreprocessor()
        
        logger.info("⚡ Preprocessing documents...")
        processed_docs = []
        
        def preprocess_batch(doc_batch):
            batch_processed = []
            for doc in doc_batch:
                if doc.get("text"):
                    doc["processed_text"] = preprocessor.preprocess(doc["text"])
                    doc["metadata"] = preprocessor.extract_metadata(doc)
                    batch_processed.append(doc)
            return batch_processed
        
        # Use efficient parallel preprocessing
        batch_size = max(100, len(documents) // (self.config.system.max_workers * 4))
        doc_batches = [documents[i:i + batch_size] for i in range(0, len(documents), batch_size)]
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.config.system.max_workers) as executor:
            futures = [executor.submit(preprocess_batch, batch) for batch in doc_batches]
            
            for future in concurrent.futures.as_completed(futures):
                batch_result = future.result()
                processed_docs.extend(batch_result)
                if len(processed_docs) % 50000 == 0:
                    logger.info(f"✅ Preprocessing progress: {len(processed_docs):,}/{len(documents):,}")

        logger.info(f"✅ Preprocessed {len(processed_docs)} documents")
        
        # Build only the missing indexes
        index_futures = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(3, len(missing_indexes))) as executor:
            if "vector store" in missing_indexes and self.vector_store:
                logger.info("🔧 Building missing VECTOR index...")
                vector_future = executor.submit(self._build_vector_index, processed_docs)
                index_futures.append(("vector store", vector_future))
            
            if "BM25" in missing_indexes and self.bm25_search:
                logger.info("🔧 Building missing BM25 index...")
                bm25_future = executor.submit(self._build_bm25_index, processed_docs)
                index_futures.append(("BM25", bm25_future))
            
            if "knowledge graph" in missing_indexes and self.graph_store:
                logger.info("🔧 Building missing KNOWLEDGE GRAPH...")
                graph_future = executor.submit(self._build_graph_index, processed_docs)
                index_futures.append(("knowledge graph", graph_future))
            
            # Wait for completion
            for index_name, future in index_futures:
                try:
                    future.result()
                    logger.info(f"✅ {index_name.upper()} index completed successfully")
                except Exception as e:
                    logger.error(f"❌ {index_name.upper()} index failed: {e}")

        logger.info(f"🎉 Missing indexes ({', '.join(missing_indexes)}) built successfully!")
    
    def _build_vector_index(self, processed_docs):
        """Build vector index in separate thread"""
        vector_docs = [
            {
                "text": doc["processed_text"],
                "metadata": doc["metadata"]
            }
            for doc in processed_docs
        ]
        
        # Use optimized batch size for embeddings
        self.vector_store.add_documents(
            vector_docs, 
            batch_size=self.config.system.embedding_batch_size
        )
        
        # Save index
        save_path = Path(self.config.data.vector_store_path) / "mental_health_index"
        self.vector_store.save_index(str(save_path))
        logger.info(f"💾 Saved vector index to {save_path}")
    
    def _build_bm25_index(self, processed_docs):
        """Build BM25 index in separate thread"""
        texts = [doc["processed_text"] for doc in processed_docs]
        
        # Process in optimized batches
        batch_size = self.config.system.batch_size
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            if i == 0:
                # First batch - initialize
                self.bm25_search.add_documents(batch)
            else:
                # Subsequent batches - extend
                self.bm25_search.documents.extend(batch)
                self.bm25_search._build_index(self.bm25_search.documents)
            
            if (i + batch_size) % 25000 == 0:  # More frequent progress updates
                logger.info(f"📈 BM25 progress: {min(i + batch_size, len(texts)):,}/{len(texts):,} documents")
        
        # Save index
        save_path = Path(self.config.data.ai_models_dir) / "indexes" / "bm25_index.pkl"
        save_path.parent.mkdir(parents=True, exist_ok=True)
        self.bm25_search.save(str(save_path))
        logger.info(f"💾 Saved BM25 index to {save_path}")
    
    def _build_graph_index(self, processed_docs):
        """Build knowledge graph in separate thread"""
        import concurrent.futures
        
        def process_doc_batch_for_graph(doc_batch):
            """Process a batch of documents for graph building"""
            batch_triples = []
            for doc in doc_batch:
                text = doc["processed_text"]
                words = text.split()
                
                # Enhanced entity extraction (words longer than 4 chars, filter common words)
                stop_words = {'that', 'with', 'from', 'they', 'were', 'been', 'have', 'this', 'will', 'your', 'what', 'when', 'where', 'would', 'could', 'should'}
                entities = [w for w in words if len(w) > 4 and w.lower() not in stop_words][:5]  # Max 5 entities
                
                # Add relationships between entities
                for j in range(len(entities) - 1):
                    batch_triples.append((
                        entities[j], 
                        "related_to", 
                        entities[j + 1],
                        doc["metadata"]
                    ))
            return batch_triples
        
        # Process graph building in parallel batches
        batch_size = self.config.system.batch_size * 5  # Larger batches for graph
        doc_batches = [processed_docs[i:i + batch_size] for i in range(0, len(processed_docs), batch_size)]
        
        all_triples = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.config.system.max_workers // 2) as executor:
            futures = [executor.submit(process_doc_batch_for_graph, batch) for batch in doc_batches]
            
            for i, future in enumerate(concurrent.futures.as_completed(futures)):
                batch_triples = future.result()
                
                # Add triples to graph store
                for subject, predicate, obj, metadata in batch_triples:
                    self.graph_store.add_triple(subject, predicate, obj, metadata)
                
                all_triples.extend(batch_triples)
                logger.info(f"📈 Graph progress: batch {i+1}/{len(doc_batches)} completed ({len(all_triples)} triples)")
        
        # Save graph
        save_path = Path(self.config.data.graph_store_path) / "knowledge_graph"
        save_path.parent.mkdir(parents=True, exist_ok=True)
        self.graph_store.save(str(save_path))
        logger.info(f"💾 Saved knowledge graph to {save_path} ({len(all_triples)} triples)")