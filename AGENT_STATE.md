# AGENT_STATE.md - VUE 3D Canvas Architecture & Fast Tracking Ledger

## PIN — read only this far

### Current self-host task status — 2026-11-22 (GPT-6)

The current AGENTS.md PIN is authoritative and supersedes older task ordering in this file and older handovers.

- Scope: self-host React/Three/Vite source only: src/ → npm run host:sync → self-host/public/. Do not edit crates/vue3d_core or delete protected safety ZIPs.
- Protected baseline: Victory accepted Suzanne Head + Eyes and the UV-island filter edge fix; the 3D viewport/paint experience is satisfactory. Do not alter Viewport3D, dab compositing or island padding without a new reproducible defect.
- Prior phases A3, A1 and A2 are landed: Powderiser two-pass scatter; Wood frequency randomisation UI; Suzanne Head + Eyes default with Squail removed from the menu; independent symmetry stroke state and mirror dirty bounds. Their CI results do not establish device acceptance.
- Current order is Step 0 scrutiny first, not A4: diagnose/last-command launch path, filter suite, symmetry, boot, Head + Eyes initial state, paint, export, and verify-only subdivision preview. Fix regressions before A4 or any layer technology.
- New code-scan finding: Wood Grain referenced woodSeed in the frequency-jitter calculation before its const declaration, causing a runtime temporal-dead-zone failure when the Wood filter runs. Fixed in source commit 7475d5368f9813f1d6f50db3e10f58d11dd036a8 by resolving the seed before the pixel loop. Self-host sync is committed at 297f230 with bundle index-CqmOQpy4.js; visual verification is pending.
- The filter dialog and apply caller were inspected: the dialog preview uses the shared pixel transform; Apply targets the active unlocked non-group layer, pushes undo, passes the complete config, writes back to the same canvas and notifies the composite.
- Static filter audit remains in SELF_HOST_BUGFIX_2026-11-22.md. The eight filter branches are present; the Wood Grain runtime defect demonstrates why source wiring/CI alone is not enough.
- Do not claim the diagnose/last-command issue is resolved merely because the GPU diagnostics modal is wired. Its Help-menu callback and modal mount exist; actual launch behaviour still needs runtime confirmation and reproduction if it fails.
- Next after Step 0 is complete: A4 filter mesh-part selection, leaving unselected parts unchanged. Reuse the existing mesh-component inventory and rasterizeMeshSurface; do not create a second rasteriser.
- After Victory's next reply, the ordered work is the whole unchecked CURRENT TODO in `AGENTS.md`, one pass. `HOLD-SEL-2026-11-22` (selection cage) is specified and not approved. Do not build it. F7 stays on hold.
- A5/A6/A7 and UI1/UI2/UI3 follow the order in AGENTS.md. Phase B layer technology remains blocked until Step 0 and 2A are healthy. F7 logo fabric remains on hold.
- Manual browser/desktop/Android interaction and visual tests remain required; build/package success is not visual acceptance.

Same sets as `AGENTS.md`. A numbered line is not a history task. `STOP` comes after History.

### Historical to-do — 2026-11-21 source commit `18a80cb` (superseded by the current status above)

Do not re-implement that commit. The self-host bundle after it is `03b8ebd`. Visually test UV-island filter lines, model-edge fills, the Suzanne Head + Eyes preset, and hatch scale/jitter. Manual browser/desktop/Android checks are still open.

**New to-do, not implemented:** dedicated Matcap layer (paint = alpha mask only; convert to colour by dominant-to-lesser average plus 20% of the middle-line colour; export is normal-to-screen matcap mixed with MixRGB in Blender until converted; any source image, stored as JPG not EXR). When the layers panel is narrow, special adds (Material texture fill, Matcap, Group) collapse under one Add button; when it is wide, show them in a row. Do not confuse this with the existing HDRI-versus-matcap reflection switch.

Specialised UV research and Windows shell work are not this slice. See the PIN in `AGENTS.md`.

### Current implementation

`18a80cb` changes `src/tools/textureFilters.ts`, `src/tools/fillSuite.ts`, `src/App.tsx`, `src/ui/TextureFilterDialog.tsx`, `src/renderer/modelGeometry.ts`, `src/ui/PhotoshopMenuBar.tsx`, `.gitignore`, and adds `src/assets/Suzanne.head-eyes.obj`. `src/assets/Suzanne.obj` was not modified. `self-host/public` was not regenerated in the editing session. `npx tsc --noEmit` already failed on older files before this commit; do not block on those unless the Vite build fails.

### Current history — concluded set

2026-11-14 view set. Zoom, resize, mipmaps on pen-up. `index-DXhSIj8p.js`.

### History — concluded set

2026-11-12 filter set. Dialogs open, they do not cover the view, the view sleeps while idle.

When the to-do set is concluded, it becomes Current history, the view set becomes History, and the filter set moves under `STOP`.

## 2026-11-24 — World-space Base Layer checker

The current Base Layer is a procedural world-space background, excluded from UV compositing/export. Its two checker colours are saved globally only when Save is pressed; per-colour opacity and overall Base Layer opacity reset to 100% for a new project/session. Cancel keeps live in-session edits without persisting colour preferences. Reset restores both colours to #9c9c9c and all opacity values to 100%. See [WORLD_SPACE_BASE_LAYER_2026-11-24.md](notes/WORLD_SPACE_BASE_LAYER_2026-11-24.md) for the file/symbol facility index and manual acceptance checklist.

## STOP

Read past this line only if absolutely necessary.

2026-11-09 navigation set, concluded. Free tumble, file normals, full Smooth, UV islands, `file://`.

> **Autonomous Agent Reference File**  
> Maintained to track codebase state, active features, memory constraints, and module indices so subsequent operations never need to run costly project rescans.

## Current self-host (2026-11-15)

The folder to finish is `self-host/`. The page is `index-DXhSIj8p.js` inlined into `self-host/public/index.html`. `file://` and `node server.js` both run it. `npm run host:sync` rebuilds it.

Accepted there: tumble without a pitch lock, file normals, full Smooth, UV islands, Gaussian, Stitch, Triplanar, Scatter, Edge Wear, zoom that redraws without a pan, and a canvas that follows a tablet rotation. Strokes skip mipmaps until pointer-up. Live undo is 30. The file stores 3.

`native_runner/` is retired. Any older checkbox that calls it the Windows product is historical. Do not rebuild it. Do not edit `crates/vue3d_core` until Victory asks. Push uncommitted work about every 4 minutes. No empty commits.

---

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

## 10. Superseding note — 2026-11-09 self-host tumble and file normals

The 2026-11-05 camera note that stored theta/phi is retired for navigation. Snaps still exist. The orbit no longer clamps.

- Free tumble: `src/renderer/freeCamera.ts`, used by `Viewport3D.tsx` and `NavigatorPanel.tsx`.
- OBJ import: file normals stay. Missing `vn` is a flat face normal. No automatic 38° smooth. Unit-sphere scale on imported OBJ only. Weld preference defaults off.
- Session undo remains 30. The file still saves 3.
- Self-host page is inlined (`index-BahJ6256.js` inside `self-host/public/index.html`) for `file://` and `http://`.
- Windows exe was not changed. Next step waits for Victory's test of this self-host build.

## 11. Superseding note — 2026-11-10 filters, smooth, UV islands

- Web view always draws. Refresh-rate control removed from Preferences. Do not bring on-demand back on the web build.
- Smooth is a full average. No 38° crease. No coplanar snap on that path.
- `SmartUVUnwrapEngine` splits by angle from the seed face, packs without stacking, and clones seam vertices.
- UV: double-click island, right-click keeps left or right of U = 0.5, Drag Island moves the selection.
- `layer.uvChannel` is chosen in Layer Settings and becomes the active mesh channel.
- Node bake replaces the active layer pixels instead of painting over them.
- Self-host bundle: `index-D4_J0RPb.js`, inlined for `file://` and `http://`.

## 12. Superseding note — 2026-11-12 filter dialogs

- The bundle to test is `index-DwCqaqSC.js` inside `self-host/public/index.html`.
- Triplanar, Scatter, and Edge Wear open. Their position hooks are above the closed-dialog return.
- Scatter repeats cannot exceed 300.
- The 3D view sleeps while idle and caps at 60 while drawing. A texture change still marks a frame.
- Next agent reads `SELF_HOST_HANDOFF.md` first. Self-host is the folder to finish. Do not start the Windows rewrite.

## 13. 2026-11-13 — dev versus self-host

- Vite shows Edge Wear. That does not clear the bug.
- `file://` and `self-host/server.js` still blank the screen for Triplanar, Scatter, and Edge Wear. Gaussian and Stitch stay up.
- No code change in this note. The next edit has to be proven on the inlined `self-host/public/index.html`.

## 14. 2026-11-14 — filter panels

- Self-host bundle is `index-D2VONoEr.js`.
- Triplanar, Scatter, and Edge Wear open on that page without a full-screen layer. Apply Triplanar leaves the painter up. Scatter preview leaves the model on screen.
- Gaussian and Stitch were not changed.

## 15. 2026-11-14 — before the zoom and resize fix

- Filters on `index-D2VONoEr.js` are the accepted build.
- Next code change: dirty the main view on zoom, resize the canvas with the container, and stop rebuilding mipmaps on every dab.
- Push about every 4 minutes while the working tree is dirty. No empty commits.

## 16. 2026-11-14 — zoom and resize landed

- Bundle `index-DXhSIj8p.js`.
- Zoom redraws the main view without a pan. The canvas resizes with the window, including a tablet rotation. Strokes do not rebuild mipmaps until the pen lifts.










## 17. 2026-11-14 — toggle layers are the next task

The node editor does not drive materials. Nothing in this section is built yet. The instructions are [`LAYER_PBR_PLAN.md`](./LAYER_PBR_PLAN.md).

- Keep material fill layers. Other layers become toggle layers: colour and reflection, bloom and emission, bump and displacement. Each has a check and an influence. Bump has a ramp. Normals come from the combined height, except a layer converted to Normal.
- Do this in the self-host painter. Do not edit `crates/vue3d_core` until Victory accepts that build.
- Safety zip: `release/vue3d-self-host-safety-2026-11-14.zip`.


## 18. 2026-11-16 — still not built

`f3b43f6` aligned guides only. The page is still `index-DXhSIj8p.js`.

The self-host worker builds `LAYER_PBR_PLAN.md`, including the export zip and the Blender per-channel chains. Import Texture stays. The node panel goes. The UV dock says Coming soon. Subdivision is preview only.

Do not edit `crates/vue3d_core`. Do not rewrite the other guides until this page is verified. Push every 3.5 minutes. Notes and code are separate commits. Each worker writes `agents/<name>.md`.


### 2026-11-17 — pre-execution (viewport responsiveness, model parts, subdivision, gizmos, UV roadmap)

