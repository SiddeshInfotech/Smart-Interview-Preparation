@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Smart Interview Preparation - Backend Automation

cls

echo =====================================================
echo   Smart Interview Preparation - Backend Automation
echo =====================================================
echo.

:: =====================================================
:: Check Docker
:: =====================================================
echo [*] Checking Docker...

docker info >nul 2>&1

if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Docker Desktop is not running or Docker is not installed.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [+] Docker daemon is active.
echo.

:: =====================================================
:: Check Python
:: =====================================================
echo [*] Checking Python installation...

python --version >nul 2>&1

if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Python was not found in PATH.
    echo Install Python 3.10 or later and enable "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

echo [+] Python detected.
echo.

:: =====================================================
:: Upgrade pip (Optional)
:: =====================================================
echo [*] Updating pip...

python -m pip install --upgrade pip --disable-pip-version-check >nul 2>&1

echo [+] pip ready.
echo.

:: =====================================================
:: Install/Verify Dependencies
:: =====================================================
echo [*] Verifying automation dependencies...

python -m pip install ^
-r automation\requirements.txt ^
--disable-pip-version-check

set "PIP_EXIT=!errorlevel!"

echo.
echo [INFO] pip exit code = !PIP_EXIT!
echo.

if not "!PIP_EXIT!"=="0" (
    echo [ERROR] Failed to install automation dependencies.
    echo.
    echo Possible reasons:
    echo   - No Internet connection
    echo   - PyPI temporarily unavailable
    echo   - Firewall/Proxy blocking pip
    echo   - Invalid requirements.txt
    echo.
    pause
    exit /b 1
)

echo [+] Python dependencies verified successfully.
echo.

:: =====================================================
:: Verify update_render.py exists
:: =====================================================
if not exist automation\update_render.py (
    echo [ERROR] automation\update_render.py not found.
    echo.
    pause
    exit /b 1
)

:: =====================================================
:: Execute Automation Script
:: =====================================================
echo =====================================================
echo Launching Render Automation...
echo =====================================================
echo.

python automation\update_render.py

set "SCRIPT_EXIT=!errorlevel!"

echo.

if not "!SCRIPT_EXIT!"=="0" (
    echo [ERROR] Automation script failed.
    echo Exit Code: !SCRIPT_EXIT!
    echo.
    pause
    exit /b !SCRIPT_EXIT!
)

echo =====================================================
echo [+] Automation completed successfully.
echo =====================================================
echo.

pause
exit /b 0