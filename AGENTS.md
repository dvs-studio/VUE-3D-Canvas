# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-22 late (Grok)

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Protected:** 3D viewport / paint path / accepted UV-island seam fix. **One carve-out, ordered by Victory 2026-11-22:** Step 0 item S0-1 (stroke teleport across UV islands) may touch the stroke-continuity code in `Viewport3D.tsx` and `brushEngine.ts`, minimally, and only after the root cause is shown. Nothing else in those files changes.

**Out of queue:** dedicated UV desk (NURBS/LTM/UDIM product) unless Victory asks.

**Prior agent claimed A1–A3 done** (CI only — not device proof).

### CURRENT TODO (ordered)

#### Step 0 — Immediate scrutiny (do first)
- [ ] **S0-1 Brush stroke teleports across UV islands (new, Victory 2026-11-22; investigate first, then fix)**
  - Symptom: symmetry now works, but when the brush passes over a UV island boundary in the 3D viewport, paint jumps to the next position and draws a straight line across the whole texture. The 2D viewport shows the line. Areas the brush never touched get a flash or splash. Example: a stroke through the centre of the head paints the frontal lobe immediately, while the brush is on a different spot.
  - Likely class of bug (hypothesis, verify, do not assume): this matches the A2 root cause in `AGENT_STATE.md` (the 2026-11-22 "A2 symmetry repair" entry). `BrushEngine.paintDabs` interpolates dabs in texture pixel space between `lastDabPos` and the new point. A raycast UV is not continuous across islands or seams, so two consecutive pointer events on neighbouring 3D surface can land on distant texels, and the engine fills the gap with a line. A2 fixed this for primary vs mirror paths, not for island-to-island moves. Also check the `uv === null` path (pointer leaves the mesh and re-enters elsewhere), `updateStabilizer` (lazy-mouse state may carry the old position), and the curve and smudge paths, which keep their own previous point.
  - Investigate first. Read `Viewport3D.tsx` (pointer down/move, `raycastUV`, `executePaintTool`, `applyDabAt`, the mirrored loop) and `brushEngine.ts` (`beginStroke`, `paintDabs`, `getStrokeState`, `lastDabPos`, residual). Write the confirmed root cause in `AGENT_STATE.md` before editing. Test with a stroke that crosses a seam on Head and on Eyes, symmetry OFF and X/Y/XY/Z.
  - Fix direction (choose by evidence): detect a discontinuity (large texel jump relative to the brush size and the pointer's screen motion, or a changed `faceIndex` whose UV island differs from the last), then restart that stroke path at the new point with no interpolation, for primary and every mirror path. Better, if cheap: sub-step the pointer segment in screen space, raycast each step, and dab only where a hit exists, so a stroke follows the surface across a seam without a bridge. Do not add padding, change dab compositing, or touch the accepted filter/UV seam fix.
  - Done when: a slow and a fast stroke across a seam leave no bridge line in the 2D view, and a normal stroke inside one island is pixel-identical to before. Victory tests on device.
- [ ] **S0-2 Powderiser still broken — full programme scrutiny of the self-host project (Victory 2026-11-22)**
  - Symptom: the Powderiser filter still does not work after the two-pass scatter fix (A3). Other filters may be broken too. Do not guess from the last fix; find where the filters broke.
  - Scrutinise the whole filter path, not one function: `src/tools/textureFilters.ts` (every kind: wood, hatching, cross-hatching, hashing, powderiser, noise-shader, dither, mosaic; `cfg.kind==='powderiser'` branch), `src/ui/TextureFilterDialog.tsx` (config defaults, which fields reach the engine, preview vs apply), the apply caller in `src/App.tsx` (target canvas, undo push, composite notify, selection and mesh-part limits), `src/tools/brushEngine.ts` and `src/ui/ToolOptionsBar.tsx` / `PatternStampDialog.tsx` (cached pattern tiles that also include powderiser), `src/core/types.ts` (config types and defaults). Look for: a const read before its declaration (the Wood `woodSeed` bug was this class), NaN or undefined config fields, a seed that is never set, alpha ending at 0, results written to the wrong canvas, preview working while apply does not, a `try/catch` that swallows a throw, and a default that makes the effect invisible. Run it, do not only read it: build, load the page headless (Playwright, if the container has it) or a Node harness over a test canvas, apply each filter with defaults and print a pixel-diff, and report which filters change pixels and which do not.
  - Backup reference: the canonical safety snapshot is `release/vue3d-self-host-safety-2026-11-14.zip` (valid, 2026-11-14). It holds only the built page (`self-host/public/index.html`, `self-host/public/assets/index-DXhSIj8p.js`, `self-host/server.js`), not `src/`. Use it as a runtime comparison: extract it into a new empty directory under the scratchpad, serve it, and compare that build's Powderiser and filter output against the current build. Its filter code is minified, so grep it for `powder` to read the old logic, and do not copy it blindly. The file `self-host/vue3d-self-host-safety-2026-11-14.zip` is a 48-byte text pointer to the release file, not a zip. Never delete or modify either. For source history use `git log -p -- src/tools/textureFilters.ts` and the commits recorded in `AGENT_STATE.md` (`0ac87f4`, `9185d39` for A3).
  - **CONFIRMED ROOT CAUSE (Claude Sonnet 4.6, 2026-11-22 read-only pass):** `transformTexturePixels` declares `noise = cfg.noise/100` at line 273 (shared for all filters). The Powderiser block at line 363 then does `strength = clamp(noise/100, 0, 1)` — dividing by 100 a second time. With default `cfg.noise=25`, `strength ≈ 0.0025`. Pass-one selects pixels only where `hash < strength`, so ~0 pixels are selected and pass-two composites nothing. **Fix: change line 363 from `noise/100` to `noise` (already a 0–1 fraction).** Full details and all other filter root causes in `INVESTIGATION_2026-11-22.md`.
  - Record the root cause per broken filter in `AGENT_STATE.md`. Fix each one. Keep the Wood Grain frequency randomisation and the UV-island filter edge fix intact.
- [ ] Self-host regressions after last fixes (diagnose/last-command not launching, filters, symmetry, boot, Head+Eyes default, paint, export)
  - Code scan found and fixed a Wood Grain runtime failure: woodSeed was read for frequency jitter before its const declaration. Self-host sync is committed at 297f230 with bundle index-CqmOQpy4.js; remaining runtime checks are still pending.
- [ ] Spot-check **2E** subdiv preview docker (done — verify only; fix only if broken)

#### 2A — Stabilisation chrome — OPEN
- [ ] **A4** Filter mesh-part selection (outside parts unchanged)
- [ ] **A5** Filter panel title-drag without hang/glitch
- [ ] **A6** 2D UV tool shelf — original location; group/spacer; top-left except N-panel
- [ ] **A7 / F8** Merge convert-to-bump & convert-to-displacement → one Levels → 100% bump
- [ ] **UI1** Persist last enabled/disabled window items across session/reload
- [ ] **UI2** Menu-bar dropdowns dismiss on unfocus
- [ ] **UI3** Giant Undo/Redo in lower 3D viewport (gizmo-style, large/touch-friendly, existing stack, safe bottom margin)

#### 2B — Layer technology — OPEN (after Step 0 + 2A healthy)
- [ ] **F6** Mask layer (beside / independent targets)
- [ ] **F1** Torn fabric (convert; black/white/green; procedural edges; export apply/restore)
- [ ] **F1b** Mesh/UV influence switch (sub-control of F1 torn fabric layer — governs which mesh UV islands its stacking influence reaches; default off)
- [ ] **F2–F5** Pattern Craft filter family — world cloth, wool/fur, cotton, bamboo-raft, wrap, strip stack (renamed from "Cloth filter family" per Victory 2026-11-23)
- [ ] **M1** Matcap layer + narrow Add menu
- [x] Keep import material texture (do not remove)
- [ ] **F7** Logo fabric — **ON HOLD** (not open until Victory go-ahead)

#### 2C — Additional filters — OPEN (after existing filter suite healthy)
- [ ] Warp / wavy layer transform
- [ ] Pointillism
- [ ] Honeycomb / vector cells (tri / square / circle / hex; world + normal)
- [ ] Stochastic scatter

#### 2D — Texture gallery — OPEN (later in same era)
- [ ] Bundle → browser/device storage + preview; GPU-tier auto-scale (e.g. 1K → 256 mobile)

#### 2E — Subdiv preview docker — DONE (verify only)
- [x] Implemented per Victory — agent only confirms still works

**Detail docs:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md) · [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md)  
**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) — append only. Read it only when a bug names an older day.

