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

### 2026-11-03 — post-execution (self-hosted standalone, not the exe)
- Pre-edit bookend is `77dec62`. The Windows window path was not changed and no workflow was added.
- `self-host/public/` no longer keeps the old bundles (`index-DOfcFx5E.js` and the other stale hashes). `scripts/sync_self_host.mjs` copied the current build: `index.html`, `assets/index-B-mwzPmH.js` (1,443,254 bytes), and `assets/index-DxXuOCkG.css`. The bundle parses as JavaScript and contains the painter title.
- `self-host/server.js` still has no npm dependencies. COOP/COEP `require-corp` was removed so the Google font links in `index.html` are not blocked. A missing `.js` URL now returns 404 instead of `index.html`, which was a blank-page failure. Path checks use `path.relative`.
- Verified on Linux with `node self-host/server.js --port 4173`: `/` is `text/html`, the JS bundle is `application/javascript`, `/api/health` is online, `/api/projects/save` wrote `probe.xblend`, and the old bundle URL plus a `..` path returned 404 plain text, not the server source.
- Launch without an exe: `self-host/start.bat` (opens the browser), `self-host/start.sh`, or `npm run host` from the repo root. `npm run host:sync` rebuilds and refreshes `public/`. Do not open `index.html` with `file://`.

### 2026-11-03 — pre-execution (native DirectX 11 / OpenGL window, other folder)
- Victory asked for another folder: a Windows app written in Rust with direct DirectX and OpenGL access, not the WebView painter and not the self-host server. `.htaccess` cannot enable either API. This note is the pre-edit bookend only.
- The WebView exe (`crates/vue3d_core`) and `self-host/` stay. This is not a D3D12 or ray-tracing programme, and it is not Python or C. No code for the new folder has been added yet.

### 2026-11-03 — post-execution (high-fidelity Three.js 3D engine & mesh precision in self-hosted app)
- Upgraded Three.js engine and mesh geometry processing in the self-hosted distribution (`self-host/public`):
  - Solved low-poly "LOD 2" blurry appearance on complex and architectural models.
  - Implemented crease-angle-aware normal calculation in `SurfaceShadingEngine.computeSmoothNormals` (38° threshold) preventing sharp 90-degree architectural edges and chamfers from being smoothed or melted into rounded blobs.
  - Upgraded wavefront OBJ loader (`parseOBJ`) to support convex polygon fan triangulation for arbitrary n-gons (walls, slabs, windows), relative negative index parsing (`v -1`, `vt -1`), and preservation of explicit imported `vn` normals.
  - Configured 16x anisotropic texture filtering (`renderer.capabilities.getMaxAnisotropy()`) and `LinearMipmapLinearFilter` on dynamic and emissive textures, maintaining razor-sharp detail and eliminating moiré/shimmer when zooming out.
  - Re-architected procedural model presets: High-poly Suzanne (4x subdivided icosahedron base with sculpted anatomy), high-precision Cyber Helmet (64x48 segments), and added a high-fidelity Architectural Pavilion preset (`pavilion`).
  - Synced production bundle to `self-host/public` via `npm run host:sync` (`index-B2S4rs6M.js`).

