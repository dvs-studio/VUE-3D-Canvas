@echo off
title VUE 3D Canvas - Native Windows Launcher (DirectX 11 / OpenGL)
echo ========================================================================
echo   VUE 3D Canvas - Native Windows Hardware Accelerated Runner
echo   Author / Creator: Victory Ukpong
echo   Direct DirectX 11 / OpenGL 2.0+ (Bypassing WebGL Latency)
echo ========================================================================
echo.

set EXE_PATH=bin\vue_3d_canvas.exe

if not exist "%EXE_PATH%" (
    if exist "..\..\target\release\vue_3d_canvas.exe" (
        set EXE_PATH=..\..\target\release\vue_3d_canvas.exe
    ) else if exist "..\..\target\x86_64-pc-windows-msvc\release\vue_3d_canvas.exe" (
        set EXE_PATH=..\..\target\x86_64-pc-windows-msvc\release\vue_3d_canvas.exe
    ) else if exist "..\..\target\x86_64-pc-windows-gnu\release\vue_3d_canvas.exe" (
        set EXE_PATH=..\..\target\x86_64-pc-windows-gnu\release\vue_3d_canvas.exe
    ) else (
        echo [ERROR] Native executable was not found.
        echo Please run build_release_msvc.bat or build_release_gnu.bat first.
        pause
        exit /b 1
    )
)

echo Launching VUE 3D Canvas with Direct DirectX 11 hardware acceleration...
echo GPU High Performance Mode Enabled. 60+ FPS Viewport Active.
echo.

"%EXE_PATH%" --dx11 --high-perf %*
pause
