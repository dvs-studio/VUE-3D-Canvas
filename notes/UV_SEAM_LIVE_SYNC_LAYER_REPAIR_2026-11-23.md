# UV seam painting, live synchronisation and layer-system repair — 2026-11-23

**Session ID:** `GPT6-UVATLAS-LIVE-SYNC-2026-11-23`  
**Branch:** `ai/uv-seam-live-sync-background-layers-2026-11-23`  
**Scope:** self-hosted React/Three.js application only (`src/` → `npm run host:sync`).  
**Excluded:** `crates/vue3d_core`, safety ZIPs, F7 Logo Fabric, HOLD-SEL, dedicated UV desk/NURBS/LTM.

## User's confirmed UV requirement

This is not texture-tile repeat and not symmetry mirroring. When a 3D surface stroke crosses an actual UV cut, the new surface hit maps to its own exact atlas pixel on the other side of the UV layout. The painter must stop interpolation across the atlas discontinuity and continue from that new pixel, following subsequent surface samples. Painting must be clipped to actual UV triangle coverage so brush stamps cannot alter empty atlas gutters or unrelated off-island pixels.

## Source changes on this branch

### UV painting and live viewport updates
- Added `src/tools/uvIslandClip.ts`. Builds a non-dilated `Path2D` union from the active UV triangle coordinates; supports indexed and non-indexed BufferGeometry.
- Both `Viewport2D` and `Viewport3D` clip paint operations to the UV triangle union. The 3D dab wrapper includes brush, eraser, clone, smudge and related raster operations. Mask-brush stamps also accept and use the UV clip path.
- Raycasts retain UV, world hit point and face index. `isUVSeamTransition` detects two mesh triangles that share a geometric edge but map the shared edge to different UV texels.
- 3D pointer segments are sampled in screen space at approximately 4px intervals (capped at 96 samples), so fast cursor events are less likely to skip the triangles at a seam. A sampled gap or seam restarts brush interpolation at the current hit's exact UV pixel. Leaving the mesh clears the surface and brush anchors; re-entry starts a fresh segment.
- 3D paint now calls the App's coalesced texture notification while the stroke is active. `Viewport2D` uses the shared `textureVersion` to redraw during 3D painting; `Viewport3D` already responds to the same shared composite update for 2D paint. This is the intended two-way live update path.
- The seam detector uses active UV channel data copied to the private viewport geometry; the active UV channel is also used for the clipping path.

### Gizmo
- `gizmoAngles` now uses the inverse of the full camera quaternion and returns all three Euler axes in YXZ order.
- The GLB gizmo model and CSS fallback both receive the full x/y/z rotation, rather than reconstructing only two angles from the camera-forward vector.

### Background and checkerboard
- Initial base layer is named **Background**, has semantic layer role `background`, is editable, and remains at the bottom of the stack.
- Background is protected from deletion, selection-merge, grouping, and reordering above other layers.
- The existing layer-opacity control is labelled **Background transparency** when Background is active. Reducing its opacity reveals the visual checkerboard behind it.
- The UV checkerboard has two configurable colours and independent transparency sliders. Settings persist in localStorage. It is drawn on the UV preview only and is not part of layer pixels, the 3D material texture, or exported image data.

### New layer types
- **F6 Mask Layer:** grayscale-only brush colour; white reveals, black hides, grey partially affects the target. Its opacity blends the layer's mask strength. A target selector is provided.
- **F1 Tear Layer:** black/transparent pixels cut holes, white pixels define torn-edge regions, and green-dominant pixels provide the stack-mask role. White pixels bordering a hole receive a restrained warm torn-rim contribution. Its opacity controls the overall Tear effect. A target selector is provided.
- Mask/Tear source layers remain editable and non-destructive. Their effects are composed into the target's displayed result; the helper honours parent-group visibility.
- The two requested new layer kinds are Mask and Tear. A separate Matcap-layer idea remains a later task; no fake Matcap add-button is included in this feature.

### Layer merge and blend behaviour
- Merge no longer refuses mixed blend modes or PBR settings. It flattens selected visible, unlocked layers in stack order. Compatible channels/PBR metadata are retained where possible; channel mismatches are flattened to colour.
- Added `add`, `subtract`, `color-dodge`, and `color-burn` blend choices. Subtract is a per-channel subtractive operation with opacity and source-alpha control, not merely a UI label mapped to Difference.
- Shared blend/composite helper is used by the App composite, 2D UV preview, 3D colour composite and merge output.
- When a target layer is flattened, remaining unselected Mask/Tear references are redirected to the merged result.

### Pattern Craft and filter repair
- Added `pattern-craft` to the existing Layer Filter menu and pixel transform.
- Modes: woven cloth, cotton grain, wool/fibre, bamboo raft, wrapped diagonal and strip stack.
- Automatic mode creates a grayscale height/displacement pattern on an empty/near-empty layer and multiplies textile micro-detail into existing painted colour while preserving original alpha on a painted layer.
- Dialog controls include material pattern, auto/displacement/multiply mode, scale, strength and deterministic seed.
- Also corrected Powderiser's already-normalized noise strength to prevent double division by 100.

