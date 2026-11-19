# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

A numbered line is one item inside a set. A history task is a whole set that has been concluded. Checking one line does not make a history task. The `STOP` line comes after History.

### To do — this set (self-host only)

Work **only** on the Vite/React/Three.js painter and `self-host/`. Do **not** edit `crates/vue3d_core`. Dedicated UV desk / NURBS / LTM stay **later**.

**Brief:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md)

#### Still open
1. Toggle-layer PBR polish if any gaps remain (colour+reflection, emission, bump+ramp, normalLock).
2. **Export modes:** Classic multi-map; RGB+ORM; optional AO×albedo — **export only**.
3. **Smart UV (simple):** better cuts + light relax/pack; planar fallback; target channel write.
4. **Layer UV end-to-end:** paint/composite/export honour `layer.uvChannel` (selector UI exists).
5. **Seamless UV button (minimal):** dedicated set fills 0–1; selectable on layers/import.
6. **Merge bump/displacement** through Bump Levels + keep-colour option; menu labels.
7. **Tool Options Bar desktop scroll:** `flex-nowrap` + horizontal scrollbar (fix inner wrap).
8. **UI scale %** with decimals on `PreferencesState`.
9. Mountain **GLB import fully in Preferences** (viewport overlay already quieted).
10. Multi-select: **merge layers** and **move to existing group** on long-press.
11. `npm run host:sync` after code lands; do not edit `crates/vue3d_core`.

#### Landed in source (2026-11-19 evening pass — verify after sync)
- Preferences: `gizmoSizePercent`, `autoHideFloatingDialogs` + Preferences UI.
- Gizmo scales by size %; mountain import panel removed from always-on overlay.
- Layer filter **hashing:** `hashSize`, `hashDensity`, `hashSeed`, `hashAlgorithm` (sparse/cell/grid-jitter) + dialog sliders.
- Filter dialog backdrop close when auto-hide is on.
- Layers: checkbox multi-select, Group/Delete toolbar, long-press Group/Delete, group rename handler, App wiring for group/delete selected.

### Current implementation

Self-host painter only. Safety ZIP: `release/vue3d-self-host-safety-2026-11-14.zip` and `self-host/vue3d-self-host-safety-2026-11-14.zip` — do not delete.

### Current history — concluded set

2026-11-14 view set. Bundle `index-DXhSIj8p.js`, commit `a1dd03d`.

### History — concluded set

2026-11-12 filter set.

## STOP

2026-11-09 navigation set, concluded. Gizmo/wood-grain notes at `61cfb469` / `e592e9e9`.
