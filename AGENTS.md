# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-22 (Grok) — Victory test feedback

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. No safety ZIP deletes.

**3D viewport is SATISFACTORY.** Do not regress Viewport3D / paint path / island padding while fixing other areas.

**Victory tested:**
- **Suzanne Head + Eyes** — perfect. **Remove Squail**; make Head + Eyes the **default**.
- **UV seam / island filter line** — **accepted as fixed.**

**Broken / unfinished layer filters (Victory):** some filters **no longer affect the layer at all** (example: **dust / powder-style**). Treat as **regressions or incomplete prior-agent work** — **deep-scan** `textureFilters.ts` + `TextureFilterDialog.tsx` + apply callers; **finish or replace** broken kinds **before** adding new filters.

**Full brief:** [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md)  
**Fabric plan:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md)  
**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md)

**Testing:** Victory tests unless he asks the agent to test.

### Priority order (bug fixes first)

1. Model menu: drop Squail; default Head + Eyes.
2. Symmetry brush lag when ON.
3. **Deep filter audit — broken + unfinished:** dust/powder (no effect), wood UI gaps, every `TextureFilterKind`; wire or rewrite dead paths.
4. Filter part selection.
5. Filter panel title-drag glitch.
6. 2D UV tool shelf layout / grouping.
7. F8 merge bump/displacement conversion.
8. **Only after filters work:** new filters (warp, pointillism, honeycomb, scatter) + later gallery.
9. F1–F6 / F7 hold — fabric plan; not before stabilisation.

### Work rules

Meticulous. Research before large edits. Short commits. Append conversation log by date. Do not damage the accepted 3D view.

## STOP

Prior PIN history in git.
