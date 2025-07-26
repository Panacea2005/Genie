# agents/__init__.py
"""
AI Agents module for Genie AI

Implements a multi-agent system for processing mental health queries.
Each agent has a specific role in the processing pipeline.
"""

from .base import BaseAgent, AgentResponse
from .orchestrator import OrchestratorAgent
from .query_agent import QueryAgent
from .retrieval_agent import RetrievalAgent
from .verifier_agent import VerifierAgent
from .synthesis_agent import SynthesisAgent

__all__ = [
    "BaseAgent",
    "AgentResponse",
    "OrchestratorAgent",
    "QueryAgent",
    "RetrievalAgent",
    "VerifierAgent", 
    "SynthesisAgent"
]

# Agent descriptions for documentation
AGENT_DESCRIPTIONS = {
    "OrchestratorAgent": "Main coordinator that manages the entire RAG pipeline",
    "QueryAgent": "Analyzes and decomposes user queries, detects crisis situations",
    "RetrievalAgent": "Manages multi-strategy retrieval (vector, BM25, graph, web)",
    "VerifierAgent": "Verifies retrieved information for accuracy and relevance",
    "SynthesisAgent": "Synthesizes verified information into coherent responses"
}

def get_agent_info():
    """Get information about available agents"""
    return AGENT_DESCRIPTIONS

def create_agent_pipeline(llm_manager, embedding_manager, config):
    """
    Create a complete agent pipeline
    
    Args:
        llm_manager: LLM manager instance
        embedding_manager: Embedding manager instance
        config: Configuration object
        
    Returns:
        OrchestratorAgent: Configured orchestrator with all sub-agents
    """
    return OrchestratorAgent(llm_manager, embedding_manager, config)