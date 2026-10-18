# VUE 3D Canvas - Feature Updates & Architecture Implementation Plan

## Proposed Architectural Updates & Feature Phases

### Phase 1: Setup, Dependencies & Handover Documentation
1. **Build & CI/CD Updates (`Cargo.toml` & `.github/workflows/`):**
   - Ensure `crates/vue3d_core/Cargo.toml` includes procedural texturing, serialization, and wasm features.
   - Update `.github/workflows/build-self-host.yml` to target `crates/vue3d_core` cleanly.
2. **Agentic Handover Ledger (`AGENT_STATE.md`):**
   - Document new modules, layer PBR architecture, triplanar mixing pipeline, pattern stamp tool, edge wear filter, and export pipelines.

---

### Phase 2: Triplanar Filter Expansion & Layer Node System
3. **Triplanar Filter Multi-Texture Mixing Operator (`src/tools/fillSuite.ts`, `src/ui/TriplanarDialog.tsx`):**
   - Transition all triplanar components from pure colors to image textures with built-in texture presets (Rock/Stone, Sand/Grit, Moss/Foliage, Concrete, Weathered Wood, Rusty Metal) and custom user image upload.
   - Implement **Mixing Value Operator**: uses noise, fractal clouds, and classic patterns as a procedural blending mask between textures.
   - Support Blank Alpha on textures so textures seamlessly blend with underlying surface paint.
   - World-coordinate box mapping (YZ/XZ/XY projections) with normalized sharpness, slope, altitude, and edge bleed/noise parameters.
   - Add `+` (Add Texture) capability to stack multiple textures in the triplanar mixer.
   - Respect active selection/mask painted with the Mask Brush.
4. **Pattern Layer Triplanar Box-Mapping:**
   - Integrate triplanar box projection with tiling randomization for pattern layers.
5. **Per-Layer Node Connections & PBR Settings (`src/core/types.ts`, `src/ui/panels/LayersPanel.tsx`, `src/ui/LayerSettingsModal.tsx`):**
   - Dedicated PBR parameters per layer (Roughness, Metallic, Bump/Height, Normal, Emission, Opacity).
   - Reflection control driven by HDRI or custom Matcap texture with slider intensities.
   - **Bump & Color Toggle:** Allow painting pure bump details with color disabled.
6. **Advanced Material Node Switch:**
   - Button in layer settings to open/switch into the custom Blender 2.8+ node graph.

---

### Phase 3: UI, Brushes, Carousel Icons & Layer Actions
7. **Layer Context Menu:** Add "Invert Layer Color" option in `LayersPanel.tsx`.
8. **Brush Docker Updates (`src/ui/panels/BrushLibraryPanel.tsx`):**
   - Rename pattern setting to "Texture", save new textures into custom presets, maintain tip Mask vs texture Pattern distinction.
9. **Brush Carousel Wheel & Tool Options (`src/ui/CircularCarousel.tsx`, `src/ui/ToolOptionsBar.tsx`):**
   - Add SVG icons to all tools in the carousel.
   - Add preset image previews for Brush Tip Masks and Textures with Add `+` buttons for custom image import.

---

### Phase 4: Pattern Stamp Tool & Edge Wear Filter
10. **Pattern Stamp Tool (`src/tools/patternStampTool.ts`, `src/ui/PatternStampDialog.tsx`, `src/renderer/Viewport3D.tsx`):**
    - Sticker/decal stamping directly onto the 3D model surface.
    - Floating configuration dialog with built-in stamp decals and user file upload.
    - Sharpness and edge imperfection sliders (torn edges, missing fragments).
    - Grunge overlay texture system with blend modes (Multiply, Overlay, Hard Light, Screen).
11. **Edge Wear & Curvature / Ambient Occlusion Filter (`src/tools/edgeWearFilter.ts`, `src/ui/EdgeWearDialog.tsx`):**
    - Mesh geometry analysis to calculate vertex/edge convex curvature (sharp ridge edges) and concave crevices (ambient occlusion/cavity).
    - Procedural edge wear generator that peels, chips, or weathers edges (e.g. exposed metal under paint, dirt in cavities).
    - Adjustable contrast, wear amount, noise jitter, and color/texture replacement.

---

### Phase 5: Blender Material Import & FBX/glTF Texture Channel Exporter
12. **Blender Material Converter (`src/nodes/blenderMaterialImporter.ts`):**
    - Import and parse Blender shader node setups (JSON specification or Python node export) and convert into Vue 3D Canvas layers and node networks.
13. **FBX & glTF Intelligent Multi-Channel Exporter (`src/core/modelExporters.ts`, `src/ui/ExportModelDialog.tsx`):**
    - Automated texture channel baking and separation:
      * Albedo / Diffuse map
      * Emission / Glow map
      * Displacement / Bump & Normal map (Sobel)
      * Roughness & Metallic maps
    - Export 3D mesh as glTF 2.0 (`.gltf` / `.glb`) and standard FBX bundle with textures and materials bound.

---

## Verification & Compilation
- Run `lint_applet` and `compile_applet`.
- Verify dev server on port 3000.
