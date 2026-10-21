@echo off
title VUE 3D Canvas - MSVC Native C Compiler
echo ========================================================================
echo   Compiling VUE 3D Canvas Native C Binary via MSVC (cl.exe)
echo   Author & Creator: Victory Ukpong
echo ========================================================================

cl.exe /O2 /W3 /D_CRT_SECURE_NO_WARNINGS /Iinclude ^
    src\main.c src\brush_engine.c src\renderer_gl.c src\xblend.c ^
    /link user32.lib gdi32.lib opengl32.lib /OUT:vue_3d_canvas_c.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Compiled vue_3d_canvas_c.exe successfully via MSVC!
) else (
    echo.
    echo [ERROR] MSVC compilation failed. Ensure you are running inside Developer Command Prompt.
)
pause
