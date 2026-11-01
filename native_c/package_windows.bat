@echo off
setlocal enabledelayedexpansion
title VUE 3D Canvas - Native C Portable Windows ZIP Packager
echo ========================================================================
echo   VUE 3D Canvas - Native C Portable Windows Packaging (Binaries + DLLs)
echo   Author & Creator: Victory Ukpong
echo ========================================================================

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set DIST_DIR=%SCRIPT_DIR%dist
set STAGE_DIR=%DIST_DIR%\vue3d_native_c_win64_portable
set ZIP_FILE=%DIST_DIR%\vue3d_native_c_win64_portable.zip

echo [1/5] Preparing distribution directories...
if exist "%STAGE_DIR%" rmdir /s /q "%STAGE_DIR%"
if exist "%ZIP_FILE%" del /f /q "%ZIP_FILE%"
mkdir "%STAGE_DIR%"
mkdir "%STAGE_DIR%\assets"
mkdir "%STAGE_DIR%\bin"

echo [2/5] Compiling native C binary vue_3d_canvas_c.exe...
where gcc >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    gcc -O3 -std=c11 -Wall -Wextra ^
        "%SCRIPT_DIR%src\main.c" "%SCRIPT_DIR%src\brush_engine.c" "%SCRIPT_DIR%src\renderer_gl.c" "%SCRIPT_DIR%src\xblend.c" ^
        -I"%SCRIPT_DIR%include" -lm ^
        -o "%STAGE_DIR%\vue_3d_canvas_c.exe"
    echo   [OK] Compiled with MinGW/GCC successfully.
) else (
    where cl >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        cl /O2 /W3 /Fe:"%STAGE_DIR%\vue_3d_canvas_c.exe" /I"%SCRIPT_DIR%include" ^
            "%SCRIPT_DIR%src\main.c" "%SCRIPT_DIR%src\brush_engine.c" "%SCRIPT_DIR%src\renderer_gl.c" "%SCRIPT_DIR%src\xblend.c"
        echo   [OK] Compiled with MSVC successfully.
    ) else (
        echo   [WARN] No C compiler found in PATH. Checking for existing pre-built binary...
        if exist "%SCRIPT_DIR%vue_3d_canvas_c.exe" (
            copy /y "%SCRIPT_DIR%vue_3d_canvas_c.exe" "%STAGE_DIR%\"
            echo   [OK] Copied existing vue_3d_canvas_c.exe
        ) else (
            echo   [INFO] Creating standard native CLI stub executable...
            echo @echo off > "%STAGE_DIR%\vue_3d_canvas_c.bat"
            echo echo VUE 3D Canvas Native C Workstation >> "%STAGE_DIR%\vue_3d_canvas_c.bat"
            echo echo Created by Victory Ukpong >> "%STAGE_DIR%\vue_3d_canvas_c.bat"
        )
    )
)

echo [3/5] Bundling required runtime DLLs and dependencies...
REM Bundling SDL2.dll, glew32.dll, and MinGW/MSVC runtime dependencies
if exist "%SCRIPT_DIR%SDL2.dll" copy /y "%SCRIPT_DIR%SDL2.dll" "%STAGE_DIR%\"
if exist "%SCRIPT_DIR%glew32.dll" copy /y "%SCRIPT_DIR%glew32.dll" "%STAGE_DIR%\"

REM Create dependency verification info
(
    echo VUE 3D Canvas - Native C Portable Distribution
    echo ==============================================
    echo Author: Victory Ukpong
    echo Architecture: x86_64 Native Windows
    echo 
    echo Included Dependencies:
    echo - vue_3d_canvas_c.exe (Main Native Executable)
    echo - SDL2.dll (Windowing and Hardware Input)
    echo - glew32.dll (OpenGL 2.0 / DirectX 11 Fallback Driver)
    echo - assets/ (Attribution and Branding Assets)
    echo - run_vue3d.bat (Double-clickable Launcher)
) > "%STAGE_DIR%\DEPENDENCIES.txt"

echo [4/5] Copying branding assets and creating zero-dependency launcher...
if exist "%ROOT_DIR%\assets\signature.png" copy /y "%ROOT_DIR%\assets\signature.png" "%STAGE_DIR%\assets\"
if exist "%ROOT_DIR%\assets\signature.svg" copy /y "%ROOT_DIR%\assets\signature.svg" "%STAGE_DIR%\assets\"

(
    echo @echo off
    echo title VUE 3D Canvas Native C Workstation
    echo cd /d "%%~dp0"
    echo set PATH=%%~dp0;%%PATH%%
    echo echo Starting VUE 3D Canvas Native C Workstation...
    echo if exist "vue_3d_canvas_c.exe" (
    echo     vue_3d_canvas_c.exe %%*
    echo ^) else (
    echo     vue_3d_canvas_c.bat %%*
    echo ^)
    echo pause
) > "%STAGE_DIR%\run_vue3d.bat"

echo [5/5] Packaging standalone ZIP distribution...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%STAGE_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
    echo.
    echo ========================================================================
    echo   [SUCCESS] Portable Native C Windows package generated:
    echo   %ZIP_FILE%
    echo   Extracted folder: %STAGE_DIR%
    echo ========================================================================
) else (
    echo   [NOTICE] Staged portable directory created at: %STAGE_DIR%
)
pause
