# ai_models/__init__.py
"""
Genie AI - Agentic Mental Health Support System

A modular, production-ready RAG system with multiple agents,
advanced retrieval strategies, and response refinement capabilities.
"""

__version__ = "1.0.0"
__author__ = "Genie AI Team"

# Import main components for easy access
from .config.settings import config
from .core.llm_manager import LLMManager
from .core.embeddings import EmbeddingManager
from .agents.orchestrator import OrchestratorAgent

# Main entry point
from .main import GenieAI

__all__ = [
    "config",
    "LLMManager", 
    "EmbeddingManager",
    "OrchestratorAgent",
    "GenieAI"
]

# Module metadata
__doc__ = """
Genie AI Mental Health Support System

This system provides:
- Multi-agent architecture for complex query processing
- Hybrid retrieval (vector, BM25, knowledge graph, web)
- Chain of Verification (CoVe) for response refinement
- Conversation memory management
- Crisis detection and appropriate response
- Confidence scoring and fact checking

Usage:
    from ai_models import GenieAI
    
    # Initialize the system
    genie = GenieAI()
    
    # Process a query
    response = await genie.chat("How can I manage anxiety?")
    print(response["response"])
"""