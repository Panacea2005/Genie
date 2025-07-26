# retrieval/hybrid.py
"""
Hybrid retriever combining all retrieval methods
"""

from typing import List, Dict, Any, Optional
import asyncio
from .vector_store import VectorStore
from .bm25_search import BM25Search
from .graph_store import GraphStore
from .web_search import WebSearch
import logging

logger = logging.getLogger(__name__)

class HybridRetriever:
    """Combines multiple retrieval strategies"""
    
    def __init__(self, 
                 vector_store: Optional[VectorStore] = None,
                 bm25_search: Optional[BM25Search] = None,
                 graph_store: Optional[GraphStore] = None,
                 web_search: Optional[WebSearch] = None):
        self.vector_store = vector_store
        self.bm25_search = bm25_search
        self.graph_store = graph_store
        self.web_search = web_search
    
    async def retrieve(self, 
                      query: str,
                      methods: List[str] = None,
                      top_k: int = 10,
                      weights: Dict[str, float] = None) -> List[Dict]:
        """
        Retrieve using multiple methods
        
        Args:
            query: Search query
            methods: List of methods to use (vector, bm25, graph, web)
            top_k: Number of results per method
            weights: Weight for each method
        """
        if methods is None:
            methods = ["vector", "bm25"]  # Default methods
        
        if weights is None:
            weights = {
                "vector": 0.5,
                "bm25": 0.3,
                "graph": 0.1,
                "web": 0.1
            }
        
        # Collect results from each method
        tasks = []
        
        if "vector" in methods and self.vector_store:
            tasks.append(("vector", self.vector_store.search(query, top_k)))
        
        if "bm25" in methods and self.bm25_search:
            tasks.append(("bm25", self.bm25_search.search(query, top_k)))
        
        if "graph" in methods and self.graph_store:
            # Extract entities from query (simple approach)
            entities = [word for word in query.split() if len(word) > 3]
            for entity in entities[:2]:  # Limit to 2 entities
                tasks.append(("graph", self.graph_store.search_entity(entity, limit=top_k)))
        
        if "web" in methods and self.web_search:
            tasks.append(("web", self.web_search.search(query, max_results=top_k)))
        
        # Execute all searches in parallel
        results_by_method = {}
        for method, task in tasks:
            try:
                results = await task
                results_by_method[method] = results
            except Exception as e:
                logger.error(f"Error in {method} retrieval: {e}")
                results_by_method[method] = []
        
        # Combine and rerank results
        combined_results = self._combine_results(results_by_method, weights)
        
        return combined_results[:top_k]
    
    def _combine_results(self, results_by_method: Dict[str, List[Dict]], 
                        weights: Dict[str, float]) -> List[Dict]:
        """Combine results from different methods with weighted scoring"""
        scored_results = {}
        
        for method, results in results_by_method.items():
            weight = weights.get(method, 0.1)
            
            for i, result in enumerate(results):
                text = result.get("text", "")
                
                # Create unique key for deduplication
                key = text[:100].lower()  # First 100 chars
                
                if key not in scored_results:
                    scored_results[key] = {
                        "text": text,
                        "combined_score": 0.0,
                        "method_scores": {},
                        "metadata": result.get("metadata", {}),
                        "sources": []
                    }
                
                # Add weighted score
                # Use reciprocal rank scoring
                score = 1.0 / (i + 1) * weight
                scored_results[key]["combined_score"] += score
                scored_results[key]["method_scores"][method] = result.get("score", score)
                scored_results[key]["sources"].append(method)
        
        # Sort by combined score
        final_results = list(scored_results.values())
        final_results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return final_results