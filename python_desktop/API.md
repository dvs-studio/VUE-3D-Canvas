# API.md - Python Desktop Module Documentation

**Project:** VUE 3D Canvas (Python Desktop Edition)  
**Author:** Victory Ukpong  

---

## 1. Core Modules

### `vue3d.core.undo.UndoRingBuffer`
Manages history state snapshots for live session editing and `.xblend` project export.
- `push_state(description: str, layers: List[Layer])`: Captures layer pixel buffers into a snapshot. Truncates redo branch if state branched.
- `undo(layers: List[Layer]) -> bool`: Restores the previous single snapshot (`Ctrl+Z`).
- `redo(layers: List[Layer]) -> bool`: Restores the next single snapshot (`Ctrl+Y`).
- `get_xblend_save_states() -> List[Dict]`: Strictly extracts at most **3 snapshots** for writing into `.xblend`.

### `vue3d.core.xblend.XBlendManager`
- `save(filepath: str, layers: List[Layer], undo_buffer: UndoRingBuffer, model_name: str, theme: ThemeMode) -> bool`:
  Writes `.xblend` JSON file containing metadata, linked 3D asset reference, 3-state undo ring buffer, and base64 layer payloads.
- `load(filepath: str) -> Optional[Dict]`:
  Reads and parses an existing `.xblend` project file.

---

## 2. Renderer & Navigation Modules

### `vue3d.renderer.viewport_3d.Viewport3DNavigation`
- `orbit(cam: Camera, dx: float, dy: float)`:
  Updates `cam.theta` and `cam.phi` without polar clamping freeze, allowing smooth continuous tumbling.
- `pan(cam: Camera, dx: float, dy: float)`:
  Calculates local right and up camera vectors:
  $$\vec{R} = (\cos\theta, 0, -\sin\theta), \quad \vec{U} = (-\cos\phi\sin\theta, \sin\phi, -\cos\phi\cos\theta)$$
  Translates `cam.target` strictly along screen plane.
- `drone_fly(cam: Camera, forward: float, right: float, up: float, speed: float)`:
  Translates `cam.target` in 3D space according to `WASD` (forward/back, left/right) and `QE` (elevation).
- `zoom(cam: Camera, delta: float)`:
  Smooth exponential zoom with bounds clamp.

### `vue3d.renderer.surface_shading.SurfaceShadingEngine`
- `compute_normals(vertices: np.ndarray, faces: np.ndarray, mode: ShadingMode) -> np.ndarray`:
  Recalculates normals:
  - `ShadingMode.DEF`: Original vertex normals.
  - `ShadingMode.SMOOTH`: Angle-weighted shared vertex normals.
  - `ShadingMode.FLAT`: Per-face faceted polygon normals.

---

## 3. Tool & Brush Modules

### `vue3d.tools.brush_engine.BrushEngine`
- `paint_stroke(layer: Layer, brush: BrushPreset, to_x: float, to_y: float, is_eraser: bool)`:
  Applies stabilizer lazy-mouse tether, interpolates dabs, evaluates tip masks (`grunge`, `splat`, `scratch`, `dots`, `cracks`), and blends pixels into the target layer.
- `apply_smudge(layer: Layer, brush: BrushPreset, from_x: float, from_y: float, to_x: float, to_y: float)`:
  Picks up local pixels from `(from_x, from_y)` and pushes them to `(to_x, to_y)` modulated by the active tip mask texture.

---

## 4. UI Module

### `vue3d.ui.desktop_gui.Vue3DDesktopGUI`
Native Windows GUI window built with `tkinter`, running directly on desktop without requiring WebGL, node, or a web browser.
- Photoshop CS5 Dark palette styling (`#333333`, `#2b2b2b`, `#3c3c3c`).
- Top options bar with embedded presets dropdown.
- Left CS5 toolbox.
- Right dockers for layers and 3D model geometry selection.
- Center 3D viewport canvas with live Blender drone navigation.
