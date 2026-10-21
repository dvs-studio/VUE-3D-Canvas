# API.md - Native C Interface Documentation

**Project:** VUE 3D Canvas (Native C Edition)  
**Author:** Victory Ukpong  

---

## 1. Core Lifecycle Functions

### `V3D_AppContext* v3d_create_context(int tex_width, int tex_height)`
Allocates and initializes the application state, layer array, default brush ("Hard Round Pen"), camera at radius 4.8, and undo ring buffer.
- **Parameters:**
  - `tex_width`: Texture canvas width in pixels (e.g. 1024).
  - `tex_height`: Texture canvas height in pixels (e.g. 1024).
- **Returns:** Pointer to initialized `V3D_AppContext`, or `NULL` on out-of-memory.

### `void v3d_destroy_context(V3D_AppContext* ctx)`
Frees all layers, composite buffer, undo snapshots, and context memory.

### `void v3d_composite_layers(V3D_AppContext* ctx)`
Blends all visible layers bottom-to-top into the canonical composite canvas (`ctx->composite_pixels`) and sets `ctx->texture_needs_update = true`.

---

## 2. Brush & Tool Functions

### `void v3d_brush_begin_stroke(V3D_BrushState* state, float x, float y)`
Initializes stroke state, resetting stabilizer and last dab position.

### `void v3d_brush_paint_stroke(V3D_BrushState* state, V3D_Layer* layer, const V3D_Brush* brush, float to_x, float to_y, bool is_eraser)`
Interpolates dabs along the motion vector respecting brush spacing, hardness, tip mask, and opacity.
- If `is_eraser` is `true`, pixels are erased via destination-out alpha modulation.

### `void v3d_brush_apply_smudge(V3D_BrushState* state, V3D_Layer* layer, const V3D_Brush* brush, float from_x, float from_y, float to_x, float to_y)`
Picks up color at `(from_x, from_y)` and pushes pixels toward `(to_x, to_y)` using the active tip mask texture.

---

## 3. Camera & Blender Drone Navigation

### `void v3d_camera_orbit(V3D_Camera* cam, float dx, float dy)`
Orbits camera around target without polar angle locks or gimbal freeze.

### `void v3d_camera_pan(V3D_Camera* cam, float dx, float dy)`
Pans target strictly relative to the camera's local viewport Right and Up vectors.

### `void v3d_camera_drone_fly(V3D_Camera* cam, float forward, float right, float up, float speed)`
Translates camera target along local viewing vectors for Blender-style drone flight (`WASD` + `QE`).

---

## 4. Normal Calculation & .xblend

### `void v3d_compute_surface_normals(V3D_Mesh* mesh, V3D_SurfaceShadingMode mode)`
- `V3D_SHADING_DEF`: Keeps initial vertex normals.
- `V3D_SHADING_SMOOTH`: Computes angle-weighted shared vertex normals.
- `V3D_SHADING_FLAT`: Computes per-face faceted normals.

### `bool v3d_xblend_save(const char* filepath, const V3D_AppContext* ctx, const char* model_path)`
Serializes metadata, linked model reference, and strictly up to **3 undo states** into the `.xblend` project format.