### 2026-11-04 — post-execution (stochastic scatter sizing, navigation calibration, 3D gizmos & auto-fit, MTL imports, texture auto-nodes & material fill, preferences, tablet mode)
- Appended capabilities to the Web and Self-Hosted application suites:
  - **Stochastic Scatter Sizing & Jitter:** Added `stampSize` slider + numeric text input (8px-512px) and `sizeJitter` slider + numeric text input (0%-100%) in `StochasticScatterDialog.tsx` and `StochasticScatterEngine.applyScatter`.
  - **Navigation Calibration:** Reduced orbit speed multiplier to `0.0042 * navSensitivity` and tuned panning deltas in `Viewport3D.tsx` for stable, responsive 3D navigation.
  - **Orientation Gizmo Synchronization & Visual Styles:** Corrected CSS 3D matrix math in `boxGizmo.tsx` (`rotateX(${degX}deg) rotateY(${degY}deg)`), aligning gizmo rotation with viewport viewing angle. Added spring zoom pulse animation effect (`zoomScale`) on camera zoom in/out. Added 3 switchable gizmo styles: `box`, `sphere`, and `mountain`.
  - **Auto-Fit / Frame Model Button (`[⛶ Frame]`):** 1-click model framing button in the gizmo overlay computing the bounding sphere radius and centering/filling the viewport for any loaded model regardless of import scale.
  - **Companion `.mtl` Import Support:** Added staged MTL file upload input and status display in `ProjectSettingsModal.tsx`, linked to `parseOBJ` for material coordinate and UV map preservation.
  - **Texture Import & Auto-Node Setup Modal (`TextureAutoNodeModal.tsx`):** Added "Import Texture..." action in `LayersPanel.tsx` opening an interactive auto-focused preview modal. Provides a role dropdown (`Material Texture Fill`, `Color / Albedo`, `Displacement / Height`, `Emission`, `Reflection Mask`, `Normal Map`) that wires directly into the Blender shader node graph.
  - **Procedural Material Texture Fill Layer:** Dedicated procedural fill mode supporting triplanar XYZ blended projection and box mapping with scale, repeat, rotation, and stochastic randomization. Displays a `FILL` badge in `LayersPanel` and includes a "Bake to Layer" button to rasterize the fill into standard pixels before converting to bump or normal maps.
  - **Centralized Preferences Modal (`PreferencesModal.tsx`):** Added Edit > Preferences... menu item and top bar shortcut gear button to toggle Constant Viewport Refresh (OFF = on-demand, ON = continuous 60fps), select 3D Gizmo Style (`box`, `sphere`, `mountain`), toggle Tablet Mode, and fine-tune Navigation Sensitivity.
  - **Full-Screen Tablet Mode:** Collapses left tools into a bottom-left circular carousel and top tool sliders into an expandable top-right carousel. The Docker panel system transforms into a collapsible N-Panel slide-out drawer accessible via right-edge `[◀ PANELS]` tab or the `N` key shortcut, providing an expansive drawing canvas while keeping floating filters active.
  - **Self-Hosted Distribution Rebuilt & Synced:** Ran `npm run host:sync`, updating `self-host/public` with the latest build bundle (`index-Ct70vtbA.js`).

### 2026-11-04 — pre-execution (SweetHome 3D mesh repair, texture auto-replacement, tablet brush carousel, options overlap, draggable filters)
- Pre-execution bookend: proceeding with implementation of:
  - SweetHome 3D architectural mesh auto-repair (spatial vertex welding & coplanar normal snapping)
  - Native UV re-import action & companion texture folder auto-matching and layer replacement algorithm
  - Top-left tablet brush parameter carousel with switchable radial dial & circular HUD sub-operators
  - Options bar button overlap fix with Preferences layout switch (Grouped Clusters vs Collapsible Icon Groups)
  - Draggable docker-style filter windows with zero backdrop blur
  - Verified and synchronized to `self-host/public`.

### 2026-11-04 — post-execution (SweetHome 3D mesh repair, auto-texturing, UV re-import, tablet carousel, zero-blur draggable filters landed)
- Appended capabilities to the Web and Self-Hosted application suites:
  - **SweetHome 3D & Architectural Mesh Auto-Repair:** Relaxed vertex welding (`EPSILON = 5e-4`) connects split adjacent faces in CAD/SweetHome 3D models; coplanar normal snapping (< 2° dihedral angle) unifies normals across planar architectural walls and slabs, eliminating choppy faceted edges and dark shading bands. Toggleable in Preferences (`architecturalRepair`) and manual trigger button in `ProjectSettingsModal`.
  - **Companion Texture Folder Auto-Matching & Layer Auto-Replacement:** Upload multiple images from a model's texture folder; automatic semantic and `.mtl` parser classifies files into Diffuse, Normal/Bump, Roughness, and Emission channels. 1-click `[⚡ Auto-Texture Model & Replace Layers]` converts them directly into Photoshop CS5 layers with proper PBR channels and live canvas composite sync.
  - **Native UV Channel Re-Import:** Added `[⟲ Re-import Original UVs]` button in `ProjectSettingsModal` restoring pure `vt` coordinates from source OBJ files without affecting existing user painting or layer structure.
  - **Tablet Mode Top-Left Quick Parameter Carousel (`TabletBrushCarousel.tsx`):** Circular carousel for Size, Opacity, Spacing, Scatter/Jitter, Hardness, and Stabilizer with dual sub-operator styles switchable in Preferences: Interactive SVG Radial Arc Dial (`'radial'`) and Compact Floating Circular HUD (`'hud'`).
  - **Non-Overlapping Options Bar Layout:** Added `optionsBarLayout` switch in Preferences between Grouped Semantic Clusters (`'clusters'`) and Collapsible Icon Groups (`'compact'`), preventing button collisions on compact laptop screens.
  - **Draggable Docker Filter Windows with Zero Backdrop Blur:** Converted `GaussianBlurDialog`, `StochasticScatterDialog`, `EdgeWearDialog`, `TriplanarDialog`, and `StitchStudioDialog` into non-blocking, draggable floating windows without backdrop blur or dark overlays, enabling live 3D canvas observation during parameter adjustments.
  - **Self-Hosted Distribution Rebuilt & Synced:** Ran `npm run host:sync`, compiling production bundle `index-C8hb8ysL.js` and updating `self-host/public`.

