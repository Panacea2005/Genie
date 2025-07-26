# core/memory.py
"""
Enhanced conversation memory management
Handles conversation history and context window management for long conversations
"""

from typing import List, Dict, Any, Optional
from collections import deque
import json
import time
import re
import logging

logger = logging.getLogger(__name__)

class ConversationMemory:
    """Enhanced conversation memory with intelligent summarization and context preservation"""
    
    def __init__(self, llm_manager: Any, max_tokens: int = 8000, window_size: int = 50):
        self.llm_manager = llm_manager
        self.max_tokens = max_tokens
        self.window_size = window_size
        self.conversations = {}  # session_id -> conversation history
        self.conversation_summaries = {}  # session_id -> conversation summaries
        self.critical_context = {}  # session_id -> important info (names, preferences, etc.)
        
    def add_message(self, session_id: str, role: str, content: str, metadata: Dict = None):
        """Add a message to conversation history with enhanced context management"""
        if session_id not in self.conversations:
            self.conversations[session_id] = deque(maxlen=self.window_size * 2)
            self.conversation_summaries[session_id] = []
            self.critical_context[session_id] = {}
        
        message = {
            "role": role,
            "content": content,
            "timestamp": time.time(),
            "metadata": metadata or {}
        }
        
        self.conversations[session_id].append(message)
        
        # Extract critical information (names, preferences, etc.)
        self._extract_critical_context(session_id, role, content)
        
        # Check if we need to summarize
        if len(self.conversations[session_id]) % 20 == 0:  # Every 20 messages
            self._summarize_conversation(session_id)
        
        # Trim if needed
        self._trim_conversation(session_id)
    
    def _extract_critical_context(self, session_id: str, role: str, content: str):
        """Extract and preserve critical information like names, preferences, etc."""
        if role == "user":
            # Extract names (simple pattern matching)
            name_patterns = [
                r"my name is (\w+)",
                r"i'm (\w+)",
                r"call me (\w+)",
                r"i am (\w+)"
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, content.lower())
                if match:
                    name = match.group(1).title()
                    self.critical_context[session_id]["user_name"] = name
                    logger.info(f"Extracted user name: {name}")
                    break
            
            # Extract preferences and important details
            preference_patterns = [
                r"i (like|love|enjoy) (.+)",
                r"i (don't like|hate|dislike) (.+)",
                r"my (favorite|preferred) (.+) is (.+)",
                r"i (work|study) (.+)",
                r"i live in (.+)",
                r"i'm from (.+)"
            ]
            
            for pattern in preference_patterns:
                match = re.search(pattern, content.lower())
                if match:
                    category = match.group(1)
                    value = match.group(2) if len(match.groups()) == 2 else f"{match.group(2)} {match.group(3)}"
                    if "preferences" not in self.critical_context[session_id]:
                        self.critical_context[session_id]["preferences"] = {}
                    self.critical_context[session_id]["preferences"][category] = value
                    break
    
    def _summarize_conversation(self, session_id: str):
        """Create a summary of older conversation parts"""
        try:
            history = list(self.conversations[session_id])
            if len(history) < 10:  # Too short to summarize
                return
            
            # Take older messages for summary (exclude last 5)
            messages_to_summarize = history[:-5]
            
            if len(messages_to_summarize) < 5:
                return
            
            context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages_to_summarize])
            
            prompt = f"""Summarize the key points from this conversation in 3-4 sentences, including:
- Important topics discussed
- User's emotional state and concerns
- Any preferences or personal information shared
- Key insights or advice given

Conversation:
{context}

Summary:"""
            
            summary = self.llm_manager.invoke(prompt)
            if summary and len(summary.strip()) > 10:
                self.conversation_summaries[session_id].append({
                    "summary": summary,
                    "timestamp": time.time(),
                    "message_count": len(messages_to_summarize)
                })
                logger.info(f"Created conversation summary for session {session_id}")
                
                # Remove summarized messages to save space
                for _ in range(len(messages_to_summarize)):
                    self.conversations[session_id].popleft()
                    
        except Exception as e:
            logger.error(f"Error summarizing conversation: {e}")
    
    def get_history(self, session_id: str, include_system: bool = False, include_summaries: bool = True) -> List[Dict]:
        """Get conversation history with enhanced context"""
        if session_id not in self.conversations:
            return []
        
        history = list(self.conversations[session_id])
        
        if not include_system:
            history = [msg for msg in history if msg["role"] != "system"]
        
        # Add summaries if requested
        if include_summaries and session_id in self.conversation_summaries:
            summaries = self.conversation_summaries[session_id]
            if summaries:
                # Add summary as a system message
                summary_text = "\n\n".join([s["summary"] for s in summaries[-2:]])  # Last 2 summaries
                history.insert(0, {
                    "role": "system",
                    "content": f"Previous conversation summary:\n{summary_text}",
                    "timestamp": time.time(),
                    "metadata": {"type": "summary"}
                })
        
        # Add critical context if available
        if session_id in self.critical_context and self.critical_context[session_id]:
            context_info = self.critical_context[session_id]
            context_text = []
            
            if "user_name" in context_info:
                context_text.append(f"User's name: {context_info['user_name']}")
            
            if "preferences" in context_info:
                prefs = context_info["preferences"]
                for category, value in prefs.items():
                    context_text.append(f"User {category}: {value}")
            
            if context_text:
                history.insert(0, {
                    "role": "system",
                    "content": f"Important context:\n" + "\n".join(context_text),
                    "timestamp": time.time(),
                    "metadata": {"type": "critical_context"}
                })
        
        return history
    
    def _trim_conversation(self, session_id: str):
        """Enhanced trimming with better token management"""
        history = self.conversations[session_id]
        
        # Estimate tokens (improved approximation)
        total_tokens = sum(len(msg["content"].split()) * 1.3 for msg in history)
        
        # Keep more recent messages and critical context
        while total_tokens > self.max_tokens and len(history) > 5:  # Keep at least 5 messages
            # Remove oldest messages but preserve critical context
            removed_msg = history.popleft()
            
            # Recalculate tokens
            total_tokens = sum(len(msg["content"].split()) * 1.3 for msg in history)
            
            # If we're still over limit, trigger summarization
            if total_tokens > self.max_tokens * 0.8:  # 80% of limit
                self._summarize_conversation(session_id)
                break
    
    def get_context_summary(self, session_id: str) -> str:
        """Get a comprehensive summary of the conversation context"""
        history = self.get_history(session_id, include_summaries=True)
        
        if len(history) < 4:
            return ""
        
        # Combine recent messages with summaries
        recent_messages = history[-4:]  # Last 4 messages
        summary_messages = [msg for msg in history if msg.get("metadata", {}).get("type") == "summary"]
        
        context_parts = []
        
        # Add summaries
        if summary_messages:
            context_parts.append("Previous conversation summary:")
            for msg in summary_messages[-2:]:  # Last 2 summaries
                context_parts.append(msg["content"])
        
        # Add recent messages
        context_parts.append("Recent conversation:")
        for msg in recent_messages:
            context_parts.append(f"{msg['role']}: {msg['content']}")
        
        context = "\n\n".join(context_parts)
        
        prompt = f"""Summarize the key points from this conversation context in 3-4 sentences:

{context}

Summary:"""
        
        try:
            summary = self.llm_manager.invoke(prompt)
            return summary
        except Exception as e:
            logger.error(f"Error creating context summary: {e}")
            return ""
    
    def clear_history(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.conversations:
            del self.conversations[session_id]
        if session_id in self.conversation_summaries:
            del self.conversation_summaries[session_id]
        if session_id in self.critical_context:
            del self.critical_context[session_id]
    
    def export_history(self, session_id: str) -> Dict:
        """Export conversation history as dict with enhanced information"""
        return {
            "session_id": session_id,
            "messages": self.get_history(session_id),
            "summaries": self.conversation_summaries.get(session_id, []),
            "critical_context": self.critical_context.get(session_id, {}),
            "message_count": len(self.conversations.get(session_id, [])),
            "created": min(msg["timestamp"] for msg in self.conversations.get(session_id, [])) if session_id in self.conversations else None
        }
    
    def get_memory_stats(self, session_id: str) -> Dict:
        """Get memory statistics for a session"""
        if session_id not in self.conversations:
            return {"error": "Session not found"}
        
        history = self.conversations[session_id]
        total_tokens = sum(len(msg["content"].split()) * 1.3 for msg in history)
        
        return {
            "message_count": len(history),
            "estimated_tokens": total_tokens,
            "max_tokens": self.max_tokens,
            "token_usage_percent": (total_tokens / self.max_tokens) * 100,
            "summary_count": len(self.conversation_summaries.get(session_id, [])),
            "critical_context_keys": list(self.critical_context.get(session_id, {}).keys())
        }