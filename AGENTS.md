# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-23 (Grok-Atelier-PIN)

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Protected:** 3D viewport / paint path / accepted UV-island seam fix. **Carve-out:** S0-1 only as ordered.

**Agent identity:** Unique session id required in `CONVERSATION_LOG.md`. This session: **Grok-Atelier-PIN** / `LOG-2026-11-23-GROK-ATELIER-PIN`.

**Out of queue:** dedicated UV desk unless asked. **F7 ON HOLD.** **HOLD-SEL** until Victory acknowledges.

---

### READ THIS FIRST — three boxes (Victory 2026-11-23)

**1. Tear layer (F1) = LAYER TYPE**  
Black/transparent → show **layer immediately below**. White → **torn edges**. Green → **stack mask**.  
Not fabric. Not multiply. Not auto-displacement.

**2. Pattern Craft = FILTERS on existing paint**  
If–else when applying a pattern/fabrication filter:
- **Empty / near-empty layer** → write **B&W pattern** usable as **displacement/height** (may offer enabling bump/displace on that layer).
- **Layer already painted** → **multiply / micro-detail** the pattern into the paint so fabric/pattern looks real (do not wipe the user’s colour).

Claude’s “multiply + auto displacement” belongs **here**, not on F1.

**3. Mesh/UV limit on filters** ≠ **Tear panel target scope**  
Two controls. Never one confused “F1b” for both.

---

### AUTHORITATIVE — F1 Tear layer

| Pixel | Meaning |
|-------|---------|
| **Black / transparent** | Hole — **immediate layer below** |
| **White** | **Torn edges** (hand-paint + optional procedural) |
| **Green** | **Mask** (stack influence) |

Convert, apply-down, export apply/restore, optional rim paint two levels below — see [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md).

---

### CURRENT TODO (ordered)

#### Step 0
- [ ] S0-1 stroke teleport across UV islands
- [ ] S0-2 Powderiser / filters (double noise/100 fix + audit)
- [ ] Other regressions
- [ ] 2E subdiv preview verify only

#### 2A Stabilisation
- [ ] A4–A7, UI1–UI3 (part select, panel drag, UV shelf, bump merge, window persist, menu unfocus, giant undo/redo)

#### 2A-W Wood rings
- [ ] Uniform tree-year rings **and** organic fingerprint/merged rings; curvature-aware; world vs object coords — not phase-push only

#### 2A-T Triplanar / dual-texture fill (**spec already in this PIN**)
- [ ] True triplanar (3-axis + normal weights + sharpness)
- [ ] Texture A/B mix via noise/height/painted mask (Blender-style landscape mix)
- [ ] World | object space; sample folder replaces built-ins
- [ ] Keep mesh-position / island-safe sampling

#### 2B Layer + Pattern Craft
- [ ] F6 Mask layer
- [ ] F1 Tear layer (roles above only)
- [ ] Tear panel mesh/target scope
- [ ] Filter-side mesh/UV limit (separate)
- [ ] **Pattern Craft filters** including **if–else multiply vs displacement** above
- [ ] M1 Matcap + narrow Add
- [x] Keep material import
- [ ] F7 HOLD

#### 2C–2D
Additional filters; texture gallery later.

---

### Triplanar correction specification (kept)

1. Mix A/B with factor from noise / height / mask.  
2. Height/slope-aware blend when useful.  
3. True triplanar: XY/YZ/ZX samples, `pow(|n|, sharpness)` weights.  
4. World vs Object coordinates.  
5. User **sample folder** overrides built-in images.  
6. Do not throw away working off-mesh NaN / gutter behaviour without replacement.

**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md)

### Work rules

Unique agent ids. Short commits. Self-host only. Do not damage accepted 3D view.

## STOP

Prior history in git. F1 ≠ Pattern Craft multiply.