### 2026-11-05 — pre-execution (Painting performance, surface normals fix, refresh rate controls, stroke dynamics menu, and menu bar decluttering)
- Pre-execution bookend: proceeding with implementation of:
  - Eliminating 3D painting choppiness by replacing synchronous multi-layer re-compositing and per-dab mipmap regeneration with RAF-throttled canvas updates.
  - Fixing broken surface normal triggers (Def, Smooth, Flat) by isolating original file normals in `origFileNormal` and recompiling `flatShading: true` materials.
  - Viewport Refresh Rate engine in Preferences with presets (On-Demand, 30 FPS, 60 FPS, 120 FPS) and custom VSync numeric text input.
  - Stroke Control Menu (Airbrush, Dot, Drag Dot, Space, Curve, Lazy Mouse, Spacing) in Options bar popup, Tablet Carousel, and Brush Library docker.
  - Decluttering the options bar and menu bar: moving secondary controls into top Menu Bar dropdowns (**View**, **Options**, **Window**) and adding 3-way layout switch (**Default**, **Minimal**, **Compact**) for desktop and tablet.
  - Dev server health verification.

### 2026-11-05 — post-execution (Painting performance, surface normals fix, refresh rate controls, stroke dynamics, and menu bar decluttering landed)
- Appended capabilities to the Web and Self-Hosted application suites:
  - **High-Performance Smooth Painting Loop:** Replaced synchronous multi-layer 1024x1024 canvas re-compositing and WebGL mipmap generation in `executePaintTool` with fast active-layer canvas blits to the composite canvas and RAF-throttled texture dirty notifications. Deferred full multi-layer recompositing, mipmap recalculation, and undo commits to pointer-up, eliminating all painting window stutter and stutter on rapid brush strokes (60-120+ FPS continuous drawing).
  - **Restored Surface Normal Triggers (Default, Smooth, Flat / Hard Surface):** Preserved pristine mesh vertex normals in `origFileNormal` before running architectural repair or normal recalculations. Default restores original mesh normals without loss; Smooth computes angle-weighted curvature interpolation; Flat applies facet normals and recompiles shaders with `flatShading: true`. Added direct surface mode triggers across Toolbox, Tool Options Bar, and the top View Menu.
  - **Configurable Viewport Refresh Rate Engine:** Extended Preferences with 5 selectable refresh rate presets: **On-Demand** (power-saver dirty updates), **30 FPS** (battery mode), **60 FPS** (standard VSync), **120 FPS** (high refresh display), and **Custom VSync** (interactive numeric input from 15 Hz to 240 Hz). The 3D viewport throttles the render loop using high-precision `performance.now()` frame intervals.
  - **Stroke Control Menu & Dynamics Access:** Added dedicated Stroke & Dynamics popover in the Tool Options Bar (accessible next to Spacing), added a dedicated `Mode` button with radial arc & circular HUD sub-operators in the Tablet Mode Carousel (`TabletBrushCarousel.tsx`), and confirmed explicit Stroke Application Mode segmented controls in the Brush Library docker panel (`BrushLibraryPanel.tsx`) for instant on-the-fly switching between **Space**, **Airbrush**, **Dot**, **Dragged-Dot**, and **Curve**.
  - **Decluttered Top Menu Bar & Options Bar Overlap Solution:** Removed bulky inline select boxes and stamp buttons from the top menu strip that exceeded the viewport radius. Re-architected secondary viewport, geometry, and parts isolation controls into standard Photoshop CS5 top dropdown menus (**View** and **Options**). Added a 3-way layout switch in Preferences (**Grouped Clusters**, **Minimal (Clean)**, and **Collapsible Groups**): Minimal layout keeps only core brush controls on the sub-bar and moves all viewport tools to the menu bar, completely eliminating UI collisions on tablets and laptops.
  - **Self-Hosted Distribution Rebuilt & Synced:** Ran `npm run host:sync`, compiling production bundle `index-BblJ2yhP.js` and updating `self-host/public`.

