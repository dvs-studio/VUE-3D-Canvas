# AGENTS.md - VUE 3D Canvas Developer Handover

## Project Metadata
- **Project Name:** VUE 3D Canvas
- **Author/Creator:** Victory Ukpong
- **Target Architecture:** The real application is the Vite/React/Three.js painter in `/src`. The Windows product is a native window around that painter (WebView2). WebGL reaches the GPU through ANGLE: DirectX 11 by default, OpenGL when launched with `--opengl`. Rust in `/crates/vue3d_core` is the window process and the small core library. It is not a console demo.
- **Core Constraints:** Low memory footprint, max 3 undo states in `.xblend`, linked assets by default, no ray-tracing or D3D12 dependency.

## Codebase Structure Guidelines
- `/src/core/`: Rust data structures, memory management, and `.xblend` serialization.
- `/src/renderer/`: The painting viewports (`Viewport3D.tsx`, `Viewport2D.tsx`, `modelGeometry.ts`). WebGL, with `powerPreference: 'high-performance'`.
- `/src/ui/`: Photoshop CS5 dark theme, Autodesk Sketchbook dockable panels, Docker tab groups, circular carousel widget, and dialogs.
- `/src/nodes/`: Blender 2.79/2.83 style node graph evaluator for procedural texturing.
- `/src/tools/`:
  - `brushEngine.ts`: Brush engine with stabilizer lazy-mouse, stroke modes, stencils, and patterns.
  - `fillSuite.ts`: Upgraded Triplanar Box Filter with UV-less XYZ projections (YZ/XZ/XY), normalized sharpness blending, slope and altitude masks, and height-aware blending.
  - `gaussianBlur.ts`: Image-editor Gaussian blur for selected layers using separable passes, quality presets, and premultiplied alpha.
  - `stochasticScatter.ts`: Stochastic layer scattering engine with deterministic PRNG and repeat/continuous modes.
  - `stitchStudio.ts`: Jenny Stitch Studio with mesh topology edge following, displacement depth, and thread shaders.
  - `layerConversions.ts`: Grayscale Bump Map, Sobel RGB Normal Map, and Alpha Clip Mask tools.
- `/crates/vue3d_core/src/main.rs` and `desktop.rs`: Windows application process. Opens the built UI from the `ui/` folder beside the exe. No HTTP server.
- `/assets/`: Contains `signature.png`/`signature.svg` for open-source attribution in the About dialog.

## Live Texture Preview Architecture
- **Canonical Composite Canvas:** Maintained synchronously at the application level (`App.tsx`). Both `Viewport3D` and `NavigatorPanel` bind directly to this canvas.
- **Synchronization Hook:** Whenever 2D painting, 3D painting, layer operations, filters, or undo/redo actions occur, `syncCompositeCanvas` updates the canonical canvas and increments `textureVersion`, immediately setting `needsUpdate = true` on Three.js canvas textures in both viewports.
- **Full UV Range Assurance:** All procedural geometries (Suzanne, Helmet, Primitives) compute clean 0..1 spherical/cylindrical polar UV maps without overlapping gaps.

