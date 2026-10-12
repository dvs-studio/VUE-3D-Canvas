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

## Handoff Instructions for AI Models (Google AI Studio / Grok)
1. Maintain strict memory optimization guidelines; avoid heavy heap allocations in the painting loop.
2. Ensure file format compatibility with `.xblend` specs (linked models + 3-state undo ring buffer).
3. Verify that all UI components adhere to the Photoshop CS5 dark gray palette (`#333333`, `#2b2b2b`, `#3c3c3c`).
4. Ensure all layer tools (Gaussian Blur, Stochastic Scattering, Jenny Stitch Studio, Layer Conversions) maintain preview/commit semantics with undo/redo support.
