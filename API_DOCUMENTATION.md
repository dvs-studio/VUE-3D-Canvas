# VUE 3D Canvas — Master API & Architectural Documentation

**Author / Creator:** Victory Ukpong  
**Version:** 1.5.0 Production  
**License:** Apache-2.0  
**Target Runtimes:** Windows Native Desktop (WebView2 / ANGLE DirectX 11 & Desktop OpenGL) & Self-Hosted Web Distribution

---

## Table of Contents
1. [Overview & Architectural Philosophy](#1-overview--architectural-philosophy)
2. [Viewport Architecture & 3D Render Pipeline](#2-viewport-architecture--3d-render-pipeline)
3. [Brush Engine & Stroke Dynamics](#3-brush-engine--stroke-dynamics)
4. [Layering System & Canonical Composite Pipeline](#4-layering-system--canonical-composite-pipeline)
5. [Filter Suite & Procedural Texture Generators](#5-filter-suite--procedural-texture-generators)
6. [Blender 2.8+ Node Graph System](#6-blender-28-node-graph-system)
7. [Texture Management & Multi-UV Channel Engine](#7-texture-management--multi-uv-channel-engine)
8. [Hardware Acceleration, ANGLE & DirectX 11 / OpenGL Bridging](#8-hardware-acceleration-angle--directx-11--opengl-bridging)
9. [Radial Interfaces: Lagoon & Circular Carousels](#9-radial-interfaces-lagoon--circular-carousels)
10. [Memory Footprint & `.xblend` Serialization](#10-memory-footprint--xblend-serialization)

---

## 1. Overview & Architectural Philosophy

VUE 3D Canvas is a non-raytraced, low-latency 3D texture painting and digital sculpting suite built on Vite, React 19, and Three.js WebGL. It operates under strict memory and hardware guarantees:
- **Low Memory Footprint:** Bounded at ~200MB active heap. No multi-gigabyte memory leaks.
- **Normalized 3-State History Ring Buffer:** In-memory and `.xblend` project serialization saves a maximum of 3 full-resolution layer snapshots to maintain rapid project saves and instant file transfer.
- **Hardware Agility via ANGLE:** WebGL reaches the GPU through Google ANGLE (Almost Native Graphics Engine), routing to **DirectX 11 (D3D11)** by default or **Desktop OpenGL** when invoked with `--opengl`.
- **Linked Assets by Default:** Imported 3D models (`.obj`, `.mtl`) are referenced as lightweight external paths, preventing file bloat while supporting embedded model pack serialization when requested.

### Current self-host corrections (2026-11-15)

These override older sentences in this file:

- The build to test is `self-host/public/index.html` (`index-DXhSIj8p.js`). `file://` works because the script is inlined. Judge filters on that page, not on the Vite dev server.
- Live undo is 30. Only the `.xblend` file stores 3. The "3-state in-memory history" line below is retired.
- Smooth blends every shared edge. The 38° crease and the coplanar snap are not the Smooth button. Flat stays faceted. Def restores file normals.
- Preferences has no refresh-rate control. The main view draws on the next frame when the camera, the brush, or the texture changes, and it sleeps when idle. Wheel, pinch, and gizmo zoom set that dirty flag.
- The canvas CSS stays 100% of its container. `ResizeObserver` updates the drawing buffer. `drawingRatio` caps that buffer near 1920×1080×1.25 and never above device pixel ratio 1.5.
- Triplanar, Scatter, and Edge Wear are `position: fixed` panels. They must not use a full-screen parent. Edge Wear is applied once, from `handleApplyEdgeWear`.
- During a stroke, mipmaps are off. They rebuild when the pen lifts.
- The Rust window only shows this page. It does not implement these APIs.

---

---

## 2. Viewport Architecture & 3D Render Pipeline

The application hosts two synchronized viewports:
- **3D Viewport (`src/renderer/Viewport3D.tsx`):** Orbiting perspective or orthographic rendering of the 3D geometry with real-time UV texture mapping, mesh topology inspection, surface normal tuning, and 3D direct-on-mesh brush stamping.
- **2D Viewport (`src/renderer/Viewport2D.tsx`):** Flat UV unwrap canvas enabling direct 2D bitmap painting, UV seam alignment, and UV channel texture rebaking.

### 2.1 Three.js Engine Setup
```typescript
const renderer = new THREE.WebGLRenderer({
  canvas: canvasRef.current,
  alpha: false,
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false,
  depth: true,
  preserveDrawingBuffer: true,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

### 2.2 Anisotropic Texture Filtering
Dynamic canvas textures generated during real-time painting are bound with maximum hardware anisotropy to eliminate blur and shimmering at oblique viewing angles:
```typescript
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
canvasTexture.anisotropy = maxAnisotropy; // Typically 16x on modern GPUs
canvasTexture.generateMipmaps = true;
canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
canvasTexture.magFilter = THREE.LinearFilter;
```

### 2.3 Crease-Angle-Aware Normal Calculation
Standard Three.js `computeVertexNormals()` rounds off sharp 90° architectural edges into melted blobs. `SurfaceShadingEngine.computeSmoothNormals` implements a crease-angle threshold (default 38°):
- Faces sharing a dihedral angle below 38° share averaged smooth normals.
- Edges exceeding 38° retain sharp, split vertex normals, preserving architectural bevels, wall corners, and mechanical chamfers.
- **Pristine Normal Storage:** Imported `vn` normals from OBJ files are preserved in `origFileNormal` buffer attribute, allowing instant lossless switching between:
  - `default`: Original file normals.
  - `smooth`: Angle-weighted curvature normals.
  - `flat`: Face facet normals with `material.flatShading = true`.

### 2.4 Camera Viewpoint Snapping
Camera orientations snap instantly via the **View** dropdown menu, Numpad keys, or the Lagoon Radial puck:
- `front` (`Num 1`): $\theta = 0, \phi = \pi/2$
- `back` (`Ctrl + Num 1`): $\theta = \pi, \phi = \pi/2$
- `right` (`Num 3`): $\theta = \pi/2, \phi = \pi/2$
- `left` (`Ctrl + Num 3`): $\theta = -\pi/2, \phi = \pi/2$
- `top` (`Num 7`): $\theta = 0, \phi = 0.001$
- `bottom` (`Ctrl + Num 7`): $\theta = 0, \phi = \pi - 0.001$
- `ortho/persp` (`Num 5`): Toggles `THREE.PerspectiveCamera` and `THREE.OrthographicCamera`.
- `frame/auto-fit` (`Num .`): Computes mesh bounding sphere and calculates exact camera distance:
  $$\text{distance} = \frac{\text{boundingRadius}}{\sin(\text{fov} / 2)} \times 1.2$$

### 2.5 Viewport Refresh Rate Engine
Located in `PreferencesModal.tsx` and executed in `Viewport3D.tsx`:
- `on-demand`: Renders only when user paints, orbits camera, or changes settings (saves battery and GPU thermal headroom).
- `30fps`: Locks frame interval to $33.3\text{ ms}$.
- `60fps`: Standard VSync rendering at $16.6\text{ ms}$.
- `120fps`: High-refresh rate displays at $8.33\text{ ms}$.
- `custom`: User-typed frequency (15 Hz to 240 Hz).
- `uncapped`: Completely removes frame interval capping, driving the GPU at maximum allowable throughput.

---

## 3. Brush Engine & Stroke Dynamics

Located in `src/tools/brushEngine.ts`, the brush engine translates 2D pointer coordinates and 3D raycast hit coordinates into dab stamps on the active layer's offscreen HTML5 canvas.

### 3.1 Lazy-Mouse Stabilizer
To prevent jitter and produce smooth calligraphic arcs:
$$\vec{P}_{\text{stabilized}} = \vec{P}_{\text{old}} + (\vec{P}_{\text{cursor}} - \vec{P}_{\text{old}}) \times (1.0 - \text{weight})$$
- Weight ranges from $0$ (raw cursor input) to $0.95$ (heavy fluid drag).
- Stabilizer renders an elastic guide leash connecting the cursor to the lagged brush dab.

### 3.2 Stroke Application Modes
1. **Space:** Discrete circular dabs placed along the path spaced by $\text{spacing} \times \text{size}$.
2. **Airbrush:** Continuous accumulation of paint at fixed time intervals ($20\text{ ms}$) while pointer is held down.
3. **Dot:** Independent single-click stamps without continuous interpolation.
4. **Dragged-Dot:** Single stamp dragged dynamically from pointer down to pointer up, adjusting orientation and radius interactively.
5. **Curve:** Evaluates Catmull-Rom or Bezier spline nodes across mouse anchor points before committing dabs.

### 3.3 High-Performance Paint Loop
To eliminate drawing stutter on high-density strokes:
- During active stroke (`pointerdown` $\to$ `pointermove`): Dabs are written directly to the active layer's canvas, then immediately blitted to the canonical `compositeCanvas`. WebGL texture `needsUpdate = true` is notified via `requestAnimationFrame`.
- On `pointerup`: Full multi-layer blend recompositing, mipmap recalculation, and 3-state history snapshots commit asynchronously without interrupting the 60–120 FPS stroke.

---

## 4. Layering System & Canonical Composite Pipeline

Located in `src/core/types.ts` and managed in `src/App.tsx`.

### 4.1 Layer Data Structure
```typescript
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;          // 0 to 100
  blendMode: BlendMode;     // 'normal', 'multiply', 'screen', 'overlay', etc.
  locked: boolean;
  canvas: HTMLCanvasElement; // Dedicated offscreen 1024x1024 (or 2048x2048) canvas
  ctx: CanvasRenderingContext2D;
  channel: 'color' | 'height' | 'normal' | 'roughness' | 'metallic' | 'emission' | 'mask';
  isFillLayer?: boolean;
  fillConfig?: TextureFillConfig;
}
```

### 4.2 Canonical Composite Canvas
- A single canonical `compositeCanvas` (1024x1024) is maintained at the application root.
- Both `Viewport3D` (Three.js `CanvasTexture`) and `NavigatorPanel` bind directly to this canvas reference.
- Layer compositing uses HTML5 Canvas `globalCompositeOperation`:
  - `normal` $\to$ `'source-over'`
  - `multiply` $\to$ `'multiply'`
  - `screen` $\to$ `'screen'`
  - `overlay` $\to$ `'overlay'`
  - `darken` $\to$ `'darken'`
  - `lighten` $\to$ `'lighten'`
  - `color-dodge` $\to$ `'color-dodge'`
  - `color-burn` $\to$ `'color-burn'`
  - `hard-light` $\to$ `'hard-light'`
  - `soft-light` $\to$ `'soft-light'`
  - `difference` $\to$ `'difference'`
  - `exclusion` $\to$ `'exclusion'`

### 4.3 Procedural Texture Fill Layers
- Fill layers evaluate procedural noise or box-projected image fills dynamically.
- Identified by the `[FILL]` badge in `LayersPanel`.
- Can be rasterized into regular paint pixels via **Bake to Layer**, preparing the layer for Bump/Normal conversion.

---

## 5. Filter Suite & Procedural Texture Generators

All filters operate in non-blocking, draggable floating windows without backdrop blur, allowing continuous visual feedback on the 3D viewport while tuning parameters.

### 5.1 Triplanar Box Mapping (`src/tools/fillSuite.ts`)
Projects textures across XYZ coordinates without requiring 2D UV maps:
- Evaluates projections along $YZ$ (Side), $XZ$ (Top/Bottom), and $XY$ (Front/Back) planes.
- Blends based on normal orientation with adjustable sharpness power:
  $$W_x = |N_x|^p, \quad W_y = |N_y|^p, \quad W_z = |N_z|^p$$
  $$\text{Normalized } W = \frac{W_i}{W_x + W_y + W_z}$$
- Supports altitude slope masking and height-aware contrast blending.

### 5.2 Separable Gaussian Blur (`src/tools/gaussianBlur.ts`)
- Two-pass 1D convolution (horizontal pass followed by vertical pass), reducing time complexity from $O(R^2)$ to $O(2R)$.
- Operates with premultiplied alpha to prevent dark edge fringing on transparent decals.
- Presets: Fast (1-pass), Quality (2-pass), Ultra (3-pass recursive approximation).

### 5.3 Stochastic Scatter Engine (`src/tools/stochasticScatter.ts`)
- Scatters stamp brush shapes across the target layer using a deterministic PRNG seed.
- Controls: Stamp size (8px–512px), Size jitter (0%–100%), Angle jitter, Density, Opacity jitter, and Scatter radius.

### 5.4 Edge Wear & Ambient Occlusion Curvature (`src/tools/edgeWearFilter.ts`)
- Evaluates mesh topology vertex adjacency to calculate surface curvature.
- Distinguishes convex edges (worn highlights, paint peeling) from concave crevices (dirt/grime accumulation).
- Blends procedural grunge masks into the selected layer with live preview.

### 5.5 Jenny Stitch Studio (`src/tools/stitchStudio.ts`)
- Follows mesh UV topology boundaries and polygon edges to lay down realistic decorative embroidery, baseball stitches, and leather seams.
- Generates displacement height profiles and normal map bevels with thread color customization.

---

## 6. Blender 2.8+ Node Graph System

Located in `src/nodes/` and `src/ui/panels/NodeGraphPanel.tsx`.

### 6.1 Evaluator Architecture
Provides a visual node graph matching Blender 2.83 LTS shader graphs:
- **Supported Nodes:**
  - `Principled BSDF`: Base Color, Metallic, Roughness, Specular, Normal, Emission.
  - `Image Texture`: Color map, linear/sRGB sampling.
  - `Bump / Normal Map`: Height-to-normal conversion, strength multiplier.
  - `Color Ramp`: Multi-stop gradient evaluation.
  - `Separate / Combine RGB`: Channel splitting and recombination.
  - `Mix RGB`: Mix, Multiply, Screen, Add, Overlay operations with factor input.
  - `Math`: Add, Subtract, Multiply, Divide, Power, Greater Than, Less Than.
  - `Value / RGB`: Constant parameter outputs.
  - `Material Output`: Final surface hook.

### 6.2 Node Tree Baking
Clicking **Bake to Layer** evaluates the active node tree across all 1024x1024 pixels and writes the output directly to the selected painting layer.

### 6.3 Python Add-on Export
Exports a native `.py` script that reconstructs the exact node tree inside Blender 2.80–4.x using Blender's Python API (`bpy.data.materials`).

---

## 7. Texture Management & Multi-UV Channel Engine

### 7.1 Companion Texture Folder Auto-Matching
In `ProjectSettingsModal.tsx`, users can drop an entire folder of extracted companion textures. The parser inspects filenames:
- Diffuse / Albedo: `*diff*`, `*albedo*`, `*col*`, `*basecolor*`
- Normal: `*nor*`, `*normal*`, `*nrm*`
- Bump / Height: `*bump*`, `*height*`, `*disp*`
- Roughness: `*rough*`, `*rgh*`, `*gloss*`
- Emission: `*emit*`, `*emissive*`, `*light*`
- Ambient Occlusion: `*ao*`, `*occlusion*`

Clicking `[⚡ Auto-Texture Model & Replace Layers]` converts these files into individual Photoshop CS5 layers mapped to appropriate PBR channels.

### 7.2 Multi-UV Channel Support (`src/tools/uvChannelManager.ts`)
- Stores up to 4 concurrent UV channels on the Three.js geometry:
  - `uv_original`: Default channel from imported OBJ.
  - `uv_lightmap`: Secondary unwrapped channel for lightmaps.
  - `uv_projected`: Planar/cylindrical projection coordinates.
- **Re-Bake Engine:** Re-samples texture maps between UV channels using inverse barycentric coordinate mapping.

---

## 8. Hardware Acceleration, ANGLE & DirectX 11 / OpenGL Bridging

### 8.1 Architecture Diagram
```
+-------------------------------------------------------------+
|                     VUE 3D Canvas (UI)                      |
|                  Vite + React 19 + Three.js                 |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      WebGL 2.0 / 1.0                        |
+-------------------------------------------------------------+
                              |
            +-----------------+-----------------+
            | (Windows Default)                 | (--opengl flag)
            v                                   v
+-----------------------+           +-----------------------+
|  Google ANGLE D3D11   |           |  Desktop OpenGL 2.0+  |
|  (DirectX 11 Driver)  |           |     (Core Profile)    |
+-----------------------+           +-----------------------+
            |                                   |
            v                                   v
+-----------------------+           +-----------------------+
|    Hardware GPU       |           |    Hardware GPU       |
|  (NVIDIA/AMD/Intel)   |           |  (NVIDIA/AMD/Intel)   |
+-----------------------+           +-----------------------+
```

### 8.2 Windows Native Host (`crates/vue3d_core/`)
- Native Windows packaging uses Microsoft WebView2.
- The entry process sets `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` before initializing the window:
  - **DirectX 11 (Default):**
    `--use-angle=d3d11 --enable-gpu-rasterization --enable-zero-copy`
  - **Desktop OpenGL (`--opengl`):**
    `--use-angle=gl --disable-features=UseSkiaRenderer`
  - **Modern Auto-Detect (`--modern`):**
    `--use-angle=d3d11 --enable-features=Vulkan,DefaultANGLEVulkan`
- Switching backend in the UI writes `gpu-backend.txt` next to `vue_3d_canvas.exe` and restarts the process.

---

## 9. Radial Interfaces: Lagoon & Circular Carousels

### 9.1 Autodesk Sketchbook / Maya Lagoon Mode
- **Activation:**
  - Header button immediately before `Projection [F8]`.
  - Global keyboard shortcut: `Tab`.
- **Behavior:**
  - Collapses top options bar and left tool palette into an expansive drawing viewport.
  - Preserves the interactive 3D Orientation Gizmo and right-side Docker / N-Panel.
  - Spawns the floating, draggable Lagoon puck (`LagoonMenu.tsx`) with 6 radial wings:
    1. **Tools:** Brush, Eraser, Blur, Smudge, Clone, Bucket, Eyedropper, Marquee.
    2. **Brush Dynamics:** Size slider, Opacity slider, Hardness slider, Stroke application modes.
    3. **Colors:** Primary/Secondary swap, Quick palette swatches, Color picker.
    4. **Layers:** Add layer, Select layer, Toggle visibility.
    5. **Views:** Front, Back, Right, Left, Top, Bottom, Ortho/Persp toggle.
    6. **Project:** Save `.xblend`, Export OBJ, Projection snapshot, Undo, Redo.

---

## 10. Memory Footprint & `.xblend` Serialization

- **Specification:** Fully documented in `XBLEND_FORMAT_SPECIFICATION.md`.
- **Ring Buffer Undo:** Bounded at 3 states. When state 4 is added, state 1 is recycled.
- **WASM Memory Engine:** `src/core/wasmMemoryEngine.ts` monitors active canvas pixel buffers and explicitly terminates dead context allocations, guaranteeing zero memory creep over long painting sessions.

## 11. 2026-11-10 — Smooth, live draw, UV islands, filters, nodes

- **Smooth** (`SurfaceShadingEngine.computeSmoothNormals`) blends every shared edge. The 38° crease cut and the coplanar snap are not used for the Smooth button. Flat stays faceted. Def stays the file normals.
- **Web viewport** draws every frame. Preferences no longer offers a refresh cap. That cap froze the view, so filter and paint updates did not appear.
- **Filters** still run inside their dialogs (Gaussian, Scatter, Stitch, Triplanar, Edge Wear). Closing after Apply must keep the pixels. The 3D view updates because it no longer skips frames.
- **Smart unwrap** (`SmartUVUnwrapEngine.unwrapGeometry`) cuts a chart when the surface turns past the angle limit, measured from the island's first face. Islands are shelf-packed into 0..1. A vertex shared by two charts is cloned so one chart cannot pull the other.
- **UV edit:** double-click selects the island under the cursor (`pickIsland`). Right-click keeps only the side of U = 0.5 under the cursor (`keepSide`). Sculpt mode **Drag Island** moves that selection (`moveUVs`).
- **Mirror** copies the opposite side onto the same UV and overlaps it. It no longer refuses vertices outside |axis| > 1.25.
- **Layer Settings** stores `layer.uvChannel` and switches the mesh to that channel. **Bake to Layer** clears the active layer, then draws the node graph into it.

## 12. 2026-11-12 — Filter dialogs and the redraw

- Triplanar, Stochastic Scatter, and Edge Wear must not call `useState` or `useRef` after `if (!isOpen) return null`. That throw unmounted the painter. Gaussian and Stitch already followed this order.
- Scatter `numberOfRepeats` is clamped to 0..300.
- The web viewport redraws when the camera is moving, a stroke is down, or `textureVersion` changes. It does not redraw faster than 60, and it does not redraw while idle. There is still no refresh-rate control in Preferences.

## 13. 2026-11-13 — Where a filter is allowed to fail

- A filter dialog that opens under `vite` can still blank `self-host/public/index.html`. Judge Triplanar, Scatter, and Edge Wear on that file, opened with `file://` or `self-host/server.js`.
- Those three filters are JavaScript in the painter page (`src/ui/*Dialog.tsx` and `src/tools/`). `crates/vue3d_core` only hosts the page. It does not run the filter.

## 14. 2026-11-14 — Filter panels must not cover the view

- Triplanar, Scatter, and Edge Wear are `position: fixed` panels. They must not use a `fixed inset-0` parent or `translate3d`. That parent was the leftover of removing the backdrop blur, and it covered the WebGL canvas.
- Edge Wear is applied only from `handleApplyEdgeWear`. The dialog does not call `EdgeWearEngine` itself.
- Bundle to test: `index-D2VONoEr.js` inside `self-host/public/index.html`.

## 15. 2026-11-14 — View redraw and resize (planned)

- Wheel, pinch, and gizmo zoom must set the viewport dirty flag. The navigator already draws every frame, which is why only the main view waits for a pan.
- The canvas buffer follows the container size (`ResizeObserver` plus orientation change). CSS size stays 100% of the container. A tablet rotation must not leave a dead strip.
- Idle frames stay skipped. Navigation and painting draw every frame. Mipmaps are rebuilt when the stroke ends, not on each dab.
- While a task has uncommitted changes, push to `main` about every 4 minutes. Do not push an empty commit.

## 16. 2026-11-14 — View redraw and resize

- `handleWheel`, pinch, `handleZoomDelta`, `handlePanDelta`, reset, and frame set `needsRenderRef`. The main view draws on the next animation frame. Idle frames are still skipped.
- `drawingRatio` caps the buffer near 1920×1080×1.25 and never above device pixel ratio 1.5. `setSize(w, h, false)` leaves the canvas CSS at 100% of the container. `ResizeObserver` plus orientation and `visualViewport` call that fit.
- During a stroke `generateMipmaps` is false and `minFilter` is `LinearFilter`. Pointer-up restores `LinearMipmapLinearFilter` and rebuilds the chain once.
- Bundle: `index-DXhSIj8p.js`.







## 13. Historical design snapshot — toggle layers (superseded)

The following bullets preserve the earlier design brief. They are not a statement of current implementation status; the live per-layer PBR implementation is described in section 17 and `self-host/README.md`.

- A painted layer has three switches and an influence each: colour and reflection, bloom and emission, bump and displacement.
- Bump maps luminance through a ramp, then all bump layers add into one height image.
- Emission layers add into one glow image. Bloom reads that image once.
- Colour layers stack as they do now. Reflection becomes roughness (`1 - strength`) on the existing standard material.
- A Normal conversion is the only tangent-space normal. Other normals are built from the combined height.
- Right-click on a layer exports that layer's displacement, emission, or colour plus reflection.
- Triplanar rows preview the picked image. With no image, the row is `rgba`, `hsla`, or `#hex`, and the alpha is separate from the colour.
- Themes recolour the whole window. The node panel is not part of the interface.



The node panel is removed. A UV dock in that slot says Coming soon. Import Texture remains and sets the switches from the chosen role. Edit menu undo labels are Undo, Redo, and Undo & Redo Settings.


A Subdivision dock is specified and not built. It previews Catmull-Clark or Simple subdivision in the 3D view, keeps edges sharper than an angle, and offsets the preview by the combined height. The stored mesh is unchanged.


## 17. 2026-11-19 — self-host export, UV and workspace task

The following behaviours are implemented in the current self-host source revision `5ec840915c3812eacb68f1577659c1ab6b8509e2`:

- **Export-only map package modes:** Classic writes individual selected maps; RGB+ORM writes an ORM texture with R=height-derived AO approximation, G=roughness, B=metallic; AO×Albedo writes an AO-multiplied colour map and its AO map. These modes affect downloaded image maps, not the model-file format. The AO generator samples local height differences to approximate cavities. It is not ray-traced AO or mesh-space ambient occlusion.
- **Smart UV:** `SmartUVOptions.randomRotation` enables deterministic 0/90/180/270-degree island rotation driven by the layout seed. Same geometry and seed reproduce the same quarter-turn choices.
- **Per-layer UV:** switching away from a layer stores its active UV channel; selecting a layer restores its assigned channel (or Original UV when unset). Changing a layer's UV assignment updates the active geometry only when that layer is selected. UV channel changes refresh the geometry/render path.
- **Seamless UV gutter:** the UV Channels panel can dilate the active layer's texture edge colours into transparent pixels (0–16 px). This is a texture-pixel gutter operation; it does not edit UV coordinates.
- **Bump / displacement Levels:** both conversions use the same grayscale Levels controls (input black/white, gamma, output black/white), preserving source alpha before setting the requested PBR channel.
- **Workspace:** the desktop Tool Options bar is horizontally scrollable; Preferences stores an overall UI scale from 75.0% to 125.0% in 0.1% increments.
- **Mountain gizmo:** Preferences imports, replaces or clears a custom binary GLB. Data is stored in IndexedDB on the current browser origin and reloaded by the gizmo. It is not cross-device sync and is not embedded into `.xblend` projects.
- **Layer multi-select:** Merge combines visible, unlocked selected pixel layers only when their texture channel and PBR settings match; the merged layer occupies the original stack position. Move-to-Group assigns selected unlocked pixel layers to an existing group. Both operations are undo-checkpointed.

**Package verification:** workflow run #156 / ID `44480073408` passed install, production build, `npm run host:sync`, blank-package checks, generated-output commit, ZIP packaging and upload. Source commit `5ec840915c3812eacb68f1577659c1ab6b8509e2`; generated self-host commit `c26301294da0465d5402b6800fbd15dab39cae59`; artifact `14508410797` (1,076,269 bytes). [Open the self-host artifact](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44480073408/artifacts/14508410797).

CI is compile/package verification only. Manual checks remain for actual browser/Android behaviour, visual map correctness, AO quality and 4K processing time, UV switching/rebake/seams, Levels undo, Mountain IndexedDB persistence, layer merge ordering/undo, group movement and decimal UI scaling.


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
