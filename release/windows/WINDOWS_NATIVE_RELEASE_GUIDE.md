> Do not start this until Victory accepts the self-host work in `LAYER_PBR_PLAN.md`. The Windows window hosts that page. It does not reimplement the layers.

# VUE 3D Canvas - Native Windows Release Guide (DirectX 11 / OpenGL)

**Status, 2026-11-19 — aspirational native roadmap, not implemented:** the current Windows executable is a Rust/Wry/Tao shell around the React/Three.js painter in WebView2. ANGLE selects D3D11 by default for WebGL; there is no raw D3D11 device, native HLSL material pipeline, native brush renderer or WGL implementation in the current application. The direct-hardware and zero-copy claims below are future goals only, not current capabilities. Build the existing shell with `.github/workflows/build-windows-app.yml`; read the **Current Windows redevelopment handover** appended at the end before attempting a true native rewrite.

**Author / Creator:** Victory Ukpong  
**Architecture:** Rust Native Desktop Binary (`vue_3d_canvas.exe`)  
**Graphics APIs:** Direct Direct3D 11 (HLSL 5.0) & OpenGL 2.0+ Core Fallback  
**Target IDE:** Visual Studio Code — *Zero Visual Studio Community Edition Required*  

---

## 1. Why Native Windows (.exe) vs. WebGL?

If you experienced sluggishness or high latency in the browser / WebGL environment on Windows, running the **Native Windows Executable (`vue_3d_canvas.exe`)** bypasses:
1. **WebGL Compositor Latency:** Eliminates Chromium/browser sandbox overhead and IPC context switches.
2. **Direct Hardware Context:** Directly binds to your GPU via **DirectX 11 (D3D11)** or **WGL/OpenGL**, providing instantaneous 60+ FPS brush strokes and surface projection.
3. **Zero-Copy Double-Buffered Swapchain:** Eliminates browser memory copies for large 4K and 8K textures.
4. **Hardware Tablet Stylus Precision:** Direct access to Windows Ink and Wintab tablet APIs with zero polling delay.

---

## 2. Compiling in Visual Studio Code (2 Options)

Open the project in **VS Code**. You do NOT need the 20-30 GB Visual Studio Community Edition IDE.

### Option A: Microsoft MSVC Build Tools (Headless CLI, ~1.5 GB)
1. Run in Windows PowerShell as Administrator (one-time setup):
   ```powershell
   winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"
   ```
2. Double-click `build_release_msvc.bat`, or in the VS Code Terminal run:
   ```powershell
   cargo build --release --bin vue_3d_canvas
   ```
3. The executable will be generated at `release/windows/bin/vue_3d_canvas.exe`.

### Option B: MinGW-w64 GNU (100% Free of Visual Studio)
1. Install MSYS2 / GCC (one-time setup):
   ```powershell
   winget install MSYS2.MSYS2
   ```
2. Double-click `build_release_gnu.bat`, or in the VS Code Terminal run:
   ```powershell
   rustup target add x86_64-pc-windows-gnu
   cargo build --release --target x86_64-pc-windows-gnu --bin vue_3d_canvas
   ```

---

## 3. Running the Native Application

Double-click `run_vue3d_native.bat` or run:
```powershell
.\bin\vue_3d_canvas.exe --dx11 --high-perf
```

### CLI Command Flags:
- `--dx11`: Ask ANGLE to use DirectX 11 (default).
- `--opengl`: Ask ANGLE to use OpenGL.
- `--modern`: DirectX 11 plus WebGPU browser features. The painter itself is still WebGL.
- There is no `--serve` server mode.

---

## 4. Troubleshooting
- **Missing DLLs (`vcruntime140.dll`):** Install the lightweight [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) or compile via `build_release_gnu.bat` (statically linked GCC runtime).
- **GPU Driver Warning:** Ensure your GPU graphics drivers (NVIDIA, AMD, or Intel) are up to date. The engine supports any DirectX 11 Feature Level 10_0 or OpenGL 2.0+ GPU (Intel HD 4000+, GeForce 400+, Radeon HD 5000+).


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
