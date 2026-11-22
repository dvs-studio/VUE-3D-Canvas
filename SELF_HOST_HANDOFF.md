# Self-host handover

## PIN — read only this far

**2026-11-22:** Authoritative daily PIN: [`AGENTS.md`](AGENTS.md). Append-only work log: [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md).

**Work rule:** change `src/`, then run `npm run host:sync` so `self-host/public/` matches. A `src/**` push to `main` starts `build-self-host.yml`, which builds, syncs and commits the bundle. Do not hand-edit generated output during an active build. Self-host only unless Victory explicitly orders shell work.

**Latest source:** `b2d33a20952561aac72a85af28ee56865b5b56b1`. Phase A3 filter recovery and A1 model menu/default are implemented. Powderiser uses two-pass alpha-composited dust scatter; Wood Grain exposes seeded frequency randomisation; Squail is removed from the menu and Suzanne Head + Eyes is the default and fallback. Full audit: [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md).

**Latest verified self-host output:** generated commit `ad8ad2e`; JS bundle `index-DrqHAL6X.js`; CSS `index-Dy3ptTAc.css`. Workflow run #187 / ID `44965932994` passed all build, sync, blank-page, package and upload steps. Artifact [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44965932994/artifacts/14731482930), ID `14731482930`.

**Testing boundary:** CI confirms build/package only. Victory still needs to visually test Powderiser on an image layer, Wood band/wave/frequency randomisation, and the initial Head + Eyes selection. The accepted 3D viewport and UV island-edge fix are not to be reopened without a new repro.

**Next task:** A2 — fix symmetry-on brush lag and spanning gaps. Keep the normal brush path and accepted viewport/paint baseline unchanged. Do not start Phase B filters until the current suite is accepted.

**Assets:** `Suzanne.zip` at repo root. Tracked meshes: `src/assets/Suzanne.obj` and `src/assets/Suzanne.head-eyes.obj`.

**Safety:** do not delete ZIPs under `release/` or `self-host/`. Do not edit `crates/vue3d_core` without explicit order.

## STOP

Historical 2026-11-19 checkpoints (pre-execution, Suzanne notes, UI scroll, UV HUD, Windows shell handover) remain in git history on this path and in prior commits. Prefer AGENTS PIN for current work.
