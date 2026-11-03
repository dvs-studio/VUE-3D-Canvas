#!/usr/bin/env bash
# VUE 3D Canvas - Self-Hosted Server Quick Start
# Author: Victory Ukpong

set -euo pipefail

echo "========================================================================"
echo "  VUE 3D Canvas - Self-Hosted Standalone Server"
echo "  Author / Creator: Victory Ukpong"
echo "========================================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

echo "Starting VUE 3D Canvas server on http://localhost:${PORT} ..."
echo "Press Ctrl+C to terminate."
echo ""

if command -v xdg-open >/dev/null 2>&1; then
  (sleep 0.6 && xdg-open "http://localhost:${PORT}" >/dev/null 2>&1) &
elif command -v open >/dev/null 2>&1; then
  (sleep 0.6 && open "http://localhost:${PORT}" >/dev/null 2>&1) &
fi

exec node server.js --port "${PORT}" --host "${HOST}"