Victory authorised autonomous work on the self-hosted Vite/React/Three.js painter. Scope is the source under `src/` plus its generated `self-host/public/index.html` via `npm run host:sync`; do not edit `crates/vue3d_core`, Windows/native build paths, or `release/vue3d-self-host-safety-2026-11-14.zip`.

- Temporary orientation gizmos remain CSS-based for now. Apply consistent axis colours (X red, Y green, Z blue) to all six directions and retain existing hit targets/navigation actions. Later replace the visual bodies with user-supplied low-poly GLB assets from a future `gizmos/` folder. The mountain's faded/acoustic painting treatment is explicitly deferred to that asset pass.
- Subdivision UI must be available in both floating and dockable modes. Separate non-destructive preview from any explicit mesh-apply operation; applying subdivision must be undoable and must not silently mutate the source while previewing. Confirm exact current model/undo pathways before wiring it.
- Build model-part visibility/isolation controls and keep the selected part, object visibility, framing, and viewport state synchronised.
- Highest performance priority: profile and reduce input-to-frame latency for eraser and other paint operations. Avoid full texture/composite rebuilds, mipmap generation, BVH rebuilds, or GPU uploads in pointer-move/dab hot paths. Use dirty regions/batched uploads where correct; do not trade away visual correctness. Record measured before/after results when instrumentation permits; do not invent benchmarks.
- UV work is documentation/backlog only until Victory explicitly confirms implementation. Add a detailed staged roadmap covering algorithms, tools, data model, interaction, packing, validation, undo, persistence, performance, and the standalone UV workspace with explicit sync contracts.
- Keep existing axis and viewport controls functional; keep the mountain faded painting treatment deferred. Keep the UV editor marked as planned/coming soon, not implemented.

This is a pre-execution note only; no implementation result is claimed here.


## 2026-11-17 implementation checkpoint

- Active scope: self-host Vite/React/Three.js painter under `src/`; generated package is `self-host/public/index.html` via `npm run host:sync`.
- Implemented partial latency work: notifications coalesced to animation frames; common 3D paint tools recomposite clipped dirty rectangles rather than copying a full active texture on every dab. Full PBR texture rebuild still occurs on stroke completion; performance must be measured on Victory's device.
- Temporary box/sphere/mountain gizmos use consistent X red, Y green, Z blue axis labels. GLB replacement assets and mountain faded/acoustic styling are deferred until user assets arrive.
- Subdivision panel is visible by default and dockable/floating. Current subdivision geometry is preview geometry; destructive apply, undo, and export-safe mesh replacement are not claimed complete.
- UV algorithms, tools and standalone workspace are expanded in `LAYER_PBR_PLAN.md`, marked documentation-only pending explicit confirmation.
- CI: run `44196595476` succeeded and uploaded artifact `14378169255`; bundle `index-DwkyI3V_.js`. CI does not validate live browser interaction or input latency.
- Protected: `crates/vue3d_core` untouched; safety ZIP untouched.


## 2026-11-17 follow-up — stroke trail and redundant rebuilds

- Dirty-region compositing now covers the segment from the prior pointer position to the current dab, as well as the bounds of symmetry points. It scales source rectangles for non-1024 layer canvases and falls back for dragged-dot/large-area tools.
- Mask-brush pointer updates no longer trigger full PBR texture rebuilds. Pointer-up relies on the canonical texture notification to trigger one PBR rebuild rather than invoking a duplicate directly.
- Latest code revision `d55a7ff` passed run `44197313538`; generated bundle `index-D6s9T1ZF.js`; artifact ID `14380475625`.
- Device responsiveness remains unmeasured. Manual test on Victory's target hardware is still required.


### 2026-11-18 — pre-execution: uploaded GLB gizmos, surface-normal responsiveness, navigator sync, permanent subdivision docker, HSL utility and triplanar source mode

Victory reports the eraser response is now manageable. The current bottleneck is the surface-normal mode toggle, which delays before the viewport updates, and the small Navigator preview synchronising its texture too slowly. Fix those two update paths without regressing brush/eraser responsiveness.

- Uploaded GLB assets are present at `self-host/public/assets/Gizmo/box.glb`, `sphere.glb`, `mountain.glb`, and `mountain_1.glb`. Inspect/load these real assets; do not keep treating the CSS placeholder as the intended gizmo model. Retain a robust fallback if an asset fails to load. Add clear axis colour coding and a separate **2D directional arrow with readable axis/direction labels**; the arrow is a screen-space overlay and must not be confused with a 3D model feature. Preserve all existing navigation hit targets/actions. Defer the mountain acoustic/faded paint styling unless already encoded in the supplied GLB.
- Replace the floating subdivision panel with a permanently docked tab/panel beside the Colour docker. It remains a visibility enhancement only: subdivision preview changes displayed geometry and never applies/replaces the source mesh. Remove/disable any Apply/commit subdivision affordance; retain explicit preview enable, algorithm, level and quality controls as appropriate.
- Extend the Colour docker with a Palette/HSL mode switch. Keep the current colour wheel and palette accessible in Palette mode; HSL mode presents visual Hue, Saturation and Lightness sliders with numeric feedback and live colour updates. Switching modes must preserve the chosen colour and existing hex/RGB entry behaviour.
- Triplanar source work is first in the remaining filters: each texture/fill instance must explicitly choose between its own tint/colour settings and the selected image texture. Make the boolean semantics unambiguous in UI, config, serialization and fill sampling. Do not reverse the earlier documented rule: enabled/checked = use that instance's own colours; disabled/unchecked = sample the selected image texture. Existing image-less rows must retain a sensible solid-colour fallback.
- Continue after triplanar with dynamic mesh-part inventory/isolation and the remaining filter backlog. UV work remains documentation-only; no UV implementation without explicit later authorisation.
- Before editing code, inspect current app/dock architecture, GLB file names and loader availability, surface-normal implementation and call sites, Navigator texture update effect, triplanar config and fill sampling, and existing colour picker state. Keep source changes within the self-host Vite/React/Three.js app. Never modify `crates/vue3d_core`, native/Windows build files, or the protected safety ZIP.
- Required verification: `npm run build`, `npm run host:sync`, CI package checks; clearly separate build success from browser/device latency testing. Record measured results only when actual timings are available.

This is the pre-execution specification. Do not mark any of these tasks complete until source changes and verification support it.


### 2026-11-18 — implementation checkpoint: gizmos, shading responsiveness, Navigator, subdivision/colour docks, triplanar and mesh inventory

Implemented in the self-host Vite/React/Three.js source:

- **Uploaded gizmos:** the box, sphere and mountain styles now load `self-host/public/assets/Gizmo/{box,sphere,mountain}.glb`, with `mountain_1.glb` as mountain fallback. The CSS models remain a load-failure fallback. A screen-space six-direction arrow overlay follows the model orientation and labels +X/-X (red), +Y/-Y (green), +Z/-Z (blue). The mountain acoustic/faded-paint treatment is intentionally deferred.
- **Surface-normal responsiveness:** geometry normal variants are cached per geometry; calculations use the full topology index even when part visibility changes. The on-demand viewport is explicitly woken after a normal-mode change, and normal recomputation was removed from the frequently-running material/layer update effect. Navigator no longer calculates normals twice on initial/model updates.
- **Navigator synchronisation:** one persistent 256×256 canvas texture replaces the full-resolution texture upload; a layout effect copies the newest composite and flags the existing texture for update.
- **Subdivision docker:** subdivision now sits permanently beside Colour (as an adjacent tab in the grouped docker, or a fixed docker in the expanded layout). It remains a non-destructive visibility preview; there is no Apply/commit subdivision workflow.
- **Colour docker:** Palette/HSL mode switch added. Palette mode retains the existing wheel and swatches; HSL mode exposes live Hue/Saturation/Lightness sliders. Hex entry remains available in both modes.
- **Triplanar source:** each texture row now has an explicit `useInstanceColor` setting. Checked samples the row's tint/alpha; unchecked samples that row's uploaded image. Legacy rows preserve prior behaviour by sampling an existing image unless explicitly switched to colour. Missing-image fallback remains solid colour.
- **Dynamic parts inventory:** built-in model parts and OBJ `o`/`g`/material sections are exposed as stable IDs/names. The Mesh Parts docker supports selection, per-part visibility, isolate, Show All and Frame Selected. The same filtered index drives viewport raycasting, and Navigator visibility follows the main view. The original geometry remains the save/export source; subdivision preview is bypassed while parts are hidden/isolated so part controls stay functional.
- **Remaining brush filters:** cached procedural pattern tiles now include powderiser, wood grain, hatching, cross-hatching, hashing, dithering and mosaic. Existing edge-wear/cavity and stochastic scatter engines remain available.
- **UV:** still documentation-only until explicit authorisation.

**Verification:** latest completed build/package checkpoint before the final frame-selected visibility tweak: run `44219296497` passed, generated bundle `index-3kZ9-qhy.js`, artifact `14390310542`. The final frame-selected visibility tweak passed run `44219451453`; the latest code revision and final package verification are recorded below. CI is build/package evidence only. Actual GLB rendering, UI interaction, and device latency still require manual testing. No measured before/after timing is claimed.


### 2026-11-18 — final verification update
- Latest code revision: `5cd8deab` (`Viewport3D` now uses a private geometry clone, so hide/isolate operations cannot mutate source geometry used by UV editing, saves or exports).
- GitHub Actions run [44219704658](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44219704658) completed successfully: install, production build, `npm run host:sync`, package identity checks, ZIP packaging and artifact upload all passed.
- Generated bundle: `index-BIQQ4eFN.js`. Latest artifact: `VUE_3D_Canvas_SelfHost`, ID `14390800060` (851,024 bytes; expires 2027-02-16).
- This verifies source compilation and packaging, not browser behaviour. Still require manual tests for GLB appearance/load path, all six gizmo arrows, HSL round-trip, mixed triplanar rows, part inventory/raycast isolation, subdivision source/export preservation, Navigator updates, and target-device surface-normal response. No latency measurements are claimed.


## 2026-11-18 correction pass — requirements recorded before implementation

User feedback: Triplanar dialog input controls overflow their bounds; filter implementations incorrectly added procedural brush patterns instead of filters that transform selected image layers; Convert to Bump must grayscale the image and provide Photoshop-style Levels (black/white input, gamma, output black/white); Window menu docker toggles must hide/show the actual dockers; Preferences must expose gizmo label margin/spacing and font size; gizmo axis colors are missing; the actual Suzanne OBJ exists at `self-host/public/assets/suzanne.obj`, should be subdivided once internally, built in as **Squail**, with simplified UVs; Palette/HSL mode switching must preserve the wheel; main application bottom must fit the actual visible screen area.

