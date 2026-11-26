# Stop point — Grok Build — 2026-11-26

**Agent:** Grok Build  
**Id:** `LOG-2026-11-26-GROK-BUILD-PASS`  
**Repo:** https://github.com/dvs-studio/VUE-3D-Canvas  
**Branch:** `main`  
**HEAD when this note was written:** `df354b326580df270b0b123d891d7f30a247f7a6` (`df354b3` — "Mark UV cut-out implementation landed")  
**Working tree at the stop:** clean. No `src/` edit from this agent yet.

This note is the resume point. The prompt Victory pasted on 2026-11-26 wins wherever `AGENTS.md` or the 2026-11-25 notes disagree. Do not treat workflow #399, #402, #386, #320, or anything older as proof of this pass.

## What this agent already did

- Read `AGENTS.md`, `CONVERSATION_LOG.md` (including `LOG-GROK-VUEEDGE`), `LAYER_FABRIC_MASK_PLAN.md`, and the notes named in the prompt, plus the other project markdown.
- Confirmed Pattern Craft is **not** wired into `src/tools/stitchStudio.ts` or `src/ui/StitchStudioDialog.tsx`. Jenny stays the path-stitch tool. Do not add a link. Nothing to remove unless a later edit adds one.
- Mapped the code. Did **not** change `src/`, did **not** run `npm run host:sync`, did **not** push a painter bundle, did **not** run a visual test.
- Wrote three local skills in the sandbox only (`vue3d-threejs-paint`, `vue3d-rust-boundary`, `vue3d-fastapi-assets`). They are not in this git repo. The rules that matter are copied below.

## Do not touch

- `crates/vue3d_core`
- Any ZIP (do not delete)
- `src/assets/Suzanne.obj`
- `src/assets/Suzanne.head-eyes.obj`
- PR #2 (do not merge)
- F7 Logo fabric
- HOLD-SEL marching ants, feather blink, cyan cage, and the 2D 65% veil
- Dedicated UV desk, NURBS, LTM
- Fake stand-in gallery images
- A second gallery database

Victory tests. Do not run a visual test pass unless he asks.

## Continue in this order

1. **Undo the 2D subdivision coupling.** `src/App.tsx` builds `subdivisionPreviewGeometry` and the effect around the `useMemo` bumps both `uvGeometryVersion` and `textureVersion` when that geometry identity changes. Both viewports receive it:
   - 3D keep: the ternary near the `Viewport3D` `geometry=` prop.
   - 2D change: `Viewport2D` `geometry=` must be `activeGeometry` only. Subdivision preview stays in the 3D view.
   - 2D still redraws from `textureVersion` when pixels change. Do not drive the 2D view from the subdivision mesh.
2. **Eraser lag and brush draw.** Do not rebuild `paintDabs`.
   - `src/renderer/Viewport3D.tsx` `flushPendingPaintEvents` raycasts up to 16 samples and each sample calls `executePaintTool`, which restacks every visible layer in the dirty rect. Move that restack to **once per flush**, union of dab bounds. Keep UV-island clip and the island `endStroke`/`beginStroke` reset.
   - On a UV jump (`hypot > brush.size * 4`), do not keep skipping. Reset the UV path at the new point and stamp once, same as an island cross. Do not draw a bridge.
   - Live composite must `clearRect` the dirty rect (transparent), not fill `#2b2b2b`, so erase shows the checker and lower layers.
   - `src/renderer/Viewport2D.tsx` `execute2DPaint` blits only the active layer with `source-over`, so `destination-out` holes do not show until a later full redraw. Clear the dirty rect and draw the visible stack into it.
   - Eraser stays `destination-out` in `src/tools/brushEngine.ts` `renderSingleDab`. No full-canvas `getImageData` on that path.