**Testing:** Victory tests unless he asks the agent to test.

### Next agent — after Victory's next reply, not before

Victory has replied (2026-11-22 evening): go. Execute every unchecked item in **CURRENT TODO** above, in that order, in one pass: Step 0 (S0-1 and S0-2 first, then the existing regressions item), then 2A, then 2B except F7, then 2C, then 2D. 2E is verify only. Victory wants to test the new layers, the filters, and every outstanding item in one session, so land them all, sync once at the end with `npm run host:sync`, and give him a short checklist of what to test. If one item is blocked, record why in `AGENT_STATE.md`, skip it, and finish the rest; do not stop the pass. **Do not start HOLD-SEL.** F7 stays on hold. Self-host only. Do not edit `crates/vue3d_core`. Do not delete safety ZIPs. Do not change the accepted paint dab path or the accepted UV-island seam fix. The only exception is the S0-1 stroke-continuity carve-out. A selection overlay, if HOLD-SEL is later approved, is an extra mesh, not a change to dab compositing.

### HOLD-SEL — selection cage (do not build until Victory acknowledges)

Id: `HOLD-SEL-2026-11-22`. Status: specified, not accepted, not started. This is not F6 (the mask layer). F6 erases other layers. HOLD-SEL is a transient edit selection.

Two tools write the same kind of coverage and must not share a widget:

