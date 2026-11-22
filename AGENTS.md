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
5. **2E subdiv preview:** Victory reports it **has been done** — **spot-check only**. Fix only if broken; do not rebuild.

**Victory tests** unless he asks the agent to test.

### 2. Current build queue (after app is stable)

Detail: [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md) · [`SELF_HOST_BUGFIX_2026-11-22.md`](SELF_HOST_BUGFIX_2026-11-22.md).

#### 2A — Remaining stabilisation
| ID | Task |
|----|------|
| A4 | Filter **mesh-part selection** — outside parts unchanged |
| A5 | Filter panel **title-drag** without hang/glitch |
| A6 | **2D UV tool shelf** — original location; group/spacer; top-left except N-panel (layout only) |
| A7 / F8 | **Merge** convert-to-bump / displacement → one Levels → **100% bump surface** |
| UI1 | **Persist window / panel enable state** — last enabled/disabled window items across session/reload |
| UI2 | **Menu bar dropdowns dismiss on unfocus** — click away releases open menus so they do not block the UI |
| UI3 | **Giant Undo / Redo** in the **lower part of the 3D viewport** — same placement idea as the viewport gizmo family, but a large, touch-friendly **Undo** and **Redo** control at the bottom of the 3D view (not the menu bar only). Wire to existing undo/redo stack; disable when empty; do not obscure critical paint targeting (offset/safe margin from bottom edge). Respect gizmo size / UI scale prefs if applicable |

#### 2B — Layer technology (cloth & related)
| ID | Task |
|----|------|
| F6 | **Mask layer** — beside or independent targets |
| F1 | **Torn fabric** — convert; black/white/green roles; procedural edges; export apply/restore |
| F1b | **Mesh / UV influence switch** (default off) |
| F2–F5 | **Cloth filter family** (active plan) |
| F7 | **Logo fabric** — **ON HOLD** |
| M1 | **Matcap layer** + **narrow Add menu** |

Keep **import material texture**; do not remove it.

#### 2C — Additional layer filters (after existing suite is healthy)
Warp/wavy transform · Pointillism · Honeycomb/vector cells (tri/square/circle/hex, world+normal) · Stochastic scatter.

#### 2D — Texture gallery (later)
Bundle → browser/device storage + preview; auto-scale by GPU tier (e.g. 1K → 256 mobile).

#### 2E — Subdivision preview docker — DONE (verify only)
Victory: already implemented. Spot-check only; no redesign unless broken.

### 3. Explicitly not in this queue
- Dedicated UV desk / NURBS / LTM / full UDIM product
- Native D3D / `crates/vue3d_core` unless ordered
- F7 logo fabric until go-ahead

**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md).

### Work rules

Meticulous. Short commits. Self-host only. Do not damage the accepted 3D view.

## STOP

Prior PIN history in git.
