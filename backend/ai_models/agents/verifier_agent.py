# agents/verifier_agent.py - OPTIMIZED VERSION
"""
Enhanced Verifier Agent - OPTIMIZED for speed
Uses rule-based verification instead of LLM calls for most cases
"""

from typing import Dict, Any, List, Optional
import re
from agents.base import BaseAgent, AgentResponse
import logging
import asyncio
from functools import lru_cache

logger = logging.getLogger(__name__)

class VerifierAgent(BaseAgent):
    """Optimized verifier for fast information verification"""
    
    def __init__(self, llm_manager: Any, config: Any):
        super().__init__("information_verifier", llm_manager, config)
        
        # Quality indicators for mental health content
        self.quality_indicators = {
            "scientific": ["research", "study", "clinical", "evidence", "trial", "meta-analysis"],
            "authoritative": ["psychologist", "psychiatrist", "therapist", "counselor", "professional"],
            "actionable": ["technique", "strategy", "approach", "method", "exercise", "practice"],
            "empathetic": ["understand", "feel", "experience", "support", "help", "cope"]
        }
        
        # Red flags for poor quality content
        self.red_flags = [
            "cure", "guaranteed", "miracle", "instant", "completely eliminate",
            "never", "always", "100%", "medical advice"
        ]
        
        # Cache for repeated verifications
        self.verification_cache = {}
    
    async def process(self,
                     information: Dict[str, Any],
                     query_analysis: Dict[str, Any],
                     original_query: str) -> AgentResponse:
        """
        OPTIMIZED: Fast verification using mostly rule-based approach
        Only uses LLM for complex cases
        """
        try:
            text = information.get("text", "")
            source = information.get("source", "unknown")
            metadata = information.get("metadata", {})
            
            # Create cache key
            cache_key = f"{text[:100]}:{original_query[:50]}"
            if cache_key in self.verification_cache:
                logger.debug("Returning cached verification result")
                return self.verification_cache[cache_key]
            
            # Skip empty or too short content
            if not text or len(text) < 50:
                return self._create_rejection("Content too short or empty")
            
            # OPTIMIZATION: Use rule-based verification for most cases
            verification_result = await self._fast_verify(
                text, metadata, query_analysis, original_query, source
            )
            
            # Calculate final confidence
            confidence = self._calculate_confidence(verification_result, information)
            
            # Enhance the original information with verification data
            enhanced_info = {
                **information,
                "verified": True,
                "final_confidence": confidence,
                "relevance_score": verification_result.get("relevance", 0.5),
                "quality_score": verification_result.get("quality", 0.5),
                "verification_notes": verification_result.get("notes", [])
            }
            
            # Determine recommendation
            if confidence < 0.4:
                recommendation = "reject"
            elif confidence < 0.7:
                recommendation = "use_with_caution"
            else:
                recommendation = "accept"
            
            response = AgentResponse(
                success=True,
                data={
                    **enhanced_info,
                    "recommendation": recommendation,
                    "confidence": confidence,
                    "verification_method": verification_result.get("method", "fast_verification")
                },
                metadata={
                    "verification_details": verification_result
                },
                confidence=confidence
            )
            
            # Cache the result
            self.verification_cache[cache_key] = response
            
            # Clean cache if too large
            if len(self.verification_cache) > 1000:
                # Remove half of the cache (oldest entries)
                keys = list(self.verification_cache.keys())
                for key in keys[:500]:
                    del self.verification_cache[key]
            
            return response
            
        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return self._create_rejection(f"Verification error: {str(e)}")
    
    async def _fast_verify(self, text: str, metadata: Dict, 
                          query_analysis: Dict, original_query: str,
                          source: str) -> Dict:
        """OPTIMIZED: Fast rule-based verification"""
        
        # Quick quality assessment
        quality_score = self._assess_content_quality(text)
        
        # Quick relevance check
        relevance_score = self._quick_relevance_check(text, original_query, query_analysis)
        
        # Source trust score
        if source == "web_search":
            trust_score = self._assess_web_trust(metadata)
        else:
            trust_score = 0.9  # High trust for local KB
        
        # Check for red flags
        has_red_flags = any(flag in text.lower() for flag in self.red_flags)
        if has_red_flags:
            quality_score *= 0.5
        
        # For emotional support queries, check empathy
        if query_analysis.get("intent") == "emotional_support":
            has_empathy = any(word in text.lower() for word in self.quality_indicators["empathetic"])
            if not has_empathy:
                quality_score *= 0.7
        
        # Only use LLM for complex verification if needed
        needs_llm_check = (
            quality_score < 0.5 or 
            relevance_score < 0.5 or
            query_analysis.get("complexity") == "complex"
        )
        
        if needs_llm_check and self.config.agent.enable_fact_checking:
            # Use LLM only for complex cases
            llm_check = await self._llm_verify_minimal(text, original_query)
            if llm_check:
                relevance_score = (relevance_score + llm_check.get("relevance", 0.5)) / 2
        
        return {
            "method": "fast_rule_based",
            "quality": quality_score,
            "relevance": relevance_score,
            "trust": trust_score,
            "has_red_flags": has_red_flags,
            "notes": [
                f"Source: {source}",
                f"Quality: {quality_score:.2f}",
                f"Relevance: {relevance_score:.2f}"
            ]
        }
    
    def _assess_content_quality(self, text: str) -> float:
        """Fast content quality assessment"""
        score = 0.5  # Base score
        
        # Length check
        text_length = len(text)
        if 200 <= text_length <= 2000:
            score += 0.1
        elif text_length < 100:
            score -= 0.2
        
        # Quality indicators (simplified)
        quality_count = 0
        text_lower = text.lower()
        for indicators in self.quality_indicators.values():
            if any(word in text_lower for word in indicators):
                quality_count += 1
        
        score += quality_count * 0.1
        
        # Structure check (has sentences)
        sentence_count = len(re.split(r'[.!?]+', text))
        if 3 <= sentence_count <= 20:
            score += 0.1
        
        return max(0.1, min(1.0, score))
    
    def _quick_relevance_check(self, text: str, query: str, query_analysis: Dict) -> float:
        """Fast relevance check without LLM"""
        # Keyword overlap
        query_words = set(query.lower().split())
        text_words = set(text.lower().split())
        
        # Remove common words
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were'}
        query_words = query_words - common_words
        text_words = text_words - common_words
        
        if not query_words:
            return 0.5
        
        # Calculate overlap
        overlap = len(query_words & text_words) / len(query_words)
        
        # Check for key concepts
        keywords = query_analysis.get("keywords", [])
        if keywords:
            keyword_matches = sum(1 for kw in keywords if kw.lower() in text.lower())
            keyword_score = min(1.0, keyword_matches / max(len(keywords), 1))
            relevance = (overlap * 0.4) + (keyword_score * 0.6)
        else:
            relevance = overlap
        
        # Boost for exact phrase matches
        if any(word in text.lower() for word in query.lower().split() if len(word) > 4):
            relevance = min(1.0, relevance * 1.2)
        
        return min(1.0, relevance)
    
    def _assess_web_trust(self, metadata: Dict) -> float:
        """Assess trust level of web sources"""
        url = metadata.get("url", "").lower()
        
        # Trusted domains
        trusted_domains = [
            ".gov", ".edu", ".org", "nih.gov", "mayo", "cleveland",
            "hopkinsmedicine", "webmd", "psychologytoday", "apa.org",
            "healthline", "medicalnewstoday", "verywellmind"
        ]
        
        # Check for trusted domains
        for domain in trusted_domains:
            if domain in url:
                return 0.9
        
        # Medium trust for known health sites
        medium_trust = ["health", "medical", "clinic", "hospital", "university"]
        for term in medium_trust:
            if term in url:
                return 0.7
        
        # Default lower trust
        return 0.5
    
    async def _llm_verify_minimal(self, text: str, query: str) -> Optional[Dict]:
        """Minimal LLM verification for complex cases only"""
        try:
            # Very simple prompt for speed
            prompt = f"""Rate the relevance of this text to the query (0-1):

Query: {query}
Text: {text[:300]}...

Respond with just a number between 0 and 1."""

            # Use lower temperature for consistency
            result = await asyncio.wait_for(
                self.llm_manager.ainvoke(prompt, temperature=0.1, max_tokens=10),
                timeout=2  # 2 second timeout
            )
            
            try:
                relevance = float(result.strip())
                return {"relevance": max(0, min(1, relevance))}
            except:
                return None
                
        except asyncio.TimeoutError:
            logger.debug("LLM verification timed out")
            return None
        except Exception as e:
            logger.debug(f"LLM verification failed: {e}")
            return None
    
    def _calculate_confidence(self, verification_result: Dict, 
                            original_info: Dict) -> float:
        """Calculate final confidence score"""
        
        # Get component scores
        quality = verification_result.get("quality", 0.5)
        relevance = verification_result.get("relevance", 0.5)
        trust = verification_result.get("trust", 0.7)
        original_score = original_info.get("score", 0.5)
        
        # Different weighting based on source
        if original_info.get("source") == "web_search":
            # For web content, trust matters more
            confidence = (quality * 0.3) + (relevance * 0.3) + (trust * 0.3) + (original_score * 0.1)
        else:
            # For local content, quality and relevance matter more
            confidence = (quality * 0.35) + (relevance * 0.35) + (trust * 0.15) + (original_score * 0.15)
        
        # Apply penalties
        if verification_result.get("has_red_flags"):
            confidence *= 0.7
            
        return min(0.95, confidence)
    
    def _create_rejection(self, reason: str) -> AgentResponse:
        """Create a rejection response"""
        return AgentResponse(
            success=True,
            data={
                "recommendation": "reject",
                "confidence": 0.0,
                "reason": reason,
                "verification_method": "content_rejected"
            },
            metadata={"rejection_reason": reason},
            confidence=0.0
        )