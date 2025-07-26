# config/__init__.py
"""
Configuration module for Genie AI

Provides centralized configuration management and prompt templates.
"""

from .settings import config, Config, ModelConfig, RetrievalConfig, AgentConfig, DataConfig, SystemConfig
from . import prompts

__all__ = [
    "config",
    "Config",
    "ModelConfig",
    "RetrievalConfig", 
    "AgentConfig",
    "DataConfig",
    "SystemConfig",
    "prompts"
]

# Quick access to commonly used configurations
def get_model_config():
    """Get current model configuration"""
    return config.model

def get_retrieval_config():
    """Get current retrieval configuration"""
    return config.retrieval

def get_agent_config():
    """Get current agent configuration"""
    return config.agent

def get_data_paths():
    """Get data directory paths"""
    return {
        "base": config.data.base_dir,
        "data": config.data.data_dir,
        "training": config.data.training_dir,
        "processed": config.data.processed_dir,
        "vector_store": config.data.vector_store_path,
        "graph_store": config.data.graph_store_path
    }