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


