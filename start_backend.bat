@echo off
setlocal enabledelayedexpansion
title Smart Interview Preparation - Backend Automation

echo =====================================================
echo   Smart Interview Preparation - Backend Automation   
echo =====================================================
echo.

:: Check Docker availability
echo [*] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running or Docker is not installed!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo [+] Docker daemon is active.
echo.

:: Check Python availability
echo [*] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in system PATH!
    echo Please install Python 3.8+ and add it to PATH.
    echo.
    pause
    exit /b 1
)
echo [+] Python environment detected.
echo.

:: Verify/install python dependencies
echo [*] Verifying python automation dependencies...
python -c "import requests, dotenv, colorama" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Installing required packages from automation\requirements.txt...
    python -m pip install -r automation\requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install requirements. Please check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo [+] Dependencies installed successfully.
) else (
    echo [+] All required python dependencies are installed.
)
echo.

:: Execute automation script
echo [*] Launching update_render.py automation...
echo.
python automation\update_render.py

echo.
echo [*] Execution session ended.
pause
