# Self-host handover

## PIN — read only this far

**2026-11-22:** Authoritative daily PIN: [`AGENTS.md`](AGENTS.md). Append-only work log: [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md).

**Work rule:** change `src/`, then run `npm run host:sync` so `self-host/public/` matches. A `src/**` push to `main` starts `build-self-host.yml`, which builds, syncs and commits the bundle. Do not hand-edit generated output during an active build. Self-host only unless Victory explicitly orders shell work.

**Latest source:** `0ac87f4460d78aa30c2c1d582eb9730374b6f9e1`. Phase A3 filter recovery is implemented: Powderiser now scatters in two passes with alpha compositing; Wood Grain exposes seeded frequency randomisation beside band/wave frequency. Static audit of all eight filter kinds and the active-layer apply caller is recorded in [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md).

**Latest verified self-host output:** generated commit `9185d39`; JS bundle `index-CJrL8aCK.js`; CSS `index-Dy3ptTAc.css`. Workflow run #184 / ID `44965787108` passed all build, sync, blank-page, package and upload steps. Artifact [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44965787108/artifacts/14731308126), ID `14731308126`.

**Testing boundary:** CI confirms build/package only. Victory still needs to visually test Powderiser on an image layer and Wood band/wave/frequency randomisation. The accepted 3D viewport and UV island-edge fix are not to be reopened without a new repro.

**Next task:** A1 — remove Squail from the model menu and make the already accepted Suzanne Head + Eyes preset the default. Then A2 — fix symmetry-on brush lag. Do not start Phase B filters until the current suite has been accepted.

**Assets:** `Suzanne.zip` at repo root. Tracked meshes: `src/assets/Suzanne.obj` and `src/assets/Suzanne.head-eyes.obj`.

**Safety:** do not delete ZIPs under `release/` or `self-host/`. Do not edit `crates/vue3d_core` without explicit order.

## STOP

Historical 2026-11-19 checkpoints (pre-execution, Suzanne notes, UI scroll, UV HUD, Windows shell handover) remain in git history on this path and in prior commits. Prefer AGENTS PIN for current work.
