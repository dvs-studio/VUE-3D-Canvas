# Self-host task — 2026-11-19

**Scope:** self-host only. PBR package modes = **export only**.

**Latest extension:** horizontal scroll rails for Tool Options, Docker tab strips and the 2D UV HUD; UV toolbar actions reordered; UI scale now preserves viewport-sized layout and dock/window anchors. Run #166 passed. Suzanne model integration remains pending the two reported source binaries; do not overwrite the original. UV island-edge filter gaps are recorded as a known issue and must be corrected only after preserving the current UV editor baseline.

## Upload / apply status

| Stage | State |
|-------|--------|
| MD instructions | On `main` |
| Filter + evening source | **Committed** at `3c9983eff0c02e94da2728bba17711e09a717e51`; run #137 passed |
| Follow-up task set | **Implemented and packaged**; run #156 passed |

## Filter pass (done offline)

### Wood
- Grain type: `band` | `ring` | `band+ring`
- Band frequency, ring frequency, ring noise, roughness, wood seed, randomisation
- Dialog controls in Layer Filter when Wood selected

### Other
- Hashing: hashSize, hashDensity, hashSeed, sparse/cell/grid-jitter
- Dither: hash vs Bayer + seed
- Powder / noise-shader: filterSeed

### Also in same offline package
- gizmoSizePercent, autoHideFloatingDialogs
- Layer multi-select checkboxes, Group/Delete, long-press

## Completion status — 2026-11-19

All seven follow-up source tasks are implemented on `main`:

1. Export-only Classic / RGB+ORM / AO×albedo package modes.
2. Seeded Smart UV island quarter-turn rotation; per-layer UV channel persistence; seamless active-layer gutter button.
3. Shared Levels conversion for Bump and Displacement.
4. Desktop options-bar horizontal scroll; 0.1%-step UI scale preference.
5. Mountain GLB choose/replace/reset in Preferences, stored in browser-local IndexedDB.
6. Multi-select Merge and Move-to-Group, in addition to Group/Delete.
7. `npm run host:sync` and package verification.

**Source revision:** `5ec840915c3812eacb68f1577659c1ab6b8509e2`  
**Generated self-host commit:** `c26301294da0465d5402b6800fbd15dab39cae59`  
**CI:** run #156 / `44480073408` — success.  
**Artifact:** [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44480073408/artifacts/14508410797) — 1,076,269 bytes.

Limitations and manual checks: AO is a height-derived cavity approximation, not geometry-baked AO; model-file export remains the existing standard format; browser interaction and target-device tests have not been run. Test exported images and 4K performance, UV switching/rebake/seams, Levels undo, Mountain storage reload, merge order/undo, group movement, desktop scroll and decimal scale on device. Safety ZIPs: do not delete.


## 2026-11-19 — Suzanne integration and UV/UI completion checkpoint (pre-change)

**Scope remains self-host only:** React/Three.js source under src/, then npm run host:sync to regenerate self-host/public/. Do not edit Rust/native code or protected safety ZIPs.

### Suzanne asset preservation and integration
- The user reports two new candidate assets: (A) a two-mesh Suzanne with separate head and eyes, identified by names such as head / eyes or suzanne / eyes; (B) a backup Suzanne X with head/eye vertex groups.
- Preferred integration strategy, after inspecting the actual files: preserve the existing/original Suzanne asset unchanged; create a separate candidate integration/output asset; use mesh names and/or vertex groups to identify head and eye regions; combine/merge geometry only where topology permits, preserve material/vertex-group identity where useful, weld coincident boundaries and validate manifoldness/normals/holes before promoting the candidate. Do not destructively overwrite the original model. If one candidate is already clean and correctly joined, choose it rather than forcing a risky merge.
- Availability check: as of this checkpoint, neither new Suzanne binary is present in the main Git tree or in the current conversation-file attachment listing. The repository asset paths currently expose no Suzanne GLB/GLTF/OBJ/FBX. Do not fabricate a replacement or claim integration until the binaries are accessible. Recheck incoming assets before model work.

