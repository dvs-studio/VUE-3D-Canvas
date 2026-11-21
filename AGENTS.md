# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-21 late (Grok)

**Product path:** Vite/React/Three.js under `src/`. Edit `src/`, then `npm run host:sync` so `self-host/public/` stays current.

**Do not edit** `crates/vue3d_core` unless Victory orders it. **Do not delete** safety ZIPs under `release/` or `self-host/`.

**Design brief:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md). **Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md).

**Testing:** Victory tests unless he asks the agent to test for errors.

### Conversation log (required — every AI)

- File: **`CONVERSATION_LOG.md`** — append-only public backlog of decisions.
- **Every AI engine** that works on this repo **must** add a dated section if it has not already for that calendar day.
- Sections are **arranged by date** (`## YYYY-MM-DD — EngineName`). Append under the day; never delete or rewrite older days.
- Personify by engine name (Grok, Claude, …). Summaries only; no secrets.
- Read the full log only when Victory asks. Clarity for future purists depends on this discipline.

### UPCOMING FEATURE SET — NOT BUILT (do not start until Victory orders)

| ID | Feature |
|----|---------|
| F1 | Torn fabric layer + convert paint → torn + procedural white edges + export bake |
| F1b | Mesh / UV influence switch |
| F2–F5 | **Cloth filter family** (menu) — active plan |
| F6 | Photoshop-style mask layer |
| F7 | **Logo fabric** filter — **ON HOLD** until go-ahead |
| F8 | Merge Convert-to-Bump / Displacement into one Levels → bump tool |
| — | Matcap layer + narrow Add menu |

Full algorithms: **`LAYER_FABRIC_MASK_PLAN.md`**.

### Combined to-do (self-host first)

1. Seam/QA of `18a80cb` when relevant (Victory tests by default).
2. Matcap + narrow Add when ordered.
3. **F8** merge bump/displacement UI.
4. **F1 / F1b / F2–F5 / F6** when ordered.
5. **F7 logo fabric** on hold until go-ahead.
6. Specialised UV research-only until asked. Windows shell later.

### Work rules

Self-host only. Short commits. Append under STOP; do not wipe ledgers. **Update `CONVERSATION_LOG.md` by date** before ending a substantial session.

## STOP

Earlier notes live in git history.
