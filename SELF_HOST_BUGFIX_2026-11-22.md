# Self-host bugfix & next work — 2026-11-22

**Authority:** Victory’s device test + Grok code scan.  
**Scope:** self-host only (`src/` → `npm run host:sync`).  
**Hard rule:** The **3D viewport / paint experience is satisfactory**. Do not “improve” Viewport3D, dab composite, or island padding unless a new regression is proven. Isolate fixes elsewhere.

**Victory tests** unless he asks the agent to test for errors.

---

## Test results (accepted)

| Item | Result |
|------|--------|
| Suzanne **Head + Eyes** | **Perfect** — optimised; keep as the character preset |
| Legacy **Squail** / single Suzanne default | **Remove** from menu/default; do not delete asset file if still referenced offline — remove product entry points |
| UV island / filter edge line | **Fixed** — do not reopen without a new repro |

Default model load / Options menu: prefer `suzanneHeadEyes` (`src/renderer/modelGeometry.ts` preset id `suzanneHeadEyes`, asset `src/assets/Suzanne.head-eyes.obj`). Legacy id `suzanne` / Squail label should not be the default or promoted name.

---

## Phase A — Bug fixes first (do these before new features)

### A1. Remove Squail; default Head + Eyes
- **Where:** `src/renderer/modelGeometry.ts` (`BUILTIN_MODELS`), Options / model menu UI (search labels “Squail”, “Suzanne (Bundled”, preset pickers in `App.tsx` / panels).
- **Do:** Menu shows **Suzanne Head + Eyes** as default character. Drop Squail naming. Keep file `Suzanne.obj` only if something else still needs it; product path should not present it as the main monkey.

### A2. Symmetry brush lag
- **Symptom:** With symmetry **ON**, brushes feel like they **span / travel** and leave **inconspicuous gaps**; speed returns to normal when symmetry **OFF**.
- **Likely area:** stroke / dab path in paint tools (search `symmetry`, mirror matrix, dual-dab). Avoid full-canvas rebuilds per mirrored dab; batch mirrors; do not double-composite expensive filters mid-stroke.
- **Do:** Profile ON vs OFF; fix performance and spacing consistency. Do not change core viewport camera/controls.

### A3. Wood filter UI incomplete vs algorithm
**Code scan (`src/tools/textureFilters.ts`):** algorithm already has:
- `woodGrainType`: `band` | `ring` | `band+ring`
- `bandFrequency`, `ringFrequency`, `ringNoise`, `woodRoughness`, `woodSeed`, `randomization`
- Band wave + ring wave math in the wood branch

**Gap:** User reports **missing banding and wave slider with frequency randomisation** in the UI — treat as **dialog / wiring unfinished**, not missing core math. Audit `src/ui/TextureFilterDialog.tsx` (and any wood-only panel) so every wood config field is exposed and bound.

Also audit **all** `TextureFilterKind` values (`wood`, `hatching`, `cross-hatching`, `hashing`, `powderiser`, `noise-shader`, `dither`, `mosaic`) for:
- Config fields present in `TextureFilterConfig` but absent in dialog
- Dialog controls that no-op
- Partial implementations that look “broken”

Fix incomplete filters before adding new kinds.

### A4. Filter part selection
- Every filter apply path should optionally respect **selected mesh parts** (reuse `userData.componentIndices` / Head–Eyes parts).
- Outside selected parts: **no influence** (leave pixels unchanged).
- Default: current behaviour (whole active mesh) until the user enables part limit.

### A5. Filter floating panel drag
- Drag by **window title** should move the panel smoothly with **no hang / sticky glitch**.
- Check pointer capture, drag threshold, and conflict with inner scroll/slider hit targets.

### A6. 2D UV tool shelf layout
- Restore tool shelf to **original location** (prior accepted layout).
- **Group / spacer** controls so items **do not overlap**.
- Except **N-panel**, group controls toward **top-left** of the UV pane as Victory specified.
- Do not change unwrap algorithms while moving chrome.

### A7. Merge bump / displacement conversion (F8)
- One tool: Levels greyscale → **100% bump surface**.
- Convert-to-bump and convert-to-displacement are the **same job** — single UI path.

---

## Phase B — New layer filters (after Phase A stable)

Add under layer filter menu (research + implement carefully; use object/world maps where noted):

| Filter | Intent |
|--------|--------|
| **Layer transform / warp** | Displace texture — wavy warp, controllable amplitude/frequency |
| **Pointillism** | Disc/stipple reconstruction of layer colour |
| **Vector cells / honeycomb** | World-space + **surface normal** driven cells: **triangle, square, circle, hexagon** forms |
| **Stochastic scatter** | Stackable scatter of marks/images across the layer |

**Part selection (A4)** applies to these as well.

### Texture gallery (later slice — design now, implement when ordered)
- In-built texture library; gallery UI with **preview**.
- Bundle with app; **extract to device / browser storage** on first use.
- **Auto-scale** by projected GPU / device tier (example: ship 1K masters; bake **256px** derivatives for mobile).
- Stochastic scatter and fills may point at gallery assets.

---

## Phase C — Held / later features

See [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md):
- F1 torn fabric, F1b mesh influence, F2–F5 cloth (active plan when ordered), F6 mask
- **F7 logo fabric ON HOLD**
- Matcap layer + narrow Add menu
- Specialised UV desk — research only until Victory asks

---

## Recommendations for the next agent

1. **Start with A1–A3 only** in the first commit set — high user visibility, low risk to 3D view.
2. Read `TextureFilterConfig` + `DEFAULT_TEXTURE_FILTER` + dialog in one pass; make a checklist table “field → UI bound?” before coding.
3. For symmetry, measure time per pointer-move with symmetry on/off before changing algorithms.
4. UV chrome: screenshot/compare split vs dedicated 2D modes; keep N-panel behaviour explicit.
5. When adding honeycomb, reuse `rasterizeMeshSurface` / normals already in `textureFilters.ts` — do not invent a second mesh rasteriser.
6. After any `src/**` change: `npm run host:sync` (or rely on `build-self-host.yml`) and note the generated commit.
7. Append **`CONVERSATION_LOG.md`** under `## 2026-11-22 — YourEngine`.

---

## Code pointers (scan snapshot)

| Topic | Location |
|-------|----------|
| Wood + hatch config / algorithms | `src/tools/textureFilters.ts` — `woodGrainType`, `bandFrequency`, `ringFrequency`, wood branch ~grain waves; `featureScale` / jitters for directional filters |
| Mesh surface / NaN off-mesh | `rasterizeMeshSurface`, `buildObjectSpacePositionMap` same file |
| Presets | `src/renderer/modelGeometry.ts` — `suzanne`, `suzanneHeadEyes`, `BUILTIN_MODELS` |
| Filter dialog | `src/ui/TextureFilterDialog.tsx` (audit bindings) |
| UV chrome | `src/renderer/Viewport2D.tsx`, related HUD / `HorizontalScrollRail` |
| Symmetry | search `symmetry` under `src/` (paint / brush / App) |

Agents should re-open these files on current `main` before editing — line numbers drift.

---

## Non-goals this cycle

- No native D3D rewrite
- No specialised UV desk implementation
- No logo fabric (F7) until go-ahead
- No “viewport redesign” while the view is accepted
