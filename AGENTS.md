# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-23 (Grok-Atelier-PIN)

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Protected:** 3D viewport / paint path / accepted UV-island seam fix. **Carve-out:** S0-1 stroke continuity only as ordered.

**Agent identity:** Unique session id in `CONVERSATION_LOG.md`. This PIN author: **Grok-Atelier-PIN** / `LOG-2026-11-23-GROK-ATELIER-PIN`.

---

### EXECUTE NOW — one pass (Victory 2026-11-23)

**All items under CURRENT TODO below are active.** Do them **in one continuous pass** so Victory can investigate/test everything together.

- Work **top to bottom** (Step 0 → 2A → 2A-W → 2A-T → 2B → 2C → 2D).
- If one item is blocked, note why in `AGENT_STATE.md`, skip it, **continue the rest** — do not stop the pass.
- End with **`npm run host:sync`** (or equivalent) and a **short checklist** of what landed for Victory’s device test.
- Self-host only. Unique agent log id when you append `CONVERSATION_LOG.md`.

**Still excluded (need confirmation / hold — do not build):**
- **F7** Logo fabric — ON HOLD
- **HOLD-SEL** selection cage — until Victory acknowledges
- Dedicated UV desk / NURBS / LTM product — until Victory asks

**2E** = verify only (already done; fix only if broken).

---

### USER-UPDATED EXECUTION ORDER — 2026-11-25

Victory has refined the texture architecture and sequencing. This update takes precedence over older 2D gallery integration assumptions:

1. Build the shared Asset Gallery as an independent, unmounted module first. The foundation is in `src/tools/assetGallery.ts` and `src/ui/AssetGalleryModule.tsx`; see `notes/ASSET_GALLERY_MODULE_2026-11-25.md`.
2. Do not integrate the gallery into App menus, Brush settings, Triplanar, Material Fill, Mask, Stencil, Brush Texture, or Matcap yet. Finish and verify the other outstanding application tasks first; then connect consumers individually.
3. Add the new **A6-N 2D UV left N-Panel** task: reorganise the existing 2D UV workspace controls into a left-side N-Panel. Preserve existing UV channel/composite/rebake/selection/touch behaviour. Do not confuse this with a new dedicated UV desk, which remains excluded.
4. Brush settings now use canonical Stencil and image Pattern/Brush Texture gallery accordions with a selected-image micro-preview beneath the menu bar. The brush stamp's stencil is the actual image including transparency; image patterns remain distinct from procedural patterns. Preserve this distinction.
5. Correct Base Layer dialog button copy from Cancel to Close. Close retains live session settings; Save alone persists checker colours.
6. Shape-sensitive world-space Base Layer checker is implemented with curvature-adaptive tile frequency. The procedural sphere startup, alphabetically ordered Suzanne presets and sphere-pole subdivision repair are also implemented; verify them before acceptance.

The canonical gallery is now mounted and integrated; folder scanning imports originals into the same IndexedDB stores with source path/modified-time reconciliation. Workflow #386 passed TypeScript, Vite build, self-host sync, package validation and artifact upload (artifact `15000797321`). Browser migration/import/quota and picker acceptance remain outstanding. The scanner must continue feeding the canonical store, never become a competing asset database.

### READ THIS FIRST — three boxes

**1. Tear layer (F1) = LAYER TYPE** — Black → layer below; White → torn edges; Green → stack mask. Not fabric multiply.

**2. Pattern Craft = FILTERS** — empty layer → B&W displacement pattern; painted layer → multiply/micro-detail into paint.

**3. Filter mesh/UV limit ≠ Tear panel target scope** — two controls.

---

### CURRENT TODO — all active for this pass

