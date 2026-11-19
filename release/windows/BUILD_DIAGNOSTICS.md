Self-host development was completed and packaged before this Windows handover. This file's older console/dual-binary diagnostics are historical; read the current architecture note below.

# VUE 3D Canvas - Windows Build Diagnostics & Native Execution Breakdown

**Current status, 2026-11-19:** this file contains historical diagnostics. The current Windows target is a single Wry/Tao window executable hosting the Vite/React/Three.js painter in WebView2. There is no supported console companion executable or `serve` REPL. Build using `.github/workflows/build-windows-app.yml` (manual dispatch) or `scripts\\build_standalone_desktop.bat`. Do not treat the old console-loop and dual-binary descriptions below as current architecture. See the **Current Windows redevelopment handover** appended at the end.

**Author & Creator:** Victory Ukpong  
**Project:** VUE 3D Canvas  
**Architecture:** Windows window around the Vite/React/Three.js painter. WebGL uses ANGLE (DirectX 11 by default).

---

## 1. Why Did Your Previous Windows Builds Fail or Close Instantly?

Here is the exact diagnostic breakdown of what was occurring and how it has now been resolved:

### A. Missing `[[bin]]` Declaration in Cargo
* **What Happened:** Previously, `crates/vue3d_core/Cargo.toml` only specified `[lib]` with `crate-type = ["cdylib", "rlib"]`. 
* **The Result:** When running `cargo build --release`, Cargo only created `vue3d_core.dll` or `vue3d_core.lib` (dynamic and static libraries). It did **not** generate an `.exe` file in `target/release/`. 
* **The Fix:** We added explicit binary target declarations in `crates/vue3d_core/Cargo.toml`:
  ```toml
  [[bin]]
  name = "vue_3d_canvas"
  path = "src/main.rs"

  [[bin]]
  name = "vue_3d_canvas_console"
  path = "src/main.rs"
  ```
  Now, running `cargo build --release` produces both `vue_3d_canvas.exe` and `vue_3d_canvas_console.exe`.

### B. Instant Process Termination on Launch
* **What Happened:** In standard Windows behavior, when you double-click a console executable in File Explorer, Windows spawns a temporary terminal window, runs `main()`, and when `main()` reaches the final closing brace `}`, Windows **instantly closes** the window.
* **The Result:** The application appeared to "flash open and immediately disappear" after a few milliseconds.
* **The Fix:** We implemented an interactive, persistent terminal loop with command prompt (`vue3d> `), diagnostics, status monitoring, benchmark runners, and local server integration. The window **stays open** indefinitely until you explicitly type `exit` or close the window.

### C. Web Self-Host Slowness on Windows
* **Why it was sluggish:** Running a self-host web build through Windows browsers can suffer from throttled WebGL frame rates if Windows power management sets the browser to "Power Saver" (integrated Intel/AMD graphics instead of your dedicated GPU).
* **The Solution:** The native Windows build (`vue_3d_canvas.exe`) communicates directly with DirectX 11 (D3D11) and OpenGL hardware buffers with zero browser abstraction overhead.

---

## 2. Dual Windows Binary Outputs

We now build two distinct Windows executables:

| Binary Name | Target Mode | Purpose |
|---|---|---|
| `vue_3d_canvas_console.exe` | Interactive Terminal | Displays hardware graphics logs, active DirectX 11 / OpenGL fallback, live diagnostics, benchmarks, and interactive command prompt. Stays open continuously. |
| `vue_3d_canvas.exe` | Silent Desktop GUI | Standard desktop release without a background console window. |

---

## 3. How to Compile in 1 Click on Windows (Using VS Code)

You do **not** need the heavy 40GB Visual Studio Community Edition. You only need **VS Code** with the standard Rust toolchain.

### Option 1: Using VS Code Built-In Build Task
1. Open the project folder in **VS Code**.
2. Press `Ctrl + Shift + B` (or go to **Terminal -> Run Build Task...**).
3. Select **"3. Cargo Build Release (Native Windows .exe)"**.
4. The executables will be generated in:
   ```
   target/release/vue_3d_canvas.exe
   target/release/vue_3d_canvas_console.exe
   ```

### Option 2: Running via VS Code Terminal
Open the VS Code integrated terminal (`Ctrl + \``) and run:
```powershell
cargo build --release
```

To run the interactive console build directly:
```powershell
.\target\release\vue_3d_canvas_console.exe
```

### Option 3: Download Pre-Packaged GitHub Actions ZIP Artifact
Every commit pushed to the repository automatically triggers the GitHub Actions workflow (`.github/workflows/windows-build.yml` and `build-all.yml`). The workflow:
1. Runs on a Windows Server runner with high-performance DirectX 11 SDKs.
2. Compiles `vue_3d_canvas.exe` and `vue_3d_canvas_console.exe`.
3. Packages them into `vue-3d-canvas-windows-x64.zip` and uploads it to GitHub Releases / Actions Artifacts.

---

## 4. Interactive Console Commands Reference

When running `vue_3d_canvas_console.exe`:
- `status`: Displays current GPU backend, shader model, memory overhead, and .xblend undo ring buffer status.
- `serve`: Launches the local high-speed assets server on `http://127.0.0.1:3000`.
- `bench`: Runs the 1,000,000-vector triplanar and normal evaluation speed benchmark.
- `dx11`: Verifies the Direct3D 11 feature level 10_0+ pipeline state.
- `opengl`: Verifies the OpenGL 2.0+ core profile pipeline state.
- `clear`: Clears the terminal screen.
- `exit`: Safely terminates the application.


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
