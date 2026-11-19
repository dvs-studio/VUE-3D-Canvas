Self-host development was completed and packaged before this Windows handover. The Windows build remains a separate shell/redevelopment track; read the current handover below before changing it.

# VUE 3D Canvas - Windows Compilation Guide (VS Code Edition)

**Current product state, 2026-11-19:** the self-host React/Three.js painter remains the active implementation and behavioural reference. Latest self-host source is `8ef43083078ce650e7c9ddda2de2a99ff41b2378`, packaged by run #169. Do not rely on old hashed JS filenames; use `self-host/public/index.html` and the latest generated assets. The Windows executable is currently a Rust/Wry/Tao native window hosting this same web painter in WebView2; it is not a native D3D11/HLSL painter rewrite.

**The build that produces the application is the manual GitHub Action `Build Windows Application` (`.github/workflows/build-windows-app.yml`), or `scripts\build_standalone_desktop.bat` on Windows.** It compiles the painting UI and a native window. It does not zip a console demo. Sections below that mention `python_desktop/`, `native_c/`, or older Actions are retired and must not be followed.

**Author / Creator:** Victory Ukpong  
**Project:** VUE 3D Canvas  
**Target Environment:** Visual Studio Code (VS Code)  
*Note: This guide is designed exclusively for VS Code users. You do NOT need the heavy Visual Studio Community Edition IDE.*

---

## 1. Current architecture and prerequisites

Read the **Current Windows redevelopment handover** appended at the end of this file before changing the Windows build. The current shell uses `crates/vue3d_core/src/main.rs` and `desktop.rs`, Wry/Tao + WebView2, and an adjacent `ui/` folder. ANGLE routes WebGL to D3D11 by default; this is not direct native D3D11 rendering. The current manual workflow is `.github/workflows/build-windows-app.yml`; the local builder is `scripts\build_standalone_desktop.bat`.

## 1. Prerequisites Setup

You only need lightweight command-line tools and Visual Studio Code:

