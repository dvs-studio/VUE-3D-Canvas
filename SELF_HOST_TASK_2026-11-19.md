# Self-host task — 2026-11-19

**Scope:** self-host only. PBR package modes = **export only**.

## Upload / apply status

| Stage | State |
|-------|--------|
| MD instructions | On `main` |
| Filter + evening source | **Implemented offline** — apply `self-host-full-evening-filter.patch` if not on `main` yet |
| Next work | Open items below |

## Filter pass (done offline)

### Wood
- Grain type: `band` | `ring` | `band+ring`
- Band frequency, ring frequency, ring noise, roughness, wood seed, randomisation
- Dialog controls in Layer Filter when Wood selected

### Other
- Hashing: hashSize, hashDensity, hashSeed, sparse/cell/grid-jitter
- Dither: hash vs Bayer + seed
- Powder / noise-shader: filterSeed

### Also in same offline package
- gizmoSizePercent, autoHideFloatingDialogs
- Layer multi-select checkboxes, Group/Delete, long-press

## Next agent still open

1. Export Classic / RGB+ORM / AO×albedo
2. Smart UV; layer UV wiring; seamless UV button
3. Bump+displacement via Levels
4. Options bar scroll; UI scale %
5. Preferences Mountain GLB
6. Multi-select merge + move-to-group
7. host:sync + device check

Safety ZIPs: do not delete.
