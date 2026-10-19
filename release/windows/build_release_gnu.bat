@echo off
title VUE 3D Canvas - MinGW GNU Native Release Build (No Visual Studio)
echo ========================================================================
echo   VUE 3D Canvas - MinGW-w64 GNU Native Compiler
echo   Author / Creator: Victory Ukpong
echo   100% Free of Visual Studio (Uses GCC/MinGW via MSYS2 / Rust GNU target)
echo   Target IDE: Visual Studio Code
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

echo [1/3] Adding GNU target if missing...
rustup target add x86_64-pc-windows-gnu

echo [2/3] Compiling native release binary with x86_64-pc-windows-gnu...
cargo build --release --target x86_64-pc-windows-gnu --bin vue_3d_canvas
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] GNU build failed.
    echo Ensure MinGW-w64 GCC is installed via MSYS2 (winget install MSYS2.MSYS2).
    pause
    exit /b 1
)

echo [3/3] Copying executable to release/windows/bin/...
if not exist "bin" mkdir "bin"
copy /y "..\..\target\x86_64-pc-windows-gnu\release\vue_3d_canvas.exe" "bin\vue_3d_canvas.exe" >nul

echo.
echo ========================================================================
echo   SUCCESS: Native GNU Windows executable compiled!
echo   Location: release\windows\bin\vue_3d_canvas.exe
echo   Direct OpenGL 2.0+ and DirectX 11 acceleration enabled.
echo ========================================================================
echo.
pause
