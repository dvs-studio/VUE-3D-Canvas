# Layer / filter plan — Tear layer, Pattern Craft, mask (2026-11-23)

**Status:** Design / to-do. **Not fully implemented.**  
**Scope:** self-host (`src/` → `npm run host:sync`).  
**F7 Logo fabric:** ON HOLD.  
**Authority on F1:** Victory 2026-11-23 via **Grok-Atelier-PIN** — supersedes Claude INVEST “procedural fabric multiply” definition.

---

## F1 — Tear layer (renamed from Torn fabric)

### Colour roles (authoritative)

| Pixel | Meaning |
|-------|---------|
| **Black or transparent** | Hole — shows the **immediate layer below** |
| **White** | **Torn / fray edges** (hand-paint or procedural auto-edge) |
| **Green** | **Mask** — influence / stack participation (which depth is affected) |

### What was mixed up (do not implement as F1)

Prior notes described F1 as a **procedural seamless fabric pattern** that multiplies micro-contrast into the layer beneath, auto-enables displacement, and rotates by world normal. That is **not** the Tear layer. Discard that as F1’s identity.

### Intended behaviour

1. Dedicated **layer type** in the stack (clip-like participation, not a pixel filter kind).
2. User may **paint first** on a normal layer, then **Convert to Tear layer**.
3. **Hand-paint** white edges and green mask regions; black opens to the layer immediately under this tear layer.
4. Optional **procedural white edge** from the tear control panel (width, roughness, threads).
5. On **apply / convert to normal**: erase open holes on affected targets; bake white rim (and agreed under-paint) so that **two levels below** can receive painted edge contribution where the design calls for under-rim colour.
6. **Export:** snapshot → apply tear composite → export → **restore** editable tear stack.

### Controls (panel on this layer)

- Auto edge on/off + width / roughness
- Mask strength / which below targets (green-driven)
- Convert to / from paint; Apply permanently vs session

---

## Mesh / UV limits (two separate ideas)

| Control | Where | Role |
|---------|--------|------|
| Tear target / mesh scope | **Tear layer panel** | Which meshes or how deep green mask reaches for **this tear layer** |
| Filter mesh/UV influence | **Filter side** (Pattern Craft / related) | Restrict **filter apply** to checked UV islands — not the same widget as tear scope |

Do not collapse these into one confused “F1b” that means both.

---

## F2–F5 — Pattern Craft (filters, not layers)

World cloth, wool/fur, cotton, bamboo-raft, cylindrical wrap, strip stack — **filter menu**. Active plan when ordered.

---

## F6 — Mask layer

Beside (clip one) or independent (checkbox targets). Greyscale; white reveal / black hide. **Not** the same as Tear green mask (Tear is a specialised tear/hole/edge layer).

---

## F7 — Logo fabric — ON HOLD

---

## F8 — Merge bump / displacement

One Levels greyscale → 100% bump surface.

---

## Related filter work (see AGENTS PIN)

- **Wood rings:** uniform tree-year rings vs organic fingerprint/merged rings; world vs object coords; curvature-aware.
- **Triplanar / dual-texture fill:** normal-weighted triplanar; Mix A/B with noise/height mask; sample folder replaces built-ins.

---

## Implementation order (when building)

1. Stabilisation / Step 0 as in AGENTS  
2. Wood rings behaviour  
3. Triplanar correction  
4. F8, F6, F1 Tear layer, Pattern Craft  
5. F7 only after go-ahead  
