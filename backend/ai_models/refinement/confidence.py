# refinement/confidence.py
"""
Enhanced confidence scoring for high-quality responses
"""

from typing import Dict, List, Any, Optional
import numpy as np
import logging
import re
from dataclasses import dataclass
from config.settings import config

logger = logging.getLogger(__name__)

@dataclass
class ConfidenceComponents:
    """Detailed confidence score components"""
    source_quality: float = 0.0
    content_relevance: float = 0.0
    linguistic_confidence: float = 0.0
    citation_quality: float = 0.0
    structural_quality: float = 0.0
    factual_accuracy: float = 0.0
    overall_score: float = 0.0

class ConfidenceScorer:
    """Enhanced confidence scoring for responses"""
    
    def __init__(self):
        self.config = config.quality
        
        # Enhanced phrase lists
        self.uncertainty_phrases = [
            "might", "maybe", "possibly", "could be", "unclear",
            "not sure", "uncertain", "approximate", "estimated",
            "roughly", "about", "around", "presumably", "likely",
            "perhaps", "potentially", "tends to", "often", "sometimes"
        ]
        
        self.confidence_phrases = [
            "definitely", "certainly", "clearly", "obviously",
            "proven", "confirmed", "established", "verified",
            "according to research", "studies show", "evidence suggests",
            "clinically proven", "scientifically", "demonstrated",
            "well-documented", "widely recognized", "experts agree"
        ]
        
        self.quality_indicators = {
            "scientific": ["research", "study", "clinical", "trial", "meta-analysis", "evidence"],
            "authoritative": ["expert", "professional", "specialist", "researcher", "clinician"],
            "specific": ["specifically", "exactly", "precisely", "in particular", "for example"],
            "comprehensive": ["including", "such as", "furthermore", "additionally", "moreover"]
        }
    
    def calculate_response_confidence(self, 
                                    response: str,
                                    verified_results: List[Dict],
                                    sources_used: List[Dict],
                                    response_type: str = "general") -> float:
        """
        Calculate comprehensive confidence score for a response
        """
        # Get detailed confidence components
        components = self._calculate_confidence_components(
            response, verified_results, sources_used, response_type
        )
        
        # Apply response-type specific weighting
        weighted_score = self._apply_response_type_weighting(components, response_type)
        
        # Apply quality adjustments
        final_score = self._apply_quality_adjustments(weighted_score, response, sources_used)
        
        # Log confidence breakdown for debugging
        logger.debug(f"Confidence breakdown - Source: {components.source_quality:.2f}, "
                    f"Relevance: {components.content_relevance:.2f}, "
                    f"Linguistic: {components.linguistic_confidence:.2f}, "
                    f"Final: {final_score:.2f}")
        
        return final_score
    
    def _calculate_confidence_components(self, response: str, 
                                       verified_results: List[Dict],
                                       sources_used: List[Dict],
                                       response_type: str) -> ConfidenceComponents:
        """Calculate individual confidence components"""
        components = ConfidenceComponents()
        
        # 1. Source Quality Score
        components.source_quality = self._calculate_source_quality(verified_results, sources_used)
        
        # 2. Content Relevance Score
        components.content_relevance = self._calculate_content_relevance(verified_results)
        
        # 3. Linguistic Confidence Score
        components.linguistic_confidence = self._calculate_linguistic_confidence(response)
        
        # 4. Citation Quality Score
        components.citation_quality = self._calculate_citation_quality(response, sources_used)
        
        # 5. Structural Quality Score
        components.structural_quality = self._calculate_structural_quality(response, response_type)
        
        # 6. Factual Accuracy Score (from verification)
        components.factual_accuracy = self._calculate_factual_accuracy(verified_results)
        
        return components
    
    def _calculate_source_quality(self, verified_results: List[Dict], 
                                sources_used: List[Dict]) -> float:
        """Calculate confidence based on source quality"""
        if not verified_results:
            return 0.3
        
        source_scores = []
        
        for result in verified_results:  # Remove limit to consider all sources
            source_type = result.get("source", "unknown")
            base_weight = self.config.source_confidence_weights.get(source_type, 0.5)
            
            # Adjust for verification confidence
            verification_confidence = result.get("final_confidence", 0.5)
            adjusted_score = base_weight * verification_confidence
            
            # Boost for high-quality indicators
            if result.get("metadata", {}).get("trusted_source"):
                adjusted_score *= 1.2
            if result.get("has_evidence"):
                adjusted_score *= 1.1
            
            source_scores.append(min(1.0, adjusted_score))
        
        return np.mean(source_scores) if source_scores else 0.3
    
    def _calculate_content_relevance(self, verified_results: List[Dict]) -> float:
        """Calculate relevance of content used"""
        if not verified_results:
            return 0.3
        
        relevance_scores = []
        for result in verified_results:  # Remove limit to consider all sources
            relevance = result.get("relevance_score", 0.5)
            confidence = result.get("final_confidence", 0.5)
            combined = (relevance * 0.6) + (confidence * 0.4)
            relevance_scores.append(combined)
        
        return np.mean(relevance_scores) if relevance_scores else 0.3
    
    def _calculate_linguistic_confidence(self, response: str) -> float:
        """Enhanced linguistic confidence analysis"""
        response_lower = response.lower()
        score = 0.7  # Base score
        
        # Count confidence vs uncertainty markers
        uncertainty_count = sum(1 for phrase in self.uncertainty_phrases if phrase in response_lower)
        confidence_count = sum(1 for phrase in self.confidence_phrases if phrase in response_lower)
        
        # Calculate confidence ratio
        total_markers = uncertainty_count + confidence_count
        if total_markers > 0:
            confidence_ratio = confidence_count / total_markers
            score = 0.5 + (confidence_ratio * 0.4)  # Scale to 0.5-0.9
        
        # Check for quality indicators
        for category, indicators in self.quality_indicators.items():
            if any(indicator in response_lower for indicator in indicators):
                score += 0.05
        
        # Penalize vague language
        vague_terms = ["some", "many", "often", "usually", "generally"]
        vague_count = sum(1 for term in vague_terms if term in response_lower)
        score -= (vague_count * 0.02)
        
        # Boost for specific numbers or statistics
        if re.search(r'\d+%|\d+\s*(people|patients|studies|participants)', response):
            score += 0.1
        
        return max(0.3, min(1.0, score))
    
    def _calculate_citation_quality(self, response: str, sources_used: List[Dict]) -> float:
        """Calculate quality of citations in response"""
        citations_in_response = re.findall(r'\[(\d+)\]', response)
        
        if not citations_in_response:
            return 0.3 if not self.config.require_citations else 0.1
        
        # Check citation coverage
        unique_citations = set(citations_in_response)
        citation_coverage = len(unique_citations) / max(len(sources_used), 1)
        
        # Check citation placement (should be distributed throughout)
        response_thirds = len(response) // 3
        citation_positions = [m.start() for m in re.finditer(r'\[\d+\]', response)]
        
        distributed_score = 0.7  # Default
        if citation_positions:
            # Check if citations appear in different parts of response
            in_first_third = any(pos < response_thirds for pos in citation_positions)
            in_middle_third = any(response_thirds <= pos < 2*response_thirds for pos in citation_positions)
            in_last_third = any(pos >= 2*response_thirds for pos in citation_positions)
            
            distribution_count = sum([in_first_third, in_middle_third, in_last_third])
            distributed_score = distribution_count / 3.0
        
        # Combine scores
        return (citation_coverage * 0.5) + (distributed_score * 0.5)
    
    def _calculate_structural_quality(self, response: str, response_type: str) -> float:
        """Calculate structural quality of response"""
        score = 0.5  # Base score
        
        # Check paragraph structure
        paragraphs = response.strip().split('\n\n')
        if 2 <= len(paragraphs) <= 4:
            score += 0.2
        
        # Check for appropriate formatting
        if response_type == "practical_guidance":
            # Should have bullet points or numbers
            if any(marker in response for marker in ['•', '*', '1.', '2.', '-']):
                score += 0.2
        elif response_type == "factual_explanation":
            # Should have clear sections
            if any(marker in response for marker in [':', 'First,', 'Second,', 'Additionally']):
                score += 0.2
        
        # Check sentence variety
        sentences = re.split(r'[.!?]+', response)
        sentence_lengths = [len(s.split()) for s in sentences if s.strip()]
        if sentence_lengths:
            # Good variety in sentence length
            length_variance = np.var(sentence_lengths)
            if 20 < length_variance < 100:  # Not too uniform, not too varied
                score += 0.1
        
        # Check for professional disclaimer if needed
        if response_type in ["emotional_support", "practical_guidance"]:
            if any(term in response.lower() for term in ["professional", "consult", "healthcare"]):
                score += 0.1
        
        return min(1.0, score)
    
    def _calculate_factual_accuracy(self, verified_results: List[Dict]) -> float:
        """Calculate factual accuracy from verification results"""
        if not verified_results:
            return 0.5
        
        accuracy_scores = []
        for result in verified_results:
            if result.get("recommendation") == "accept":
                accuracy_scores.append(0.9)
            elif result.get("recommendation") == "use_with_caution":
                accuracy_scores.append(0.6)
            else:
                accuracy_scores.append(0.3)
        
        return np.mean(accuracy_scores) if accuracy_scores else 0.5
    
    def _apply_response_type_weighting(self, components: ConfidenceComponents, 
                                     response_type: str) -> float:
        """Apply response-type specific weighting to components"""
        weights = {
            "emotional_support": {
                "source_quality": 0.15,
                "content_relevance": 0.20,
                "linguistic_confidence": 0.20,
                "citation_quality": 0.10,
                "structural_quality": 0.20,
                "factual_accuracy": 0.15
            },
            "factual_explanation": {
                "source_quality": 0.25,
                "content_relevance": 0.20,
                "linguistic_confidence": 0.10,
                "citation_quality": 0.20,
                "structural_quality": 0.10,
                "factual_accuracy": 0.25
            },
            "practical_guidance": {
                "source_quality": 0.20,
                "content_relevance": 0.25,
                "linguistic_confidence": 0.15,
                "citation_quality": 0.15,
                "structural_quality": 0.20,
                "factual_accuracy": 0.15
            },
            "conversational": {
                "source_quality": 0.20,
                "content_relevance": 0.25,
                "linguistic_confidence": 0.20,
                "citation_quality": 0.10,
                "structural_quality": 0.15,
                "factual_accuracy": 0.10
            }
        }
        
        type_weights = weights.get(response_type, weights["conversational"])
        
        weighted_score = (
            components.source_quality * type_weights["source_quality"] +
            components.content_relevance * type_weights["content_relevance"] +
            components.linguistic_confidence * type_weights["linguistic_confidence"] +
            components.citation_quality * type_weights["citation_quality"] +
            components.structural_quality * type_weights["structural_quality"] +
            components.factual_accuracy * type_weights["factual_accuracy"]
        )
        
        return weighted_score
    
    def _apply_quality_adjustments(self, base_score: float, response: str, 
                                 sources_used: List[Dict]) -> float:
        """Apply final quality adjustments"""
        final_score = base_score
        
        # Length appropriateness
        word_count = len(response.split())
        if self.config.min_response_length <= word_count <= self.config.max_response_length:
            final_score *= 1.05
        elif word_count < self.config.min_response_length:
            final_score *= 0.9
        elif word_count > self.config.max_response_length * 1.5:
            final_score *= 0.95
        
        # Multiple high-quality sources boost
        high_quality_sources = sum(1 for s in sources_used if s.get("confidence", 0) > 0.8)
        if high_quality_sources >= 3:
            final_score *= 1.1
        elif high_quality_sources >= 2:
            final_score *= 1.05
        
        # Ensure minimum confidence for well-formed responses
        if len(response) > 100 and len(sources_used) > 0:
            final_score = max(0.6, final_score)
        
        # Cap maximum confidence
        return min(0.95, final_score)
    
    def get_confidence_explanation(self, confidence_score: float) -> str:
        """Get human-readable explanation of confidence level"""
        if confidence_score >= 0.9:
            return "Very high confidence - Multiple reliable sources strongly support this information"
        elif confidence_score >= 0.8:
            return "High confidence - Well-supported by credible sources"
        elif confidence_score >= 0.7:
            return "Good confidence - Supported by available information"
        elif confidence_score >= 0.6:
            return "Moderate confidence - Generally supported but some uncertainty"
        elif confidence_score >= 0.5:
            return "Fair confidence - Some supporting evidence available"
        else:
            return "Lower confidence - Limited supporting information available"