### Agent status (2026-11-19 — self-host bundle and OBJ preservation updated)

The active product is the Vite/React/Three.js painter in `src/`, packaged into `self-host/public/`. The 2026-11-19 generated self-host output is committed on `main`.

**Completed and present in source/self-host bundle:**
- Existing follow-up feature set: Classic / RGB+ORM / AO×Albedo export packages; seeded Smart UV rotation; per-layer UV channel persistence and gutter; shared Bump/Displacement Levels; horizontal options rails and decimal UI scale; Mountain GLB preference; multi-select Merge and Move-to-Group.
- Split-view UV tools are bottom-centred inside the 2D pane; dedicated 2D tools remain at the top.
- The supplied Suzanne OBJ is committed as `src/assets/Suzanne.obj` and is used by the Suzanne preset. The procedural Suzanne generator was removed.
- Generated self-host bundle contains the Suzanne OBJ preset and current UV toolbar layout.

**Latest commits:** source integration `d98df003290a1767f1655a033c5b3e0d3206ee74`; UV layout `7635dbb43bf8aee4d855ad2f0133bae826d5e217`; generated self-host output `1ac11ec10f349346e6ad0604bc764f09e7a8aa07`. Self-host workflow run #177 succeeded: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44552675389

**OBJ protection:** `.gitignore` now ignores `*.obj` by default while explicitly keeping `src/assets/Suzanne.obj` tracked. `scripts/sync_self_host.mjs` preserves OBJ files already present anywhere under `self-host/public/` while replacing generated bundles. Git ignore does not prevent deletion by scripts; the sync script now handles that preservation explicitly.

**Still required:** manual browser/desktop/Android interaction tests and performance checks. UV island-edge filter gaps and model-edge fill artefacts remain open. AO is a height-derived cavity approximation, not true geometry AO. CI success is not manual runtime verification.

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


## Current Windows redevelopment handover — 2026-11-19 (read before native work)

### Product status and source of truth
- Finish and validate the self-host painter first. Latest self-host source revision: `8ef43083078ce650e7c9ddda2de2a99ff41b2378`. Latest generated `self-host/public/` output commit: `6ca5b70`.
- Latest self-host CI: workflow run #169 / ID `44538905738`, success. It ran Node dependency installation, Vite production build, `npm run host:sync`, blank-package validation, generated-output commit, ZIP packaging and artifact upload. Artifact `VUE_3D_Canvas_SelfHost` ID `14536189234`, 1,078,042 bytes, SHA-256 `57530146a4923253abe3fb4a7658e994a0bc99f90a315ccf132520cae52e22da`. Download: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44538905738/artifacts/14536189234
- Self-host success is not Windows native build success and does not prove manual desktop/Android interaction. No Windows workflow was run as part of this self-host pass.
- Active painter implementation remains React 19 + TypeScript + Vite 8 + Three.js under `src/`; `self-host/public/` is its generated deployable package. `npm run host:sync` builds and synchronizes that output. Treat the current self-host app as the behavioural/feature reference for any future Windows redevelopment.

### What the Windows application currently is (important correction)
- The current Windows executable is a **native window shell around the existing web painter**, not a native Direct3D painter rewrite.
- Entry point: `crates/vue3d_core/src/main.rs`; window/WebView integration: `crates/vue3d_core/src/desktop.rs`; dependencies: Rust `wry = 0.57` and `tao = 0.37` in `crates/vue3d_core/Cargo.toml`.
- The shell loads the built UI from the adjacent `ui/index.html` using Wry's in-process `vue://localhost` custom protocol. It does not need to start an HTTP server. The portable package layout is `vue_3d_canvas.exe` beside a `ui/` folder containing the Vite build.
- WebGL is rendered inside WebView2; ANGLE defaults to D3D11. `--opengl` selects the OpenGL ANGLE path; `--modern` adds the WebGPU browser flags but does not turn the painter into a native WebGPU renderer. The app does not currently own a raw D3D11 device, native HLSL material pipeline, WGL renderer, or native brush engine.
- Windows 11 normally includes WebView2 Runtime; Windows 10 may need Evergreen WebView2 Runtime. The shell stores WebView2 profile data in `webview2-data/` beside the executable, persists the selected backend in `gpu-backend.txt`, and writes startup failures to `vue3d-startup-error.log` beside the exe.

