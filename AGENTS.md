# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-23 (Grok-Atelier-PIN)

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Protected:** 3D viewport / paint path / accepted UV-island seam fix. **Carve-out:** S0-1 stroke continuity only as ordered.

**Agent identity:** Unique session id in `CONVERSATION_LOG.md`. This PIN author: **Grok-Atelier-PIN** / `LOG-2026-11-23-GROK-ATELIER-PIN`.

---

### EXECUTE NOW — one pass (Victory 2026-11-23)

**All items under CURRENT TODO below are active.** Do them **in one continuous pass** so Victory can investigate/test everything together.

- Work **top to bottom** (Step 0 → 2A → 2A-W → 2A-T → 2B → 2C → 2D).
- If one item is blocked, note why in `AGENT_STATE.md`, skip it, **continue the rest** — do not stop the pass.
- End with **`npm run host:sync`** (or equivalent) and a **short checklist** of what landed for Victory’s device test.
- Self-host only. Unique agent log id when you append `CONVERSATION_LOG.md`.

**Still excluded (need confirmation / hold — do not build):**
- **F7** Logo fabric — ON HOLD
- **HOLD-SEL** selection cage — until Victory acknowledges
- Dedicated UV desk / NURBS / LTM product — until Victory asks

**2E** = verify only (already done; fix only if broken).

---

### READ THIS FIRST — three boxes

**1. Tear layer (F1) = LAYER TYPE** — Black → layer below; White → torn edges; Green → stack mask. Not fabric multiply.

**2. Pattern Craft = FILTERS** — empty layer → B&W displacement pattern; painted layer → multiply/micro-detail into paint.

**3. Filter mesh/UV limit ≠ Tear panel target scope** — two controls.

---

### CURRENT TODO — all active for this pass

> **Last code agent:** Claude Sonnet 4.6 / `LOG-2026-11-24-CLAUDE-WORK` — 2026-11-24  
> **Latest audit agent (docs/troubleshoot only):** Gemini Hydrogen / `LOG-2026-11-24-GEMINI-HYDROGEN-TROUBLESHOOT` — 2026-11-24 (10 `tsc` errors + pinpointed P0–P2 bug list recorded in [`AGENT_STATE.md`](AGENT_STATE.md); **no `src/` edits in audit**)  
> **Push needed:** 3 commits local (`f551511`, `221e5cf`, `1768387`) plus pending doc updates. Victory should run `git push origin main` after reviewing.  
> **Next code agent picks up at:** P0 snapshot/compile/regression fixes in [`AGENT_STATE.md`](AGENT_STATE.md) (`TS-1..5`, `UI-BUG-1..4`, `EXPT-1`, `SUBD-1`, `FILT-1`, `PAINT-1..2`) → A4 completion → A5 verify → A6 → A7 → UI1 → 2A-W → 2A-T → 2B → 2C → 2D

#### Step 0
- [x] **S0-1** Stroke teleport — `raycastUV` returns faceIndex; island-crossing triggers endStroke+beginStroke; maxJumpPx guard added (`f551511`)
- [x] **S0-2** Powderiser double `noise/100` — fixed to `noise` at line 363 (`f551511`)
- [x] **PERF-1/2** RAF gate + getCoalescedEvents on paint pointer-move (`221e5cf`)
- [x] **PERF-4** Clone stamp temp canvas cached per stroke (`f551511`)
- [ ] Other regressions (UI3 giant Undo/Redo — could not reproduce; symmetry/boot/export — not yet checked)
- [ ] **2E** Subdiv preview — verify only

#### 2A Stabilisation
- [ ] **A4** Filter mesh-part selection — props added to TextureFilterDialog; **still needs:** App.tsx wiring + `targetMeshPart` in TextureFilterConfig + pixel mask in transformTexturePixels
- [ ] **A5** Filter panel title-drag — drag already implemented in TextureFilterDialog; **verify only**
- [ ] **A6** 2D UV tool shelf layout
- [ ] **A7 / F8** Merge bump/displacement → Levels → 100% bump
- [ ] **UI1** Persist window enable/disable
- [x] **UI2** Menu dropdowns dismiss on unfocus — click-outside handler added (`221e5cf`)
- [ ] **UI3** Giant Undo/Redo lower 3D viewport — could not reproduce; scan for oversized element

#### 2A-W Wood rings
- [ ] Uniform tree-year rings **and** organic fingerprint/merged rings; curvature-aware; world vs object — not phase-push only

#### 2A-T Triplanar / dual-texture fill
- [ ] True triplanar (3-axis + normal weights + sharpness)
- [ ] Texture A/B mix (noise/height/painted mask)
- [ ] World | object space; sample folder replaces built-ins
- [ ] Keep mesh-position / island-safe sampling

#### 2B Layer + Pattern Craft
- [ ] **F6** Mask layer
- [ ] **F1** Tear layer (roles in three boxes only)
- [ ] Tear panel mesh/target scope
- [ ] Filter-side mesh/UV limit (separate)
- [ ] **Pattern Craft** filters + if–else multiply vs displacement
- [ ] **M1** Matcap layer + narrow Add menu
- [x] Keep material import

#### 2C Additional filters
- [ ] Warp / wavy transform
- [ ] Pointillism
- [ ] Honeycomb / vector cells (tri/square/circle/hex; world+normal)
- [ ] Stochastic scatter

#### 2D Texture gallery
- [ ] Bundle → browser/device storage + preview; GPU-tier auto-scale; can share path with triplanar samples

---

### Triplanar correction specification

1. Mix A/B with factor from noise / height / mask.  
2. Height/slope-aware blend when useful.  
3. True triplanar: XY/YZ/ZX samples, `pow(|n|, sharpness)` weights.  
4. World vs Object coordinates.  
5. User sample folder overrides built-ins.  
6. Keep off-mesh NaN / gutter behaviour unless replaced safely.

**Detail:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md) · **Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) · **Pinpointed Bugs:** [`AGENT_STATE.md`](AGENT_STATE.md) · **API:** [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) · **Architecture:** [`DEVELOPMENT.md`](DEVELOPMENT.md)

### Work rules

Meticulous. Unique agent ids. Short commits. Do not damage accepted 3D view. Mark done in PIN only after code landed + synced (Victory still device-tests).

## STOP

Prior history in git. F7 / HOLD-SEL / dedicated UV desk remain excluded.
