# HANDOFF.md - Native C Architecture & AI Developer Instructions

**Project:** VUE 3D Canvas (Native C Edition)  
**Author & Creator:** Victory Ukpong  
**Target:** C99/C11 Native Desktop Architecture + DirectX 11 / OpenGL 2.0+ Core  
**Memory Budget:** < 30 MB Heap, Max 3 States in `.xblend` Project Files  

---

## 1. MANDATORY GOVERNANCE FOR SUBSEQUENT AI MODELS
> **CRITICAL DIRECTIVE:**
> 1. **NEVER CLEAR HISTORY OR REMOVE FEATURES**: You must **ADD**, never delete, replace, wipe, or truncate existing code or architectural history.
> 2. **PRE-TASK REQUIREMENT**: Read `AGENT_STATE.md` and this `HANDOFF.md` **before** writing code to verify existing state and constraints.
> 3. **POST-TASK REQUIREMENT**: Update the active ledger in `AGENT_STATE.md` and `HANDOFF.md` **after** completing your task, appending your verified additions.
> 4. **STRICT CONSTRAINTS**: Maintain the 3-state undo ring buffer for `.xblend` serialization, linked assets by default, Photoshop CS5 dark skin palette (`#333333`), and zero ray-tracing dependencies.

---

## 2. Directory Structure

```
native_c/
├── include/
│   ├── vue3d.h             # Core data structures (Layers, Brush, Camera, Themes)
│   ├── surface_shading.h   # Dynamic surface normals (Def, Smooth, Flat)
│   ├── brush_engine.h      # Brush dabs, stabilizer, masks, patterns, smudge, eraser
│   └── xblend.h            # .xblend project format (3-state ring buffer)
├── src/
│   ├── main.c              # Application entry, interactive terminal & UI runtime
│   ├── renderer_gl.c       # OpenGL 2.0+ pipeline, camera matrices, layer compositor
│   ├── brush_engine.c      # Painting engine implementation
│   └── xblend.c            # .xblend serialization
├── build_gcc.bat           # 1-click GCC/MinGW standalone build script
├── build_msvc.bat          # 1-click MSVC standalone build script
├── Makefile                # Cross-platform Makefile
├── HANDOFF.md              # This file (AI instructions & upgrade ledger)
└── API.md                  # C API function and struct reference
```

---

## 3. Active Feature Ledger (C Edition)

- [x] **Core Memory & Layer Allocator**: 32-bit RGBA layer buffers with opacity and blending.
- [x] **Brush Engine**: Lazy-mouse stabilizer, dabs, soft radial gradients, tip mask textures (`grunge`, `splat`, `scratch`, `dots`, `cracks`), and destination-out eraser.
- [x] **Smudge / Smear Tool**: Dynamic color pickup and pixel push with tip mask texture modulation.
- [x] **Blender Drone Navigation**: WASD+QE camera-relative drone flight, planar panning along screen axes, and unconstrained 360° orbit.
- [x] **Dynamic Surface Normals**: Runtime switching between Def (original), Smooth (angle-weighted), and Flat (faceted) normals.
- [x] **.xblend Project Serialization**: JSON metadata + binary pixel chunks adhering to strict 3-state ring buffer limit.
- [x] **Standalone Executable Output**: Zero-dependency compilation producing single `vue_3d_canvas_c.exe` via GCC or MSVC.
- [x] **Navigation Axis Inversion & Direction Alignment**: `v3d_camera_orbit` supports natural Blender rotation direction and `invert_nav` toggle flag, controllable via `axis [nat|inv]` in interactive shell.
- [x] **Dedicated Native C README & Workflows**: Full technical manual `native_c/README.md`, standalone GitHub Actions export workflow (`export-c.yml`), and native non-WebGL Windows compilation CI (`build-windows-c.yml`).
- [x] **Multi-UV Channel Subsystem (`v3d_uv_channel_*`)**: Dynamic UV channel allocation, buffer swapping, and active channel switching in `V3D_Mesh`.
- [x] **Smart UV Unwrap (`v3d_uv_smart_unwrap`)**: Seeded stochastic packing with angle relaxation and gutter dilation.
- [x] **Symmetrize UV (`v3d_uv_symmetrize`)**: Bilateral UV mirroring with centerline pinning and ear feature safeguards.
- [x] **2D UV Sculpting Engine (`v3d_uv_sculpt_stroke`)**: Real-time UV sculpt brush implementation for Smooth, Straighten, Pinch, Expand, and Crease.
- [x] **Inverse Barycentric Re-Baker (`v3d_uv_rebake`)**: Triangle rasterization re-baking texture from tight-map back to original UV coordinates with margin dilation.