> **Last code repair agent:** GPT-6 / LOG-2026-11-24-GPT6-REPAIR-PASS-02 — 2026-11-24  
> **Latest audit agent:** Gemini Hydrogen / LOG-2026-11-24-GEMINI-HYDROGEN-TROUBLESHOOT — 2026-11-24 (pinpointed P0–P2 report in AGENT_STATE.md).  
> **Remote main:** the audited P0 source fixes are committed to remote main; no manual git push is pending.  
> **Latest verification:** workflow #258 passed TypeScript diagnostics, Vite build, self-host sync, package validation and artifact upload. Artifact ID 14917995630.  
> **Next code agent picks up at:** remaining focused code items are Tear mesh-part target scope, separate filter mesh/UV limit, Pattern Craft material/export workflow, Matcap export/stacking, Honeycomb world/normal-space mapping, GPU-tier gallery auto-scale and resource packaging. UI3 Undo/Redo viewport reproduction also remains. A5, 2E, A6/A7/UI1 and all recent rendering/layer work require Victory's manual acceptance; keep 2E verify-only. The Step 0 checklist is in notes/SELF_HOST_P0_REPAIR_2026-11-24.md.

#### Step 0
- [x] **S0-1** UV seam continuity — cached per-triangle UV-island IDs based on shared geometric edges and matching UV coordinates; reset only affected stroke paths and retain the entry dab. Active UV channel/version is respected.
- [x] **S0-2** Powderiser double noise/100 — fixed to noise at line 363 (f551511).
- [x] **PERF-1/2** RAF gate + coalesced pointer events; pointer-up/cancel flushes final samples before ending stroke.
- [x] **PERF-4** Clone stamp temp canvas cached per stroke (f551511).
- [x] **P0 TS-1..5** audited TypeScript issues fixed; npm run lint is now required in CI.
- [x] **P0 UI-BUG-1..4** duplicate View menu, bulk action layout, Expanded Stack props and viewport toolbar overlap corrected.
- [x] **P0 EXPT-1** OBJ exports active geometry; glTF/FBX dialog receives active mesh.
- [x] **P0 FILT-1** RGB/RGBA/HSL tint parser corrected.
- [x] **P0 PAINT-1..2** UV-island seam detection, per-path reset, pointer capture and final queue flush corrected.
- [x] **UV coverage** 3D brush, eraser, pen, gradients, clone, smudge, blur and Mask Brush are clipped to active UV triangle coverage.
- [ ] Manual acceptance still outstanding: startup, Undo/Redo, symmetry, paint seam/clipping, export round-trip, pointer/touch and UI sizing. CI is not visual acceptance.
- [ ] **2E** Subdivision preview — verify only; do not redesign unless a reproducible regression is found. A reported procedural-sphere pole defect has a targeted repair; verify the poles/seam and confirm no regressions.
- [ ] Continue remaining Step 0 regression scrutiny as part of manual acceptance.


#### Step 0
- [x] **S0-1** UV seam continuity — cached per-triangle UV-island IDs, per-path reset and entry dab; active UV channel/version respected.
- [x] **S0-2** Powderiser double `noise/100` — fixed to `noise` at line 363 (`f551511`)
- [x] **PERF-1/2** RAF gate + coalesced pointer events; pointer-up/cancel flushes final samples before ending stroke.
- [x] **PERF-4** Clone stamp temp canvas cached per stroke (`f551511`)
- [ ] Manual acceptance still outstanding: startup, Undo/Redo, symmetry, paint seam/clipping, export round-trip, pointer/touch and UI sizing.
- [ ] **2E** Subdiv preview — verify only

#### 2A Stabilisation
- [x] **A4** Filter mesh-part selection — App wiring, active-UV triangle mask, outside-part pixel preservation, preview mask and non-blocking portal dialog landed; CI passed. Manual component/edge acceptance remains.
- [ ] **A5** Filter panel title-drag — drag already implemented in TextureFilterDialog; **verify only** on desktop and touch.
- [x] **A6** 2D UV workspace — active UV channel selector, blend-mode-aware composite, resolution-aware canvases/rebake, cached selection shade canvas, shelf layout and scoped `N` shortcut landed; CI passed. Manual viewport acceptance remains.
- [x] **A7 / F8** Bump/Displacement → Levels — Levels now stored as non-destructive PBR metadata; original color pixels remain intact; height merge opens Levels at 100% bump influence; viewport, subdivision and XBlend height output consume the Levels data. CI passed. Manual PBR/export acceptance remains.
- [x] **UI1** Persist Window menu panel visibility and floating/docked state in browser storage; defaults remain backward-compatible.
- [x] **UI2** Menu dropdowns dismiss on outside pointer or Escape; pointer-leave no longer closes native selects.
- [ ] **UI3** Giant Undo/Redo lower 3D viewport — could not reproduce; scan for oversized element
- [x] **A6-N** Reorganised the existing 2D UV workspace into a left-side N-Panel; Display tab now owns wireframe visibility/opacity/colour, while Channels owns UV-set selection and Unwrap owns Smart UV entry. CI workflow #320 passed; manual acceptance remains. See `notes/UV_N_PANEL_LEFT_LAYOUT_2026-11-25.md`.

