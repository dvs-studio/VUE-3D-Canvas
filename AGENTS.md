# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

A numbered line is one item inside a set. A history task is a whole set that has been concluded. Checking one line does not make a history task. The `STOP` line comes after History.

### To do — this set (self-host only; expanded 2026-11-19)

Work **only** on the Vite/React/Three.js painter and `self-host/`. Do **not** edit `crates/vue3d_core`. Dedicated full UV desk / NURBS / LTM stay **later** — do not start them in this set.

**Authoritative brief:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md)  
Also see [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md) (pointer + recovery note). Creative freedom on structure/helpers if behaviour matches the brief and paint performance does not regress.

1. Continue toggle-layer PBR work already in the plan (colour+reflection, emission, bump+ramp, normalLock) if not finished.
2. **Export modes:** Classic multi-map; **RGB albedo + ORM** (R=AO, G=Roughness, B=Metallic); optional **multiply ORM AO into albedo**. User chooses before export.
3. **Smart UV (simple upgrades only):** improve chart cuts and light relax/pack; keep planar fallback. No full LSCM/ABF stack unless trivial and safe.
4. **Layer UV selector:** Layer Properties `uvChannel` wired through paint/composite/export. Default project UV when unset. PBR image import can assign the channel.
5. **Seamless UV trigger (minimal):** separate button; fills a dedicated UV set’s full 0–1 for tiling; selectable on layers and PBR import.
6. **Merge Convert to Bump + Displacement** into one Height/Bump flow that opens **Bump Levels** (Photoshop-style), then applies height intent.
7. **Tool Options Bar — desktop scroll:** mode where items overflow **to the right** with a **horizontal scrollbar** (fix inner `flex-wrap` fighting `overflow-x-auto` in `ToolOptionsBar.tsx`).
8. **Preferences → UI scale:** percentage with **decimal** support (e.g. 112.5). Persist on `PreferencesState`; scale chrome, not canvas buffers.
9. Keep Import Texture / Auto-Texture; UV Editor dock Coming soon; subdivision preview only; `npm run host:sync`.
10. Fix **Known code issues** listed in `SELF_HOST_TASK_2026-11-19.md` when touching those files.

### Current implementation

In progress. Self-hosted Vite/React/Three.js painter only. 2026-11-17+ checkpoints (paint coalescing, gizmos, wood grain object-space, etc.) are on main — see commit `61cfb469` / `e592e9e9` notes. Do not edit `crates/vue3d_core`.

**Safety backup (do not delete or overwrite):**
- Canonical: `release/vue3d-self-host-safety-2026-11-14.zip`
- Also under the self-host folder: `self-host/vue3d-self-host-safety-2026-11-14.zip`
- See `self-host/SAFETY_BACKUP.md`

**2026-11-19 — Export / Smart UV / UI task:** Follow `SELF_HOST_TASK_2026-11-19.md`. Do not start the dedicated UV desk/NURBS work in this set.

### Current history — concluded set

2026-11-14 view set. Done. Bundle `index-DXhSIj8p.js`, commit `a1dd03d`.

### History — concluded set

2026-11-12 filter set. Done. Bundles `index-DwCqaqSC.js` and `index-D2VONoEr.js`.

## STOP

Read past this line only if absolutely necessary. The log below grows and is not deleted.

2026-11-09 navigation set, concluded. Free tumble, file normals, full Smooth, UV islands, `file://`.

Gizmo / wood-grain / touch-drag implementation notes from 2026-11-19 remain in git history at commits `61cfb469` and `e592e9e9`. Prefer the PIN and `SELF_HOST_TASK_2026-11-19.md` for current work.
