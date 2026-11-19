# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

A numbered line is one item inside a set. A history task is a whole set that has been concluded. Checking one line does not make a history task. The `STOP` line comes after History.

### To do — this set, not started

The page is still `index-DXhSIj8p.js`. This set mixes the work that was already assigned with the export work added after it. `f3b43f6` edited guides and did not start this set. Do not continue that edit. Build these, in `LAYER_PBR_PLAN.md`:

1. Toggle layers: colour and reflection, emission, bump with a ramp. One combined map each. A normal-locked layer is the only normal.
2. Edit menu is Undo, then Redo, then Undo & Redo Settings. Remove the ring label and the footer line.
3. Remove the node panel. The dock says UV Editor, Coming soon. Keep `Viewport2D`.
4. Keep Import Texture and Auto-Texture from Folder. They set the switches. They do not make nodes.
5. Triplanar preview, and a colour mix (rgba, hsla, hex, separate alpha) when no image is chosen.
6. Themes on the whole window. Sphere and mountain are each one shape. The badge says WebGL.
7. Subdivision preview only. It never writes the mesh.
8. Cheap first frame. `background.jpg` beside the self-host `index.html`.
9. Export a zip. Bake each layer. Old files still open. Blender builds one mix chain per channel into one Principled shader. See `XBLEND_FORMAT_SPECIFICATION.md` section 7 and the first lines of `BLENDER_ADDON_PROMPT.md`.
10. `npm run host:sync`. Do not edit `crates/vue3d_core`. Windows waits until Victory accepts this page and says to compile.

### Current implementation

In progress. Repository write access has been re-authorized. Active implementation is the self-hosted Vite/React/Three.js painter only. 2026-11-17 checkpoint: per-frame paint notification coalescing, dirty-region 3D brush/eraser composite updates, axis-coloured temporary gizmos, and a visible subdivision panel are landed. Full details and remaining work are in `LAYER_PBR_PLAN.md`. Preserve the concluded history below; do not edit `crates/vue3d_core`.

**Safety backup (do not delete or overwrite):**
- Canonical: `release/vue3d-self-host-safety-2026-11-14.zip`
- Also under the self-host folder: `self-host/vue3d-self-host-safety-2026-11-14.zip` (points at the release file; added 2026-11-19 so agents working only inside `self-host/` can find it without leaving the folder).

### Current history — concluded set

2026-11-14 view set. Done. Zoom redraws without a pan. The canvas follows a tablet rotation. Strokes skip mipmaps until the pen lifts. Bundle `index-DXhSIj8p.js`, commit `a1dd03d`. Victory was slightly satisfied. The first moment still lags, then it settles.

### History — concluded set

2026-11-12 filter set. Done. Triplanar, Scatter, and Edge Wear open, no longer cover the view, and the view sleeps while idle. Bundles `index-DwCqaqSC.js` and `index-D2VONoEr.js`.

When this to-do set is concluded, it becomes Current history. The view set becomes History. The filter set moves to the first lines under `STOP`. It is not deleted. A checked line stays inside its set.

## STOP

Read past this line only if absolutely necessary. The log below grows and is not deleted.

2026-11-09 navigation set, concluded, moved here so the pin stays short. Free tumble, file normals, full Smooth, UV islands, and `file://` on the inlined page. Do not rebuild it.

SEE_FULL_LOG_IN_PARENT_COMMIT_fbdcf54_AND_SELF_HOST_HANDOFF — temporary pin-only restore after accidental PLACEHOLDER overwrite. Re-append the long handover log from commit fbdcf54 if missing from git history.


### 2026-11-19 — UV viewport startup repair
The hosted app's blank-screen error was traced to `Viewport3D` referencing `uvGeometryVersion` in two effect dependency arrays without destructuring that prop from `Viewport3DProps`. This caused a render-time `ReferenceError` on both desktop and Android, before the UI could mount. Fixed by binding `uvGeometryVersion = 0` in the component props destructuring. Source commit: `e6c3201a0d3d93a540599ec21d2cab2eaca19458`. The 2026-11-14 safety ZIP remains untouched. Build/package verification is pending; do not describe the hosted runtime as verified until CI and manual device tests pass.