### Step 1: Install Visual Studio Code
Download and install [Visual Studio Code](https://code.visualstudio.com/).

### Step 2: Install Recommended VS Code Extensions
Launch VS Code, press `Ctrl + P`, and install:
- `ext install rust-lang.rust-analyzer`
- `ext install tamasfe.even-better-toml`
- `ext install dbaeumer.vscode-eslint`

### Step 3: Install Rustup
1. Download `rustup-init.exe` from [https://rustup.rs](https://rustup.rs).
2. Choose default installation (stable toolchain).

### Step 4: Install Lightweight C++ Compiler (No VS Community Needed)
Choose either of the following two options:

#### Option A: Standalone Visual Studio Build Tools (CLI Only, ~1.5 GB)
In PowerShell as Administrator:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"
```
*(This installs only the headless MSVC compiler and Windows SDK command-line tools without the 20GB+ Visual Studio Community GUI).*

#### Option B: MinGW-w64 (100% Free of Visual Studio)
If you prefer not to install any Microsoft build tools at all:
```powershell
# 1. Install MSYS2 MinGW-w64
winget install MSYS2.MSYS2

# 2. Add GNU target to Rust
rustup target add x86_64-pc-windows-gnu
rustup default stable-x86_64-pc-windows-gnu
```

### Step 5: Install Node.js
Install Node.js 22 (the current Windows GitHub Action uses Node 22; use the same major version for reproducible builds) from [https://nodejs.org](https://nodejs.org).

---

## 2. Compiling and Running in VS Code

Open the project folder in VS Code (`File > Open Folder...`).

### Method 1: Using Pre-Configured VS Code Tasks
Press `Ctrl + Shift + B` (or menu `Terminal > Run Task...`):
- Select **`1. Run Dev Server (Vite)`** to start the local web application at `http://localhost:3000`.
- Select **`4. Cargo: Build Rust Core & Native CLI (Release)`** to compile `vue_3d_canvas.exe`.
- Select **`3. Run Self-Hosted Server`** to launch the standalone local self-hosted server.
- Select **`6. Package Self-Hosted Distribution (ZIP)`** to bundle the self-hosted distribution into a ZIP file.

### Method 2: Using the VS Code Integrated Terminal
Open the terminal (`Ctrl + ~`):

#### A. Run Development Server
```powershell
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

#### B. Compile Native Windows Executable (`vue_3d_canvas.exe`)
```powershell
cargo build --release --bin vue_3d_canvas
```
The resulting binary is located at:
```
target\release\vue_3d_canvas.exe
```

#### C. Run the Windows application
Copy `dist\index.html` and `dist\assets` into a `ui` folder beside `target\release\vue_3d_canvas.exe`, then double-click the exe. `scripts\build_standalone_desktop.bat` does this. There is no `--serve` mode.

#### D. Compile WASM Module
```powershell
# Install wasm-pack
cargo install wasm-pack

# Build WASM
wasm-pack build crates\vue3d_core --target web --release --out-dir wasm_pkg
```

---

## 3. Running the Self-Hosted Version (`self-host/`)

A turnkey, self-hosted distribution is located in `self-host/`:

1. **One-Click Launch:**
   Double-click `self-host\start.bat`.
2. **From VS Code Terminal:**
   ```powershell
   node self-host\server.js
   ```
3. Open `http://localhost:3000`.
4. Projects are persistently stored in `self-host\storage\projects\` and textures in `self-host\storage\textures\`.

---

## 4. GitHub Actions CI & ZIP Artifacts

All workflow artifacts are zipped and ready for direct download.

---

## 5. Portable Multi-Language Windows Distributions (Binaries + DLLs in ZIP)

For maximum portability across different Windows computers without requiring development runtimes, dedicated packaging tools create self-contained ZIP distributions bundling executables, runtime DLLs (`SDL2.dll`, `glew32.dll`, Qt platform runtimes), assets, and zero-dependency `.bat` launchers:

### Retired
`native_c/` and `python_desktop/` are not in this repository and are not build targets. Do not recreate their packagers.

### C. Windows application folder (`scripts/`)
- **On Windows:** `scripts\build_standalone_desktop.bat`
- **Output:** `dist\VUE_3D_Canvas_Windows\vue_3d_canvas.exe` with a `ui` folder beside it
- **GitHub:** Actions → Build Windows Application → Run workflow. Download `VUE_3D_Canvas_Windows.zip`.

---

## 6. Windows application folder

`scripts\build_standalone_desktop.bat` writes `dist\VUE_3D_Canvas_Windows\`. Double-click `vue_3d_canvas.exe` in that folder. The `ui` folder must stay beside the exe. Do not launch `index.html` by itself, and do not use the removed diagnostic batch files. The same package is the artifact from the manual **Build Windows Application** workflow.

The Help menu GPU switch writes `gpu-backend.txt` and restarts the window so ANGLE can change between DirectX 11 and OpenGL.




## Current Windows redevelopment handover — 2026-11-19 (read before native work)

### Product status and source of truth
- Finish and validate the self-host painter first. Latest self-host source revision: `8ef43083078ce650e7c9ddda2de2a99ff41b2378`. Latest generated `self-host/public/` output commit: `6ca5b70`.
- Latest self-host CI: workflow run #169 / ID `44538905738`, success. It ran Node dependency installation, Vite production build, `npm run host:sync`, blank-package validation, generated-output commit, ZIP packaging and artifact upload. Artifact `VUE_3D_Canvas_SelfHost` ID `14536189234`, 1,078,042 bytes, SHA-256 `57530146a4923253abe3fb4a7658e994a0bc99f90a315ccf132520cae52e22da`. Download: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44538905738/artifacts/14536189234
- Self-host success is not Windows native build success and does not prove manual desktop/Android interaction. No Windows workflow was run as part of this self-host pass.
- Active painter implementation remains React 19 + TypeScript + Vite 8 + Three.js under `src/`; `self-host/public/` is its generated deployable package. `npm run host:sync` builds and synchronizes that output. Treat the current self-host app as the behavioural/feature reference for any future Windows redevelopment.

### What the Windows application currently is (important correction)
- The current Windows executable is a **native window shell around the existing web painter**, not a native Direct3D painter rewrite.
- Entry point: `crates/vue3d_core/src/main.rs`; window/WebView integration: `crates/vue3d_core/src/desktop.rs`; dependencies: Rust `wry = 0.57` and `tao = 0.37` in `crates/vue3d_core/Cargo.toml`.
- The shell loads the built UI from the adjacent `ui/index.html` using Wry's in-process `vue://localhost` custom protocol. It does not need to start an HTTP server. The portable package layout is `vue_3d_canvas.exe` beside a `ui/` folder containing the Vite build.
- WebGL is rendered inside WebView2; ANGLE defaults to D3D11. `--opengl` selects the OpenGL ANGLE path; `--modern` adds the WebGPU browser flags but does not turn the painter into a native WebGPU renderer. The app does not currently own a raw D3D11 device, native HLSL material pipeline, WGL renderer, or native brush engine.
- Windows 11 normally includes WebView2 Runtime; Windows 10 may need Evergreen WebView2 Runtime. The shell stores WebView2 profile data in `webview2-data/` beside the executable, persists the selected backend in `gpu-backend.txt`, and writes startup failures to `vue3d-startup-error.log` beside the exe.

### Current Windows build path
- Manual GitHub Action: `.github/workflows/build-windows-app.yml` (workflow_dispatch only; Windows runner). It installs Node 22, runs `npm install`, `npm run build`, validates `dist/index.html` and JS assets, installs stable Rust, runs `cargo build --release --bin vue_3d_canvas`, assembles `VUE_3D_Canvas_Windows/` with exe + `ui/`, then uploads `VUE_3D_Canvas_Windows.zip`.
- Local Windows folder builder: `scripts\\build_standalone_desktop.bat`. It runs `npm run build`, builds the Rust binary and assembles `dist\\VUE_3D_Canvas_Windows\\`. It currently does not create the GitHub Actions artifact ZIP itself.
- Use the workflow file and scripts as the executable truth. Older docs below that mention console binaries, Python/C++ desktop folders, old workflow names, raw DirectX device access, native HLSL painting, Windows Ink integration or guaranteed performance improvements are historical/aspirational unless separately implemented and tested.

### Future Windows redevelopment direction (not implemented by this handover)
1. Do not replace the working self-host painter or conflate the Wry shell with a native renderer. Keep a separate Windows redevelopment branch/workstream until the native app reaches feature parity.
2. First produce a feature-parity matrix from the current self-host application: model import and mesh/material data; layers and blend modes; brush/pen/tablet input; texture filters; UV unwrap/edit/channel/rebake; selection/masks; PBR maps and export; undo/redo; project serialization and backward-compatible `.xblend`; dockers, floating windows, scaling and touch interactions.
3. Preserve file-format and interaction contracts. Use existing React implementation, API documentation, `XBLEND_FORMAT_SPECIFICATION.md`, and current handover records as behavioural references. Do not silently change project compatibility, layer ordering, active UV channel, texture dimensions, filter seeds or undo semantics.
4. Decide the native rendering architecture only after profiling the self-host baseline and confirming target GPU requirements. If implementing direct D3D11/HLSL, it must be a genuine renderer and resource-management implementation, not a renamed WebView2/ANGLE path. Keep a documented OpenGL fallback only if it can be maintained and tested.
5. Port in vertical slices and compare output against the self-host reference: viewport/model display; texture/layer painting; UV mapping and bake; filters; PBR export; project save/load; then UI/workspace and tablet input. Include automated asset/format fixtures and measured CPU/GPU/memory performance.
6. Maintain an agentic handover with completed features, parity gaps, file-format changes, renderer decisions, build instructions, known defects and exact tested Windows versions/GPU drivers. Never claim native GPU features from a successful shell build alone.

### Outstanding shared product issues for Windows planning
- Suzanne OBJ integration is still not complete. The user reports two OBJ candidates (separate head/eyes meshes and a backup with head/eye vertex groups). Earlier integration failed because the candidate binaries were not ingested into the repo/session accessible to the editing agent. Locate/restore the supplied OBJ files before choosing a candidate. Preserve the original Suzanne asset; create a separate integrated candidate, validate normals, connected components, boundary edges/holes and UVs, and only promote after inspection.
- UV mapping technology needs a future optimization review: profile unwrap/packing, texel density, island gutter/padding, rasterization, overlap handling and filter sampling before replacing algorithms. Preserve existing known-good UV editor behaviour as a regression baseline.
- Model-edge artefact: character fill tools/utilities leave a visible edge on the model. Record a reproducible mesh/material/UV case and compare viewport fill boundary, UV raster boundary, texture sampling and alpha before changing it.
- Hatching, cross-hatching and hashing need user-facing size/scale controls plus independent jitter and rotation-angle jitter controls. Keep their seeds/repeatability and current density behaviour documented while adding the controls.
- Filtered textures can show visible lines/gaps around UV island boundaries even though clean UV cases look correct. This is a known defect; no fix was included in the current toolbar-placement change.
- The UV toolbar position is mode-dependent: in combined 3D Viewport + 2D UV split mode, the 2D tools/options strip and its horizontal scrollbar are at the absolute bottom-centre of the 2D pane (excluding dockers); in dedicated 2D UV mode, the same strip returns to the top-left. Preserve this distinction.

### Current self-host UI correction (2026-11-19)
- `Viewport2D` receives `isSplitView={viewMode === 'split'}` from `App.tsx`. Split mode positions the 2D tools/options rail bottom-centre; dedicated 2D mode keeps it top-left. The draggable circular scrollbar remains attached to the strip.
- This is a UI placement-only change. UV algorithms, unwrap, packing, channel assignment, rebake, filter sampling and model geometry were not modified.
- Build/package run #169 passed for source revision `8ef43083078ce650e7c9ddda2de2a99ff41b2378`. Manual visual testing remains required.
