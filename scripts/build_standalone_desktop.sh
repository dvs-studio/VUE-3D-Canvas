#!/usr/bin/env bash
# Builds the painting UI. The Windows exe itself is compiled by
# .github/workflows/build-windows-app.yml (run it by hand on GitHub)
# or by scripts/build_standalone_desktop.bat on a Windows machine.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
test -f dist/index.html
test -n "$(find dist/assets -name '*.js' -print -quit)"
echo "Painting UI is in dist/."
echo "On Windows, run scripts/build_standalone_desktop.bat or the GitHub workflow Build Windows Application."
