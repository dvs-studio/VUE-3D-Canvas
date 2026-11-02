@echo off
setlocal
title VUE 3D Canvas - Windows Application Builder
cd /d "%~dp0\.."

echo Building the painting interface...
call npm run build
if errorlevel 1 goto fail
if not exist "dist\index.html" goto fail

echo Compiling the Windows window...
cargo build --release --bin vue_3d_canvas
if errorlevel 1 goto fail
if not exist "target\release\vue_3d_canvas.exe" goto fail

set OUT=dist\VUE_3D_Canvas_Windows
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%\ui"
copy /y "target\release\vue_3d_canvas.exe" "%OUT%\vue_3d_canvas.exe"
xcopy /e /i /y "dist\index.html" "%OUT%\ui\" >nul
xcopy /e /i /y "dist\assets" "%OUT%\ui\assets\" >nul

echo.
echo Double-click %OUT%\vue_3d_canvas.exe
echo Leave the ui folder beside the exe. No server is started.
goto end

:fail
echo Build failed. The package was not created.
exit /b 1

:end
endlocal
