@echo off
echo 🚀 Starting Genie AI Backend...
echo ================================

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+ first.
    pause
    exit /b 1
)

echo ✅ Python found

:: Check if .venv exists
if not exist .venv (
    echo ⚠️ Virtual environment not found. Creating one...
    python -m venv .venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

:: Activate virtual environment
echo ℹ️ Activating virtual environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)

echo ✅ Virtual environment activated

:: Check if .env exists
if not exist .env (
    echo ❌ .env file not found. Please configure your environment variables.
    echo Create a .env file with:
    echo   GROQ_API_KEY=your_api_key_here
    echo   LLM_PROVIDER=groq
    echo   LLM_MODEL=llama-3.3-70b-versatile
    pause
    exit /b 1
)

echo ✅ Environment file found

:: Run the reliable startup script
echo ℹ️ Running backend startup checks and server...
echo 🌐 Backend will be available at: http://127.0.0.1:8000
echo ⏹️ Press Ctrl+C to stop the server
echo ================================
python start_backend.py 