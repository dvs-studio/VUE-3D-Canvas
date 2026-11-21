# Self-host handover

## PIN — read only this far

**2026-11-21:** Authoritative daily PIN is **[`AGENTS.md`](AGENTS.md)**. Conversation summaries: **[`CONVERSATION_LOG.md`](CONVERSATION_LOG.md)** (append-only).

**Work rule:** change `src/`, then `npm run host:sync` so `self-host/public/` matches. A `src/**` push to `main` starts `build-self-host.yml`, which syncs and commits the bundle. Pull before touching `self-host/public`. Self-host only unless Victory orders shell work.

**Stopped:** source `18a80cb` is on `main`. It pads UV-island filter/fill edges, adds hatch scale and jitter, and adds preset `suzanneHeadEyes`. The self-host page was **not** rebuilt in that session. Do not re-implement those source edits. Next: confirm the CI bundle, then visually test the seam, the Head + Eyes preset, and hatch sliders. Original `src/assets/Suzanne.obj` stays untouched. Do not weld the eye shell.

**Assets:** `Suzanne.zip` at repo root. Tracked meshes: `src/assets/Suzanne.obj` and `src/assets/Suzanne.head-eyes.obj`.

**Safety:** do not delete ZIPs under `release/` or `self-host/`. Do not edit `crates/vue3d_core` without explicit order.

## STOP

Historical 2026-11-19 checkpoints (pre-execution, Suzanne notes, UI scroll, UV HUD, Windows shell handover) remain in git history on this path and in prior commits. Prefer AGENTS PIN for current work.
