# Self-host handover

## PIN — read only this far

Same sets as `AGENTS.md`. `STOP` comes after History.

### To do — this set, not started

The ten numbered items in the `AGENTS.md` pin. How: [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md). Keep `release/vue3d-self-host-safety-2026-11-14.zip`.

### Current implementation

Not started. `f3b43f6` rewrote guides and did not change the painter. Do not continue that. Page `index-DXhSIj8p.js`.

### Current history — concluded set

2026-11-14 view set. Zoom redraws. The canvas follows the window. `index-DXhSIj8p.js`.

### History — concluded set

2026-11-12 filter set. Triplanar, Scatter, and Edge Wear open and stay off the view. The view sleeps while idle.

When the to-do set is concluded, move the filter set under `STOP`. Do not delete it.

## STOP

Read past this line only if absolutely necessary.

2026-11-09 navigation set, concluded. Free tumble, file normals, full Smooth, UV islands, `file://`.

Read this file first. The product to finish is the self-hosted painter. Do not start the Windows DirectX rewrite until Victory says this folder is accepted.

## Next task

Do [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md). The node editor is rejected. Painted layers become three switches with influence sliders. Material fill stays. Victory is slightly satisfied with the current page: it lags at the first moment, then settles. The safety copy of this folder before that work is `release/vue3d-self-host-safety-2026-11-14.zip`. Do not delete it.

On 2026-11-15 the other guides were aligned with this file. `file://` is allowed. Older sentences that forbid it, restore a refresh-rate control, or call for a 1-step undo are retired. The task above is the one to build.

## What to run

- Folder: `self-host/`
- Open `self-host/public/index.html` with `file://`, or `node server.js` / `npm run host` for `http://`
- Rebuild with `npm run host:sync`. That inlines the script and CSS so both `file://` and `http://` work.
- GitHub: Actions → **Build Self-Hosted Programme** (`workflow_dispatch` only). Victory clicks Run himself.
- Do not edit `crates/vue3d_core`. Do not add Python, native C, or a server just to show the UI.

## What already works

- Free tumble. No pitch lock. `src/renderer/freeCamera.ts`.
- Imported OBJ keeps file normals. Smooth blends every shared edge. Flat stays faceted. Def restores the file normals.
- Smart unwrap splits a closed mesh by the angle limit, packs islands into 0..1, and clones a vertex that would sit in two charts.
- Double-click selects a UV island. Right-click keeps the side of U = 0.5 under the cursor. Sculpt → Drag Island moves it.
- Layer Settings has a UV channel per layer. Node **Bake to Layer** replaces that layer's pixels.
- Gaussian Blur and Stitch open and apply. Their drag hooks are declared before `if (!isOpen) return null`.
- Session undo is 30. A `.xblend` file still stores 3.

## What is broken right now

Nothing from the zoom and resize report is still open in `index-DXhSIj8p.js`. Confirm on the tablet: zoom without panning, then rotate from portrait to landscape without reloading.

## Landed 2026-11-14 (`index-DXhSIj8p.js`)

- The main view redraws on wheel, pinch, and gizmo zoom. It still sleeps when idle.
- The canvas follows the container. A rotation should not leave a dead strip.
- Strokes skip mipmaps until the pen lifts. The buffer is capped so a GTX 1650 is not asked to draw a 4K view.
- Push about every 4 minutes while there are uncommitted changes. No empty commits.

## This session does

Done. See the landed list above.



## Landed 2026-11-14 (`index-D2VONoEr.js`)

- Triplanar, Scatter, and Edge Wear are a single fixed panel. They do not cover the 3D view with a full-screen layer, and they do not use `translate3d`.
- Edge Wear applies once. Scatter waits 50ms before the first preview. A lost WebGL context is asked to restore instead of staying black.
- Gaussian and Stitch are unchanged.
- The Windows exe only shows this page. Do not reimplement these filters in Rust.

## This session does

Done. See the landed list above. Push cadence while this work was open: about every 4 minutes, only when the tree has changes.



## Landed 2026-11-12 (`index-DwCqaqSC.js`)

- Triplanar, Scatter, and Edge Wear declare every hook before `if (!isOpen) return null`. Opening them no longer throws the React hook error that took the painter down.
- Scatter still hides when closed. Repeats are capped at 300 so a typed value cannot lock the tab.
- The 3D view draws while orbiting, painting, or after a texture change, and not faster than 60. It does not draw the bloom pass while idle. The refresh buttons stay removed.
- Pre-edit bookend is `ab1a766`. `crates/vue3d_core` was not edited.

## This session does

Done. See the landed list above.

## Later, do not do these until Victory asks

- Rewrite the Windows exe onto a real DirectX 11 device and an OpenGL context. The behaviour to copy is this self-host build, not a hello-world console.
- Make the node graph evaluate connections live. Bake-to-layer is enough for now.
- Bring back a frame-rate control on the web build. A cap belongs on the Windows exe later, if he wants one.
- Re-read the whole repository at the start of a session. Read this file, `AGENTS.md`, and `AGENT_STATE.md`, then the files you will edit.