### Current Windows build path
- Manual GitHub Action: `.github/workflows/build-windows-app.yml` (workflow_dispatch only; Windows runner). It installs Node 22, runs `npm install`, `npm run build`, validates `dist/index.html` and JS assets, installs stable Rust, runs `cargo build --release --bin vue_3d_canvas`, assembles `VUE_3D_Canvas_Windows/` with exe + `ui/`, then uploads `VUE_3D_Canvas_Windows.zip`.
- Local Windows folder builder: `scripts\\build_standalone_desktop.bat`. It runs `npm run build`, builds the Rust binary and assembles `dist\\VUE_3D_Canvas_Windows\\`. It currently does not create the GitHub Actions artifact ZIP itself.
- Use the workflow file and scripts as the executable truth. Older docs below that mention console binaries, Python/C++ desktop folders, old workflow names, raw DirectX device access, native HLSL painting, Windows Ink integration or guaranteed performance improvements are historical/aspirational unless separately implemented and tested.

### Future Windows redevelopment direction (not implemented by this handover)
1. Do not replace the working self-host painter or conflate the Wry shell with a native renderer. Keep a separate Windows redevelopment branch/workstream until the native app reaches feature parity.
2. First produce a feature-parity matrix from the current self-host application: model import and mesh/material data; layers and blend modes; brush/pen/tablet input; texture filters; UV unwrap/edit/channel/rebake; selection/masks; PBR maps and export; undo/redo; project serialization and backward-compatible `.xblend`; dockers, floating windows, scaling and touch interactions.
3. Preserve file-format and interaction contracts. Use existing React implementation, API documentation, `XBLEND_FORMAT_SPECIFICATION.md`, and current handover records as behavioural references. Do not silently change project compatibility, layer ordering, active UV channel, texture dimensions, filter seeds or undo semantics.
4. Decide the native rendering architecture only after profiling the self-host baseline and confirming target GPU requirements. If implementing direct D3D11/HLSL, it must be a genuine renderer and resource-management implementation, not a renamed WebView2/ANGLE path. Keep a documented OpenGL fallback only if it can be maintained and tested.
5. Port in vertical slices and compare output against the self-host reference: viewport/model display; texture/layer painting; UV mapping and bake; filters; PBR export; project save/load; then UI/workspace and tablet input. Include automated asset/format fixtures and measured CPU/GPU/memory performance.
6. Maintain an agentic handover with completed features, parity gaps, file-format changes, renderer decisions, build instructions, known defects and exact tested Windows versions/GPU drivers. Never claim native GPU features from a successful shell build alone.

### Outstanding shared product issues for Windows planning
- Suzanne OBJ integration is still not complete. The user reports two OBJ candidates (separate head/eyes meshes and a backup with head/eye vertex groups). Earlier integration failed because the candidate binaries were not ingested into the repo/session accessible to the editing agent. Locate/restore the supplied OBJ files before choosing a candidate. Preserve the original Suzanne asset; create a separate integrated candidate, validate normals, connected components, boundary edges/holes and UVs, and only promote after inspection.
- UV mapping technology needs a future optimization review: profile unwrap/packing, texel density, island gutter/padding, rasterization, overlap handling and filter sampling before replacing algorithms. Preserve existing known-good UV editor behaviour as a regression baseline.
- Model-edge artefact: character fill tools/utilities leave a visible edge on the model. Record a reproducible mesh/material/UV case and compare viewport fill boundary, UV raster boundary, texture sampling and alpha before changing it.
- Hatching, cross-hatching and hashing need user-facing size/scale controls plus independent jitter and rotation-angle jitter controls. Keep their seeds/repeatability and current density behaviour documented while adding the controls.
- Filtered textures can show visible lines/gaps around UV island boundaries even though clean UV cases look correct. This is a known defect; no fix was included in the current toolbar-placement change.
- The UV toolbar position is mode-dependent: in combined 3D Viewport + 2D UV split mode, the 2D tools/options strip and its horizontal scrollbar are at the absolute bottom-centre of the 2D pane (excluding dockers); in dedicated 2D UV mode, the same strip returns to the top-left. Preserve this distinction.

### Current self-host UI correction (2026-11-19)
- `Viewport2D` receives `isSplitView={viewMode === 'split'}` from `App.tsx`. Split mode positions the 2D tools/options rail bottom-centre; dedicated 2D mode keeps it top-left. The draggable circular scrollbar remains attached to the strip.
- This is a UI placement-only change. UV algorithms, unwrap, packing, channel assignment, rebake, filter sampling and model geometry were not modified.
- Build/package run #169 passed for source revision `8ef43083078ce650e7c9ddda2de2a99ff41b2378`. Manual visual testing remains required.
