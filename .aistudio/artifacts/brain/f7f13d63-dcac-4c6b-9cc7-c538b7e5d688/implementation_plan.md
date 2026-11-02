# Standalone Native Desktop & Serverless VUE 3D Canvas Architecture

Completely re-architect VUE 3D Canvas into a 100% self-contained, serverless standalone application with DirectX 11 and OpenGL compatibility priority, runtime graphics backend switching in the Menu Bar, and pre-packaged ready-to-run desktop distribution folders and ZIP archives with dual GUI and diagnostic launchers requiring zero compiler setup.

## User Review & Critical Decisions

> [!IMPORTANT]
> The foundational decisions confirmed through interactive interview and the master prompt are summarized below:

- **Confirmed Decision 1 (Serverless & Zero-Lag Architecture)**: Eliminate all external web servers, localhost HTTP servers, and `.htaccess` network requirements. The application will run 100% offline and standalone with local resource bundles and direct GPU hardware acceleration.
- **Confirmed Decision 2 (Compiler-Free Ready-to-Run Distribution)**: Solve the issue where users compiling Rust receive only a console "hello world" text banner. Package pre-built ready-to-run desktop folders and ZIP distributions that launch immediately on double-click without needing Node, npm, Cargo, or any C/C++ toolchain.
- **Confirmed Decision 3 (Graphics Backend Priority & Menu Switcher)**: Prioritize DirectX 11 and OpenGL compatibility first (for maximum stability on workstations without D3D12/Vulkan), with auto-detection. Add a live GPU backend switcher in the top Menu Bar (under Help / Window) allowing users to switch between DirectX 11, OpenGL, and Modern Auto-Detect modes.
- **Confirmed Decision 4 (Dual Binaries for Troubleshooting)**: Deliver zero-dependency portable bundles with dual launchers:
  1. `VUE_3D_Canvas.bat` / Window Launcher (clean standalone GUI without console window).
  2. `VUE_3D_Canvas_Diagnostic.bat` / Console Binary (outputs GPU adapter details, driver diagnostics, and execution logs for troubleshooting).

---

## 1. Overview & Core Concept

- **What It Does**: Transforms VUE 3D Canvas from a browser-hosted app into a completely self-contained, standalone desktop workstation. Users download a pre-packaged folder or ZIP, double-click the launcher, and immediately work with 3D model texturing, procedural node graphs, layers, and brushes with full GPU hardware acceleration and zero network dependencies.
- **Target Audience / Persona**: 3D texture artists, game developers, modelers, and technical artists running Windows/Linux workstations who need a lightweight Photoshop CS5-style 3D painting suite that runs offline, starts instantly, and does not require web servers or compiler toolchains.
- **Key Value**: 
  - Zero server setup (no `localhost:3000`, no Node server process, no network ports).
  - Pre-compiled zero-friction launch (no compiler errors, no hello-world stubs).
  - Robust GPU compatibility (DirectX 11 & OpenGL compatibility priority with live UI switching).
  - 100% feature parity (all brushes, Blender 2.8+ node graph, stitch studio, layers, .xblend projects, and 3D viewports preserved).

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Zero-Configuration Launch**:
   - User extracts `vue3d_standalone_win64_portable.zip` or opens the pre-built `dist/standalone_desktop/` folder.
   - User double-clicks `VUE_3D_Canvas.bat` (or `.exe`): The application window opens instantly in fullscreen/windowed mode with zero network prompt or firewall alerts.
   - If troubleshooting hardware, user double-clicks `VUE_3D_Canvas_Diagnostic.bat`: A diagnostic console prints hardware adapter info, active graphics backend, shader compiler status, and logs.
2. **Graphics Backend Switching via Menu Bar**:
   - In the top Photoshop CS5 Menu Bar, the user clicks **Help > Graphics Backend & GPU Hardware**.
   - A submenu shows:
     - `● DirectX 11 (Compatibility Priority - Default)`
     - `○ OpenGL 2.0+ / WebGL Accelerated`
     - `○ Modern Auto-Detect (DirectX 12 / Vulkan / Metal)`
     - `Adapter Diagnostics & Capabilities...`
   - Selecting a backend instantly switches the active renderer pipeline, updates the bottom hardware status bar (`● DIRECTX 11 ACCELERATED`), and saves the preference to local offline storage.
