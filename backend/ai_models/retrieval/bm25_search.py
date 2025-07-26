# retrieval/bm25_search.py
"""
BM25 keyword-based search
"""

from rank_bm25 import BM25Okapi
import numpy as np
from typing import List, Dict, Any
import pickle
import logging

logger = logging.getLogger(__name__)

class BM25Search:
    """BM25 keyword search implementation"""
    
    def __init__(self, documents: List[str] = None):
        self.documents = documents or []
        self.bm25 = None
        self.tokenized_docs = []
        
        if documents:
            self._build_index(documents)
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        # Convert to lowercase and split
        return text.lower().split()
    
    def _build_index(self, documents: List[str]):
        """Build BM25 index"""
        logger.info(f"Building BM25 index for {len(documents)} documents")
        
        self.documents = documents
        self.tokenized_docs = [self._tokenize(doc) for doc in documents]
        self.bm25 = BM25Okapi(self.tokenized_docs)
        
        logger.info("BM25 index built successfully")
    
    def add_documents(self, documents: List[str]):
        """Add documents to the index"""
        self.documents.extend(documents)
        self._build_index(self.documents)
    
    async def search(self, query: str, top_k: int = 10) -> List[Dict]:
        """Search using BM25"""
        if not self.bm25:
            return []
        
        # Tokenize query
        tokenized_query = self._tokenize(query)
        
        # Get scores
        scores = self.bm25.get_scores(tokenized_query)
        
        # Get top k indices
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if scores[idx] > 0:  # Only include documents with positive scores
                results.append({
                    "text": self.documents[idx],
                    "score": float(scores[idx]),
                    "metadata": {"index": int(idx)}
                })
        
        return results
    
    def save(self, path: str):
        """Save BM25 index"""
        with open(path, "wb") as f:
            pickle.dump({
                "documents": self.documents,
                "tokenized_docs": self.tokenized_docs
            }, f)
    
    def load(self, path: str):
        """Load BM25 index"""
        with open(path, "rb") as f:
            data = pickle.load(f)
            self.documents = data["documents"]
            self.tokenized_docs = data["tokenized_docs"]
            self.bm25 = BM25Okapi(self.tokenized_docs)