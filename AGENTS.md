# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-22 late (Grok) — post-fix scrutiny → layer tech

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**3D viewport / UV seam baseline:** still protected. Do not regress Viewport3D, dab composite, or accepted UV island padding without a new repro.

**Prior agent (GPT) claimed Phase A1–A3 done** (Squail removed, Head+Eyes default, powderiser two-pass, wood frequency UI, symmetry stroke state). CI package runs were cited — **not** full device proof.

### Immediate priority — scrutinise self-host after last fixes

Victory reports the **last command / error-diagnosis path is no longer launching** (or equivalent tooling/UI failure after recent fixes). Before new feature work:

1. **Scrutinise the main web self-host app** end-to-end for **bugs and errors introduced by the last fix set** (A1–A3 and any follow-ups), and for **deeper** latent issues in the same areas.
2. Check: app boot, model load (Head+Eyes default), layer filters apply (all kinds, especially powder/dust and wood), symmetry on/off, filter dialog, any “diagnose / last command” or console-driven helper that stopped launching, paint path, export entry points.
3. **Fix** regressions first. Prefer minimal isolated patches. Re-read `SELF_HOST_BUGFIX_2026-11-22.md` for remaining A4–A7 items while scanning.
4. Only when the self-host painter is **stable again**, proceed to the **new major to-do** below.

**Victory tests** unless he asks the agent to test.

### Next major to-do — new layer technology (cloth & related)

After the scrutiny/fix pass, the active feature backlog is the **layer technology** set in [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md):

| ID | Task |
|----|------|
| F8 | Merge bump/displacement → one Levels greyscale → 100% bump (can pair with stabilisation) |
| F6 | Photoshop-style mask layer (beside / independent targets) |
| F1 / F1b | Torn fabric layer + convert + procedural edges + export apply/restore; mesh influence switch |
| F2–F5 | **Cloth filter family** (active plan): world-space cloth, wool/fur, cotton, bamboo-raft, cylindrical wrap, strip stack |
| F7 | Logo fabric — **still ON HOLD** until Victory go-ahead |
| — | Matcap layer + narrow Add menu when ordered |

Remaining chrome from bugfix brief (A4 part selection, A5 panel drag, A6 UV shelf) should be completed as part of stabilisation or immediately before heavy filter/layer work — do not leave the app half-broken.

**Briefs:** [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md) · [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md)  
**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) — append dated section every session.

### Work rules

Meticulous. Research before large edits. Short commits. Do not damage the accepted 3D view. Self-host path only.

## STOP

Prior PIN history in git.
