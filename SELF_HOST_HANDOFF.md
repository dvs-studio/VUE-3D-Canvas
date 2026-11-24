# Self-host handover

## PIN — read only this far

2026-11-24: Root AGENTS.md is authoritative. Detailed P0 audit and execution status are in AGENT_STATE.md; append-only work log is CONVERSATION_LOG.md.

The Gemini Hydrogen troubleshooting audit has been read and its P0 source fixes have landed on remote main. Latest verified source revision: b54476cc1455c9bc18d895bc638cf5d858d315b3. Workflow #258 passed all steps, including TypeScript diagnostics, Vite build, self-host sync, package validation, ZIP and artifact upload. Artifact ID: 14917995630.

The current repair pass fixed the audited TypeScript errors, duplicate View menu, Layers toolbar/Expanded Stack wiring, viewport toolbar overlap, RGB/HSL parsing, hard-coded OBJ export, UV seam continuity, pointer-up event loss, active-UV-channel seam mapping, UV triangle clipping and blur's clip-bypassing image write.

**Verification boundary:** CI confirms compilation and packaging only. Victory still needs to visually test startup, UV seam continuity, UV clipping, symmetry, touch/pen pointer capture, undo/redo, export round-trip and UI layout. Use the checklist in notes/SELF_HOST_P0_REPAIR_2026-11-24.md.

## Next task order

1. A4 — filter mesh-part selection and per-texel UV/part mask.
2. A5 — verify title-drag only; it is already implemented.
3. A6 — 2D UV tool shelf layout, canvas allocation and blend-mode sync.
4. A7 / F8 — non-destructive bump conversion and bump/displacement merge into Levels.
5. UI1 — persist window enable/disable.
6. 2A-W — uniform and organic Wood rings with object/world-space continuity.
7. 2A-T — true triplanar and A/B texture mixing; do not replace built-in sample textures until Victory supplies replacements.
8. 2B, 2C and 2D — layer/filter additions and texture gallery.

2E subdivision remains verify-only. If an item is blocked, document the reason in AGENT_STATE.md and continue the rest of the pass.

## Protected baseline

- Self-host TypeScript application only. Do not modify crates/vue3d_core without explicit order.
- Preserve src/assets/Suzanne.obj, src/assets/Suzanne.head-eyes.obj, release ZIPs and safety archives.
- Do not merge PR #2 or modify its branch unless Victory explicitly asks.
- Do not hand-edit generated self-host/public output while the workflow is running; the workflow builds and syncs it.
- F7 Logo fabric, HOLD-SEL selection cage and dedicated UV desk remain on hold.
- Do not alter the accepted 3D viewport/paint baseline again without a new reproducible issue or explicit user request.

## STOP

