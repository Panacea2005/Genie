# refinement/cove.py
"""
Enhanced Chain of Verification (CoVe) - Quality-focused response refinement
Intelligently enhances responses while maintaining speed
"""

from typing import List, Dict, Any, Tuple, Optional
import asyncio
import logging
import re
from dataclasses import dataclass
from config.settings import config

logger = logging.getLogger(__name__)

@dataclass
class ResponseQualityMetrics:
    """Metrics for evaluating response quality"""
    has_empathy: bool = False
    has_specifics: bool = False
    has_citations: bool = False
    has_structure: bool = False
    has_personal_touch: bool = False
    has_actionable_advice: bool = False
    has_professional_disclaimer: bool = False
    word_count: int = 0
    sentence_count: int = 0
    paragraph_count: int = 0
    readability_score: float = 0.0
    overall_quality_score: float = 0.0

class ChainOfVerification:
    """Enhanced CoVe for intelligent response refinement"""
    
    def __init__(self, llm_manager: Any):
        self.llm_manager = llm_manager
        self.config = config.quality
        
        # Enhanced quality criteria
        self.quality_criteria = {
            "empathy_markers": [
                "understand", "hear you", "feeling", "it's okay", "valid",
                "difficult", "challenging", "normal to feel", "not alone",
                "appreciate you sharing", "thank you for", "sounds like"
            ],
            "specificity_markers": [
                "for example", "specifically", "such as", "like", "including",
                "in particular", "especially", "notably", "for instance"
            ],
            "citation_pattern": r'\[\d+\]',
            "structure_markers": ["\n\n", "•", ":", "First,", "Second,", "Finally,", 
                                "1.", "2.", "Additionally", "Moreover", "Furthermore"],
            "personal_pronouns": ["you", "your", "you're", "you'll", "you've", "yourself"],
            "action_words": [
                "try", "consider", "might help", "you can", "one way",
                "start by", "begin with", "practice", "explore", "experiment"
            ],
            "professional_terms": [
                "professional", "therapist", "counselor", "doctor", "specialist",
                "healthcare provider", "mental health professional", "clinician"
            ],
            "confidence_boosters": [
                "research shows", "studies indicate", "evidence suggests",
                "proven", "effective", "demonstrated", "clinically"
            ]
        }
        
        # Response enhancement templates
        self.enhancement_templates = {
            "add_empathy": "I understand this is important to you. {original}",
            "add_validation": "{original} Your feelings about this are completely valid.",
            "add_encouragement": "{original} Remember, taking this step shows real strength.",
            "add_example": "{original} For example, {example}",
            "add_actionable": "{original} You might start by {action}",
            "add_disclaimer": "{original}\n\n*Please note: While I can offer information and support, it's always best to consult with a mental health professional for personalized guidance.*"
        }
    
    async def refine_response(self, 
                            response: str, 
                            context: List[Dict],
                            query_analysis: Dict = None,
                            response_type: str = "general") -> str:
        """
        Intelligently refine response based on quality gaps and response type
        """
        try:
            # Analyze current response quality
            quality_metrics = self._analyze_response_quality(response, response_type)
            
            # Determine if refinement is needed
            if quality_metrics.overall_quality_score >= self.config.cove_quality_threshold:
                logger.info(f"Response quality score: {quality_metrics.overall_quality_score:.2f} - No refinement needed")
                return response
            
            # Identify specific improvements needed
            improvements_needed = self._identify_improvements(quality_metrics, response_type)
            
            if not improvements_needed:
                return response
            
            # Apply targeted enhancements
            enhanced_response = await self._apply_enhancements(
                response, improvements_needed, context, response_type
            )
            
            # Validate enhancement
            if self._validate_enhancement(response, enhanced_response):
                # Apply final polish
                polished_response = self._final_polish(enhanced_response, response_type)
                return polished_response
            else:
                logger.warning("Enhancement validation failed, returning original")
                return response
                
        except Exception as e:
            logger.error(f"CoVe refinement error: {e}")
            return response
    
    def _analyze_response_quality(self, response: str, response_type: str) -> ResponseQualityMetrics:
        """Comprehensive analysis of response quality"""
        metrics = ResponseQualityMetrics()
        response_lower = response.lower()
        
        # Basic metrics
        metrics.word_count = len(response.split())
        metrics.sentence_count = len(re.split(r'[.!?]+', response))
        metrics.paragraph_count = len(response.strip().split('\n\n'))
        
        # Quality indicators
        metrics.has_empathy = any(marker in response_lower for marker in self.quality_criteria["empathy_markers"])
        metrics.has_specifics = any(marker in response_lower for marker in self.quality_criteria["specificity_markers"])
        metrics.has_citations = bool(re.search(self.quality_criteria["citation_pattern"], response))
        metrics.has_structure = any(marker in response for marker in self.quality_criteria["structure_markers"])
        metrics.has_personal_touch = response.lower().count("you") >= 3
        metrics.has_actionable_advice = any(word in response_lower for word in self.quality_criteria["action_words"])
        metrics.has_professional_disclaimer = any(term in response_lower for term in self.quality_criteria["professional_terms"])
        
        # Calculate readability (simple metric)
        if metrics.sentence_count > 0:
            avg_words_per_sentence = metrics.word_count / metrics.sentence_count
            metrics.readability_score = 1.0 if 10 <= avg_words_per_sentence <= 20 else 0.7
        
        # Calculate overall quality score based on response type
        metrics.overall_quality_score = self._calculate_quality_score(metrics, response_type)
        
        return metrics
    
    def _calculate_quality_score(self, metrics: ResponseQualityMetrics, response_type: str) -> float:
        """Calculate overall quality score based on response type"""
        score = 0.0
        weights = self._get_quality_weights(response_type)
        
        # Apply weighted scoring
        if metrics.has_empathy:
            score += weights.get("empathy", 0.1)
        if metrics.has_specifics:
            score += weights.get("specifics", 0.15)
        if metrics.has_citations:
            score += weights.get("citations", 0.15)
        if metrics.has_structure:
            score += weights.get("structure", 0.1)
        if metrics.has_personal_touch:
            score += weights.get("personal", 0.15)
        if metrics.has_actionable_advice:
            score += weights.get("actionable", 0.15)
        if metrics.has_professional_disclaimer and response_type in ["emotional_support", "practical_guidance"]:
            score += weights.get("disclaimer", 0.1)
        
        # Length appropriateness
        if self.config.min_response_length <= metrics.word_count <= self.config.max_response_length:
            score += weights.get("length", 0.1)
        
        # Readability bonus
        score += metrics.readability_score * weights.get("readability", 0.05)
        
        return min(1.0, score)
    
    def _get_quality_weights(self, response_type: str) -> Dict[str, float]:
        """Get quality weights based on response type"""
        weights = {
            "emotional_support": {
                "empathy": 0.25, "specifics": 0.1, "citations": 0.05,
                "structure": 0.1, "personal": 0.2, "actionable": 0.15,
                "disclaimer": 0.1, "length": 0.05, "readability": 0.05
            },
            "factual_explanation": {
                "empathy": 0.05, "specifics": 0.25, "citations": 0.25,
                "structure": 0.15, "personal": 0.05, "actionable": 0.1,
                "disclaimer": 0.05, "length": 0.05, "readability": 0.05
            },
            "practical_guidance": {
                "empathy": 0.1, "specifics": 0.15, "citations": 0.1,
                "structure": 0.2, "personal": 0.15, "actionable": 0.25,
                "disclaimer": 0.05, "length": 0.05, "readability": 0.05
            },
            "conversational": {
                "empathy": 0.15, "specifics": 0.15, "citations": 0.1,
                "structure": 0.1, "personal": 0.2, "actionable": 0.15,
                "disclaimer": 0.05, "length": 0.05, "readability": 0.05
            }
        }
        return weights.get(response_type, weights["conversational"])
    
    def _identify_improvements(self, metrics: ResponseQualityMetrics, response_type: str) -> List[str]:
        """Identify specific improvements needed"""
        improvements = []
        
        # Response type specific improvements
        if response_type == "emotional_support":
            if not metrics.has_empathy:
                improvements.append("add_empathy")
            if not metrics.has_personal_touch:
                improvements.append("add_personal_touch")
            if not metrics.has_professional_disclaimer:
                improvements.append("add_disclaimer")
                
        elif response_type == "factual_explanation":
            if not metrics.has_specifics:
                improvements.append("add_examples")
            if not metrics.has_citations:
                improvements.append("add_citations")
            if not metrics.has_structure and metrics.word_count > 200:
                improvements.append("improve_structure")
                
        elif response_type == "practical_guidance":
            if not metrics.has_actionable_advice:
                improvements.append("add_actionable_steps")
            if not metrics.has_structure:
                improvements.append("add_numbered_steps")
            if not metrics.has_personal_touch:
                improvements.append("add_encouragement")
        
        # Universal improvements
        if metrics.word_count < self.config.min_response_length:
            improvements.append("expand_content")
        elif metrics.word_count > self.config.max_response_length:
            improvements.append("condense_content")
        
        if not metrics.has_citations and self.config.require_citations:
            improvements.append("add_citations")
        
        return improvements[:3]  # Limit to top 3 improvements
    
    async def _apply_enhancements(self, response: str, improvements: List[str], 
                                 context: List[Dict], response_type: str) -> str:
        """Apply specific enhancements to the response"""
        
        # Build enhancement prompt
        enhancement_instructions = []
        
        for improvement in improvements:
            if improvement == "add_empathy":
                enhancement_instructions.append(
                    "Add a warm, empathetic acknowledgment that shows understanding"
                )
            elif improvement == "add_personal_touch":
                enhancement_instructions.append(
                    "Use 'you' and 'your' more frequently to make it personal"
                )
            elif improvement == "add_examples":
                enhancement_instructions.append(
                    "Include 1-2 specific examples to illustrate key points"
                )
            elif improvement == "add_citations":
                enhancement_instructions.append(
                    "Add [1], [2] citations to support main claims"
                )
            elif improvement == "improve_structure":
                enhancement_instructions.append(
                    "Organize into clear paragraphs with smooth transitions"
                )
            elif improvement == "add_actionable_steps":
                enhancement_instructions.append(
                    "Include 2-3 specific, actionable steps the reader can take"
                )
            elif improvement == "add_numbered_steps":
                enhancement_instructions.append(
                    "Structure advice as numbered steps for clarity"
                )
            elif improvement == "add_encouragement":
                enhancement_instructions.append(
                    "Add encouraging language to motivate action"
                )
            elif improvement == "add_disclaimer":
                enhancement_instructions.append(
                    "Include a gentle reminder about consulting professionals"
                )
            elif improvement == "expand_content":
                enhancement_instructions.append(
                    f"Expand to approximately {self.config.target_response_length} words with more detail"
                )
            elif improvement == "condense_content":
                enhancement_instructions.append(
                    f"Condense to approximately {self.config.target_response_length} words while keeping key points"
                )
        
        # Create enhancement prompt
        prompt = f"""Enhance this response with specific improvements.

Original response:
{response}

Response type: {response_type}

Improvements needed:
{chr(10).join(f'- {inst}' for inst in enhancement_instructions)}

Guidelines:
1. Maintain the original message and tone
2. Make enhancements feel natural and integrated
3. Keep response length appropriate ({self.config.min_response_length}-{self.config.max_response_length} words)
4. Ensure all original information is preserved
5. Use conversational, warm language

Enhanced response:"""

        try:
            # Use appropriate temperature for response type
            temperature = config.model.temperature_by_type.get(response_type, 0.5)
            enhanced = await self.llm_manager.ainvoke(prompt, temperature=temperature, max_tokens=1000)
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Enhancement generation failed: {e}")
            return response
    
    def _validate_enhancement(self, original: str, enhanced: str) -> bool:
        """Validate that enhancement is actually an improvement"""
        
        # Basic validation
        if len(enhanced) < 50:
            return False
        
        # Ensure we didn't lose too much content
        if len(enhanced) < len(original) * 0.5:
            return False
        
        # Check for quality improvements
        original_metrics = self._analyze_response_quality(original, "general")
        enhanced_metrics = self._analyze_response_quality(enhanced, "general")
        
        # Must show improvement
        return enhanced_metrics.overall_quality_score > original_metrics.overall_quality_score
    
    def _final_polish(self, response: str, response_type: str) -> str:
        """Apply final polish for natural flow"""
        polished = response
        
        # Make language more natural with contractions
        if response_type != "factual_explanation":  # Keep formal tone for factual
            contractions = [
                (r"\bit is\b", "it's"),
                (r"\byou are\b", "you're"),
                (r"\bdo not\b", "don't"),
                (r"\bcannot\b", "can't"),
                (r"\bwill not\b", "won't"),
                (r"\bwould not\b", "wouldn't"),
                (r"\bshould not\b", "shouldn't"),
                (r"\bhave not\b", "haven't"),
                (r"\bhas not\b", "hasn't"),
                (r"\bdid not\b", "didn't"),
                (r"\bthat is\b", "that's"),
                (r"\blet us\b", "let's")
            ]
            
            for pattern, replacement in contractions:
                polished = re.sub(pattern, replacement, polished, flags=re.IGNORECASE)
        
        # Ensure proper paragraph structure
        if len(polished) > 400 and polished.count('\n\n') < 2:
            # Add paragraph breaks at natural points
            sentences = re.split(r'(?<=[.!?])\s+', polished)
            if len(sentences) > 6:
                # Insert break after first third
                third = len(sentences) // 3
                polished = ' '.join(sentences[:third]) + '\n\n' + ' '.join(sentences[third:])
        
        # Ensure strong ending
        if response_type == "emotional_support" and not any(end in polished[-100:].lower() for end in ["here for you", "support", "help", "reach out"]):
            polished += "\n\nRemember, you're not alone in this, and support is always available when you need it."
        elif response_type == "practical_guidance" and not any(end in polished[-100:].lower() for end in ["start", "begin", "try", "practice"]):
            polished += "\n\nStart with whichever step feels most manageable for you right now."
        
        # Clean up any double spaces or weird formatting
        polished = re.sub(r'\s+', ' ', polished)
        polished = re.sub(r'\n\s*\n\s*\n', '\n\n', polished)
        
        return polished.strip()
    
    async def quick_enhance(self, response: str, enhancement_type: str) -> str:
        """Quick single-purpose enhancement"""
        if enhancement_type == "add_warmth":
            return f"I understand. {response}"
        elif enhancement_type == "add_validation":
            return f"{response} Your feelings about this are completely valid."
        elif enhancement_type == "add_encouragement":
            return f"{response} You're taking a positive step by exploring this."
        elif enhancement_type == "add_disclaimer":
            return f"{response}\n\n*Remember to consult with a healthcare professional for personalized advice.*"
        else:
            return response