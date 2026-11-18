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

**Verification:** latest completed build/package checkpoint before the final frame-selected visibility tweak: run `44219296497` passed, generated bundle `index-3kZ9-qhy.js`, artifact `14390310542`. The final frame-selected visibility tweak passed run `44219451453`; the latest code revision and final package verification are recorded below. CI is build/package evidence only. Actual GLB rendering, UI interaction, and device latency still require manual testing. No measured before/after timing is claimed.


### 2026-11-18 — final verification update
- Latest code revision: `5cd8deab` (`Viewport3D` now uses a private geometry clone, so hide/isolate operations cannot mutate source geometry used by UV editing, saves or exports).
- GitHub Actions run [44219704658](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44219704658) completed successfully: install, production build, `npm run host:sync`, package identity checks, ZIP packaging and artifact upload all passed.
- Generated bundle: `index-BIQQ4eFN.js`. Latest artifact: `VUE_3D_Canvas_SelfHost`, ID `14390800060` (851,024 bytes; expires 2027-02-16).
- This verifies source compilation and packaging, not browser behaviour. Still require manual tests for GLB appearance/load path, all six gizmo arrows, HSL round-trip, mixed triplanar rows, part inventory/raycast isolation, subdivision source/export preservation, Navigator updates, and target-device surface-normal response. No latency measurements are claimed.


## Correction pass requested 2026-11-18 (pre-implementation checkpoint)

Required repairs: constrain Triplanar dialog width/height and numeric input fields; fix HSL toggle so palette wheel canvas remains mounted and usable; use viewport height based on dynamic visible screen (`100dvh`) with bottom overflow prevented; ensure Window-menu toggles actually remove dockers in all workspace modes; add Preferences values for gizmo label spacing/margin and font size; axis arrows should follow model-local axis directions, use brighter positive and darker negative colors, and fade occluded opposite directions; integrate repository OBJ `self-host/public/assets/suzanne.obj` as built-in **Squail**, subdivided once and with a simplified UV.

Filters must be image-layer operations (not brush-engine pattern presets). Wood Grain destructively writes into the selected image layer and exposes Image/Color source, edge, noise, bleed, and blur controls. Hatching, Cross-Hatching, and Hashing shift pixels in direction constrained to world/object space, with optional randomization. Bump conversion grayscale-converts the selected image and opens Levels-like controls (black input, white input, gamma, output black, output white) to tune tonal height influence.

Keep scope limited to the self-hosted app source; do not touch the native Rust workspace or protected safety ZIP. CI build/package is not browser validation; report manual validation still needed. This is a requirements checkpoint only, before source edits.

## Correction pass implementation checkpoint — 2026-11-18

Implemented in root self-host painter source (not native Rust):
- Triplanar dialog responsive width/height and input containment; drag bounds updated.
- Color wheel canvas stays mounted across Palette/HSL switches.
- App uses dynamic viewport height (100dvh).
- Grouped docker tab lists now filter by activePanels; Window menu includes Mesh Parts.
- Gizmo labels use plain X/Y/Z with direction arrows; positive axes are brighter, negative axes darker, and rear/opposing indicators fade. Preference controls added for radial label spacing and font size. These are projected overlay arrows/labels aligned to the model axis projections, not arrow geometry baked into the GLB.
- Selected-layer image filter dialog and image-processing engine added: Wood Grain (Image/Colour source, edge, noise, bleed/blend, blur), Hatching/Cross-Hatching/Hashing (pixel displacement), Powderiser, Dithering and Mosaic. Filters apply destructively to the active image layer, with an undo checkpoint and dialog preview. Preview downsamples to 320×320; Apply processes the full selected-layer canvas.
- Bump conversion now opens grayscale Levels (black input, white input, gamma, output black, output white), previews, then converts the selected layer image to grayscale before enabling bump.
- The repository OBJ self-host/public/assets/suzanne.obj is now imported as raw bundled text and used as the built-in Squail model; one Catmull-Clark subdivision is baked into preset geometry, and a simple planar UV is generated when OBJ has no UV attribute.

Known limitations / manual validation:
- Hatching displacement is currently computed in image/UV coordinates. Object/world axis options use a simplified angle mapping; exact per-model world/object-to-UV transform is not implemented yet.
- Gizmo arrow direction is a projected axis overlay; the actual gizmo GLB still has no embedded material. Verify axis label overlap, rear fade, and snapping in device/browser.
- Squail planar UV projection is intentionally simplified; validate seams/distortion and model bounds. OBJ subdivision and UV bake are CI compile-tested only.
- Wood Grain, hatching displacement, Bump Levels, dialogs, mobile sizing, docker toggles, and color-wheel persistence require manual interaction testing. No browser-level test or measured performance run has been performed.

