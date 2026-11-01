@echo off
title VUE 3D Canvas - Web/Rust Windows Portable ZIP Packager
echo ========================================================================
echo   Packaging VUE 3D Canvas Portable Distribution (ZIP)
echo   Author & Creator: Victory Ukpong
echo ========================================================================

set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set DIST_DIR=%ROOT_DIR%\dist
set STAGE_DIR=%DIST_DIR%\vue3d_win64_portable
set ZIP_FILE=%DIST_DIR%\vue3d_win64_portable.zip

echo [1/4] Preparing directories...
if exist "%STAGE_DIR%" rmdir /s /q "%STAGE_DIR%"
if exist "%ZIP_FILE%" del /f /q "%ZIP_FILE%"
mkdir "%STAGE_DIR%"
mkdir "%STAGE_DIR%\assets"
mkdir "%STAGE_DIR%\app"

echo [2/4] Building production web assets...
cd /d "%ROOT_DIR%"
call npm run build

if exist "%ROOT_DIR%\dist" (
    xcopy /e /i /y "%ROOT_DIR%\dist\*" "%STAGE_DIR%\app\"
)

if exist "%ROOT_DIR%\target\release\vue_3d_canvas.exe" (
    copy /y "%ROOT_DIR%\target\release\vue_3d_canvas.exe" "%STAGE_DIR%\"
)

echo [3/4] Copying assets and creating launcher...
if exist "%ROOT_DIR%\assets" (
    xcopy /e /i /y "%ROOT_DIR%\assets\*" "%STAGE_DIR%\assets\"
)

(
    echo @echo off
    echo title VUE 3D Canvas Portable Workstation
    echo cd /d "%%~dp0"
    echo if exist "vue_3d_canvas.exe" (
    echo     start "" "vue_3d_canvas.exe" --serve 3000
    echo     timeout /t 2 ^>nul
    echo     start http://localhost:3000
    echo ^) else (
    echo     start "" "%%~dp0app\index.html"
    echo ^)
) > "%STAGE_DIR%\start_vue3d.bat"

(
    echo VUE 3D Canvas - Portable Windows Distribution
    echo =============================================
    echo Author: Victory Ukpong
    echo Target: Windows x86_64
    echo 
    echo Launch via start_vue3d.bat
) > "%STAGE_DIR%\DEPENDENCIES.txt"

echo [4/4] Compressing into ZIP...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%STAGE_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
    echo [SUCCESS] Created portable package: %ZIP_FILE%
) else (
    echo Staged folder: %STAGE_DIR%
)
pause