## Bookend

Append a short note to `AGENTS.md` before the first code edit, and again after `npm run host:sync`. Append `API_DOCUMENTATION.md` only after the code works.


## Correction — 2026-11-14 evening

`LAYER_PBR_PLAN.md` now says: Edit shows Undo, then Redo, then Undo & Redo Settings. The node dock is removed and a UV dock says Coming soon. Import Texture stays and feeds the switches. Do not build the full-screen UV desk yet. Windows compile waits until Victory accepts this self-host page.


## Subdivision preview

`LAYER_PBR_PLAN.md` adds a Subdivision dock. Preview only. It follows sharp edges by angle and the combined bump. It never replaces the cage.


## Next task — 2026-11-16

`f3b43f6` rewrote guides and did not build `LAYER_PBR_PLAN.md`. Ignore that commit as a product change. The page is still `index-DXhSIj8p.js`.

Build the plan, including the `.xblend` zip and the Blender mix chains. The line below that says to make the node graph evaluate live is retired. The node panel is removed. Import Texture stays.

Until that page is verified, append notes only here, in `AGENTS.md`, in `AGENT_STATE.md`, and in `agents/<your-name>.md`. Push code every 3.5 minutes, not in the same commit as a guide rewrite. Do not edit `crates/vue3d_core`. Windows waits until Victory accepts this page and says to compile.


---

## 2026-11-17 — active execution scope

Victory authorised autonomous work on the self-host painter. Read the new 2026-11-17 section in `LAYER_PBR_PLAN.md` for the full checklist and UV backlog.

- Work only in the Vite/React/Three.js source under `src/`, then regenerate `self-host/public/index.html` with `npm run host:sync`.
- Do not modify `crates/vue3d_core`, native/Windows build files, or `release/vue3d-self-host-safety-2026-11-14.zip`.
- Temporary CSS gizmos stay until Victory supplies low-poly GLB assets. Axis colours: X red, Y green, Z blue. Defer mountain faded/acoustic paint styling to the asset pass.
- Subdivision panel is available both docked and floating. Keep Preview non-destructive; any actual Apply operation must be explicit, undoable, and export-safe.
- Eraser/brush input latency is the top performance issue. Coalesce texture notifications, avoid full composites and GPU resource rebuilds per dab, and measure before/after where possible.
- UV project remains documentation-only until Victory explicitly authorises its implementation.
- Build success and browser/device interaction verification must be reported separately.


## 2026-11-17 implementation checkpoint

- Paint notifications are coalesced per animation frame. Common 3D brush/eraser/pen/blur/clone/smudge strokes update only clipped dirty rectangles in the canonical colour composite; large-area tools use a full-composite fallback.
- Temporary CSS gizmos now use X red, Y green, Z blue and corrected front/back/top/bottom labels. Wait for Victory's future low-poly GLB assets before replacing the placeholders. Mountain faded/acoustic paint treatment is deferred.
- Subdivision panel is visible by default and supports docked/floating mode. Preview geometry exists; destructive Apply/undo-safe replacement is not yet claimed.
- Latest CI run: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44196595476 (success). Bundle `index-DwkyI3V_.js`. Artifact `VUE_3D_Canvas_SelfHost`, ID `14378169255`.
- Browser/device latency testing remains outstanding; no measured before/after numbers are available yet. Continue with the remaining checklist in `LAYER_PBR_PLAN.md`.


## 2026-11-17 follow-up — stroke trail and redundant rebuilds

- Dirty-region compositing now covers the segment from the prior pointer position to the current dab, as well as the bounds of symmetry points. It scales source rectangles for non-1024 layer canvases and falls back for dragged-dot/large-area tools.
- Mask-brush pointer updates no longer trigger full PBR texture rebuilds. Pointer-up relies on the canonical texture notification to trigger one PBR rebuild rather than invoking a duplicate directly.
- Latest code revision `d55a7ff` passed run `44197313538`; generated bundle `index-D6s9T1ZF.js`; artifact ID `14380475625`.
- Device responsiveness remains unmeasured. Manual test on Victory's target hardware is still required.


### 2026-11-18 — pre-execution: uploaded GLB gizmos, surface-normal responsiveness, navigator sync, permanent subdivision docker, HSL utility and triplanar source mode

Victory reports the eraser response is now manageable. The current bottleneck is the surface-normal mode toggle, which delays before the viewport updates, and the small Navigator preview synchronising its texture too slowly. Fix those two update paths without regressing brush/eraser responsiveness.

