# Implementation Plan: Next-Gen Smart UV Unwrap, Symmetrize UV & Sculpting Suite

## 1. Executive Summary & Architecture Overview
This plan establishes a professional, non-repetitive, high-fidelity UV pipeline for VUE 3D Canvas. The upgrade introduces:
1. **Dynamic Smart UV Unwrap Engine**: Seeded stochastic island packing with conformal angle relaxation, customizable island bleeding/gutters, and submesh ID component isolation to eliminate pattern repetition and seam edge artifacts.
2. **Multi-UV Channel & Texture Re-baker**: Full support for adding, switching, and deleting UV channels (`uv_original`, `uv_tightmap`, custom slots), paired with an automated inverse-barycentric texture re-baker and export channel midfix tagging.
3. **Symmetrize UV Tool with 3D X-Ray Vertex Selection**: Interactive viewport X-Ray vertex brush painter to define symmetry groups, paired with midpoint-aware symmetrical UV island folding and stacking.
4. **2D UV Viewport N-Panel & UV Sculpt Brushes**: Interactive 2D sculpt tools (Straighten, Smooth, Crease, Pinch, Relax/Expand) inside a Photoshop CS5 style dockable N-panel.
5. **Cross-Language Parity (Rust Core & Web -> Python Desktop -> Native C)**: Implemented and tested in Rust/Web first, then cleanly ported to `python_desktop/` and `native_c/`.

---

## 2. Technical Breakdown & Modules

### Phase 1: Smart UV Unwrap Engine & Non-Repetitive Tight Mapping (Rust / Web First)
- **Seeded Variational Packing**:
  - Implement a deterministic pseudo-random seed generator that alters island orientation angles (0°, 45°, 90°, 180°, or random jitter) and island placement hierarchy.
  - Apply conformal angle relaxation minimizing geometric stretch while ensuring zero self-intersections or merged edges.
- **Island Bleeding & Edge Gutter Dilation**:
  - Implement configurable island padding (e.g. 2px - 16px gutter dilation) that dynamically expands boundary texture pixels, completely preventing mipmap edge bleeding and seam artifacts.
- **Submesh Component ID Isolation**:
  - Enhance the mesh ID selector so unwrapping a specific submesh (`[ID: body]`, `[ID: clothes]`, etc.) unwraps that specific geometry component either into its isolated UV partition or packs it into available UV real estate while strictly preserving unselected mesh UV coordinates.

### Phase 2: Multi-UV Channels & Dynamic Texture Re-baker
- **Multi-UV Channel System**:
  - Extend mesh data structures to support multiple UV attribute sets: `uv_default` (original imported UVs), `uv_tightmap` (smart generated), and user-added custom channels.
  - Add UI controls to create, rename, duplicate, switch active, and delete UV channels.
- **Inverse Barycentric Texture Re-baker**:
  - When painting on `uv_tightmap`, allow 1-click re-baking onto `uv_default` (or any target UV channel) using canvas/FBO fragment shader projection.
- **Export Texture Midfix Tagging**:
  - Formats exported maps with active UV channel midfixes (e.g., `model_diffuse_TightMap_2048.png` vs. `model_diffuse_OriginalUV_2048.png`).

### Phase 3: Symmetrize UV Tool & 3D X-Ray Vertex Brush Painter
- **3D Viewport X-Ray Vertex Selector**:
  - An interactive paint brush mode in `Viewport3D` that casts rays through the mesh (with depth/x-ray pass-through) to paint-select vertices into a temporary/active vertex group.
  - Visual feedback showing highlighted vertex points with translucent selection halos.
- **Intelligent Symmetrize Engine**:
  - Symmetrize options dropdown: Select axis (+X to -X, -X to +X, or vertex group).
  - Midpoint protection: Centerline vertices and asymmetric features (such as ears or off-center details) retain non-overlapping spacing, while bilateral halves overlap and align with pixel-perfect precision.

### Phase 4: 2D UV Viewport N-Panel & UV Sculpt Brushes
- **Dockable N-Panel (CS5 Dark Theme)**:
  - Toggleable sidebar in `Viewport2D` providing brush radius, falloff strength, and sculpt mode.
- **Interactive UV Sculpt Brushes**:
  1. **UV Smooth / Relax**: Relaxes UV vertex density to reduce local texture stretching.
  2. **UV Straighten**: Projects UV edge loops along cardinal U/V axes for clean rectangular strips.
  3. **UV Pinch**: Pulls UV vertices toward brush centroid to increase texture resolution in focal areas.
  4. **UV Expand**: Pushes UV vertices away from cursor to reduce texture density.
  5. **UV Crease**: Sharpens UV boundaries and preserves boundary angles while sculpting.

### Phase 5: Multi-Language Migration (Python Desktop & Native C)
- **`python_desktop/` Migration**:
  - Implement multi-UV channels, stochastic unwrap relaxation, island bleeding, and symmetrize algorithms in `vue3d/renderer/geometry.py` and `vue3d/tools/`.
  - Update `desktop_gui.py` with 2D UV sculpt brushes and UV channel management.
- **`native_c/` Migration**:
  - Add UV channel arrays, stochastic unwrap island binning, and UV symmetrize routines to `native_c/include/vue3d.h` and `native_c/src/renderer_gl.c`.
  - Add interactive CLI commands (`uv unwrap [seed]`, `uv symmetrize [axis]`, `uv channel [add|del|bake]`).
- **Ledger & Documentation Update**:
  - Update `AGENT_STATE.md`, `python_desktop/HANDOFF.md`, and `native_c/HANDOFF.md` preserving all prior records.

---

## 3. Verification Plan
1. **Unwrap Variety Test**: Run smart unwrap with multiple seeds and verify differing layouts without edge merging or overlapping faces.
2. **Bleed & Seam Test**: Paint high-contrast colors across UV island borders and verify zero seam glitching or bleeding artifacts.
3. **Re-bake Accuracy Test**: Paint on Tight Map UV, bake to Original UV, and inspect 1:1 visual fidelity.
4. **X-Ray Brush & Symmetrize Test**: Paint-select a sub-region in 3D X-Ray mode, execute Symmetrize, and verify exact opposite-half symmetry without midline ear collision.
5. **Compilation & Lint**: Run `compile_applet` and `lint_applet` across the full TypeScript codebase, and smoke test Python and C engines.
