# core/__init__.py
"""
Core components for Genie AI

Provides fundamental services used by all agents:
- LLM management
- Embedding generation
- Conversation memory
"""

from .llm_manager import LLMManager
from .embeddings import EmbeddingManager
from .memory import ConversationMemory

__all__ = [
    "LLMManager",
    "EmbeddingManager", 
    "ConversationMemory"
]

# Utility functions for core components
def create_llm_manager(config):
    """
    Create and configure an LLM manager
    
    Args:
        config: Configuration object
        
    Returns:
        LLMManager: Configured LLM manager
    """
    return LLMManager(config)

def create_embedding_manager(config):
    """
    Create and configure an embedding manager
    
    Args:
        config: Configuration object
        
    Returns:
        EmbeddingManager: Configured embedding manager
    """
    return EmbeddingManager(config)

def create_memory_manager(llm_manager, max_tokens=2000, window_size=10):
    """
    Create a conversation memory manager
    
    Args:
        llm_manager: LLM manager for summarization
        max_tokens: Maximum tokens to retain
        window_size: Conversation window size
        
    Returns:
        ConversationMemory: Configured memory manager
    """
    return ConversationMemory(llm_manager, max_tokens, window_size)

# Version info
__version__ = "1.0.0"