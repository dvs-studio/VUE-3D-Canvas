# GPT-6 agent log

**Current status — 2026-11-22:** Phase A3, A1 and A2 are implemented; latest source `9525fba` passed self-host workflow #189 and generated output commit `0d04087`. Manual Victory visual confirmation remains pending. Next authorised slice: A4 filter mesh-part selection. Self-host only; preserve accepted viewport/UV behaviour and safety ZIPs.

## 2026-11-17 — self-host viewport checkpoint

- Read the pinned instructions, `AGENT_STATE.md`, `HANDOFF_PROMPT.md`, `SELF_HOST_HANDOFF.md`, and `LAYER_PBR_PLAN.md` before editing.
- Expanded `LAYER_PBR_PLAN.md` with the viewport/model/subdivision/filter backlog and detailed UV roadmap. UV coding remains blocked pending explicit user confirmation.
- Coalesced `notifyTextureUpdated` and added dirty-rectangle recompositing for common 3D painting tools, including eraser. Full PBR rebuild remains on stroke end; target-device latency still needs measurement.
- Updated temporary CSS gizmo axis colours and labels. Future GLB assets and mountain faded/acoustic treatment are deferred.
- Made the existing subdivision panel visible by default; dock/floating mode was already supported. Preview remains non-destructive; destructive Apply is not yet implemented.
- CI run `44196595476` passed and uploaded artifact `14378169255` (bundle `index-DwkyI3V_.js`). This is build/package evidence only, not browser interaction proof.
- Next: verify actual viewport responsiveness on device, complete dynamic mesh part isolation, filter/triplanar work, and decide the undo-safe destructive subdivision workflow. Keep `crates/vue3d_core` and the protected safety ZIP untouched.


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


## 2026-11-19 — hosted blank-screen repair
- Read `AGENTS.md`, `AGENT_STATE.md`, `SELF_HOST_HANDOFF.md`, `LAYER_PBR_PLAN.md`, `HANDOFF_PROMPT.md`, and `self-host/SAFETY_BACKUP.md` before touching source. Confirmed the canonical safety ZIP path and self-host reference; neither was modified.
- Root cause: `Viewport3D` effect dependency arrays referenced `uvGeometryVersion`, but the component parameter destructuring omitted it. The undeclared identifier throws during component render and blocks all UI mounting, consistent with the blank screen across desktop and Android.
- Fixed by adding `uvGeometryVersion = 0` to the destructured props. Existing type declaration and `App.tsx` prop wiring were already correct.
- Commit: `e6c3201a0d3d93a540599ec21d2cab2eaca19458`.
- Source diff verified. CI production build/package and manual desktop/Android checks have not yet been confirmed. Do not infer runtime verification from a successful compile alone.

## 2026-11-19 — self-host task implementation and package verification

- Read all 22 Markdown files on `main` before editing and followed the self-host-only scope. The filter/evening pack was already committed at `3c9983eff0c02e94da2728bba17711e09a717e51`; did not reapply the missing offline patch.
- Implemented Classic / RGB+ORM / AO×Albedo export-only map packages. AO is explicitly a height-derived cavity approximation, not true geometry or ray-traced AO.
- Added deterministic Smart UV quarter-turn rotation, persisted per-layer UV channel switching, and active-layer seamless texture gutter action.
- Routed Bump and Displacement through shared grayscale Levels conversion.
- Added desktop options-bar horizontal scrolling, 0.1%-step UI scale, Mountain GLB import/reset in Preferences using shared IndexedDB storage, and multi-select Merge / Move-to-Group.
- Corrected merge insertion to preserve original stack order and require matching PBR settings; hidden/locked layers are not consumed by Merge.
- Updated AGENTS.md, AGENT_STATE.md, SELF_HOST_HANDOFF.md, LAYER_PBR_PLAN.md, SELF_HOST_TASK_2026-11-19.md, API_DOCUMENTATION.md, self-host/README.md, and PATCH_README.md.
- Source revision `5ec840915c3812eacb68f1577659c1ab6b8509e2` passed workflow run #156 (`44480073408`). Generated self-host output commit `c26301294da0465d5402b6800fbd15dab39cae59`; artifact `14508410797` (1,076,269 bytes).
- CI proves build/package only. Manual desktop/Android/browser tests, export visual quality and performance, UV seams/rebake, Mountain persistence, Levels undo, and merge/group interactions remain outstanding. Protected safety ZIPs and crates/vue3d_core were not changed.


