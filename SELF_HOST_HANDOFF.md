# Self-host handover

## PIN — read only this far

Same sets as `AGENTS.md`. `STOP` comes after History.

### To do — this set, not started

The ten numbered items in the `AGENTS.md` pin. How: [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md).

**Safety backup (do not delete or overwrite):**
- `release/vue3d-self-host-safety-2026-11-14.zip` (canonical)
- `self-host/vue3d-self-host-safety-2026-11-14.zip` (same backup inside this folder; added 2026-11-19)
- See also `self-host/SAFETY_BACKUP.md`

### Current implementation

See `AGENTS.md` PIN (in progress on self-host painter). Do not edit `crates/vue3d_core`. Do not delete the safety ZIP.

### Current history — concluded set

2026-11-14 view set. Zoom redraws. The canvas follows the window. `index-DXhSIj8p.js`.

### History — concluded set

2026-11-12 filter set. Triplanar, Scatter, and Edge Wear open and stay off the view. The view sleeps while idle.

When the to-do set is concluded, move the filter set under `STOP`. Do not delete it.

## STOP

Read past this line only if absolutely necessary.

2026-11-09 navigation set, concluded. Free tumble, file normals, full Smooth, UV islands, `file://`.

The detailed 2026-11-17 / 2026-11-18 execution checkpoints remain in git history for this file (commits before this PIN refresh). Prefer the PIN above for current work. Full recent self-host detail is also in Actions logs and `LAYER_PBR_PLAN.md`.

Read this file first. The product to finish is the self-hosted painter. Do not start the Windows DirectX rewrite until Victory says this folder is accepted.

## What to run

- Folder: `self-host/`
- Open `self-host/public/index.html` with `file://`, or `node server.js` / `npm run host` for `http://`
- Rebuild with `npm run host:sync`
- Do not edit `crates/vue3d_core`. Do not delete `self-host/vue3d-self-host-safety-2026-11-14.zip` or `release/vue3d-self-host-safety-2026-11-14.zip`.


## 2026-11-19 — blank-screen repair
`Viewport3D` used `uvGeometryVersion` in effect dependency arrays without receiving it in the component parameter destructuring. This free identifier caused a render-time `ReferenceError`, explaining the blank screen on both desktop and hosted Android. The prop is now destructured with a safe default (`0`); `App.tsx` already passes the version. Commit: `e6c3201a0d3d93a540599ec21d2cab2eaca19458`. The safety archive dated 2026-11-14 was not modified. CI and manual device checks are still required before calling the hosted build verified.
