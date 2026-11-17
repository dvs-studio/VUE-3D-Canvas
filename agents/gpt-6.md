# GPT-6 agent log

## 2026-11-17 — self-host viewport checkpoint

- Read the pinned instructions, `AGENT_STATE.md`, `HANDOFF_PROMPT.md`, `SELF_HOST_HANDOFF.md`, and `LAYER_PBR_PLAN.md` before editing.
- Expanded `LAYER_PBR_PLAN.md` with the viewport/model/subdivision/filter backlog and detailed UV roadmap. UV coding remains blocked pending explicit user confirmation.
- Coalesced `notifyTextureUpdated` and added dirty-rectangle recompositing for common 3D painting tools, including eraser. Full PBR rebuild remains on stroke end; target-device latency still needs measurement.
- Updated temporary CSS gizmo axis colours and labels. Future GLB assets and mountain faded/acoustic treatment are deferred.
- Made the existing subdivision panel visible by default; dock/floating mode was already supported. Preview remains non-destructive; destructive Apply is not yet implemented.
- CI run `44196595476` passed and uploaded artifact `14378169255` (bundle `index-DwkyI3V_.js`). This is build/package evidence only, not browser interaction proof.
- Next: verify actual viewport responsiveness on device, complete dynamic mesh part isolation, filter/triplanar work, and decide the undo-safe destructive subdivision workflow. Keep `crates/vue3d_core` and the protected safety ZIP untouched.
