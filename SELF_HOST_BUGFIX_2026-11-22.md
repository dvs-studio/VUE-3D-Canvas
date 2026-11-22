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


## Phase A3 implementation — 2026-11-22 (GPT-6)

### Source changes

- `powderiser` was defective because the scatter pass wrote into the same output buffer that the source-pixel loop was still filling. A later source pixel could overwrite an earlier dust fragment, and untouched output RGB began as zero. It is now a two-pass operation: copy and fade source coverage first; then composite seeded, drifting dust fragments over the completed image with alpha-aware source-over blending. Noise = 0 is a no-op; seed and drift remain deterministic.
- Wood Grain now has `woodFrequencyRandomization` (0–100, default 15). A dedicated slider sits beside **Band / wave frequency**. The seed drives coarse spatial variation of band and ring frequency independently from the existing colour/noise randomisation.
- `App.tsx` was audited: the handler targets the active, unlocked, non-group layer canvas; pushes undo before applying; passes the complete config to `applyTextureFilterToCanvas`; updates the layer and notifies the texture composite after writeback. The dialog preview calls the same pixel transform.

### Static source audit checklist

| Kind | Pixel branch | Dialog controls | Assessment |
|------|--------------|-----------------|------------|
| `wood` | Yes | Grain type, band/wave frequency, frequency randomisation, ring frequency/noise, roughness, seed, sources, edge/noise/bleed/blur | Wired; frequency randomisation added |
| `hatching` | Yes | Angle/axis, scale, shift, spacing, position/angle jitter, randomisation | Wired; object/world direction remains the documented simplified UV-angle mapping |
| `cross-hatching` | Yes | Shared directional controls | Wired; combines two directional masks |
| `hashing` | Yes | Algorithm, cell size, density, seed, plus shared directional controls | Wired |
| `powderiser` | Yes | Breakup, drift, angle, seed | Defective output-write ordering replaced; visual device confirmation pending |
| `noise-shader` | Yes | Darkness blend, seed | Wired; deterministic colour darkening |
| `dither` | Yes | Tonal levels, hash/Bayer pattern, seed | Wired |
| `mosaic` | Yes | Block size | Wired |

“Wired” here means the current source branch and UI config reach the transform; it is not a claim of Victory's visual acceptance on every source image. No Phase B filters were started.

### Build/package verification

- Source commits: `6b614ed` (Powderiser + Wood algorithm/config) and `fb3b68b` / `0ac87f4` (Wood UI control and label).
- GitHub Actions run #184 / ID `44965787108`: **success**. Vite production build, `npm run host:sync`, blank-page validation, self-host output commit, ZIP and artifact upload all passed.
- Generated self-host commit: `9185d39`; generated JS: `self-host/public/assets/index-CJrL8aCK.js`; CSS: `index-Dy3ptTAc.css`.
- Artifact: [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44965787108/artifacts/14731308126), ID `14731308126`, 2,067,152 bytes, SHA-256 `67899e30db0ebf5a629d50d304d0c2663ce25be648c1d5b6b6fb5d008b0b374e`.

The first two workflow attempts raced with later source pushes and failed only when pushing generated files; the latest run #184 checked out the final source commit and completed every step successfully. No runtime screenshot/device test was performed by the agent.

### Next implementation slice

Proceed to A1: remove Squail from the model menu and set the already Victory-accepted Suzanne Head + Eyes preset as the default. Preserve the existing OBJ source and all other model presets. Then A2 symmetry-on responsiveness. Do not reopen the accepted UV seam or redesign the 3D viewport.
