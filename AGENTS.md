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
**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md)

**Testing:** Victory tests unless he asks the agent to test.

### Work rules

Meticulous. Short commits. Self-host only. Do not damage the accepted 3D view. Mark items done in PIN only after Victory accepts or code is clearly landed + synced.

## STOP

Prior PIN history in git.
