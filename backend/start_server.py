#!/usr/bin/env python3
"""
Simple script to start the Genie AI backend server
"""

import os
import sys
from pathlib import Path

# Add ai_models directory to path
ai_models_dir = Path(__file__).parent / "ai_models"
sys.path.insert(0, str(ai_models_dir))

# Change to ai_models directory to ensure proper imports
os.chdir(ai_models_dir)

if __name__ == "__main__":
    import uvicorn
    
    print("Starting Genie AI Backend Server...")
    print("Make sure you have:")
    print("1. Installed Python dependencies: pip install -r requirements.txt")
    print("2. Set GROQ_API_KEY environment variable")
    print("3. Built or loaded the indexes")
    print("-" * 50)
    
    # Start the server
    uvicorn.run(
        "api_server:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    ) 