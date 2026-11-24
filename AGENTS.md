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

> **Last code repair agent:** GPT-6 / LOG-2026-11-24-GPT6-REPAIR-PASS-02 — 2026-11-24  
> **Latest audit agent:** Gemini Hydrogen / LOG-2026-11-24-GEMINI-HYDROGEN-TROUBLESHOOT — 2026-11-24 (pinpointed P0–P2 report in AGENT_STATE.md).  
> **Remote main:** the audited P0 source fixes are committed to remote main; no manual git push is pending.  
> **Latest verification:** workflow #258 passed TypeScript diagnostics, Vite build, self-host sync, package validation and artifact upload. Artifact ID 14917995630.  
> **Next code agent picks up at:** A4 mesh-part filter selection → A5 verify → A6 → A7 → UI1 → 2A-W → 2A-T → 2B → 2C → 2D. Keep 2E verify-only. Victory’s manual acceptance checklist is in notes/SELF_HOST_P0_REPAIR_2026-11-24.md.

#### Step 0
- [x] **S0-1** UV seam continuity — cached per-triangle UV-island IDs based on shared geometric edges and matching UV coordinates; reset only affected stroke paths and retain the entry dab. Active UV channel/version is respected.
- [x] **S0-2** Powderiser double noise/100 — fixed to noise at line 363 (f551511).
- [x] **PERF-1/2** RAF gate + coalesced pointer events; pointer-up/cancel flushes final samples before ending stroke.
- [x] **PERF-4** Clone stamp temp canvas cached per stroke (f551511).
- [x] **P0 TS-1..5** audited TypeScript issues fixed; npm run lint is now required in CI.
- [x] **P0 UI-BUG-1..4** duplicate View menu, bulk action layout, Expanded Stack props and viewport toolbar overlap corrected.
- [x] **P0 EXPT-1** OBJ exports active geometry; glTF/FBX dialog receives active mesh.
- [x] **P0 FILT-1** RGB/RGBA/HSL tint parser corrected.
- [x] **P0 PAINT-1..2** UV-island seam detection, per-path reset, pointer capture and final queue flush corrected.
- [x] **UV coverage** 3D brush, eraser, pen, gradients, clone, smudge, blur and Mask Brush are clipped to active UV triangle coverage.
- [ ] Manual acceptance still outstanding: startup, Undo/Redo, symmetry, paint seam/clipping, export round-trip, pointer/touch and UI sizing. CI is not visual acceptance.
- [ ] **2E** Subdivision preview — verify only; do not redesign unless a reproducible regression is found.
- [ ] Continue remaining Step 0 regression scrutiny as part of manual acceptance.


#### Step 0
- [x] **S0-1** UV seam continuity — cached per-triangle UV-island IDs, per-path reset and entry dab; active UV channel/version respected.
- [x] **S0-2** Powderiser double `noise/100` — fixed to `noise` at line 363 (`f551511`)
- [x] **PERF-1/2** RAF gate + coalesced pointer events; pointer-up/cancel flushes final samples before ending stroke.
- [x] **PERF-4** Clone stamp temp canvas cached per stroke (`f551511`)
- [ ] Manual acceptance still outstanding: startup, Undo/Redo, symmetry, paint seam/clipping, export round-trip, pointer/touch and UI sizing.
- [ ] **2E** Subdiv preview — verify only

#### 2A Stabilisation
- [x] **A4** Filter mesh-part selection — App wiring, active-UV triangle mask, outside-part pixel preservation, preview mask and non-blocking portal dialog landed; CI passed. Manual component/edge acceptance remains.
- [ ] **A5** Filter panel title-drag — drag already implemented in TextureFilterDialog; **verify only** on desktop and touch.
- [x] **A6** 2D UV workspace — active UV channel selector, blend-mode-aware composite, resolution-aware canvases/rebake, cached selection shade canvas, shelf layout and scoped `N` shortcut landed; CI passed. Manual viewport acceptance remains.
- [x] **A7 / F8** Bump/Displacement → Levels — Levels now stored as non-destructive PBR metadata; original color pixels remain intact; height merge opens Levels at 100% bump influence; viewport, subdivision and XBlend height output consume the Levels data. CI passed. Manual PBR/export acceptance remains.
- [x] **UI1** Persist Window menu panel visibility and floating/docked state in browser storage; defaults remain backward-compatible.
- [x] **UI2** Menu dropdowns dismiss on outside pointer or Escape; pointer-leave no longer closes native selects.
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

### P0 audit repair status (2026-11-24)

See notes/SELF_HOST_P0_REPAIR_2026-11-24.md. The audited TypeScript, UI, OBJ export, RGB/HSL parsing, UV seam/pointer queue and UV coverage clipping defects have source fixes on remote main. Final CI run #258 passed with artifact 14917995630. Manual acceptance remains outstanding; 2E is verify-only.

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


### 2026-11-24 follow-up execution — A4, A6 and A7

Latest source revision: `9a123232144be0a979e7961dfa80a944c78e8c59`.

- A4 CI: [Run #262](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45387796699), artifact `14918105222`.
- A6 CI: [Run #265](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45388498049), artifact `14918012437`.
- A7 and combined latest package: [Run #283](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45389964959), artifact `14917704031`.

CI verifies TypeScript diagnostics, Vite build, self-host sync, package validation and upload only. No browser/device visual acceptance is claimed. Manual checks remain for part-filter isolation, alternate UV channels, rebake resolution, blend modes, title dragging, non-destructive color preservation, bump influence, height merge and XBlend/export round-trips. Built-in triplanar sample textures remain untouched pending user replacements.
