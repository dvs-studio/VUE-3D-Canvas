# Self-host evening/filter source pack status

The evening/filter upload-pack was committed to `main` in source commit `3c9983eff0c02e94da2728bba17711e09a717e51` and verified by workflow run #137 (`44477900504`). The patch file is not present in the repository tree and must not be reapplied.

The subsequent 2026-11-19 task set is also implemented and packaged. See [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md) and [`AGENTS.md`](AGENTS.md) for current status.

Latest self-host package: [VUE_3D_Canvas_SelfHost artifact](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44480073408/artifacts/14508410797), workflow run #156. Rebuild from the repository root with:

```bash
npm run host:sync
```

Do not edit `crates/vue3d_core` for this self-host task. Preserve both safety ZIPs.
