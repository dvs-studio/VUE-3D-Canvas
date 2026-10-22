# Complete Multi-Language Delivery: Workflows, Documentation, & Gizmo Navigation Flip

Clarification on Architecture & Execution Plan:
- **Architecture Context**: The original primary project is a **hybrid**: **React + TypeScript (Vite)** provides the Photoshop CS5 user interface, dockers, and Three.js WebGL viewport in the browser, while **Rust** (`crates/`, `Cargo.toml`) defines native data structures. For zero-overhead native desktop deployment without WebGL/browser runtime, two complete standalone engines exist: **`python_desktop/`** (pure Python + Tkinter GUI + PyOpenGL/DirectX 11) and **`native_c/`** (pure ANSI C99/C11 + DirectX 11 / OpenGL 2.0+).
- **Navigation Inversion & Gizmo Flip**: We will both correct the natural Blender mouse direction (so dragging right turns right and dragging up looks up) **and** add an interactive **"Flip / Invert Navigation" button directly on the 3D Viewport Gizmo HUD** in React, Python, and C, giving users immediate 1-click control to toggle standard vs. inverted axes.

> [!IMPORTANT]
> **Summary of Deliverables:**
> 1. **Gizmo Flip Button & Rotation Fix**: Natural orbit/drone direction + a dedicated `[FLIP AXIS]` button on the viewport navigation overlay (stored in state and togglable on the fly). Synchronized to Python and C navigation.
> 2. **Dedicated Folder Documentation**: Comprehensive `python_desktop/README.md` and `native_c/README.md` detailing architecture, build instructions, and CLI/GUI controls.
> 3. **Modular Export Workflows**: `export-rust.yml`, `export-python.yml`, and `export-c.yml` with optional copy to the repository `export/` directory.
> 4. **Native Non-WebGL Windows CI Workflows**: `build-windows-rust.yml`, `build-windows-python.yml`, and `build-windows-c.yml` targeting native Windows executables (DirectX 11 / OpenGL 2.0+).
> 5. **Guarded Import/Extract Workflow**: `import-extract.yml` with language dropdown, auto-detection or explicit filename selection from `import/`, post-extract cleanup checkbox, and strict scope guards preventing Rust root extraction from affecting other language folders.

---

### 1. System Architecture Map

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              VUE 3D Canvas Multi-Engine CI                             │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│   Rust & React (Browser)   │       Python Desktop        │          Native C           │
│  • React UI + Three.js     │  • Native Tkinter Desktop   │  • Pure ANSI C99/C11        │
│  • Rust core crates/       │  • DirectX 11 / PyOpenGL    │  • DirectX 11 / OpenGL 2.0+ │
│  • Viewport Gizmo Flip Btn │  • Drone + Flip Axis Toggle │  • Fast C Math + Flip State │
└─────────────┬──────────────┴──────────────┬──────────────┴──────────────┬──────────────┘
              │                             │                             │
              ▼                             ▼                             ▼
┌────────────────────────────┐┌────────────────────────────┐┌────────────────────────────┐
│ .github/workflows/         ││ .github/workflows/         ││ .github/workflows/         │
│  - export-rust.yml         ││  - export-python.yml       ││  - export-c.yml            │
│  - build-windows-rust.yml  ││  - build-windows-python.yml││  - build-windows-c.yml     │
└─────────────┬──────────────┘└─────────────┬──────────────┘└─────────────┬──────────────┘
              │                             │                             │
              └──────────────────────┬──────┴─────────────────────────────┘
                                     ▼
                    ┌──────────────────────────────────┐
                    │  .github/workflows/              │
                    │   - import-extract.yml           │
                    │  Safe Scoped Targets:            │
                    │    • rust   -> Root (Guarded)    │
                    │    • python -> python_desktop/   │
                    │    • c      -> native_c/         │
                    └──────────────────────────────────┘
```

---

### 2. Detailed Task Breakdown

#### Task 1: Navigation Fix & Gizmo Flip Button
- **`src/renderer/Viewport3D.tsx`**:
  - Add `invertNav: boolean` state.
  - Add an interactive `Flip Axis (Normal/Inverted)` toggle button right beside the Drone Mode button in the bottom-left viewport overlay.
  - Adjust orbit/pan/flight delta signs so default navigation follows natural mouse motion, and flipping inverses the axes instantly.
- **`python_desktop/vue3d/renderer/viewport_3d.py` & `desktop_gui.py`**:
  - Add `invert_nav` toggle to the options bar and HUD, with natural directional motion.
- **`native_c/src/renderer_gl.c` & `main.c`**:
  - Add `invert_nav` flag to `V3D_Camera` and `flip` command to interactive shell.

#### Task 2: Documentation (`README.md`)
- **`python_desktop/README.md`**: Comprehensive technical and user guide (CS5 Dark theme, setup, PyInstaller `.exe` compilation, zero-dependency mode, CLI reference).
- **`native_c/README.md`**: Architectural manual (ANSI C99/C11, GCC/MSVC build scripts, memory safety, `.xblend` serializer).

#### Task 3: Folders & Export Workflows
- Create `import/` and `export/` directories with `.gitkeep` and `README.md`.
- Create `.github/workflows/export-rust.yml` (packages Rust core & root MDs, preserves icons).
- Create `.github/workflows/export-python.yml` (packages `python_desktop/`, preserves icons).
- Create `.github/workflows/export-c.yml` (packages `native_c/`, preserves icons).
- Each workflow includes a checkbox input `save_to_export_folder` to mirror the zip into `export/`.

#### Task 4: Native Windows CI Workflows (Non-WebGL)
- Create `.github/workflows/build-windows-rust.yml` (native `cargo build --release` on `windows-latest`).
- Create `.github/workflows/build-windows-python.yml` (PyInstaller single-file `.exe` build).
- Create `.github/workflows/build-windows-c.yml` (MSVC / MinGW native `.exe` build).

#### Task 5: Scoped Import & Extraction Workflow
- Create `.github/workflows/import-extract.yml` with:
  - Language selection dropdown (`rust`, `python`, `c`).
  - Selection mode dropdown (`auto-detect`, `explicit-filename`).
  - Zip filename text input.
  - Optional `delete_after_extract` checkbox.
  - Unpack safety checks: Rust extraction guards against overwriting `python_desktop/`, `native_c/`, `self-host/`, `export/`, or `import/`.

#### Task 6: Ledger Update & Verification
- Update `AGENT_STATE.md` with new features, strictly preserving historical entries.
- Run `compile_applet` and `lint_applet` to confirm zero regressions.
