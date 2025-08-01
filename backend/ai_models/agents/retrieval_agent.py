# agents/retrieval_agent.py - PERFORMANCE OPTIMIZED VERSION
"""
Retrieval Agent - OPTIMIZED for fast retrieval with smart strategy selection
FIXED: Eliminated bottlenecks for emotional support queries
"""

from typing import Dict, Any, List, Optional, Set
import asyncio
from agents.base import BaseAgent, AgentResponse
import logging
import numpy as np
from sentence_transformers import CrossEncoder
import time

logger = logging.getLogger(__name__)

class RetrievalAgent(BaseAgent):
    """Optimized retrieval agent with performance-focused strategy selection"""
    
    def __init__(self, llm_manager: Any, embedding_manager: Any, config: Any):
        super().__init__("retrieval_coordinator", llm_manager, config)
        self.embedding_manager = embedding_manager
        
        # Initialize retrieval components (will be set by orchestrator)
        self.vector_store = None
        self.bm25_search = None
        self.graph_store = None
        self.web_search = None
        
        # Initialize reranker if available - OPTIMIZED: Smaller model for speed
        try:
            self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            logger.info("Initialized reranker model")
        except Exception as e:
            logger.warning(f"Could not initialize reranker: {e}")
            self.reranker = None
        
        # Cache for repeated searches
        self.search_cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    def set_vector_store(self, vector_store):
        """Set vector store instance"""
        self.vector_store = vector_store
    
    def set_bm25_search(self, bm25_search):
        """Set BM25 search instance"""
        self.bm25_search = bm25_search
    
    def set_graph_store(self, graph_store):
        """Set graph store instance"""
        self.graph_store = graph_store
    
    def set_web_search(self, web_search):
        """Set web search instance"""
        self.web_search = web_search
    
    async def process(self,
                     query_analysis: Dict[str, Any],
                     original_query: str) -> AgentResponse:
        """
        PERFORMANCE OPTIMIZED: Retrieve relevant documents with fast strategy selection
        """
        try:
            # Check cache first
            cache_key = f"{original_query}:{query_analysis.get('intent', '')}"
            if cache_key in self.search_cache:
                cached_time, cached_results = self.search_cache[cache_key]
                if time.time() - cached_time < self.cache_ttl:
                    logger.info("Returning cached retrieval results")
                    return cached_results
            
            # OPTIMIZED: Fast strategy selection with reduced overhead
            strategy = self._determine_fast_strategy(query_analysis)
            
            # Log strategy decision
            logger.info(f"Query type: {query_analysis.get('query_type', 'unknown')}")
            logger.info(f"Using FAST strategy: {strategy['methods']} with top_k={strategy['top_k']}")
            
            # Execute retrieval with reduced timeout
            results = await asyncio.wait_for(
                self._execute_fast_retrieval(
                    query=original_query,
                    strategy=strategy,
                    query_analysis=query_analysis
                ),
                timeout=15  # REDUCED from 30 to 15 seconds
            )
            
            # OPTIMIZED: Skip reranking for emotional queries to save time
            skip_rerank = strategy.get('skip_rerank', False)
            if self.reranker and len(results) > 8 and not skip_rerank:
                results = await self._fast_rerank(original_query, results[:10])  # Only rerank top 10
            
            # Apply minimal filtering for speed
            final_results = self._apply_fast_filtering(results, strategy)
            
            response = AgentResponse(
                success=True,
                data=final_results,
                metadata={
                    "total_retrieved": len(results),
                    "final_count": len(final_results),
                    "strategies_used": strategy["methods"],
                    "reranking_applied": bool(self.reranker) and len(results) > 8 and not skip_rerank,
                    "performance_optimized": True
                },
                confidence=self._calculate_retrieval_confidence(final_results)
            )
            
            # Cache the results
            self.search_cache[cache_key] = (time.time(), response)
            self._clean_cache()
            
            return response
            
        except asyncio.TimeoutError:
            logger.error(f"Retrieval timeout for query: {original_query[:50]}...")
            # Return minimal fallback results on timeout
            fallback_results = await self._emergency_fallback_search(original_query)
            return AgentResponse(
                success=True,
                data=fallback_results,
                metadata={"error": "timeout", "strategies_used": ["fallback"], "emergency_mode": True},
                confidence=0.4
            )
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            return AgentResponse(
                success=False,
                data=[],
                metadata={"error": str(e)},
                error=str(e)
            )
    
    def _determine_fast_strategy(self, query_analysis: Dict) -> Dict:
        """YOUR IMPROVED STRATEGY: Optimized retrieval methods per query type"""
        query_type = query_analysis.get("query_type", "").lower()
        intent = query_analysis.get("intent", "").lower()
        complexity = query_analysis.get("complexity", "simple").lower()
        
        # STRATEGY 1: Emotional queries - Vector + BM25 + Web (comprehensive support)
        if query_type == "emotional" or intent in ["emotional_support", "conversation"]:
            logger.info("Emotional query - using Vector + BM25 + Web for comprehensive support")
            return {
                "methods": ["vector", "bm25", "web"],
                "weights": {"vector": 0.5, "bm25": 0.3, "web": 0.2},
                "top_k": 15,  # Increased from 8 to allow more sources
                "skip_rerank": False,
                "max_entities": 0,  # No graph for emotional queries
                "query_type": "emotional"
            }
        
        # STRATEGY 2: Factual queries - Web + Graph (relationships and current info)
        elif query_type == "factual" or intent in ["information_seeking", "education"]:
            logger.info("Factual query - using Web + Graph for relationships and current information")
            return {
                "methods": ["web", "graph"],
                "weights": {"web": 0.7, "graph": 0.3},
                "top_k": 15,  # Increased from 8 to allow more sources
                "skip_rerank": False,
                "max_entities": 2,  # Enable graph with 2 entities max
                "hop_distance": 1,  # Single hop for performance
                "query_type": "factual"
            }
        
        # STRATEGY 3: Practical queries - Web only (current actionable guidance)
        elif query_type == "practical" or intent in ["practical_guidance", "help_seeking"]:
            logger.info("Practical query - using Web only for current actionable guidance")
            return {
                "methods": ["web"],
                "weights": {"web": 1.0},
                "top_k": 12,  # Increased from 6 to allow more sources
                "skip_rerank": False,
                "max_entities": 0,  # No graph for practical queries
                "query_type": "practical"
            }
        
        # STRATEGY 4: Simple fallback - Vector only
        elif complexity == "simple":
            logger.info("Simple query - vector search only")
            return {
                "methods": ["vector"],
                "weights": {"vector": 1.0},
                "top_k": 10,  # Increased from 5 to allow more sources
                "skip_rerank": True,
                "max_entities": 0,
                "query_type": "simple"
            }
        
        # STRATEGY 5: Complex fallback - Use all methods with balanced weights
        else:
            logger.info("Complex query - balanced approach with all methods")
            return {
                "methods": ["vector", "web", "graph"],
                "weights": {"vector": 0.4, "web": 0.4, "graph": 0.2},
                "top_k": 20,  # Increased from 10 to allow more sources
                "skip_rerank": False,
                "max_entities": 1,  # Limited graph for complex queries
                "hop_distance": 1,
                "query_type": "complex"
            }
    
    async def _execute_fast_retrieval(self, 
                                    query: str,
                                    strategy: Dict,
                                    query_analysis: Dict) -> List[Dict]:
        """PERFORMANCE OPTIMIZED: Fast retrieval execution with minimal overhead"""
        all_results = []
        
        # Collect all tasks first - SIMPLIFIED for speed
        all_tasks = []
        task_info = []
        
        # OPTIMIZED: Single query only (no sub-queries for speed)
        search_query = query
        
        if "vector" in strategy["methods"] and self.vector_store:
            task = self._vector_search(search_query, strategy["top_k"])
            all_tasks.append(task)
            task_info.append(("vector", search_query))
        
        if "bm25" in strategy["methods"] and self.bm25_search:
            task = self._bm25_search(search_query, strategy["top_k"])
            all_tasks.append(task)
            task_info.append(("bm25", search_query))
        
        # OPTIMIZED: Graph search for factual queries with performance limits
        if "graph" in strategy["methods"] and self.graph_store and strategy.get("max_entities", 0) > 0:
            # Enable graph search for factual queries with performance optimizations
            entities = self._extract_entities_optimized(search_query, query_analysis)[:strategy.get("max_entities", 1)]
            hop_distance = strategy.get("hop_distance", 1)
            
            logger.info(f"Graph search enabled for factual query - entities: {entities}, hop_distance: {hop_distance}")
            
            for entity in entities:
                task = self._graph_search_optimized(entity, top_k=4, hop_distance=hop_distance)
                all_tasks.append(task)
                task_info.append(("graph", f"{search_query} - entity: {entity}"))
        
        if "web" in strategy["methods"] and self.web_search:
            # Reduced timeout for web search
            task = self._web_search_fast(search_query, max_results=strategy["top_k"])
            all_tasks.append(task)
            task_info.append(("web", search_query))
        
        # Execute all searches in parallel with timeout
        if all_tasks:
            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*all_tasks, return_exceptions=True),
                    timeout=10  # 10 second timeout for all searches combined
                )
                
                # Process results quickly
                for i, result in enumerate(results):
                    method, query_used = task_info[i]
                    
                    if isinstance(result, Exception):
                        logger.warning(f"{method} search failed for '{query_used[:30]}...': {result}")
                        continue
                    
                    if isinstance(result, list):
                        for item in result:
                            if isinstance(item, dict):
                                item["source"] = f"{method}_search"
                                item["query_used"] = query_used
                                all_results.append(item)
                                
            except asyncio.TimeoutError:
                logger.warning("Search tasks timed out - returning partial results")
        
        # OPTIMIZED: Fast result combination
        return self._combine_results_fast(all_results, strategy["weights"])
    
    async def _emergency_fallback_search(self, query: str) -> List[Dict]:
        """Emergency fallback when main search times out"""
        try:
            if self.vector_store:
                # Just do a simple vector search
                results = await asyncio.wait_for(
                    self.vector_store.asearch(query, top_k=3),
                    timeout=3
                )
                for result in results:
                    result["source"] = "emergency_vector_search"
                    result["score"] = result.get("score", 0.5) * 0.8  # Reduce confidence
                return results
        except:
            pass
        
        # Ultimate fallback
        return [{
            "text": "I'm here to support you. While I'm having trouble accessing my full knowledge base right now, please know that what you're feeling is valid and you don't have to go through this alone.",
            "source": "emergency_fallback",
            "score": 0.3,
            "metadata": {"emergency": True}
        }]
    
    async def _vector_search(self, query: str, top_k: int) -> List[Dict]:
        """Optimized vector search"""
        try:
            results = await self.vector_store.asearch(query, top_k=top_k)
            logger.debug(f"Vector search returned {len(results)} results")
            
            for result in results:
                result["retrieval_method"] = "vector"
                if "metadata" not in result:
                    result["metadata"] = {}
                result["metadata"]["retrieval_method"] = "vector"
            
            return results
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []
    
    async def _bm25_search(self, query: str, top_k: int) -> List[Dict]:
        """Optimized BM25 search"""
        try:
            results = await self.bm25_search.search(query, top_k=top_k)
            logger.debug(f"BM25 search returned {len(results)} results")
            
            for result in results:
                result["retrieval_method"] = "bm25"
                if "metadata" not in result:
                    result["metadata"] = {}
                result["metadata"]["retrieval_method"] = "bm25"
            
            return results
        except Exception as e:
            logger.error(f"BM25 search failed: {e}")
            return []
    
    async def _graph_search_optimized(self, entity: str, top_k: int = 8, hop_distance: int = 1) -> List[Dict]:  # Increased from 4 to 8
        """OPTIMIZED graph search for factual queries - balanced performance and quality"""
        try:
            results = await asyncio.wait_for(
                self.graph_store.search_entity(entity, hop_distance=hop_distance, limit=top_k),
                timeout=5  # Increased timeout for factual queries
            )
            logger.debug(f"Optimized graph search for '{entity}' returned {len(results)} results")
            
            for result in results:
                result["retrieval_method"] = "graph"
                if "metadata" not in result:
                    result["metadata"] = {}
                result["metadata"]["retrieval_method"] = "graph"
                result["metadata"]["entity"] = entity
                result["metadata"]["hop_distance"] = hop_distance
            
            return results
        except Exception as e:
            logger.warning(f"Optimized graph search failed for entity '{entity}': {e}")
            return []
    
    async def _web_search_fast(self, query: str, max_results: int = 10) -> List[Dict]:  # Increased from 5 to 10
        """FAST web search with aggressive timeout"""
        try:
            results = await asyncio.wait_for(
                self.web_search.search(query, max_results=min(max_results, 10)),  # Increased from 5 to 10
                timeout=6  # REDUCED from 10 to 6 seconds
            )
            
            for i, result in enumerate(results):
                result["retrieval_method"] = "web"
                result["score"] = 0.8 - (i * 0.1)
                if "metadata" not in result:
                    result["metadata"] = {}
                result["metadata"]["retrieval_method"] = "web"
            
            return results
        except asyncio.TimeoutError:
            logger.warning(f"Web search timed out for query: {query[:50]}...")
            return []
        except Exception as e:
            logger.error(f"Web search failed: {e}")
            return []
    
    def _combine_results_fast(self, results: List[Dict], weights: Dict[str, float]) -> List[Dict]:
        """OPTIMIZED: Faster result combination with less processing"""
        if not results:
            return []
        
        # SIMPLIFIED: Just score and sort - skip complex deduplication for speed
        for result in results:
            source = result.get("source", "unknown_search")
            base_score = result.get("score", 0.5)
            
            # Apply simple weight
            weight = 1.0
            if "vector" in source:
                weight = weights.get("vector", 1.0)
            elif "bm25" in source:
                weight = weights.get("bm25", 1.0) 
            elif "web" in source:
                weight = weights.get("web", 1.0)
            elif "graph" in source:
                weight = weights.get("graph", 1.0)
            
            result["combined_score"] = base_score * weight
            result["final_score"] = result["combined_score"]
        
        # Sort by score and return
        results.sort(key=lambda x: x.get("final_score", 0), reverse=True)
        return results
    
    async def _fast_rerank(self, query: str, results: List[Dict]) -> List[Dict]:
        """OPTIMIZED: Minimal reranking for speed"""
        if not results or not self.reranker:
            return results
        
        try:
            # Only rerank top 5 for speed
            top_results = results[:5]
            remaining_results = results[5:]
            
            # Prepare query-document pairs with shorter text
            pairs = [(query, r.get("text", "")[:200]) for r in top_results]  # Even shorter for speed
            
            # Get reranking scores with timeout
            scores = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: self.reranker.predict(pairs, batch_size=5)
                ),
                timeout=2  # 2 second timeout for reranking
            )
            
            # Update scores
            for i, result in enumerate(top_results):
                result["rerank_score"] = float(scores[i])
                result["final_score"] = result["rerank_score"]
            
            # Sort reranked results
            top_results.sort(key=lambda x: x.get("final_score", 0), reverse=True)
            
            return top_results + remaining_results
            
        except asyncio.TimeoutError:
            logger.warning("Reranking timed out - returning original results")
            return results
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            return results
    
    def _apply_fast_filtering(self, results: List[Dict], strategy: Dict) -> List[Dict]:
        """OPTIMIZED: Minimal filtering for speed"""
        # Quick quality filter
        min_score = 0.25  # More permissive
        filtered = [r for r in results if r.get("final_score", r.get("score", 0)) > min_score]
        
        # Limit results based on strategy
        max_results = strategy.get("top_k", 8)
        return filtered[:max_results]
    
    def _extract_entities_optimized(self, query: str, query_analysis: Dict) -> List[str]:
        """IMPROVED entity extraction for factual queries"""
        try:
            query_lower = query.lower()
            entities = []
            
            # Enhanced mental health entity recognition
            mental_health_entities = {
                "anxiety": ["anxiety", "anxious", "worried", "panic", "fear"],
                "depression": ["depression", "depressed", "sad", "hopeless", "mood"],
                "stress": ["stress", "stressed", "overwhelm", "pressure", "burden"],
                "therapy": ["therapy", "counseling", "treatment", "therapeutic"],
                "cognitive_behavioral_therapy": ["cbt", "cognitive behavioral", "cognitive therapy"],
                "medication": ["medication", "antidepressant", "ssri", "medicine"],
                "mindfulness": ["mindfulness", "meditation", "breathing", "relaxation"],
                "support": ["support", "help", "guidance", "assistance"],
                "coping": ["coping", "cope", "manage", "deal", "handle"],
                "mental_health": ["mental health", "wellbeing", "wellness", "psychological"]
            }
            
            # Find matching entities
            for entity, keywords in mental_health_entities.items():
                if any(keyword in query_lower for keyword in keywords):
                    entities.append(entity)
            
            # If no specific entities found, use general mental health
            if not entities:
                entities = ["mental_health"]
            
            # For factual queries, prioritize therapy and treatment entities
            query_type = query_analysis.get("query_type", "").lower()
            if query_type == "factual":
                treatment_entities = [e for e in entities if e in ["therapy", "cognitive_behavioral_therapy", "medication", "treatment"]]
                if treatment_entities:
                    entities = treatment_entities + [e for e in entities if e not in treatment_entities]
            
            logger.debug(f"Extracted entities for '{query[:50]}...': {entities}")
            return entities[:3]  # Return max 3 entities
            
        except Exception as e:
            logger.warning(f"Entity extraction failed: {e}")
            return ["mental_health"]
    
    def _calculate_retrieval_confidence(self, results: List[Dict]) -> float:
        """Simplified confidence calculation"""
        if not results:
            return 0.2
        
        # Simple average of top 2 scores
        top_scores = [r.get("final_score", r.get("score", 0)) for r in results[:2]]
        
        if not top_scores:
            return 0.2
        
        avg_score = np.mean(top_scores)
        return min(0.9, max(0.2, avg_score))
    
    def _clean_cache(self):
        """Clean old cache entries"""
        current_time = time.time()
        keys_to_remove = [
            key for key, (timestamp, _) in self.search_cache.items()
            if current_time - timestamp > self.cache_ttl
        ]
        for key in keys_to_remove:
            del self.search_cache[key]
        
        # Limit cache size
        if len(self.search_cache) > 50:  # Reduced cache size
            sorted_items = sorted(self.search_cache.items(), key=lambda x: x[1][0])
            for key, _ in sorted_items[:25]:
                del self.search_cache[key]