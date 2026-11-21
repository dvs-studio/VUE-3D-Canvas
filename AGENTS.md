# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-21 late (Grok)

**Product path:** Vite/React/Three.js under `src/`. Edit `src/`, then `npm run host:sync` so `self-host/public/` stays current.

**Do not edit** `crates/vue3d_core` unless Victory orders it. **Do not delete** safety ZIPs under `release/` or `self-host/`.

**Design brief:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md) (expanded). **Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md).

**Testing:** Victory tests unless he asks the agent to test for errors.

### UPCOMING FEATURE SET — NOT BUILT (do not start until Victory orders)

| ID | Feature |
|----|---------|
| F1 | Torn fabric layer + **convert paint → torn** + procedural white edges + export bake |
| F1b | Mesh / UV **influence switch** (per layer control) |
| F2–F5 | Cloth filter family — **ON HOLD** until Victory gives go-ahead |
| F6 | Photoshop-style mask layer |
| F7 | **Logo fabric** layer filter (colour isolate + weave + bump/thread dispersal) |
| F8 | **Merge** Convert-to-Bump and Convert-to-Displacement into one greyscale Levels tool |
| — | Matcap layer + narrow Add menu (still planned) |

Full algorithms: **`LAYER_FABRIC_MASK_PLAN.md`**.

### Combined to-do (self-host first)

1. Seam/QA of `18a80cb` package when touching paint (Victory tests by default).
2. Matcap layer + narrow Add menu when ordered.
3. **F8** merge bump/displacement conversion UI (Levels → 100% bump surface).
4. **F1 / F1b / F7 / F6** when ordered — see plan file.
5. **F2–F5 cloth** remains on hold until explicit go-ahead.
6. Specialised UV desk research-only until asked. Windows shell later.

### Work rules

Self-host only. Short commits. Append under STOP; do not wipe ledgers.

## STOP

Earlier 2026-11-21 and 2026-11-19 notes live in git history.
