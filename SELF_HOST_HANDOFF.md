# Self-host handover

## PIN — read only this far

**2026-11-22:** Authoritative daily PIN: [`AGENTS.md`](AGENTS.md). Append-only work log: [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md).

**Work rule:** change `src/`, then run `npm run host:sync` so `self-host/public/` matches. A `src/**` push to `main` starts `build-self-host.yml`, which builds, syncs and commits the bundle. Do not hand-edit generated output during an active build. Self-host only unless Victory explicitly orders shell work.

**Latest source:** `9525fbaca02336feb8c09470818efda996851f21`. Phase A3 filter recovery, A1 model menu/default, and A2 symmetry path repair are implemented. Powderiser uses two-pass alpha-composited dust scatter; Wood Grain exposes seeded frequency randomisation; Squail is removed from the menu and Suzanne Head + Eyes is the default; each mirrored brush path now owns independent interpolation state and its previous point is included in dirty-composite bounds. Full notes: [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md).

**Latest verified self-host output:** generated commit `0d04087`; JS bundle `index-BusoztmT.js`; CSS `index-Dy3ptTAc.css`. Workflow run #189 / ID `44966159076` passed build, sync, blank-page checks, package and upload. Artifact [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44966159076/artifacts/14731292622), ID `14731292622`.

**Testing boundary:** CI confirms build/package only. Victory should visually verify Powderiser/Wood, Head + Eyes at launch, and symmetry OFF vs X/Y/XY/Z (including long drags and the mirrored trail end). Do not claim these visual behaviours were tested by the agent. The accepted 3D viewport and UV island-edge fix remain protected.

**Next task:** A4 — filter mesh-part selection so filters affect only the selected mesh part(s), leaving other parts unchanged. Reuse the existing mesh component inventory and surface rasterisation where appropriate; do not fork a second rasteriser. Keep work self-host only.

**Assets:** `Suzanne.zip` at repo root. Tracked meshes: `src/assets/Suzanne.obj` and `src/assets/Suzanne.head-eyes.obj`.

**Safety:** do not delete ZIPs under `release/` or `self-host/`. Do not edit `crates/vue3d_core` without explicit order.

## STOP

Historical 2026-11-19 checkpoints (pre-execution, Suzanne notes, UI scroll, UV HUD, Windows shell handover) remain in git history on this path and in prior commits. Prefer AGENTS PIN for current work.
