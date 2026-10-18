# VUE 3D Canvas

**Author / Creator:** Victory Ukpong  
**Target Architecture:** Rust Core + WASM-first (Browser Testing) + Native Windows Desktop (DirectX 11 / OpenGL 2.0 Fallback)  
**Project Format:** `.xblend` (Linked 3D Assets Default + 3-State Undo Ring Buffer)  
**Primary IDE:** Visual Studio Code (VS Code) — *No full Visual Studio Community Edition required*  

---

## 1. Project Overview & Philosophy

**VUE 3D Canvas** is an ultra-lightweight, high-performance 3D texture painting and digital sculpting workstation designed with a low memory footprint and zero raytracing or D3D12 dependency.

The software fuses the productivity paradigms of classic digital art suites:
- **Photoshop CS5 Fusion:** Dark gray workspace palette (`#333333`, `#2b2b2b`, `#3c3c3c`), layer stack, blend modes, marquee selectors, and separable filter pipelines.
- **Autodesk Sketchbook & MediBang:** Dockable Docker tab groups and a circular carousel brush wheel (`V` key).
- **Blender 2.8+ Viewport:** Middle-mouse orbit/pan/zoom navigation, standard numpad camera hotkeys, quad split-view layout, and node graph evaluator.
- **Self-Hosted Autonomy:** Complete offline-capable self-hosted server (`self-host/`) for running on localhost, home lab, or private network without cloud dependencies.

---

## 2. Compiling with Visual Studio Code (VS Code)

This project is tailored specifically for **VS Code**. You do **not** need the full, heavyweight Visual Studio Community Edition (saving ~20-30 GB of disk space).

