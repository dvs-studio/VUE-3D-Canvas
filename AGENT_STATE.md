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
| `/src/tools/smartUVUnwrap.ts` | Smart UV projection with Mulberry32 seeded stochastic packing, conformal relaxation, submesh isolation, and edge bleed dilation. |
| `/src/tools/uvChannelManager.ts` | Multi-UV channel manager (original, tight-map, custom) and inverse barycentric triangle re-baker with anti-glitch dilation. |
| `/src/tools/symmetrizeUV.ts` | Bilateral UV mirroring engine (+X/-X) with centerline seam pinning, ear protection, and 3D X-Ray selection filtering. |
| `/src/tools/uvSculptEngine.ts` | Interactive 2D UV sculpt brush engine (Straighten, Smooth Laplacian, Pinch, Expand, Crease). |
| `/src/ui/UVNPanel.tsx` | Photoshop CS5 dark dockable N-Panel for Viewport2D (Unwrap, Channels/Re-bake, Symmetrize, Sculpt brushes). |
| `/src/core/types.ts` | System TypeScript definitions for Layers, PBR props, Triplanar config, Stamp config, Exporters, Nodes, and UV tools. |

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
- [x] **Movable Non-Blocking Pattern Stamp Dialog**: Draggable floating window with zero backdrop blur, allowing real-time 3D model rotation and inspection underneath without interface locking.
- [x] **Clone Stamp Quick Launchers**: Double-clicking the Stamp/Clone tool opens the Pattern Stamp Studio; added quick launcher buttons in the Tool Options Bar and top Menu Bar.
- [x] **Strictly Alpha-Aware Grunge Overlays**: Embedded high-fidelity grunge textures (Scratched Metal, Dirty Spots, Cracked Paint, Worn Patina, Concrete Weathering, Peeling Paint) and custom image upload, strictly clamped inside decal transparency without bleeding.
- [x] **Mask & Torn Edge Alpha Engine**: Centered imported mask texture support with B/W and alpha values modulating the torn edge, rotation slider (0 = "Random", 1-360 = fixed angle), and randomization + scattering controls.
- [x] **Visible Mesh Selector with Name IDs**: Displays submesh name IDs (`[ID: head]`, `[ID: eyes]`, `[ID: dome]`, etc.), "Show All", and a dedicated "Show only selected group" isolation checkbox.
- [x] **Help Menu Theme Switcher**: Added UI theme selector directly inside the Help dropdown menu with checkmarks.
- [x] **Native Windows Release Package (`release/windows/`)**: Standalone native Windows `.exe` architecture with direct DirectX 11 / OpenGL acceleration, MSVC & MinGW build scripts, and launcher batch files.
- [x] **Dynamic UI Theme Synchronization**: Comprehensive CSS variables and Tailwind utility overrides across all panels, headers, dialogs, and toolbars for CS5, BW78, Modern, and PS2022 themes.
- [x] **Navigator 3D Viewport Normals Synchronization**: Passing `surfaceMode` to NavigatorPanel and computing matching surface normals in real-time.
- [x] **Blender Drone Navigation Engine**: Automatic middle-mouse and Alt navigation with camera-relative planar panning, unconstrained continuous trackball orbit, and WASD+QE drone flight controls.
- [x] **Single-Step Undo/Redo Protection**: Strict 1-state undo (`Ctrl+Z`) and redo (`Ctrl+Y`) with keyboard repeat guard, ensuring no accidental 3-state skipping.
- [x] **Universal Presets & Smudge/Eraser Masks**: Embedded thumbnail preset dropdown in the top options bar for all tools, with full tip mask textures and pattern overlays enabled for Brush, Eraser, and Smudge tools.
- [x] **Dual Native Windows Binaries & Build Diagnostics**: Interactive console binary (`vue_3d_canvas_console.exe`) that stays open with interactive shell and diagnostic runner, alongside `vue_3d_canvas.exe` and `BUILD_DIAGNOSTICS.md`.
- [x] **GitHub Actions Backup & Restore Workflows**: `.github/workflows/backup-codebases.yml` packages language-specific ZIP archives (`vue3d-backup-rust-web.zip`, `vue3d-backup-native-c.zip`, `vue3d-backup-python.zip`), preserving all icons (`.ico`, `.svg`, `favicon.png`, `signature.*`) while excluding heavy media files; `.github/workflows/restore-backup.yml` restores from ZIP archives in `backups/` and overwrites code in-place on demand.
- [x] **Mandatory AI Governance Directive**: Codified across `AGENTS.md`, `AGENT_STATE.md`, `native_c/HANDOFF.md`, and `python_desktop/HANDOFF.md`: Any future AI model must **ADD**, never remove, overwrite, truncate, or wipe prior architectural decisions, feature ledgers, or commit history, and must update program MD files before starting and after completing tasks.
- [x] **Standalone Python Desktop Implementation (`python_desktop/`)**: Native Windows desktop application with Photoshop CS5 Dark skin (`#333333`), zero-dependency pure Python compat shim (`vue3d/core/compat.py`), Tkinter native GUI (`vue3d/ui/desktop_gui.py`) without WebGL/browser dependency, PyOpenGL/DirectX 11 fallback, Blender Drone Navigation (WASD+QE), dynamic surface normals (Def/Smooth/Flat), tip masks (grunge, splat, scratch, dots, cracks), 1-step live undo, strictly 3-state `.xblend` ring buffer serializer, and single-file PyInstaller build script (`build_exe.bat`).
- [x] **Standalone Native C/C++ Production Engine (`native_c/`)**: Pure ANSI C99/C11 runtime (`src/main.c`, `src/brush_engine.c`, `src/renderer_gl.c`, `src/xblend.c`), DirectX 11 / OpenGL 2.0+ backend, Blender surface normal calculations, brush/smudge/eraser engine with tip masks and pattern overlays, 1-step live session undo + strictly 3-state `.xblend` binary format, and standalone build scripts for GCC (`build_gcc.bat`), MSVC (`build_msvc.bat`), and Linux (`Makefile`).
- [x] **Dedicated Subsystem Documentation**: `python_desktop/README.md` and `native_c/README.md` containing complete architectural manuals, setup steps, build instructions, and interactive CLI/GUI control references.
- [x] **Isolated Single-Language Export Workflows**: Dedicated GitHub Actions workflows (`export-rust.yml`, `export-python.yml`, `export-c.yml`) preserving all icon assets (`*.ico`, `*.svg`, `favicon.png`, `signature.*`) while excluding heavy media, with optional retention in the repository `export/` directory.
- [x] **Native Non-WebGL Windows CI Workflows**: Standalone Windows runner workflows (`build-windows-rust.yml`, `build-windows-python.yml`, `build-windows-c.yml`) compiling native DirectX 11 / Desktop OpenGL binaries without WebGL overhead (WebGL is strictly reserved for the self-hosted web deployment).
- [x] **Guarded Import & Scoped Extraction Workflow (`import-extract.yml`)**: Interactive dispatch workflow supporting language selection (`rust`, `python`, `c`), archive auto-detection or explicit filename picking from `import/`, optional post-extraction archive deletion, and strict scope safeguards preventing Rust root extraction from affecting `python_desktop/`, `native_c/`, or other subsystems.
- [x] **Navigation Direction Fix & 3D Gizmo Axis Flip Toggle**: Aligned orbit and drone mouse movement to natural Blender directions (dragging right turns model right, dragging up looks up); added 1-click interactive `[INV / NAT]` toggle button to the Viewport 3D Gizmo overlay and HUD across React, Python, and C.
- [x] **Smart UV Unwrap Suite & Stochastic Non-Repetitive Island Packing**: Mulberry32 seeded PRNG, rotation variation, edge non-overlap checks, conformal relaxation, submesh isolation by mesh ID, and configurable island bleeding/gutter dilation (2px-16px) preventing mipmap seams.
- [x] **Multi-UV Channel System & Inverse Barycentric Re-Baker**: Dynamic channel management (`uv_original` preserved reference for material slots, `uv_tightmap`, custom slots) and inverse barycentric triangle re-baking from tight-map back to original UVs with 4px margin dilation.
- [x] **Export Filename UV Channel Midfix**: Export Texture and Model dialogs include active UV channel tag (`[Model]_[Channel]_[UVTag]_[Resolution].png`).
- [x] **3D X-Ray Vertex Selection Brush & Symmetrize UV Engine**: Interactive 3D X-Ray depth-penetrating vertex selection painter with glowing cyan halos for temporary symmetry groups; bilateral UV mirroring (+X/-X) with midline pinning and ear protection.
- [x] **2D UV Viewport N-Panel & Sculpt Brushes**: Dockable Photoshop CS5 dark N-Panel (`UVNPanel.tsx`, shortcut 'N') with interactive 2D sculpt brushes: Straighten, Smooth (Laplacian relaxation), Pinch, Expand, and Crease.
- [x] **Multi-Language Parity (Python & Native C)**: Full algorithmic parity in Python (`python_desktop/vue3d/tools/smart_uv.py`) and Native C (`native_c/include/vue3d.h`, `native_c/src/renderer_gl.c`, `native_c/src/main.c`) with CLI commands and verified syntax.



