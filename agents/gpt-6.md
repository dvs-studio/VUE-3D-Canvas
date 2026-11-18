# GPT-6 agent log

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

**Verification:** latest completed build/package checkpoint before the final frame-selected visibility tweak: run `44219296497` passed, generated bundle `index-3kZ9-qhy.js`, artifact `14390310542`. The final tweak is building in run `44219451453`; update this checkpoint after its result. CI is build/package evidence only. Actual GLB rendering, UI interaction, and device latency still require manual testing. No measured before/after timing is claimed.
