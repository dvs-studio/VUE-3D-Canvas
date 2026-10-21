# AGENTS.md - VUE 3D Canvas Developer Handover

## Project Metadata
- **Project Name:** VUE 3D Canvas
- **Author/Creator:** Victory Ukpong
- **Target Architecture:** Rust (Core/Logic) + WASM-first (Browser testing) + Native Windows (DirectX 11 / OpenGL 2.0 fallback).
- **Core Constraints:** Low memory footprint, max 3 undo states in `.xblend`, linked assets by default, no ray-tracing or D3D12 dependency.

## Codebase Structure Guidelines
- `/src/core/`: Rust data structures, memory management, and `.xblend` serialization.
- `/src/renderer/`: DX11 and OpenGL/WebGL abstraction layers (`Viewport3D.tsx`, `Viewport2D.tsx`, `modelGeometry.ts`).
- `/src/ui/`: Photoshop CS5 dark theme, Autodesk Sketchbook dockable panels, Docker tab groups, circular carousel widget, and dialogs.
- `/src/nodes/`: Blender 2.79/2.83 style node graph evaluator for procedural texturing.
- `/src/tools/`:
  - `brushEngine.ts`: Brush engine with stabilizer lazy-mouse, stroke modes, stencils, and patterns.
  - `fillSuite.ts`: Upgraded Triplanar Box Filter with UV-less XYZ projections (YZ/XZ/XY), normalized sharpness blending, slope and altitude masks, and height-aware blending.
  - `gaussianBlur.ts`: Image-editor Gaussian blur for selected layers using separable passes, quality presets, and premultiplied alpha.
  - `stochasticScatter.ts`: Stochastic layer scattering engine with deterministic PRNG and repeat/continuous modes.
  - `stitchStudio.ts`: Jenny Stitch Studio with mesh topology edge following, displacement depth, and thread shaders.
  - `layerConversions.ts`: Grayscale Bump Map, Sobel RGB Normal Map, and Alpha Clip Mask tools.
- `/assets/`: Contains `signature.png`/`signature.svg` for open-source attribution in the About dialog.

## Live Texture Preview Architecture
- **Canonical Composite Canvas:** Maintained synchronously at the application level (`App.tsx`). Both `Viewport3D` and `NavigatorPanel` bind directly to this canvas.
- **Synchronization Hook:** Whenever 2D painting, 3D painting, layer operations, filters, or undo/redo actions occur, `syncCompositeCanvas` updates the canonical canvas and increments `textureVersion`, immediately setting `needsUpdate = true` on Three.js canvas textures in both viewports.
- **Full UV Range Assurance:** All procedural geometries (Suzanne, Helmet, Primitives) compute clean 0..1 spherical/cylindrical polar UV maps without overlapping gaps.

## Mandatory Governance for AI Models (Google AI Studio, Grok, Claude, GPT)
1. **Never Clear History**: You must **ADD**, never remove, overwrite, truncate, or wipe prior architectural decisions, feature ledgers, or commit history.
2. **Pre-Task Check**: ALWAYS read `AGENT_STATE.md` and relevant `HANDOFF.md` before making edits to verify existing architecture.
3. **Post-Task Ledger Update**: You MUST update `AGENT_STATE.md` and language-specific `HANDOFF.md` / `API.md` after completing your task, appending newly verified capabilities.
4. **Strict Memory & State Limits**: Maintain low memory footprint, max 3 undo states in `.xblend` project files (normal 1-step undo in live session), linked 3D assets by default, no ray-tracing or D3D12 dependency.
5. **Photoshop CS5 Dark Skin**: Adhere strictly to the CS5 palette (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`).
6. **Multi-Language Parity**: Any new feature or shader upgrade should be mirrored across Rust/Web, Native C (`native_c/`), and Python Desktop (`python_desktop/`).