#### 2A-W Wood rings
- [x] Uniform tree-year rings and organic fingerprint/merged rings; active-UV surface mapping, normal-derived curvature influence, object/world coordinate selector implemented. World mode applies the owning mesh's live `matrixWorld` via an ephemeral geometry property; visual acceptance remains. See `notes/WOOD_FILTERS_MATCAP_AND_CURVATURE_2026-11-25.md`.

#### 2A-T Triplanar / dual-texture fill
- [x] True triplanar: XY/YZ/ZX projection with normal-weight blending and sharpness controls (manual acceptance remains).
- [x] Texture A/B mix with procedural mixer modes and mask/height influence (manual acceptance remains).
- [x] World | object coordinate option; world mode uses the owning mesh's live `matrixWorld`.
- [x] Mesh-position / UV-island-safe raster sampling retained. [ ] Visual seam/gutter acceptance remains.

#### 2B Layer + Pattern Craft
- [x] **F6** Mask layer — dedicated white-default, target-linked mask layer implemented. Grayscale luminance controls target opacity; black conceals, white reveals, grey partially reveals; multiple masks multiply; visibility and mask opacity are respected. Deleting a target removes its dependent masks. Manual brush/undo/group acceptance remains.
- [x] **F1** Tear layer — black/transparent cuts through to the immediate layer below; white retains and frays the edge beside holes; green masks the configured underlying stack depth (1–8, default 2). Dedicated Tear Layer creation and green stack-depth control implemented. Manual painting/stack acceptance remains.
- [ ] Tear panel mesh/target scope
- [x] Filter-side mesh/UV limit (separate): exact active-UV triangle write mask intersects mesh-part mask; Workflow #402 passed; manual alternate-channel/island/gutter acceptance remains.
- [x] **Pattern Craft** filter — empty layers generate monochrome displacement patterns; painted layers receive multiply-style micro-detail. [ ] Additional material/export workflow acceptance remains.
- [x] **M1** Dedicated Matcap layer creation and viewport shader support for built-in/custom Matcap source. [ ] Narrow Add menu, export-map support and visual acceptance remain.
- [x] Keep material import

#### 2C Additional filters
- [x] Warp / wavy transform
- [x] Pointillism
- [x] Honeycomb / vector cells (triangle/square/circle/hex)
- [x] Stochastic scatter
- [ ] World/normal-space cell mapping and visual acceptance.

#### 2D Texture gallery
- [x] Independent IndexedDB gallery with separate metadata/original/thumbnail stores and versioned migration.
- [x] Dedicated Asset Gallery workspace tab with import, delete, category assignment, search, preview and folder scan.
- [x] Folder scanner reconciles into the canonical gallery with per-category classification and source-path/size/modified-time refresh.
- [x] Shared gallery pickers integrated into Stencil, Brush Texture/image Pattern, Pattern Stamp decal/mask/grunge, Mask/Tear, Material Fill, Triplanar and Matcap consumers.
- [ ] Browser/device storage migration, quota, import, alpha and picker acceptance; GPU-tier auto-scale; bundle/resource packaging.

---

### P0 audit repair status (2026-11-24)

See notes/SELF_HOST_P0_REPAIR_2026-11-24.md. The audited TypeScript, UI, OBJ export, RGB/HSL parsing, UV seam/pointer queue and UV coverage clipping defects have source fixes on remote main. Final CI run #258 passed with artifact 14917995630. Manual acceptance remains outstanding; 2E is verify-only.