Latest successful CI/package checkpoint: run 44269171028 (run #85), commit 92ad447447a0e9633e3d0efc649fff7aaa85e25e, artifact 14412325195 (VUE_3D_Canvas_SelfHost), 889,628 bytes, SHA-256 2bda18bb932c48b22da2bf40153893f6065c96bf791e81bda6bb5a2bf23b2124, expires 2027-02-16. Build/package pass does not establish browser behavior.

## Final correction-pass checkpoint — 2026-11-18

Additional source refinements after initial checkpoint: the built-in model dropdown now labels the retained compatible key `suzanne` as **Squail (Built-in OBJ)**. Directional filters combine selected UV/object/world axis preset with the angle-offset slider. Object/world modes remain approximate angle presets and do not yet use exact mesh-specific UV transforms.

Final source commit for this successful build: `cd1b12a2d8f100ef71cbccdaeab06496c1d05c3b`. CI run #97, ID `44269483757`, conclusion success. Artifact `14411732307`, name `VUE_3D_Canvas_SelfHost`, size 889,693 bytes, SHA-256 `f8d9cdcc6767686a39514b204f69859cde73aa16f62eaa3d6443175db174f0d0`, expiry 2027-02-16. Direct artifact page: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44269483757/artifacts/14411732307

Manual validation remains pending: test filter image/color sources and full-resolution overwrite/undo, bump levels/grayscale preview, responsive Triplanar inputs on phone and desktop, Window-menu docker toggles in grouped and expanded layouts, HSL/Palette repeated switching, gizmo positive/negative axis color and fade, preferences spacing/font, Squail model subdivided appearance and UV distortion. Exact world/object-to-UV directional constraints are still future work.

## Final post-gizmo implementation checkpoint — 2026-11-18

Latest gizmo refinement: six real Three.js ArrowHelper geometries are parented to the loaded gizmo GLB root, aligned to local X/Y/Z and therefore rotate with the model. Positive directions use brighter axis colors; opposing directions use darker colors and their opacity is reduced when pointing away from the camera. The X/Y/Z text labels remain projected screen overlays for legibility and preference-based spacing/font size.

Final successful build after the 3D arrows: workflow run #98 / ID 44269751711; commit 470c3b1da05ca1331fdce36dae016d8bc10786b8; artifact 14412042420 (VUE_3D_Canvas_SelfHost), size 891,319 bytes, SHA-256 1c65b4b191385e30b0d28e7351f03c687bc0a65bb450f2d9fe5e75977bb5d726, expiry 2027-02-16. Run URL https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44269751711

Manual testing still needed. The build confirms compile/package only; it does not prove arrow placement, label overlap, Squail subdivision appearance, UV quality, filter quality/performance, or phone/desktop layout. Exact world/object-coordinate-to-UV directional displacement remains unimplemented; those selections currently use simplified axis-angle presets.

## Repair pass — 2026-11-18 (post-user test feedback)

- Reverted the broken bundled `suzanne.obj`/Squail substitution. Built-in model is again the existing Suzanne preset, with no subdivision baked in. The bad packaged OBJ is no longer retained by the self-host sync. Wait for the user's replacement Suzanne OBJ/MTL package; it should include named separated objects and UV data. Do not subdivide the replacement model.
- Subdivision preview level control now uses decrement/increment arrow buttons rather than a range slider.
- Filter command and dialog are renamed **Layer Filter**.
- Wood Grain now supports a reorderable stack of colour/image sources, per-source numeric spreading density, and up/down/remove controls.
- Powderiser now breaks the selected layer into scattered fading dust fragments. A separate Noise Shader darkens pixels through randomized colour blending without geometric displacement.
- UV repair: Viewport3D's private geometry clone now receives typed UV channel arrays and active UV channel data; an explicit UV geometry version causes the clone and render to refresh after UV unwrap/channel selection/rebake operations. UV panel geometry updates also schedule texture composite refresh.
- Self-host sync now replaces generated app bundles from `dist` while preserving hand-maintained Gizmo GLBs and help/signature assets. This removes stale generated hashed JS/CSS bundles rather than leaving old versions in `self-host/public/assets`.
- Manual validation remains required for UV painting and export, wood source stacking, dust scattering, noise shader, and the replacement Suzanne import when supplied. No browser-level interaction tests or performance measurements are claimed.

## Self-host folder synchronization checkpoint — 2026-11-18

The latest successful self-host workflow is run #109 / ID `44308954895`. The build now commits the generated `dist` output into `self-host/public` and removes stale generated assets on each successful run. Commit `116b8d6a731df854ea36eeeea9c09ad2f3c5f533` (`chore(self-host): sync generated painter output [skip ci]`) contains the actual generated self-host output. Current public assets include the latest hashed app JS/CSS plus the four preserved Gizmo GLBs; old hashed bundles and the faulty `suzanne.obj` are removed. The build also preserves help PDFs/DOCX and signature assets.

Artifact `14430270038`, name `VUE_3D_Canvas_SelfHost`, size 1,061,477 bytes, SHA-256 `c3e0d496d7141f32a58c604a5dc7fc9faaee576d28823809717561183721ad80`, expires 2027-02-16. Run URL: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44308954895

Manual testing remains required for UV edits updating the 3D material and texture mapping, UV save/export, stacked wood source output, powder dust scattering, noise-shader darkening, and subdivision arrow controls. The replacement separated-item Suzanne OBJ/MTL is pending from the user; do not reintroduce the previous faulty OBJ, and do not bake subdivision into the replacement model.
