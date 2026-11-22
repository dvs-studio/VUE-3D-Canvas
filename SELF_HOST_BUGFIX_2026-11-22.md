# Self-host bugfix & next work — 2026-11-22

**Authority:** Victory’s device test + Grok code scan.  
**Scope:** self-host only (`src/` → `npm run host:sync`).  
**Hard rule:** The **3D viewport / paint experience is satisfactory**. Do not “improve” Viewport3D, dab composite, or island padding unless a new regression is proven.

**Victory tests** unless he asks the agent to test for errors.

---

## Test results (accepted)

| Item | Result |
|------|--------|
| Suzanne **Head + Eyes** | **Perfect** — default character preset |
| Legacy **Squail** | **Remove** from menu/default |
| UV island / filter edge line | **Fixed** — do not reopen without new repro |

---

## Critical: broken / unfinished layer filters

Victory reports that **some layer filters are broken** — they appear in the UI but **have little or no effect on the layer**. Called out explicitly: **dust / powder-style** (likely `powderiser` and related noise/dust paths).

**Gist for the next agent:**
1. This is **not only “add new filters”**. First **recover** the existing filter suite.
2. **Deep-scan** for unfinished or half-wired work left by previous agents:
   - `src/tools/textureFilters.ts` — each `TextureFilterKind` branch must visibly change pixels under default + strong settings
   - `src/ui/TextureFilterDialog.tsx` — every control bound to config that the apply path actually reads
   - Apply / confirm path in `App.tsx` (or caller) — config object not stripped, correct layer canvas, undo pushed
3. For each kind, produce a short checklist: **applies? | UI complete? | needs rewrite?**
4. **Fix or replace** dead implementations. Prefer minimal fix; if a branch is irredeemable, rewrite that kind cleanly without breaking others.
5. **Only after** existing filters work, implement Phase B new filters.

Kinds to verify end-to-end: `wood`, `hatching`, `cross-hatching`, `hashing`, `powderiser` (dust), `noise-shader`, `dither`, `mosaic`.

---

## Phase A — Bug fixes first

### A1. Remove Squail; default Head + Eyes
`src/renderer/modelGeometry.ts` + Options/model menu. Preset id `suzanneHeadEyes`.

### A2. Symmetry brush lag
Symmetry ON → span/travel gaps and slowness; OFF normal. Profile paint/mirror path only.

### A3. Filter suite — incomplete UI + broken effect
**Wood:** algorithm already has `woodGrainType`, `bandFrequency`, `ringFrequency`, `ringNoise`, `woodRoughness`, `woodSeed`, `randomization` in `textureFilters.ts`. User still needs **banding / wave + frequency randomisation** exposed and working in the dialog.

**Dust / powder / others:** **no visible effect** on the layer — treat as bug. Trace from dialog → config → `transformTexturePixels` / `applyTextureFilterToCanvas` → layer writeback. Common failure modes: wrong kind string, strength 0, early return, writing to a temp that is discarded, alpha-only change invisible on opaque layers.

Audit **all** kinds for unfinished prior-agent work; continue or replace.

### A4. Filter part selection
Optional mesh-part mask; outside selection unchanged.

### A5. Filter panel title-drag without hang/glitch

### A6. 2D UV tool shelf — original location, group/spacer, top-left except N-panel

### A7. F8 merge bump/displacement (Levels → 100% bump)

---

## Phase B — New filters (only after Phase A filter suite is healthy)

| Filter | Intent |
|--------|--------|
| Layer transform / warp | Wavy displace |
| Pointillism | Stipple |
| Vector cells / honeycomb | World + normal; tri / square / circle / hex |
| Stochastic scatter | Stackable scatter |

**Texture gallery (later):** bundle → browser/device storage; preview; auto-scale by GPU tier (e.g. 1K → 256 mobile).

---

## Phase C — Later / hold

See `LAYER_FABRIC_MASK_PLAN.md`. **F7 logo fabric ON HOLD.** Cloth F2–F5 active plan when ordered. Do not start specialised UV desk unless asked.

---

## Recommendations

1. First commit set: **A3 deep filter scan + dust/powder fix** and wood UI bindings — highest pain.
2. Then A1 model default, A2 symmetry.
3. Checklist table per filter kind before declaring Phase B open.
4. Reuse `rasterizeMeshSurface` for world/normal filters; do not fork a second rasteriser.
5. `npm run host:sync` after `src/**` changes. Append `CONVERSATION_LOG.md` by date.

## Code pointers

| Topic | Location |
|-------|----------|
| Filter algorithms | `src/tools/textureFilters.ts` |
| Filter dialog | `src/ui/TextureFilterDialog.tsx` |
| Presets | `src/renderer/modelGeometry.ts` |
| UV chrome | `src/renderer/Viewport2D.tsx` |
| Symmetry | search `symmetry` under `src/` |

## Non-goals

No viewport redesign; no logo fabric until go-ahead; no native D3D rewrite.
