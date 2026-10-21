@echo off
title VUE 3D Canvas - Python Desktop Workstation
echo ========================================================================
echo   Launching VUE 3D Canvas Native Desktop (Python Edition)
echo   Author & Creator: Victory Ukpong
echo   Direct OpenGL 2.0+ & DirectX 11 (No WebGL Overhead)
echo ========================================================================

python main.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Running with 'py' launcher...
    py main.py
)
pause