Additional clarification: Wood Grain is a destructive selected-layer image filter with Image/Color source toggle and internal edge, noise, bleed, and blur controls. Hatching, Cross-Hatching, and Hashing are pixel-displacement filters using directional/world/object constraints and optional randomization, not brush strokes or line-overlay-only effects. Gizmo arrows must be geometry-following directional arrows; axis letters X/Y/Z remain straight/readable; opposite axes fade translucently when occluded; positive axes are brighter than negative counterparts.

Implementation order: correct small UI regressions and filter architecture; then gizmo label/arrows and Squail model. Do not modify native Rust workspace or protected release ZIP. Build CI verifies only compile/package, not interactive correctness. No source modifications have been made in this correction pass yet; requirements are recorded here as a pre-implementation checkpoint.

## Correction pass implementation checkpoint — 2026-11-18

Implemented in root self-host painter source (not native Rust):
- Triplanar dialog responsive width/height and input containment; drag bounds updated.
- Color wheel canvas stays mounted across Palette/HSL switches.
- App uses dynamic viewport height (100dvh).
- Grouped docker tab lists now filter by activePanels; Window menu includes Mesh Parts.
- Gizmo labels use plain X/Y/Z with direction arrows; positive axes are brighter, negative axes darker, and rear/opposing indicators fade. Preference controls added for radial label spacing and font size. These are projected overlay arrows/labels aligned to the model axis projections, not arrow geometry baked into the GLB.
- Selected-layer image filter dialog and image-processing engine added: Wood Grain (Image/Colour source, edge, noise, bleed/blend, blur), Hatching/Cross-Hatching/Hashing (pixel displacement), Powderiser, Dithering and Mosaic. Filters apply destructively to the active image layer, with an undo checkpoint and dialog preview. Preview downsamples to 320×320; Apply processes the full selected-layer canvas.
- Bump conversion now opens grayscale Levels (black input, white input, gamma, output black, output white), previews, then converts the selected layer image to grayscale before enabling bump.
- The repository OBJ self-host/public/assets/suzanne.obj is now imported as raw bundled text and used as the built-in Squail model; one Catmull-Clark subdivision is baked into preset geometry, and a simple planar UV is generated when OBJ has no UV attribute.

Known limitations / manual validation:
- Hatching displacement is currently computed in image/UV coordinates. Object/world axis options use a simplified angle mapping; exact per-model world/object-to-UV transform is not implemented yet.
- Gizmo arrow direction is a projected axis overlay; the actual gizmo GLB still has no embedded material. Verify axis label overlap, rear fade, and snapping in device/browser.
- Squail planar UV projection is intentionally simplified; validate seams/distortion and model bounds. OBJ subdivision and UV bake are CI compile-tested only.
- Wood Grain, hatching displacement, Bump Levels, dialogs, mobile sizing, docker toggles, and color-wheel persistence require manual interaction testing. No browser-level test or measured performance run has been performed.