## Mandatory Governance for AI Models (Google AI Studio, Grok, Claude, GPT)
1. **Never Clear History**: You must **ADD**, never remove, overwrite, truncate, or wipe prior architectural decisions, feature ledgers, or commit history. You may retire a path by appending a superseding note. Do not silently delete the painting-feature ledger.
2. **Pre-Task Check**: ALWAYS read `AGENT_STATE.md` and `HANDOFF_PROMPT.md` before making edits.
3. **Post-Task Ledger Update**: You MUST update `AGENT_STATE.md` and `AGENTS.md` after completing your task, appending newly verified capabilities.
4. **Execution bookends**: At the start of every execution, upload the updated `AGENTS.md` before other code changes. At the end, upload `AGENTS.md` again with what actually landed.
5. **Strict Memory & State Limits**: Maintain low memory footprint, max 3 undo states in `.xblend` project files (normal 1-step undo in live session), linked 3D assets by default, no ray-tracing or D3D12 dependency.
6. **Photoshop CS5 Dark Skin**: Adhere strictly to the CS5 palette (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`).
7. **One Windows application**: Ship the painter inside a native window. Do not maintain parallel Python Desktop or Native C applications. Do not add a server just to open the UI. `src/nodes/blender_28_importer.py` stays; it runs inside Blender.

## Retired (do not rebuild)
- `python_desktop/` and `native_c/` were documentation-only. They are not a build target.
- `native_runner/` (C loopback server + chromeless browser) is not the product.
- GitHub Actions that only ran `cargo build` and zipped the console exe were producing the hello-world programme. The manual workflow `.github/workflows/build-windows-app.yml` is the Windows package.

## Handover log

### 2026-11-02 — post-execution (desktop window landed)
- Pushed before the code change as `5c5d9f6`.
- `crates/vue3d_core/src/main.rs` no longer prints a diagnostic shell. On Windows it opens a WebView2 window (`desktop.rs`) and loads `ui/index.html` through the in-process `vue://` protocol. `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` selects ANGLE DirectX 11, OpenGL (`--opengl`), or DirectX 11 plus WebGPU flags (`--modern`).
- Help → GPU backend writes `gpu-backend.txt` and restarts the exe. `Viewport3D` and `NavigatorPanel` request `powerPreference: 'high-performance'`.
- Old workflows and `native_runner/` are deleted. The only workflow is `.github/workflows/build-windows-app.yml`, and it runs only when Victory clicks Run workflow.
- `cargo check --target x86_64-pc-windows-msvc --bin vue_3d_canvas` finished clean on the Linux sandbox. The exe was not run here, so the first real proof is that GitHub artifact.
- Landed as commit `e6e4169` on `main`. Handover hash commit `9d133eb`.

### 2026-11-03 — pre-execution (make the manual Windows build actually install)
- No run of `.github/workflows/build-windows-app.yml` exists yet. It is still `workflow_dispatch` only.
- The last push that still had the old workflows failed **Build Self-Hosted Full Programme** (`41471393718`) at `npm install`: `vite@8.3.5` wants optional peer `esbuild@^0.27 || ^0.28`, and the root `package.json` pins `esbuild@^0.25.0`. The Windows workflow uses the same `npm install`, so it would stop before compiling the window.
- This execution only fixes that install conflict, confirms `npm run build` emits `dist/index.html` and a JavaScript bundle, then leaves the manual workflow able to package `vue_3d_canvas.exe` plus `ui/`. No Python desktop, no native C, no server.


### 2026-11-03 — post-execution (npm install conflict fixed)
- Continued from the pre-execution note already on `main` as `6444fb9`. No painting code changed.
- `package.json` devDependency `esbuild` is now `^0.28.0` (was `^0.25.0`). That range satisfies Vite 8's optional peer `esbuild@^0.27.0 || ^0.28.0` and `tsx`'s `esbuild@~0.28.0`.
- Verified here: `npm install` resolved `esbuild@0.28.2` and `vite@8.3.5` with no peer conflict. `npm run build` wrote `dist/index.html`, `dist/assets/index-B-mwzPmH.js` (1443 kB), and `dist/assets/index-DxXuOCkG.css`.
- `package-lock.json` is added so `.github/workflows/build-windows-app.yml` `npm install` uses that tree. `bun.lock` was refreshed to `esbuild@0.28.2` as well. The workflow is still `workflow_dispatch` only. It was not run from this session.
- `crates/vue3d_core/src/main.rs` still calls `desktop::run()` on Windows. The exe was not compiled here. No Python desktop, no native C, no server.

### 2026-11-03 — pre-execution (self-hosted standalone, not the exe)
- Victory asked for a self-hosted standalone that is not `vue_3d_canvas.exe`. The Windows window path stays. This note is the pre-edit bookend only.
- `self-host/` already exists: zero-dependency `server.js`, `start.bat`, `start.sh`, Docker. Its `public/` still points at `assets/index-DOfcFx5E.js` and keeps several older bundles. That is not the painter verified today (`index-B-mwzPmH.js`).
- This execution refreshes `self-host/public` from the current `npm run build`, keeps the server as the way that package opens, and does not add Python, native C, or a new GitHub workflow. The Windows exe workflow is not the target of this run.