- Uploaded GLB assets are present at `self-host/public/assets/Gizmo/box.glb`, `sphere.glb`, `mountain.glb`, and `mountain_1.glb`. Inspect/load these real assets; do not keep treating the CSS placeholder as the intended gizmo model. Retain a robust fallback if an asset fails to load. Add clear axis colour coding and a separate **2D directional arrow with readable axis/direction labels**; the arrow is a screen-space overlay and must not be confused with a 3D model feature. Preserve all existing navigation hit targets/actions. Defer the mountain acoustic/faded paint styling unless already encoded in the supplied GLB.
- Replace the floating subdivision panel with a permanently docked tab/panel beside the Colour docker. It remains a visibility enhancement only: subdivision preview changes displayed geometry and never applies/replaces the source mesh. Remove/disable any Apply/commit subdivision affordance; retain explicit preview enable, algorithm, level and quality controls as appropriate.
- Extend the Colour docker with a Palette/HSL mode switch. Keep the current colour wheel and palette accessible in Palette mode; HSL mode presents visual Hue, Saturation and Lightness sliders with numeric feedback and live colour updates. Switching modes must preserve the chosen colour and existing hex/RGB entry behaviour.
- Triplanar source work is first in the remaining filters: each texture/fill instance must explicitly choose between its own tint/colour settings and the selected image texture. Make the boolean semantics unambiguous in UI, config, serialization and fill sampling. Do not reverse the earlier documented rule: enabled/checked = use that instance's own colours; disabled/unchecked = sample the selected image texture. Existing image-less rows must retain a sensible solid-colour fallback.
- Continue after triplanar with dynamic mesh-part inventory/isolation and the remaining filter backlog. UV work remains documentation-only; no UV implementation without explicit later authorisation.
- Before editing code, inspect current app/dock architecture, GLB file names and loader availability, surface-normal implementation and call sites, Navigator texture update effect, triplanar config and fill sampling, and existing colour picker state. Keep source changes within the self-host Vite/React/Three.js app. Never modify `crates/vue3d_core`, native/Windows build files, or the protected safety ZIP.
- Required verification: `npm run build`, `npm run host:sync`, CI package checks; clearly separate build success from browser/device latency testing. Record measured results only when actual timings are available.

This is the pre-execution specification. Do not mark any of these tasks complete until source changes and verification support it.


### 2026-11-18 — implementation checkpoint: gizmos, shading responsiveness, Navigator, subdivision/colour docks, triplanar and mesh inventory

Implemented in the self-host Vite/React/Three.js source:

- **Uploaded gizmos:** the box, sphere and mountain styles now load `self-host/public/assets/Gizmo/{box,sphere,mountain}.glb`, with `mountain_1.glb` as mountain fallback. The CSS models remain a load-failure fallback. A screen-space six-direction arrow overlay follows the model orientation and labels +X/-X (red), +Y/-Y (green), +Z/-Z (blue). The mountain acoustic/faded-paint treatment is intentionally deferred.
- **Surface-normal responsiveness:** geometry normal variants are cached per geometry; calculations use the full topology index even when part visibility changes. The on-demand viewport is explicitly woken after a normal-mode change, and normal recomputation was removed from the frequently-running material/layer update effect. Navigator no longer calculates normals twice on initial/model updates.
- **Navigator synchronisation:** one persistent 256×256 canvas texture replaces the full-resolution texture upload; a layout effect copies the newest composite and flags the existing texture for update.
- **Subdivision docker:** subdivision now sits permanently beside Colour (as an adjacent tab in the grouped docker, or a fixed docker in the expanded layout). It remains a non-destructive visibility preview; there is no Apply/commit subdivision workflow.
- **Colour docker:** Palette/HSL mode switch added. Palette mode retains the existing wheel and swatches; HSL mode exposes live Hue/Saturation/Lightness sliders. Hex entry remains available in both modes.
- **Triplanar source:** each texture row now has an explicit `useInstanceColor` setting. Checked samples the row's tint/alpha; unchecked samples that row's uploaded image. Legacy rows preserve prior behaviour by sampling an existing image unless explicitly switched to colour. Missing-image fallback remains solid colour.
- **Dynamic parts inventory:** built-in model parts and OBJ `o`/`g`/material sections are exposed as stable IDs/names. The Mesh Parts docker supports selection, per-part visibility, isolate, Show All and Frame Selected. The same filtered index drives viewport raycasting, and Navigator visibility follows the main view. The original geometry remains the save/export source; subdivision preview is bypassed while parts are hidden/isolated so part controls stay functional.
- **Remaining brush filters:** cached procedural pattern tiles now include powderiser, wood grain, hatching, cross-hatching, hashing, dithering and mosaic. Existing edge-wear/cavity and stochastic scatter engines remain available.
- **UV:** still documentation-only until explicit authorisation.

**Verification:** latest completed build/package checkpoint before the final frame-selected visibility tweak: run `44219296497` passed, generated bundle `index-3kZ9-qhy.js`, artifact `14390310542`. The final tweak is building in run `44219451453`; update this checkpoint after its result. CI is build/package evidence only. Actual GLB rendering, UI interaction, and device latency still require manual testing. No measured before/after timing is claimed.
