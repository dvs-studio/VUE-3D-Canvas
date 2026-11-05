# Implementation Plan: Lagoon Radial Menu, Camera Viewpoints Fix, System API Documentation & Architecture Handover

## 1. Overview of Scope & Objectives
The user requested:
1. **Autodesk Sketchbook / Maya Lagoon Radial Interface**:
   - A dedicated toggle trigger positioned in the top menu bar immediately before the `Projection [F8]` button.
   - When engaged, the lagoon covers the workspace (collapsing the top options bar and left toolbox into an expansive drawing canvas, while preserving the 3D orientation gizmo and dockable side panel / N-Panel).
   - Radial wings/petals offering quick-flick access to Tools (Brush, Eraser, Blur, Smudge, Clone, Stamp), Brush Dynamics (Size, Opac, Mode, Space), Layer controls, Color swatch/wheel, Viewpoints, and Project operations.
   - Dual-mode gesture support: toggleable via the header button, keyboard shortcut (`~` or `Tab`), and right-click canvas gesture.
2. **Fix Camera Viewpoint Navigation in the View Menu**:
   - In `PhotoshopMenuBar.tsx`, connect the camera alignment entries:
     - **Front View** (`Numpad 1`)
     - **Back View** (`Ctrl + Numpad 1`)
     - **Right View** (`Numpad 3`)
     - **Left View** (`Ctrl + Numpad 3`)
     - **Top View** (`Numpad 7`)
     - **Bottom View** (`Ctrl + Numpad 7`)
     - **Toggle Orthographic / Perspective** (`Numpad 5`)
   - Ensure the numpad event router in `App.tsx` and the View Menu actions properly rotate the Three.js spherical camera angles ($\theta, \phi$) in `Viewport3D.tsx` and re-render the view instantly.
3. **Preferences: "Disable Refresh Rate / Uncapped" Option**:
   - Add an explicit **Uncapped / Max FPS (Disable Refresh Rate Cap)** setting in `PreferencesModal.tsx` alongside On-Demand, 30 FPS, 60 FPS, 120 FPS, and Custom VSync.
4. **Comprehensive `API_DOCUMENTATION.md`**:
   - A unified reference documenting:
     - **Viewport Engine**: Three.js WebGL pipeline, camera projections (Perspective, Quad, Ortho), raycasting UV unwrapping, 16x anisotropic filtering, normal generation, and bloom passes.
     - **Brush Engine**: Stabilizer lazy-mouse, stroke modes (Space, Airbrush, Dot, Dragged-Dot, Curve), stencils, pattern maps, pressure dynamics.
     - **Layering System**: 1024×1024 PBR channels (Color, Bump/Height, Normal, Emissive, Roughness, Metallic), blend modes, clipping masks, and live composite canvas sync.
     - **Filters & Procedurals**: Triplanar box-mapping with XYZ projection, Gaussian blur with separable kernel, Stochastic scatter, Edge wear & ambient occlusion, Jenny Stitch studio.
     - **Shader Node System**: Blender 2.8+ node graph evaluator, shader serialization, and PBR channel bridging.
     - **Texture System & Hardware Acceleration**: WebGL $\to$ ANGLE $\to$ DirectX 11 (default) and Desktop OpenGL counterpart, GPU flags, and native bridging.
5. **`DEVELOPMENT.md` Architecture & Genesis Guide**:
   - Historical lineage: How the Rust desktop application (`crates/vue3d_core`) with WebView2 native windowing and the standalone self-hosted package (`self-host/`) came to be.
   - Core constraints: Strict 3-state `.xblend` ring buffer, low memory footprint, linked 3D assets, ANGLE GPU arguments, and single Windows executable delivery.
   - Handover directives for subsequent AI engineering systems.
6. **`AGENTS.md` and `AGENT_STATE.md` Updates**:
   - Append newly verified capabilities.
   - Point to all project markdown documents (`API_DOCUMENTATION.md`, `DEVELOPMENT.md`, `AGENT_STATE.md`, `HANDOFF_PROMPT.md`).

---

## 2. User Review & Decision Points
From clarifying questions:
- **Lagoon Position & Scope**: Toggle switch is located right before `Projection [F8]` button in the top menu bar. The Lagoon covers the workspace except for the 3D gizmo and the side panel/N-Panel.
- **Lagoon Interaction**: Combines full canvas mode with radial wings and right-click / shortcut gestures.
- **Camera Viewpoints**: Fixing the existing View Menu items (Front, Back, Right, Left, Top, Bottom) so they actively orient the 3D camera.
- **Refresh Rate**: Add a dedicated option in Preferences to disable refresh rate throttling (Uncapped).

---

## 3. Step-by-Step Implementation Plan

