# HANDOFF.md - Python Desktop Architecture & AI Developer Instructions

**Project:** VUE 3D Canvas (Python Desktop Edition)  
**Author & Creator:** Victory Ukpong  
**Target:** Python 3.9+ Desktop Native + OpenGL 2.0+ & DirectX 11 Fallback  
**Memory Budget:** < 30 MB Heap, Max 3 States in `.xblend` Project Files  

---

## 1. MANDATORY GOVERNANCE FOR SUBSEQUENT AI MODELS
> **CRITICAL DIRECTIVE:**
> 1. **NEVER CLEAR HISTORY OR REMOVE FEATURES**: You must **ADD**, never delete, replace, wipe, or truncate existing code or architectural history.
> 2. **PRE-TASK REQUIREMENT**: Read `AGENT_STATE.md` and this `HANDOFF.md` **before** writing code to verify existing state and constraints.
> 3. **POST-TASK REQUIREMENT**: Update the active ledger in `AGENT_STATE.md` and `HANDOFF.md` **after** completing your task, appending your verified additions.
> 4. **STRICT CONSTRAINTS**: Maintain the 3-state undo ring buffer for `.xblend` serialization, linked assets by default, Photoshop CS5 dark skin palette (`#333333`), and zero ray-tracing dependencies.

---

## 2. Directory Structure

```
python_desktop/
├── vue3d/
│   ├── core/
│   │   ├── types.py          # Layer, Brush, Camera, ShadingMode, ThemeMode
│   │   ├── undo.py           # 1-step runtime undo + 3-state .xblend ring buffer
│   │   └── xblend.py         # .xblend project format serializer & parser
│   ├── renderer/
│   │   ├── viewport_3d.py    # Camera orbit, planar pan, Blender drone flight (WASD+QE)
│   │   ├── surface_shading.py# Def, Smooth (angle-weighted), Flat normal recalculation
│   │   └── geometry.py       # Procedural Sphere, Cube, and OBJ mesh generator
│   ├── tools/
│   │   └── brush_engine.py   # Dabs, lazy-mouse, tip masks, pattern overlays, smudge, eraser
│   └── ui/
│       ├── photoshop_ui.py   # Photoshop CS5 palette, embedded presets
│       └── desktop_gui.py    # Native Windows Desktop GUI window (No WebGL needed)
├── main.py                   # Desktop application entry point (GUI + CLI fallback)
├── requirements.txt          # Python dependencies (NumPy, Pillow, PyInstaller, PyOpenGL)
├── build_exe.bat             # 1-click PyInstaller single-file .exe packager
├── run.bat                   # 1-click Windows runner
├── run.sh                    # 1-click Linux/Mac runner
├── HANDOFF.md                # This file (AI instructions & upgrade ledger)
└── API.md                    # Python API documentation
```

---

## 3. Active Feature Ledger (Python Edition)

- [x] **Native Windows Desktop Window (`desktop_gui.py`)**: Runs directly on Windows desktop without requiring WebGL, node, or a web browser.
- [x] **Photoshop CS5 Dark Theme**: CS5 Dark Gray (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`), 78% B&W, Modern Slate, and PS 2022 Flat Graphite.
- [x] **Blender Drone Navigation**: Unconstrained orbit, camera-relative planar panning along local right/up axes, and WASD+QE drone flight controls with Shift speed boost.
- [x] **Surface Normal Pipeline**: Dynamic Def (original), Smooth (angle-weighted), and Flat (faceted) normal recalculations.
- [x] **Universal Presets & Smudge/Eraser Masks**: Embedded preset selector, tip mask stencils (`grunge`, `splat`, `scratch`, `dots`, `cracks`), pattern overlays, smudge pixel pushing, and destination-out eraser.
- [x] **1-Step Undo with 3-State Save**: Strictly 1 snapshot undone/redone per press (`Ctrl+Z` / `Ctrl+Y`) with repeat guard; saves strictly up to 3 states into `.xblend`.
- [x] **PyInstaller Standalone Executable**: Generates `dist/vue_3d_canvas_py.exe` via `build_exe.bat`.
