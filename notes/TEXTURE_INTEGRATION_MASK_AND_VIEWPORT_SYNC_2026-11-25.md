# Texture Integration, Mask Layer Redesign and Viewport Synchronisation — 2026-11-25

This is an active implementation handover. The user reports the prior texture integration is missing in the running app; earlier claims of completed gallery consumer integration must be re-audited, not treated as acceptance. Work directly on self-hosted React/Three/Vite source, sync `src/` to `self-host/public/`, and keep documentation current. Do not edit `crates/vue3d_core`, remove protected ZIPs, merge PR #2, or build F7 / HOLD-SEL.

## A. Supplied texture pack

Source: user upload `Texture integration.zip`. Six original 2K JPEGs:

| File | Gallery tags |
|---|---|
| Autumn_leaf_vein_texture_65225ba8_2K.jpg | Surface Texture |
| Brown_animal_fur_texture_b9d00831_2K.jpg | Surface Texture |
| Lush_green_lawn_grass_texture_ee1f2d6f_2K.jpg | Surface Texture |
| Rusty_metal_texture_map_d5c8178c_2K.jpg | Surface Texture |
| Seamless_dark_walnut_wood_texture_0ed652c3_2K.jpg | Surface Texture, Wood |
| Weathered_wood_texture_map_9de0f19a_2K.jpg | Surface Texture, Wood |

Preserve original JPEG blobs at source resolution/aspect ratio and store thumbnails separately. Do not flatten, recolour, convert originals to thumbnails, overwrite built-in examples or create a parallel asset database. Import idempotently into the canonical IndexedDB gallery, preserving filename, dimensions, size, category and source metadata. Verify the six entries remain after reload and that pickers use the original blob rather than thumbnail.

Re-audit and repair the complete actual consumer path: Asset Gallery import/preview/delete/category/refresh; Triplanar A/B surface textures; Material Fill; Brush Library stencil and image Pattern/Brush Texture; Pattern Stamp decal/torn-mask/grunge; Mask/Tear; Matcap. Keep brush stencil alpha, raster image texture and procedural pattern as three distinct concepts. Selecting one consumer source must update only that source and persist where the project format supports it. A picker that opens but cannot apply or persist its original is not integrated.

## B. UV cut-out limit and mesh-part filter limit

These are independent constraints:
- Mesh-part target limits which selected mesh component(s) a filter may change.
- UV coverage/cut-out limits writes to active UV triangle/island coverage and prevents bleed into gutters, transparent regions or unrelated islands.

The effective filter write mask is the intersection of selected mesh-part coverage and active UV-island triangle coverage. Preserve pixels outside that intersection byte-for-byte. Do not substitute a bounding rectangle for triangle coverage, and do not regress the A4 part selector or accepted UV seam fix.

## C. 3D brush continuity across UV seams

Reported defect: a 3D brush stroke appears on one side of a UV seam but does not continue onto the corresponding other side. Trace the surface hit/interpolated triangle path to UV coordinates and per-triangle UV-island IDs. Carry accumulated surface-space samples across triangle boundaries and emit UV dabs for every island reached by the same continuous surface stroke. Retain per-island clipping and path reset rules; never draw a straight line through unrelated islands. Pointer-up/cancel must flush queued samples. Test brush, eraser and mask brush on sphere seam, Suzanne/head-and-eyes and a deliberately split-UV mesh, including pointer coalescing/tablet input. Treat this as a focused paint-path repair; do not rewrite the viewport or dab compositing without a reproduced need.

## D. Asynchronous 3D → 2D UV synchronisation

Create a dedicated invalidation task so the 2D UV viewport actively refreshes from 3D drawing and subdivision updates without waiting for a tab switch or unrelated React render.

- Use coalesced requestAnimationFrame/dirty-version scheduling.
- Separate texture-pixel invalidation from geometry/topology invalidation. A paint dab must not rebuild UV topology.
- A 3D stroke invalidates the composite and schedules the 2D redraw on the next available frame.
- Subdivision preview changes invalidate the resolved geometry used by both viewports. Both viewports must receive the same active geometry, UV channel and version.
- Schedule refresh after new subdivision geometry is committed; avoid stale previous-state geometry.
- Flush the final pointer-up/cancel sample and cancel pending frames on unmount.
- Handle hidden/visible 2D transitions and resize while retaining the last texture version.
- Respect refresh-rate preferences; no idle continuous-redraw loop.

