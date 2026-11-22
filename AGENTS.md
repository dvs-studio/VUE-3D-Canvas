# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-22 late (Grok) — post-fix → mixed layer/filter backlog

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Protected:** 3D viewport / paint path / accepted UV-island seam fix. Do not regress without a new repro.

**Out of this phase:** dedicated / specialised UV desk (NURBS, LTM, full UV product) — research only if Victory asks; **not** part of the current build queue.

**Prior agent (GPT) claimed A1–A3 done** (Squail removed, Head+Eyes default, powderiser, wood freq UI, symmetry). CI only — not device proof.

### 1. Immediate — scrutinise self-host after last fixes

Victory: **last command / error-diagnosis no longer launching** (or equivalent after recent fixes).

1. End-to-end scrutiny of the **main web self-host app** for regressions from A1–A3 and deeper issues in the same areas.
2. Check boot, Head+Eyes default, **all filters** (powder/dust, wood, …), symmetry on/off, filter dialog, diagnose/last-command UI, paint, export.
3. **Fix** regressions first (minimal patches).
4. Finish remaining stabilisation chrome while here (see §2A). Then §2B–2D.

**Victory tests** unless he asks the agent to test.

### 2. Current build queue (after app is stable)

Mixed from Victory’s tests + earlier conversation (cloth/torn/mask, filters, chrome). Detail: [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md) · [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md).

#### 2A — Remaining stabilisation (from bugfix brief)
| ID | Task |
|----|------|
| A4 | Filter **mesh-part selection** — outside parts unchanged |
| A5 | Filter panel **title-drag** without hang/glitch |
| A6 | **2D UV tool shelf** — original location; group/spacer; top-left except N-panel (layout only; no unwrap rewrite) |
| A7 / F8 | **Merge** convert-to-bump and convert-to-displacement → one Levels greyscale → **100% bump surface** |

#### 2B — Layer technology (cloth & related)
| ID | Task |
|----|------|
| F6 | **Mask layer** — beside (clip one) or independent (checkbox targets above/below) |
| F1 | **Torn fabric** — convert paint→torn; black/transparent=hole; white=edge (procedural); green=influence; apply-down bake; export apply then **restore** |
| F1b | **Mesh / UV influence switch** on layer control (default off = normal paint) |
| F2–F5 | **Cloth filter family** (active): world-space cloth displace; wool/fur; cotton; bamboo-raft; cylindrical wrap + plaster fallback; strip stack + per-strip ramps |
| F7 | **Logo fabric** filter — **ON HOLD** until Victory go-ahead |
| M1 | **Matcap layer** (dedicated; paint=alpha only; convert-to-colour recipe; JPG) + **narrow Add menu** when panel is tight |

Keep **import material texture** feature; do not remove it while adding types.

#### 2C — Additional layer filters (after existing suite is healthy)
| Task | Notes |
|------|--------|
| Warp / wavy layer transform | Displace texture |
| Pointillism | Stipple from layer colour |
| Honeycomb / vector cells | World + surface normal; forms: triangle, square, circle, hex |
| Stochastic scatter | Stackable; later ties to gallery assets |

#### 2D — Texture gallery (later slice in same era)
Bundled library → **browser/device storage** with preview; **auto-scale** by GPU/device tier (e.g. ship 1K, bake 256px on mobile). Point scatter/fills at gallery when ready.

#### 2E — Optional preview (from earlier ask; non-destructive)
**Subdivision-style preview docker** (Blender-like feel): preview only, **never** writes into the real mesh; bump/displacement-sensitive and crease/sharp-edge-aware if feasible. Low priority vs F1–F6 and filter recovery.

### 3. Explicitly not in this queue
- Dedicated UV desk / NURBS / LTM / full UDIM product
- Native D3D paint engine / `crates/vue3d_core` unless Victory orders
- F7 logo fabric until go-ahead

**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) — every AI appends by date.

### Work rules

Meticulous. Research before large edits. Short commits. Self-host only. Do not damage the accepted 3D view.

## STOP

Prior PIN history in git.
