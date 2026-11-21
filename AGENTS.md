# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-21 evening (Grok)

**Product path:** Vite/React/Three.js under `src/`. **Every feature change must update the running self-host package:** edit `src/`, then `npm run host:sync` so `self-host/public/` stays current.

**Do not edit** `crates/vue3d_core` unless Victory explicitly orders Windows-shell work. **Do not delete** safety ZIPs under `release/` or `self-host/`.

**Conversation log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) — append-only. **Feature design brief (new):** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md).

**Testing:** Victory handles testing unless he explicitly asks the agent to test for errors.

### UPCOMING FEATURE SET — announced 2026-11-21 (NOT BUILT)

Victory authorised a **new layer-and-filter design set**. Spec only until an agent is ordered to implement. Full algorithms and execution steps: **`LAYER_FABRIC_MASK_PLAN.md`**.

| ID | Feature | Kind |
|----|---------|------|
| F1 | **Torn fabric / tear layer** | Dedicated layer type |
| F2 | **Cloth displacement filter** | Layer filter (world-space bake) |
| F3 | **Wool / fur, cotton, bamboo-raft cloth modes** | Cloth filter sub-modes |
| F4 | **Cylindrical wrap rebuild** | Cloth filter operator |
| F5 | **Strip stack + per-strip colour ramps** | Cloth/wrap follow-on |
| F6 | **Photoshop-style mask layer** | Dedicated layer type (clip or independent) |
| — | Existing Matcap layer + narrow Add menu | Still PIN items 9–10; not built |

Do **not** start F1–F6 until Victory asks for implementation. Prefer finishing visual checks of `18a80cb` seam work when touching paint code.

### Combined to-do (self-host first)

1. Pull `main`; confirm self-host sync after `18a80cb`; **Victory tests** seam/fill unless he asks otherwise.
2. Visual / device QA checklist from earlier PIN (exports, UV channel, seamless, Levels, scroll, scale, Mountain GLB, multi-select).
3. Matcap dedicated layer + narrow Add menu (items 9–10 — design only until ordered).
4. **When ordered:** implement F1–F6 per `LAYER_FABRIC_MASK_PLAN.md` on `src/` + `host:sync`.
5. Specialised UV desk stays research-only until Victory asks.
6. Windows native redevelopment later (WebView2 shell only).

### Work rules

- Self-host path only for this work. Short commits. Append history under STOP; do not wipe ledgers.

## STOP

Prior 2026-11-21 stop notes (UV pad, hatch jitter, Suzanne head-eyes, typecheck caveats) and 2026-11-19 history remain in git. Prefer this PIN + `LAYER_FABRIC_MASK_PLAN.md` for new layer work.
