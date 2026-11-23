# Layer / filter plan — Tear layer, Pattern Craft, mask (2026-11-23)

**Status:** Design / to-do. **Not fully implemented.**  
**Scope:** self-host (`src/` → `npm run host:sync`).  
**F7 Logo fabric:** ON HOLD.  
**Authority:** Victory via **Grok-Atelier-PIN**. Claude’s old “F1 = procedural fabric multiply” is **void for F1**; that behaviour belongs under **Pattern Craft filters** (below).

---

## Three different things (do not mix)

| Name | Kind | What it is |
|------|------|------------|
| **F1 Tear layer** | **Layer type** | Holes, torn edges, green mask in the **layer stack** |
| **Pattern Craft (F2–F5 + pattern modes)** | **Filters** | Run on an **existing paint layer’s pixels** to make fabric/pattern look real |
| **Filter mesh/UV limit** | **Filter control** | Which UV islands a **filter** may touch — not the Tear layer panel |

If you are unsure: **Tear = stack hole/edge/mask. Pattern = filter on painted pixels.**

---

## F1 — Tear layer only

| Pixel | Meaning |
|-------|---------|
| **Black / transparent** | Hole → show **immediate layer below** |
| **White** | **Torn edges** (hand-paint or procedural auto-edge) |
| **Green** | **Mask** (influence in the stack) |

Convert from paint, apply-down, export apply/restore, optional paint contribution two levels below on rim apply. **No** fabric multiply. **No** auto-displacement as the definition of this layer.

---

## Pattern Craft filters — multiply / displacement (if–else)

**This is where Claude’s multiply + auto-displacement idea belongs** — as **filter behaviour on a painted layer**, not as a layer type.

When the user runs a **pattern / fabrication filter** on a layer (after or during texture painting), the filter should make the result look real using one of these paths:

```
IF the target layer has little or no colour content (empty / near-empty):
    generate a black-and-white pattern suitable as a **displacement / height** map
    (optional: offer to enable the layer’s displacement/bump contribution)
ELSE (layer already has painted colour / albedo):
    **multiply / micro-detail** the pattern into that paint
    (weave, thread, fabric grain — transform + micro contrast, not replace the paint)
```

Optional shared controls: strength, scale, world-normal-aware rotation of the pattern across limbs, seed. Still a **filter** written into the layer buffer (with undo), not a new layer kind.

**F2–F5 family** (world cloth, wool/fur, cotton, bamboo-raft, wrap, strip stack) lives under this same **filter** menu. Pattern multiply/displace is the general rule those modes should obey when “make it look like real fabric on my paint” is the goal.

---

## Mesh / UV limits (still two ideas)

| Control | Where | Role |
|---------|--------|------|
| Tear target / mesh scope | **Tear layer panel** | Stack influence for **this tear** |
| Filter mesh/UV influence | **Filter UI** | Which islands **filters** may change |

Never one toggle for both.

---

## F6 Mask layer | F7 Logo fabric HOLD | F8 Bump merge

Unchanged. F6 greyscale clip ≠ Tear green mask.

---

## Wood rings + Triplanar

See **AGENTS.md PIN** sections **2A-W** and **2A-T** (authoritative for those filters).

---

## Implementation order

1. Step 0 / stabilisation  
2. Wood rings  
3. Triplanar correction  
4. F8, F6, F1 Tear, Pattern Craft (with if–else above)  
5. F7 only after go-ahead  
