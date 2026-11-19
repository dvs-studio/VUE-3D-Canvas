# Self-host handover

## PIN

See **AGENTS.md** and **SELF_HOST_TASK_2026-11-19.md**.

**Now (2026-11-19):** the filter/evening pack and the seven follow-up self-host tasks are implemented and packaged. Source revision `5ec840915c3812eacb68f1577659c1ab6b8509e2`; generated self-host output `c26301294da0465d5402b6800fbd15dab39cae59`; CI run #156 passed. Next: manual visual, interaction, Android touch, UV, export-performance and undo validation. See `SELF_HOST_TASK_2026-11-19.md`.

Safety ZIPs: do not delete. Self-host only.

## STOP


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
