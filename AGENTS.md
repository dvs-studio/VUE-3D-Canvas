# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

### Agent status (2026-11-19 — self-host task implemented and packaged)

The active product is the Vite/React/Three.js painter in `src/`, packaged into `self-host/public/`. The evening/filter upload pack is already committed at `3c9983eff0c02e94da2728bba17711e09a717e51`; do not apply or recreate an offline patch.

**Completed task set:**
- Classic / RGB+ORM / AO×Albedo export-only texture packages.
- Seeded Smart UV quarter-turn rotation, per-layer UV channel persistence, and active-layer seamless texture gutter.
- Shared Levels conversion flow for Bump and Displacement.
- Horizontal scrolling desktop options bar and decimal UI scale preference.
- Mountain GLB import/reset in Preferences using browser-local IndexedDB.
- Multi-select Merge and Move-to-Group, alongside Group/Delete.
- Final `npm run host:sync`, package identity validation, ZIP packaging, and artifact upload passed in run #156.

**Current source:** `5ec840915c3812eacb68f1577659c1ab6b8509e2`. Generated self-host output: `c26301294da0465d5402b6800fbd15dab39cae59`. Artifact: [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44480073408/artifacts/14508410797).

**Still required:** manual browser/desktop/Android interaction tests and performance checks. AO is a height-derived cavity approximation, not true geometry AO. Do not claim manual testing from CI success.

**Brief:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md)

### Safety

Do not delete safety ZIPs under `release/` or `self-host/`.

## STOP

Older history in git.


## 2026-11-19 — pre-execution: remaining self-host task set

- Read all 22 Markdown files currently present on `main`, including the self-host handoff, task brief, API/architecture references, safety-backup instructions, and historical agent notes. The active product remains the Vite/React/Three.js painter under `src/`, packaged into `self-host/public/`.
- Confirmed the evening/filter upload-pack changes are already on `main` in source commit `3c9983eff0c02e94da2728bba17711e09a717e51`; workflow run #137 (`44477900504`) passed, and generated self-host output was committed at `f7750b72f9a2e19ab8f84e749033ccfa4eab65e1`. Do not reapply the absent offline patch or duplicate its changes.
- Remaining authorised scope from `SELF_HOST_TASK_2026-11-19.md`: export-only Classic / RGB+ORM / AO×albedo modes; Smart UV and layer-UV end-to-end plus seamless UV; Bump Levels/displacement integration; desktop options-bar horizontal scrolling and decimal UI scale; Mountain GLB selection in Preferences; multi-select merge and move-to-group; final `host:sync` and package/device verification.
- Before source changes, inspect each affected implementation and its current data contracts. Preserve current layer export defaults, old `.xblend` compatibility, undo semantics, active UV channel wiring, and the no-regression painting performance constraint. Do not edit `crates/vue3d_core` or either protected safety ZIP. This is a pre-execution record, not a claim that the remaining features are implemented.
