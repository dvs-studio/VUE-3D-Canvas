# Toggle layers — task for the next agent

**Current self-host task brief (2026-11-19):** see [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md) for export modes (RGB+ORM), Smart UV upgrades, layer UV, seamless UV button, bump/levels merge, desktop options-bar scroll, and UI scale %.

The full historical plan body (toggle layers, subdivision, import texture, Blender export chains, UV project backlog, 2026-11-17/18 checkpoints, etc.) remains in **git history** at commit `61cfb469` and its parents. It was briefly replaced by a placeholder during a docs push and is not re-inlined here to avoid another oversized failed write.

**Rules still in force**

- Self-host painter only for this work (`src/`, `self-host/`, `npm run host:sync`).
- Do not edit `crates/vue3d_core`.
- Do not delete `release/vue3d-self-host-safety-2026-11-14.zip` or `self-host/vue3d-self-host-safety-2026-11-14.zip`.
- Dedicated UV desk / NURBS / LTM are **later** — not this set.
- Creative freedom on structure; match the behaviour in `SELF_HOST_TASK_2026-11-19.md`; do not regress paint latency.

To recover the long plan text locally:

```bash
git show 61cfb469:LAYER_PBR_PLAN.md > /tmp/LAYER_PBR_PLAN.history.md
```

Then append or merge with `SELF_HOST_TASK_2026-11-19.md` as needed.


## 2026-11-19 — pre-execution: remaining self-host task set

- Read all 22 Markdown files currently present on `main`, including the self-host handoff, task brief, API/architecture references, safety-backup instructions, and historical agent notes. The active product remains the Vite/React/Three.js painter under `src/`, packaged into `self-host/public/`.
- Confirmed the evening/filter upload-pack changes are already on `main` in source commit `3c9983eff0c02e94da2728bba17711e09a717e51`; workflow run #137 (`44477900504`) passed, and generated self-host output was committed at `f7750b72f9a2e19ab8f84e749033ccfa4eab65e1`. Do not reapply the absent offline patch or duplicate its changes.
- Remaining authorised scope from `SELF_HOST_TASK_2026-11-19.md`: export-only Classic / RGB+ORM / AO×albedo modes; Smart UV and layer-UV end-to-end plus seamless UV; Bump Levels/displacement integration; desktop options-bar horizontal scrolling and decimal UI scale; Mountain GLB selection in Preferences; multi-select merge and move-to-group; final `host:sync` and package/device verification.
- Before source changes, inspect each affected implementation and its current data contracts. Preserve current layer export defaults, old `.xblend` compatibility, undo semantics, active UV channel wiring, and the no-regression painting performance constraint. Do not edit `crates/vue3d_core` or either protected safety ZIP. This is a pre-execution record, not a claim that the remaining features are implemented.