3. **Base Layer scale.** Add `tileScale` to `BaseLayerSettings` (`src/core/types.ts`), default `2`. Slider in `src/ui/BaseLayerSettingsDialog.tsx`. Live via `updateBaseLayerSettings`. Save stores it with `colorA` and `colorB` in `vue3d_base_layer_colours` (`src/App.tsx` `saveBaseLayerSettings`). Close keeps the live value. Reset restores scale with `#9c9c9c` and the opacities. In `src/renderer/Viewport3D.tsx` shader, replace `mix(2.0, 4.0, vueCurvature)` with a `vueBaseTileScale` uniform. Curvature must not override the slider. Bump `customProgramCacheKey`.
4. **Accordion N-panel in both UV layouts, plus the combo-view drag handle.** `src/ui/UVNPanel.tsx` is exclusive tabs. Make accordion groups (Display, Unwrap, Channels, Sculpt, Mirror, and the loose zoom/overlay controls). Same component in combined and separate 2D (`Viewport2D` already mounts it once). Remove loose floating UV controls from `src/renderer/Viewport2D.tsx` (top-right zoom cluster and the duplicate Smart UV modal). Pen path menu can stay a pointer menu. `src/App.tsx` split is hard `w-1/2`. Add a pointer and touch drag handle on the divider (`touch-action: none`, pointer capture).
5. **Rasterize, one Displacement/Normal submenu, Matcap, mask/selection.**
   - Right-click Rasterize on every special type, including Matcap and Material Fill (`src/ui/panels/LayersPanel.tsx` context menu). Bake to a normal colour paint layer. Undo restores the original.
   - Material Fill bakes its projection. Tear or Mask bakes what is actually visible.
   - Matcap: gallery image is the material. Paint writes alpha only, not colour into the cookie. Store JPG, not EXR. Rasterize summarises strong colours toward weaker ones, then adds 20% of the colour across the middle line. Until rasterized, Blender export for this layer only is view-based matcap mixed with MixRGB. Not the old HDRI vs chrome/ceramic/clay switch.
   - Put Displacement and Normal in one submenu. Displacement must become real greyscale (`src/tools/layerConversions.ts` `convertToDisplacementMap`). Normal stays tangent-space. Bump Levels stays the greyscale adjustment after displacement.
   - Selection is drawn on the 3D model, not a text label only (`Viewport3D.tsx` currently has a text status near the bottom). A preference darkens or lightens that feedback. Do not redesign the 2D UV veil. The preference must not change stored mask colours.
   - Mask is a real layer. Any brush paints it. Greys are strength. New mask starts blank. Transparent pixels do nothing. A clip mask keeps its stored pixels. Normal affects only the linked layer beside it. Mix uses only the layer directly above and the layer directly below.
6. **Redo Pattern Craft and the triplanar mixer** on the real filter/fill code.
   - `src/tools/textureFilters.ts` `pattern-craft` (~line 613): empty layer → black-and-white pattern. Painted layer → multiply micro-detail into existing paint only. User paint (coverage/alpha) is the limit. Do not invent colour outside it.
   - `src/tools/fillSuite.ts` triplanar mix (~line 511): two textures A and B, mixed by noise, height, or a painted mask, three-axis projection and normal weights, world or object space. Keep mesh-position sampling (`surfaceFrame`). An empty mixer factor must not wipe the paint.
7. **Gallery.** One store: `src/tools/assetGallery.ts`. Originals and thumbnails are separate. Cards show "Preview" / a broken image when the thumbnail blob is missing or the object URL was revoked (`src/ui/AssetGalleryModule.tsx`, `src/ui/GalleryAssetPicker.tsx`). Repair display from the real original blob. Do not commit fake images. Import `Texture integration.zip` only when the file is actually supplied (six JPEGs: autumn leaf veins, brown animal fur, lush lawn grass, rusty metal, dark walnut, weathered wood). After import, each card shows a real picture, survives reload, and is selectable by Triplanar, Material Fill, Brush stencil, Brush image texture, Pattern Stamp, Mask, Tear, and Matcap.
8. **Ship.** Short commits. `npm run host:sync`. Push. A push of `src/**` starts `build-self-host.yml`. After it finishes, pull `main` and confirm the new commit is `chore(self-host): sync generated painter output` that contains these changes. Open `self-host/public/index.html` and quote a string that exists only in this pass, the new workflow run number, and the new bundle filename. Say clearly that the old run was not used as proof. Append `CONVERSATION_LOG.md` only. Do not rewrite older sections.

## Useful line bookmarks (as of `df354b3`)

| Topic | Where |
|---|---|
| Subdivision geometry + lockstep effect | `src/App.tsx` ~541–559 |
| 3D / 2D geometry props | `src/App.tsx` ~2294 and ~2333 |
| Base save | `src/App.tsx` `saveBaseLayerSettings` ~370 |
| Checker curvature | `src/renderer/Viewport3D.tsx` ~1196–1225 |
| Eraser restack | `src/renderer/Viewport3D.tsx` `executePaintTool` ~2050, flush ~2154 |
| Jump skip | `src/renderer/Viewport3D.tsx` ~2237 |
| 2D paint blit | `src/renderer/Viewport2D.tsx` `execute2DPaint` ~880–920 |
| Pattern Craft | `src/tools/textureFilters.ts` ~613 |
| Triplanar mix | `src/tools/fillSuite.ts` ~511 |
| Layer menu | `src/ui/panels/LayersPanel.tsx` ~595 |
| Conversions | `src/tools/layerConversions.ts` |
| Gallery thumbs | `src/tools/assetGallery.ts`, `src/ui/AssetGalleryModule.tsx` |

## Git file for AI Studio

A single-file git bundle of `main` at this stop, including this note, is uploaded beside this document. It is not a zip of the working tree and it is not a second remote. See the chat message for the exact filename and the three commands that open it.
