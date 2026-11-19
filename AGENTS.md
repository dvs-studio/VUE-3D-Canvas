# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

### Agent status (2026-11-19 filter pass)

**Source code for the evening + filter upgrades is NOT fully on `main` until the implementing agent finishes and updates this PIN to “uploaded”.**  
Until then: apply `self-host-evening-2026-11-19.patch` if present, or continue from local tree. Do not assume hashing/multi-select/gizmo size are on GitHub until the completion note below says so.

**Brief:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md)

### Still open (self-host only)

1. Export modes: Classic / RGB+ORM / AO×albedo — **export only**.
2. Smart UV simple upgrades; layer UV end-to-end; seamless UV button.
3. Merge bump/displacement via Bump Levels.
4. Options bar desktop horizontal scroll; UI scale % decimals.
5. Mountain GLB picker fully in Preferences.
6. Multi-select: merge + move-to-group.
7. **Layer filter upgrades (this pass — see task file):**
   - Wood: **banding** and **ring** grain types; **ring noise**; **roughness**; stronger **randomisation** controls.
   - Other filters: expose/upgrade missing useful params (hatching width, powder seed, dither pattern, etc.).
8. `npm run host:sync` after upload; never edit `crates/vue3d_core`.

### Landed offline / in patch (verify after upload)

- gizmoSizePercent, autoHideFloatingDialogs, hashing params, multi-select group/delete.

### When THIS agent finishes

Replace this status block with: code uploaded, list commits, and **“Next agent: start Still open items 1–6; filter wood/ring work is done.”**

### Safety

Do not delete `release/vue3d-self-host-safety-2026-11-14.zip` or `self-host/vue3d-self-host-safety-2026-11-14.zip`.

## STOP

Older history in git. Prefer PIN + SELF_HOST_TASK.
