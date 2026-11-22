# Self-host handover

## PIN — read only this far

2026-11-22: Authoritative daily task order: AGENTS.md. Append-only work log: CONVERSATION_LOG.md.

Work rule: change src/, then run npm run host:sync so self-host/public/ matches. A src/** push to main starts build-self-host.yml, which builds, syncs and commits the bundle. Do not hand-edit generated output during an active build. Self-host only unless Victory explicitly orders shell work.

Protected baseline: Victory accepted Suzanne Head + Eyes and the UV-island filter edge fix. The 3D viewport/paint experience is satisfactory. Do not alter Viewport3D, brush dab compositing, UV unwrap/rebake or island padding without a new reproducible issue.

Landed phases: A3 filter recovery (Powderiser two-pass scatter and Wood frequency-randomisation control), A1 model menu/default (Squail removed from menu; Suzanne Head + Eyes default), and A2 symmetry stroke-state isolation are in source. Prior CI run #191 / ID 44966292558 passed with generated output commit e740d02, bundle index-DFGiqoP7.js, artifact 14731757820. That run predates the current Step 0 repair.

Current Step 0 finding: a source scan found a Wood Grain runtime defect: the frequency-randomisation code read woodSeed before its const declaration. The seed is now resolved before entering the pixel loop in source commit 7475d5368f9813f1d6f50db3e10f58d11dd036a8. The automatic self-host build/sync for this commit must complete before the new generated output is treated as current. This repair is not yet device-tested.

Current task order: Step 0 regression scrutiny first: diagnose/last-command launch path, all existing filters, symmetry, startup, Head + Eyes initial state, paint, export, and verify-only subdivision preview. The GPU diagnostics callback and modal are present in source, but do not mark the reported launch issue fixed without an actual runtime test/reproduction. Fix proven regressions minimally. Only after Step 0, proceed to A4 mesh-part filter selection; then remaining 2A stabilisation items in AGENTS.md.

Verification boundary: CI confirms build/package only. Victory should visually verify Wood Grain and Powderiser output, model at launch, symmetry OFF vs X/Y/XY/Z, and the diagnose/last-command workflow. No device or browser interaction test is claimed here.

Assets and safety: src/assets/Suzanne.obj and src/assets/Suzanne.head-eyes.obj remain tracked. Do not delete ZIPs under release/ or self-host/. Do not edit crates/vue3d_core without explicit order.

## STOP

Historical checkpoints remain below in git history. Prefer the current PIN in AGENTS.md for task order.
