# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-22 late (Grok)

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Protected:** 3D viewport / paint path / accepted UV-island seam fix.

**Out of queue:** dedicated UV desk (NURBS/LTM/UDIM product) unless Victory asks.

**Prior agent claimed A1–A3 done** (CI only — not device proof).

### CURRENT TODO (ordered)

#### Step 0 — Immediate scrutiny (do first)
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
- [ ] **F1b** Mesh/UV influence switch (default off)
- [ ] **F2–F5** Cloth filter family (world cloth, wool/fur, cotton, bamboo-raft, wrap, strip stack)
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

Execute every unchecked item in **CURRENT TODO** above, in that order, in one pass: Step 0, then 2A, then 2B except F7, then 2C, then 2D. 2E is verify only. **Do not start HOLD-SEL.** F7 stays on hold. Self-host only. Do not edit `crates/vue3d_core`. Do not delete safety ZIPs. Do not change the accepted paint dab path or the accepted UV-island seam fix. A selection overlay, if HOLD-SEL is later approved, is an extra mesh, not a change to dab compositing.

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
