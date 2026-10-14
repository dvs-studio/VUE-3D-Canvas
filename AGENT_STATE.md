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
| `/src/renderer/Viewport3D.tsx` | WebGL 3D painting engine, Three.js scene, UnrealBloomPass post-processing, HDRI reflections & lighting, x-ray 3D cursor, Quad/Perspective cameras, BoxGizmo. |
| `/src/renderer/Viewport2D.tsx` | 2D UV texture canvas painter, touch navigation, physical selection shaded light/dark overlay, Bezier curve editing, multi-axis symmetry. |
| `/src/renderer/hdriManager.ts` | Equirectangular panorama generators (Studio, Sunset, Cyberpunk, Daylight, Custom), reflection math $R = \text{reflect}(-V, N)$, texture caching. |
| `/src/ui/PhotoshopMenuBar.tsx` | Top application menu bar (File, Edit, Layer, Filter, View, Window, Help), Projection [F8] trigger, theme selector dropdown. |
| `/src/ui/ToolOptionsBar.tsx` | Contextual tool parameters (brush size, opacity, hardness, spacing, stabilizer lazy-mouse, stencil masks, patterns, symmetry toggle). |
| `/src/ui/ToolBox.tsx` | Left Photoshop CS5 toolbar (Brush, Mask Brush, Eraser, Blur, Clone, Smudge, Pen, Marquees, Lasso, Bucket, Gradients, Eyedropper, Hand, Zoom). |
| `/src/ui/panels/LayersPanel.tsx` | Layer management, blending modes, opacity, layer conversions (Bump, Normal, Alpha Clip, Emissive Bloom). |
| `/src/ui/panels/SymmetryPanel.tsx` | Symmetry & Cloning Studio (Multi-axis checkboxes X/Y/Z/All/Off, + to - vs - to +, Mesh origin vs 3D virtual cursor locator). |
| `/src/ui/panels/MaskPanel.tsx` | Masking & Selection Studio (Mask brush, physical light/dark shading preview, invert, blur, expand, shrink, fill, erase). |
| `/src/ui/panels/NodeGraphPanel.tsx` | Node Editor (Blender 2.8+) graph editor, Vector Transform node, Principled BSDF, ColorRamp, procedural noise/voronoi/musgrave/wave/brick/checker. |
| `/src/nodes/blender28Nodes.ts` | Shader node definitions (`ShaderNodeVectorTransform`, mapping, mix_rgb, color_ramp, principled_bsdf). |
| `/src/nodes/nodeEvaluator.ts` | Procedural texture graph baker, coordinate transformation math between World, Object, Camera spaces. |
| `/src/tools/layerConversions.ts` | Image algorithms: Sobel normal maps, luminance bump maps, binary alpha clip masks, emissive glow conversion. |
| `/src/tools/brushEngine.ts` | 60 FPS brush applicator, Medibang lazy-mouse stabilizer, stencils, patterns, clone stamp, smudge. |
| `/src/tools/symmetryEngine.ts` | Multi-axis coordinate mirroring, cloning across weighted center/cursor planes. |
| `/src/tools/maskEngine.ts` | Morphological mask operations (dilation, erosion, feathering, rasterization, direct bitmap dab painting). |
| `/src/core/types.ts` | TypeScript types for layers, blend modes, brushes, shader nodes, selection masks, HDRI, Bloom, and themes. |

---

## 3. Active Feature Verification Ledger

- [x] **Agent State Ledger (`AGENT_STATE.md`)**: Instant lookup file active at root.
- [x] **Bloom Post-Processing Pass**: `EffectComposer` + `RenderPass` + `UnrealBloomPass` + `OutputPass` integrated into `Viewport3D` with strength, radius, threshold controls and presets (Radiant Neon, Soft Glow, Cyberpunk Max, Subtle Shimmer) to enhance glowing emissive materials.
- [x] **Emissive Layer Conversion**: `LayerConversions.convertToEmissive` hooked to `handleConvertToEmissive` in `App.tsx`, `PhotoshopMenuBar` Layer menu with `BLOOM` tag, and `LayersPanel` context menu; sets `layer.channel = 'emission'` and feeds directly into 3D `MeshStandardMaterial.emissiveMap` with `emissiveIntensity = 2.2` for radiant Bloom glow.
- [x] **Direct Painting on UV Map Canvas**: `Viewport2D.tsx` fully supports direct responsive painting for all tools: Brush, Eraser, Blur, Clone, Smudge, Gradients, Pen vector curves, Bucket fill, Mask Brush (`mask_brush`), Rect Marquee (`marquee_rect`), Lasso (`lasso`), and Polygon Lasso (`polygon_lasso`).
- [x] **Physical Selection Shading (Light vs Dark)**: Editable area rendered as shaded light (unlocked, illuminated); protected area rendered as shaded dark (`rgba(8, 12, 22, 0.65)`) with high-contrast animated marching ants border in both 2D and 3D viewports. Mask brush directly paints/erases editable light areas.
- [x] **Numpad Docker Removed**: Completely unmounted from Window menu, DockerGroup 2 tabs, and standalone docked panels as requested.
- [x] **Node Editor Renamed**: "Node Editor (Blender 2.8+)" across all titles, panels, and menus.
- [x] **Vector Transform Shader Node**: `ShaderNodeVectorTransform` added with Vector, Point, Normal modes and World, Object, Camera coordinate matrix transformations.
- [x] **HDRI Reflections & Viewport Lighting**: Equirectangular panorama presets, checkbox to light main viewport vs reflections only, blurred background, reflection vector math $R = \text{reflect}(-V, N)$.
- [x] **3D Cursor X-Ray Overlay**: Visible through the mesh with `depthTest: false`, Blender-style target ring, crosshairs, and dynamic text Sprite bearing the Axis name.
- [x] **Multi-Axis Symmetry Checkboxes**: Independent checkboxes for X, Y, Z, All, and None (Off) in `SymmetryPanel` and real-time brush stroke dab mirroring.
- [x] **Theme Switcher Dropdown**: Selectable directly after the Projection [F8] button (`cs5`, `bw78` with viewport shadow, `modern`, `ps2022`).
- [x] **Help Menu**: Docx link removed; `help.pdf` and `tutorial.pdf` supported; `help.docx` preserved on disk.
- [x] **Name Changes Tracking**: `NAME_CHANGES.txt` active at root documenting all professional naming corrections.