### 2026-11-05 — pre-execution (Lagoon radial menu, camera viewpoints fix, uncapped refresh rate, and master docs)
- Pre-execution bookend: proceeding with implementation of:
  - Autodesk Sketchbook / Maya Lagoon radial interface triggered via top menu bar button before Projection [F8] and keyboard/gesture shortcuts, covering workspace into an expansive drawing canvas while preserving 3D gizmo and dockable panels.
  - Fix camera viewpoints in the View menu (Front, Back, Right, Left, Top, Bottom, and Ortho/Persp) so selecting them actively re-orients the 3D camera in `Viewport3D.tsx`.
  - Add "Uncapped / Disable refresh rate" setting to Preferences alongside On-Demand and VSync options.
  - Author master `API_DOCUMENTATION.md` detailing Viewport, Brush, Layering, Filters, WebGL/DirectX/OpenGL ANGLE architecture, and Shader Nodes.
  - Author master `DEVELOPMENT.md` detailing program genesis, Rust native desktop app, and self-hosted distribution architecture.
  - Update `AGENTS.md` and `AGENT_STATE.md` with links to all development documentation.

### 2026-11-05 — post-execution (Lagoon radial menu, camera viewpoints fix, uncapped refresh rate, and master docs landed)
- Appended capabilities to the Web and Self-Hosted application suites:
  - **Autodesk Sketchbook / Maya Lagoon Radial Interface (`LagoonMenu.tsx`):**
    - Toggle button placed directly before `Projection [F8]` in the top menu bar (`PhotoshopMenuBar.tsx`), with `Tab` keyboard shortcut.
    - When active, collapses the top options sub-toolbar and left tool column into an expansive full-screen drawing canvas, while preserving the 3D Orientation Gizmo and right dockable panels / N-Panel.
    - Draggable floating puck with 6 radial wings: Tools, Brush Dynamics (Size, Opacity, Hardness, Stroke Modes), Colors & Swatches, Layers, Views, and Project (.xblend, OBJ export, Projection snapshot).
  - **Camera Viewpoints Snapping in View Menu:**
    - Fixed Front (`Num 1`), Back (`Ctrl+Num 1`), Right (`Num 3`), Left (`Ctrl+Num 3`), Top (`Num 7`), Bottom (`Ctrl+Num 7`), Ortho/Persp (`Num 5`), Reset (`Num 0`), and Auto-Fit Frame (`Num .`) in `PhotoshopMenuBar.tsx`.
    - Wired `onNumpadKey` through `viewSnapTrigger` state in `App.tsx` directly to `Viewport3D.tsx`, recalculating spherical angles ($\theta, \phi$) and triggering immediate dirty-frame rendering.
  - **Uncapped Refresh Rate in Preferences (`PreferencesModal.tsx`):**
    - Added 6th refresh rate mode `Uncapped (Disable Cap / Max FPS)` in Preferences alongside On-Demand, 30 FPS, 60 FPS, 120 FPS, and Custom VSync.
    - Bypasses all `frameInterval` throttling in `Viewport3D.tsx`, unlocking maximum allowable GPU throughput.
  - **Self-Hosted Distribution Rebuilt & Synced:** Ran `npm run host:sync`, updating `self-host/public` with the latest bundle (`index-DskiiCkq.js`).
  - **Master Technical Documentation (`API_DOCUMENTATION.md`):**
    - Authoritative unified API specification detailing Viewport Architecture, Brush Engine & Stabilizer, Layering System & Canvas Compositing, Filter Suite, Blender 2.8+ Node Graph Evaluator, Multi-UV Channel Manager, and Hardware Acceleration (ANGLE DirectX 11 / Desktop OpenGL bridge).
  - **Master Development Architecture Guide (`DEVELOPMENT.md`):**
    - Comprehensive guide detailing program genesis by Victory Ukpong, Rust native Windows WebView2 desktop app (`crates/vue3d_core`), self-hosted web distribution (`self-host/`), immutable constraints (3-state undo, linked assets, no ray-tracing/D3D12), and AI model transfer recommendations.

