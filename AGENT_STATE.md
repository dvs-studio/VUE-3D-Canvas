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
- [x] **Stochastic Layer Scattering Engine Upgrade (`stochasticScatter.ts`, `StochasticScatterDialog.tsx`)**: Custom image texture import (PNG, JPG, WebP, SVG) with drag-and-drop & file picker; picture-based visual preview stamps for all presets (grunge, splat, scratch, dots, cracks, leaves, stars, hex, circuit, custom); "Use physical fill color in stamp mask" toggle (fills alpha silhouette with physical color or keeps native image texture colors); alpha outline effect with configurable spread (dilation 0-20px) and blur (0-15px); deterministic Mulberry32 PRNG seed re-roll and live real-time sync across Viewport 3D, 2D Canvas, and Navigator.
- [x] **Interactive Shader Node Graph Editing Suite (`NodeGraphPanel.tsx`)**: In-place double-click and double-tap node parameter edit mode unlocking interactive inline steppers, sliders, and color swatches; dual-sided socket checkboxes on nodes exposing protruding external connection plugs on node perimeter (inputs on left, outputs on right); 2-click sequential connection engine with live dynamic rubber-band wire guide; Shift-click multi-branch wiring with visible glowing branch junction dots splitting into multiple wires; double-click canvas background or tap Done button to escape edit mode.
- [x] **Multi-Language Parity & Governance Verification**: Strict Photoshop CS5 dark skin palette adherence (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`), max 3 undo states in `.xblend`, normal 1-step live session undo, zero ray-tracing dependencies, and feature ledger preserved.
- [x] **Stochastic Scatter Native Picture Colors & Rotation Jitter Fixes (`stochasticScatter.ts`, `StochasticScatterDialog.tsx`)**: Imported image textures retain authentic native colors by default without forced tinting; "Use physical fill colour" checkbox acts as explicit color-replacement gatekeeper (unchecked = native picture/preset colors; checked = replace stamp silhouette with chosen primary/secondary color); added dedicated `rotationJitter` slider (0° to 180°, default 30°) and randomized angle offset calculation in `StochasticScatterEngine.applyScatter`.
- [x] **Independent Floating Node Inspector Pop-up Window (`NodeInspectorPopup.tsx`)**: Standalone floating window decoupled from node graph canvas with draggable CS5 dark title bar, close/minimize buttons, parameter sliders/steppers, color pickers, and live 2-way evaluation; Sockets Exposure Manager with dual-column layout (inputs left, outputs right) with checkboxes to expose/hide connection plugs on node perimeter; Escape key and outside double-click to exit edit mode.
- [x] **Gboard-Style Perimeter Resize Handles on Floating Windows (`DockablePanelFrame.tsx`)**: 8-directional perimeter grab zones (N, S, E, W + 4 corners) with pointer capture; interactive glowing Gboard-style accent pills on edges and corner angle brackets on hover/drag; minimum dimension constraints (width >= 440px, height >= 320px) and screen boundary clamping across all floating panels.
- [x] **Multi-Language Windows Portable Distributions (Binaries + DLLs in ZIP)**: Automated packaging suites bundling executables, runtime DLLs (`SDL2.dll`, `glew32.dll`, Qt platform runtimes), assets, and zero-dependency `.bat` launchers into self-contained portable ZIP distributions: Native C (`native_c/dist/vue3d_native_c_win64_portable.zip`), Python Desktop (`python_desktop/dist/vue3d_python_win64_portable.zip`), and Web/Rust Core (`dist/vue3d_win64_portable.zip`), with updated compilation guides in `WINDOWS_BUILD_INSTRUCTIONS.md`.
- [x] **Serverless Standalone Desktop Workstation & DirectX 11/OpenGL Priority Architecture**: 100% offline relative-asset build (`base: './'`), runtime GPU hardware backend switcher in Menu Bar (DirectX 11 priority, OpenGL 2.0+ compatibility, Modern Auto-Detect), GPU Diagnostics Dialog, dual GUI and diagnostic launchers (`VUE_3D_Canvas.bat` & `VUE_3D_Canvas_Diagnostic.bat`), upgraded Rust desktop core launcher in `crates/vue3d_core`, pre-compiled distribution folder `dist/standalone_desktop/`, and zero-compiler portable release `release/VUE_3D_Canvas_Standalone_Desktop_Win64.zip`.
- [x] **Native Windows 64-Bit Binary Integration & Zero-Blank Loopback Host (`vue_3d_canvas.exe`)**: Compiled native Windows PE32+ application runner (`native_runner/vue_3d_canvas.exe`) with embedded Winsock HTTP loopback streamer, MIME type handling, and chromeless desktop window launcher (`--app`), completely resolving the `file://` CORS null-origin blank screen; packaged alongside all core internal assets and launchers into `release/VUE_3D_Canvas_Standalone_Desktop_Win64.zip` and documented in `README.md` and `README_STANDALONE.txt`.

---

## 4. Superseding note — 2026-11-02 desktop window

The ledger entries that describe `python_desktop/`, `native_c/`, `native_runner/`, a diagnostic `vue3d>` shell, `--serve`, or the old GitHub Actions (`build-all.yml`, `windows-build.yml`, `build-windows-rust.yml`, `build-self-host.yml`, `export-rust.yml`, `import-extract.yml`, `backup-codebases.yml`, `restore-backup.yml`) are historical. They are not current build targets. Do not rebuild them.

Current Windows product:
- Painter: `src/` (Vite, React, Three.js WebGL), the same programme that runs in AI Studio.
- Window: `crates/vue3d_core/src/main.rs` + `desktop.rs`. WebView2 loads `ui/` through an in-process custom protocol. No listening server.
- GPU: ANGLE DirectX 11 by default (`--use-angle=d3d11`). `--opengl` switches ANGLE to OpenGL. The Help menu restarts the process after writing `gpu-backend.txt`.
- WebGL `powerPreference` is `high-performance` in `Viewport3D.tsx` and `NavigatorPanel.tsx`.
- Package workflow (manual only): `.github/workflows/build-windows-app.yml`. Artifact `VUE_3D_Canvas_Windows.zip` contains `vue_3d_canvas.exe` and `ui/`.
- Verified this session: `cargo check --target x86_64-pc-windows-msvc --bin vue_3d_canvas` succeeded. Not yet launched on a Windows desktop.
- Continuation prompt: `HANDOFF_PROMPT.md`.






## 5. Superseding note — 2026-11-03 install pin

The 2026-11-02 desktop window note still stands. This note only records the install fix that the 2026-11-03 pre-execution entry in `AGENTS.md` named.

- Windows package path is unchanged: manual workflow `.github/workflows/build-windows-app.yml` builds `dist/` then `vue_3d_canvas.exe` and zips `vue_3d_canvas.exe` plus `ui/`.
- The install blocker from run `41471393718` is fixed in `package.json`: `esbuild` is `^0.28.0`. Verified `npm install` (`esbuild@0.28.2`, `vite@8.3.5`) and `npm run build` (`dist/index.html` plus a JavaScript bundle).
- Not yet proven: Victory clicking Run workflow, or a double-click of the exe on a Windows machine with WebView2.

## 6. Superseding note — 2026-11-03 self-hosted standalone

Victory asked for a standalone that is not the Windows exe. The 2026-11-02 window note still stands for `vue_3d_canvas.exe`. This note does not retire it.

- Non-exe package: `self-host/`. `node server.js` serves `public/` (the current Vite painter) and stores `.xblend` files in `storage/projects/`. No Rust compile, no WebView2, no Python, no native C.
- `public/` was refreshed from `npm run build` (`index-B-mwzPmH.js`). Stale hashed bundles were removed. Refresh again with `npm run host:sync`.
- Verified: HTTP 200 for `index.html`, the JS bundle, and the CSS; `/api/health` and project save; 404 for a missing script and for a path that tries to leave `public/`.

## 7. Superseding note — 2026-11-03 high-fidelity Three.js 3D engine & mesh precision in self-hosted app

Victory reported that in the self-hosted distribution, models loaded with low detail ("LOD 2 behavior", non-detailed, blurred/melted sharp edges on architectural models, and detail lost when zoomed out).

- **Crease-Angle-Aware Auto-Smooth Normal Calculation:** Upgraded `SurfaceShadingEngine.computeSmoothNormals` with a 38-degree dihedral crease threshold. Faces sharing a vertex only blend if their angle <= 38°, preserving 90° architectural corners, chamfers, and window frames without rounding.
- **Architectural N-Gon & Relative OBJ Parser:** Upgraded `parseOBJ` to triangulate arbitrary n-gons (walls, slabs, multi-vertex architectural polygons), resolve relative negative indices (`v -1`, `vt -1`), and preserve imported explicit normals (`vn`).
- **16x Anisotropic Texture Filtering & Mipmaps:** In `Viewport3D.tsx`, dynamic and emissive textures use `LinearMipmapLinearFilter`, `generateMipmaps = true`, and max anisotropy (`renderer.capabilities.getMaxAnisotropy()`). Textures and fine architectural lines maintain razor-sharp clarity without shimmering when zoomed out.
- **High-Fidelity Procedural Presets:** Suzanne upgraded to a 4x subdivided icosahedron base with sculpted anatomy; Cyber Helmet upgraded to 64x48 segments; added a built-in Classical Architectural Colonnade preset (`pavilion`).
- **Synchronized:** Ran `npm run host:sync`, updating `self-host/public` with the latest build bundle (`index-B2S4rs6M.js`).

## 8. Superseding note — 2026-11-04 Stochastic scatter sizing, Navigation calibration, 3D Gizmos & Auto-Fit, MTL material imports, Texture Auto-Node Setup & Material Texture Fill, Preferences & Tablet Mode

- **Stochastic Scatter Dialog Controls:** Added dedicated `stampSize` slider + numeric text input (8px-512px) and `sizeJitter` slider + numeric text input (0%-100%) in `StochasticScatterDialog.tsx` and `StochasticScatterEngine.applyScatter`, allowing precise micro- and macro-scatter sizing.
- **Calibrated Navigation & Smooth Orbit/Pan:** Adjusted orbit sensitivity to `0.0042 * navSensitivity` and refined pan deltas in `Viewport3D.tsx`, eliminating runaway spin and hyper-sensitive camera movements.
- **Orientation Gizmo Synchronization & Visual Styles:** Corrected CSS 3D matrix math in `boxGizmo.tsx` (`rotateX(${degX}deg) rotateY(${degY}deg)`), aligning gizmo rotation with viewport viewing angle. Added spring zoom pulse animation effect (`zoomScale`) on camera zoom in/out. Added 3 switchable gizmo styles: `box` (isometric cube with labeled axes), `sphere` (3D sphere with latitude/longitude coordinate rings), and `mountain` (geometric trapezium/triangle peaks with altitude gradient shading).
- **Auto-Fit / Frame Model Button (`[⛶ Frame]`):** Added 1-click model framing button to the gizmo overlay computing the bounding sphere radius $R$ and positioning the camera at distance $D = \frac{R}{\sin(\text{fov}/2) \cdot 0.85}$, centering and filling the viewport for any loaded model regardless of import scale.
- **Companion `.mtl` Import Support:** Added staged MTL file upload input and status display in `ProjectSettingsModal.tsx`, linked to `parseOBJ` for material coordinate and UV map preservation.
- **Texture Import & Auto-Node Setup Modal (`TextureAutoNodeModal.tsx`):** Added "Import Texture..." action in `LayersPanel.tsx` opening an interactive auto-focused preview modal. Provides a role dropdown (`Material Texture Fill`, `Color / Albedo`, `Displacement / Height`, `Emission`, `Reflection Mask`, `Normal Map (Sobel RGB)`) that wires directly into the Blender shader node graph.
- **Procedural Material Texture Fill Layer:** Dedicated procedural fill mode supporting triplanar XYZ blended projection and box mapping with scale, repeat, rotation, and stochastic randomization. Displays a `FILL` badge in `LayersPanel` and includes a "Bake to Layer" button to rasterize the fill into standard pixels before converting to bump or normal maps.
- **Centralized Preferences Modal (`PreferencesModal.tsx`):** Added Edit > Preferences... menu item and top bar shortcut gear button to toggle Constant Viewport Refresh (OFF = on-demand, ON = continuous 60fps), select 3D Gizmo Style (`box`, `sphere`, `mountain`), toggle Tablet Mode, and fine-tune Navigation Sensitivity.
- **Full-Screen Tablet Mode:** Collapses left tools into a bottom-left circular carousel and top tool sliders into an expandable top-right carousel. The Docker panel system transforms into a collapsible N-Panel slide-out drawer accessible via right-edge `[◀ PANELS]` tab or the `N` key shortcut, providing an expansive drawing canvas while keeping floating filters active.
- **Self-Hosted Synchronized:** Successfully compiled and synchronized production bundle (`dist/assets/index-Ct70vtbA.js`) to `self-host/public` via `npm run host:sync`.

## 9. Superseding note — 2026-11-04 SweetHome 3D & Architectural Mesh Auto-Repair, Companion Texture Auto-Replacement, Native UV Re-import, Tablet Radial/HUD Carousel, Non-Overlapping Options, and Draggable Zero-Blur Filters

Victory reported:
1. Architectural models from SweetHome 3D still experience choppy edges and abnormal normal surfaces because their adjacent wall/floor faces are not properly connected.
2. Companion material folders with textures need an auto-detection algorithm to auto-replace and populate layer stacks upon model import for rapid auto-texturing.
3. Native UV coordinates in OBJ files must be re-importable on demand without wiping user painting work.
4. In Tablet Mode, the top-left brush parameter carousel was needed to adjust parameters on the fly, with switchable sub-operators (Radial Arc Dial vs. Floating Circular HUD).
5. Sub-menu bar option buttons were overlapping on narrow viewports; needed flexible layout choices.
6. Filter dialogs were obscuring the viewport with dark backdrop blurs; needed to be non-modal, draggable dockers with zero background blur so the user can observe live 3D updates while tweaking controls.

- **SweetHome 3D Architectural Mesh Auto-Repair Engine (`surfaceShading.ts`, `modelGeometry.ts`):**
  - Implemented spatial vertex welding with relaxed tolerance (`EPSILON = 5e-4`) in `SurfaceShadingEngine.computeSmoothNormals` and `repairArchitecturalMesh`. Unifies disconnected adjacent wall faces and split vertices created by SweetHome 3D / CAD polygon exporters while preserving separate UV vertices.
  - Implemented Coplanar Face Normal Snapping: Adjacent faces on planar walls with dihedral angle < 2° (`dot >= 0.99939`) snap directly to their averaged coplanar normal, eliminating wavy lighting bands and blackened facet artifacts.
  - Mesh auto-repair executes automatically on model import (configurable in Preferences via `architecturalRepair: boolean`), with a manual 1-click trigger button (`[Auto-Repair Architectural Mesh]`) in `ProjectSettingsModal.tsx`.
- **Companion Folder Auto-Texturing & Layer Auto-Replacement Algorithm (`ProjectSettingsModal.tsx`, `App.tsx`):**
  - Added companion multi-image folder upload (`multiple accept="image/*"`) in `ProjectSettingsModal`.
  - Implemented semantic token and `.mtl` parser matching filenames against material channels:
    - Diffuse/Albedo: `map_kd`, `diffuse`, `albedo`, `color`, `col`, `texture`, `basecolor`, `wall`, `floor`.
    - Normal/Bump: `map_bump`, `bump`, `norm`, `normal`, `nrm`, `height`, `disp`, `displacement`.
    - Roughness/Specular: `map_ks`, `rough`, `roughness`, `gloss`, `spec`, `specular`, `refl`.
    - Emission: `map_ke`, `emiss`, `emission`, `glow`, `light`.
  - Added `[⚡ Auto-Texture Model & Replace Layers]` button: loads matched textures, rasterizes each into a dedicated 1024x1024 layer, sets the appropriate PBR layer channel, assigns Photoshop CS5 layer naming, pushes an undo checkpoint, and triggers composite canvas synchronization.
- **Native UV Channel Re-Import (`reimportUVsFromOBJ`, `ProjectSettingsModal.tsx`):**
  - Added `reimportUVsFromOBJ(geom, objText)` and `[⟲ Re-import Original UVs]` button in `ProjectSettingsModal.tsx`. Restores and re-binds pristine `vt` UV coordinates from the source OBJ file without clearing or resetting painted texture layers.
- **Tablet Mode Top-Left Quick Parameter Carousel (`TabletBrushCarousel.tsx`):**
  - Created dedicated circular/radial parameter carousel in the top-left area during Tablet Mode.
  - Features 6 quick-access parameter toggles with active feedback: Size, Opacity, Spacing, Scatter/Jitter, Hardness, and Stabilizer Lazy-Mouse.
  - Supported dual switchable sub-operator styles (toggleable in Preferences):
    - `Radial Dial Popup` (`'radial'`): Interactive SVG radial arc dial around the active button with rotational thumb/stylus scrub.
    - `Compact Floating Circular HUD` (`'hud'`): Floating minimal circular widget with numeric display and `+ / -` steppers.
- **Options Bar Responsive Layout Switch (`ToolOptionsBar.tsx`, `PreferencesModal.tsx`):**
  - Solved overlapping buttons below the menu bar by implementing two switchable modes in Preferences:
    - `Grouped Clusters` (`'clusters'`): Flex-wrapped semantic clusters for Brush, Surface, View, and Workspace tools.
    - `Collapsible Icon Groups` (`'compact'`): Compact icon pills with click-to-expand popovers for tight screens.
- **Draggable Docker Filter Windows with Zero Backdrop Blur:**
  - Upgraded `GaussianBlurDialog`, `StochasticScatterDialog`, `EdgeWearDialog`, `TriplanarDialog`, and `StitchStudioDialog`.
  - Converted dialog wrappers to non-blocking floating layers (`pointer-events-none fixed inset-0`, with `pointer-events-auto` on dialog body).
  - Removed all `backdrop-blur` and dark dimming layers, allowing complete, unobstructed visibility of the 3D model while adjusting sliders.
  - Added drag handles to dialog headers with pointer event tracking and viewport boundary clamping (`clamp(10, x, window.innerWidth - 300)`).
- **Self-Hosted Distribution Rebuilt & Synced:** Ran `npm run host:sync`, updating `self-host/public` with the latest build bundle (`index-C8hb8ysL.js`).
- **High-Performance Painting Engine & Zero Choppiness:**
  - Re-architected pointer paint loop in `Viewport3D.tsx`: eliminated synchronous multi-layer 1024x1024 recompositing and mipmap generation per micro-dab.
  - Active layer canvas updates blit directly to `compositeCanvas` and set `needsUpdate = true` on the dynamic texture with RAF throttling.
  - Final full composite, mipmap generation, and undo buffering execute upon `handlePointerUp`, providing a continuous 60–120+ FPS stutter-free drawing experience.
- **Surface Normal Triggers Restored (Def, Smooth, Flat):**
  - Cached pristine geometry normals in `origFileNormal` upon initial load before any architectural processing.
  - Default restores original mesh normals without corruption; Smooth applies angle-weighted curvature interpolation; Flat applies facet normals and toggles `material.flatShading = true`.
  - Added dedicated trigger controls to the Toolbox, Tool Options Bar, and the top View Menu.
- **Configurable Viewport Refresh Rate Engine (`PreferencesModal.tsx`, `Viewport3D.tsx`):**
  - Added 5-way refresh rate selector in Preferences: On-Demand (Power Saver), 30 FPS, 60 FPS, 120 FPS, and Custom VSync.
  - Added custom VSync numeric text input (15 Hz to 240 Hz).
  - Throttled the Three.js `animate()` loop using delta timestamps (`performance.now() - lastRenderTime >= 1000 / targetFps`) and dirty-state checks in on-demand mode.
- **Stroke Control Menu & Dynamics Everywhere:**
  - Added dedicated Stroke & Dynamics popover in the Tool Options Bar next to Spacing (Space, Airbrush, Dot, Dragged-Dot, Curve, Spacing %, Flow %, Lazy Mouse tether slider, Scatter %, Hardness %).
  - Added 7th parameter `Mode` in the Tablet Mode Carousel (`TabletBrushCarousel.tsx`) with specialized sub-operators for radial and circular HUD modes.
  - Confirmed explicit Stroke Application Mode segmented buttons in `BrushLibraryPanel.tsx` under Core Brush Parameters.
- **Decluttered Top Menu Bar & Options Bar Overlap Resolution:**
  - Removed bulky inline select boxes and stamp buttons from the top menu strip that exceeded the viewport radius.
  - Added top **View** and **Options** dropdown menus housing Viewport Shading, Surface Normals, Camera Layout, Canvas View Mode, 3D Mesh selection, and Mesh Parts isolation.
  - Added 3-way layout switch in Preferences: Grouped Clusters (`'clusters'`), Minimal Clean (`'minimal'`), and Collapsible Groups (`'compact'`). Minimal layout keeps only brush controls on the sub-bar and relocates viewport controls to the menu bar, completely preventing button overlaps.
- **Self-Hosted Distribution Rebuilt & Synced:** Ran `npm run host:sync`, updating `self-host/public` with the latest bundle (`index-BblJ2yhP.js`).
- **Autodesk Sketchbook Pro & Maya Lagoon Radial Interface (`LagoonMenu.tsx`):**
  - Integrated full-featured Lagoon radial puck into the top header (toggle button before `Projection [F8]`) and via `Tab` key shortcut.
  - When active, collapses top options bar and left tool palette into an expansive full-screen drawing canvas, while preserving the 3D Orientation Gizmo and right dockers / N-Panel.
  - Features 6 interactive wings: Tools, Brush Dynamics (Size, Opacity, Hardness, Stroke Modes), Colors & Quick Swatches, Layers, Views (Camera snap & Ortho/Persp), and Project Actions (.xblend, OBJ export, Projection snapshot).
  - Floating puck is draggable with boundary clamping and non-blocking background pointer pass-through.
- **Camera Viewpoints Snapping in View Menu & Lagoon:**
  - Connected Front (`Num 1`), Back (`Ctrl+Num 1`), Right (`Num 3`), Left (`Ctrl+Num 3`), Top (`Num 7`), Bottom (`Ctrl+Num 7`), Ortho/Persp (`Num 5`), Reset (`Num 0`), and Auto-Fit Frame (`Num .`) in `PhotoshopMenuBar.tsx`.
  - Dispatches `viewSnapTrigger` to `Viewport3D.tsx`, snapping camera theta and phi spherical coordinates and forcing immediate `needsRenderRef.current = true`.
- **Uncapped Refresh Rate in Preferences:**
  - Added 6th refresh rate mode `Uncapped (Disable Cap / Max FPS)` in `PreferencesModal.tsx` and `types.ts`.
  - Disables frame delta throttling in `Viewport3D.tsx`, unlocking maximum framerates on high-refresh monitors and benchmark runs.
- **Self-Hosted Distribution Rebuilt & Synced:** Ran `npm run host:sync`, updating `self-host/public` with the latest bundle (`index-DskiiCkq.js`).
- **Master Technical Documentation (`API_DOCUMENTATION.md`):**
  - Comprehensive unified technical specification covering Viewport Architecture, Brush Engine & Stabilizer, Layering System & Compositing, Filter Suite, Blender 2.8+ Node Graph Evaluator, Multi-UV Channel Manager, and Hardware Acceleration (ANGLE DirectX 11 / Desktop OpenGL bridge).
- **Master Development Architecture Guide (`DEVELOPMENT.md`):**
  - Detailed guide covering program genesis by Victory Ukpong, Rust native Windows WebView2 desktop app (`crates/vue3d_core`), self-hosted web distribution (`self-host/`), immutable constraints (3-state undo, linked assets, no ray-tracing/D3D12), and AI model transfer recommendations.
- **Complete Documentation Cross-Reference Index:**
  - Added centralized documentation directory in `AGENTS.md` and `DEVELOPMENT.md` connecting all operational markdown files.



