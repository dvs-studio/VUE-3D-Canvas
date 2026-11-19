# Self-host task — 2026-11-19 (export, Smart UV, UI, layer UV)

This file is the **authoritative technical brief** for the current self-host task set.
The long historical `LAYER_PBR_PLAN.md` body before this task remains in git history at commit `61cfb469` (and parents).

**Scope:** self-host only. No `crates/vue3d_core`. No dedicated UV desk / NURBS / LTM in this set.

## 2026-11-19 — Self-host export, Smart UV, UI, layer UV

**Scope: self-host painter only** (`src/`, `self-host/`, `npm run host:sync`). Do not edit `crates/vue3d_core`. Do not implement the dedicated UV desk, NURBS grease/pen, or LTM format in this set.

**Creative freedom:** Restructure helpers and choose engineering approach freely as long as (1) user-visible behaviour matches this section, (2) paint latency does not regress, (3) legacy `.xblend` still opens, (4) safety ZIP is never deleted. Prefer small commits and `npm run host:sync` when a slice is runnable.

### Preliminary instructions (read before coding)

1. Pull `main`. Read `AGENTS.md` PIN and **this file**. Stop at STOP in AGENTS unless a bug names an older set.
2. Inspect live code before editing:
   - `src/tools/smartUVUnwrap.ts` — Smart UV (angle charts, planar project, shelf pack)
   - `src/tools/uvChannelManager.ts` — UV channels on `geom.userData`
   - `src/tools/layerConversions.ts` — separate bump vs displacement converts
   - `src/ui/BumpLevelsDialog.tsx` — Photoshop-style levels (exists)
   - `src/ui/LayerSettingsModal.tsx` — UV channel select already present
   - `src/ui/ExportTextureDialog.tsx` — only `merged` | `alpha_mask` today
   - `src/ui/ToolOptionsBar.tsx` — clusters wrap vs horizontal scroll
   - `src/ui/PreferencesModal.tsx` + `PreferencesState` in `src/core/types.ts`
   - `src/ui/panels/LayersPanel.tsx` — convert context menu
3. Fix Known code issues when touching those files.
4. Bookend notes on AGENTS / agents/<you>.md before first code push and after sync.

### Investigation snapshot

| Area | Live fact | Implication |
|------|-----------|-------------|
| Layer model | `Layer.uvChannel?: string`, `groupId` / `isGroup` | Per-layer UV dataready; groups organise PBR import stacks |
| Layer settings | UV select in `LayerSettingsModal` | Wire paint/composite/export to `layer.uvChannel` |
| UV manager | Channels in `userData.uvChannels` | Seamless set = new channel filled 0–1 |
| Smart UV | Angle-grow (default 60°), planar project, shelf pack, bleed | Upgrade cuts + light relax/pack only |
| Convert | Dual bump/displacement entries | Merge via Bump Levels |
| Export | No ORM modes yet | Add Classic + RGB+ORM |
| Options bar | `clusters` uses flex-wrap; outer overflow-x but **inner still flex-wrap** | Desktop horizontal scroll broken |
| UI scale | No `uiScalePercent` on preferences | Add decimal percent |

### Known code issues

1. **ToolOptionsBar.tsx:** For scroll layouts use `flex-nowrap` + `overflow-x: auto` on the row; do not wrap.
2. **Preferences labels:** Name all layout modes including minimal and desktop-scroll clearly.
3. **layerConversions:** Merge bump/displacement UX through levels; optional keep-colour checkbox.
4. **ExportTextureDialog:** Honour per-layer `uvChannel`; add export package modes below.
5. **Viewport3D `uvGeometryVersion`:** Do not regress destructuring default (`e6c3201`).

### A. Export modes (user-selectable before export)

| Mode | Outputs |
|------|---------|
| Classic multi-map | Separate albedo, roughness, metallic, normal, height… as available |
| RGB + ORM | Pure RGB albedo + ORM pack **R=AO, G=Roughness, B=Metallic** |
| RGB + ORM, AO into albedo | Albedo = `albedoRGB * AO` (clamp 0–1) + ORM image |

Normal/emission/height stay extra files when present. AO neutral if missing (document chosen neutral). Optional zip + manifest (mode, files, uv channel ids). PBR import may tag ORM and split channels.

### B. Smart UV simple upgrades

Current: island grow by angle → planar project → shelf pack → write UVs.

Allowed: better dihedral cuts; max island size; optional short UV relax with boundary pin + planar fallback; pixel bleed; optional 0/90 pack rotation; write to target channel id for seamless set. No full LSCM/ABF/ARAP required this set.

### C. Layer UV selection

Ensure `onSetUVChannel` wired from App. Default UV when unset. Paint/fill/export use layer channel. PBR image import assigns default or chosen channel to new layers in the group.

### D. Seamless UV trigger (minimal)

Separate button. Creates/fills dedicated UV channel covering full 0–1 of that set for selection/submesh (shared slot for tiling). Selectable on layers and PBR import. No UDIM multi-file sequence required now.

### E. Merge bump / displacement + levels

One menu action **Convert to Height / Bump…** → `BumpLevelsDialog` → apply levels + height pbrSettings; checkbox to keep colour contribution. Update LayersPanel labels.

### F. Tool options bar desktop scroll

Preferences mode **Desktop / Original (scroll)**: single row, `flex-nowrap`, horizontal scrollbar, overflow to the right. Fix status string.

### G. UI scale percentage

`PreferencesState.uiScalePercent` (default 100). Decimal input (e.g. 112.5), clamp ~75–200. Scale chrome via CSS variable/zoom; do not rescale WebGL buffers incorrectly.

### H. Out of scope

Full UV desk, NURBS grease/pen, LTM, UDIM multi-tile pipeline, Windows/Rust shell.

### Verification

`npm run build`, `npm run host:sync`. Manually check export files, layer UV paint, seamless fill, levels convert, horizontal scroll bar, UI scale decimals. CI ≠ device proof.