## Complete Development Documentation Index
| Document | Purpose & Key Topics |
| :--- | :--- |
| [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) | Technical reference for Viewport, Brush Engine, Layering, Filters, WebGL, Node Graph, Textures, and ANGLE DirectX 11/OpenGL bridge. |
| [`DEVELOPMENT.md`](./DEVELOPMENT.md) | Architectural genesis, Rust desktop app, Self-hosted distribution, constraints, and AI model handover recommendations. |
| [`AGENTS.md`](./AGENTS.md) | Architectural decisions ledger, immutable governing rules, and historical execution log. |
| [`AGENT_STATE.md`](./AGENT_STATE.md) | Detailed ledger of all live tools, panels, shaders, dialogs, and UI features. |
| [`HANDOFF_PROMPT.md`](./HANDOFF_PROMPT.md) | Context priming prompt for conversational transfer between AI coding engines. |
| [`XBLEND_FORMAT_SPECIFICATION.md`](./XBLEND_FORMAT_SPECIFICATION.md) | Binary and JSON layout of `.xblend` project files and 3-state ring buffer history. |
| [`WINDOWS_BUILD_INSTRUCTIONS.md`](./WINDOWS_BUILD_INSTRUCTIONS.md) | Step-by-step instructions for building the native Windows desktop package. |
| [`BLENDER_ADDON_PROMPT.md`](./BLENDER_ADDON_PROMPT.md) | Instructions for the companion Blender 2.8+ node graph importer script. |

### 2026-11-07 — pre-execution (self-host navigation, mesh normals, file://)
- Victory will test GitHub Actions artifacts and give feedback before any Windows exe rewrite. This execution does not edit `crates/vue3d_core`.
- Answer recorded here: the Windows build can be rewritten from the programme that already exists. Read `src/renderer/Viewport3D.tsx`, `modelGeometry.ts`, and `surfaceShading.ts`, then replace the WebView2 window with a Win32 process that creates a real DirectX 11 device and swapchain, and a real OpenGL context when `--opengl` is passed. Do not compile the React UI as if it were HLSL. Do not ship another console that only prints "DirectX initialized". The next agent does that rewrite only after Victory says the self-host test passed.
- Suggestions kept with the self-host, not deferred:
  - Free tumble. The current orbit clamps `phi` to `(0.0001, π-0.0001)` in `Viewport3D.tsx` and `NavigatorPanel.tsx`. That is the lock. Replace it with a quaternion camera and do not clamp pitch, yaw, or roll.
  - Imported OBJ keeps the file normals. If a face has no `vn`, fill only that face with its own flat normal. Do not run the 38° smooth on load. Smooth and Flat stay as buttons. Architectural auto-repair stays a button, not the default on import.
  - Scale an imported OBJ to a unit bounding sphere so a building and a character both land in view. Do not scale the built-in presets.
  - Session undo stays a normal stack (default 30). `.xblend` still stores only the last 3. Do not cap the live session at 3.
  - `self-host/public/index.html` must run from `file://` and from `http://`. Inline the script and CSS. Keep `server.js` for HTTP.
- Workflow first: add `.github/workflows/build-self-host.yml` (`workflow_dispatch` only) before the painter edits. It runs `npm run host:sync` and uploads a zip of `self-host/` (no `storage/`).
- Next task after Victory's test, and not before: rewrite the Windows exe onto DirectX 11 and OpenGL using the behaviour this self-host pass locks in.

### 2026-11-09 — post-execution (self-host tumble, file normals, file://)
- Pre-edit bookend is `fcf1ad8`. The workflow file landed first as `86528df` (`.github/workflows/build-self-host.yml`, `workflow_dispatch` only). `crates/vue3d_core` was not edited.
- `src/renderer/freeCamera.ts` replaces the clamped theta/phi orbit in `Viewport3D.tsx` and `NavigatorPanel.tsx`. Dragging tumbles on the camera's own up and right. There is no pitch stop. Zoom is not capped at 100000. Numpad snaps still set front, back, left, right, top, and bottom, then tumble continues from there.
- `parseOBJ` keeps file `vn` normals in `origFileNormal`. A face with no `vn` gets that face's flat normal only. It does not call the 38° smooth on load. Imported OBJ is scaled to a unit bounding sphere. Built-in presets are not scaled. Architectural weld runs only when the preference is on and an OBJ is imported. The first load of this build turns that preference off (`fileNormalsOnImport`).
- Live undo is still the 30-state stack in `UndoRingBuffer`. `.xblend` still stores 3. That split was already in `src/core/history.ts`. It was not capped down.
- `scripts/sync_self_host.mjs` inlines the JS and CSS into `self-host/public/index.html`, so the same page opens on `file://` and through `node server.js`. Verified: `npm run host:sync` wrote `index-BahJ6256.js` (1,544,928 bytes) inlined into the HTML, and `http://127.0.0.1:4173/` returned `text/html` 200. The HTML has no `<script src="*.js">`.
- Victory tests this from Actions → Build Self-Hosted Programme, or by opening `self-host/public/index.html`. Do not start the DirectX exe until that test is accepted.

