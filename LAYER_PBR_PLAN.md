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