Acceptance: paint in 3D while 2D is visible; paint while hidden then reveal; change subdivision level/toggle preview; switch UV channel; resize/split view. The 2D texture must catch up within the next available display frame after each committed update.

## E. Mask Layer redesign

The current white-default target-linked helper is not the requested final UX. Redefine it as a first-class editable control layer.

### Creation and association
- Right-click on desktop or long-press on touch over a selected layer to create a Mask Layer directly adjacent to and linked to that exact layer.
- Keep a general Add-menu entry.
- A new mask starts blank/transparent, not white-filled. Transparent/untouched pixels are neutral and produce no effect. The first painted/imported pixel activates influence only where that pixel exists.
- Persist target identity, mode, blend behaviour, preview/edit state as appropriate. Undo/redo, duplicate, group, reorder and delete must preserve or safely repair links.

### Pixel semantics
- Grayscale luminance: white = full influence/reveal, black = zero influence/conceal, grey = partial influence.
- Alpha says whether a pixel participates. Transparent pixels are neutral, not opaque black.
- Mask opacity scales influence; visibility disables effect without destroying mask.
- Support brush, eraser, imported grayscale image and selection-derived operations via the undoable paint pipeline.
- The mask is not an ordinary visible colour coat. It affects target colour alpha and supported PBR maps.

### Blend menu: exact labels and behaviour
1. **Normal (Pass Through)** — affects only its directly linked layer immediately below. White reveals, black conceals, grey partially reveals. It must not affect distant stack layers.
2. **Mix** — uses only the directly adjacent layer above and directly adjacent layer below. White selects upper, black selects lower, grey interpolates. Use deterministic alpha-aware interpolation in premultiplied colour space, including mask luminance × alpha × mask opacity, then safely unpremultiply. Respect each source layer's visibility and opacity. If either adjacent input is missing, show unavailable state and preserve the mask; do not silently select distant layers.

### Edit and diagnostic preview toggles
- **Single-click highlight toggle** on the Mask Layer row enters/exits mask-edit mode. Highlight the row and route paint/erase to the mask canvas, not target colour. The linked target remains associated; toggling off returns to normal target editing. Apply the same mask-edit workflow to masks associated with any editable layer type.
- **Double-click X toggle** switches between project composite and mask-only diagnostic preview. In diagnostic view, positive/revealed mask values appear neutral light grey; negative/subtracted values receive subtle light-red shading. Double-click again returns to project. Preview must not alter stored pixels.
- Keep single-click and double-click semantics distinct with a short debounce that does not make single-click inaccessible. Support pointer and touch.
- Selection tools must retain clear activity/acuity in both project and mask preview: active selection edges, inactive selection shading and positive/negative mask overlays remain distinguishable without obscuring brush feedback.

## F. Layer Add menu

Group all special/new layer types under the Layers panel **Add** menu rather than distributing buttons across a narrow panel. Include ordinary Paint Layer, Material Fill, Matcap Layer, Mask Layer, Tear Layer and Group. Preserve responsive wide-panel behaviour and existing keyboard/context actions. Helper layers must be inserted predictably and retain target references.

## G. Pattern Craft Filter menu entry

Pattern Craft is a filter, not a layer type and not a brush preset. Put it directly in the top **Filter** menu as its own command in the pattern/filter section. Selecting it opens the existing Texture Filter dialog with Pattern Craft preselected; it must not require searching a generic filter list. Preserve the current engine, preview/apply/undo flow, empty-layer displacement-pattern behaviour, painted-layer micro-detail behaviour, and waves/cellular/stochastic/checker/concentric-ring styles with scale/strength/seed controls.

## H. Remaining task order — do not wait for another confirmation

1. Restore and verify the six supplied textures in the canonical gallery and all real consumer paths.
2. Repair UV seam-crossing brush continuity and enforce UV cut-out limits for filters.
3. Implement coalesced asynchronous 3D→2D UV/subdivision synchronisation.
4. Implement the Mask Layer redesign, including context creation, Normal and Mix, edit toggle, diagnostic preview and selection overlay clarity.
5. Group special layer types under Add.
6. Put Pattern Craft directly in the Filter menu.
7. Complete outstanding code backlog: Tear mesh-part target scope; Matcap export and multi-layer stacking; Pattern Craft material/export workflow; Honeycomb world/normal-space mapping; gallery GPU-tier auto-scale/resource packaging; UI3 oversized Undo/Redo viewport investigation.
8. Run lint/type checks/build, `npm run host:sync`, self-host package validation and CI. Report each task landed/blocked/open. CI is not visual acceptance; manual desktop/tablet/browser tests remain separate.