### Prerequisites
1. **VS Code:** Install [Visual Studio Code](https://code.visualstudio.com/).
2. **Recommended VS Code Extensions:**
   - `rust-lang.rust-analyzer` (Rust code intelligence & compiler checks)
   - `tamasfe.even-better-toml` (Cargo.toml support)
   - `dbaeumer.vscode-eslint` (TypeScript / React linting)
3. **Rust Toolchain:** Install `rustup` from [https://rustup.rs](https://rustup.rs).
4. **C++ Compiler (Choose ONE — no VS Community needed):**
   - **Option A (Lightweight MSVC Build Tools CLI):**
     Run in Windows PowerShell:
     ```powershell
     winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"
     ```
   - **Option B (MinGW-w64 / GCC — 100% Free of Visual Studio):**
     Install MinGW-w64 via MSYS2 or `winget install MSYS2.MSYS2`, then set target:
     ```powershell
     rustup target add x86_64-pc-windows-gnu
     rustup default stable-x86_64-pc-windows-gnu
     ```
5. **Node.js:** v18.x or v20.x LTS from [https://nodejs.org](https://nodejs.org).

---

## 3. Cargo & Native Compilation Instructions

Open the project folder in **VS Code** and open the Integrated Terminal (`Ctrl + ~`):

### A. Compile Rust Core & Native Host Binary (`vue_3d_canvas`)
```bash
# Build optimized release binary
cargo build --release

# Or build explicitly for the native host binary
cargo build --release --bin vue_3d_canvas
```
The compiled executable will be located at:
- Windows: `target/release/vue_3d_canvas.exe`
- Linux / macOS: `target/release/vue_3d_canvas`

### B. Run Native Host Binary
```bash
# Run benchmark (tests 1,000,000 procedural triplanar evaluations with 0-allocation loop)
cargo run --release -- --bench

# Launch self-hosted native server on port 3000
cargo run --release -- --serve 3000

# Inspect and validate an .xblend project file
cargo run --release -- --xblend path/to/project.xblend
```

### C. Compile WebAssembly (WASM) Module
```bash
# Install wasm-pack if not already installed
cargo install wasm-pack

# Build WASM package targeting the browser
wasm-pack build crates/vue3d_core --target web --release --out-dir wasm_pkg
```

### D. Compile Web Frontend (Vite + React + Three.js)
```bash
# Install NPM dependencies
npm install

# Run hot-reloading dev server on http://localhost:3000
npm run dev

# Build production static bundle in dist/
npm run build
```

---

## 4. Self-Hosted Full Programme (`self-host/`)

A ready-to-run, zero-dependency self-hosted version of the complete programme is included in the `self-host/` directory.

### Quick Start (Localhost or LAN):
1. **Via Node.js in VS Code:**
   ```bash
   node self-host/server.js
   ```
   Or:
   ```bash
   npm run serve
   ```
2. **Via 1-Click Launchers:**
   - Windows: Double-click `self-host/start.bat`
   - Linux / macOS: Run `self-host/start.sh`
3. **Via Docker Compose:**
   ```bash
   docker compose -f self-host/docker-compose.yml up -d
   ```

### Storage & Persistence
- Projects (`.xblend` files) are saved automatically to `self-host/storage/projects/`.
- Uploaded custom textures, decals, and brush tips are saved to `self-host/storage/textures/`.
- The server automatically sets `Cross-Origin-Opener-Policy: same-origin` and `application/wasm` MIME headers required for WebGL and WASM.

---

## 5. VS Code Tasks Integration

Built-in VS Code tasks are configured in `.vscode/tasks.json`. Press `Ctrl + Shift + B` or open `Terminal > Run Task...`:
1. `1. Run Dev Server (Vite)` - Starts the interactive development server.
2. `2. Build Web Production Client (Vite)` - Compiles `dist/` bundle.
3. `3. Run Self-Hosted Server` - Starts `self-host/server.js`.
4. `4. Cargo: Build Rust Core & Native CLI (Release)` - Runs `cargo build --release`.
5. `5. Cargo: Build Browser WASM Package` - Compiles WebAssembly crate.
6. `6. Package Self-Hosted Distribution (ZIP)` - Compresses the self-hosted distribution into a `.zip` archive.

---

## 6. GitHub Actions Workflows & ZIP Artifacts

All GitHub Actions CI workflows (`.github/workflows/`) are configured to save build outputs directly into **ZIP format** artifacts for convenient one-click download:

| Workflow File | Description | Output ZIP Artifact |
|---|---|---|
| `windows-build.yml` | Builds native Windows x64 `.exe` with MSVC toolchain | `vue-3d-canvas-windows-zip` (`vue-3d-canvas-windows-x64.zip`) |
| `build-self-host.yml` | Builds WASM module, web frontend, and packages self-host directory | `vue-3d-canvas-self-hosted-zip` (`vue-3d-canvas-self-hosted.zip`) |
| `build-all.yml` | Complete multi-stage build matrix (Windows, WASM, Frontend, Master Suite) | `vue-3d-canvas-windows-x64-zip`, `vue-3d-canvas-wasm-zip`, `vue-3d-canvas-frontend-zip`, `vue-3d-canvas-full-suite-zip` |

---

## 7. Feature Architecture Breakdown

| Module | Location | Description |
|---|---|---|
| **Multi-Texture Triplanar Box Filter** | `src/tools/fillSuite.ts` & `src/ui/TriplanarDialog.tsx` | Triplanar projection with multi-texture mixing operator, noise/cloud blending, edge bleed, tiling randomization, and custom upload stack. |
| **Pattern Stamp Decal Tool** | `src/tools/patternStampTool.ts` & `src/ui/PatternStampDialog.tsx` | 3D surface decal projection stamper with sharpness masks, edge jitter, and blendable grunge overlays. |
| **Edge Wear & AO Filter** | `src/tools/edgeWearFilter.ts` & `src/ui/EdgeWearDialog.tsx` | Procedural curvature edge wear and ambient occlusion cavity dirt generator. |
| **Per-Layer PBR Node Setup** | `src/ui/LayerSettingsModal.tsx` | Roughness, metallic, bump/height, normal strength, emission, and matcap reflection sliders with bump-only toggle. |
| **Blender Material Converter** | `src/nodes/blenderMaterialImporter.ts` | Ingests Blender shader nodes and converts them into VUE 3D Canvas layers and node networks. |
| **FBX & glTF Multi-Channel Exporter** | `src/core/modelExporters.ts` & `src/ui/ExportModelDialog.tsx` | Automated texture separation into Albedo, Emission, Displacement/Normal, Roughness, and Metallic maps. |
| **Smart UV Unwrap Engine** | `src/tools/smartUVUnwrap.ts` | 2D UV editor automatic unwrap analyzing open edges and angles > 60° with island shelf packing. |
| **Symmetry Tool Docker** | `src/ui/panels/SymmetryPanel.tsx` | Bilateral mirror painting across X/Y/Z with origin/cursor locator and 3D visual slice plane. |
| **Gaussian Blur Tool** | `src/tools/gaussianBlur.ts` | Separable 1D convolution blur targeting active layer (0.1 to 250px radius). |
| **Stochastic Scatter** | `src/tools/stochasticScatter.ts` | Random stamp distribution with deterministic PRNG and repeat/continuous modes. |
| **Jenny Stitch Studio** | `src/tools/stitchStudio.ts` | Mesh vertex edge topology follower with displacement depth and thread shaders. |
| **Undo / Redo Preferences** | `src/ui/UndoSettingsDialog.tsx` | Custom undo buffer state limit (3 to 120 states) with live RAM estimation. |

---

## 8. Memory & System Constraints

- **`.xblend` File Format:** Custom specification saving layer stack, blend modes, node graphs, and 3-state undo ring buffer. Mesh models remain linked by default to preserve minimal project size.
- **Hardware Limits:** Compatible with DirectX 11 Feature Level 10_0 and WebGL 1.0/2.0 standard extensions without requiring DirectX 12 DXR hardware raytracing.
- **Attribution:** Open-source software created by Victory Ukpong.
