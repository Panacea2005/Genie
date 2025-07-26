# agents/orchestrator.py - OPTIMIZED VERSION
"""
Main orchestrator agent that coordinates all other agents
OPTIMIZED FOR PERFORMANCE - Fixes slow query processing
"""

from typing import Dict, Any, List, Optional
import asyncio
from agents.base import BaseAgent, AgentResponse
from agents.query_agent import QueryAgent
from agents.retrieval_agent import RetrievalAgent
from agents.verifier_agent import VerifierAgent
from agents.synthesis_agent import SynthesisAgent
from core.memory import ConversationMemory
import logging
import time
from functools import lru_cache
import hashlib

logger = logging.getLogger(__name__)

class OrchestratorAgent(BaseAgent):
    """
    Main orchestrator that coordinates all agents to process queries
    Implements the full agentic RAG pipeline with performance optimizations
    """
    
    def __init__(self, llm_manager: Any, embedding_manager: Any, config: Any):
        super().__init__("orchestrator", llm_manager, config)
        
        # Initialize sub-agents
        self.query_agent = QueryAgent(llm_manager, config)
        self.retrieval_agent = RetrievalAgent(llm_manager, embedding_manager, config)
        self.verifier_agent = VerifierAgent(llm_manager, config)
        self.synthesis_agent = SynthesisAgent(llm_manager, config)
        
        # Initialize conversation memory
        self.memory = ConversationMemory(
            llm_manager=llm_manager,
            max_tokens=config.system.max_memory_tokens,
            window_size=config.system.conversation_window
        )
        
        # Track active sessions
        self.sessions = {}
        
        # For metrics tracking
        self.last_response_metadata = {}
        
        # OPTIMIZATION: Response cache
        self.response_cache = {}
        self.cache_ttl = config.data.cache_ttl if hasattr(config.data, 'cache_ttl') else 3600
    
    def _get_cache_key(self, query: str, session_id: str, model_preference: Optional[str] = None) -> str:
        """Generate cache key for query, session, and model preference"""
        key = f"{query}:{session_id}:{model_preference or 'default'}"
        return hashlib.md5(key.encode()).hexdigest()
    
    async def process(self, 
                     query: str, 
                     session_id: str = "default",
                     context: Optional[Dict[str, Any]] = None,
                     conversation_history: Optional[list] = None) -> AgentResponse:
        """
        Main processing pipeline for user queries with performance optimizations
        """
        try:
            # Extract model preference from context
            model_preference = None
            if context and 'model_preference' in context:
                model_preference = context['model_preference']
                logger.info(f"Using model preference: {model_preference}")
            
            # OPTIMIZATION 1: Check cache first
            cache_key = self._get_cache_key(query, session_id, model_preference)
            if self.config.agent.enable_response_caching and cache_key in self.response_cache:
                cached_time, cached_response = self.response_cache[cache_key]
                if time.time() - cached_time < self.cache_ttl:
                    logger.info(f"Returning cached response for query: {query[:50]}...")
                    return cached_response
            
            # Use provided conversation_history if present, else use backend memory
            if conversation_history is None:
                conversation_history = self.memory.get_history(session_id, include_summaries=True)
            
            # Add current query to memory with enhanced context extraction
            self.memory.add_message(session_id, "user", query, {
                "timestamp": time.time(),
                "query_type": "user_input"
            })
            
            # Step 1: Query Analysis and Decomposition
            self.logger.info(f"Step 1: Analyzing query for session {session_id}")
            query_analysis = await self.query_agent(
                query=query,
                context={
                    "conversation_history": conversation_history,
                    "user_context": context or {},
                    "model_preference": model_preference  # Pass model preference
                }
            )
            
            if not query_analysis.success:
                return query_analysis
            
            # Check for crisis situation
            if query_analysis.data.get("urgency_level") == "critical":
                return await self._handle_crisis(query, query_analysis.data, model_preference)
            
            # OPTIMIZATION 2: Skip retrieval for pure emotional support
            intent = query_analysis.data.get("intent", "").lower()
            if intent == "emotional_support" and not query_analysis.data.get("requires_current_info", False):
                # For pure emotional support, we can skip heavy retrieval
                logger.info("Pure emotional support query detected - using lightweight retrieval")
                retrieval_results = await self._lightweight_retrieval(query, query_analysis.data)
            else:
                # Step 2: Multi-Strategy Retrieval
                self.logger.info("Step 2: Retrieving relevant information")
                retrieval_results = await self.retrieval_agent(
                    query_analysis=query_analysis.data,
                    original_query=query
                )
            
            if not retrieval_results.success:
                return retrieval_results
            
            # OPTIMIZATION 3: Smart verification - only verify top results
            self.logger.info("Step 3: Verifying retrieved information")
            
            # Limit verification based on query complexity but be more generous
            complexity = query_analysis.data.get("complexity", "simple")
            if complexity == "simple":
                max_to_verify = 5  # Increased from 2
            elif complexity == "moderate":
                max_to_verify = 8  # Increased from 3
            else:
                max_to_verify = 10  # Increased from 5
            
            results_to_verify = retrieval_results.data[:max_to_verify]
            
            # OPTIMIZATION 4: Batch verification with timeout - be more permissive
            verified_results = await self._batch_verify(
                results_to_verify, 
                query_analysis.data, 
                query,
                timeout=15  # Increased timeout
            )
            
            self.logger.info(f"Verified {len(verified_results)} results")
            
            # Step 4: Synthesis
            self.logger.info("Step 4: Synthesizing final response")
            synthesis_result = await self.synthesis_agent(
                verified_results=verified_results,
                query_analysis=query_analysis.data,
                original_query=query,
                conversation_history=conversation_history,
                model_preference=model_preference  # Pass model preference to synthesis
            )
            
            if not synthesis_result.success:
                return synthesis_result
            
            # Add response to memory
            self.memory.add_message(
                session_id, 
                "assistant", 
                synthesis_result.data["response"]
            )
            
            # Store metadata for metrics
            self.last_response_metadata = {
                "query_analysis": query_analysis.data,
                "retrieval_count": len(retrieval_results.data),
                "verified_count": len(verified_results),
                "model_used": model_preference or "default",
                "processing_steps": {
                    "query_analysis": query_analysis.processing_time,
                    "retrieval": retrieval_results.processing_time,
                    "verification": sum(vr.get("verification_time", 0) for vr in verified_results),
                    "synthesis": synthesis_result.processing_time
                }
            }
            
            # Prepare final response
            final_response = AgentResponse(
                success=True,
                data={
                    "response": synthesis_result.data["response"],
                    "confidence": synthesis_result.data["confidence"],
                    "sources": synthesis_result.data.get("sources", []),
                    "session_id": session_id,
                    "model": f"genie-rag-{model_preference}" if model_preference else "genie-rag"
                },
                metadata=self.last_response_metadata,
                confidence=synthesis_result.data["confidence"]
            )
            
            # OPTIMIZATION 5: Cache successful responses
            if self.config.agent.enable_response_caching:
                self.response_cache[cache_key] = (time.time(), final_response)
                # Clean old cache entries
                self._clean_cache()
            
            return final_response
            
        except asyncio.TimeoutError:
            logger.error(f"Orchestrator timeout for query: {query[:50]}...")
            return AgentResponse(
                success=False,
                data=None,
                metadata={"error_type": "timeout"},
                error="Request timed out. Please try a simpler query.",
                confidence=0.0
            )
        except Exception as e:
            logger.error(f"Orchestrator error: {e}", exc_info=True)
            return AgentResponse(
                success=False,
                data=None,
                metadata={"error_type": type(e).__name__},
                error=str(e),
                confidence=0.0
            )
    
    async def _lightweight_retrieval(self, query: str, query_analysis: Dict) -> AgentResponse:
        """Lightweight retrieval for emotional support queries"""
        # Just use vector search with a small top_k
        try:
            # Create a minimal retrieval request
            retrieval_analysis = {
                **query_analysis,
                "use_web_only": False,
                "retrieval_strategy": ["vector"],
                "top_k": 5  # Only get top 5 results
            }
            
            return await self.retrieval_agent(
                query_analysis=retrieval_analysis,
                original_query=query
            )
        except Exception as e:
            logger.error(f"Lightweight retrieval failed: {e}")
            return AgentResponse(
                success=False,
                data=[],
                metadata={"error": str(e)},
                error=str(e)
            )
    
    async def _batch_verify(self, results: List[Dict], query_analysis: Dict, 
                           query: str, timeout: int = 10) -> List[Dict]:
        """Batch verification with timeout and parallel processing"""
        if not results:
            return []
        
        try:
            # Create verification tasks
            tasks = []
            for i, result in enumerate(results):
                task = self._verify_with_timeout(result, query_analysis, query, i)
                tasks.append(task)
            
            # Run all verifications in parallel with overall timeout
            verified = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=timeout
            )
            
            # Filter out failed verifications
            valid_results = []
            for i, result in enumerate(verified):
                if isinstance(result, Exception):
                    logger.warning(f"Verification {i} failed: {result}")
                    continue
                
                if result and result.success:
                    # Add verification time to the data
                    verified_data = result.data
                    verified_data["verification_time"] = result.processing_time
                    
                    # Be more permissive - include results unless explicitly rejected
                    recommendation = verified_data.get("recommendation", "accept")
                    if recommendation != "reject":
                        valid_results.append(verified_data)
                    elif verified_data.get("final_confidence", 0) > 0.3:
                        # Even rejected results with decent confidence can be included
                        verified_data["recommendation"] = "use_with_caution"
                        valid_results.append(verified_data)
            
            return valid_results
            
        except asyncio.TimeoutError:
            logger.warning(f"Verification timed out after {timeout}s")
            # Return unverified results with lower confidence
            return [{**r, "final_confidence": r.get("score", 0.5) * 0.7} for r in results[:2]]
    
    async def _verify_with_timeout(self, result: Dict, query_analysis: Dict, 
                                  query: str, index: int) -> AgentResponse:
        """Verify a single result with timeout"""
        try:
            # Add a per-verification timeout
            return await asyncio.wait_for(
                self.verifier_agent(
                    information=result,
                    query_analysis=query_analysis,
                    original_query=query
                ),
                timeout=3  # 3 seconds per verification
            )
        except asyncio.TimeoutError:
            logger.warning(f"Verification {index} timed out")
            # Return a minimal verification result
            return AgentResponse(
                success=True,
                data={
                    **result,
                    "recommendation": "use_with_caution",
                    "final_confidence": result.get("score", 0.5) * 0.8,
                    "verification_notes": ["Verification timed out"]
                },
                metadata={"timed_out": True},
                confidence=0.6
            )
    
    def _clean_cache(self):
        """Clean expired cache entries"""
        current_time = time.time()
        expired_keys = [
            key for key, (timestamp, _) in self.response_cache.items()
            if current_time - timestamp > self.cache_ttl
        ]
        for key in expired_keys:
            del self.response_cache[key]
        
        # Also limit cache size
        if len(self.response_cache) > 100:
            # Remove oldest entries
            sorted_items = sorted(self.response_cache.items(), key=lambda x: x[1][0])
            for key, _ in sorted_items[:50]:
                del self.response_cache[key]
    
    async def _handle_crisis(self, query: str, query_analysis: Dict, model_preference: Optional[str] = None) -> AgentResponse:
        """Handle crisis situations with appropriate response"""
        crisis_response = """I'm concerned about what you're sharing, and I want you to know that you don't have to go through this alone. 

Please consider reaching out for immediate support:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Crisis Lines: findahelpline.com

If you're in immediate danger, please call emergency services (911) or go to your nearest emergency room.

I'm here to listen and support you, but please also connect with human professionals who can provide the specialized help you deserve."""
        
        self.memory.add_message("crisis", "assistant", crisis_response)
        
        return AgentResponse(
            success=True,
            data={
                "response": crisis_response,
                "confidence": 1.0,
                "sources": ["crisis_protocol"],
                "crisis_detected": True,
                "model": f"genie-crisis-{model_preference}" if model_preference else "genie-crisis"
            },
            metadata={
                "query_analysis": query_analysis,
                "crisis_type": query_analysis.get("crisis_type", []),
                "severity": query_analysis.get("severity", "high"),
                "model_used": model_preference or "default"
            },
            confidence=1.0
        )
    
    def clear_session(self, session_id: str):
        """Clear conversation history for a session"""
        self.memory.clear_history(session_id)
        # Also clear cache for this session
        keys_to_remove = [k for k in self.response_cache.keys() if session_id in k]
        for key in keys_to_remove:
            del self.response_cache[key]
    
    def get_session_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return self.memory.get_history(session_id)
    
    def get_last_response_metrics(self) -> Dict[str, Any]:
        """Get detailed metrics from the last response"""
        if not self.last_response_metadata:
            return {}
        
        metadata = self.last_response_metadata
        processing_steps = metadata.get('processing_steps', {})
        
        total_time = sum(processing_steps.values())
        
        return {
            "total_processing_time": total_time,
            "stage_breakdown": {
                "query_analysis": {
                    "time": processing_steps.get('query_analysis', 0),
                    "percentage": (processing_steps.get('query_analysis', 0) / total_time * 100) if total_time > 0 else 0
                },
                "retrieval": {
                    "time": processing_steps.get('retrieval', 0),
                    "percentage": (processing_steps.get('retrieval', 0) / total_time * 100) if total_time > 0 else 0,
                    "documents_retrieved": metadata.get('retrieval_count', 0)
                },
                "verification": {
                    "time": processing_steps.get('verification', 0),
                    "percentage": (processing_steps.get('verification', 0) / total_time * 100) if total_time > 0 else 0,
                    "documents_verified": metadata.get('verified_count', 0)
                },
                "synthesis": {
                    "time": processing_steps.get('synthesis', 0),
                    "percentage": (processing_steps.get('synthesis', 0) / total_time * 100) if total_time > 0 else 0
                }
            },
            "query_complexity": metadata.get('query_analysis', {}).get('complexity', 'unknown'),
            "retrieval_strategies": metadata.get('retrieval_breakdown', {}).get('strategies_used', []),
            "model_used": metadata.get('model_used', 'default')
        }