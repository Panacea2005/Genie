#!/usr/bin/env python3
"""
Reliable startup script for Genie AI Backend
Ensures all dependencies are installed and system starts correctly
"""

import os
import sys
import subprocess
import platform
from pathlib import Path
import psutil

def print_status(message, status="info"):
    """Print colored status messages"""
    colors = {
        "info": "\033[94m",     # Blue
        "success": "\033[92m",  # Green  
        "warning": "\033[93m",  # Yellow
        "error": "\033[91m",    # Red
        "reset": "\033[0m"      # Reset
    }
    
    prefix = {
        "info": "ℹ️",
        "success": "✅", 
        "warning": "⚠️",
        "error": "❌"
    }
    
    print(f"{colors.get(status, '')}{prefix.get(status, '')} {message}{colors['reset']}")

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major != 3 or version.minor < 8:
        print_status(f"Python {version.major}.{version.minor} detected. Requires Python 3.8+", "error")
        return False
    print_status(f"Python {version.major}.{version.minor} - Compatible ✓", "success")
    return True

def check_virtual_env():
    """Check if virtual environment is activated"""
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print_status("Virtual environment activated ✓", "success")
        return True
    print_status("Virtual environment not activated", "warning")
    return False

def install_dependencies():
    """Install or upgrade dependencies"""
    print_status("Installing/updating dependencies...", "info")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "--upgrade"
        ], check=True, capture_output=True, text=True)
        print_status("Dependencies installed successfully ✓", "success")
        return True
    except subprocess.CalledProcessError as e:
        print_status(f"Failed to install dependencies: {e}", "error")
        return False

def check_env_file():
    """Check if .env file exists with required variables"""
    env_path = Path(".env")
    if not env_path.exists():
        print_status(".env file not found", "error")
        return False
    
    # Check for required environment variables
    required_vars = ["GROQ_API_KEY", "LLM_PROVIDER", "LLM_MODEL"]
    missing_vars = []
    
    with open(env_path, 'r') as f:
        env_content = f.read()
        for var in required_vars:
            if f"{var}=" not in env_content:
                missing_vars.append(var)
    
    if missing_vars:
        print_status(f"Missing environment variables: {', '.join(missing_vars)}", "error")
        return False
    
    print_status(".env file configured ✓", "success")
    return True

def check_indexes():
    """Check if required indexes exist"""
    index_paths = [
        "indexes/vector_store/mental_health_index.faiss",
        "indexes/vector_store/mental_health_index.pkl",
        "indexes/bm25_index.pkl"
    ]
    
    missing_indexes = []
    for path in index_paths:
        if not Path(path).exists():
            missing_indexes.append(path)
    
    if missing_indexes:
        print_status(f"Missing indexes: {', '.join(missing_indexes)}", "warning")
        print_status("System will try to build indexes on first run", "info")
        return False
    
    print_status("Required indexes found ✓", "success")
    return True

def check_port_availability(port=8000):
    """Check if port is available"""
    for conn in psutil.net_connections():
        if conn.laddr.port == port:
            print_status(f"Port {port} is already in use", "warning")
            return False
    print_status(f"Port {port} is available ✓", "success")
    return True

def start_server():
    """Start the FastAPI server"""
    print_status("Starting Genie AI Backend Server...", "info")
    print_status("=" * 50, "info")
    
    try:
        # Use uvicorn directly for reliability
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "api_server:app",
            "--host", "127.0.0.1",
            "--port", "8000", 
            "--reload",
            "--log-level", "info"
        ], check=False)  # Don't check=True as uvicorn runs indefinitely
        
    except KeyboardInterrupt:
        print_status("\nServer stopped by user", "info")
    except Exception as e:
        print_status(f"Server failed to start: {e}", "error")

def main():
    """Main startup sequence"""
    print_status("🚀 Genie AI Backend Startup", "info")
    print_status("=" * 50, "info")
    
    # Check system requirements
    if not check_python_version():
        sys.exit(1)
    
    if not check_virtual_env():
        print_status("Please activate virtual environment first:", "warning")
        if platform.system() == "Windows":
            print_status("  .venv\\Scripts\\activate", "info")
        else:
            print_status("  source .venv/bin/activate", "info")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Check configuration
    if not check_env_file():
        print_status("Please configure .env file with your API keys", "error")
        sys.exit(1)
    
    # Check indexes (warning only)
    check_indexes()
    
    # Check port availability
    if not check_port_availability():
        print_status("Server may not start if port is occupied", "warning")
    
    # Start server
    start_server()

if __name__ == "__main__":
    main() 