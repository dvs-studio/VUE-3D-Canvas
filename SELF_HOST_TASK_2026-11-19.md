# Self-host task — 2026-11-19 (combined + filter pass)

**Scope:** self-host only. No native shell. PBR package modes = **export only**.

## Upload status

| Stage | State |
|-------|--------|
| Agentic MD pre-instructions | This file / AGENTS PIN |
| Evening source (gizmo, multi-select, hashing) | Local / patch — **upload after filter edits** |
| Wood + filter upgrades | **In progress after MD push** |
| Post-completion MD note | After source upload |

## Layer filters — required upgrades (implement before marking done)

### Wood Grain (priority)

Current wood uses stacked sources + object-space grain along an axis. Add:

| Control | Meaning | Suggested range |
|---------|---------|-----------------|
| **Grain type** | `band` · `ring` · `band+ring` mix | enum |
| **Band frequency** | Parallel band tightness | 1–100 |
| **Ring frequency** | Concentric ring tightness | 1–100 |
| **Ring noise** | Warps rings so they are not perfect circles | 0–100 |
| **Roughness** | Softens / frays grain edges | 0–100 |
| **Randomisation** | Seed + spatial jitter for band and ring | 0–100 + seed |

**Hook:** `src/tools/textureFilters.ts` wood branch in `transformTexturePixels`. Add fields on `TextureFilterConfig`. Expose in `TextureFilterDialog` when `kind==='wood'`.

Ring: distance from centre (or axis-perpendicular) as phase: `sin(length(perp)*ringFreq + noise*ringNoise)`. Band: parameterise directional wave frequency separately from density.

### Other filters (upgrade if cheap)

| Filter | Upgrade |
|--------|--------|
| Hashing | size, density, seed, algorithm — keep |
| Hatching / cross | Line width (bleed); optional second angle |
| Powderiser | Seed; fragment size |
| Dither | Bayer vs hash; seed |
| Mosaic | Soft edge optional |
| Noise-shader | Seed; scale |

### Still open product work

Export ORM, Smart UV, seamless UV, bump/levels merge, options-bar scroll, UI scale %, Preferences GLB, multi merge/move-to-group.

## Completion checklist

1. MD pre-upload on GitHub.
2. Implement wood banding/rings/noise/roughness/randomisation + dialog.
3. Small upgrades to other filters where hooked.
4. Upload source (evening + filter).
5. Update AGENTS: **uploaded, filter pass complete; next agent starts Still open 1–6.**
