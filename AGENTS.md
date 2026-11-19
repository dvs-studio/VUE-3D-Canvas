# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

### Agent status (2026-11-19 filter pass — COMPLETE offline)

**Filter + evening source is implemented locally and packaged as** `self-host-full-evening-filter.patch` (artifacts / agent workspace).  
**If that patch is not yet committed on `main`, apply it first**, then `npm run build && npm run host:sync`.

**Brief:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md)

### Done this pass (after patch apply)

- Wood: grain type band / ring / band+ring; band frequency; ring frequency; ring noise; roughness; wood seed; randomisation
- Hashing: size, density, seed, algorithm
- Dither: Bayer vs hash + seed; powder/noise seeds
- Gizmo size %, auto-hide dialogs, multi-select group/delete

### Next agent — start here (Still open)

1. Export modes: Classic / RGB+ORM / AO×albedo (**export only**).
2. Smart UV simple upgrades; layer UV end-to-end; seamless UV button.
3. Merge bump/displacement via Bump Levels.
4. Options bar desktop horizontal scroll; UI scale % decimals.
5. Mountain GLB picker fully in Preferences.
6. Multi-select: merge + move-to-group.
7. Confirm patch applied + `host:sync`. Do not edit `crates/vue3d_core`.

### Safety

Do not delete safety ZIPs under `release/` or `self-host/`.

## STOP

Older history in git.
