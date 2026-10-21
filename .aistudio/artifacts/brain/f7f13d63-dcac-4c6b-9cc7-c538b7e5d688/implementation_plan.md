# Revised Implementation Plan - Multi-Language Implementations, Backup/Restore Workflows, and AI Handoff Protocol

Add dedicated GitHub Actions backup & restore workflows, strict AI handover protocols (add only, never wipe history, update MD files before and after tasks), and complete standalone C and Python implementations of VUE 3D Canvas.

---

## 1. GitHub Actions Workflows

### A. Backup Workflow (`.github/workflows/backup-codebases.yml`)
- Triggers on push or manual dispatch (`workflow_dispatch`).
- Filters out heavy media files (large `.mp4`, `.wav`, `.obj`, `.fbx`, heavy test bitmaps) while strictly **preserving icons and signatures** (`*.ico`, `*.svg`, `favicon.png`, `signature.png`, `signature.svg`, `app_icon.png`, `icon.png`).
- Packages into separate modular ZIP archives:
  1. `vue3d-backup-rust-web.zip`: Rust core + Web/TS frontend + configuration.
  2. `vue3d-backup-native-c.zip`: Native C implementation + headers + build scripts + docs.
  3. `vue3d-backup-python.zip`: Python desktop implementation + requirements + PyInstaller scripts.
- Uploads ZIP archives via `actions/upload-artifact@v4`.

### B. Restore / Import Workflow (`.github/workflows/restore-backup.yml`)
- Triggered manually (`workflow_dispatch`) with target language selection (`all`, `rust`, `c`, `python`).
- Extracts the requested backup ZIP from the `backups/` directory (or artifact) and overwrites code in-place.
- Ensures file permissions and executes test compiles to verify integrity.

---

## 2. AI Handoff & Governance Protocol

Add a standardized **AI Handover Protocol** in:
- `AGENT_STATE.md` (root ledger)
- `AGENTS.md` (root instructions)
- `native_c/HANDOFF.md` & `native_c/API.md`
- `python_desktop/HANDOFF.md` & `python_desktop/API.md`

### Mandatory Rules for Any Subsequent AI:
1. **Never Clear History**: Subsequent AI models must **ADD**, never delete, replace, or wipe prior architectural decisions, feature ledgers, or commit history.
2. **Pre-Task Check**: The AI must read and log active state in `AGENT_STATE.md` **before** writing code.
3. **Post-Task Ledger Update**: The AI must update the verification ledger and module indices in `AGENT_STATE.md` and language-specific `HANDOFF.md` files **after** completing the task.
4. **Preserve Memory & XBlend Constraints**: 3-state undo ring buffer for `.xblend`, linked 3D assets, no ray-tracing dependencies.

---

## 3. C Implementation (`native_c/`)
Targeting pure C99/C11 with direct access to OpenGL 2.0+ and DirectX 11 fallback, compiling to a single standalone executable via GCC or MSVC.

- **Files**:
  - `native_c/include/vue3d.h`: Core types (Canvas, Layer, Mesh, Brush, Camera, UndoRingBuffer, Theme).
  - `native_c/include/surface_shading.h`: Default, Smooth, and Flat normal calculation.
  - `native_c/include/brush_engine.h`: Dabs, lazy-mouse stabilizer, tip mask textures, pattern overlays, smudge, eraser.
  - `native_c/include/xblend.h`: `.xblend` project serialization/deserialization (3-state save limit).
  - `native_c/src/main.c`: Win32/GLFW window, message loop, input handling (middle-mouse / Alt drone navigation, WASD+QE), and UI rendering.
  - `native_c/src/renderer_gl.c`: OpenGL 2.0+ / D3D11 rendering backend, shaders, reflections, 3D painting.
  - `native_c/src/brush_engine.c`: Painting, tip masks, smudge smears, alpha-aware eraser.
  - `native_c/src/xblend.c`: `.xblend` file parser and exporter.
  - `native_c/build_gcc.bat` & `native_c/build_msvc.bat`: 1-click single-file compilation producing `vue_3d_canvas_c.exe`.
  - `native_c/Makefile`: Cross-platform build script.
  - `native_c/HANDOFF.md`: AI instructions, maintenance guide, and upgrade ledger.
  - `native_c/API.md`: C API documentation for all functions and structs.

---

## 4. Python Implementation (`python_desktop/`)
Targeting Python 3.9+ with `PyOpenGL`, `GLFW`, and `NumPy`, packageable into a single standalone `.exe` via PyInstaller.

- **Files**:
  - `python_desktop/vue3d/core/types.py`: Layer data structures, brush presets, undo history.
  - `python_desktop/vue3d/core/xblend.py`: `.xblend` project serializer (3-state save limit).
  - `python_desktop/vue3d/core/undo.py`: 1-step runtime undo/redo engine with key-repeat protection.
  - `python_desktop/vue3d/renderer/viewport_3d.py`: 3D viewport, unconstrained orbit, WASD+QE drone navigation.
  - `python_desktop/vue3d/renderer/surface_shading.py`: Def, Smooth, and Flat normal recalculations.
  - `python_desktop/vue3d/renderer/geometry.py`: Suzanne, Helmet, Sphere, and OBJ mesh loading.
  - `python_desktop/vue3d/tools/brush_engine.py`: Painting dabs, lazy-mouse stabilizer, tip mask modulation, pattern overlays, smudge smear.
  - `python_desktop/vue3d/ui/photoshop_ui.py`: Photoshop CS5 dark gray theme, menu bar, options bar with embedded presets dropdown, and dockers.
  - `python_desktop/main.py`: Main desktop entry point.
  - `python_desktop/requirements.txt`: Dependencies (`glfw`, `PyOpenGL`, `numpy`, `Pillow`, `pyinstaller`).
  - `python_desktop/build_exe.bat`: 1-click batch script running `pyinstaller --onefile --windowed --name vue_3d_canvas_py main.py`.
  - `python_desktop/run.bat` & `python_desktop/run.sh`: Instant runner scripts.
  - `python_desktop/HANDOFF.md`: AI instructions, architecture notes, and upgrade ledger.
  - `python_desktop/API.md`: Python module and class API documentation.

---

## 5. Verification Plan

1. **Workflows**:
   - Verify `.github/workflows/backup-codebases.yml` correctly targets `.ico`, `.svg`, `favicon.png`, `signature.png`, `icon.png` and excludes other large media.
   - Verify `.github/workflows/restore-backup.yml` unpacks archives accurately.
2. **Handoff Documentation**:
   - Inspect `AGENT_STATE.md`, `native_c/HANDOFF.md`, and `python_desktop/HANDOFF.md` for explicit AI rules (add never remove, update MD before and after task).
3. **C Codebase Integrity**:
   - Verify all C headers and source files compile cleanly with valid syntax and correct include guards.
4. **Python Codebase Integrity**:
   - Verify all Python scripts parse cleanly with zero syntax errors.
5. **Applet Compilation**:
   - Run `compile_applet` and `lint_applet` to confirm the existing React/WebGL applet remains 100% operational.