### Step 1: Fix Camera Viewpoint Actions in View Menu and Viewport3D
1. In `src/renderer/Viewport3D.tsx`:
   - Expose an imperative handler or listener for `onNumpadKey(key, ctrl)`:
     - `'1'` without Ctrl: Front view ($\phi = \pi / 2, \theta = 0$)
     - `'1'` with Ctrl: Back view ($\phi = \pi / 2, \theta = \pi$)
     - `'3'` without Ctrl: Right view ($\phi = \pi / 2, \theta = \pi / 2$)
     - `'3'` with Ctrl: Left view ($\phi = \pi / 2, \theta = -\pi / 2$)
     - `'7'` without Ctrl: Top view ($\phi = 0.001, \theta = 0$)
     - `'7'` with Ctrl: Bottom view ($\phi = \pi - 0.001, \theta = 0$)
     - `'5'`: Toggle Orthographic / Perspective projection
   - Set `needsRenderRef.current = true` and update camera orbit angles smoothly.
2. In `src/ui/PhotoshopMenuBar.tsx`:
   - Under the **View** menu, add a **Camera Viewpoints (Numpad)** submenu:
     - Front View (`Num 1`), Back View (`Ctrl+Num 1`)
     - Right View (`Num 3`), Left View (`Ctrl+Num 3`)
     - Top View (`Num 7`), Bottom View (`Ctrl+Num 7`)
     - Perspective / Ortho View (`Num 5`)
   - Wire each button to call `onNumpadKey(key, ctrl)`.

### Step 2: Add "Disable Refresh Rate / Uncapped" to Preferences
1. In `src/core/types.ts`:
   - Update `RefreshRateMode = 'on_demand' | '30' | '60' | '120' | 'custom' | 'uncapped'`.
2. In `src/ui/PreferencesModal.tsx`:
   - Add a 6th button: **Uncapped / Off** (`'uncapped'` - disables all frame throttling).
3. In `src/renderer/Viewport3D.tsx`:
   - When `mode === 'uncapped'`, bypass timestamp delta throttling completely (`requestAnimationFrame` runs at full display rate without cap).

### Step 3: Implement the Lagoon Radial Menu Suite
1. Create `src/ui/LagoonMenu.tsx`:
   - Designed after the classic Autodesk Sketchbook / Maya Lagoon interface.
   - Sleek radial puck located at bottom-left (or floating), fanning out 6 radial petals/wings:
     - **Tools Wing**: Brush, Eraser, Blur, Smudge, Clone, Pen, Bucket
     - **Brush Wing**: Size, Opacity, Stroke Mode, Spacing, Stabilizer
     - **Layers Wing**: New Layer, Duplicate, Clear, Blend Mode, Invert, Solo
     - **Colors Wing**: Primary/Secondary swap, quick palette ring, Eyedropper
     - **Views Wing**: Front, Back, Right, Left, Top, Bottom, Quad, Perspective/Ortho, Frame Model
     - **Project Wing**: Save (.xblend), Export OBJ, Export Zip, Undo, Redo, Projection F8
   - Features radial hover highlighting, gesture trail, and subtle CS5 dark styling (`#222222` to `#333333` with `#3d7fb8` and `#fab387` accents).
2. In `src/ui/PhotoshopMenuBar.tsx`:
   - Add the **Lagoon Mode** toggle button immediately before `Projection [F8]` with an iconic curved lagoon icon.
3. In `src/App.tsx`:
   - Manage `isLagoonActive` state.
   - When active, hide the top options bar and left column tool box while keeping the 3D orientation gizmo and right dockers/N-Panel visible, displaying the Lagoon menu hub.
   - Support `Tab` key and right-click long-press to open/close the Lagoon.

### Step 4: Author `API_DOCUMENTATION.md`
Create a master technical reference at `/API_DOCUMENTATION.md` containing:
- Architecture Overview & GPU Bridging (WebGL $\leftrightarrow$ ANGLE DirectX 11 / OpenGL)
- Viewport Engine Architecture (Three.js WebGL setup, camera matrix math, UV coordinates, anisotropic filtering)
- Brush Engine Architecture (Dab stamping, spacing, stabilizer lazy-mouse, stroke modes, stencils)
- Layering & PBR Composite Pipeline (1024×1024 canvases, channels, blending equations, live composite canvas sync)
- Filter Suite Specification (Triplanar XYZ box filter, Gaussian blur separable pass, Stochastic scatter, Edge wear AO)
- Procedural Node Graph Architecture (Blender 2.8+ node evaluator, socket types, material bridging)
- Memory Management & Performance Constraints (Buffer re-use, RAF throttling, single Windows executable packaging)

### Step 5: Author `DEVELOPMENT.md`
Create `/DEVELOPMENT.md` detailing:
- The dual-target architecture: Native Windows window (`crates/vue3d_core`) and Self-Hosted web distribution (`self-host/`).
- Evolution timeline and genesis of all modules.
- ANGLE DirectX 11 vs OpenGL launch switches (`--opengl`, `--modern`).
- Handover instructions for subsequent AI models.

### Step 6: Update `AGENTS.md` and `AGENT_STATE.md`
- Append the post-execution ledger entries for this session.
- Add an index table pointing to all project documentation files (`API_DOCUMENTATION.md`, `DEVELOPMENT.md`, `HANDOFF_PROMPT.md`, `AGENT_STATE.md`).

### Step 7: Build & Host Synchronization Verification
- Run `compile_applet` and `lint_applet` to guarantee 0 errors.
- Run `npm run host:sync` to rebuild and synchronize `/self-host/public`.
