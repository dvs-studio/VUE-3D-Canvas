@echo off
title VUE 3D Canvas - Python Desktop Windows Portable ZIP Packager
echo ========================================================================
echo   Packaging VUE 3D Canvas Python Desktop Portable ZIP
echo   Author & Creator: Victory Ukpong
echo ========================================================================

python package_windows.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Portable ZIP package generated in dist\ directory!
) else (
    echo.
    echo [ERROR] Packaging encountered an error.
)
pause
