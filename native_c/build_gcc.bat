@echo off
title VUE 3D Canvas - GCC/MinGW Native C Compiler
echo ========================================================================
echo   Compiling VUE 3D Canvas Native C Binary via GCC/MinGW
echo   Author & Creator: Victory Ukpong
echo ========================================================================

gcc -O3 -std=c11 -Wall -Wextra ^
    src/main.c src/brush_engine.c src/renderer_gl.c src/xblend.c ^
    -Iinclude -lm ^
    -o vue_3d_canvas_c.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Compiled vue_3d_canvas_c.exe successfully!
    echo Run 'vue_3d_canvas_c.exe' to launch the native standalone workstation.
) else (
    echo.
    echo [ERROR] Compilation failed. Ensure gcc is in your PATH.
)
pause
