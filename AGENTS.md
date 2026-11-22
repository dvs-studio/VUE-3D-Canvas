# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-22 (GPT-6) — Phase A3 filter recovery

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Accepted by Victory:** the 3D viewport/paint experience is satisfactory; the UV-island filter line is accepted as fixed. Do not change Viewport3D, dab compositing, UV island padding, or the accepted UV seam fix without a new reproduction.

**Phase A3 source work completed:**
- Replaced Powderiser's single-pass scatter writes with a deterministic two-pass process: first preserve/fade source pixels, then alpha-composite dust fragments so later source pixels cannot overwrite them.
- Added Wood Grain's seeded spatial frequency randomisation, with a dedicated dialog control alongside the band/wave and ring frequency controls.
- Audited all eight `TextureFilterKind` branches and traced the selected-layer apply path. Static checklist and limitations are in `SELF_HOST_BUGFIX_2026-11-22.md`.

**Phase A1 completed:** Squail is removed from the model menu. Suzanne Head + Eyes is the initial model, the menu's fallback selection and the viewport fallback. The original Suzanne OBJ and its preset remain preserved in source; they are simply no longer offered as the Squail menu choice.

**Verification:** A3 source `0ac87f4` passed workflow #184 / `44965787108`, generated output `9185d39`. A1 source commits `d78ccf6`, `792abd6`, `b2d33a2` passed workflow #187 / `44965932994`; generated output commit `ad8ad2e`, bundle `index-DrqHAL6X.js`. Latest artifact ID `14731482930`. These are build/package checks, not Victory's visual device test.

**Still required:** Victory to confirm Powderiser's visible breakup and Wood's band/wave frequency variation on an actual layer, and to verify the initial Head + Eyes load visually. Do not describe these behaviours as user-tested yet.

**Next:** A2 — profile and repair symmetry-on brush lag and spanning gaps without touching the normal brush path or the accepted 3D viewport.

**Full brief:** [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md)  
**Fabric plan:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md)  
**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md)

**Testing:** Victory tests unless he asks the agent to test.

### Priority order (bug fixes first)

1. [x] **A3 filter recovery:** audit all eight kinds, repair Powderiser, expose seeded Wood frequency randomisation.
2. **A1 model menu:** remove Squail; make Suzanne Head + Eyes the default.
3. **A2 symmetry brush:** fix lag and spanning gaps only when symmetry is ON.
4. **A4 filter part selection:** pixels outside selected mesh parts remain unchanged.
5. **A5 filter panel title-drag glitch.**
6. **A6 2D UV tool shelf:** original location, group/spacer; top-left except N-panel.
7. **A7 F8 merge bump/displacement conversion.**
8. **Only after the existing suite is healthy:** new filters (warp, pointillism, honeycomb, scatter) and later texture gallery.
9. F1–F6 / F7 follow the fabric plan; F7 logo fabric remains on hold.
 
### Work rules

Meticulous. Research before large edits. Short commits. Append conversation log by date. Do not damage the accepted 3D view.

## STOP

Prior PIN history in git.
