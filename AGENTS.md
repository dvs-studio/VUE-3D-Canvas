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


## 2026-11-19 — pre-execution: remaining self-host task set

- Read all 22 Markdown files currently present on `main`, including the self-host handoff, task brief, API/architecture references, safety-backup instructions, and historical agent notes. The active product remains the Vite/React/Three.js painter under `src/`, packaged into `self-host/public/`.
- Confirmed the evening/filter upload-pack changes are already on `main` in source commit `3c9983eff0c02e94da2728bba17711e09a717e51`; workflow run #137 (`44477900504`) passed, and generated self-host output was committed at `f7750b72f9a2e19ab8f84e749033ccfa4eab65e1`. Do not reapply the absent offline patch or duplicate its changes.
- Remaining authorised scope from `SELF_HOST_TASK_2026-11-19.md`: export-only Classic / RGB+ORM / AO×albedo modes; Smart UV and layer-UV end-to-end plus seamless UV; Bump Levels/displacement integration; desktop options-bar horizontal scrolling and decimal UI scale; Mountain GLB selection in Preferences; multi-select merge and move-to-group; final `host:sync` and package/device verification.
- Before source changes, inspect each affected implementation and its current data contracts. Preserve current layer export defaults, old `.xblend` compatibility, undo semantics, active UV channel wiring, and the no-regression painting performance constraint. Do not edit `crates/vue3d_core` or either protected safety ZIP. This is a pre-execution record, not a claim that the remaining features are implemented.
