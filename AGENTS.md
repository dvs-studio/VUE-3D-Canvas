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

### 2026-11-02 — pre-execution (desktop window, before code)
- Reviewed every markdown file, the eight workflow files, `crates/vue3d_core/src/main.rs`, `lib.rs`, and the Three.js renderer setup.
- Confirmed the AI Studio app is `src/`. Confirmed the Rust bin only printed a diagnostic shell. Confirmed `python_desktop/` and `native_c/` are absent.
- Next code change, and only this: replace the console bin with a WebView2 window that loads `dist/` through an in-process protocol, force ANGLE DirectX 11, request the high-performance GPU from WebGL, delete the old workflows and `native_runner/`, and add one `workflow_dispatch` workflow Victory can run by hand.
- Continuation prompt for the second account: `HANDOFF_PROMPT.md`.
