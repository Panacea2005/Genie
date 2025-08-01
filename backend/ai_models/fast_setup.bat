@echo off
echo ================================================
echo GENIE AI FAST SETUP - Windows Batch Launcher
echo ================================================
echo.
echo This will optimize your CPU and run the initial setup
echo using ALL available CPU cores for maximum speed.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo Starting CPU optimization and initial setup...
echo.

REM Navigate to the AI models directory
cd /d "%~dp0"

REM Run the fast setup script
python fast_setup.py

echo.
echo Setup completed! Check the output above for results.
echo.
pause
