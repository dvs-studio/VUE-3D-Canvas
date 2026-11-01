#!/usr/bin/env bash
# VUE 3D Canvas - Web/Rust Windows Portable ZIP Packager
# Author: Victory Ukpong

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STAGE_DIR="/tmp/vue3d_win64_portable"
DIST_DIR="$ROOT_DIR/dist"
ZIP_FILE="$ROOT_DIR/release/vue3d_win64_portable.zip"

echo "=== VUE 3D Canvas - Packaging Web/Rust Desktop Windows Portable ZIP ==="

# 1. Build client assets first
if command -v npm >/dev/null 2>&1; then
    echo "Building client assets..."
    cd "$ROOT_DIR"
    npm run build
fi

# 2. Prepare staging folder
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
mkdir -p "$STAGE_DIR/assets"
mkdir -p "$STAGE_DIR/app"
mkdir -p "$ROOT_DIR/release"

if [ -d "$ROOT_DIR/dist" ]; then
    cp -r "$ROOT_DIR/dist"/* "$STAGE_DIR/app/" 2>/dev/null || true
fi

# 3. Check for native self-hosted rust executable
if [ -f "$ROOT_DIR/target/release/vue_3d_canvas.exe" ]; then
    cp "$ROOT_DIR/target/release/vue_3d_canvas.exe" "$STAGE_DIR/"
    echo "Copied target/release/vue_3d_canvas.exe"
fi

# 4. Copy assets
if [ -d "$ROOT_DIR/assets" ]; then
    cp -r "$ROOT_DIR/assets"/* "$STAGE_DIR/assets/" 2>/dev/null || true
fi

# 5. Create one-click launcher
cat << 'EOF' > "$STAGE_DIR/start_vue3d.bat"
@echo off
title VUE 3D Canvas Portable Workstation
cd /d "%~dp0"
echo ========================================================================
echo   Starting VUE 3D Canvas Standalone Portable Workstation
echo   Author & Creator: Victory Ukpong
echo ========================================================================

if exist "vue_3d_canvas.exe" (
    start "" "vue_3d_canvas.exe" --serve 3000
    timeout /t 2 >nul
    start http://localhost:3000
) else (
    echo Launching client application in browser...
    start "" "%~dp0app\index.html"
)
EOF

# 6. Write DEPENDENCIES.txt
cat << 'EOF' > "$STAGE_DIR/DEPENDENCIES.txt"
VUE 3D Canvas - Portable Windows Distribution
=============================================
Author: Victory Ukpong
Target: Windows x86_64

Included Components:
- start_vue3d.bat : Zero-dependency instant launcher
- app/            : High-performance pre-compiled client workspace
- assets/         : Open-source attribution and signature assets
EOF

# 7. Compress into ZIP
if command -v python3 >/dev/null 2>&1; then
    python3 -c "import shutil; shutil.make_archive('${ROOT_DIR}/release/vue3d_win64_portable', 'zip', '${STAGE_DIR}')"
    echo "[SUCCESS] Generated $ZIP_FILE"
fi