## 2026-11-19 — user-requested gizmo and interaction development checkpoint

Implemented source changes on the self-hosted painter:
- Box and Sphere orientation gizmos are now generated from built-in Three.js geometry in application code; they no longer require the external Box/Sphere GLB files. Their materials are replaced with axis-coloured, non-image materials. Box faces use solid axis colours; Sphere uses vertex-colour blending across axes.
- Mountain now has a built-in procedural fallback and a Mountain-only axis-colour influence slider. A user can select a replacement binary GLB; the model is loaded with GLTFLoader and its image materials are discarded/replaced by position-derived vertex colours. The selected GLB is stored in IndexedDB under the browser's local origin, not localStorage, to avoid its small quota. It remains on that browser/device and is not automatically synced to another device or included in exported project files.
- Subdivision preview level type and controls no longer cap the level at 2. Increasing levels remains user-controlled; memory and processing costs grow rapidly with each level.
- UV panel tab order now places Sculpt before Mirror, with updated tooltips.
- Wood Grain now generates opaque output even when the selected layer is initially transparent/empty, so the user does not need to pre-paint the layer.
- The Layer Filter dialog header supports mouse dragging and a double-tap touch drag gesture.

Source commits: 2fcff5500d6a8b589eed22ab1189fd4c4bde976c, 8637d1779a72f1e2a11b8dfd5b980c2be265ba36, 70217e62400998cfe578e9518288eb4e57fad58b, 576f0e91e3c4e48b2e6626063064b9844c2927ec, 5ed97845f1622b190ab6a46c5c41fb9e690f9a6e, and d249c4ba751bf41d7beeeda7024b8c48a43cddf7.

Remaining work in this request: Wood Grain still needs true object-space sampling derived from mesh positions/normals (not the current UV/image-space grain calculation); touch-drag support must be applied consistently to the other floating filter windows, not only Layer Filter; review and refine the full 2D UV tool information architecture beyond the initial tab-order adjustment. Confirm whether the built-in Mountain fallback's silhouette meets the intended design after visual testing. Build/CI and browser/device interaction tests have not yet been run for this checkpoint. Do not mark these remaining items complete based on source edits alone. The 2026-11-14 safety archive remains protected and unchanged.


## 2026-11-19 — follow-up implementation and verified self-host package

Follow-up changes completed after the initial checkpoint:
- Wood Grain now rasterizes the selected mesh's local-space position into the active UV target, then evaluates grain from those interpolated object coordinates. UV coordinates are used only as the destination address for writing the texture; grain direction and flow are derived from mesh position, so rotating/repacking UV islands does not rotate or stretch the grain pattern. The selected active UV channel is used to map the output to the current texture layout. The generated layer remains opaque even when the source layer was empty.
- Double-tap touch dragging has been added to the Layer Filter, Edge Wear, Gaussian Blur, Stochastic Scatter, Triplanar, Pattern Stamp, and Bump Levels windows. Mouse dragging remains available. On touch, the first tap arms the gesture and the second tap starts the drag on the title/header.
- Corrected BoxGeometry material ordering so +X/-X are red shades, +Y/-Y green shades, and +Z/-Z blue shades.

The complete source revision for this checkpoint is `e592e9e98d7199443b9131d843a0e422c2d8c3d0`. GitHub Actions run #136 (`44462561950`) passed every step: dependency installation, Vite production build, self-host sync, blank-package validation, generated-output commit, ZIP packaging, and artifact upload. Artifact `14500731368` (`VUE_3D_Canvas_SelfHost`, 1,065,779 bytes; SHA-256 `82940c38c45c0abab968104f218ddb60bea104e93b22f84248ee249c2c935854`) is available until 2027-02-17. Run URL: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44462561950

This is compile/package verification, not manual visual or touch-device validation. Please manually test Box face direction colours, Sphere blending, the Mountain fallback and uploaded GLB with image maps stripped, Mountain influence slider, IndexedDB persistence after reload, wood grain on an empty layer and across UV seams, high subdivision levels on representative meshes, and double-tap dragging on touch. Browser storage is local to the current browser/device and may be cleared by site-data cleanup; it is not a cross-device asset sync mechanism. The protected 2026-11-14 safety archive remains unchanged.
