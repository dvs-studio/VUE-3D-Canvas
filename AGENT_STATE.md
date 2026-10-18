# AGENT_STATE.md - VUE 3D Canvas Architecture & Fast Tracking Ledger

> **Autonomous Agent Reference File**  
> Maintained to track codebase state, active features, memory constraints, and module indices so subsequent operations never need to run costly project rescans.

---

## 1. Project Specifications
- **Project Name:** VUE 3D Canvas
- **Author/Creator:** Victory Ukpong
- **Target Architecture:** Rust (Core/Logic) + WASM-first (Browser testing) + Native Windows (DX11 / OpenGL 2.0).
- **Core Constraints:** Max 3 undo states in `.xblend` (configurable in Preferences), linked 3D assets by default, low heap allocations in painting loops, no ray-tracing dependencies.
- **UI Skin Palette:**
  - `cs5`: Classic Photoshop CS5 Dark Gray (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`)
  - `bw78`: 78% Black & White Minimalist theme with prominent viewport drop shadow (`#141414` / `#f5f5f5`)
  - `modern`: Modern Studio Dark Slate with indigo highlights (`#13161d`, `#6366f1`)
  - `ps2022`: Photoshop 2022 Flat Graphite (`#1f1f1f`, `#282828`, `#1473e6`)

---

## 2. File Index & Responsibilities

| Path | Primary Responsibility |
|---|---|
| `/src/App.tsx` | Main application shell, canonical composite canvas synchronizer, docker management, keyboard shortcuts, modal state. |
| `/src/renderer/Viewport3D.tsx` | WebGL 3D painting engine, Three.js scene, UnrealBloomPass post-processing, HDRI & Matcap reflections, surface shading engine, Quad/Perspective cameras, Decal & Stamp projections. |
| `/src/renderer/Viewport2D.tsx` | 2D UV texture canvas painter, touch navigation, physical selection shaded light/dark overlay, Bezier curve editing, Smart UV Unwrap, Jenny Stitch. |
| `/src/renderer/surfaceShading.ts` | Dynamic Blender-style surface normal calculator: Def (original normals), Smooth (angle-weighted), Flat (faceted). |
| `/src/renderer/hdriManager.ts` | Equirectangular panorama generators (Studio, Sunset, Cyberpunk, Daylight, Custom), reflection math $R = \text{reflect}(-V, N)$, texture caching. |
| `/src/ui/PhotoshopMenuBar.tsx` | Top application menu bar (File, Edit, Layer, Filter, View, Window, Help), Projection [F8] trigger, theme selector dropdown, mesh parts visibility. |
| `/src/ui/ToolOptionsBar.tsx` | Contextual tool parameters (brush size, opacity, hardness, spacing, stabilizer lazy-mouse, stencil masks, textures, pattern preview & add). |
| `/src/ui/ToolBox.tsx` | Left Photoshop CS5 toolbar (Brush, Mask Brush, Eraser, Blur, Clone, Smudge, Pen, Pattern Stamp, Marquees, Lasso, Bucket, Gradients, Eyedropper, Hand, Zoom, Def/Smooth/Flat toggles). |
| `/src/ui/CircularCarousel.tsx` | Radial widget with vector icons for quick tool selection. |
| `/src/ui/TriplanarDialog.tsx` | Advanced Triplanar Box Filter dialog with multi-texture mixing operator, noise/cloud blending, edge bleed, tiling randomization, and custom uploads. |
| `/src/ui/PatternStampDialog.tsx` | Pattern Stamp configuration dialog for sticker/decal stamping, edge imperfection sliders, and grunge overlay blend effects. |
| `/src/ui/EdgeWearDialog.tsx` | Edge Wear & Ambient Occlusion filter dialog for curvature calculation, cavity dirt, and peeling distress. |
| `/src/ui/LayerSettingsModal.tsx` | Per-layer PBR node configuration (Roughness, Metallic, Bump/Height, Normal, Emission, Matcap/HDRI reflection sliders, bump-only toggle, advanced node switch). |
| `/src/ui/panels/LayersPanel.tsx` | Layer management, blending modes, opacity, grouping containers, right-click context menu (Invert Color, Conversions, Export). |
| `/src/ui/panels/BrushLibraryPanel.tsx` | Brush & Texture library docker, Texture vs Mask tip separation, custom texture saving. |
| `/src/ui/panels/NodeGraphPanel.tsx` | Node Editor (Blender 2.8+) graph editor, 3-step touch connections, tap-to-edit values, Auto Arrange, ShaderNodeUVMap, ShaderNodeEmission. |
| `/src/nodes/blenderMaterialImporter.ts` | Parser and importer for Blender material nodes/files into Vue 3D Canvas layers and node networks. |
| `/src/core/modelExporters.ts` | FBX and glTF exporters with automatic texture channel separation (Albedo, Emission, Displacement/Normal, Roughness, Metallic). |
| `/src/tools/fillSuite.ts` | Multi-texture triplanar box-mapping engine with noise/fractal cloud mixing operator, blank alpha support, and mask constraints. |
| `/src/tools/patternStampTool.ts` | Surface decal projection stamper with sharpness masks and grunge overlays. |
| `/src/tools/edgeWearFilter.ts` | Geometry curvature and ambient occlusion analyzer with procedural edge peeling. |
| `/src/tools/smartUVUnwrap.ts` | Smart UV projection with open edge/dihedral angle clustering, stretch minimization, and shelf bin packing. |
| `/src/core/types.ts` | System TypeScript definitions for Layers, PBR props, Triplanar config, Stamp config, Exporters, and Nodes. |

---

## 3. Active Feature Verification Ledger

- [x] **Agent State Ledger (`AGENT_STATE.md`)**: Instant lookup file active at root.
- [x] **Surface Normal Shading Engine (`surfaceShading.ts`)**: True Blender-style Def, Smooth (angle-weighted), and Flat normal computation dynamically toggled from Toolbox.
- [x] **Smart UV Unwrap Engine (`smartUVUnwrap.ts`)**: 2D UV editor automatic unwrap analyzing open edges and angles > 60° with island packing.
- [x] **Multi-Texture Triplanar Mixing Operator**: Mixing multiple image textures via noise/fractal clouds and pattern mixers, blank alpha blending, edge noise & bleeding, tiling randomization, and `+` texture stack addition.
- [x] **Per-Layer PBR Node Setup & Settings Modal**: Each layer has dedicated PBR properties, matcap/HDRI reflection sliders, Bump-only toggle (bump enabled, color disabled), and Advanced Material Node switch.
- [x] **Layer Invert Color Context Menu**: Added to LayersPanel right-click menu.
- [x] **Brush Docker "Texture" & Carousel Icons**: Pattern renamed to Texture with custom saving, carousel icons updated, mask/pattern preview thumbnails with `+` import.
- [x] **Pattern Stamp Tool**: 3D surface decal stamping with sharpness/imperfection masks and blendable grunge overlays.
- [x] **Edge Wear & AO Filter**: Curvature and ambient occlusion edge wear filter for realistic distress and cavity dirt.
- [x] **Blender Material Converter**: Imports Blender material setups and bridges them into Vue 3D Canvas.
- [x] **FBX & glTF Multi-Channel Exporter**: Automatic baking and separation into Albedo, Emission, Displacement/Normal, Roughness, and Metallic textures for FBX and glTF 2.0.
- [x] **Self-Hosted Full Programme (`self-host/`)**: Standalone distribution with zero-dependency Node server, public web build, project & texture persistence, 1-click start scripts, Dockerfile, and docker-compose.
- [x] **VS Code Workflow Integration**: Configured `.vscode/` tasks, launch, and extensions for development and compilation without requiring Visual Studio Community Edition.
- [x] **ZIP Artifact Workflows**: Updated all GitHub Actions workflows (`build-all.yml`, `build-self-host.yml`, `windows-build.yml`) to compress and save all build outputs into ZIP format artifacts.