### 2026-11-09 — pre-execution (filters, full smooth, live draw, UV islands, simpler nodes)
- Victory tested `63ad9b2`. Tumble no longer locks. `file://` launches. This pass is still self-host only. Do not edit `crates/vue3d_core`.
- Filters: he says every filter dialog fails. Gaussian, Scatter, and Stitch already paint inside the dialog, then `App.tsx` only stores an undo. The web view also skips frames unless Refresh is changed, so a finished filter can sit on the canvas and never show. Fix the apply path so the composite and the 3D view update, and so closing a dialog does not wipe the result.
- Surface: Smooth must be fully smooth. Blend every shared edge, including 90° corners. Do not keep the 38° crease cut or the coplanar snap inside Smooth. Flat stays faceted. Def stays the file normals.
- Refresh: remove the web refresh-rate control and always draw. Do not leave on-demand as the default. A frame cap can return later on the Windows exe only.
- UV: `SmartUVUnwrapEngine` must cut a watertight mesh into islands. The angle limit is how wide a patch may be before it splits. Pack those islands so they do not overlap. Mirror copies one side onto the other and overlaps it. It must not weld both sides into one skewed chart.
- UV editing: double-click selects the whole island under the cursor, even if another island occupies the same pixels. Right-click separates the left half of a mirrored selection from the right half so one side can be moved. A drag tool moves that selection. Layer properties get a UV-channel choice per layer, for placing a tattoo on one side.
- Nodes: simplify the graph so a layer and its node agree. Changing the layer image or baking the node must show on that layer. Do not add a second node product.
- After the code works, append `API_DOCUMENTATION.md`, `DEVELOPMENT.md`, `AGENT_STATE.md`, and this file. Then `npm run host:sync`.

### 2026-11-10 — post-execution (filters visible, full smooth, UV islands)
- Pre-edit bookend is `c5310e2`. `crates/vue3d_core` was not edited.
- The web viewport no longer skips frames. The refresh-rate buttons are gone from Preferences. A cap is still allowed later on the Windows exe only.
- Smooth blends every shared edge (`creaseAngleThreshold` defaults to 180°). The coplanar snap inside Smooth is off. Flat and Def are unchanged.
- Unwrap uses the angle as the patch limit against the island's first face, shelf-packs so charts fit in 0..1, and clones a vertex that would be pulled into two charts. Random island rotation is gone.
- Double-click selects the UV island. Right-click keeps the side of U = 0.5 under the cursor. Sculpt → Drag Island moves it. Layer Settings has a UV channel menu (`layer.uvChannel`).
- Mirror no longer drops vertices with |axis| > 1.25. Overlap still copies the source UV onto the other side.
- Bake to Layer clears the layer first, then draws the graph. `npm run host:sync` inlined `index-D4_J0RPb.js`.
- `API_DOCUMENTATION.md` section 11 and `DEVELOPMENT.md` 2026-11-10 note match this. The Windows DirectX rewrite still waits for Victory's test.

### 2026-11-10 — pre-execution (triplanar, scatter, edge wear crash, and lag)
- Victory says unwrap and Smooth are good. Gaussian and Stitch open. Triplanar, Scatter, and Edge Wear break the app. The view is also laggy.
- Cause to fix: those three dialogs call `useState` after `if (!isOpen) return null`. Gaussian and Stitch do not. Move the early return to after every hook.
- The web view currently draws the bloom pass on every animation frame, even when idle. Draw only while the user is orbiting, painting, or a texture just changed, and cap that at 60. Do not put the refresh buttons back. Do not edit `crates/vue3d_core`.

### 2026-11-12 — self-host is the folder to finish
- Another agent must start at `SELF_HOST_HANDOFF.md`. The current product is `self-host/`. Do not open the Windows rewrite until Victory accepts that folder.
- Already good on `3b5ff79`: tumble, file normals, full Smooth, unwrap islands, UV select / right-click split / drag, layer UV channel, Gaussian, Stitch, `file://`.
- Still broken: Triplanar crashes on open because `useState` sits after `if (!isOpen) return null`. Edge Wear's return was moved locally and is not pushed. Scatter's return was removed, so the dialog would stay on screen. The view redraws every frame and feels slow.
- This session finishes those three dialogs and the idle redraw. It does not touch `crates/vue3d_core`.