## I. Source bookmarks

Inspect actual current symbols before changing them.

| Concern | Source bookmarks |
|---|---|
| Layer creation, state, ordering and composite | `src/App.tsx`: `handleAddLayer`, `handleAddMaskLayer`, `handleAddTearLayer`, `handleAddMatcapLayer`, `handleUpdateBlendMode`, `handleApplyMaskImage`, `syncCompositeCanvas`, `notifyTextureUpdated`, `notifyUVGeometryUpdated` |
| Layer schema and serialization | `src/core/types.ts`: `Layer`, `BlendMode`, `XBlendProject` |
| Mask raster and paint primitives | `src/tools/maskEngine.ts`: `MaskEngine.rasterizeMask`, `paintMaskDab`; `src/core/types.ts`: `SelectionMask` |
| Layer row, Add/context menu and gestures | Layers panel definition/render in `src/App.tsx`; `src/ui/LayerSettingsModal.tsx`; search `onContextMenu`, `onPointerDown`, `onTouchStart` |
| Brush stencil vs image pattern | `src/core/types.ts`: `BrushPreset.stencilUrl`, `patternUrl`, `patternType`; `src/tools/brushEngine.ts`; `src/ui/ToolOptionsBar.tsx` |
| UV coverage and mesh-part filtering | `src/renderer/Viewport3D.tsx`, `src/renderer/Viewport2D.tsx`, `src/tools/textureFilters.ts`: `buildMeshPartPixelMask`, `buildObjectSpacePositionMap`, `rasterizeMeshSurface`; locate `UVChannelManager` in the current tree |
| Viewport/subdivision invalidation | `src/App.tsx`: `uvGeometryVersion`, `subdivisionPreviewGeometry`, `notifyTextureUpdated`; both viewport components' geometry/version props and `onGeometryUpdated` |
| Pattern Craft engine and menu | `src/ui/TextureFilterDialog.tsx`: `names`, `cfg.kind === 'pattern-craft'`; `src/tools/textureFilters.ts`: `TextureFilterKind`, `transformTexturePixels`; `src/ui/PhotoshopMenuBar.tsx`: Filter menu |
| Matcap/Tear | `src/App.tsx`: Matcap/Tear creation; `src/ui/LayerSettingsModal.tsx`; `src/renderer/Viewport3D.tsx`; `src/ui/ExportTextureDialog.tsx` |
| Canonical gallery | `src/tools/assetGallery.ts`, `src/tools/externalAssetLibrary.ts`, `src/ui/AssetGalleryModule.tsx`, `src/ui/GalleryAssetPicker.tsx` |

## Verification caveat

Workflow #386 and artifact `15000797321` predate this request. They do not verify any item above. Do not claim new work is complete until source changes are synced and CI passes. Report manual visual/device acceptance separately.


## Implementation progress — 2026-11-25 (in progress; not full acceptance)

The following source changes have now landed after the handover was written:
- `src/ui/PhotoshopMenuBar.tsx`, `src/ui/TextureFilterDialog.tsx`, `src/App.tsx`: Pattern Craft now has its own direct Filter-menu command and opens the existing filter dialog with `pattern-craft` preselected. Workflow #389 passed: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45581003681.
- `src/ui/panels/LayersPanel.tsx`: special layer creation actions are grouped under an Add menu; desktop right-click and touch long-press expose the layer context menu and a target-specific Add Mask Layer command. `src/App.tsx` now accepts the selected target ID and inserts the new linked mask immediately adjacent to that target. Workflow #392 passed for the target-specific handler and accumulated source: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45581294372.
- `src/ui/AssetGalleryModule.tsx`: Import images now also accepts ZIP archives, extracts supported image files with JSZip, and imports originals through the canonical `importGalleryFiles` path. Workflow #393 passed: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45581466549.
- `src/App.tsx` and `src/renderer/Viewport3D.tsx`: new Mask Layers start transparent; the mask compositor now treats transparent pixels as neutral and uses alpha × mask opacity to interpolate grayscale influence. The new mask is inserted next to its linked target. Workflow #396 is currently validating the latest combined source; do not mark this portion verified until it completes.