### Triplanar implementation state

- Three-axis XY/YZ/ZX projection with normal-weight blending and sharpness is implemented.
- A/B mixing supports procedural mixer modes and mask/height influence.
- Object/world coordinate sampling uses the live owning-mesh matrix.
- Active-UV surface rasterisation and off-mesh/gutter protection are retained.
- Canonical Surface Texture Gallery selection is integrated; built-in presets remain available as fallbacks.
- Manual acceptance remains for transformed meshes, seams/gutters, sharpness, A/B modes and gallery selection.

**Detail:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md) · **Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) · **Pinpointed Bugs:** [`AGENT_STATE.md`](AGENT_STATE.md) · **API:** [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) · **Architecture:** [`DEVELOPMENT.md`](DEVELOPMENT.md)

### Work rules

Meticulous. Unique agent ids. Short commits. Do not damage accepted 3D view. Mark done in PIN only after code landed + synced (Victory still device-tests).

## STOP

Prior history in git. F7 / HOLD-SEL / dedicated UV desk remain excluded.


### 2026-11-24 follow-up execution — A4, A6 and A7

Latest source revision: `9a123232144be0a979e7961dfa80a944c78e8c59`.

- A4 CI: [Run #262](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45387796699), artifact `14918105222`.
- A6 CI: [Run #265](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45388498049), artifact `14918012437`.
- A7 and combined latest package: [Run #283](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45389964959), artifact `14917704031`.

CI verifies TypeScript diagnostics, Vite build, self-host sync, package validation and upload only. No browser/device visual acceptance is claimed. Manual checks remain for part-filter isolation, alternate UV channels, rebake resolution, blend modes, title dragging, non-destructive color preservation, bump influence, height merge and XBlend/export round-trips. Built-in triplanar sample textures remain untouched pending user replacements.


### 2026-11-24 — External asset scanner foundation
- Added `src/tools/externalAssetLibrary.ts` and `notes/EXTERNAL_ASSET_LIBRARY_2026-11-24.md`.
- This is scanner/data-access groundwork only. It is **not** complete Brush Library integration; UI wiring for external texture, brush, and mask galleries remains outstanding.
- The user will supply triplanar/texture assets in a ZIP later. Do not invent or replace built-in sample images. Future import should normalise triplanar texture width to 512 px while preserving aspect ratio and alpha; PNG brush transparency must be retained. Black-background extraction, if provided, must be an optional previewed operation.
- Root folder selection requires explicit browser permission; folder-name matching is case-insensitive and recursive. Do not claim silent unrestricted PC folder access.
- Continue the ordered TODO above. Do not mark 2A-W, 2A-T, 2B, 2C, or 2D complete on the basis of this scanner foundation.


### 2026-11-24 — Protected world-space Base Layer
- The permanent bottom `Base Color Layer` is a world-space procedural checker background, not a UV texture or paintable colour coat. It is locked, always visible, and excluded from the UV composite/export.
- The two checker colours default to equal neutral grey (`#9c9c9c`) at 100% opacity. Their individual opacity controls are independent and session-only.
- The ordinary Base Layer opacity slider is separate from the two colour opacity controls.
- Close retains the live session setup without persisting colours; Save persists only the two colours. Reset restores both grey colours and all opacity values to 100%.
- The Base Layer row has a Reset button in the multi-select checkbox position and a dedicated properties button. Keep it protected from paint, visibility, stack, duplicate, delete, group, and merge operations.
- CI: workflow #304 passed TypeScript diagnostics, Vite build, self-host sync, package validation and artifact upload (artifact `14954377580`). This is not runtime/device acceptance.
- See `notes/WORLD_SPACE_BASE_LAYER_2026-11-24.md` for the facility bookmark/code map and manual acceptance checklist; see `notes/PROTECTED_BASE_LAYER_2026-11-24.md` for the original protection history.


## LATEST USER DIRECTIVE — 2026-11-25: texture integration, Mask Layer and viewport sync

The user reports that the texture integration is missing in the running application. The previous gallery-complete statement is no longer accepted as verification. Re-audit the actual consumer path and restore the six supplied 2K JPEGs from `Texture integration.zip` to the canonical gallery: autumn leaf veins, brown animal fur, lush lawn grass, rusty metal, dark walnut wood and weathered wood. Preserve originals and thumbnails separately; do not replace built-in samples or create a second gallery database. Verify the actual Triplanar, Material Fill, Brush Library, Pattern Stamp, Mask/Tear and Matcap selection paths.

**Execute autonomously; do not wait for confirmation.** Full specification and code bookmarks: [`notes/TEXTURE_INTEGRATION_MASK_AND_VIEWPORT_SYNC_2026-11-25.md`](notes/TEXTURE_INTEGRATION_MASK_AND_VIEWPORT_SYNC_2026-11-25.md).

Required order: (1) restore supplied texture integration; (2) repair 3D brush continuity across corresponding UV islands; (3) keep filter UV cut-out coverage separate from mesh-part targeting; (4) add coalesced asynchronous 3D→2D UV refresh for drawing and subdivision geometry changes; (5) redesign Mask Layer; (6) group all special layer types under the Layers Add menu; (7) put Pattern Craft directly in the top Filter menu as its own command; (8) complete Tear mesh-part scope, Matcap export/stacking, Pattern Craft material/export, Honeycomb world/normal mapping, gallery GPU-tier/resource packaging and UI3 Undo/Redo investigation.

Mask Layer requirements: new masks are blank/transparent and neutral until pixels exist. Normal (Pass Through) affects only its directly linked layer below. Mix uses only the directly adjacent layer above and below with alpha-aware black/white interpolation (white selects upper, black selects lower, grey blends). Right-click and touch long-press on a selected layer create its mask adjacent to that exact layer. Single-click highlight toggles mask-edit mode; double-click X toggles a mask-only diagnostic view (light grey positive/revealed values, subtle light-red negative/subtracted values) and toggles back to the project. Selection-tool overlays must remain clear in both views.

Keep the mesh-part filter limit and UV-island cut-out limit separate. Preserve the accepted paint path, UV-island seam repair, protected Base Layer, and all excluded features. Workflow #386 predates this request and is not evidence of acceptance. Update `AGENT_STATE.md` and `CONVERSATION_LOG.md`; sync with `npm run host:sync`; report code/CI and manual visual acceptance separately.


### Latest verified implementation — 2026-11-25 (Workflow #399)

- Pattern Craft direct Filter-menu entry/preselected dialog: #389 passed.
- Layers Add menu grouping, right-click/touch long-press context menu, target-specific adjacent Mask creation: #392 passed.
- Asset Gallery ZIP image-pack import: #393 passed. Six supplied JPEGs still need to be selected from the device running the app (Asset Gallery → Import images / ZIP); they are not yet imported into browser IndexedDB or committed as repository binaries.
- Transparent blank Mask default and neutral transparent-pixel compositing: #396 passed.
- 2D UV redraw keyed by textureVersion and shared resolved subdivision geometry/versions: #397/#398 passed.
- Sparse 3D pointer samples now get intermediate surface raycasts across UV-island transitions: #399 passed. Manual topology acceptance remains.
- Latest verified self-host artifact: `15007545431`, Workflow #399: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45582213410.

Still active: Mask Normal/Mix blend semantics and edit/diagnostic toggles; full UV cut-out enforcement; visual seam-crossing acceptance; Mask/Tear UV composite parity; Tear mesh-part scope; Matcap export/stacking; Pattern Craft material/export; Honeycomb world/normal mapping; GPU/resource packaging; UI3. CI is not visual/device acceptance. Continue from the linked task note without asking for another confirmation.


### 2026-11-25 — Filter UV cut-out implementation landed

Added exact active-UV triangle write coverage in `src/tools/textureFilters.ts`; preview and Apply now intersect UV coverage with optional mesh-part coverage, preserve pixels outside that intersection, and reject missing/mismatched coverage. Workflow #402 passed; artifact `15007890427`: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45582785922. Manual tests for active UV channels, island gutters and mesh-part combinations remain. This is separate from the mesh-part selector and must remain so.
