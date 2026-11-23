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

#### Step 0
- [ ] **S0-1** Stroke teleport across UV islands (investigate, then minimal fix)
- [ ] **S0-2** Powderiser / filter suite (fix double `noise/100`; audit all kinds)
- [ ] Other regressions (diagnose UI, symmetry, boot, Head+Eyes default, paint, export)
- [ ] **2E** Subdiv preview — verify only

#### 2A Stabilisation
- [ ] **A4** Filter mesh-part selection
- [ ] **A5** Filter panel title-drag
- [ ] **A6** 2D UV tool shelf layout
- [ ] **A7 / F8** Merge bump/displacement → Levels → 100% bump
- [ ] **UI1** Persist window enable/disable
- [ ] **UI2** Menu dropdowns dismiss on unfocus
- [ ] **UI3** Giant Undo/Redo lower 3D viewport

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

**Detail:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md) · **Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md)

### Work rules

Meticulous. Unique agent ids. Short commits. Do not damage accepted 3D view. Mark done in PIN only after code landed + synced (Victory still device-tests).

## STOP

Prior history in git. F7 / HOLD-SEL / dedicated UV desk remain excluded.