**Asset import status:** the six images are not yet present in the repository or a user's browser IndexedDB. The gallery now supports importing the supplied ZIP from the device running the app; select the ZIP in Asset Gallery → Import images / ZIP to populate the canonical Surface Textures category. Do not claim the six records are already imported until that operation has been completed and checked after reload.

Still not implemented: Mask Normal/Mix blend menu and adjacent-layer alpha-aware mixing; single-click mask-edit highlight; double-click X diagnostic preview and selection-overlay refinements; dedicated 3D→2D/subdivision invalidation; UV seam-crossing brush continuity; filter UV cut-out enforcement; Tear mesh-part scope; Matcap export/stacking; Pattern Craft material/export; Honeycomb world/normal mapping; gallery GPU/resource scaling; UI3 Undo/Redo investigation. These remain active in the order above.


## Latest verified source pass — 2026-11-25, Workflow #399

<badge>CI passed</badge> The following code is present in the #399 self-host artifact:
- Pattern Craft direct Filter menu command, preselected dialog mode — #389.
- Layers Add menu groups Paint Layer, Material Fill/import, Matcap, Mask, Tear and Group — #392.
- Right-click and touch long-press layer context actions; Add Mask Layer targets the exact selected layer and inserts adjacent to it — #392.
- Asset Gallery ZIP import uses JSZip and the existing canonical gallery importer — #393.
- Blank/transparent Mask Layer default and neutral transparent-pixel mask compositing — #396.
- 2D UV composite redraw listens to the coalesced `textureVersion` invalidation — #397.
- 2D UV and 3D viewports now receive the same resolved subdivision preview geometry; subdivision geometry commits advance UV/texture versions — #398.
- 3D paint event processing now interpolates intermediate screen-space surface samples and raycasts them, so sparse pointer events are less likely to skip a UV-island crossing; it resets UV-local paint paths per island while continuing the surface-space stroke — #399.

**Latest verified workflow:** https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45582213410 (run #399, passed). **Self-host artifact:** `15007545431`.

The six JPEGs are still not automatically present in the repository or browser IndexedDB. Download the supplied ZIP to the device running the app and use Asset Gallery → Import images / ZIP. Confirm six Surface Texture entries and reload persistence. The ZIP import feature is CI-verified; actual asset import has not yet been performed in the app.

### Still open after #399
- Mask blend menu and implementation: Normal (Pass Through) vs alpha-aware adjacent-layer Mix.
- Single-click mask-edit highlight toggle and double-click X light-grey/red diagnostic preview; selection overlay clarity.
- Full 2D UV preview parity for helper effects (Mask/Tear) and manual viewport/subdivision visual checks.
- UV seam interpolation requires visual acceptance on sphere, Suzanne and a deliberately split UV mesh; current algorithm is a focused sparse-event interpolation improvement, not proof every seam topology is solved.
- Filter UV cut-out limit remains distinct from mesh-part targeting and still needs code audit/enforcement.
- Tear mesh-part target scope; Matcap export/multi-layer stacking; Pattern Craft material/export; Honeycomb world/normal-space mapping; gallery GPU-tier auto-scale/resource packaging; UI3 oversized Undo/Redo investigation.

No visual/device acceptance is claimed. Workflow #399 confirms TypeScript/build/self-host sync/package only.


## Filter UV cut-out implementation — Workflow #402

Added `buildUVCoverageMask` in `src/tools/textureFilters.ts` to rasterise the active UV triangles without gutter dilation. Filter preview and Apply now carry this full-resolution write boundary. `transformTexturePixels` intersects UV coverage with the optional mesh-part mask and restores original pixels outside the intersection. `applyTextureFilterToCanvas` no longer dilates writes outside either boundary, and `App.tsx` refuses to apply when the active UV coverage is missing or dimensionally invalid.

Workflow #402 passed: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45582785922. Artifact: `15007890427`. This verifies TypeScript/build/self-host packaging only; visual checks for multiple UV channels, islands, gutters and selected mesh parts remain.

The implementation sequence now has source code for UV cut-out enforcement, but the 3D seam interpolation and 3D→2D/subdivision refresh still need manual visual acceptance. Remaining Mask Mix/edit/diagnostic UX and the Tear/Matcap/Pattern Craft/Honeycomb/GPU/UI3 backlog remain open.
