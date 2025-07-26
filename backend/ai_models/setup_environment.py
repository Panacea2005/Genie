#!/usr/bin/env python3
"""
Environment Setup Script for Genie AI Mental Health Support System
Run this script to set up everything needed for the system to work properly.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_header(text):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f" {text}")
    print(f"{'='*60}")

def print_step(step, text):
    """Print a formatted step"""
    print(f"\n[{step}] {text}")

def check_python_version():
    """Check if Python version is compatible"""
    print_step(1, "Checking Python version...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✓ Python {version.major}.{version.minor}.{version.micro} - Compatible")
        return True
    else:
        print(f"✗ Python {version.major}.{version.minor}.{version.micro} - Requires Python 3.8+")
        return False

def install_requirements():
    """Install required packages"""
    print_step(2, "Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install requirements: {e}")
        return False

def create_env_file():
    """Create .env file with default configuration"""
    print_step(3, "Creating environment configuration...")
    
    env_path = Path(".env")
    
    # Default configuration
    default_config = """# Genie AI Environment Configuration

# LLM Provider Configuration
LLM_PROVIDER=groq
# LLM_PROVIDER=local

# Groq Configuration (cloud model)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Local Model Configuration (uncomment to use local model)
# LOCAL_MODEL_PATH=./model/llama1b-qlora-mh
# LOCAL_MODEL_MAX_LENGTH=512
# LOCAL_MODEL_TEMPERATURE=0.7
# LOCAL_MODEL_TOP_P=0.9

# Data Configuration
DATA_DIR=../data
TRAINING_DIR=../data/training
PROCESSED_DIR=../data/processed

# Performance Settings
MAX_WORKERS=8
BATCH_SIZE=32
EMBEDDING_BATCH_SIZE=128

# Feature Flags
ENABLE_WEB_SEARCH=true
ENABLE_COVE=true
ENABLE_FACT_CHECKING=true
ENABLE_RESPONSE_CACHING=true

# Logging
LOG_LEVEL=INFO
"""
    
    if env_path.exists():
        print(f"✓ .env file already exists at {env_path}")
        return True
    else:
        try:
            with open(env_path, 'w') as f:
                f.write(default_config)
            print(f"✓ Created .env file at {env_path}")
            print("  Please edit .env to add your GROQ_API_KEY or configure local model")
            return True
        except Exception as e:
            print(f"✗ Failed to create .env file: {e}")
            return False

def create_directories():
    """Create necessary directories"""
    print_step(4, "Creating directory structure...")
    
    directories = [
        "logs",
        "cache", 
        "indexes",
        "indexes/vector_store",
        "indexes/graph_store",
        "../data/processed",
        "../data/training"
    ]
    
    created = 0
    for directory in directories:
        dir_path = Path(directory)
        if not dir_path.exists():
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                created += 1
            except Exception as e:
                print(f"✗ Failed to create {directory}: {e}")
                return False
    
    print(f"✓ Directory structure created ({created} new directories)")
    return True

def download_nltk_data():
    """Download required NLTK data"""
    print_step(5, "Downloading NLTK data...")
    
    try:
        import nltk
        # Download required NLTK data
        nltk_data = ['punkt', 'stopwords', 'wordnet', 'vader_lexicon']
        for data in nltk_data:
            try:
                nltk.download(data, quiet=True)
            except Exception as e:
                print(f"Warning: Could not download {data}: {e}")
        
        print("✓ NLTK data downloaded")
        return True
    except ImportError:
        print("✗ NLTK not installed - please install requirements first")
        return False
    except Exception as e:
        print(f"✗ Failed to download NLTK data: {e}")
        return False

def validate_environment():
    """Validate that the environment is properly configured"""
    print_step(6, "Validating environment...")
    
    # Check if .env file exists and has required keys
    env_path = Path(".env")
    if not env_path.exists():
        print("✗ .env file not found")
        return False
    
    # Try to import key modules
    try:
        from config.settings import config
        print("✓ Configuration loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load configuration: {e}")
        return False
    
    # Check API keys
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key != "your_groq_api_key_here":
        print("✓ GROQ API key configured")
    else:
        print("⚠ GROQ API key not configured (required for cloud models)")
    
    print("✓ Environment validation completed")
    return True

def check_data_availability():
    """Check if training data is available"""
    print_step(7, "Checking data availability...")
    
    data_dirs = [
        "../data/processed",
        "../data/training", 
        "../data/raw"
    ]
    
    found_data = False
    for data_dir in data_dirs:
        dir_path = Path(data_dir)
        if dir_path.exists():
            files = list(dir_path.glob("*.json")) + list(dir_path.glob("*.csv"))
            if files:
                print(f"✓ Found {len(files)} data files in {data_dir}")
                found_data = True
    
    if not found_data:
        print("⚠ No training data found - system will work with limited functionality")
        print("  Add data files to ../data/processed/ or ../data/training/")
    
    return True

def check_indexes():
    """Check if search indexes exist"""
    print_step(8, "Checking search indexes...")
    
    index_files = [
        "indexes/vector_store/mental_health_index.faiss",
        "indexes/vector_store/mental_health_index.pkl",
        "indexes/bm25_index.pkl"
    ]
    
    existing_indexes = 0
    for index_file in index_files:
        if Path(index_file).exists():
            existing_indexes += 1
    
    if existing_indexes > 0:
        print(f"✓ Found {existing_indexes}/{len(index_files)} search indexes")
    else:
        print("⚠ No search indexes found - will be created on first run")
    
    return True

def test_system_components():
    """Test key system components"""
    print_step(9, "Testing system components...")
    
    try:
        # Test LLM Manager
        from core.llm_manager import LLMManager
        llm_manager = LLMManager()
        print("✓ LLM Manager initialized")
        
        # Test Embedding Manager
        from core.embeddings import EmbeddingManager
        from config.settings import config
        embedding_manager = EmbeddingManager(config)
        print("✓ Embedding Manager initialized")
        
        # Test Web Search
        from retrieval.web_search import WebSearch
        web_search = WebSearch()
        print("✓ Web Search initialized")
        
        return True
    except Exception as e:
        print(f"✗ Component test failed: {e}")
        return False

def main():
    """Main setup function"""
    print_header("Genie AI Environment Setup")
    print("This script will set up everything needed to run the Genie AI system.")
    
    # Check system requirements
    checks = [
        check_python_version(),
        install_requirements(), 
        create_env_file(),
        create_directories(),
        download_nltk_data(),
        validate_environment(),
        check_data_availability(),
        check_indexes(),
        test_system_components()
    ]
    
    # Summary
    print_header("Setup Summary")
    passed = sum(checks)
    total = len(checks)
    
    if passed == total:
        print(f"🎉 Setup completed successfully! ({passed}/{total} checks passed)")
        print("\nNext steps:")
        print("1. Edit .env file to add your GROQ_API_KEY")
        print("2. Add training data to ../data/processed/ or ../data/training/")
        print("3. Run: python test_llm.py")
    else:
        print(f"⚠ Setup completed with issues ({passed}/{total} checks passed)")
        print("Please resolve the issues above before running the system.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 