# Procedural Wood, Filter Suite and Material Hooks — 2026-11-25

## Scope completed in this pass

### 2A-W — Wood rings

- Added three selectable ring structures: uniform tree-year growth rings, organic fingerprint rings and merged/flowing rings.
- Added a surface-space mapping path built from the active UV channel using the existing mesh-surface rasteriser.
- Added a normal-derived curvature map. Curvature influence gently warps the ring field on curved surfaces.
- Added Object and World coordinate choices. World mode applies the owning mesh's live `matrixWorld`, attached ephemerally to the geometry object (not serialised into geometry userData). If no matrix is available, it falls back to object coordinates.
- Existing band/ring modes, stacked source colours/images, frequency variation and seed controls remain.

### 2C — Additional texture filters

Added selectable Warp/Wavy Transform, Pointillism, Honeycomb Cells and Stochastic Scatter branches to the existing selected-layer filter engine. Controls are exposed for warp strength/scale, dot size/variation, cell shape/size, scatter density/size and deterministic seed. The selected mesh-part mask is still applied after each transform so pixels outside the selected target remain unchanged.

These are raster filter implementations, not brush engines. They do not replace the separate brush-stamp/stencil or brush-texture behaviours.

### 2A-T — Triplanar world coordinates

- The existing fill engine already performs three-axis projection, normal-weight blending, multi-texture mixing, slope/altitude masks, and selection-mask protection.
- Added world-matrix application to surface positions and normals using the owning mesh's live `matrixWorld`, attached ephemerally to the geometry object.
- If the geometry has no live matrix reference, world mode uses the object-space fallback.

### Base Layer shape sensitivity

- Added a derivative-based curvature estimate in the world-space checker shader.
- Higher curvature increases checker frequency from the original 2.0 scale up to 4.0, shrinking tiles around narrow curved details while retaining larger tiles on flatter surfaces.
- This is shader-side adaptive frequency, not a change to the protected UV composite/export path.

### Matcap

- Added a dedicated Matcap Layer creation control in the Layers panel.
- New Matcap layers receive Matcap reflection settings and can be edited using the existing Layer Properties dialog.
- Connected visible layers whose reflection source is Matcap to the standard-material shader. Built-in Chrome/Ceramic/Clay/Pearl/Gold looks use generated preview textures; Custom uses the selected image.
- The current renderer applies the topmost visible Matcap-enabled layer as a viewport material appearance overlay. It is not yet a separately exported Matcap map or a multi-Matcap stack.

### F6 — Target-linked Mask Layer

- Added a dedicated Mask Layer action in the Layers panel. It creates a white mask targeting the currently selected ordinary layer.
- Mask layers are not drawn as visible colour layers. Their grayscale luminance and alpha multiply the target layer's colour alpha and PBR-map contribution.
- Multiple visible masks targeting one layer multiply together; layer visibility and mask opacity are respected.
- Deleting a target layer also removes its dependent masks.
- Brush editing uses the ordinary paint path: white reveals, black conceals, grey partially reveals. Manual brush/undo/group tests remain outstanding.

### F1 — Tear Layer

- Added a dedicated Tear Layer action targeting the currently selected ordinary layer. The helper starts white (intact surface) and is excluded from ordinary colour compositing.
- Black or transparent pixels cut through the target to reveal the immediate layer below.
- White pixels preserve the target and create a lightly irregular/frayed alpha edge where they border a cutout. This supports hand-painted tear boundaries.
- Green pixels cut the target and mask the configured number of underlying layers, exposing the stack beneath them. Green stack depth is adjustable from 1 to 8 and defaults to 2.
- The Tear Layer uses the normal brush paint path, so users can paint black, white and green with the selected brush colour. The mesh-part target scope and richer rim/under-paint workflow still need follow-up.

### Pattern Craft filter

- Added Pattern Craft to the selected-layer filter list. Empty transparent layers automatically generate monochrome patterns suitable as displacement sources; painted layers receive multiply-style micro-detail modulation while preserving alpha.
- Supports flowing waves, cellular, stochastic noise, checker and concentric rings with scale, strength and seed controls.

## Still outstanding / intentionally deferred


- F6 dedicated Mask layer and proper target-layer relationship / editing UX.
- Material Fill layer masking trigger is supported through target-linked Mask Layers; canonical Asset Gallery integration remains deferred.
- Stencil and Brush Texture gallery consumers; image-pattern vs procedural-pattern split in the Brush options accordion.
- Full gallery scanner reconciliation and browser persistence/migration acceptance.

- Matcap map export, multiple Matcap layer stacking and visual verification.
- Remaining stabilisation manual acceptance, A5 touch/desktop checks and UI3 Undo/Redo viewport reproduction.

## Verification required

Workflow #354 passed TypeScript diagnostics, Vite build, self-host sync, package validation and artifact upload. Artifact ID `14999603968`; https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45566378845. Workflow #360 then passed after the Tear Layer and stack-depth changes, producing artifact `14999199885`; https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45567085033. This confirms source and self-host package builds, not visual/device acceptance. After CI, manual checks must include:

1. Wood filter preview/apply for growth, fingerprint and merged rings on the sphere and a non-spherical mesh; compare object/world mode with and without a transform matrix.
2. Curvature effect around finger-like/narrow details; ensure no harsh distortions on flat surfaces.
3. Warp, Pointillism, all four Honeycomb shapes and Stochastic Scatter; verify repeatable seeds and selected-part pixel preservation.
4. Triplanar on multiple orientations and with translated/rotated/scaled meshes; verify A/B mix and selection mask.
5. Base checker tile shrink on fingers and smooth transition to flatter areas.
6. Matcap presets, custom image, layer visibility/order, intensity and HDRI fallback.
7. Confirm shader compilation on desktop WebGL and Android browser/GPU.

No manual browser/device acceptance is claimed by this note. The F6 Mask Layer and F1 Tear Layer are included in the #360 artifact; brush/undo/group/stack behaviour remains for user testing.