3. **Full Desktop Workflow**:
   - Seamless 3D navigation (Blender Drone WASD+QE, trackball orbit, pan, zoom).
   - Photoshop CS5 dark docking panels, floating Gboard-style perimeter-resizable windows, and standalone node inspector pop-ups.
   - Direct local file save/load for `.xblend` projects, `.obj` models, and PBR texture maps without server uploads.

### Visual Identity & Theme
- **Theme Palette**: Photoshop CS5 Dark (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`) with accent borders (`#3d7fb8`, `#e5a038`, `#89b4fa`).
- **Hardware Status Bar**: Bottom bar explicitly displays GPU backend status: `● DIRECTX 11 (D3D11) ACTIVE` or `● OPENGL 2.0+ COMPAT`, memory usage, and zero-server indicator `STANDALONE OFFLINE`.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Serverless Desktop Engine vs. Localhost Web Server
- **Chosen Approach**: Native self-contained client-engine architecture that loads all assets, shaders, scripts, and geometries directly from relative local disk files (`file:///` and bundled desktop shells) without spinning up a background Node/Rust HTTP server.
- **Why**: Eliminates port conflicts (e.g. port 3000 already in use), firewall permission popups, antivirus false-positives, and browser server dependencies.
- **Alternatives Considered**: Background localhost HTTP server (rejected by user: causes network overhead and browser dependency).

### Decision 2: Pre-Packaged Download Bundles vs. Source-Only Compilations
- **Chosen Approach**: Pre-build the entire standalone desktop distribution into `dist/standalone_desktop/` and `release/vue3d_standalone_win64_portable.zip` containing all compiled assets, binaries, DLLs, and zero-dependency double-clickable `.bat` and launcher scripts.
- **Why**: The user specifically experienced confusion where compiling locally produced a terminal hello-world instead of the visual application. Pre-packaging gives them immediate instant gratification.

### Decision 3: Upgrade `crates/vue3d_core` Native Entry Point
- **Chosen Approach**: Replace the terminal-only CLI text loop in `crates/vue3d_core/src/main.rs` with a dual-mode native desktop runner:
  - If executed with GUI flags or default: launches the desktop workstation shell with hardware GPU adapter detection.
  - If executed with `--diagnostic`: runs full GPU device query (D3D11/OpenGL/Vulkan), memory benchmarks, and system checks.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│               VUE 3D CANVAS - STANDALONE DESKTOP WORKSTATION           │
├────────────────────────────────────────────────────────────────────────┤
│  Top Menu Bar (File, Edit, Image, Layer, Select, Filter, Window, Help) │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Help > Graphics Backend Switcher:                                │  │
│  │   [x] DirectX 11 (D3D11)  [ ] OpenGL 2.0+  [ ] Auto-Detect Modern │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────┬────────────────────────────────────┤
│  2D / 3D DUAL GRAPHICS VIEWPORTS │  PHOTOSHOP CS5 DOCKABLE SUITE      │
│  ┌─────────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │ Viewport3D (Model Geometry) │  │  │ Layers Panel (RGBA Blending) │  │
│  │ - DirectX 11 / OpenGL Pipe  │  │  ├──────────────────────────────┤  │
│  │ - Blender Drone WASD+QE     │  │  │ Brushes & Tip Stencils       │  │
│  │ - PBR Shaders & Normal Map  │  │  ├──────────────────────────────┤  │
│  └─────────────────────────────┘  │  │ Blender 2.8+ Shader Nodes    │  │
│  ┌─────────────────────────────┐  │  ├──────────────────────────────┤  │
│  │ Viewport2D (UV Chart Paint) │  │  │ Floating Node Inspector Pop  │  │
│  │ - Multi-layer Composite     │  │  ├──────────────────────────────┤  │
│  │ - Gboard Perimeter Resizing │  │  │ Undo History (3-State Ring)  │  │
│  └─────────────────────────────┘  │  └──────────────────────────────┘  │
├───────────────────────────────────┴────────────────────────────────────┤
│  OFFLINE NATIVE BRIDGE & LOCAL RUNTIME ENGINE                          │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
│  │ Local Asset / Shader Loader  │    │ GPU Backend Dispatcher       │  │
│  │ (No HTTP / No Localhost)     │    │ (DirectX 11 / OpenGL / wgpu) │  │
│  └──────────────────────────────┘    └──────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│  LAUNCHERS (DISTRIBUTION BUNDLE: dist/standalone_desktop/ & .ZIP)       │
│  ├─ VUE_3D_Canvas.bat            (Clean Standalone GUI Launcher)       │
│  ├─ VUE_3D_Canvas_Diagnostic.bat (Troubleshooting Console Diagnostics)  │
│  ├─ run_vue3d.bat / run_vue3d.sh (Cross-platform native launch)        │
│  └─ assets/ & DEPENDENCIES.txt   (Zero-dependency portable runtimes)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Proposed Changes & Implementation Deliverables

#### 1. Serverless Standalone Web/Desktop Engine
- Update `vite.config.ts` to output relative base assets (`base: './'`) so that the application can execute directly without requiring any web server, localhost connection, or `.htaccess` routing.
- Add offline asset fallback and local storage persistence for `.xblend` project files and texture caches.

#### 2. Runtime Graphics Backend Switcher
- In `PhotoshopMenuBar.tsx`, add a dedicated "Graphics Hardware & Backend" submenu under the Help menu.
- Support selecting between:
  - `DirectX 11 (Compatibility Priority - Default)`
  - `OpenGL 2.0+ / Desktop GL`
  - `Modern Hardware Auto-Detect`
- Store chosen backend in persistent local settings.
- Update the bottom status bar in `App.tsx` to reflect the active backend dynamically (`● DIRECTX 11 ACTIVE`, etc.).

#### 3. Rust Engine & Native Executable Overhaul (`crates/vue3d_core`)
- Refactor `crates/vue3d_core/src/main.rs`:
  - Eliminate the confusing console-only hello-world prompt.
  - Implement dual-mode launching: GUI launcher mode that opens the standalone desktop application directly, and `--diagnostic` mode that outputs complete GPU adapter, DirectX 11, OpenGL, and memory capabilities.
  - Add native launch flags (`--dx11`, `--opengl`, `--modern`, `--diagnostic`).

#### 4. Pre-Compiled Standalone Desktop Distribution Package
- Create dedicated distribution packagers:
  - `scripts/build_standalone_desktop.sh` (Linux / CI builder)
  - `scripts/build_standalone_desktop.bat` (Windows 1-click builder)
- Output a complete ready-to-run folder:
  - `dist/standalone_desktop/`
- Output a downloadable zero-dependency portable ZIP:
  - `release/VUE_3D_Canvas_Standalone_Desktop_Win64.zip`
- Include:
  - `VUE_3D_Canvas.bat` (Direct zero-dependency click-to-run GUI launcher)
  - `VUE_3D_Canvas_Diagnostic.bat` (Diagnostic console launcher for troubleshooting)
  - Pre-compiled application assets, geometries, and shaders
  - `assets/` attribution signature and presets
  - Complete `README_STANDALONE.txt` with double-click instructions

#### 5. Documentation & Ledger Governance
- Update `WINDOWS_BUILD_INSTRUCTIONS.md`, `native_c/HANDOFF.md`, `python_desktop/HANDOFF.md`, and `AGENT_STATE.md` with the new standalone serverless architecture and ready-to-run bundle ledger per `RULE[AGENTS_md]`.

---

## Verification Plan

### Automated Verification
- Run `npm run build` to verify clean offline compilation with relative path asset resolution (`base: './'`).
- Run `lint_applet` and `compile_applet` to ensure zero TypeScript, lint, or syntax errors.
- Run the standalone packager script to generate `dist/standalone_desktop/` and verify that `VUE_3D_Canvas_Standalone_Desktop_Win64.zip` is created.

### Manual Verification
- Open the application and verify the Menu Bar Help dropdown contains the new Graphics Backend Switcher.
- Verify switching backends updates the bottom status bar and persists across sessions.
- Verify launching `dist/standalone_desktop/VUE_3D_Canvas.bat` opens the application standalone with zero network dependencies.