## 2026-11-22 — Phase A3 filter recovery

- Reviewed the current Markdown handovers, plans, implementation records and self-host documentation before editing. Followed the 2026-11-22 brief's recommendation to repair the existing filter suite before starting new filters.
- Deep-scanned `src/tools/textureFilters.ts`, `src/ui/TextureFilterDialog.tsx` and the `src/App.tsx` apply path. Confirmed the apply caller targets the active unlocked non-group layer, pushes undo, passes the full config, writes back to the same canvas and notifies the composite.
- Fixed Powderiser's output-ordering bug: source coverage is faded in a first pass; seeded dust fragments are alpha-composited in a second pass so later source pixels cannot overwrite earlier fragments.
- Added `woodFrequencyRandomization` (0–100, default 15), applied as seeded coarse spatial variation to band and ring frequencies, and exposed it beside the Band / wave frequency slider.
- Audited all eight kinds. The static branch/UI/apply checklist and object/world directional limitation are recorded in `SELF_HOST_BUGFIX_2026-11-22.md`.
- Source commits `6b614ed`, `fb3b68b`, `0ac87f4`; latest self-host build run #184 / ID `44965787108` succeeded, generated output commit `9185d39`, artifact ID `14731308126`.
- Two earlier workflow attempts lost the generated-output push race because later source commits had already advanced `main`; the final run on the latest source commit completed all steps. No build error was found.
- No browser/device visual test was performed. Victory still needs to confirm visible Powderiser breakup and Wood frequency variation.
- Next: A1 remove Squail and default Suzanne Head + Eyes; then A2 isolate and repair symmetry-on brush lag. Do not modify the accepted viewport or UV seam fix.


## 2026-11-22 — Phase A1 model menu

- Removed the `Squail (Built-in OBJ)` menu row and set `suzanneHeadEyes` as the initial `modelKey`, initial geometry, menu fallback selection and Viewport3D fallback.
- Kept the original `src/assets/Suzanne.obj` and legacy preset source intact; the old preset is simply no longer exposed as the Squail menu option.
- Source commits: `d78ccf6`, `792abd6`, `b2d33a2`. Workflow #187 / ID `44965932994` passed. Generated output commit `ad8ad2e`; bundle `index-DrqHAL6X.js`; artifact `14731482930`.
- CI confirms compilation/package only. Victory should verify that Head + Eyes is the model visibly shown at launch.
- Next: A2 symmetry-on brush lag and spanning gaps. Keep the normal brush path and accepted viewport/UV seam unchanged.


## 2026-11-22 — Phase A2 symmetry repair

- Root cause: `BrushEngine` is a singleton and stored primary/mirrored path spacing in one `lastDabPos`/residual state. Painting the mirrored coordinate overwrote the primary previous point; the next primary dab interpolated across the texture, causing lag and bridge marks. The incremental composite bounds also omitted the previous mirrored point and could clip the mirrored trail.
- Added per-path `BrushStrokeState` keyed as `primary`, `mirror-X`, `mirror-Y`, `mirror-Z` and `mirror-XY`. Dab spacing, residual distance, shape mode state and smudge pickup are now independent. Optional keys preserve existing callers; endStroke clears all states.
- Viewport3D now supplies stable mirror path keys and includes previous mirrored positions in the dirty composite rectangle. The normal primary path remains `primary`; no camera/viewport/UV geometry changes.
- Source commits `1969550` and `9525fba`; workflow #189 / ID `44966159076` passed all steps; generated output commit `0d04087`; JS `index-BusoztmT.js`; artifact `14731292622`.
- No pen/touch runtime latency or visual stroke test was performed. Victory should compare symmetry OFF with X/Y/XY/Z, including long fast strokes, small brush spacing, and the last mirrored segment.
- Next: A4 filter mesh-part selection. Keep accepted viewport and UV seam behaviour unchanged.
