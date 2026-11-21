# Layer fabric, cloth filter, and mask plan — 2026-11-21

**Status:** Design / to-do only. **Not implemented.**  
**Scope:** self-host (`src/` → `npm run host:sync`). No `crates/vue3d_core`.  
**Testing:** Victory tests unless he explicitly asks the agent to hunt errors.  
**Announce:** Listed in `AGENTS.md` PIN as F1–F6.

---

## Summary of layer / filter features in plan so far

### Already on product (earlier sets — verify, do not re-spec)
- Ordinary paint layers, groups, multi-select merge/group/move/delete
- Toggle PBR contributions (colour, reflection, emission, bump+ramp, normal lock)
- Material texture fill layer; import texture / auto-role
- Layer filters: wood (band/ring), hatching, cross-hatch, hashing, powder, noise, dither, mosaic
- Export Classic / RGB+ORM / AO×albedo
- Per-layer UV channel; seamless gutter action
- Bump/Displacement via shared Levels

### Designed, not built (PIN)
- **Matcap layer** — matcap image as material; paint writes alpha only; convert-to-colour recipe; JPG storage; MixRGB export path
- **Narrow Add menu** — special types under one Add when panel is narrow

### New this document (F1–F6)
1. **Torn fabric layer** — green-keyed or B/W alpha tears; true tear vs hanging threads; target-layer checklist
2. **Cloth filter** — world-space cloth displacement → B/W mask or colour affect; scale, uniformity, rotation jitter
3. **Cloth sub-modes** — wool/fur, cotton, bamboo-raft
4. **Cylindrical wrap rebuild** — project painted patches; cross-plaster fallback; dirtiness + ramp
5. **Strip stack** — separate strips with per-strip colour ramps from painted data only
6. **Mask layer** — Photoshop-style; beside (clip one layer) or independent (checkbox targets above/below)

---

## F1 — Torn fabric / tear layer (dedicated layer type)

### Intent
Paint or stamp **tear regions** on fabric-looking surfaces. Green (or B/W alpha) drives **clip masking** so underlying layers show through as rips.

### Input modes (dialog)
| Mode | How the tear is defined |
|------|-------------------------|
| **Green key** | Any brush on this layer is forced to a fixed key green (e.g. `#00FF00`). Green coverage = tear open. |
| **B/W alpha** | Black background + white (or greyscale) = tear amount; white = fully open. |
| **Tear stamp** | Optional stamp library: jagged edge stamps; still written as green or white into the layer buffer. |

### Dialog controls (layer property for this type)
- **Tear style:** `true_tear` | `hanging_threads`
  - **true_tear:** hard clip; optional edge roughness (0–100) erodes boundary with seeded noise.
  - **hanging_threads:** after clip mask, draw thin filament polylines from tear edge inward/outward; controls: thread density, length, thickness, colour (sample fabric or fixed).
- **Edge algorithm:** `noise_erode` | `stamp_edge` | `distance_field` (simplified: pick one primary + strength slider).
- **Strength / openness** (0–100).
- **Affect targets:** checkbox list of **layers below** this tear layer (auto-enumerated at dialog open). Only checked layers are clipped by this tear. Default: immediate layer below only.

### Execution algorithm (implementation order)
1. Extend `Layer` / types with `layerKind: 'paint' | 'tear' | 'mask' | 'matcap' | ...` and `tearSettings`.
2. On tool stroke while active tear layer: if green-key mode, force brush colour to key green; ignore user primary colour.
3. Composite pass (after normal stack order):
   - Build tear mask `M` from layer pixels (green distance-to-key or luminance).
   - For each checked target layer below: `out = target * (1-M)` (+ optional thread overlay drawn into a temp buffer after clip).
4. Undo: store tear layer buffer + settings snapshot like other layers.
5. `.xblend`: serialize `layerKind` + settings; old files default `paint`.

### Performance
Mask is resolution of layer canvas; do not full-scene rebuild every dab — update on stroke end or throttled composite like existing paint.

---

## F2 — Cloth displacement filter (layer filter)

### Intent
Bake a **cloth-like displacement** from **object/world space** (reuse `buildObjectSpacePositionMap` / mesh normals where possible) into:
- **Mask mode:** write B/W into an empty layer (for use as mask or tear input), or
- **Colour mode:** modulate existing layer colour (darken folds / lift highlights).

### Controls
| Control | Role |
|---------|------|
| Scale | Spatial frequency of folds (world units → UV) |
| Uniformity | 0 = chaotic; 100 = regular grid-like waves |
| Rotation jitter | Degrees of random local fold direction |
| Seed | Stable re-apply |
| Output | `mask_bw` \| `modulate_colour` |
| Strength | Blend amount |

### Algorithm (simplified, WebGL-friendly)
1. For each texel with valid object position `P` and normal `N`:
   - Build two tangent directions from `N` (or UV derivatives).
   - Fold field: `f = sin(dot(P, dirA) * scale + phase) * sin(dot(P, dirB) * scale * k)` with `dir` rotated by jitter per cell.
   - Uniformity lerps between multi-octave noise and the regular product above.
2. Map `f` to 0–1; write grey or multiply RGB.
3. Optional light blur for soft cloth.