### Selector and mask visual aids
- The 2D selection overlay retains its light editable / dark protected treatment and marching-ants boundary; status text identifies editable/protected areas.
- 2D cursor shows brush footprint and crosshair, uses a mask-specific cyan style, and turns warning red when outside the active selection.
- 3D cursor displays the brush footprint and centre marker, with mask-brush-specific styling; stabilizer tether remains available.

### Project compatibility
- `.xblend` layer records now include optional `layerType` and `targetLayerId`, so Mask/Tear/background roles survive save/load.
- Old projects without these fields continue to load; their first layer is treated as Background and remaining layers as paint layers.
- Mask/Tear layers are excluded from ordinary PBR material map exports; their native editable layer pixels and metadata remain in the project.

## Build and verification boundary

- GitHub Actions run **#210**, ID `45208471180`, succeeded on source commit `4c85c63f23140b2d630af9cbca5d2246fe3b66da`.
- The run passed `npm install`, `npm run host:sync`, the self-host blank/incomplete package checks, generated output commit, archive creation and artifact upload.
- Generated self-host output commit: `eefa22e69d2fe22722ef6c2649f72783108823a2`.
- Artifact `VUE_3D_Canvas_SelfHost`: ID `14835217254`, approximately 2.08 MB.
- The follow-up workflow edit adds per-ref concurrency cancellation so future quick sequences of source commits do not race their generated self-host bundle pushes.
- CI is build/package evidence only. It does **not** prove real pen/mouse/touch behaviour, visible seam continuation, correct gizmo orientation, or live 2D/3D visual parity. Those still require Victory's runtime test.

## Manual test checklist

1. On Suzanne Head + Eyes, paint quickly across a UV seam whose continuation is at the opposite side of the atlas. Verify there is no horizontal/diagonal bridge and no paint outside any UV island.
2. Repeat with slow/fast drags, low/high brush spacing, stabilizer on/off, pointer leaving/re-entering the mesh, and symmetry OFF/X/Y/XY/Z.
3. Paint in 3D while the 2D UV view is visible; verify each stroke updates 2D live. Paint in 2D and verify the 3D material updates live without switching view modes.
4. Orbit through all axes and confirm the orientation gizmo stays aligned, including roll/top/bottom views.
5. Add Mask and Tear layers, target different paint layers, change mask/tear opacity, paint grayscale/black/white/green roles, and verify lower-layer reveal and torn rims.
6. Lower Background opacity and confirm the two-colour checkerboard appears in 2D only. Export a texture and verify checkerboard pixels are absent.
7. Merge mixed normal/multiply/add/subtract layers and mismatched channel/PBR layers; inspect output, undo/redo, save and reload .xblend.
8. Test Pattern Craft in auto mode on an empty layer and a populated colour layer, then compare Preview and Apply; test Powderiser at 0%, 25% and 100%.

**No visual/device acceptance is claimed by this entry.**

## Follow-up repair — undefined compositor and layer-preference layout

Victory reported a runtime error: `drawLayerWithBlend is not defined`, and requested that type-specific layer controls live inside the right-click Preferences window instead of occupying the Layers panel.

Changes pushed after the original implementation:
- Added the missing `drawLayerWithBlend` import in `src/App.tsx`, together with the companion `createLayerCompositeSource` helper import.
- Fixed the active 2D UV clip dependency by declaring and passing `uvGeometryVersion` to `Viewport2D`.
- Corrected the 3D raycast coordinate function to use its `clientX/clientY` arguments; restored event-coordinate reads in X-ray vertex selection.
- Restored the checkerboard prop specifically to `Viewport2D` after moving the settings UI.
- Removed the checkerboard editor and Mask/Tear target selector from the always-visible Layers panel. Both are now inside the type-specific Layer Preferences modal.
- Added a Background preferences page containing Background transparency and the two checkerboard colours/alpha sliders. The checkerboard remains preview-only.
- Added Mask and Tear preferences pages with target-layer selection and effect-specific descriptions. Their opacity/influence and blend mode are controlled in the common preferences section.
- Moved blend mode and opacity controls for ordinary paint layers into the same Layer Preferences modal, reclaiming vertical room for the layer list.
- Added the Layer Preferences opener to both the grouped/docked and standard Layers panel layouts.
- Prevented saving PBR preferences from overwriting a paint layer's separately controlled opacity.
- Enabled `npm run lint` (TypeScript `tsc --noEmit`) in the self-host workflow. This surfaced unrelated existing type issues; the pass corrected those in HDRI canvas fallback typing, cached normal attribute typing, wood-source fallback typing, and the Mesh Parts frame button handler. The XBlend duplicate manifest properties were also consolidated.
- The 2D checkerboard was explicitly reconnected to the UV viewport after removing its former Layers panel controls.

### Follow-up verification
- Workflow run #230 / ID `45211937996` passed TypeScript diagnostics, Vite build, self-host sync, blank-package checks, output commit, archive and artifact upload. This run includes the checkerboard reconnection and the type-specific preferences layout.
- A final run for the subsequent paint-layer opacity preservation commit is in progress; do not treat it as passed until its result is completed.
- No real mouse/stylus/touch visual acceptance is claimed. Victory should verify that right-click → Layer Preferences opens for Background, Mask, Tear and ordinary paint layers, and that edits persist and update the preview/stack as expected.
