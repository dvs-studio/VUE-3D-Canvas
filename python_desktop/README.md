# VUE 3D Canvas — Python Desktop Edition

**Author & Creator:** Victory Ukpong  
**Version:** 0.1.0  
**Target Architecture:** Native Windows Desktop / Cross-Platform Standalone Workstation  
**Graphics Backends:** DirectX 11 ANGLE / Native PyOpenGL 2.0+ / Pure Python Raster Fallback  
**Zero-Dependency Mode:** 100% executable on plain vanilla Python 3.9+ without pip/wheel installations  

---

## 1. Overview & Capabilities

The **Python Desktop Edition** of VUE 3D Canvas delivers an authentic desktop digital painting and 3D texturing experience engineered to match Adobe Photoshop CS5's classic dark theme (`#333333`) and Blender's 3D navigation standards without requiring WebGL, local HTTP servers, or web browsers.

### Key Features
- **Photoshop CS5 Dark Palette (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`)**: Standardized toolbar with Brush, Eraser, Smudge, Blur, Clone, Hand, and Zoom tools.
- **Embedded Options Bar**: Size, Opacity, Hardness sliders, universal presets dropdown list, and tip mask stencil selector (Grunge, Splat, Scratch, Dots, Cracks).
- **Blender Drone Flight Navigation (`WASD + QE`)**:
  - Unconstrained 360° spherical orbit (no angle locking or gimbal freeze).
  - First-person drone flight mode (`WASD` for forward/strafe, `QE` for elevation, `Shift` for 2.5x speed boost).
  - **Gizmo Axis Flip (`NATURAL` / `INVERTED`)**: 1-click axis flip button directly on the interface allowing instant toggling between standard natural mouse motion and inverted axis.
- **Dynamic Surface Normal Calculator (`SurfaceShadingEngine`)**:
  - `DEF`: Original vertex normals.
  - `SMOOTH`: Angle-weighted shared vertex normals.
  - `FLAT`: Faceted per-face polygon normals.
- **1-Step Live Undo & Strict 3-State `.xblend` Ring Buffer**:
  - Live runtime session protects against repeat keys for clean single-step `Ctrl+Z` / `Ctrl+Y`.
  - Saved `.xblend` project archives strictly clamp to the **maximum 3 undo states** memory constraint.
- **Zero-Dependency Pure Python Engine (`vue3d/core/compat.py`)**:
  - Custom fallback math and pixel blending loops run instantly even on bare systems where compiled NumPy wheels are unavailable.

---

## 2. Project Structure

```
python_desktop/
├── main.py                     # Primary entry point (Auto-detects GUI vs CLI)
├── requirements.txt            # Optional acceleration dependencies (PyOpenGL, NumPy, PyInstaller)
├── run.bat                     # 1-click Windows launcher
├── run.sh                      # Unix/Linux launcher
├── build_exe.bat               # 1-click standalone PyInstaller .exe compiler
├── README.md                   # This operational documentation
├── HANDOFF.md                  # AI model governance ledger & architectural decisions
├── API.md                      # Programmatic Python API specification
└── vue3d/
    ├── core/
    │   ├── compat.py           # Zero-dependency NumPy shim
    │   ├── types.py            # Enums, Dataclasses (Layer, Brush, Camera)
    │   ├── undo.py             # 1-step undo & 3-state ring buffer
    │   └── xblend.py           # .xblend JSON/Base64 project serializer
    ├── renderer/
    │   ├── geometry.py         # UV Sphere, Cube Box, Suzanne Monkey primitives
    │   ├── surface_shading.py  # Def, Smooth, Flat surface normal evaluator
    │   └── viewport_3d.py      # Camera orbit, planar pan, and drone flight
    ├── tools/
    │   └── brush_engine.py     # Lazy-mouse stabilizer, tip masks, smudge, eraser
    └── ui/
        ├── photoshop_ui.py     # CS5 palette tokens & presets dictionary
        └── desktop_gui.py      # Native Tkinter desktop GUI (no WebGL needed)
```

---

## 3. How to Run

### Quick Start (Vanilla Python — Zero Installs)
Double-click `run.bat` on Windows or execute from terminal:
```bash
python main.py
```
If a display server is available, the native desktop window opens immediately. If running over SSH or a headless environment, it automatically falls back to the interactive console shell.

To explicitly force the interactive terminal shell:
```bash
python main.py --cli
```

### Accelerated Mode (Optional)
For GPU hardware acceleration via PyOpenGL:
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

---

## 4. How to Compile into a Standalone `.exe`

The application includes `build_exe.bat` for one-click compilation into a single, self-contained Windows executable requiring no Python runtime on the client machine:

```cmd
build_exe.bat
```

### Manual PyInstaller Command
```bash
pyinstaller --noconfirm --onedir --windowed ^
    --name "vue_3d_canvas_desktop" ^
    --add-data "vue3d;vue3d" ^
    main.py
```
The compiled executable will be located in `dist/vue_3d_canvas_desktop/vue_3d_canvas_desktop.exe`.

---

## 5. CLI Command Reference

When running in `--cli` mode, the shell provides full diagnostic control:
| Command | Arguments | Description |
|---|---|---|
| `status` | None | Displays active layers, texture size, camera XYZ, and undo depth |
| `stroke` | `[x1 y1 x2 y2]` | Paints a stabilized brush dab onto the active layer |
| `smudge` | `[x1 y1 x2 y2]` | Simulates a smudge smear with tip mask texture |
| `erase` | `[x y]` | Applies a destination-out eraser dab |
| `undo` | None | Undoes exactly 1 step (`Ctrl+Z`) |
| `redo` | None | Redoes exactly 1 step (`Ctrl+Y`) |
| `save` | `[filename.xblend]` | Saves project to `.xblend` (strictly 3 undo states) |
| `load` | `<filename.xblend>` | Deserializes and loads an `.xblend` archive |
| `shading` | `<def\|smooth\|flat>` | Dynamically recalibrates surface normals |
| `mesh` | `<sphere\|cube>` | Switches active 3D geometry primitive |
| `drone` | `[on\|off]` | Toggles Blender Drone flight navigation |
| `theme` | `<cs5\|bw78\|modern\|ps2022>` | Switches UI theme palette |
| `exit` | None | Safely flushes buffers and closes application |

---

## 6. AI Governance Directive
In accordance with `AGENTS.md`: Any future AI model modifying this directory must **ADD**, never remove, overwrite, truncate, or wipe prior architectural decisions or commit history, and must update `AGENT_STATE.md` and `HANDOFF.md` before and after tasks.
