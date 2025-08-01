# agents/synthesis_agent.py - FIXED PROMPT ISSUE
"""
Enhanced Synthesis Agent V2 - FIXED: Uses centralized prompts and prevents prompt leakage
"""

from typing import Dict, Any, List, Optional
import json
import re
import logging
from agents.base import BaseAgent, AgentResponse
from refinement.cove import ChainOfVerification
from config.prompts import (
    FACTUAL_RESPONSE_PROMPT, 
    PRACTICAL_RESPONSE_PROMPT,
    EMOTIONAL_SUPPORT_PROMPT,
    SYNTHESIS_PROMPT
)
import random

logger = logging.getLogger(__name__)

class SynthesisAgent(BaseAgent):
    """Creates warm, varied, situation-specific emotional support responses"""
    
    def __init__(self, llm_manager: Any, config: Any):
        super().__init__("response_synthesizer", llm_manager, config)
        self.cove = ChainOfVerification(llm_manager) if config.agent.enable_cove else None
        
        # Situation-specific response patterns
        self.response_patterns = {
            "overwhelm": {
                "openers": [
                    "Oh wow, I can really feel how heavy everything is for you right now.",
                    "That feeling of drowning in everything... I hear you, and it's so valid.",
                    "When everything piles up like that, it's absolutely exhausting. I get it."
                ],
                "validations": [
                    "Your body and mind are telling you it's too much, and they're right - it IS a lot.",
                    "No wonder you can't catch your breath - you're carrying so much.",
                    "This isn't about being weak - you're actually incredibly strong for reaching out."
                ],
                "specific_support": [
                    "Right now, let's just focus on this moment. Not tomorrow, not next week - just right now. What's one tiny thing that might help you feel 1% lighter?",
                    "Sometimes when I'm drowning like this, I literally just focus on my breathing for 30 seconds. In for 4, hold for 4, out for 6. Want to try it together?",
                    "Can we break this down to just the next hour? What absolutely HAS to happen, and what can wait?"
                ]
            },
            "loneliness": {
                "openers": [
                    "Oof, that comparison trap is so painful. Feeling left behind while everyone else seems to have it figured out.",
                    "That disconnect from your friends... it's one of the loneliest feelings, isn't it?",
                    "I hear how isolated you're feeling, especially when it seems like nobody gets what you're going through."
                ],
                "validations": [
                    "Your struggle is real, even if others can't see it. Not having it 'together' doesn't make you less than anyone.",
                    "It's so hard when the people who used to understand just... don't anymore.",
                    "You're not stuck because something's wrong with you - life just moves at different paces for everyone."
                ],
                "specific_support": [
                    "Have you considered that your friends might be struggling too, just in different ways? Sometimes everyone's just good at hiding it.",
                    "What if you reached out to just one friend with something small? Not the heavy stuff, just... connection?",
                    "There are people out there who DO get it. Support groups, online communities... you don't have to do this alone."
                ]
            },
            "anxiety_night": {
                "openers": [
                    "Those racing thoughts at night are torture. When your mind won't stop spinning worst-case scenarios...",
                    "Nighttime anxiety is the worst - when the world is quiet but your mind is SO loud.",
                    "I know that feeling when your thoughts just spiral and spiral in the dark."
                ],
                "validations": [
                    "Your brain is trying to protect you by preparing for danger, but it's exhausting when it won't turn off.",
                    "This isn't you being dramatic - nighttime anxiety is incredibly common and very real.",
                    "Those 'what-ifs' feel so real at 2am, don't they? Even when logically you know they're unlikely."
                ],
                "specific_support": [
                    "Here's something that helps me: I keep a notebook by my bed and literally dump all the worries onto paper. It's like telling my brain 'okay, I heard you, now let me sleep.'",
                    "Try the 5-4-3-2-1 technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. It pulls you back to the present.",
                    "What if you created a 'worry window'? Like 7-7:30pm is when you let yourself worry, then after that you remind your brain 'nope, worry time is over.'"
                ]
            },
            "numbness": {
                "openers": [
                    "That emptiness... when you can't even feel sad anymore, just nothing. That's such a heavy place to be.",
                    "Going through the motions when nothing feels real or meaningful - I hear how disconnected you feel.",
                    "That numbness can be scarier than sadness sometimes, can't it? When you just feel... blank."
                ],
                "validations": [
                    "Your mind might be protecting you from feeling too much all at once. Numbness is actually a survival mechanism.",
                    "This doesn't mean you're broken - sometimes our emotions need to shut down for a bit when they've been overwhelmed.",
                    "What you're experiencing has a name - emotional numbness - and it's more common than you might think."
                ],
                "specific_support": [
                    "Sometimes reconnecting starts tiny - like noticing the temperature of your shower or the taste of your coffee. No pressure to feel big emotions.",
                    "Would it help to do something that usually makes you feel SOMETHING? Even if it's just 10% of normal, that's still something.",
                    "This might be a good time to talk to a therapist who specializes in this. They have specific techniques for when emotions go offline like this."
                ]
            },
            "future_fear": {
                "openers": [
                    "That fear of being stuck like this forever... it's terrifying. I completely understand why you're scared.",
                    "The 'what if this is permanent' thoughts - those are some of the scariest thoughts we can have.",
                    "I hear how frightened you are that this might be your new normal. That's such a valid fear."
                ],
                "validations": [
                    "Of course you're scared - when you're in pain, it's hard to imagine it ever ending.",
                    "You're not broken. You're human, going through a really difficult time.",
                    "This fear shows how much you want to feel better. That desire itself is a sign of hope, even if you can't feel it."
                ],
                "specific_support": [
                    "Can I share something? I've known many people who felt exactly like this - that they'd never get better. They did. Not overnight, but they did.",
                    "Healing isn't linear. Some days are harder, some easier, but the trajectory over time tends to be upward, even with setbacks.",
                    "What if instead of 'getting better' we focused on 'feeling different'? Because feelings always shift, even if slowly."
                ]
            },
            "anger_guilt": {
                "openers": [
                    "That anger-guilt spiral is exhausting. Being mad and then beating yourself up for being mad...",
                    "I totally get it - feeling angry and then feeling bad ABOUT feeling angry. It's like you can't win.",
                    "That cycle of anger then guilt is so draining. Like your emotions are fighting each other."
                ],
                "validations": [
                    "Your anger is valid. Full stop. You don't need to earn the right to feel angry.",
                    "Anger is just an emotion telling you something's not okay. It's not bad or wrong - it's information.",
                    "You're allowed to be angry! It doesn't make you a bad person or ungrateful or any of that."
                ],
                "specific_support": [
                    "What if we found some safe ways to let that anger OUT? Screaming in the car, punching pillows, angry journaling?",
                    "Sometimes I write the angriest letter imaginable to whoever/whatever I'm mad at, then rip it up. It's weirdly satisfying.",
                    "Try this: instead of 'I shouldn't be angry,' try 'I'm angry AND that's okay.' Both things can be true."
                ]
            },
            "morning_dread": {
                "openers": [
                    "Oh, that moment of waking up and reality crashing back down... it's absolutely brutal.",
                    "That morning dread when consciousness means remembering all the pain - I know that feeling.",
                    "Waking up and immediately wanting to escape back to sleep... that's such a heavy way to start each day."
                ],
                "validations": [
                    "This is actually a really common depression symptom. Your brain is already exhausted before the day even starts.",
                    "It makes complete sense that you'd want to avoid that crushing feeling of remembering everything.",
                    "You're not lazy or weak - you're dealing with real emotional pain that hits hardest in the morning."
                ],
                "specific_support": [
                    "What if you put something tiny to look forward to right by your bed? A favorite song queued up, a nice smell, anything?",
                    "Some people find it helps to have a 'morning ritual' that's super gentle - like just sitting up and taking three deep breaths before getting up.",
                    "This level of morning dread might be worth talking to someone about. There are specific therapies that can help with this exact thing."
                ]
            },
            "panic_work": {
                "openers": [
                    "Having a panic attack at work must have been terrifying. And now the fear of going back... I totally get it.",
                    "Oh no, panic attacks are scary enough without having witnesses. I can understand why you're dreading going back.",
                    "That vulnerability of having a panic attack in front of colleagues... and now worrying what they think. That's so hard."
                ],
                "validations": [
                    "You are NOT weak. Panic attacks are a physical response - like fainting or getting sick. You couldn't control it.",
                    "Having a panic attack doesn't say anything about your competence or strength. It's a medical event, not a character flaw.",
                    "Most people are way more understanding than we think. They're probably more concerned than judgmental."
                ],
                "specific_support": [
                    "Could you maybe talk to one trusted colleague or HR? Having an ally at work can make such a difference.",
                    "What if you prepared a simple script? 'I had a medical episode, I'm getting help, thanks for understanding.'",
                    "Consider creating a 'panic plan' for work - where you can go, who you can text, what helps you ground yourself."
                ]
            }
        }
        
        # Closing warmth variations
        self.closings = [
            "You don't have to carry this alone. I'm right here with you, and I'm not going anywhere. 💙",
            "Take all the time you need. There's no rush to feel better. I'll be here through all of it.",
            "You matter so much, and your feelings are so valid. Sending you all my support and care.",
            "Remember: you're allowed to not be okay. I'm here for the messy, the hard, and everything in between.",
            "You're doing the best you can with an incredibly hard situation. That's enough. You're enough.",
            "I believe in your ability to get through this, even when you don't. Holding space for you here. ❤️",
            "This is tough, but you're tougher. And on days when you're not? That's okay too. I'm here.",
            "Sending you so much warmth and support. You're not alone in this, I promise."
        ]
    
    @staticmethod
    def format_history_for_prompt(history: Optional[List[Dict[str, Any]]]) -> str:
        """
        Formats the conversation history for inclusion in the LLM prompt.
        Includes system messages (critical context), user, and assistant turns.
        """
        if not history:
            return ""
        lines = []
        for msg in history:
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")
            # Only include non-empty content
            if content:
                lines.append(f"{role}: {content}")
        return "\n".join(lines)

    async def process(self,
                     verified_results: List[Dict[str, Any]],
                     query_analysis: Dict[str, Any],
                     original_query: str,
                     conversation_history: List[Dict] = None,
                     model_preference: Optional[str] = None) -> AgentResponse:
        """
        Create a comprehensive response with proper citations and source integration
        """
        try:
            # Determine query type and response strategy
            query_type = query_analysis.get("query_type", "").lower()
            intent = query_analysis.get("intent", "").lower()
            
            # For factual/informational queries, create informative response with citations
            if query_type in ["factual", "informational"] or intent in ["information_seeking", "education"]:
                response = await self._create_informational_response_fixed(
                    original_query,
                    query_analysis,
                    verified_results,
                    model_preference,
                    conversation_history
                )
                response_type = "informational"
                confidence = 0.85
            
            # For emotional support, create warm supportive response  
            elif intent in ["emotional_support", "conversation"]:
                # Detect specific emotional situations for tailored responses
                situation = self._detect_situation(original_query, query_analysis)
                response = await self._create_situation_specific_response(
                    situation, original_query, query_analysis, verified_results, model_preference, conversation_history
                )
                response_type = "emotional_support"
                confidence = 0.75
            
            # For practical guidance, blend information with support
            elif intent in ["practical_guidance", "help_seeking"]:
                response = await self._create_practical_guidance_response_fixed(
                    original_query,
                    query_analysis, 
                    verified_results,
                    model_preference,
                    conversation_history
                )
                response_type = "practical_guidance"
                confidence = 0.8
            
            # Default case - determine best approach based on query content
            else:
                if verified_results and len(verified_results) > 0:
                    # If we have good sources, create informational response
                    response = await self._create_informational_response_fixed(
                        original_query,
                        query_analysis,
                        verified_results,
                        model_preference,
                        conversation_history
                    )
                    response_type = "informational"
                    confidence = 0.7
                else:
                    # Fallback to basic supportive response
                    response = self._create_warm_fallback(original_query)
                    response_type = "emotional_support"
                    confidence = 0.6
            
            # Format sources for response output
            formatted_sources = self._format_sources(verified_results)
            
            # Ensure sources is always a list of dicts
            safe_sources = formatted_sources
            if isinstance(formatted_sources, str):
                safe_sources = [{"text": formatted_sources}]
            elif not isinstance(formatted_sources, list):
                safe_sources = []
            return AgentResponse(
                success=True,
                data={
                    "response": response,
                    "confidence": confidence,
                    "response_type": response_type,
                    "sources": safe_sources,
                    "query_analysis": query_analysis
                },
                confidence=confidence,
                metadata={
                    "response_type": response_type,
                    "sources_used": len(verified_results),
                    "query_type": query_type,
                    "intent": intent
                }
            )
            
        except Exception as e:
            logger.error(f"Synthesis failed: {e}", exc_info=True)
            
            # Create fallback response with any available sources
            fallback_response = "I'm here to support you, though I'm having some technical difficulties accessing my full knowledge base right now. Your question is important, and I want to help as best I can."
            
            if verified_results:
                fallback_response += f"\n\nBased on the information I could access:\n{self._create_basic_informational_fallback(verified_results)}"
            
            fallback_sources = self._format_sources(verified_results)
            if isinstance(fallback_sources, str):
                fallback_sources = [{"text": fallback_sources}]
            elif not isinstance(fallback_sources, list):
                fallback_sources = []
            return AgentResponse(
                success=True,
                data={
                    "response": fallback_response,
                    "confidence": 0.5,
                    "response_type": "fallback",
                    "sources": fallback_sources,
                    "error": str(e)
                },
                confidence=0.5,
                metadata={"synthesis_error": str(e)}
            )

    async def _create_informational_response_fixed(self, query: str, query_analysis: Dict, verified_results: List[Dict], model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """FIXED: Create comprehensive factual response (100-250 words)"""
        if not verified_results:
            return self._create_comprehensive_fallback_informational(query)
        
        # For factual queries, use web sources for verified information
        web_sources = [r for r in verified_results if r.get('source') == 'web_search']
        if not web_sources:
            return self._create_comprehensive_fallback_informational(query)
        
        # Use enhanced prompt for longer responses
        sources_text = self._format_sources_for_llm_comprehensive(web_sources)
        history_text = self.format_history_for_prompt(conversation_history)
        
        # Enhanced system prompt for Genie with emotion context
        emotion_context = ""
        if query_analysis and 'detected_emotion' in query_analysis:
            emotion_data = query_analysis['detected_emotion']
            if emotion_data and emotion_data.get('primary_emotion'):
                emotion_context = f"\n\nEMOTION CONTEXT: I detected {emotion_data['primary_emotion']} in the user's voice with {(emotion_data.get('confidence', 0) * 100):.1f}% confidence. This suggests {emotion_data.get('mental_health_category', 'unknown')} context. Use this information to provide more empathetic and targeted support."
        
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity." + emotion_context
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend asked: \"{query}\"\n\nHere's some helpful info I found:\n{sources_text}\n\nChat with them naturally (150-250 words) like a knowledgeable friend who wants to help:\n- Answer their question in a friendly, easy-to-understand way\n- Use the information naturally in conversation\n- Sound like you're actually talking (\"You know what's interesting...\" \"One thing I've learned...\")\n- Share examples and explanations that feel natural\n- Keep it warm, helpful, and conversational\n- Don't mention sources or research - just share what you know\n- **Use rich markdown formatting**: **bold** for key points, *italics* for interesting insights, • bullet lists for clarity, and ### subheadings if organizing complex info\n\nHave a natural, beautifully formatted conversation:"
        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.3, max_tokens=900, model_preference=model_preference)
            logger.debug(f"Raw LLM output (model={model_preference}): {repr(response)}")
            if response and len(response.strip()) > 0:
                cleaned_response = self._clean_response_thoroughly(response)
                logger.debug(f"Cleaned response length: {len(cleaned_response)} characters")
                
                if self._is_valid_comprehensive_response(cleaned_response):
                    # Ensure adequate length
                    if len(cleaned_response.split()) < 100:
                        logger.debug(f"Response too short ({len(cleaned_response.split())} words), expanding...")
                        cleaned_response = self._expand_response_comprehensively(cleaned_response, web_sources, query)
                    
                    # Return natural response without inline citations
                    logger.debug(f"Final response length: {len(cleaned_response)} characters")
                    return cleaned_response
                else:
                    logger.warning(f"Response failed validation: {cleaned_response[:200]}...")
                    # Enhanced fallback if response is contaminated
                    return self._create_comprehensive_factual_fallback(query, web_sources)
            else:
                logger.warning(f"Empty or null response from model: {repr(response)}")
                return self._create_comprehensive_factual_fallback(query, web_sources)
                
        except Exception as e:
            logger.error(f"Error generating informational response: {e}")
            return self._create_comprehensive_factual_fallback(query, web_sources)

    async def _create_practical_guidance_response_fixed(self, query: str, query_analysis: Dict, verified_results: List[Dict], model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """FIXED: Create comprehensive practical response (100-250 words)"""
        if not verified_results:
            return self._create_comprehensive_fallback_practical(query)
        
        # For practical queries, use web sources for evidence-based strategies
        web_sources = [r for r in verified_results if r.get('source') == 'web_search']
        if not web_sources:
            return self._create_comprehensive_fallback_practical(query)
        
        # Enhanced comprehensive sources formatting
        sources_text = self._format_sources_for_llm_comprehensive(web_sources)
        history_text = self.format_history_for_prompt(conversation_history)
        
        # Enhanced system prompt for Genie with emotion context
        emotion_context = ""
        if query_analysis and 'detected_emotion' in query_analysis:
            emotion_data = query_analysis['detected_emotion']
            if emotion_data and emotion_data.get('primary_emotion'):
                emotion_context = f"\n\nEMOTION CONTEXT: I detected {emotion_data['primary_emotion']} in the user's voice with {(emotion_data.get('confidence', 0) * 100):.1f}% confidence. This suggests {emotion_data.get('mental_health_category', 'unknown')} context. Use this information to provide more empathetic and targeted support."
        
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity." + emotion_context
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend asked: \"{query}\" and they need some practical help.\n\nHere's some useful info I found:\n{sources_text}\n\nGive them helpful advice (150-250 words) like a supportive friend would:\n- Share clear, doable steps they can actually try\n- Talk naturally (\"Here's what I'd suggest...\" \"One thing that really helps...\")\n- Make it practical and friendly, not overwhelming\n- Include encouragement and realistic expectations\n- Mention professional help if it seems like a good idea\n- Sound like you're helping a friend, not giving a lecture\n- Don't mention sources or studies - just share helpful advice\n- **Use clear formatting**: **bold** for key advice, • numbered/bullet lists for step-by-step guidance, *italics* for encouragement\n\nGive warm, well-organized practical advice:"

        try:
            # INCREASED: More tokens for comprehensive responses
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.4, max_tokens=900, model_preference=model_preference)
            
            if response and len(response.strip()) > 50:
                # Clean response thoroughly
                cleaned_response = self._clean_response_thoroughly(response)
                
                if self._is_valid_comprehensive_response(cleaned_response):
                    # Ensure adequate length
                    if len(cleaned_response.split()) < 100:
                        cleaned_response = self._expand_response_comprehensively(cleaned_response, web_sources, query)
                    
                    return cleaned_response
                else:
                    return self._create_comprehensive_practical_fallback(query, web_sources)
            else:
                return self._create_comprehensive_practical_fallback(query, web_sources)
                
        except Exception as e:
            logger.error(f"Error generating practical response: {e}")
            return self._create_comprehensive_practical_fallback(query, web_sources)

    def _clean_response_thoroughly(self, response: str) -> str:
        """Clean response while preserving markdown formatting, but only remove clear artifacts."""
        if not response:
            return ""
        lines = response.strip().split('\n')
        cleaned_lines = []
        for line in lines:
            original_line = line  # Keep original for markdown preservation
            line = line.strip()
            if not line:
                cleaned_lines.append("")  # Preserve empty lines for markdown
                continue
            # Only skip lines that are clearly instructions or citations
            skip_patterns = [
                'Output as JSON', 'Instructions:', 'IMPORTANT:', 'Sources:', 'Source:', 'Citations:',
                'Based on the research and information below', 'Create a detailed, informative response that:',
                'Your comprehensive response:', 'Available research and sources:', 'answer this question based on',
                'provide a clear, informative answer', 'give actionable steps', 'According to Source',
                'Source 1', 'Source 2', 'Source 3', 'Source 4', 'based on the sources', 'research shows',
                'studies indicate', 'according to'
            ]
            should_skip = False
            for pattern in skip_patterns:
                if pattern.lower() in line.lower():
                    should_skip = True
                    break
            if not should_skip:
                cleaned_lines.append(original_line)
        cleaned_text = '\n'.join(cleaned_lines)
        cleaned_text = self._remove_citation_patterns_preserve_markdown(cleaned_text)
        cleaned_text = re.sub(r'\n\s*\n\s*\n', '\n\n', cleaned_text)  # Max 2 line breaks
        cleaned_text = re.sub(r' +', ' ', cleaned_text)  # Multiple spaces to single
        return cleaned_text.strip()

    def _remove_citation_patterns_preserve_markdown(self, text: str) -> str:
        """Remove citation patterns while preserving markdown formatting"""
        # Remove inline citations like [1], [2], etc. but not markdown links
        text = re.sub(r'\[(?!\*|\d+\])', '', text)  # Don't remove [*] or markdown
        text = re.sub(r'(?<!\[)\[\d+\](?!\()', '', text)  # Remove [1] but not [text](url)
        
        # Remove "Source X" patterns
        text = re.sub(r'Source \d+[,:]?\s*', '', text)
        
        # Remove "According to Source X" patterns
        text = re.sub(r'According to Source \d+[,:]?\s*', '', text, flags=re.IGNORECASE)
        
        # Remove other citation patterns while preserving markdown
        citation_patterns = [
            r'based on (?:the )?sources?[,:]?\s*',
            r'research shows that\s*',
            r'studies indicate that\s*',
            r'according to (?:the )?research[,:]?\s*',
            r'as mentioned in (?:the )?sources?[,:]?\s*',
            r'\(Source \d+\)',
            r'Web Source - https?://[^\s]+',
            r'Sources?:\s*\[?\d+\]?'
        ]
        
        for pattern in citation_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text

    def _remove_citation_patterns(self, text: str) -> str:
        """Remove all citation patterns from text to make it natural"""
        # Remove inline citations like [1], [2], etc.
        text = re.sub(r'\[\d+\]', '', text)
        
        # Remove "Source X" patterns
        text = re.sub(r'Source \d+[,:]?\s*', '', text)
        
        # Remove "According to Source X" patterns
        text = re.sub(r'According to Source \d+[,:]?\s*', '', text, flags=re.IGNORECASE)
        
        # Remove other citation patterns
        citation_patterns = [
            r'based on (?:the )?sources?[,:]?\s*',
            r'research shows that\s*',
            r'studies indicate that\s*',
            r'according to (?:the )?research[,:]?\s*',
            r'as mentioned in (?:the )?sources?[,:]?\s*',
            r'\(Source \d+\)',
            r'Web Source - https?://[^\s]+',
            r'Sources?:\s*\[?\d+\]?'
        ]
        
        for pattern in citation_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text

    def _is_valid_response(self, response: str) -> bool:
        """Check if response is valid (not contaminated with prompt instructions)"""
        if not response or len(response.strip()) < 20:
            return False
        
        # Check for prompt contamination
        contamination_indicators = [
            'based on the research and information',
            'create a detailed',
            'provide a comprehensive',
            'your comprehensive response',
            'available research and sources',
            'answer this question based on',
            'provide practical advice for'
        ]
        
        response_lower = response.lower()
        for indicator in contamination_indicators:
            if indicator in response_lower:
                return False
        
        return True

    def _format_sources_for_llm_clean(self, sources: List[Dict]) -> str:
        """Format sources for LLM without confusing instructions"""
        sources_text = ""
        for i, source in enumerate(sources, 1):  # Remove limit to use all sources
            content = source.get('text', '').strip()
            if content:
                # Clean content and limit length
                clean_content = content.replace('...', '').strip()
                if len(clean_content) > 150:
                    clean_content = clean_content[:150] + "..."
                sources_text += f"{i}. {clean_content}\n"
        
        return sources_text.strip()

    def _detect_situation(self, query: str, query_analysis: Dict) -> str:
        """Detect which emotional situation this is"""
        query_lower = query.lower()
        
        # Check for specific patterns
        if "overwhelm" in query_lower or "too much" in query_lower or "can't catch" in query_lower:
            return "overwhelm"
        elif "friends" in query_lower and ("stuck" in query_lower or "together" in query_lower):
            return "loneliness"
        elif "racing" in query_lower or "night" in query_lower or "can't stop" in query_lower:
            return "anxiety_night"
        elif "empty" in query_lower or "numb" in query_lower or "nothing matters" in query_lower:
            return "numbness"
        elif "never get better" in query_lower or "always feel" in query_lower or "what if" in query_lower:
            return "future_fear"
        elif "angry" in query_lower and "guilty" in query_lower:
            return "anger_guilt"
        elif "wake up" in query_lower and ("dread" in query_lower or "sleep forever" in query_lower):
            return "morning_dread"
        elif "panic" in query_lower and "work" in query_lower:
            return "panic_work"
        else:
            # Default to overwhelm pattern
            return "overwhelm"
    
    async def _create_situation_specific_response(self, situation: str, query: str, 
                                                 query_analysis: Dict, verified_results: List[Dict], 
                                                 model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """Create flexible emotional response based on actual user mood and context"""
        
        # SMART MOOD DETECTION - Don't assume everyone needs heavy therapy
        user_mood = self._detect_actual_user_mood(query, query_analysis)
        response_intensity = self._determine_response_intensity(query, user_mood)
        
        # FLEXIBLE RESPONSE CREATION - Match user's actual emotional state
        if user_mood == "happy_sharing":
            return await self._create_celebratory_response(query, query_analysis, model_preference, conversation_history)
        elif user_mood == "curious_casual":
            return await self._create_friendly_emotional_info(query, query_analysis, verified_results, model_preference, conversation_history)
        elif user_mood == "mildly_concerned":
            return await self._create_gentle_guidance(query, query_analysis, verified_results, model_preference, conversation_history)
        elif user_mood == "stressed_seeking_help":
            return await self._create_supportive_response(query, query_analysis, verified_results, response_intensity, model_preference, conversation_history)
        elif user_mood == "deeply_struggling":
            return await self._create_compassionate_response(query, query_analysis, verified_results, model_preference, conversation_history)
        else:
            # Default to conversational support
            return await self._create_conversational_support(query, query_analysis, verified_results, model_preference, conversation_history)

    def _detect_actual_user_mood(self, query: str, query_analysis: Dict) -> str:
        """Detect user's ACTUAL emotional state - not everything is a crisis"""
        query_lower = query.lower()
        
        # POSITIVE/SHARING MOOD
        positive_indicators = ["excited", "happy", "great", "amazing", "wonderful", "good news", "celebration", "achieved", "succeeded"]
        if any(word in query_lower for word in positive_indicators):
            return "happy_sharing"
        
        # CASUAL/CURIOUS ABOUT EMOTIONS
        casual_emotional = ["curious about", "wondering about", "what is", "how does", "why do people", "tell me about"]
        if any(phrase in query_lower for phrase in casual_emotional) and any(emo in query_lower for emo in ["anxiety", "depression", "stress", "emotions"]):
            return "curious_casual"
        
        # MILDLY CONCERNED/SEEKING ADVICE
        mild_concern = ["sometimes feel", "little worried", "bit stressed", "wondering if", "is it normal", "should i be concerned"]
        if any(phrase in query_lower for phrase in mild_concern):
            return "mildly_concerned"
        
        # ACTIVELY SEEKING HELP
        help_seeking = ["need help", "don't know what to do", "feeling overwhelmed", "struggling with", "can't handle", "hard time"]
        if any(phrase in query_lower for phrase in help_seeking):
            return "stressed_seeking_help"
        
        # DEEP STRUGGLE
        crisis_indicators = ["can't cope", "breaking down", "hopeless", "nothing matters", "want to give up", "can't go on"]
        if any(phrase in query_lower for phrase in crisis_indicators):
            return "deeply_struggling"
        
        return "neutral_emotional"

    def _determine_response_intensity(self, query: str, user_mood: str) -> str:
        """Determine how intense/long the response should be"""
        if user_mood in ["happy_sharing", "curious_casual"]:
            return "light"  # 30-80 words
        elif user_mood in ["mildly_concerned", "neutral_emotional"]:
            return "moderate"  # 60-120 words
        elif user_mood == "stressed_seeking_help":
            return "supportive"  # 80-150 words
        else:  # deeply_struggling
            return "comprehensive"  # 120-200 words

    async def _create_celebratory_response(self, query: str, query_analysis: Dict, model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """Short, enthusiastic response for positive sharing"""
        history_text = self.format_history_for_prompt(conversation_history)
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity."
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend just shared: \"{query}\"\n\nThey're clearly excited or happy! Respond naturally (30-80 words) like you're genuinely thrilled for them:\n- Use excited language that matches their energy\n- Ask follow-up questions to keep the conversation flowing  \n- Be warm and enthusiastic but not over the top\n- Sound like you're actually talking to a friend\n- **Use markdown formatting** like **bold** for emphasis, *italics* for emotion, or simple lists if helpful\n\nJust respond naturally and enthusiastically with rich formatting:"
        
        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.8, max_tokens=200, model_preference=model_preference)
            return self._clean_response_thoroughly(response) if response else "That's amazing! I'm so happy for you! Tell me more about what's making you feel so great!"
        except Exception as e:
            logger.error(f"Error creating celebratory response: {e}")
            return "That's wonderful news! I can feel your excitement. What's the best part about all this?"

    async def _create_friendly_emotional_info(self, query: str, query_analysis: Dict, verified_results: List[Dict], model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """Casual, informative response for emotional curiosity"""
        sources_text = ""
        if verified_results:
            sources_text = f"\n\nSome helpful info I found:\n{self._format_sources_for_llm_clean(verified_results[:2])}"
        history_text = self.format_history_for_prompt(conversation_history)
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity."
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend asked: \"{query}\"\n\n{sources_text}\n\nThey seem curious about this topic. Chat with them naturally (40-100 words) about it:\n- Share what you know in a casual, easy-to-understand way\n- Don't assume they're personally struggling with this\n- Use normal conversation style (\"You know how...\" \"It's interesting that...\")\n- Keep it friendly and informative, not like a textbook\n- **Use markdown formatting** like **bold** for key points, *italics* for emphasis, or • bullet lists for clarity\n\nHave a natural, well-formatted conversation:"
        
        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.6, max_tokens=300, model_preference=model_preference)
            return self._clean_response_thoroughly(response) if response else "That's a really interesting question! Mental health topics are fascinating to explore."
        except Exception as e:
            logger.error(f"Error creating friendly emotional info: {e}")
            return "Great question! That's something a lot of people wonder about. It's really interesting how our minds work."

    async def _create_gentle_guidance(self, query: str, query_analysis: Dict, verified_results: List[Dict], model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """Moderate response for mild concerns"""
        sources_text = ""
        if verified_results:
            sources_text = f"\n\nSome gentle advice:\n{self._format_sources_for_llm_clean(verified_results[:2])}"
        history_text = self.format_history_for_prompt(conversation_history)
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity."
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend asked: \"{query}\"\n\n{sources_text}\n\nThey're a little worried or stressed. Respond gently (60-120 words):\n- Offer gentle advice or reassurance\n- Don't minimize their feelings\n- Use a warm, conversational tone\n- **Use markdown formatting** for clarity and warmth"
        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.6, max_tokens=300, model_preference=model_preference)
            return self._clean_response_thoroughly(response) if response else "It's normal to feel that way sometimes. If you want to talk more, I'm here."
        except Exception as e:
            logger.error(f"Error creating gentle guidance: {e}")
            return "It's normal to feel that way sometimes. If you want to talk more, I'm here."

    async def _create_supportive_response(self, query: str, query_analysis: Dict, verified_results: List[Dict], response_intensity: str, model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """Supportive response for those actively seeking help"""
        sources_text = ""
        if verified_results:
            sources_text = f"\n\nSome things that might help:\n{self._format_sources_for_llm_clean(verified_results[:3])}"
        history_text = self.format_history_for_prompt(conversation_history)
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity."
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend reached out: \"{query}\"\n\n{sources_text}\n\nThey're going through something tough and need support. Respond naturally (80-150 words) like a caring friend:\n- Let them know you understand this is hard for them\n- Share some practical ideas that might help\n- Be empathetic but also hopeful\n- Mention talking to a professional if it seems like a good idea\n- Sound like a real friend, not a counselor\n- Give them some hope and real suggestions they can try\n- **Use markdown formatting**: **bold** for key support points, *italics* for empathy, and • bullet lists for practical suggestions\n\nBe genuinely supportive with clear formatting:"
        
        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.6, max_tokens=450, model_preference=model_preference)
            return self._clean_response_thoroughly(response) if response else "I can hear that you're going through a challenging time. It takes courage to reach out for support, and that's a really positive step."
        except Exception as e:
            logger.error(f"Error creating supportive response: {e}")
            return "Thank you for sharing what you're going through. It sounds challenging, and I want you to know that reaching out is a really brave and positive step."

    async def _create_compassionate_response(self, query: str, query_analysis: Dict, verified_results: List[Dict], model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """Comprehensive response for those in deep struggle"""
        sources_text = ""
        if verified_results:
            sources_text = f"\n\nSome supportive resources:\n{self._format_sources_for_llm_clean(verified_results[:3])}"
        history_text = self.format_history_for_prompt(conversation_history)
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity."
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend opened up about something really difficult: \"{query}\"\n\n{sources_text}\n\nThey're clearly in a lot of pain right now. Respond with deep care (120-200 words) like someone who really cares about them:\n- Let them know you truly hear how much they're hurting\n- Validate their feelings without trying to fix everything\n- Offer hope while respecting their pain  \n- Share concrete steps and suggest professional help\n- Be empathetic but also gently encouraging\n- Remind them of their worth and inner strength\n- Sound like a real person who cares, not a manual\n- **Use rich formatting**: **bold** for validation/strength, *italics* for emotional support, and organized lists for concrete steps\n\nRespond with genuine compassion and clear formatting:"
        
        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.7, max_tokens=600, model_preference=model_preference)
            cleaned = self._clean_response_thoroughly(response) if response else None
            
            if not cleaned:
                cleaned = "I can hear how much pain you're in right now, and I want you to know that your feelings are completely valid. You're not alone in this struggle, and while it feels overwhelming, there are people and resources that can help you through this difficult time."
            
            # Add crisis resources for deeply struggling users
            if any(word in query.lower() for word in ["hopeless", "give up", "can't go on", "end it"]):
                cleaned += "\n\nIf you're having thoughts of self-harm, please reach out to a crisis helpline or emergency services. In the US: 988 (Suicide & Crisis Lifeline). You matter, and help is available."
            
            return cleaned
        except Exception as e:
            logger.error(f"Error creating compassionate response: {e}")
            return "I can hear how much you're struggling right now. Please know that you're not alone, and while this feels overwhelming, there are people who can help you through this. Your life has value, and things can get better with the right support."

    async def _create_conversational_support(self, query: str, query_analysis: Dict, verified_results: List[Dict], model_preference: Optional[str] = None, conversation_history: Optional[List[Dict]] = None) -> str:
        """Default conversational emotional support"""
        history_text = self.format_history_for_prompt(conversation_history)
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity."
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n{history_text}\n\nYour friend said: \"{query}\"\n\nRespond naturally (50-100 words) like a warm, understanding friend would:\n- Really listen to what they're sharing\n- Respond to what they actually said\n- Give gentle support or a helpful perspective\n- Maybe ask a thoughtful follow-up question\n- Keep it conversational and real\n- Match their vibe and energy\n- **Use markdown formatting** where it helps: **bold** for emphasis, *italics* for emotion\n\nBe a good friend with clear formatting:"
        
        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.7, max_tokens=300, model_preference=model_preference)
            return self._clean_response_thoroughly(response) if response else "I appreciate you sharing that with me. It sounds like there's a lot on your mind."
        except Exception as e:
            logger.error(f"Error creating conversational support: {e}")
            return "Thank you for sharing that with me. I'm here to listen and support you however I can."

    def _is_valid_comprehensive_response(self, response: str) -> bool:
        """Check if response is valid and meets length requirements"""
        if not response or len(response.strip()) < 50:
            logger.debug(f"Response too short or empty: {len(response.strip()) if response else 0} chars")
            return False
        
        # Check word count - should be at least 75 words for comprehensive responses
        word_count = len(response.split())
        if word_count < 75:
            logger.debug(f"Response too short: {word_count} words (need 75+)")
            return False
        
        # Check for prompt contamination
        contamination_indicators = [
            'based on the research and information',
            'create a detailed',
            'provide a comprehensive',
            'your comprehensive response',
            'available research and sources',
            'answer this question based on',
            'provide practical advice for',
            'write a complete',
            'create a thorough response'
        ]
        
        response_lower = response.lower()
        for indicator in contamination_indicators:
            if indicator in response_lower:
                logger.debug(f"Response contains contamination indicator: '{indicator}'")
                return False
        
        logger.debug(f"Response validation passed: {word_count} words, no contamination")
        return True

    def _format_sources_for_llm_comprehensive(self, sources: List[Dict]) -> str:
        """Format sources comprehensively for longer responses"""
        sources_text = ""
        for i, source in enumerate(sources, 1):  # Remove limit to use all sources
            content = source.get('text', '').strip()
            if content:
                # Use more content for comprehensive responses
                clean_content = content.replace('...', '').strip()
                if len(clean_content) > 250:
                    clean_content = clean_content[:250] + "..."
                sources_text += f"Source {i}: {clean_content}\n\n"
        
        return sources_text.strip()

    def _expand_response_comprehensively(self, response: str, sources: List[Dict], query: str) -> str:
        """Expand response to meet comprehensive length requirements"""
        if len(response.split()) >= 150:
            return response
        
        # Add relevant information from sources
        additional_info = []
        for source in sources:  # Remove limit to use all sources
            content = source.get('text', '').strip()
            if content:
                # Find sentences with informative content
                sentences = content.split('. ')
                for sentence in sentences:
                    if (len(sentence) > 40 and 
                        sentence not in response and
                        any(word in sentence.lower() for word in ['research', 'study', 'effective', 'help', 'treatment', 'strategy', 'approach', 'method'])):
                        additional_info.append(sentence.strip() + '.')
                        if len(additional_info) >= 3:
                            break
                if len(additional_info) >= 3:
                    break
        
        if additional_info:
            # Add contextual information
            context_phrases = [
                "\n\nAdditionally, research shows that",
                "\n\nStudies have also found that",
                "\n\nOther important considerations include:",
                "\n\nFurther evidence suggests that"
            ]
            
            context = random.choice(context_phrases)
            expanded_content = ' '.join(additional_info[:2])
            return f"{response}{context} {expanded_content}"
        
        return response

    def _create_comprehensive_fallback_informational(self, query: str) -> str:
        """Create comprehensive informational fallback (150+ words)"""
        return f"""I understand you're looking for information about {query.lower().replace('?', '').replace('what is', '').replace('what are', '').strip()}, and while I don't have access to my complete knowledge base right now, I can share some general guidance.

Mental health topics often involve complex interactions between biological, psychological, and social factors. The information you're seeking typically requires evidence-based research and professional expertise to provide accurate, comprehensive answers.

For reliable, current information about mental health topics, I recommend consulting:
• Licensed mental health professionals who can provide personalized guidance
• Reputable medical websites like Mayo Clinic, WebMD, or the National Institute of Mental Health
• Academic research databases for peer-reviewed studies
• Professional organizations related to your specific question

If this is something you're personally experiencing, consider speaking with a healthcare provider who can offer tailored advice based on your individual situation. Mental health professionals can provide the most current, evidence-based information and help you understand how it applies to your specific circumstances.

Your interest in learning more shows great self-awareness, and seeking reliable information is an important step in understanding mental health topics."""

    def _create_comprehensive_fallback_practical(self, query: str) -> str:
        """Create comprehensive practical fallback (150+ words)"""
        return f"""I understand you're looking for practical strategies to help with {query.lower().replace('?', '').replace('how can i', '').replace('what can i', '').strip()}, and while I don't have specific evidence-based resources available right now, I can offer some general guidance.

Effective coping strategies typically involve multiple approaches working together. Generally, this might include:

**Immediate techniques**: Deep breathing exercises, grounding techniques (like the 5-4-3-2-1 method), or brief mindfulness practices can provide quick relief in challenging moments.

**Longer-term strategies**: Regular self-care routines, maintaining social connections, physical activity appropriate for your situation, and developing healthy thought patterns often form the foundation of emotional wellness.

**Professional support**: Many situations benefit significantly from working with a mental health professional who can provide personalized strategies, evidence-based treatments, and ongoing support tailored to your specific needs.

**Building skills gradually**: Most effective coping strategies develop over time with practice and patience. It's normal for techniques to feel awkward or less effective initially.

Consider reaching out to a counselor, therapist, or your healthcare provider who can offer specific, evidence-based strategies for your particular situation. They can help you develop a comprehensive approach that addresses your unique circumstances and goals."""

    def _create_comprehensive_factual_fallback(self, query: str, sources: List[Dict]) -> str:
        """Create comprehensive factual response from sources (150+ words)"""
        if not sources:
            return self._create_comprehensive_fallback_informational(query)
        
        # Extract comprehensive information from sources
        key_facts = []
        research_findings = []
        practical_applications = []
        
        for source in sources:  # Remove limit to use all sources
            content = source.get('text', '').strip()
            if not content:
                continue
                
            sentences = content.replace('...', '').split('. ')
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 40:
                    # Categorize information types
                    if any(keyword in sentence.lower() for keyword in ['research', 'study', 'found', 'shows', 'demonstrates']):
                        if sentence not in research_findings and len(research_findings) < 3:
                            research_findings.append(sentence)
                    elif any(keyword in sentence.lower() for keyword in ['include', 'involves', 'characterized by', 'symptoms']):
                        if sentence not in key_facts and len(key_facts) < 3:
                            key_facts.append(sentence)
                    elif any(keyword in sentence.lower() for keyword in ['help', 'treatment', 'therapy', 'effective', 'can']):
                        if sentence not in practical_applications and len(practical_applications) < 2:
                            practical_applications.append(sentence)
        
        # Build comprehensive response
        intro = self._get_intro_for_query(query)
        
        response_parts = [intro]
        
        if key_facts:
            response_parts.append(' '.join(key_facts[:3]) + '.')
        
        if research_findings:
            response_parts.append(f" Research in this area has shown that {' '.join(research_findings[:2]).lower()}.")
        
        if practical_applications:
            response_parts.append(f" Regarding treatment and support, {' '.join(practical_applications[:2]).lower()}.")
        
        # Add comprehensive conclusion
        if 'treatment' in query.lower() or 'therapy' in query.lower():
            conclusion = " It's important to note that treatment effectiveness can vary significantly between individuals, and what works best often depends on personal factors, severity of symptoms, and individual preferences. Working with qualified mental health professionals ensures that treatment approaches are properly tailored and monitored for effectiveness."
        elif 'symptom' in query.lower() or 'sign' in query.lower():
            conclusion = " If you're experiencing these symptoms, especially if they persist or interfere with daily functioning, it's advisable to consult with a healthcare professional for proper evaluation and guidance. Early intervention often leads to better outcomes."
        else:
            conclusion = " For personalized guidance and more detailed information specific to your situation, consider consulting with mental health professionals who can provide evidence-based recommendations tailored to your individual needs and circumstances."
        
        response_parts.append(conclusion)
        
        comprehensive_response = ''.join(response_parts)
        
        # Ensure adequate length
        if len(comprehensive_response.split()) < 120:
            comprehensive_response += f" Understanding {query.lower().replace('?', '').strip()} involves considering multiple factors including individual differences, environmental influences, and the complex interplay between various biological and psychological components. Professional guidance can help navigate these complexities effectively."
        
        return self._add_source_citations(comprehensive_response, sources)

    def _create_comprehensive_practical_fallback(self, query: str, sources: List[Dict]) -> str:
        """Create comprehensive practical response from sources (150+ words)"""
        if not sources:
            return self._create_comprehensive_fallback_practical(query)
        
        # Extract comprehensive strategies from sources
        strategies = []
        techniques = []
        tips = []
        
        for source in sources:  # Remove limit to use all sources
            content = source.get('text', '').strip()
            if not content:
                continue
                
            sentences = content.replace('...', '').split('. ')
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 30:
                    # Categorize actionable advice
                    if any(word in sentence.lower() for word in ['strategy', 'approach', 'method']):
                        if sentence not in strategies and len(strategies) < 3:
                            strategies.append(sentence)
                    elif any(word in sentence.lower() for word in ['technique', 'exercise', 'practice']):
                        if sentence not in techniques and len(techniques) < 3:
                            techniques.append(sentence)
                    elif any(word in sentence.lower() for word in ['try', 'can help', 'consider', 'helpful']):
                        if sentence not in tips and len(tips) < 3:
                            tips.append(sentence)
        
        # Build comprehensive practical response
        intro = f"Here are evidence-based approaches that can help with {self._simplify_query(query)}:"
        
        response_parts = [intro]
        
        if strategies:
            response_parts.append(f"\n\n**Core Strategies**: {' '.join(strategies[:3])}")
        
        if techniques:
            response_parts.append(f"\n\n**Specific Techniques**: {' '.join(techniques[:2])}")
        
        if tips:
            response_parts.append(f"\n\n**Additional Tips**: {' '.join(tips[:2])}")
        
        # Add comprehensive practical guidance
        implementation_advice = "\n\n**Implementation Guidance**: Start with one or two approaches that feel most manageable to you. Consistency tends to be more important than intensity, so regular practice of simpler techniques often yields better results than sporadic use of complex methods. It's normal for strategies to feel awkward initially - most people find that techniques become more natural and effective with time and practice."
        
        professional_guidance = " Remember that individual responses to different approaches vary significantly. If these strategies don't provide sufficient relief within a reasonable timeframe, or if your symptoms significantly impact daily functioning, consider working with a mental health professional who can provide personalized guidance and evidence-based treatments tailored to your specific situation."
        
        comprehensive_response = ''.join(response_parts) + implementation_advice + professional_guidance
        
        return self._add_source_citations(comprehensive_response, sources)

    def _format_sources(self, verified_results: List[Dict]) -> List[Dict]:
        """Format sources for response output"""
        sources = []
        for i, result in enumerate(verified_results, 1):  # Remove limit to show all sources
            source_info = {
                "id": i,
                "text": result.get("text", "")[:200] + "..." if len(result.get("text", "")) > 200 else result.get("text", ""),
                "metadata": result.get("metadata", {}),
                "source": result.get("source", "knowledge_base"),
                "score": result.get("score", 0.5)
            }
            
            # Add URL for web sources
            if result.get("source") == "web_search":
                source_info["url"] = result.get("metadata", {}).get("url", "")
                source_info["title"] = result.get("metadata", {}).get("title", "Web Source")
            
            sources.append(source_info)
        
        return sources

    def _add_source_citations(self, response: str, sources: List[Dict]) -> str:
        """Add citations to the response"""
        if not sources:
            return response
        
        citation_text = ""
        for i, source in enumerate(sources, 1):  # Remove limit to show all sources
            source_type = source.get("source", "")
            metadata = source.get("metadata", {})
            
            if source_type == "web_search":
                title = metadata.get("title", "Web Source")
                url = metadata.get("url", "")
                citation_text += f"[{i}] {title} - {url}\n"
        
        if citation_text:
            response += f"\n\nSources:\n{citation_text}"
        
        return response

    def _create_warm_fallback(self, query: str) -> str:
        """Create a warm, helpful fallback response when no sources are available"""
        query_lower = query.lower()
        
        # Provide specific guidance based on query type
        if any(word in query_lower for word in ['anxiety', 'anxious', 'panic', 'worried']):
            return """I understand you're dealing with anxiety, and I want to help. While I don't have specific resources available right now, here are some immediate techniques that many people find helpful:

Try deep breathing exercises (4 seconds in, hold for 4, out for 6), grounding techniques like naming 5 things you can see around you, or gentle movement. Remember that anxiety is treatable, and speaking with a mental health professional can provide you with personalized strategies that work best for your situation."""

        elif any(word in query_lower for word in ['depression', 'depressed', 'sad', 'hopeless']):
            return """I hear that you're struggling right now, and I want you to know that what you're feeling is valid and you're not alone. Depression is a real medical condition that affects millions of people, and it is treatable.

While I don't have specific resources to share at the moment, please consider reaching out to a mental health professional, trusted friend, or family member. If you're having thoughts of self-harm, please contact the 988 Suicide & Crisis Lifeline immediately. Your life has value, and help is available."""

        elif any(word in query_lower for word in ['sleep', 'insomnia', 'tired']):
            return """Sleep difficulties can be really challenging, especially when you're already dealing with stress. While I don't have specific guidance available right now, good sleep hygiene generally includes maintaining consistent sleep/wake times, creating a relaxing bedtime routine, and limiting screen time before bed.

Since sleep problems can be related to underlying health or mental health conditions, consider discussing this with a healthcare provider who can give you personalized recommendations for your situation."""

        elif any(word in query_lower for word in ['therapy', 'therapist', 'counseling']):
            return """Seeking therapy is a positive step toward taking care of your mental health. While I don't have specific guidance available right now, generally you might consider therapy if you're experiencing persistent distress, if your daily functioning is affected, or if you simply want support in navigating life challenges.

Many people find therapy helpful even when they're not in crisis. You can start by checking with your insurance provider, asking your doctor for referrals, or searching online directories for licensed therapists in your area."""

        elif any(word in query_lower for word in ['overwhelm', 'stress', 'cope', 'handle']):
            return """Feeling overwhelmed is a common human experience, and it's okay to acknowledge when things feel like too much. While I don't have specific strategies available right now, breaking things down into smaller, manageable steps often helps.

Consider prioritizing the most urgent tasks, asking for help when possible, and giving yourself permission to take breaks. If overwhelming feelings persist or interfere with your daily life, a mental health professional can help you develop personalized coping strategies."""

        else:
            return """I want to help with your question, but I don't have specific information available right now. Your mental health and wellbeing are important, and there are people who can provide the support you're looking for.

Consider reaching out to a mental health professional, your healthcare provider, or a trusted friend or family member. If you're in crisis, please contact the 988 Suicide & Crisis Lifeline or your local emergency services. You don't have to face challenges alone, and help is available."""

    async def _create_emotional_support_response(self, query: str, query_analysis: Dict, verified_results: List[Dict], model_preference: Optional[str] = None) -> str:
        """Create emotional response using local KB focus + web enhancement (100-150 words)"""
        if not verified_results:
            return self._create_basic_emotional_fallback(query)
        
        # For emotional queries, prioritize local KB (emotional dialogues) with web enhancement
        local_sources = [r for r in verified_results if r.get('source') in ['vector_search', 'bm25_search', 'graph_search']]
        web_sources = [r for r in verified_results if r.get('source') == 'web_search']
        
        # Use local sources primarily, web for enhancement
        primary_sources = local_sources if local_sources else web_sources
        
        # Log what we found for debugging
        logger.info(f"Emotional query sources - Local: {len(local_sources)}, Web: {len(web_sources)}, Total: {len(verified_results)}")
        
        emotion = query_analysis.get('primary_emotion', 'distressed')
        situation = query_analysis.get('specific_situation', 'difficult situation')
        
        sources_text = self._format_sources_for_llm(primary_sources)
        
        # Enhanced system prompt for Genie
        system_prompt = (
            "You are Genie, a warm, empathetic, and knowledgeable mental health assistant. "
            "Always answer user questions directly, clearly, and with emotional support. "
            "Use markdown formatting for clarity."
        )
        prompt = f"[INST] <<SYS>>{system_prompt}<</SYS>>\n\nYou are providing emotional support to someone who is {emotion} about their {situation}.\n\nTheir message: {query}\n\nRelevant emotional support content:\n{sources_text}\n\nCreate a warm, supportive response (120-150 words) that:\n- Validates their specific feelings using natural, friend-like language\n- Shows you understand their particular situation\n- Offers genuine comfort and hope\n- Suggests helpful next steps if appropriate\n- Uses conversational tone (contractions, \"you know?\", \"right?\")\n- Avoids clinical language or generic advice\n- **Use markdown formatting** for clarity and warmth\n\nWrite as a caring friend who truly understands what they're going through:"

        try:
            response = await self.llm_manager.ainvoke_async(prompt, temperature=0.6, max_tokens=250, model_preference=model_preference)
            
            if response and len(response.strip()) > 30:
                cleaned_response = self._clean_response_text(response)
                # For emotional responses, don't add formal citations - keep natural flow
                return cleaned_response
            else:
                return self._create_emotional_fallback_from_sources(query, primary_sources)
                
        except Exception as e:
            logger.error(f"Error generating emotional response: {e}")
            return self._create_basic_emotional_fallback(query)

    def _clean_response_text(self, response: str) -> str:
        """Remove only clear instruction text or prompt artifacts from response, not valid content."""
        if not response:
            return ""
        artifacts = [
            'Output as JSON', 'Instructions:', 'IMPORTANT:', 'Sources:', 'Source:', 'Citations:',
            'Based on the research and information below', 'Create a detailed, informative response that:',
            'Your comprehensive response:', 'Available research and sources:', 'answer this question based on',
            'provide a clear, informative answer', 'give actionable steps', 'According to Source',
            'Source 1', 'Source 2', 'Source 3', 'Source 4', 'based on the sources', 'research shows',
            'studies indicate', 'according to'
        ]
        cleaned = response
        for phrase in artifacts:
            cleaned = cleaned.replace(phrase, '')
        cleaned = self._remove_citation_patterns_preserve_markdown(cleaned)
        cleaned = re.sub(r'\n\s*\n\s*\n', '\n\n', cleaned)  # Max 2 line breaks
        cleaned = re.sub(r' +', ' ', cleaned)  # Multiple spaces to single
        return cleaned.strip()

    def _create_emotional_fallback_from_sources(self, query: str, sources: List[Dict]) -> str:
        """Create emotional response from local KB sources"""
        if not sources:
            return self._create_basic_emotional_fallback(query)
        
        # Look for emotional content in sources
        supportive_content = []
        for source in sources:  # Remove limit to use all sources
            content = source.get('text', '').strip()
            if any(word in content.lower() for word in ['feel', 'emotion', 'support', 'understand', 'help']):
                if len(content) > 100:
                    supportive_content.append(content[:100] + "...")
                else:
                    supportive_content.append(content)
        
        if supportive_content:
            intro = "I hear what you're going through."
            support_text = " Many people have shared similar feelings, and you're not alone in this experience."
            ending = "Take things one moment at a time, and be gentle with yourself."
            return f"{intro} {support_text} {ending}"
        
        return self._create_basic_emotional_fallback(query)

    def _create_basic_emotional_fallback(self, query: str) -> str:
        """Basic emotional support when no sources available"""
        return """I hear that you're going through a difficult time right now. While I don't have specific resources to share at the moment, I want you to know that your feelings are valid and you don't have to face this alone. 

Consider reaching out to a trusted friend, family member, or mental health professional who can provide the personalized support you deserve. If you're in crisis, please contact a crisis helpline like 988 (Suicide & Crisis Lifeline) for immediate support."""

    def _format_sources_for_llm(self, verified_results: List[Dict]) -> str:
        """Format sources for LLM prompt"""
        formatted = []
        for i, result in enumerate(verified_results, 1):  # Remove limit to use all sources
            text = result.get("text", "")
            source_type = result.get("source", "knowledge_base")
            score = result.get("score", 0.5)
            
            source_desc = f"[{i}] ({source_type}, relevance: {score:.2f}): {text[:300]}..."
            formatted.append(source_desc)
        
        return "\n\n".join(formatted)

    def _add_citations_to_response(self, response: str, sources: List[Dict]) -> str:
        """Add citations to the response"""
        if not sources:
            return response
        
        citation_text = ""
        for i, source in enumerate(sources, 1):  # Remove limit to show all sources
            source_type = source.get("source", "")
            metadata = source.get("metadata", {})
            
            if source_type == "web_search":
                title = metadata.get("title", "Web Source")
                url = metadata.get("url", "")
                citation_text += f"[{i}] {title} - {url}\n"
        
        if citation_text:
            response += f"\n\nSources:\n{citation_text}"
        
        return response

    def _create_basic_informational_fallback(self, verified_results: List[Dict]) -> str:
        """Create basic informational response from any available sources"""
        if not verified_results:
            return "I don't have access to my knowledge base right now."
        
        # Get the most relevant information
        best_source = verified_results[0]
        content = best_source.get('text', '').strip()
        
        if content:
            # Limit content and clean up
            if len(content) > 300:
                content = content[:300] + "..."
            
            source_info = ""
            if best_source.get('source') == 'web_search':
                url = best_source.get('metadata', {}).get('url', '')
                if url:
                    source_info = f" (Source: {url})"
            
            return f"{content}{source_info}"
        
        return "I found some relevant information but couldn't process it properly."