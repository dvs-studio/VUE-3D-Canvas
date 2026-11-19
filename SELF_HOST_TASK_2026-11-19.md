# Self-host task — 2026-11-19 (combined status)

**Scope:** self-host only. No `crates/vue3d_core`. No UV desk / NURBS / LTM this set.

**PBR package modes are export-only.** Standard image import stays as today.

## Done in source (evening pass — needs build/sync verification)

| Item | Status |
|------|--------|
| `gizmoSizePercent` + Preferences slider | Done |
| `autoHideFloatingDialogs` + Preferences checkbox | Done |
| Gizmo footprint scales; mountain overlay import hidden | Done |
| Hashing: size, density, seed, algorithm + dialog UI | Done |
| Filter backdrop dismiss when auto-hide on | Done |
| Layer checkboxes + multi Group/Delete toolbar | Done |
| Long-press multi menu (group/delete) | Done |
| App: group selected / delete selected / rename group | Done |

## Still to do

| Item | Notes |
|------|--------|
| Export Classic / RGB+ORM / AO×albedo | Export dialog + bake pack |
| Smart UV simple upgrades | Cuts, relax, pack, target channel |
| Layer UV wiring end-to-end | Selector exists; honour in paint/export |
| Seamless UV button | Minimal dedicated set fill 0–1 |
| Bump+displacement via Levels | Single menu path |
| Options bar desktop horizontal scroll | `flex-nowrap` + overflow-x |
| UI scale % decimals | Preferences + chrome only |
| Mountain GLB picker in Preferences | Wire IndexedDB from Preferences |
| Multi-select merge + move-to-group | Long-press extensions |
| host:sync + device check | After push |

## Hashing (reference)

- **hashSize** 2–64 px cell size
- **hashDensity** 1–100% activation
- **hashSeed** stable re-apply
- **hashAlgorithm** sparse | cell | grid-jitter
- Then directional shift (angle/shift/randomization) on active pixels

## Creative freedom

Structure/helpers free if behaviour matches and paint latency does not regress. Safety ZIPs never deleted.
