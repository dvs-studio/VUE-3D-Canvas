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
