# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-22 (Grok) — Victory test feedback

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. No safety ZIP deletes.

**3D viewport is SATISFACTORY.** Do not regress Viewport3D / paint path / island padding while fixing other areas. Prefer minimal, isolated changes.

**Victory tested:**
- **Suzanne Head + Eyes** — perfect. **Remove Squail** (legacy single Suzanne menu/default). Make **Head + Eyes the default** integrated character preset.
- **UV seam / island filter line** — **accepted as fixed.** Do not reopen unless a new repro appears.

**Full brief:** [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md)  
**Fabric/mask design (still not built):** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md)  
**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) — every AI must append a dated section.

**Testing:** Victory tests unless he asks the agent to test.

### Priority order (bug fixes first)

1. **Model menu:** Drop Squail; default = `suzanneHeadEyes` / “Suzanne Head + Eyes”.
2. **Symmetry brush lag** when symmetry is ON (span / delayed dabs); OFF is fine — profile and fix paint path only.
3. **Filter completeness audit** — wood UI missing banding/wave + frequency randomisation exposure; scan other kinds for unfinished dialog ↔ algorithm wiring.
4. **Filter part selection** — optional mesh-part mask so filters do not affect outside selected parts.
5. **Filter panel drag** — drag by title without hang/glitch.
6. **2D UV tool shelf** — restore original location; group/spacer so items do not overlap; top-left grouping except N-panel.
7. **F8** merge bump/displacement conversion (Levels → 100% bump).
8. **New filters** (after fixes): warp/wavy transform, pointillism, vector cells (tri/square/circle/hex honeycomb via world + normal), stochastic scatter.
9. **Texture gallery** (later): bundled libs → device/browser storage; auto downscale by GPU tier (e.g. 1K → 256 on mobile).
10. Feature set F1–F6 / F7 hold — see fabric plan; not before stabilisation.

### Work rules

Meticulous. Research before large edits. Short commits. Append conversation log by date. Do not damage the accepted 3D view.

## STOP

Prior PIN history in git.
