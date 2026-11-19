# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far

### Agent status (2026-11-19 — self-host task implemented and packaged)

The active product is the Vite/React/Three.js painter in `src/`, packaged into `self-host/public/`. The evening/filter upload pack is already committed at `3c9983eff0c02e94da2728bba17711e09a717e51`; do not apply or recreate an offline patch.

**Completed task set:**
- Classic / RGB+ORM / AO×Albedo export-only texture packages.
- Seeded Smart UV quarter-turn rotation, per-layer UV channel persistence, and active-layer seamless texture gutter.
- Shared Levels conversion flow for Bump and Displacement.
- Horizontal scrolling desktop options bar and decimal UI scale preference.
- Mountain GLB import/reset in Preferences using browser-local IndexedDB.
- Multi-select Merge and Move-to-Group, alongside Group/Delete.
- Final `npm run host:sync`, package identity validation, ZIP packaging, and artifact upload passed in run #156.

**Current source:** `fe5c1e3d102363434d8c61bd2440ff21ca5ac9b8` (horizontal scroll rails, UV toolbar ordering and anchor-preserving scale). Generated self-host output: `c4cc4bd`. Latest artifact: [VUE_3D_Canvas_SelfHost](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44533278135/artifacts/14535151799).

**Still required:** manual browser/desktop/Android interaction tests and performance checks. AO is a height-derived cavity approximation, not true geometry AO. Do not claim manual testing from CI success.

**Latest UI checkpoint:** run #166 passed; horizontal drag-scroll rails, UV top-toolbar ordering and anchor-preserving UI scaling are now in source. Suzanne integration is pending the actual candidate binaries; the original built-in model is untouched. UV island-edge filter gaps remain documented and deliberately unmodified.

**Brief:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md)

### Safety

Do not delete safety ZIPs under `release/` or `self-host/`.

## STOP

Older history in git.


## 2026-11-19 — pre-execution: remaining self-host task set

- Read all 22 Markdown files currently present on `main`, including the self-host handoff, task brief, API/architecture references, safety-backup instructions, and historical agent notes. The active product remains the Vite/React/Three.js painter under `src/`, packaged into `self-host/public/`.
- Confirmed the evening/filter upload-pack changes are already on `main` in source commit `3c9983eff0c02e94da2728bba17711e09a717e51`; workflow run #137 (`44477900504`) passed, and generated self-host output was committed at `f7750b72f9a2e19ab8f84e749033ccfa4eab65e1`. Do not reapply the absent offline patch or duplicate its changes.
- Remaining authorised scope from `SELF_HOST_TASK_2026-11-19.md`: export-only Classic / RGB+ORM / AO×albedo modes; Smart UV and layer-UV end-to-end plus seamless UV; Bump Levels/displacement integration; desktop options-bar horizontal scrolling and decimal UI scale; Mountain GLB selection in Preferences; multi-select merge and move-to-group; final `host:sync` and package/device verification.
- Before source changes, inspect each affected implementation and its current data contracts. Preserve current layer export defaults, old `.xblend` compatibility, undo semantics, active UV channel wiring, and the no-regression painting performance constraint. Do not edit `crates/vue3d_core` or either protected safety ZIP. This is a pre-execution record, not a claim that the remaining features are implemented.


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


## 2026-11-19 — final UV HUD ordering and verified self-host package (run #167)

The 2D UV HUD now places status badges after the primary actions, keeping the workflow order: Smart UV Unwrap → UV Set → UV Overlay → Overlay Opacity → UV N-Panel → selection/mask status. This is a UI-only adjustment; UV geometry, unwrap, rebake, channel assignment and filter sampling were not changed.

Latest source revision: fe5c1e3d102363434d8c61bd2440ff21ca5ac9b8. GitHub Actions run #167 / ID 44533278135 passed all steps: install, Vite production build, host:sync, blank-package validation, generated self-host output commit, ZIP and artifact upload. Generated output commit: c4cc4bd. Artifact VUE_3D_Canvas_SelfHost ID 14535151799 (1,079,747 bytes), SHA-256 4132e7f6469f75e3bb62d70171f68a8c3c4a0207ac22a2923e8fd509d3962f7e. Download: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44533278135/artifacts/14535151799

Suzanne candidate model binaries are still not available in the current conversation attachment list or main branch asset tree. No Suzanne source/model was removed or overwritten. The original remains preserved; candidate integration is blocked until the two reported files are accessible. UV island-edge filter gaps remain documented and intentionally unmodified. Manual browser/desktop/Android visual and interaction testing remains outstanding.
