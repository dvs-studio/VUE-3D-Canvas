# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

A numbered line is one item inside a set. A history task is a whole set that has been concluded. Checking one line does not make a history task. The `STOP` line comes after History.

### To do — this set (self-host only)

Work **only** on the Vite/React/Three.js painter and `self-host/`. Do **not** edit `crates/vue3d_core`. Dedicated UV desk / NURBS / LTM stay **later**.

**Brief:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md)  
**Source patch (evening landed work):** see [`PATCH_README.md`](PATCH_README.md) — apply `self-host-evening-2026-11-19.patch` then build/sync.

#### Still open
1. Toggle-layer PBR polish if any gaps remain.
2. **Export modes:** Classic multi-map; RGB+ORM; optional AO×albedo — **export only**.
3. **Smart UV (simple):** better cuts + light relax/pack; planar fallback; target channel write.
4. **Layer UV end-to-end:** honour `layer.uvChannel` in paint/composite/export.
5. **Seamless UV button (minimal):** dedicated set fills 0–1.
6. **Merge bump/displacement** through Bump Levels + keep-colour.
7. **Tool Options Bar desktop scroll:** `flex-nowrap` + horizontal scrollbar.
8. **UI scale %** with decimals.
9. Mountain **GLB import fully in Preferences**.
10. Multi-select: **merge** and **move to existing group** on long-press.
11. `npm run host:sync` after patch applied.

#### Landed in source (apply patch to get these)
- Preferences: `gizmoSizePercent`, `autoHideFloatingDialogs` + Preferences UI.
- Gizmo scales by size %; mountain overlay import quieted.
- Layer filter **hashing:** hashSize, hashDensity, hashSeed, hashAlgorithm + dialog.
- Filter dialog backdrop close when auto-hide on.
- Layers: checkbox multi-select, Group/Delete toolbar, long-press Group/Delete, App group/delete/rename wiring.

### Current implementation

Self-host only. Safety ZIPs must not be deleted.

### Current history — concluded set

2026-11-14 view set. `index-DXhSIj8p.js` / `a1dd03d`.

### History — concluded set

2026-11-12 filter set.

## STOP

2026-11-09 navigation set, concluded.
