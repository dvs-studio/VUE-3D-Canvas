# Self-host task — 2026-11-19

**Scope:** self-host only. PBR package modes = **export only**.

## Upload / apply status

| Stage | State |
|-------|--------|
| MD instructions | On `main` |
| Filter + evening source | **Committed** at `3c9983eff0c02e94da2728bba17711e09a717e51`; run #137 passed |
| Follow-up task set | **Implemented and packaged**; run #156 passed |

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

## Completion status — 2026-11-19

All seven follow-up source tasks are implemented on `main`:

1. Export-only Classic / RGB+ORM / AO×albedo package modes.
2. Seeded Smart UV island quarter-turn rotation; per-layer UV channel persistence; seamless active-layer gutter button.
3. Shared Levels conversion for Bump and Displacement.
4. Desktop options-bar horizontal scroll; 0.1%-step UI scale preference.
5. Mountain GLB choose/replace/reset in Preferences, stored in browser-local IndexedDB.
6. Multi-select Merge and Move-to-Group, in addition to Group/Delete.
7. `npm run host:sync` and package verification.

**Source revision:** `5ec840915c3812eacb68f1577659c1ab6b8509e2`  
**Generated self-host commit:** `c26301294da0465d5402b6800fbd15dab39cae59`  
**CI:** run #156 / `44480073408` — success.  
**Artifact:** [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44480073408/artifacts/14508410797) — 1,076,269 bytes.

Limitations and manual checks: AO is a height-derived cavity approximation, not geometry-baked AO; model-file export remains the existing standard format; browser interaction and target-device tests have not been run. Test exported images and 4K performance, UV switching/rebake/seams, Levels undo, Mountain storage reload, merge order/undo, group movement, desktop scroll and decimal scale on device. Safety ZIPs: do not delete.