Latest successful CI/package checkpoint: run 44269171028 (run #85), commit 92ad447447a0e9633e3d0efc649fff7aaa85e25e, artifact 14412325195 (VUE_3D_Canvas_SelfHost), 889,628 bytes, SHA-256 2bda18bb932c48b22da2bf40153893f6065c96bf791e81bda6bb5a2bf23b2124, expires 2027-02-16. Build/package pass does not establish browser behavior.

## Final correction-pass checkpoint — 2026-11-18

Additional source refinements after initial checkpoint: the built-in model dropdown now labels the retained compatible key `suzanne` as **Squail (Built-in OBJ)**. Directional filters combine selected UV/object/world axis preset with the angle-offset slider. Object/world modes remain approximate angle presets and do not yet use exact mesh-specific UV transforms.

Final source commit for this successful build: `cd1b12a2d8f100ef71cbccdaeab06496c1d05c3b`. CI run #97, ID `44269483757`, conclusion success. Artifact `14411732307`, name `VUE_3D_Canvas_SelfHost`, size 889,693 bytes, SHA-256 `f8d9cdcc6767686a39514b204f69859cde73aa16f62eaa3d6443175db174f0d0`, expiry 2027-02-16. Direct artifact page: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44269483757/artifacts/14411732307

Manual validation remains pending: test filter image/color sources and full-resolution overwrite/undo, bump levels/grayscale preview, responsive Triplanar inputs on phone and desktop, Window-menu docker toggles in grouped and expanded layouts, HSL/Palette repeated switching, gizmo positive/negative axis color and fade, preferences spacing/font, Squail model subdivided appearance and UV distortion. Exact world/object-to-UV directional constraints are still future work.

## Final post-gizmo implementation checkpoint — 2026-11-18

Latest gizmo refinement: six real Three.js ArrowHelper geometries are parented to the loaded gizmo GLB root, aligned to local X/Y/Z and therefore rotate with the model. Positive directions use brighter axis colors; opposing directions use darker colors and their opacity is reduced when pointing away from the camera. The X/Y/Z text labels remain projected screen overlays for legibility and preference-based spacing/font size.

Final successful build after the 3D arrows: workflow run #98 / ID 44269751711; commit 470c3b1da05ca1331fdce36dae016d8bc10786b8; artifact 14412042420 (VUE_3D_Canvas_SelfHost), size 891,319 bytes, SHA-256 1c65b4b191385e30b0d28e7351f03c687bc0a65bb450f2d9fe5e75977bb5d726, expiry 2027-02-16. Run URL https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44269751711

Manual testing still needed. The build confirms compile/package only; it does not prove arrow placement, label overlap, Squail subdivision appearance, UV quality, filter quality/performance, or phone/desktop layout. Exact world/object-coordinate-to-UV directional displacement remains unimplemented; those selections currently use simplified axis-angle presets.

## Repair pass — 2026-11-18 (post-user test feedback)

- Reverted the broken bundled `suzanne.obj`/Squail substitution. Built-in model is again the existing Suzanne preset, with no subdivision baked in. The bad packaged OBJ is no longer retained by the self-host sync. Wait for the user's replacement Suzanne OBJ/MTL package; it should include named separated objects and UV data. Do not subdivide the replacement model.
- Subdivision preview level control now uses decrement/increment arrow buttons rather than a range slider.
- Filter command and dialog are renamed **Layer Filter**.
- Wood Grain now supports a reorderable stack of colour/image sources, per-source numeric spreading density, and up/down/remove controls.
- Powderiser now breaks the selected layer into scattered fading dust fragments. A separate Noise Shader darkens pixels through randomized colour blending without geometric displacement.
- UV repair: Viewport3D's private geometry clone now receives typed UV channel arrays and active UV channel data; an explicit UV geometry version causes the clone and render to refresh after UV unwrap/channel selection/rebake operations. UV panel geometry updates also schedule texture composite refresh.
- Self-host sync now replaces generated app bundles from `dist` while preserving hand-maintained Gizmo GLBs and help/signature assets. This removes stale generated hashed JS/CSS bundles rather than leaving old versions in `self-host/public/assets`.
- Manual validation remains required for UV painting and export, wood source stacking, dust scattering, noise shader, and the replacement Suzanne import when supplied. No browser-level interaction tests or performance measurements are claimed.

## Self-host folder synchronization checkpoint — 2026-11-18

The latest successful self-host workflow is run #109 / ID `44308954895`. The build now commits the generated `dist` output into `self-host/public` and removes stale generated assets on each successful run. Commit `116b8d6a731df854ea36eeeea9c09ad2f3c5f533` (`chore(self-host): sync generated painter output [skip ci]`) contains the actual generated self-host output. Current public assets include the latest hashed app JS/CSS plus the four preserved Gizmo GLBs; old hashed bundles and the faulty `suzanne.obj` are removed. The build also preserves help PDFs/DOCX and signature assets.

Artifact `14430270038`, name `VUE_3D_Canvas_SelfHost`, size 1,061,477 bytes, SHA-256 `c3e0d496d7141f32a58c604a5dc7fc9faaee576d28823809717561183721ad80`, expires 2027-02-16. Run URL: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44308954895

Manual testing remains required for UV edits updating the 3D material and texture mapping, UV save/export, stacked wood source output, powder dust scattering, noise-shader darkening, and subdivision arrow controls. The replacement separated-item Suzanne OBJ/MTL is pending from the user; do not reintroduce the previous faulty OBJ, and do not bake subdivision into the replacement model.


## 2026-11-19 — blank-screen root cause and repair
- Reviewed the agent handover documents and safety-backup instructions before editing. The canonical backup `release/vue3d-self-host-safety-2026-11-14.zip` and its self-host reference remain unchanged.
- Root cause: `src/renderer/Viewport3D.tsx` referenced `uvGeometryVersion` in the geometry-refresh and shading effect dependency arrays, but the component's parameter destructuring omitted the prop. That free identifier throws a `ReferenceError` while rendering, preventing both desktop and hosted Android UI startup.
- Fix: destructure `uvGeometryVersion = 0` alongside `activeUVChannel`; the prop is already declared optional in `Viewport3DProps` and passed from `App.tsx`. This keeps initial renders safe and lets UV edits trigger the intended geometry refresh.
- Commit: `e6c3201a0d3d93a540599ec21d2cab2eaca19458` (`fix(self-host): bind UV geometry version in viewport`).
- Verification status: source diff inspected; CI production build/package and manual desktop/Android runtime verification remain pending. The error boundary added in `src/main.tsx` now reports future React render failures rather than silently showing a blank screen.


## 2026-11-19 — user-requested gizmo and interaction development checkpoint

Implemented source changes on the self-hosted painter:
- Box and Sphere orientation gizmos are now generated from built-in Three.js geometry in application code; they no longer require the external Box/Sphere GLB files. Their materials are replaced with axis-coloured, non-image materials. Box faces use solid axis colours; Sphere uses vertex-colour blending across axes.
- Mountain now has a built-in procedural fallback and a Mountain-only axis-colour influence slider. A user can select a replacement binary GLB; the model is loaded with GLTFLoader and its image materials are discarded/replaced by position-derived vertex colours. The selected GLB is stored in IndexedDB under the browser's local origin, not localStorage, to avoid its small quota. It remains on that browser/device and is not automatically synced to another device or included in exported project files.
- Subdivision preview level type and controls no longer cap the level at 2. Increasing levels remains user-controlled; memory and processing costs grow rapidly with each level.
- UV panel tab order now places Sculpt before Mirror, with updated tooltips.
- Wood Grain now generates opaque output even when the selected layer is initially transparent/empty, so the user does not need to pre-paint the layer.
- The Layer Filter dialog header supports mouse dragging and a double-tap touch drag gesture.

Source commits: 2fcff5500d6a8b589eed22ab1189fd4c4bde976c, 8637d1779a72f1e2a11b8dfd5b980c2be265ba36, 70217e62400998cfe578e9518288eb4e57fad58b, 576f0e91e3c4e48b2e6626063064b9844c2927ec, 5ed97845f1622b190ab6a46c5c41fb9e690f9a6e, and d249c4ba751bf41d7beeeda7024b8c48a43cddf7.

Remaining work in this request: Wood Grain still needs true object-space sampling derived from mesh positions/normals (not the current UV/image-space grain calculation); touch-drag support must be applied consistently to the other floating filter windows, not only Layer Filter; review and refine the full 2D UV tool information architecture beyond the initial tab-order adjustment. Confirm whether the built-in Mountain fallback's silhouette meets the intended design after visual testing. Build/CI and browser/device interaction tests have not yet been run for this checkpoint. Do not mark these remaining items complete based on source edits alone. The 2026-11-14 safety archive remains protected and unchanged.


## 2026-11-19 — follow-up implementation and verified self-host package

Follow-up changes completed after the initial checkpoint:
- Wood Grain now rasterizes the selected mesh's local-space position into the active UV target, then evaluates grain from those interpolated object coordinates. UV coordinates are used only as the destination address for writing the texture; grain direction and flow are derived from mesh position, so rotating/repacking UV islands does not rotate or stretch the grain pattern. The selected active UV channel is used to map the output to the current texture layout. The generated layer remains opaque even when the source layer was empty.
- Double-tap touch dragging has been added to the Layer Filter, Edge Wear, Gaussian Blur, Stochastic Scatter, Triplanar, Pattern Stamp, and Bump Levels windows. Mouse dragging remains available. On touch, the first tap arms the gesture and the second tap starts the drag on the title/header.
- Corrected BoxGeometry material ordering so +X/-X are red shades, +Y/-Y green shades, and +Z/-Z blue shades.

The complete source revision for this checkpoint is `e592e9e98d7199443b9131d843a0e422c2d8c3d0`. GitHub Actions run #136 (`44462561950`) passed every step: dependency installation, Vite production build, self-host sync, blank-package validation, generated-output commit, ZIP packaging, and artifact upload. Artifact `14500731368` (`VUE_3D_Canvas_SelfHost`, 1,065,779 bytes; SHA-256 `82940c38c45c0abab968104f218ddb60bea104e93b22f84248ee249c2c935854`) is available until 2027-02-17. Run URL: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44462561950

This is compile/package verification, not manual visual or touch-device validation. Please manually test Box face direction colours, Sphere blending, the Mountain fallback and uploaded GLB with image maps stripped, Mountain influence slider, IndexedDB persistence after reload, wood grain on an empty layer and across UV seams, high subdivision levels on representative meshes, and double-tap dragging on touch. Browser storage is local to the current browser/device and may be cleared by site-data cleanup; it is not a cross-device asset sync mechanism. The protected 2026-11-14 safety archive remains unchanged.


## 2026-11-19 — pre-execution: remaining self-host task set

- Read all 22 Markdown files currently present on `main`, including the self-host handoff, task brief, API/architecture references, safety-backup instructions, and historical agent notes. The active product remains the Vite/React/Three.js painter under `src/`, packaged into `self-host/public/`.
- Confirmed the evening/filter upload-pack changes are already on `main` in source commit `3c9983eff0c02e94da2728bba17711e09a717e51`; workflow run #137 (`44477900504`) passed, and generated self-host output was committed at `f7750b72f9a2e19ab8f84e749033ccfa4eab65e1`. Do not reapply the absent offline patch or duplicate its changes.
- Remaining authorised scope from `SELF_HOST_TASK_2026-11-19.md`: export-only Classic / RGB+ORM / AO×albedo modes; Smart UV and layer-UV end-to-end plus seamless UV; Bump Levels/displacement integration; desktop options-bar horizontal scrolling and decimal UI scale; Mountain GLB selection in Preferences; multi-select merge and move-to-group; final `host:sync` and package/device verification.
- Before source changes, inspect each affected implementation and its current data contracts. Preserve current layer export defaults, old `.xblend` compatibility, undo semantics, active UV channel wiring, and the no-regression painting performance constraint. Do not edit `crates/vue3d_core` or either protected safety ZIP. This is a pre-execution record, not a claim that the remaining features are implemented.


## 2026-11-19 — Suzanne integration and UV/UI completion checkpoint (pre-change)

**Scope remains self-host only:** React/Three.js source under src/, then npm run host:sync to regenerate self-host/public/. Do not edit Rust/native code or protected safety ZIPs.

### Suzanne asset preservation and integration
- The user reports two new candidate assets: (A) a two-mesh Suzanne with separate head and eyes, identified by names such as head / eyes or suzanne / eyes; (B) a backup Suzanne X with head/eye vertex groups.
- Preferred integration strategy, after inspecting the actual files: preserve the existing/original Suzanne asset unchanged; create a separate candidate integration/output asset; use mesh names and/or vertex groups to identify head and eye regions; combine/merge geometry only where topology permits, preserve material/vertex-group identity where useful, weld coincident boundaries and validate manifoldness/normals/holes before promoting the candidate. Do not destructively overwrite the original model. If one candidate is already clean and correctly joined, choose it rather than forcing a risky merge.
- Availability check: as of this checkpoint, neither new Suzanne binary is present in the main Git tree or in the current conversation-file attachment listing. The repository asset paths currently expose no Suzanne GLB/GLTF/OBJ/FBX. Do not fabricate a replacement or claim integration until the binaries are accessible. Recheck incoming assets before model work.

### UI layout requests
- Collapsible-group triggers and grouped clusters should be horizontally scrollable rather than wrapping/collapsing the surrounding layout.
- Add a circular drag handle/button associated with the horizontal scrollbar so touch users can drag the scroll position comfortably. Keep keyboard/trackpad/native scroll usable and do not make the circular handle the only scroll method.
- UI scale may scale visual controls, but workspace anchors must remain at their extreme/docked positions: windows, items and dockers must not all shrink toward the top-left or cause the application layout to squash into that corner. Preserve viewport/workspace anchoring and use transform/origin or layout sizing deliberately; do not globally scale the root layout in a way that changes its anchor geometry.
- When the combined 3D Viewport + 2D UV Editor workspace is opened, rearrange the UV editor action buttons along its top toolbar for clearer access without changing UV data or unwrap behaviour.

### UV/filter defect — preserve baseline before any correction
- User reports that filters look correct on clean UVs, but on model UV islands a visible line/gap appears around island boundaries after applying a filter. This is an observed filter-to-UV-island edge/seam defect; do not assume its cause (padding, dilation, sampling, mipmaps, alpha, or rasterization) without isolating it.
- Preserve the current known-working UV editor behaviour as the baseline: current unwrap/channel/rebake/edit interactions remain intact; the user's clean-UV filter case works; the reported defect is specifically the visible edge line/gap at UV-island boundaries after filter application. Record screenshots/reproduction details when supplied. Do not rewrite the unwrap/rebake engine as a first response.
- Before a UV fix, inspect and record the current island packing, texture gutter/dilation, filter sampling, alpha handling, and mipmap path. Make a minimal isolated change with a rollback path and compare clean UV versus multi-island results. Do not regress current editor controls, selection, channel switching or rebaking.

This checkpoint is a preservation/requirements record, not a claim that Suzanne integration or UI/UV fixes are complete.


## 2026-11-19 — UI scroll, UV toolbar and scale-anchor implementation

Self-host source now includes:
- New reusable src/ui/HorizontalScrollRail.tsx: native horizontal scrolling remains available and a circular draggable handle is provided for touch/drag scrolling.
- ToolOptionsBar clusters no longer wrap; the complete options strip scrolls horizontally.
- DockerGroup tab headers scroll horizontally with the same draggable rail.
- The 2D UV canvas HUD uses a horizontal rail. Its action order is Smart UV Unwrap, UV Set, UV Overlay, overlay opacity, then UV N-Panel; touch navigation/view reset remain in the separate top-right control group.
- UI scaling no longer uses CSS zoom on the root. The workspace is transformed from top-left with inverse CSS width/height dimensions so the visual workspace continues to fill the viewport and dock/floating-window anchor positions remain stable instead of shrinking the app's layout box into the top-left.

**Build/package verification:** Actions run #166 / ID 44532889314 succeeded for source revision f22d56f5a4f2177e50986555fd55ebc913c816f4. Production build, host:sync, blank-package validation, generated self-host commit, ZIP and artifact upload passed. Generated output commit: 76d0293. Artifact VUE_3D_Canvas_SelfHost ID 14535450721, 1,078,464 bytes, SHA-256 5d5b30927a98cb94deea4056f30bb9438dc1b74a29d1a5ba7591a2888afa577a. https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44532889314/artifacts/14535450721

**Suzanne status:** No Suzanne model binary was visible in the current conversation attachments or in the main branch tree at this checkpoint. The existing built-in Suzanne source/model was not removed or overwritten. Integration remains pending until the reported separate-mesh and vertex-group candidates are accessible. Preserve the existing source asset and integrate into a separate candidate first; validate welded topology, normals and holes before promoting it.

**UV seam status:** The reported filter gap/line around UV island edges remains an explicit known defect. No UV unwrap, rebake, channel, gutter or filter-sampling correction was attempted in this UI pass. Keep the current working UV editor as the baseline and isolate any future seam fix with a rollback path. CI does not replace manual visual testing; scroll/touch drag, scale anchoring, split UV toolbar layout, and Android behaviour still need manual validation.


## 2026-11-19 — final UV HUD ordering and verified self-host package (run #167)

The 2D UV HUD now places status badges after the primary actions, keeping the workflow order: Smart UV Unwrap → UV Set → UV Overlay → Overlay Opacity → UV N-Panel → selection/mask status. This is a UI-only adjustment; UV geometry, unwrap, rebake, channel assignment and filter sampling were not changed.

Latest source revision: fe5c1e3d102363434d8c61bd2440ff21ca5ac9b8. GitHub Actions run #167 / ID 44533278135 passed all steps: install, Vite production build, host:sync, blank-package validation, generated self-host output commit, ZIP and artifact upload. Generated output commit: c4cc4bd. Artifact VUE_3D_Canvas_SelfHost ID 14535151799 (1,079,747 bytes), SHA-256 4132e7f6469f75e3bb62d70171f68a8c3c4a0207ac22a2923e8fd509d3962f7e. Download: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44533278135/artifacts/14535151799

Suzanne candidate model binaries are still not available in the current conversation attachment list or main branch asset tree. No Suzanne source/model was removed or overwritten. The original remains preserved; candidate integration is blocked until the two reported files are accessible. UV island-edge filter gaps remain documented and intentionally unmodified. Manual browser/desktop/Android visual and interaction testing remains outstanding.


## Current Windows redevelopment handover — 2026-11-19 (read before native work)

### Product status and source of truth
- Finish and validate the self-host painter first. Latest self-host source revision: `8ef43083078ce650e7c9ddda2de2a99ff41b2378`. Latest generated `self-host/public/` output commit: `6ca5b70`.
- Latest self-host CI: workflow run #169 / ID `44538905738`, success. It ran Node dependency installation, Vite production build, `npm run host:sync`, blank-package validation, generated-output commit, ZIP packaging and artifact upload. Artifact `VUE_3D_Canvas_SelfHost` ID `14536189234`, 1,078,042 bytes, SHA-256 `57530146a4923253abe3fb4a7658e994a0bc99f90a315ccf132520cae52e22da`. Download: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44538905738/artifacts/14536189234
- Self-host success is not Windows native build success and does not prove manual desktop/Android interaction. No Windows workflow was run as part of this self-host pass.
- Active painter implementation remains React 19 + TypeScript + Vite 8 + Three.js under `src/`; `self-host/public/` is its generated deployable package. `npm run host:sync` builds and synchronizes that output. Treat the current self-host app as the behavioural/feature reference for any future Windows redevelopment.

### What the Windows application currently is (important correction)
- The current Windows executable is a **native window shell around the existing web painter**, not a native Direct3D painter rewrite.
- Entry point: `crates/vue3d_core/src/main.rs`; window/WebView integration: `crates/vue3d_core/src/desktop.rs`; dependencies: Rust `wry = 0.57` and `tao = 0.37` in `crates/vue3d_core/Cargo.toml`.
- The shell loads the built UI from the adjacent `ui/index.html` using Wry's in-process `vue://localhost` custom protocol. It does not need to start an HTTP server. The portable package layout is `vue_3d_canvas.exe` beside a `ui/` folder containing the Vite build.
- WebGL is rendered inside WebView2; ANGLE defaults to D3D11. `--opengl` selects the OpenGL ANGLE path; `--modern` adds the WebGPU browser flags but does not turn the painter into a native WebGPU renderer. The app does not currently own a raw D3D11 device, native HLSL material pipeline, WGL renderer, or native brush engine.
- Windows 11 normally includes WebView2 Runtime; Windows 10 may need Evergreen WebView2 Runtime. The shell stores WebView2 profile data in `webview2-data/` beside the executable, persists the selected backend in `gpu-backend.txt`, and writes startup failures to `vue3d-startup-error.log` beside the exe.

### Current Windows build path
- Manual GitHub Action: `.github/workflows/build-windows-app.yml` (workflow_dispatch only; Windows runner). It installs Node 22, runs `npm install`, `npm run build`, validates `dist/index.html` and JS assets, installs stable Rust, runs `cargo build --release --bin vue_3d_canvas`, assembles `VUE_3D_Canvas_Windows/` with exe + `ui/`, then uploads `VUE_3D_Canvas_Windows.zip`.
- Local Windows folder builder: `scripts\\build_standalone_desktop.bat`. It runs `npm run build`, builds the Rust binary and assembles `dist\\VUE_3D_Canvas_Windows\\`. It currently does not create the GitHub Actions artifact ZIP itself.
- Use the workflow file and scripts as the executable truth. Older docs below that mention console binaries, Python/C++ desktop folders, old workflow names, raw DirectX device access, native HLSL painting, Windows Ink integration or guaranteed performance improvements are historical/aspirational unless separately implemented and tested.

### Future Windows redevelopment direction (not implemented by this handover)
1. Do not replace the working self-host painter or conflate the Wry shell with a native renderer. Keep a separate Windows redevelopment branch/workstream until the native app reaches feature parity.
2. First produce a feature-parity matrix from the current self-host application: model import and mesh/material data; layers and blend modes; brush/pen/tablet input; texture filters; UV unwrap/edit/channel/rebake; selection/masks; PBR maps and export; undo/redo; project serialization and backward-compatible `.xblend`; dockers, floating windows, scaling and touch interactions.
3. Preserve file-format and interaction contracts. Use existing React implementation, API documentation, `XBLEND_FORMAT_SPECIFICATION.md`, and current handover records as behavioural references. Do not silently change project compatibility, layer ordering, active UV channel, texture dimensions, filter seeds or undo semantics.
4. Decide the native rendering architecture only after profiling the self-host baseline and confirming target GPU requirements. If implementing direct D3D11/HLSL, it must be a genuine renderer and resource-management implementation, not a renamed WebView2/ANGLE path. Keep a documented OpenGL fallback only if it can be maintained and tested.
5. Port in vertical slices and compare output against the self-host reference: viewport/model display; texture/layer painting; UV mapping and bake; filters; PBR export; project save/load; then UI/workspace and tablet input. Include automated asset/format fixtures and measured CPU/GPU/memory performance.
6. Maintain an agentic handover with completed features, parity gaps, file-format changes, renderer decisions, build instructions, known defects and exact tested Windows versions/GPU drivers. Never claim native GPU features from a successful shell build alone.

### Outstanding shared product issues for Windows planning
- Suzanne OBJ integration is still not complete. The user reports two OBJ candidates (separate head/eyes meshes and a backup with head/eye vertex groups). Earlier integration failed because the candidate binaries were not ingested into the repo/session accessible to the editing agent. Locate/restore the supplied OBJ files before choosing a candidate. Preserve the original Suzanne asset; create a separate integrated candidate, validate normals, connected components, boundary edges/holes and UVs, and only promote after inspection.
- UV mapping technology needs a future optimization review: profile unwrap/packing, texel density, island gutter/padding, rasterization, overlap handling and filter sampling before replacing algorithms. Preserve existing known-good UV editor behaviour as a regression baseline.
- Model-edge artefact: character fill tools/utilities leave a visible edge on the model. Record a reproducible mesh/material/UV case and compare viewport fill boundary, UV raster boundary, texture sampling and alpha before changing it.
- Hatching, cross-hatching and hashing need user-facing size/scale controls plus independent jitter and rotation-angle jitter controls. Keep their seeds/repeatability and current density behaviour documented while adding the controls.
- Filtered textures can show visible lines/gaps around UV island boundaries even though clean UV cases look correct. This is a known defect; no fix was included in the current toolbar-placement change.
- The UV toolbar position is mode-dependent: in combined 3D Viewport + 2D UV split mode, the 2D tools/options strip and its horizontal scrollbar are at the absolute bottom-centre of the 2D pane (excluding dockers); in dedicated 2D UV mode, the same strip returns to the top-left. Preserve this distinction.

### Current self-host UI correction (2026-11-19)
- `Viewport2D` receives `isSplitView={viewMode === 'split'}` from `App.tsx`. Split mode positions the 2D tools/options rail bottom-centre; dedicated 2D mode keeps it top-left. The draggable circular scrollbar remains attached to the strip.
- This is a UI placement-only change. UV algorithms, unwrap, packing, channel assignment, rebake, filter sampling and model geometry were not modified.
- Build/package run #169 passed for source revision `8ef43083078ce650e7c9ddda2de2a99ff41b2378`. Manual visual testing remains required.


## 2026-11-19 — OBJ integration, self-host sync protection and latest stop point

- Supplied Wavefront mesh is committed at `src/assets/Suzanne.obj`; `src/renderer/modelGeometry.ts` imports it as raw OBJ text and parses it for the Suzanne preset. The procedural Suzanne generator is removed. The existing user asset is retained in source.
- UV toolbar placement is mode-dependent: split 3D+2D view uses bottom-centre within the 2D pane; dedicated 2D view uses the top position.
- These source changes were built into the tracked self-host output. Generated self-host commit: `b6b9a627ab6b4e8e89e647091cd7f14512ddf30e`. Workflow run #178 / ID `44593598091` succeeded. The generated bundle `self-host/public/assets/index-Cc8o6jsJ.js` contains the Suzanne preset markers and the new UV layout classes.
- OBJ protection was added: `.gitignore` ignores `*.obj` except `src/assets/Suzanne.obj`; `scripts/sync_self_host.mjs` now copies OBJ files out before replacing `self-host/public/` and restores them after the Vite build is copied in. This is necessary because Git ignore alone does not protect files from script deletion.
- Last stopped: implementation and repository self-host sync are complete for this requested pass. Next work is manual runtime testing (desktop and Android/touch), followed by the known UV-island filter seam/gap and model-edge fill artefacts. Do not claim these are fixed without reproduction and visual verification.


## 2026-11-22 — GPT-6 filter recovery

- Reviewed the repository's Markdown instructions and architecture/handover documents before implementation. Current authority is the 2026-11-22 `AGENTS.md` PIN and `SELF_HOST_BUGFIX_2026-11-22.md`; this entry supersedes older active-to-do text in historical sections.
- Audited `src/tools/textureFilters.ts`, `src/ui/TextureFilterDialog.tsx`, and `src/App.tsx`. The apply caller keeps the selected target canvas, pushes undo, passes the complete filter config and notifies the texture composite after the write.
- Fixed Powderiser's scatter write-order issue using separate source-fade and fragment-composite passes.
- Added seeded spatial frequency randomisation to Wood Grain and a corresponding UI slider next to Band / wave frequency.
- Static audit checklist covers wood, hatching, cross-hatching, hashing, powderiser, noise-shader, dither and mosaic. No Phase B filters started.
- Source `0ac87f4460d78aa30c2c1d582eb9730374b6f9e1` passed workflow #184 / `44965787108`; generated output commit `9185d39`; artifact `14731308126`.
- Manual visual confirmation is still Victory's test responsibility. Next: A1 model menu cleanup/default Head + Eyes, then A2 symmetry-on lag. Accepted viewport and UV seam remain protected.


### A1 model menu completion — 2026-11-22

- Removed `Squail (Built-in OBJ)` from `PhotoshopMenuBar.tsx`.
- Set `suzanneHeadEyes` as the initial `modelKey`, initial geometry, invalid-key fallback, menu default and viewport fallback. Preserved `src/assets/Suzanne.obj` and the legacy preset implementation for compatibility; it is not a selectable Squail menu item.
- Source commits: `d78ccf6`, `792abd6`, `b2d33a2`. Workflow #187 / ID `44965932994` passed all build/sync/package steps; generated output `ad8ad2e`, JS `index-DrqHAL6X.js`, artifact `14731482930`.
- Manual visual confirmation at launch remains with Victory. Next task A2 is symmetry-on brush responsiveness; do not alter the normal brush path or accepted viewport/UV seam.


### A2 symmetry repair — 2026-11-22

- Root cause: primary and mirrored dabs shared the singleton BrushEngine's previous dab coordinate and spacing residual. Alternating primary/mirror calls made the next dab interpolate across the entire texture, creating lag and spanning marks. The dirty composite also omitted the previous mirrored point, which could clip the trail.
- Added independent per-path state for primary and each mirror axis/cross path; included spacing residual, dot/curve/drag state and smudge pickup. Added stable stroke keys in Viewport3D and included prior mirror coordinates in the incremental composite bounds.
- Source commits `1969550`, `9525fba`, `3866829`, `18c94c0`. Workflow #191 / `44966292558` passed all self-host build/sync/package checks; generated output `e740d02`, JS `index-DFGiqoP7.js`, artifact `14731757820`. Fresh stroke and multi-touch interruption paths also clear state.
- CI is not a pen/touch test. Victory should compare symmetry OFF and X/Y/XY/Z, particularly long fast drags, small spacing, and the final mirrored segment. Next A4: mesh-part filter selection. Do not modify accepted viewport or UV seam behaviour.

---

## 2026-11-24 — Troubleshooting Audit, Pinpointed Bugs & Fix Blueprint (Gemini Hydrogen / `LOG-2026-11-24-GEMINI-HYDROGEN-TROUBLESHOOT`)

**Scope:** Read all 27 Markdown files, audited `src/` + `self-host/`, ran `npx tsc --noEmit`, traced runtime paths. **Read-only audit on source code** — no `src/` files edited in this pass, so none of these fixes are marked `[x]` in `AGENTS.md` PIN yet.

### A. TypeScript Compile Failures (`npx tsc --noEmit` — 10 Errors in 5 Files)

> Note: Vite/esbuild (`npm run build`) strips types without enforcing `tsc --noEmit`, allowing these 10 type + logic bugs into production bundles.

| ID | File & Exact Line(s) | Error / Root Cause | Concrete Fix Idea |
|---|---|---|---|
| **TS-1** | `src/core/xblendFormat.ts:142-153` | `exportProject` sets `id`, `name`, `visible`, `opacity`, `blendMode` (`142-146`), then spreads `...manifest` (`151`, which also includes those keys — `TS2783`), then redeclares `visible: layer.visible` (`153` — `TS1117`). | Put `...manifest` *first* in the object literal and only specify explicit override properties afterwards. |
| **TS-2** | `src/renderer/hdriManager.ts:145` | `TextureLoader().load` error callback assigns an `HTMLCanvasElement` from `this.generateEquirectangularCanvas('studio')` to `tex.image` (`HTMLImageElement`) (`TS2740`). | Update `tex` via a `THREE.CanvasTexture` fallback or typed `(tex as THREE.Texture<HTMLCanvasElement \| HTMLImageElement>).image = ...`. |
| **TS-3** | `src/renderer/surfaceShading.ts:85` | `cache.default = defaultNorm;` fails (`TS2322`) because `geom.getAttribute(...)` returns `BufferAttribute \| InterleavedBufferAttribute`, whereas `normalCache` requires `THREE.BufferAttribute`. | Guard `if (defaultNorm instanceof THREE.BufferAttribute)` or widen `normalCache` map value type to `THREE.BufferAttribute \| THREE.InterleavedBufferAttribute`. |
| **TS-4** | `src/tools/textureFilters.ts:276, 316` | Fallback array `[{ item: { density: 50 }, image: null, color }]` omits `id`, `source`, `color` on `item`, creating an incompatible object literal union that fails `stack.indexOf(row)` at line `316` (`TS2345`). | Type `item` explicitly as a complete `WoodSource`: `{ id: 'fallback', source: 'color', color: cfg.color, density: 50 }`. |
| **TS-5** | `src/ui/panels/MeshPartsPanel.tsx:80` | **Also a runtime bug:** `<button onClick={onFrameSelected}>` passes a `React.MouseEvent<HTMLButtonElement>` into `App.tsx`'s `frameSelectedMeshPart(id = meshComponentVisibility)` (`App.tsx:361`), corrupting `frameMeshComponentTrigger.id` with a `SyntheticEvent`! | Change to `onClick={() => onFrameSelected(selectedPart)}`. |

---

### B. UI Regressions, Snapshot Collisions & Layout Bugs (P0 / P1)

| ID | Priority | File & Exact Line(s) | Bug / Root Cause | Concrete Fix Idea |
|---|---|---|---|---|
| **UI-BUG-1** | **P0** | `src/ui/PhotoshopMenuBar.tsx:297-378` vs `:520-706` | **Duplicate `View` dropdown menu:** Two separate `View` triggers exist in the same top menu bar, both bound to `openMenu === 'view'`. Clicking *either* button opens **both** dropdown panels simultaneously on screen, overlapping each other. | Delete the legacy `View` block at `:297-378` (preserving its `Frame Selected Mesh` `Numpad .` item inside `:520-706`). |
| **UI-BUG-2** | **P0** | `src/ui/panels/LayersPanel.tsx:363-411` | **Broken nested flex layout on bulk selection:** The `checkedLayerIds.length > 0` action strip (`:382-411`) is rendered **inside** `<div className="p-1.5 ... flex items-center justify-between"><div className="flex items-center gap-1">` (`:363-364`). Checking layers overflows/crushes bottom layer toolbar buttons horizontally. | Move lines `:382-411` above/outside the bottom toolbar container (`:363-466`) as its own stacked flex-col row. |
| **UI-BUG-3** | **P0** | `src/App.tsx:2211-2241`, `App.tsx:2304-2315` | **Expanded Stack Dockers missing critical props vs Grouped Stack (`:2036-2074`):** Expanded Stack `LayersPanel` (`:2211-2241`) omits `groups`, `onMoveSelectedLayersToGroup`, `onMergeSelectedLayers`, `onInvertLayerColor`, and `onOpenLayerSettings`! Expanded Stack `NavigatorPanel` (`:2304-2315`) omits `surfaceMode` and `shadingMode`. | Pass the identical prop sets to Expanded Stack `LayersPanel` and `NavigatorPanel` as in Grouped Tabs mode (`:2036-2085`). |
| **UI-BUG-4** | **P0** | `src/renderer/Viewport3D.tsx:2030`, `:2383` | **Overlapping top-left floating toolbars:** Top-left floating bar (`top-3 left-3 z-30` at `:2030`: Layout / X-Ray / HDRI / Bloom) sits directly on top of the Drone Nav / Axis bar (`top-2 left-2 z-20` at `:2383`), obscuring `Drone Nav` and `Axis: NATURAL`! | Merge both bars into a single flex-wrap top-left container (or anchor Drone Nav / Axis to top-right or row 2). |
| **UI-BUG-5** | **P1** | `src/ui/PreferencesModal.tsx:76-81`, `src/renderer/Viewport3D.tsx:166-173`, `:697-702` | **Refresh-rate disconnect:** `PreferencesModal.tsx` replaced the 6-mode refresh selector + custom Hz input + Uncapped toggle with static notice text, while `Viewport3D.tsx` still keeps unused `refreshRateModeRef`/`customRefreshRateRef` and hardcodes on-demand sleep in `animate()` (`:697-702`). | Restore the refresh-rate selector (`on-demand`, `30fps`, `60fps`, `120fps`, `custom`, `uncapped` / disable cap) in `PreferencesModal.tsx` and wire frame-interval throttling + uncapped continuous loop into `Viewport3D.tsx` `animate()`. |
| **UI-BUG-6** | **P1** | `src/App.tsx:1563`, `src/ui/LagoonMenu.tsx:117-118, 148`, `src/ui/TextureFilterDialog.tsx:28`, `src/ui/BumpLevelsDialog.tsx:12` | **CSS `transform: scale(uiScale)` breaks `position: fixed` & Lagoon viewport hiding:** (a) Root `scale(uiScale)` establishes a new containing block for `position: fixed` children, distorting drag bounds (`window.innerWidth/Height`) in `LagoonMenu`, `TextureFilterDialog`, and `BumpLevelsDialog`. (b) In Lagoon mode, top `PhotoshopMenuBar` (`App.tsx:1570`), bottom status bar (`:2456`), `Viewport3D` floating chrome (`:2030-2344, :2412-2432`), and `Viewport2D` rails remain visible instead of yielding cleanly to Lagoon + Gizmo + Side Panels (keep an obvious exit puck / `Tab` hint). | Normalize drag bounds by `uiScale` (or portal floating windows outside the transformed container), and gate non-gizmo/non-docker chrome cleanly when `isLagoonActive` is true (keeping a compact Lagoon exit puck / `Tab` badge). |
| **UI-BUG-7** | **P1** | `src/ui/PhotoshopMenuBar.tsx:135-144, 176, 247, 754` (**UI2**) | **Menu auto-dismiss bug:** Every dropdown menu has `onMouseLeave={close}` alongside the `document` click-outside handler. Opening the native `<select>` for `Surface Normals` inside `Options` (`:754`) triggers `mouseleave` on the dropdown container and immediately slams the menu shut before selection. | Remove `onMouseLeave={close}` from dropdown containers; rely on the `document` click-outside listener and `Escape` key handler. |
| **UI-BUG-8** | **P1** | `src/App.tsx:392-413, 1546-1552` (**UI1**) | **Window panel enable/disable not persisted:** `activePanels` and `panelFloating` initialize with hardcoded defaults and are never read/written to `localStorage`. | Hydrate `activePanels` (`vue3d_active_panels`) and `panelFloating` (`vue3d_panel_floating`) from `localStorage` with schema validation and save on updates. |
| **UI-BUG-9** | **P1** | `src/App.tsx:562, 566, 1023, 1028`, `src/ui/TextureFilterDialog.tsx:85`, `src/ui/PreferencesModal.tsx:43, 49, 52, 143` | **Forbidden `window.alert` / `window.open` calls:** Blocked or silent in iframe / Wry WebView environments. | Replace alerts with an in-app non-blocking toast / status banner and replace `window.open` documentation jumps with an in-app modal or safe anchor. |

---

### C. 3D Painting, S0-1 UV Seams, Symmetry, GPU Memory & Undo Bugs (P0 / P1)

| ID | Priority | File & Exact Line(s) | Bug / Root Cause | Concrete Fix Idea |
|---|---|---|---|---|
| **PAINT-1** | **P0** | `src/renderer/Viewport3D.tsx:1626-1642`, `src/tools/brushEngine.ts:76` | **S0-1 `faceIndex` delta heuristic + symmetry wipe:** Line `1628` checks `Math.abs(faceIndex - prevFace) > 2`, which causes false seam breaks inside non-sequential smooth triangles and still bridges UV seams where face indices happen to be adjacent. Worse, calling `brushEngine.beginStroke(...)` (`brushEngine.ts:76`) runs `this.strokeStates.clear()`, **erasing all symmetry mirror stroke states mid-stroke**; then `:1632` returns early, dropping a dab and leaving the lazy stabilizer un-reset across the seam. | Precompute per-triangle `uvIslandId` once per mesh via shared-UV edge BFS; trigger split only when `triIsland[faceIndex] !== triIsland[prevFace]`. Add `brushEngine.resetStrokePath(strokeKey)` (instead of `.clear()`) and reset stabilizer coordinates cleanly without dropping the entry dab. |
| **PAINT-2** | **P0** | `src/renderer/Viewport3D.tsx:1476, 1670` | **Missing pointer capture & dropped tail events:** `handlePointerDown` (`:1476`) omits `e.currentTarget.setPointerCapture(e.pointerId)` — fast strokes leaving the canvas miss `pointerup` and leave `isPaintingRef = true`. `handlePointerUp` (`:1670`) clears `pendingPaintEventsRef.current = []` instead of draining final queued events before ending the stroke. | Call `setPointerCapture(e.pointerId)` in `handlePointerDown` (with `releasePointerCapture` + `onPointerCancel`), and flush `pendingPaintEventsRef` before `endStroke()` in `handlePointerUp`. |
| **PAINT-3** | **P1** | `src/renderer/Viewport3D.tsx:1763-1768`, `src/renderer/Viewport2D.tsx:869-875`, `src/tools/brushEngine.ts:536-625` | **Blur / Clone / Smudge lack dab interpolation & break Smudge delta:** All three tools stamp once per pointer event without spacing interpolation along fast moves; both viewports call `applySmudgeAt(ctx, dx, dy, dx, dy, brush)` passing **`from === to`**, breaking directional smudge push! `Viewport2D.tsx:890-905` also triggers duplicate synchronous full composites per dab. | Track per-path `prevX/prevY` for smudge direction (`from -> to`), interpolate blur/clone/smudge along step spacing like `paintDabs`, cache blur temp `ImageData`, and batch `Viewport2D` composite updates via RAF. |
| **PAINT-4** | **P1** | `src/renderer/Viewport3D.tsx:372-377` vs `:1881-1891` | **Composite blend-mode divergence:** Stroke dirty-rect compositing (`:1881-1891`) supports `hard_light`, `soft_light`, `difference`; idle/end-of-stroke `updateCompositeTexture` (`:372-377`) omits them and falls back to `source-over`, making strokes visibly snap color when the pen lifts. | Extract one shared `blendModeToGlobalCompositeOperation(mode)` helper and use it across `App.tsx:485`, `Viewport3D.tsx:372`, and `Viewport3D.tsx:1881`. |
| **PAINT-5** | **P1** | `src/renderer/Viewport3D.tsx:937-989`, `:828-847`, `:1101-1104` | **GPU material & texture memory leaks:** Effect at `:937-989` runs on `[shadingMode, materialProps, layers]` (every layer edit/toggle/stroke end) and instantiates a new `THREE.Material` (plus 512×512 `uvTex` in `uv_check` mode at `:970`) **without calling `.dispose()` on the previous material/texture**. Unmount cleanup (`:828-847`) and virtual symmetry rebuild (`:1101-1104`) also leak child geometries/materials. | Dispose prior `mesh.material` and temporary `uvTex` before replacing; update uniform/property fields in-place when material class matches; traverse and dispose geometry/material/map on unmount and symmetry rebuild. |
| **PAINT-6** | **P1** | `src/App.tsx:121, 705, 746, 1232, 1366, 1475`, `src/tools/brushEngine.ts:545, 571, 611` | **Missing `willReadFrequently: true` on 2D canvases:** Offscreen layer canvases use default GPU-backed 2D contexts, causing slow CPU readback warnings/stalls during Blur/Clone/Smudge/Filters/Export. Also `drawStabilizerTether` (`Viewport3D.tsx:1945-1974`) ignores its `stabilized` param and draws a hardcoded `(cursorX - 8, cursorY - 8)` offset. | Pass `{ willReadFrequently: true }` where filters/pixel reads occur (or cache CPU readback surfaces) and project the actual stabilized texel/3D coordinate in `drawStabilizerTether`. |
| **PAINT-7** | **P1** | `src/core/history.ts:83-98, 168-175` | **Undo captures pixel arrays only (structural desync):** `applySnapshotToLayers` restores pixels for existing layer IDs but fails to restore added/deleted/reordered layers, layer groups, opacity, blendMode, channel, or `pbrSettings`, and allocates full uncompressed `ImageData` per layer for 30 states (`4MB * N * 30`). | Store structural layer metadata (`order, groupId, opacity, blendMode, channel, pbrSettings, visible, isMask`) alongside dirty-layer pixel deltas so undo/redo restores full document state with lower heap pressure. |

---

### D. Filters, A4–A7, Wood (2A-W), Triplanar (2A-T), 2D UV (A6), Subdivision (2E), Shortcuts & Export (P0 / P1 / P2)

| ID | Priority | File & Exact Line(s) | Bug / Root Cause | Concrete Fix Idea |
|---|---|---|---|---|
| **EXPT-1** | **P0** | `src/App.tsx:1290-1293`, `:2641` | **`handleExportOBJ` exports a hardcoded 4-vertex unit quad!** Calling File/Lagoon OBJ export ignores `activeGeometry` and outputs a flat square (`v -1 -1 0`..`v 1 1 0`). Additionally `ExportModelDialog` at `:2641` receives `currentMesh={null}`, dropping live scene geometry for glTF/FBX export. | Serialize `activeGeometry` positions/normals/UVs/indices (with part `g` groups) inside `handleExportOBJ`, and pass a valid `THREE.Mesh`/geometry ref to `ExportModelDialog`. |
| **SUBD-1** | **P0** | `src/App.tsx:448-463`, `src/ui/panels/SubdivisionPanel.tsx:39` | **Uncapped subdivision freeze & per-stroke full Catmull-Clark rebuild:** (a) `SubdivisionPanel.tsx:39` allows unlimited level increments (`+` to Level 4/5 = $4^5$ faces → tab OOM/freeze). (b) `subdivisionHeightMap` depends on `[layers]` (`App.tsx:448`), forcing a synchronous full CPU Catmull-Clark topology split after **every single brush stroke** whenever displacement > 0! | Clamp `subdivision.level` cleanly (e.g. max 3, matching memory budget), cache subdivided base topology separately from per-vertex displacement updates, and apply height displacement in-place on cached vertices instead of re-splitting faces on every stroke. |
| **FILT-1** | **P0** | `src/tools/fillSuite.ts:75` | **Broken RGBA/HSLA tint regex (`2A-T`):** `/^(rgba?\|hsla?)\\((.*)\\)$/i` uses double-escaped `\\(` `\\)` inside a JS regex literal, matching literal backslashes instead of parentheses! All `rgb(...)`/`rgba(...)`/`hsl(...)` tints fail to parse and revert to white `#ffffff`. | Fix regex to `/^(rgba?\|hsla?)\((.*)\)$/i`. Also add world vs object space toggle, real smooth noise / height / painted-mask mix operator (beyond `sin`/`cos`), and mask-aware `padIslandEdges`. |
| **FILT-2** | **P1** | `src/ui/TextureFilterDialog.tsx:9, 11, 35, 39`, `src/tools/textureFilters.ts:9-57, 266-450`, `src/App.tsx:2499-2508` | **A4 incomplete & blocking modal overlay:** `TextureFilterDialog` and `BumpLevelsDialog` (`:18`) wrap in `fixed inset-0 bg-black/65`, darkening and blocking 3D orbit/zoom. `App.tsx:2499` omits `meshParts`/`selectedMeshPart`, `TextureFilterDialog` ignores them, `TextureFilterConfig` lacks `targetMeshPart`, and `transformTexturePixels` has no per-texel part mask. Preview (`:35`) also skips `objectPositionMap` for non-wood filters. | Switch wrapper to `pointer-events-none` + `pointer-events-auto` card; wire `meshParts`/`selectedMeshPart` + UV selection mask toggle into `TextureFilterConfig` and rasterize a boolean texel mask per target part/UV island before `transformTexturePixels`. |
| **FILT-3** | **P1** | `src/tools/textureFilters.ts:268, 291-331` | **2A-W Wood grain seam/noise defects:** Lines `:296-298` hash 2D UV cells `Math.floor(x/48), Math.floor(y/48)` instead of object/world `(ox, oy, oz)` (breaks continuity across UV seams even when `mapped === true`), and `:309` adds per-pixel white noise instead of smooth 3D FBM/value noise, missing uniform tree-year vs organic fingerprint/merged ring modes and world-space curvature/normal flow. Line `:268` also builds unused `srcImg`. | Replace 2D grid hash with 3D smooth FBM/value noise evaluated on `ox, oy, oz` (or world-transformed pos), add `ringMode: 'uniform' \| 'organic'`, `directionSpace: 'object' \| 'world'`, and curvature/normal warp; drop dead `srcImg` copy. |
| **FILT-4** | **P1** | `src/ui/BumpLevelsDialog.tsx:7-24`, `src/tools/layerConversions.ts:20-80`, `src/App.tsx:907-922, 1018-1071, 1098-1103` | **A7 / F8 Bump Levels destructiveness & merge gap:** `applyBumpLevelsToLayer` (`BumpLevelsDialog.tsx:24`) destructively overwrites RGB color pixels with grayscale instead of storing/deriving height while preserving painted color; `mergeSelectedLayers` (`App.tsx:1018-1071`) refuses differing `pbrSignature` layers (`:1027`) rather than merging selected bump/displacement layers directly into Levels with default 100% (`bumpInfluence: 1`) bump output. | Store non-destructive bump/height map data (or clone to height buffer) when converting paint → bump, and allow merging bump/displacement layers directly into a height result that launches Bump Levels defaulting to 100% bump influence. |
| **UV2D-1** | **P1** | `src/renderer/Viewport2D.tsx:108-179, 197, 208-211, 296-314, 1039-1194, 1365` | **A6 2D UV shelf clutter, blend ignore & per-frame canvas allocs:** Conflicting CSS `order-*` classes scramble strip order and collide with top-right Touch Nav / narrow split views (`w-[calc(100%-12rem)]`); `:175-176` & `:208-209` reassign `cvs.width = 1024` every render (reallocating backing store); `:296-298` allocates a fresh `1024×1024` `<canvas>` on every pointer move during mask overlay draw; `:197` ignores `layer.blendMode`; `:148/:1102` `activeUVSet` is disconnected from `activeUVChannel`. | Standardize clean flex order without `order-*` conflicts + keep clear of top-right Nav; allocate cached helper canvas once in ref; honor `layer.blendMode` in 2D composite; wire `activeUVSet` to `activeUVChannel` and update layer resolution cleanly on rebake. |
| **KEY-1** | **P2** | `src/App.tsx:594-673`, `src/renderer/Viewport2D.tsx:139` | **Keyboard shortcut stale closure & `'n'` key collision:** `App.tsx:673` binds `keydown` with deps `[layers, undoBuffer]` only — omitting `primaryColor`, `secondaryColor`, `projectName`, `embed3DAssets`, `modelKey`, `activeLayerId`, `activeGeometry`. Additionally both `App.tsx:665` and `Viewport2D.tsx:139` listen for `'n'` (Tablet drawer vs UV N-Panel toggle simultaneously in 2D/split view). | Move keyboard action handler behind an up-to-date `useRef` (or complete deps) and scope `'n'` to UV N-Panel only when pointer/focus is inside the 2D pane. |
| **SRV-1** | **P2** | `self-host/server.js:217-228` | **Self-host texture URL encoding & large project handling:** `/api/textures` should consistently `encodeURIComponent(filename)` in returned URLs and return clean `413` JSON on oversized `.xblend` payloads; `App.tsx` is not yet wired to `/api/textures` for shared 2D Texture Gallery / Triplanar folder persistence. | Encode returned URL segments in `server.js`, return explicit `413`, and share an IndexedDB + optional `/api/textures` gallery provider for 2D / 2A-T. |

---

### E. Verification Status of This Entry
- Commands run during audit: `npx tsc --noEmit` (10 errors above reproduced), `grep -rnE` checks across `src/`, full manual read of all 27 `.md` files and core `src/` + `self-host/` modules.
- No files in `src/`, `crates/vue3d_core/`, `self-host/public/`, or safety ZIPs were modified in this troubleshooting pass. Next session should execute the P0 fixes first, verify `npx tsc --noEmit && npm run build && npm run host:sync`, and keep `AGENTS.md` PIN updated only after synced verification.



## 2026-11-24 — GPT-6 P0 repair execution (LOG-2026-11-24-GPT6-REPAIR-PASS-02)

The Gemini Hydrogen troubleshooting report was read and the audited P0 defects were repaired on remote main.

### Landed
- TypeScript fixes across xblendFormat.ts, hdriManager.ts, surfaceShading.ts, textureFilters.ts and MeshPartsPanel.tsx; npm run lint is now a required self-host CI step.
- Duplicate View menu removed; dropdown dismissal fixed; Layers bulk-action layout, Expanded Stack props and viewport toolbar overlap corrected.
- OBJ export now serializes the active geometry; glTF/FBX export receives a mesh wrapping active geometry.
- RGB/RGBA/HSL tint parsing fixed.
- UV seam detection now uses cached connected UV-island IDs from shared geometric edges and matching UV coordinates. The active UV channel and uvGeometryVersion are respected.
- Brush path resets preserve symmetry path state and stamp the new island entry dab. Pointer capture is enabled and queued/coalesced events are flushed before pointer-up/cancel ends a stroke.
- UV coverage is generated from the active mesh triangles and applied to 3D brush/eraser/pen, gradients, clone, smudge, blur and Mask Brush. Blur writes through drawImage because putImageData ignores clipping.
- New helpers: src/renderer/objExporter.ts, src/tools/uvIslandMap.ts, src/tools/uvIslandClip.ts.

### Final CI verification
- Run #258: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45386790536 — success.
- Tested source revision: b54476cc1455c9bc18d895bc638cf5d858d315b3.
- TypeScript diagnostics, Vite build, self-host sync, blank-package checks, generated-output commit, ZIP and artifact upload all succeeded.
- Artifact VUE_3D_Canvas_SelfHost: ID 14917995630 (~2.07 MB).

### Not verified by CI
No browser/device visual test is claimed. Victory must still test startup, fast UV seam strokes, no-paint-outside-islands, non-default UV channels, symmetry, pointer capture/final dab, undo/redo and OBJ/glTF/FBX round-trips. 2E subdivision remains verify-only and was not changed.

### Remaining order
A4 mesh-part filter selection; A5 title-drag verification; A6 UV shelf; A7 bump/Levels workflow; UI1 window persistence; 2A-W Wood rings; 2A-T triplanar A/B; 2B layer/filter additions; 2C filters; 2D texture gallery. Do not replace built-in triplanar samples until Victory supplies replacements. PR #2 remains open and unmerged.


## 2026-11-24 — GPT-6 follow-up execution: A4 / A6 / A7

This section supersedes the earlier A4/A6/A7 "open" checklist entries above. The work was committed directly to remote `main` in the self-hosted TypeScript application. No changes were made to `crates/vue3d_core`, user OBJ assets, safety archives or built-in triplanar sample textures.

### A4 — mesh-part filter targeting

- `TextureFilterDialog` now receives the live mesh-part list, selected part, active UV channel and UV geometry version.
- Added `targetMeshPart`, `useMeshPartMask` and a per-texel coverage mask to `TextureFilterConfig`.
- `buildMeshPartPixelMask` rasterizes only the chosen component's triangles using the active UV channel; it supports component-index lists and geometry groups.
- Every filter output path applies the mask so texels outside the selected part remain unchanged. Atlas dilation is skipped when a part mask is active to avoid modifying neighbouring parts.
- Preview and Apply both validate mask creation; a missing/empty mask reports an inline error instead of silently filtering the whole layer.
- The filter dialog is rendered through a portal with a pointer-transparent outer surface, so clicks outside its card reach the viewport and close the floating dialog.
- CI: Run #262 passed; artifact `14918105222`.

### A6 — 2D UV workspace

- Replaced the disconnected local UV-set selector with the real `activeUVChannel` and `UVChannelManager.getChannels` list; App passes `uvGeometryVersion`.
- The 2D layer composite now respects each layer's Canvas-supported blend mode and opacity.
- UV canvas, overlay, pointer coordinates, sculpt coordinates, selection masks and fit-to-view dimensions now follow the active layer's actual canvas size.
- Re-bake now creates the requested resolution for every layer, rebakes the active layer to the target UV channel, preserves the other layers by resampling them, and rebuilds the composite from the updated layer array.
- XBlend image loading restores each layer's natural image dimensions and refreshes the composite as each image finishes loading.
- Reused the selection-shade offscreen canvas instead of allocating a new full-size canvas during pointer movement.
- Removed conflicting CSS order tokens, reserved room for the top-right touch controls, and scoped the `N` shortcut so the UV N-Panel does not collide with the App Tablet drawer shortcut.
- CI: Run #265 passed; artifact `14918012437`.

### A7 / F8 — non-destructive Bump Levels and height merge

- Added shared `HeightLevels` metadata and `applyHeightLevels` mapping.
- `BumpLevelsDialog` previews grayscale height but Apply stores the input/output Levels and bump influence in PBR metadata; it no longer overwrites the source color canvas.
- Added a 0–100% bump-influence control, defaulting to 100% for a new conversion/merged height result.
- Paint-to-Bump retains its original color contribution. Height-only layers remain color-disabled. Bump/Displacement conversion preserves Levels metadata and defaults a newly enabled bump contribution to full influence.
- `Viewport3D`, subdivision height generation and XBlend height-map export now apply the stored Levels before the height ramp.
- Merging selected bump-only/height-only contributors on the same UV channel creates a dedicated grayscale height layer, evaluates each source layer's Levels/ramp/influence, and opens Bump Levels on the result at 100% influence. Color-enabled bump layers are excluded from this height-only merge to prevent losing their color contribution.
- PBR settings saves and XBlend normalization preserve/default the Levels metadata.
- CI: Run #283 passed; latest artifact `14917704031`.

### Verification boundary and next work

- These CI runs establish TypeScript/build/self-host package success; they do not establish visual or device-level correctness.
- Manual acceptance remains for: selected-part filtering on multiple components and UV seams; alternate UV channels; 512/1024/2048 rebake alignment across all layers; blend-mode display; `N` shortcut routing; Bump Levels preserving color; 100% influence; merging bump/displacement sources; XBlend save/load and exported height maps.
- A5 title dragging remains verify-only.
- Next implementation priority: UI1 window enable/disable persistence, then 2A-W wood rings, 2A-T true triplanar A/B, 2B Mask/Tear/Pattern Craft/Matcap, 2C additional filters and 2D texture gallery. 2E subdivision remains verify-only.
- PR #2 remains open and unmerged.

## 2026-11-24 — GPT-6 — UI1 Window layout persistence

**Request:** Continue the outstanding self-hosted application tasks in the order specified by the root AGENTS.md PIN.

**UI1 implementation (`src/App.tsx`):**
- Added backward-compatible restoration for the Window menu panel visibility map from `vue3d_panel_visibility`.
- Added restoration for floating versus docked panel state from `vue3d_panel_floating`.
- Both readers merge only known panel keys with current defaults and ignore malformed JSON or non-boolean values, so future panels retain their defaults and corrupt browser storage cannot prevent startup.
- Added guarded persistence effects for both maps. Storage failures produce a warning but do not interrupt the application.
- The existing Window menu and close/float controls remain the controls for changing these states; no new panel UI was introduced.

**Verification:** Run #285 passed TypeScript diagnostics, Vite build, self-host sync, package validation, generated-output commit (rebased over concurrent documentation commits), ZIP creation and artifact upload. Artifact ID `14921232460`; source workflow head `da53debd3ace8986c1259266d04585017a310ffc`. Browser restart persistence and file:// storage behaviour still require manual acceptance.

**Next in the root PIN:** 2A-W Wood rings, then 2A-T true triplanar A/B, 2B Mask/Tear/Pattern Craft/Matcap, 2C additional filters, 2D texture gallery. A5 title dragging and 2E subdivision remain verify-only; UI3 requires a focused scan. Do not replace built-in triplanar samples before Victory supplies replacement textures. PR #2 remains unmerged.

---

## 2026-11-24 — GPT-6 — external asset scanner foundation
- Source commit: `17c020d` added `src/tools/externalAssetLibrary.ts`; `cd2eef1` corrected classification when the selected root itself is named for an asset category.
- Documentation commit: `ce5f899` added `notes/EXTERNAL_ASSET_LIBRARY_2026-11-24.md`; `53bb548` recorded scope in `AGENTS.md`.
- The module stores a user-selected directory handle in IndexedDB where supported, scans matching folder names case-insensitively, and uses a Worker for sorting/classification. Browser permission remains explicit.
- **Not complete:** BrushLibraryPanel integration, texture/brush/mask gallery presentation, preference controls, PNG alpha workflow, and runtime browser acceptance.
- **Not touched:** built-in triplanar textures, supplied asset packs (not yet provided), Rust core, protected OBJ assets, and safety archives.
- Next ordered code task remains 2A-W Organic Wood. Do not jump ahead and mark the broader backlog complete. The user's future texture ZIP should be processed separately: rename consistently, resize triplanar texture images to 512 px width with aspect ratio preserved, and retain transparency where present.

- CI: self-host workflow #287 passed (run ID `45434787995`), artifact `14939569386`. This is build/package validation only; no browser runtime or UI acceptance is claimed.


---

## 2026-11-24 — Protected base layer restored (original model superseded)
- The original protection pass added `Layer.isBaseLayer`, a permanent bottom layer, and guards against painting and destructive stack actions.
- Its initial solid-grey UV fallback-coat rendering was superseded by the world-space procedural checker implementation.
- Current behaviour, Save / Cancel / Reset semantics, file/symbol bookmarks, and acceptance checks are documented in `notes/WORLD_SPACE_BASE_LAYER_2026-11-24.md`.
- The earlier protection-only CI result does not validate the newer shader/dialog implementation; see the later GPT-6 world-space Base Layer handover entry above.
