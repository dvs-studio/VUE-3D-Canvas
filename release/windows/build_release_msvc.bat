@echo off
title VUE 3D Canvas - Native Windows MSVC Release Build
echo ========================================================================
echo   VUE 3D Canvas - Native Windows Release Compiler (DirectX 11 / OpenGL)
echo   Author / Creator: Victory Ukpong
echo   Architecture: Rust Native Core (Direct DirectX 11 / OpenGL 2.0+)
echo   Target IDE: Visual Studio Code (No Visual Studio Community required)
echo ========================================================================
echo.

:: Check for Cargo
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Cargo / Rust is not found in PATH.
    echo Please install Rustup from https://rustup.rs/
    pause
    exit /b 1
)

echo [1/3] Building native release executable with maximum optimization...
cargo build --release --bin vue_3d_canvas
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed.
    echo If missing MSVC C++ tools, run in PowerShell as Admin:
    echo   winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"
    echo Or run build_release_gnu.bat to use MinGW GCC without any Microsoft build tools.
    pause
    exit /b 1
)

echo [2/3] Creating release binary directory...
if not exist "bin" mkdir "bin"

echo [3/3] Copying executable into release folder...
copy /y "..\..\target\release\vue_3d_canvas.exe" "bin\vue_3d_canvas.exe" >nul
if not exist "bin\vue_3d_canvas.exe" (
    copy /y "..\..\target\x86_64-pc-windows-msvc\release\vue_3d_canvas.exe" "bin\vue_3d_canvas.exe" >nul
)

echo.
echo ========================================================================
echo   SUCCESS: Native Windows executable compiled!
echo   Location: release\windows\bin\vue_3d_canvas.exe
echo   Direct DirectX 11 and OpenGL 2.0+ acceleration enabled.
echo ========================================================================
echo.
pause
