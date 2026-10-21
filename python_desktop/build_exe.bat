@echo off
title VUE 3D Canvas - Standalone Windows PyInstaller Packager
echo ========================================================================
echo   Packaging VUE 3D Canvas Standalone Executable (.exe) via PyInstaller
echo   Author & Creator: Victory Ukpong
echo ========================================================================

pip install -r requirements.txt

pyinstaller --onefile --windowed ^
    --name vue_3d_canvas_py ^
    --collect-all vue3d ^
    main.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Standalone single-file executable generated:
    echo   dist\vue_3d_canvas_py.exe
) else (
    echo.
    echo [ERROR] PyInstaller packaging encountered an error.
)
pause
