# AGENTS.md - VUE 3D Canvas Developer Handover

## Project Metadata
- **Project Name:** VUE 3D Canvas
- **Author/Creator:** Victory Ukpong
- **Target Architecture:** Rust (Core/Logic) + WASM-first (Browser testing) + Native Windows (DirectX 11 / OpenGL 2.0 fallback).
- **Core Constraints:** Low memory footprint, max 3 undo states in `.xblend`, linked assets by default, no ray-tracing or D3D12 dependency.

## Codebase Structure Guidelines
- `/src/core/`: Rust data structures, memory management, and `.xblend` serialization.
- `/src/renderer/`: DX11 and OpenGL/WebGL abstraction layers.
- `/src/ui/`: Photoshop CS5 dark theme, Autodesk Sketchbook dockable panels, and circular carousel widget.
- `/src/nodes/`: Blender 2.79/2.83 style node graph evaluator for procedural texturing.
- `/src/tools/`: Brush engine, scattering, clone stamp, pen path-distribution, and triplanar box mapping.
- `/assets/`: Contains `signature.png`/`signature.svg` for open-source attribution in the About dialog.

## Handoff Instructions for AI Models (Google AI Studio / Grok)
1. Maintain strict memory optimization guidelines; avoid heavy heap allocations in the painting loop.
2. Ensure file format compatibility with `.xblend` specs (linked models + 3-state undo ring buffer).
3. Verify that all UI components adhere to the Photoshop CS5 dark gray palette.