### UI layout requests
- Collapsible-group triggers and grouped clusters should be horizontally scrollable rather than wrapping/collapsing the surrounding layout.
- Add a circular drag handle/button associated with the horizontal scrollbar so touch users can drag the scroll position comfortably. Keep keyboard/trackpad/native scroll usable and do not make the circular handle the only scroll method.
- UI scale may scale visual controls, but workspace anchors must remain at their extreme/docked positions: windows, items and dockers must not all shrink toward the top-left or cause the application layout to squash into that corner. Preserve viewport/workspace anchoring and use transform/origin or layout sizing deliberately; do not globally scale the root layout in a way that changes its anchor geometry.
- When the combined 3D Viewport + 2D UV Editor workspace is opened, rearrange the UV editor action buttons along its top toolbar for clearer access without changing UV data or unwrap behaviour.

### UV/filter defect — preserve baseline before any correction
- User reports that filters look correct on clean UVs, but on model UV islands a visible line/gap appears around island boundaries after applying a filter. This is an observed filter-to-UV-island edge/seam defect; do not assume its cause (padding, dilation, sampling, mipmaps, alpha, or rasterization) without isolating it.
- Preserve the current known-working UV editor behaviour as the baseline: current unwrap/channel/rebake/edit interactions remain intact; the user's clean-UV filter case works; the reported defect is specifically the visible edge line/gap at UV-island boundaries after filter application. Record screenshots/reproduction details when supplied. Do not rewrite the unwrap/rebake engine as a first response.
- Before a UV fix, inspect and record the current island packing, texture gutter/dilation, filter sampling, alpha handling, and mipmap path. Make a minimal isolated change with a rollback path and compare clean UV versus multi-island results. Do not regress current editor controls, selection, channel switching or rebaking.

This checkpoint is a preservation/requirements record, not a claim that Suzanne integration or UI/UV fixes are complete.


## 2026-11-19 — UI scroll, UV toolbar and scale-anchor implementation

Self-host source now includes:
- New reusable src/ui/HorizontalScrollRail.tsx: native horizontal scrolling remains available and a circular draggable handle is provided for touch/drag scrolling.
- ToolOptionsBar clusters no longer wrap; the complete options strip scrolls horizontally.
- DockerGroup tab headers scroll horizontally with the same draggable rail.
- The 2D UV canvas HUD uses a horizontal rail. Its action order is Smart UV Unwrap, UV Set, UV Overlay, overlay opacity, then UV N-Panel; touch navigation/view reset remain in the separate top-right control group.
- UI scaling no longer uses CSS zoom on the root. The workspace is transformed from top-left with inverse CSS width/height dimensions so the visual workspace continues to fill the viewport and dock/floating-window anchor positions remain stable instead of shrinking the app's layout box into the top-left.

**Build/package verification:** Actions run #166 / ID 44532889314 succeeded for source revision f22d56f5a4f2177e50986555fd55ebc913c816f4. Production build, host:sync, blank-package validation, generated self-host commit, ZIP and artifact upload passed. Generated output commit: 76d0293. Artifact VUE_3D_Canvas_SelfHost ID 14535450721, 1,078,464 bytes, SHA-256 5d5b30927a98cb94deea4056f30bb9438dc1b74a29d1a5ba7591a2888afa577a. https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44532889314/artifacts/14535450721

**Suzanne status:** No Suzanne model binary was visible in the current conversation attachments or in the main branch tree at this checkpoint. The existing built-in Suzanne source/model was not removed or overwritten. Integration remains pending until the reported separate-mesh and vertex-group candidates are accessible. Preserve the existing source asset and integrate into a separate candidate first; validate welded topology, normals and holes before promoting it.

**UV seam status:** The reported filter gap/line around UV island edges remains an explicit known defect. No UV unwrap, rebake, channel, gutter or filter-sampling correction was attempted in this UI pass. Keep the current working UV editor as the baseline and isolate any future seam fix with a rollback path. CI does not replace manual visual testing; scroll/touch drag, scale anchoring, split UV toolbar layout, and Android behaviour still need manual validation.
