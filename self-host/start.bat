@echo off
title VUE 3D Canvas - Self-Hosted Server
echo ========================================================================
echo   VUE 3D Canvas - Self-Hosted Standalone Server
echo   Author / Creator: Victory Ukpong
echo ========================================================================
echo.

:: Check for node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js v18 or newer from https://nodejs.org/
    echo or run using VS Code with the Node runtime.
    pause
    exit /b 1
)

echo Starting VUE 3D Canvas server on http://localhost:3000 ...
echo Press Ctrl+C to stop.
echo.
node server.js --port 3000 --host 0.0.0.0
pause
