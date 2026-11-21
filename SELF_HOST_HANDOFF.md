# Self-host handover

## PIN — read only this far

**2026-11-21:** Authoritative daily PIN is **[`AGENTS.md`](AGENTS.md)**. Conversation summaries: **[`CONVERSATION_LOG.md`](CONVERSATION_LOG.md)** (append-only).

**Work rule:** change `src/`, then `npm run host:sync` so `self-host/public/` matches. A `src/**` push to `main` starts `build-self-host.yml`, which syncs and commits the bundle. Pull before touching `self-host/public`. Self-host only unless Victory orders shell work.

**Stopped:** source `18a80cb` is on `main`. It pads UV-island filter/fill edges, adds hatch scale and jitter, and adds preset `suzanneHeadEyes`. CI bundle `03b8ebd` already contains that page. Do not re-implement those source edits. Next visual checks are still open.

**New on the to-do (not built):** a dedicated **Matcap** layer (alpha-mask paint, convert-to-colour summary, MixRGB export, JPG not EXR) and a responsive Add menu that groups special layer types only when the panel is narrow. Full rules are AGENTS PIN items 9 and 10. This is not the existing HDRI/matcap reflection switch.

**Assets:** `Suzanne.zip` at repo root. Tracked meshes: `src/assets/Suzanne.obj` and `src/assets/Suzanne.head-eyes.obj`.

**Safety:** do not delete ZIPs under `release/` or `self-host/`. Do not edit `crates/vue3d_core` without explicit order.

## STOP

Historical 2026-11-19 checkpoints (pre-execution, Suzanne notes, UI scroll, UV HUD, Windows shell handover) remain in git history on this path and in prior commits. Prefer AGENTS PIN for current work.
