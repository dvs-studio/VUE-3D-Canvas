# Layer fabric, cloth, mask, logo fabric plan — 2026-11-21 (expanded)

**Status:** Design / to-do only. **Not implemented.**  
**Scope:** self-host (`src/` → `npm run host:sync`). No `crates/vue3d_core`.  
**Testing:** Victory tests unless he explicitly asks the agent to hunt errors.  
**Cloth family F2–F5:** **ON HOLD** until Victory gives go-ahead.

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
| F1 | **Torn fabric** | Dedicated type + convert-from-paint; green/white/black roles; export bake |
| F1b | **Mesh influence switch** | Optional: paint/tear only selected mesh UV |
| F6 | **Mask** | Beside (clip one) or independent (checkbox targets) |

---

## Filter summary — old vs new

### Shipped filters (verify)
Wood (band/ring), hatching, cross-hatch, hashing, powder, noise, dither, mosaic; hatch scale/position/angle jitter.

### Planned filters / tools
| ID | Filter / tool | Notes |
|----|---------------|-------|
| F7 | **Logo fabric** | Isolate colours → weave + per-colour bump/thread dispersal; **requires visible pixels** |
| F8 | **Merged bump/displacement** | One Levels greyscale tool → 100% bump surface (same job) |
| F2–F5 | Cloth / wool / cotton / bamboo / wrap / strips | **ON HOLD** — no build without go-ahead |

Optional later: wear edge, fray, stitch-line preset.

---

## F1 — Torn fabric (expanded)

### Colour roles (authoritative)
| Pixel | Meaning |
|-------|---------|
| **Black or transparent** | Hole: composite shows **true colour of layers below** (open tear through) |
| **White** | **Torn edge** (fray rim). Can be **auto-generated procedurally** from the special layer control panel (edge thickness, noise, threadiness) so the user need not paint white by hand |
| **Green** (key, e.g. `#00FF00`) | **True tear influence zone** — how deeply / which **layers below** are affected (clip depth). Green drives the affect checklist / strength |

Users may **paint freely first** on a normal layer for visuals, then **Convert to torn fabric layer**.

### Convert paint → torn fabric
1. Context action on a paint layer: **Convert to Torn Fabric**.
2. Existing RGB retained where useful; dialog maps:
   - optional auto-detect near-green → key green;
   - generate **white edge** band from opaque boundaries (procedural);
   - fill interior holes / user-marked regions as black/transparent open tear.
3. Layer kind becomes `tear`; tear settings panel unlocks (style, edge algo, targets, procedural edge).

### Procedural turn edges (white)
In the tear layer control panel:
- Enable **Auto edge**
- Width (px), roughness, optional hanging-thread density along the white band
- Regenerates white rim from current open (black) regions + green influence boundary without wiping user green

### Convert torn → normal colours (apply down)
When converting **back to a normal paint layer** (or “Apply torn”):
1. For each affected target below: **erase** the open-tear region in that target (stack erase where black/transparent tear wins).
2. **Paint the torn patch into the layer directly below**: bake white edges + any thread overlay + visible fabric rim into that lower layer’s pixels.
3. Tear layer becomes ordinary paint (or is removed per UX choice) holding residual edge art if needed.
4. Full undo stack entry for the multi-layer edit.

### Export behaviour (new technology)
- **Before export:** automatically **apply** torn composite into the stack (same as convert-down bake) so exported maps / packages do not depend on live tear compositing.
- **After export (or cancel path):** **reverse** — restore pre-apply tear stack state so the session stays editable as torn layers.
- Implementation: snapshot layer buffers → apply → export → restore snapshot. Never leave the document permanently flattened unless the user explicitly “Apply permanently”.

### Dialog (tear layer)
- Tear style: true tear vs hanging threads
- Edge algorithm + strength; Auto edge controls
- Affect targets: checkboxes for layers **below** (green controls influence)
- Strength / openness

### Execution notes
Share alpha-modulate helper with F6 masks. Throttle composite to stroke-end. Serialize `layerKind` + settings in `.xblend`.

---

## F1b — Mesh / UV influence switch (layer control)

**Default:** painting and tear/mask influence behave as today (all active mesh / current UV context).

**Optional switch** in the layer property / control panel:
- **Limit to selected mesh** (off by default)
- When on: list meshes / parts (e.g. Head, Eyes, body islands); only checked meshes receive paint dabs and tear/mask influence in their UV coverage
- Goes a long way for multi-part models without a full material system rewrite

Wire into stroke raster and tear composite using existing mesh-part / UV-channel data (`userData`, active UV set).

---

## F7 — Logo fabric filter (layer filter)

**Not** under the cloth filter (cloth stays on hold). Own entry in Layer Filter dialog.

### Requirements
- Apply only if the layer has **visible non-empty pixels**; refuse or no-op on blank layers with a clear message.
- **Intelligently isolate colours** (k-means or histogram peaks → dominant swatches).
- **Weave** each isolated colour on its own: directional thread runs, slight undulation, interlace with neighbours.
- Each colour band gets **unique bump** (height from weave phase) and **colour threading dispersal** (micro-shift of hue/value along thread direction).
- Controls (suggested): cluster count or auto, weave scale, depth, dispersal, seed, strength.
- Output writes into the same layer (destructive → undo first) or optional new layer.

### Algorithm sketch
1. Sample opaque pixels → cluster colours.
2. Assign each pixel a cluster id; build per-cluster orientation (e.g. from image gradients or fixed warp/weft).
3. For each pixel: weave function `sin`/`square` along orientation → modulate RGB toward cluster centre + neighbour mix; write greyscale bump auxiliary if PBR bump slot on, or encode bump in a parallel pass the user can convert via F8.

---

## F8 — Merge Convert-to-Bump and Convert-to-Displacement

**Note for implementers:** Convert to bump and convert to displacement are **meant to do the same job** — produce a greyscale using a **Levels-style slider**, then apply as a **100% bump surface** contribution on the layer.

### UI / behaviour
- Single entry: e.g. **“Convert to height (bump)”** or **“Greyscale → bump surface”**
- Shared Levels dialog (already shared in product history)
- Result: layer (or slot) treated as full-strength bump from that greyscale; do not maintain two divergent code paths or two menus that confuse users
- Displacement naming in UI may remain as a synonym/tooltip (“same as bump height in this app”) rather than a second pipeline

---

## F6 — Mask layer (unchanged intent)

Beside = clip one layer. Independent = checkbox targets above/below. Greyscale paint; white reveal / black hide.

---

## F2–F5 — Cloth family (ON HOLD)

World-space cloth, wool/fur, cotton, bamboo-raft, cylindrical wrap, strip stack — **specified earlier but do not implement until Victory says go.** Prefer F1, F1b, F7, F8, F6 when ordered.

---

## Implementation order (when ordered)

1. **F8** merge bump/displace UI (smallest, clarifies height tools).
2. **F6** mask infrastructure (alpha target helper).
3. **F1** torn layer + convert + procedural white edge + apply-down + export snapshot/restore.
4. **F1b** mesh influence switch.
5. **F7** logo fabric filter.
6. **F2–F5** only after explicit go-ahead.

After each slice: `npm run host:sync`; short commit; Victory tests by default.

### Non-goals
No native cloth sim; no breaking old `.xblend` paint layers; no permanent flatten on export without restore.