| | Selection utility | Mask brush (`mask_brush`) |
|---|---|---|
| Identity | Vector cage. Cyan. Menu word is Selection. | Painted selector. Green. No ants. |
| Makes a layer? | No. | No. It is still a selector. |
| Edge | Marching ants, unless feathered. | Soft painted edge. Own Clear, Invert, Smooth, Rough, Edge shift. |
| Dim | Unselected texels × 0.90 brightness. | Same 10% dim, so the model stays readable. |

What exists now, and why it is not enough:

- `SelectionMask` in `src/core/types.ts` is a rect, ellipse, polygon, lasso, brush, or bitmap, plus `inverted` and an optional `maskCanvas`. There is no feather radius and no remembered selection.
- `src/tools/maskEngine.ts` already rasterises that mask and can expand or shrink it. `src/ui/panels/MaskPanel.tsx` calls those for the mask studio. There is no Selection menu.
- `src/renderer/Viewport2D.tsx` tints the unselected UV area at about 65% black. Victory wants 10%, not a dark veil.
- `src/renderer/Viewport3D.tsx` only prints a "Selection Mask" label. The surface itself does not show the selection. A screen rectangle is not the request. The cage has to lie on the model.

Procedure, when he says to build it:

1. Keep one 1024 mask. `MaskEngine.rasterizeMask` remains the source. Add `featherRadius` (pixels, default 0) and do not invent a second mask type. Geometric tools become a bitmap after Grow, Shrink, or Feather so later edits share one path.
2. Remember the last active mask in a ref. The Selection menu is Select all, Deselect, Reselect, Inverse, Grow, Shrink, Feather. Deselect sets `active` false and keeps the copy. Reselect restores it. Inverse flips coverage. Grow and Shrink call the existing expand and shrink, then re-rasterise. Feather blurs alpha by the radius. None of these bake a paint layer, and none of them switch the tool to the mask brush.
3. Project the result on the mesh. Build a canvas the same way paint does: canvas Y is `(1 - uv.y) * height`. Put it on a second mesh that shares the model geometry, `MeshBasicMaterial`, transparent, `depthTest`, `polygonOffset`, no lighting. That is the fake 3D surface. Do not draw the cage only in screen space.
4. Hard edge, feather 0: marching ants. Once per selection change, store the edge pixels (coverage crosses 0.5 and a neighbour does not). Each frame only advances a dash offset, `(x + y + frame) % period`, and uploads that overlay. Do not rebuild the 1024 mask every frame. While the cage is visible the view may redraw at about 15 fps. When nothing is selected, stop that loop so the idle skip stays.
5. Feather greater than 0: do not run ants. The band whose alpha is between about 0.05 and 0.95 blinks, `0.25 + 0.55 * sin(time)`, in a broadcast cyan. Interior stays selected and steady. Exterior stays dim. The blink replaces the Photoshop dash only on the faded edge.
6. Dim both tools by drawing `rgba(0,0,0,0.10)` over unselected texels on that same overlay. Selected texels stay clear. Do not reuse the 65% 2D veil.
7. Mask brush keeps its own options, even though the coverage math matches: Clear (empty the brush mask, not the vector selection), Invert, Smooth (box or Gaussian on alpha), Rough (a seeded high-frequency break-up of the edge only), Edge shift (dilate or erode, separate from the Selection Grow/Shrink menu). Status text must say "Mask brush" or "Selection cage" so the user can tell them apart.
8. Painting, filters, and fill keep using `SelectionTool.isPointInSelection`. The overlay is display-only.

Do not start this item as part of the one-pass todo. Wait for Victory's acknowledgement. Expansion he has not ordered yet: move or scale the cage, save the selection as a channel, select a mesh part (Head, Eyes) into the same mask, colour-range select, a screen lasso raycast onto the surface, and a later bridge into the F6 mask layer. None of those are in the first build.

### Work rules

Meticulous. Short commits. Self-host only. Do not damage the accepted 3D view. Mark items done in PIN only after Victory accepts or code is clearly landed + synced. Push while the tree is dirty, about every 2.5 minutes, code and notes in separate commits. No empty commit. No force-push.

## STOP

Prior PIN history in git.
