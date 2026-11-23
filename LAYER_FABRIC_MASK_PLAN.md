# Layer fabric, cloth, mask, logo fabric plan — 2026-11-21 (expanded)

**Status:** Design / to-do only. **Not implemented.**  
**Scope:** self-host (`src/` → `npm run host:sync`). No `crates/vue3d_core`.  
**Testing:** Victory tests unless he explicitly asks the agent to hunt errors.  
**Logo fabric F7:** **ON HOLD** until Victory gives go-ahead.  
**Cloth family F2–F5:** active plan (layer filter menu) — implement when ordered.

---

## Layer summary — old vs new

### Shipped (verify; do not re-spec)
| Layer / capability | Notes |
|--------------------|-------|
| Ordinary paint | Default add |
| Groups | Multi-select merge / move-to-group / delete |
| PBR toggles | Colour, reflection, emission, bump+ramp, normal |
| Material texture fill | Import / auto-role |
| Per-layer UV channel | + seamless gutter action |
| Export packages | Classic / RGB+ORM / AO×albedo |

### Planned earlier (not built)
| Layer | Notes |
|-------|-------|
| Matcap | Image = material; paint = alpha only; convert-to-colour recipe; JPG |
| Narrow Add menu | Special types under one Add when panel is narrow |

### New planned layers
| ID | Layer | Notes |
|----|-------|-------|
| F1 | **Torn fabric** | Dedicated layer type; black/white/green colour roles; stacking influence controls; convert-from-paint; export bake |
| F1b | **Mesh/UV influence switch** | Sub-control of F1 torn fabric layer — governs which mesh UV islands the torn layer's stacking influence reaches. Default off. |
| F6 | **Mask** | Beside (clip one) or independent (checkbox targets) |

---

## Filter summary — old vs new

### Shipped filters (verify)
Wood (band/ring), hatching, cross-hatch, hashing, powder, noise, dither, mosaic; hatch scale/position/angle jitter.

### Planned filters / tools
| ID | Filter / tool | Notes |
|----|---------------|-------|
| F2–F5 | **Pattern Craft** (renamed from "Cloth filter family") | **Active plan** — layer filter menu when ordered; world cloth, wool/fur, cotton, bamboo-raft, wrap, strip stack |
| F8 | **Merged bump/displacement** | One Levels greyscale tool → 100% bump surface (same job) |
| F7 | **Logo fabric** | Isolate colours → weave + bump/thread; needs visible pixels — **ON HOLD** |

Optional later: wear edge, fray, stitch-line preset.

---

## F1 — Torn fabric (expanded)

### Colour roles (authoritative)
| Pixel | Meaning |
|-------|---------|
| **Black or transparent** | Hole: composite shows **true colour of layers below** |
| **White** | **Torn edge** (fray rim). Can be **auto-generated procedurally** in the tear control panel |
| **Green** (key) | **True tear influence** — which layers below are affected |

Paint first for visuals → **Convert to Torn Fabric**. Procedural **Auto edge** for white. Convert back / apply-down erases holes on targets and bakes patch onto the layer below. **Export:** apply bake → export → **restore** session state.

---

## F1b — Mesh / UV influence switch (sub-control of F1 torn fabric layer)

> **Classification (Victory 2026-11-22 23:56, confirmed 2026-11-23):** F1b is a stacking/influence control belonging to the F1 torn fabric layer, not a filter. It governs which mesh UV islands the torn fabric layer's stacking influence (the green-key mask reach) applies to. Part of the F1 layer's own control panel.

Default off — torn fabric layer influences all UVs beneath it. When on: influence is restricted to only the checked mesh UV islands. This is a layer-stack behaviour toggle, the same kind as a clip mask's target scope.

---

## F2–F5 — Pattern Craft filter family (ACTIVE PLAN)

> **Renamed (Victory 2026-11-22):** Previously called "Cloth filter family". Correct name is **Pattern Craft**.

Layer **filter menu** item — not on hold.

- **F2** World-space cloth displacement → B/W mask or colour modulate; scale, uniformity, rotation jitter, seed
- **F3** Sub-modes: cloth, wool/fur, cotton, bamboo-raft
- **F4** Cylindrical wrap rebuild from painted patches; sparse → cross plaster/bandaid; dirtiness + ramp
- **F5** Strip stack with per-strip colour ramps from paint only

Implement when Victory orders filter work (same priority class as F1/F6/F8).

---

## F6 — Mask layer

Beside = clip one layer. Independent = checkbox targets above/below. Greyscale; white reveal / black hide.

---

## F7 — Logo fabric filter (**ON HOLD**)

Do **not** implement until Victory gives go-ahead.

When released: own filter entry (not under cloth). Requires **visible pixels**. Isolate colours → weave each with unique bump + colour threading dispersal.

---

## F8 — Merge Convert-to-Bump and Convert-to-Displacement

Same job: Levels greyscale → **100% bump surface**. One menu/tool, not two divergent paths. “Displacement” may remain a synonym in UI copy only.

---

## Implementation order (when ordered)

1. **F8** merge bump/displace UI  
2. **F6** mask infrastructure  
3. **F1** torn + convert + procedural edge + export snapshot/restore  
4. **F1b** mesh influence switch  
5. **F2–F5** cloth filter menu family  
6. **F7** logo fabric **only after explicit go-ahead**

After each slice: `npm run host:sync`; short commit; Victory tests by default.

### Non-goals
No native cloth sim; no breaking old `.xblend`; no permanent flatten on export without restore; no logo fabric until go-ahead.
