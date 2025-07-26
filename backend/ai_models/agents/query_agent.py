# agents/query_agent.py - ENHANCED FOR BETTER SITUATION DETECTION
"""
Enhanced Query Agent - Better emotional situation analysis
"""

from typing import Dict, Any, List, Optional
import json
import re
from agents.base import BaseAgent, AgentResponse
from config.prompts import (
    QUERY_ANALYSIS_PROMPT,
    QUERY_DECOMPOSITION_PROMPT,
    CRISIS_DETECTION_PROMPT
)

class QueryAgent(BaseAgent):
    """Enhanced query analysis for emotional support"""
    
    def __init__(self, llm_manager: Any, config: Any):
        super().__init__("query_analyzer", llm_manager, config)
        
        # Emotional situation patterns
        self.situation_patterns = {
            "overwhelm": {
                "keywords": ["overwhelmed", "too much", "can't handle", "drowning", "catch my breath", "everything feels"],
                "emotions": ["overwhelmed", "exhausted", "drowning"],
                "needs": ["breathing space", "break things down", "one step at a time", "grounding"]
            },
            "loneliness": {
                "keywords": ["alone", "nobody understands", "friends", "isolated", "disconnected", "left behind", "stuck"],
                "emotions": ["lonely", "isolated", "misunderstood", "left out"],
                "needs": ["connection", "understanding", "validation of struggle", "not alone"]
            },
            "anxiety": {
                "keywords": ["anxious", "worried", "panic", "racing thoughts", "can't stop thinking", "what if", "nervous"],
                "emotions": ["anxious", "panicked", "worried", "fearful"],
                "needs": ["calming techniques", "grounding", "reassurance", "thought management"]
            },
            "numbness": {
                "keywords": ["numb", "empty", "nothing", "don't feel", "going through motions", "disconnected", "blank"],
                "emotions": ["numb", "empty", "disconnected", "absent"],
                "needs": ["gentle reconnection", "professional support", "tiny steps", "validation"]
            },
            "depression": {
                "keywords": ["depressed", "hopeless", "worthless", "can't get up", "no point", "tired of", "give up"],
                "emotions": ["depressed", "hopeless", "exhausted", "defeated"],
                "needs": ["hope without dismissal", "professional support", "gentle encouragement", "validation"]
            },
            "fear": {
                "keywords": ["scared", "terrified", "afraid", "fear", "what if", "worried about", "nightmare"],
                "emotions": ["scared", "terrified", "fearful", "worried"],
                "needs": ["safety", "reassurance", "coping strategies", "reality check"]
            },
            "anger": {
                "keywords": ["angry", "pissed", "furious", "rage", "hate", "frustrated", "mad"],
                "emotions": ["angry", "frustrated", "resentful", "furious"],
                "needs": ["validation of anger", "safe expression", "underlying needs", "permission to feel"]
            }
        }
    
    async def process(self, 
                     query: str, 
                     context: Optional[Dict[str, Any]] = None) -> AgentResponse:
        """
        Enhanced analysis for emotional support queries, now using LLM for query type classification
        """
        try:
            # Use LLM to classify query type
            query_type = await self._classify_query_type(query)

            # First, check for crisis indicators (for emotional queries)
            crisis_check = {"crisis_detected": False, "severity": "none"}
            situation_analysis = {
                "primary_emotion": None,
                "situation_description": None,
                "emotional_tone": None,
                "category": None,
                "confidence": 0.0
            }
            immediate_needs = []
            if query_type == "emotional":
                crisis_check = await self._check_crisis(query)
                situation_analysis = self._analyze_situation(query)
                immediate_needs = self._identify_immediate_needs(query, situation_analysis)

            # Set web/local KB usage based on query type
            use_web_only = query_type in ["factual", "practical"]
            requires_current_info = use_web_only

            # Build enhanced analysis
            analysis = {
                "intent": query_type + ("_support" if query_type == "emotional" else ""),
                "primary_emotion": situation_analysis["primary_emotion"],
                "specific_situation": situation_analysis["situation_description"],
                "immediate_needs": immediate_needs,
                "emotional_tone": situation_analysis["emotional_tone"],
                "urgency_level": crisis_check.get("severity", "moderate"),
                "keywords": self._extract_key_phrases(query),
                "requires_professional": self._needs_professional_support(situation_analysis, crisis_check) if query_type == "emotional" else False,
                "query_type": query_type,
                "complexity": "moderate" if query_type == "emotional" else "simple",
                "situation_category": situation_analysis["category"],
                "requires_current_info": requires_current_info,
                "use_web_only": use_web_only
            }

            # Add crisis information if detected
            if query_type == "emotional" and crisis_check.get("crisis_detected", False):
                analysis["crisis_indicators"] = crisis_check
                analysis["urgency_level"] = "critical"

            return AgentResponse(
                success=True,
                data=analysis,
                metadata={
                    "original_query": query,
                    "situation_detected": situation_analysis["category"],
                    "confidence_in_detection": situation_analysis["confidence"],
                    "query_type": query_type
                },
                confidence=0.95
            )

        except Exception as e:
            self.logger.error(f"Query analysis failed: {e}")
            # Return basic analysis on failure
            return AgentResponse(
                success=True,
                data={
                    "intent": "emotional_support",
                    "query_type": "emotional",
                    "emotional_tone": "distressed",
                    "urgency_level": "moderate",
                    "keywords": query.lower().split()[:5],
                    "immediate_needs": ["emotional support", "validation", "understanding"],
                    "requires_current_info": False,
                    "use_web_only": False
                },
                metadata={"error": str(e)},
                confidence=0.6
            )
    
    async def _classify_query_type(self, query: str) -> str:
        """Use Groq for reliable query classification"""
        prompt = """Classify the following mental health query into exactly one of these types:
- 'factual': Questions about statistics, facts, definitions, research, symptoms, causes, or general information (e.g., "What are the symptoms of depression?", "How common is PTSD?", "What is the DSM-5?")
- 'practical': Questions asking for advice, steps, coping strategies, or how to do something (e.g., "How do I deal with stress?", "What should I do about my anxiety?", "How can I manage panic attacks?")
- 'emotional': Expressions of feelings or emotional support needs (e.g., "I feel so overwhelmed", "I can't handle this anymore", "I feel hopeless")

Return ONLY the type as a single lowercase word.

Query: {query}
Type:""".format(query=query)

        try:
            # Use Groq for fast, reliable classification
            result = await self.llm_manager.ainvoke_async(prompt, use_classification=True, temperature=0.1)
            result = result.strip().lower()
            if result in ["factual", "practical", "emotional"]:
                self.logger.info(f"Groq classified query as: {result.upper()}")
                return result

            # Enhanced rule-based fallback classification
            query_lower = query.lower()
            
            # Strong emotional indicators - check these first
            strong_emotional_patterns = [
                "i feel", "i'm feeling", "feeling", "felt",
                "i am", "i'm", "i can't", "i cant", "i don't",
                "overwhelm", "overwhelmed", "anxious", "worried", "scared", "angry",
                "sad", "depressed", "lonely", "alone", "hopeless", "stress", "upset",
                "hate", "love", "hurt", "pain", "empty", "numb", "meaningless",
                "can't cope", "can't handle", "too much", "everything feels"
            ]
            
            # Check for strong emotional patterns first
            if any(pattern in query_lower for pattern in strong_emotional_patterns):
                self.logger.info(f"Fallback classified as EMOTIONAL due to pattern match")
                return "emotional"
            
            # Factual patterns - questions about information, research, definitions
            factual_patterns = [
                "what is", "what are", "what does", "define", "definition",
                "according to", "dsm", "research shows", "studies show",
                "symptoms of", "causes of", "signs of", "diagnosis",
                "how common", "how many", "what percentage", "statistics",
                "difference between", "types of", "kinds of",
                "when was", "who developed", "where did", "which",
                "latest", "recent", "new studies"
            ]
            
            if any(pattern in query_lower for pattern in factual_patterns):
                self.logger.info(f"Fallback classified as FACTUAL due to pattern match")
                return "factual"
            
            # Practical advice patterns - how-to and action-oriented
            practical_patterns = [
                "how do i", "how to", "how can i", "what should i do",
                "ways to", "steps to", "strategies", "techniques",
                "help me", "can you help", "what can i do",
                "coping", "manage", "deal with", "handle",
                "what techniques", "what are some", "effective"
            ]
            
            if any(pattern in query_lower for pattern in practical_patterns):
                self.logger.info(f"Fallback classified as PRACTICAL due to pattern match")
                return "practical"
            
            # Final fallback - statements are usually emotional, questions depend on structure
            if query.endswith("?"):
                # Questions that didn't match factual patterns are likely practical
                self.logger.info(f"Final fallback: Question classified as PRACTICAL")
                return "practical"
            else:
                # Statements are usually emotional
                self.logger.info(f"Final fallback: Statement classified as EMOTIONAL")
                return "emotional"
                
        except Exception as e:
            self.logger.error(f"Groq query classification failed: {e}")
            # Final fallback based on question structure
            query_lower = query.lower()
            if any(word in query_lower for word in ["what is", "what are", "symptoms", "dsm", "according to"]):
                return "factual"
            elif query.endswith("?"):
                return "practical" 
            else:
                return "emotional"

    def _analyze_situation(self, query: str) -> Dict[str, Any]:
        """Analyze the specific emotional situation"""
        query_lower = query.lower()
        
        # Score each situation category
        situation_scores = {}
        for category, patterns in self.situation_patterns.items():
            score = 0
            
            # Check keywords
            for keyword in patterns["keywords"]:
                if keyword in query_lower:
                    score += 2
            
            # Check partial matches
            for keyword in patterns["keywords"]:
                words = keyword.split()
                if len(words) > 1 and any(word in query_lower for word in words):
                    score += 1
            
            situation_scores[category] = score
        
        # Get the highest scoring situation
        best_category = max(situation_scores, key=situation_scores.get)
        confidence = min(1.0, situation_scores[best_category] / 10)
        
        # If no clear match, analyze more carefully
        if confidence < 0.3:
            best_category = self._deep_situation_analysis(query)
            confidence = 0.6
        
        # Get situation details
        situation_info = self.situation_patterns[best_category]
        
        # Create detailed description
        situation_description = self._create_situation_description(query, best_category)
        
        return {
            "category": best_category,
            "primary_emotion": situation_info["emotions"][0],
            "all_emotions": situation_info["emotions"],
            "emotional_tone": situation_info["emotions"][0],
            "situation_description": situation_description,
            "confidence": confidence
        }
    
    def _deep_situation_analysis(self, query: str) -> str:
        """Deeper analysis when simple pattern matching fails"""
        query_lower = query.lower()
        
        # Check for specific phrases
        if "can't" in query_lower and ("anymore" in query_lower or "handle" in query_lower):
            return "overwhelm"
        elif "nobody" in query_lower or "no one" in query_lower or "alone" in query_lower:
            return "loneliness"
        elif "at night" in query_lower or "can't sleep" in query_lower or "racing" in query_lower:
            return "anxiety"
        elif "feel" in query_lower and ("nothing" in query_lower or "empty" in query_lower):
            return "numbness"
        elif "never" in query_lower or "always" in query_lower or "forever" in query_lower:
            return "fear"
        elif "morning" in query_lower or "wake up" in query_lower:
            return "depression"
        else:
            return "overwhelm"  # Default
    
    def _create_situation_description(self, query: str, category: str) -> str:
        """Create a specific description of their situation"""
        descriptions = {
            "overwhelm": "feeling like everything is too much to handle",
            "loneliness": "feeling disconnected and misunderstood by others",
            "anxiety": "experiencing racing thoughts and worry",
            "numbness": "feeling emotionally disconnected and empty",
            "depression": "struggling with hopelessness and low mood",
            "fear": "dealing with intense worry about the future",
            "anger": "struggling with anger and related guilt"
        }
        
        base_description = descriptions.get(category, "going through emotional distress")
        
        # Add specifics from their query
        if "work" in query.lower():
            base_description += " related to work"
        elif "friend" in query.lower():
            base_description += " in relationships"
        elif "night" in query.lower():
            base_description += " especially at night"
        elif "morning" in query.lower():
            base_description += " particularly in the mornings"
        
        return base_description
    
    def _identify_immediate_needs(self, query: str, situation_analysis: Dict) -> List[str]:
        """Identify specific immediate needs based on situation"""
        category = situation_analysis["category"]
        base_needs = self.situation_patterns[category]["needs"]
        
        # Customize based on query specifics
        specific_needs = []
        query_lower = query.lower()
        
        # Add first two base needs
        specific_needs.extend(base_needs[:2])
        
        # Add query-specific needs
        if "right now" in query_lower or "can't" in query_lower:
            specific_needs.append("immediate coping strategy")
        
        if "?" in query:  # They're asking a question
            specific_needs.append("answers and understanding")
        
        if "help" in query_lower:
            specific_needs.append("practical support")
        
        # Limit to 4 needs
        return specific_needs[:4]
    
    def _extract_key_phrases(self, query: str) -> List[str]:
        """Extract meaningful phrases from the query"""
        # Split into phrases
        phrases = re.split(r'[,.]', query)
        
        # Get important phrases (not just single words)
        key_phrases = []
        for phrase in phrases:
            phrase = phrase.strip()
            if len(phrase.split()) >= 2 and len(phrase) < 50:
                key_phrases.append(phrase.lower())
        
        # Also add emotion words
        emotion_words = re.findall(r'\b(overwhelmed|anxious|scared|angry|numb|empty|alone|stuck)\b', query.lower())
        key_phrases.extend(emotion_words)
        
        return list(set(key_phrases))[:5]
    
    def _needs_professional_support(self, situation_analysis: Dict, crisis_check: Dict) -> bool:
        """Determine if professional support should be mentioned"""
        # Crisis always needs professional support
        if crisis_check.get("crisis_detected", False):
            return True
        
        # Certain situations benefit from professional support
        high_need_categories = ["numbness", "depression", "fear"]
        if situation_analysis["category"] in high_need_categories:
            return True
        
        # Low confidence in our analysis suggests complexity
        if situation_analysis["confidence"] < 0.5:
            return True
        
        return False
    
    async def _check_crisis(self, query: str) -> Dict[str, Any]:
        """Enhanced crisis detection using Llama Guard + existing logic"""
        
        # First, use existing crisis detection for immediate safety check
        manual_crisis_keywords = [
            "suicide", "kill myself", "end it", "can't go on",
            "no point", "give up", "better off dead", "hurt myself",
            "self harm", "cutting", "overdose", "want to die"
        ]
        
        query_lower = query.lower()
        immediate_crisis = any(keyword in query_lower for keyword in manual_crisis_keywords)
        
        if immediate_crisis:
            # Immediate crisis detected - don't wait for LLM
            return {
                "crisis_detected": True,
                "severity": "critical",
                "confidence": 0.95,
                "immediate_crisis": True,
                "specific_concerns": [kw for kw in manual_crisis_keywords if kw in query_lower],
                "needs_immediate_help": True,
                "professional_support_needed": True,
                "llm_check": "skipped_immediate_crisis"
            }
        
        # Use Llama Guard for nuanced crisis detection
        guard_prompt = f"""You are analyzing a message for crisis indicators. Respond with either "SAFE" or "UNSAFE".

Consider UNSAFE if the message contains:
- Suicidal ideation or self-harm intentions
- Immediate danger to self or others
- Severe mental health crisis requiring immediate intervention
- Plans or methods for self-harm

Consider SAFE if the message is:
- General emotional distress without immediate danger
- Seeking help or support
- Expressing sadness without suicidal ideation
- Asking for coping strategies

Message: "{query}"

Classification:"""
        
        try:
            # Use Llama Guard for crisis detection
            guard_response = await self.llm_manager.ainvoke_async(
                guard_prompt, 
                use_crisis=True, 
                temperature=0.1
            )
            
            guard_response = guard_response.strip().upper()
            llm_crisis_detected = "UNSAFE" in guard_response
            
            # Enhanced analysis using regular crisis prompt for details
            if llm_crisis_detected:
                crisis_prompt = CRISIS_DETECTION_PROMPT.format(message=query)
                try:
                    crisis_details = await self.llm_manager.ainvoke_async(
                        crisis_prompt, 
                        use_classification=True,
                        temperature=0.2
                    )
                    # Try to parse as JSON, fallback to structured response
                    import json
                    try:
                        crisis_response = json.loads(crisis_details)
                    except:
                        # Create structured response from text
                        crisis_response = {
                            "crisis_detected": True,
                            "severity": "high",
                            "specific_concerns": ["detected by llama guard"],
                            "needs_immediate_help": True,
                            "professional_support_needed": True
                        }
                except Exception as e:
                    self.logger.error(f"Crisis details extraction failed: {e}")
                    crisis_response = {
                        "crisis_detected": True,
                        "severity": "moderate",
                        "specific_concerns": ["llm detection"],
                        "needs_immediate_help": False,
                        "professional_support_needed": True
                    }
                
                # Add Llama Guard info
                crisis_response["llm_check"] = "llama_guard_unsafe"
                crisis_response["guard_response"] = guard_response
                return crisis_response
            
            else:
                # No crisis detected by Llama Guard
                return {
                    "crisis_detected": False,
                    "severity": "none",
                    "confidence": 0.8,
                    "specific_concerns": [],
                    "needs_immediate_help": False,
                    "professional_support_needed": False,
                    "llm_check": "llama_guard_safe",
                    "guard_response": guard_response
                }
                
        except Exception as e:
            self.logger.error(f"Llama Guard crisis detection failed: {e}")
            # Fallback to enhanced manual detection
            
            # More comprehensive crisis patterns
            crisis_patterns = [
                "can't take it", "can't do this", "want it to end", "nothing left",
                "no hope", "hopeless", "pointless", "meaningless life",
                "everyone would be better", "burden", "worthless",
                "tired of living", "tired of everything", "give up on life"
            ]
            
            pattern_crisis = any(pattern in query_lower for pattern in crisis_patterns)
            
            return {
                "crisis_detected": pattern_crisis,
                "severity": "moderate" if pattern_crisis else "none",
                "confidence": 0.6 if pattern_crisis else 0.8,
                "specific_concerns": [p for p in crisis_patterns if p in query_lower],
                "needs_immediate_help": pattern_crisis,
                "professional_support_needed": pattern_crisis,
                "llm_check": "failed_fallback_used"
            }