Hook into existing `TextureFilterDialog` as kind `cloth`.

---

## F3 — Cloth sub-modes (dropdown inside cloth filter)

| Sub-mode | Behaviour sketch |
|----------|------------------|
| **Cloth (default)** | F2 fold field |
| **Wool / fur** | Anisotropic short strokes along tangent; density + length; mostly B/W strand mask or colour darkening |
| **Cotton** | Softer, higher-frequency noise; low contrast loft |
| **Bamboo raft** | Parallel cylindrical ribs: `sin(dot(P, axis) * ribScale)` with optional alternate rib width |

Each sub-mode shares Scale / Uniformity / Jitter / Seed where meaningful; hide irrelevant sliders.

---

## F4 — Cylindrical wrap rebuild (cloth filter operator)

### Intent
From **what is already painted** on the layer, rebuild as **wrap strips** using a **cylindrical projection** from the model (choose axis: Y default).

### Algorithm
1. Read opaque/coloured texels; cluster connected components (flood fill on alpha).
2. For each cluster, estimate cylindrical angle from object positions (`atan2` in plane perpendicular to axis).
3. Sort clusters by angle; allocate strip bands in UV or redraw into layer as vertical/horizontal wrap bands aligned to angle.
4. **Sparse paint rule:** if total painted coverage < threshold (e.g. 8% of island) **or** cluster count is low → replace with **cross plaster / bandaid** stamps (X-shaped or strip patches) at cluster centroids instead of full wraps.
5. User-facing inputs for this operator (limited, as requested):
   - **Dirtiness** (0–100): stains/noise on wrap strips
   - **Colour graduation / ramp** per strip: derived from average colour of source cluster, then optional ramp endpoints
6. Erase original painted patches as part of redraw (destructive filter — push undo first).

---

## F5 — Strip stack operation

- After wrap rebuild (or on demand): **separate each strip into stack entries** (child layers or a structured `stripStack` on the layer).
- Each strip keeps its **own colour ramp** (2–5 stops) initialised from that strip’s painted colours only — no global palette inventing.
- Limited controls: ramp stops + dirtiness; geometry of strips stays from projection.

---

## F6 — Mask layer (Photoshop-style)

### Two attachment modes

| Mode | Behaviour |
|------|-----------|
| **Beside (clip)** | Mask is parented to exactly one layer; affects only that layer’s alpha (or clip group). Created via “Add mask” on a layer row. |
| **Independent** | Own stack row. Does **not** auto-affect neighbours. Layer property operator lists **checkboxes for layers above and below**; only checked layers are multiplied by this mask. |

### Painting
- Greyscale (or B/W) brush; white = reveal, black = hide (standard convention — document in UI).
- Optional link/unlink like PS (linked mask moves with layer offset if layer transforms exist later).

### Composite
For each affected content layer: `alpha_out = alpha_in * mask_luminance` (per pixel). Independent masks can stack multiply if multiple masks target the same layer (define order: bottom mask first).

### Execution order
1. Types: `maskOfLayerId?: string` (beside) vs `maskTargetIds: string[]` (independent).
2. UI: thumbnail + mask icon on row; property panel target checklist for independent.
3. Composite integration next to tear-layer clip (share “modulate alpha of targets” helper).
4. Serialize in `.xblend`.

---

## Suggested extra filters (optional, same family)

- **Wear edge** — cavity/ridge aware edge lighten (can reuse edge-wear ideas).
- **Fray** — 1D noise along UV island boundary only.
- **Stitch line** — user stroke → periodic stitch dashes (may already exist in Stitch Studio; wire as filter preset if useful).

---

## Implementation procedure (when Victory orders build)

1. Read this file + AGENTS PIN. Do not start specialised UV desk.
2. Implement **F6 mask** first if clip infrastructure helps **F1 tear** (shared target checklist + alpha modulate).
3. Then **F1 tear** (green key + dialog + threads).
4. Then **F2/F3 cloth filter** in `textureFilters.ts` + dialog.
5. Then **F4/F5** wrap + strip stack (most complex; needs object-space + undo).
6. After each slice: `npm run host:sync`; short commit; **Victory tests** unless he asks for agent error checks.
7. Append `CONVERSATION_LOG.md`; update AGENTS PIN items to “done” only after Victory accepts.

### Non-goals
- No native D3D cloth sim.
- No full physical yarn simulation.
- No breaking old `.xblend` paint layers.

---

## Layer feature inventory (plan total)

| Feature | Status |
|---------|--------|
| Paint / group / PBR toggles | Shipped (verify) |
| Material texture fill | Shipped (verify) |
| Wood / hatch / hash / etc. filters | Shipped (verify) |
| Matcap dedicated layer | Planned (AGENTS 9) |
| Narrow Add menu | Planned (AGENTS 10) |
| Torn fabric layer | **Planned F1** |
| Cloth filter + sub-modes | **Planned F2–F3** |
| Cylindrical wrap + plaster fallback | **Planned F4** |
| Strip stack + ramps | **Planned F5** |
| Mask layer (clip / independent) | **Planned F6** |
| Specialised UV desk / NURBS / LTM | Research later |
