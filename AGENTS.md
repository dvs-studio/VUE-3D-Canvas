# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-21 (Grok)

**Product path:** Vite/React/Three.js under `src/`. **Every feature change must update the running self-host package:** edit `src/`, then `npm run host:sync` so `self-host/public/` stays current. Do not stop at documentation-only commits. A push that touches `src/**` also starts `.github/workflows/build-self-host.yml`, which runs `host:sync` and commits `self-host/public` as `chore(self-host): sync generated painter output [skip ci]`. Pull that commit before editing `self-host/public` by hand.

**Do not edit** `crates/vue3d_core` unless Victory explicitly orders Windows-shell work. **Do not delete** safety ZIPs under `release/` or `self-host/`.

**Conversation log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) — append-only, one section per day, personified by AI engine name. Read the full log only when Victory asks; never delete history.

**Assets:** `Suzanne.zip` is at **repo root**. Existing tracked mesh: `src/assets/Suzanne.obj` — **do not overwrite**. Separate candidate: `src/assets/Suzanne.head-eyes.obj` (Objects `Head` and `Eyes`). `.gitignore` ignores `*.obj` except those two paths.

**Briefs:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md) · [`SELF_HOST_HANDOFF.md`](SELF_HOST_HANDOFF.md) · [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md)

### Stopped here — 2026-11-21 (Grok) — read this before writing code

Source commit on `main`: `18a80cb8c784be3c61c21010455c3d2c07bb5a0f` (`fix(self-host): pad UV edges, hatch jitter, head-eyes Suzanne`). **Not visually verified. Not a claim that the seam or model-edge line is gone.**

**Already in that commit (do not re-implement):**
- `src/tools/textureFilters.ts` — `rasterizeMeshSurface` (conservative UV raster + 4px gutter). `buildObjectSpacePositionMap` now returns that map and uses `NaN` off the mesh. Wood grain skips `NaN` texels instead of painting the bounding-box corner. Blur dilates opaque color before the canvas blur. `applyTextureFilterToCanvas` dilates transparent gutters 8px before and after neighbourhood filters. Hatching / cross-hatching / hashing read `featureScale` (default 100), `positionJitter` (default 0), `angleJitter` (default 0).
- `src/ui/TextureFilterDialog.tsx` — those three sliders on the directional filters.
- `src/tools/fillSuite.ts` — `surfaceFrame`. Triplanar and material texture fill use real object position/normal when geometry is passed, then `padIslandEdges`. No geometry still uses the old spherical mapping.
- `src/App.tsx` — triplanar confirm, texture-fill import, and bake pass `activeGeometry` plus `userData.uvChannels[activeUVChannel]`.
- `src/assets/Suzanne.head-eyes.obj` + preset `suzanneHeadEyes` in `src/renderer/modelGeometry.ts` + Options menu label **Suzanne Head + Eyes**.
- Original `src/assets/Suzanne.obj` byte-identical to the commit before `18a80cb`.

**Explicitly not done:**
- No `npm run host:sync` in the agent session. The running page is whatever CI produces after `18a80cb`. Confirm the Actions run, then test **that** bundle.
- No browser, desktop, or Android check. No export-package retest (Classic / RGB+ORM / AO×albedo), layer UV persistence, seamless UV button, Bump/Levels, options-bar scroll, UI scale, Mountain GLB, or multi-select merge/move-to-group after this edit.
- UV editor baseline was not rewritten (`smartUVUnwrap` island split/pack, channels, rebake logic unchanged). `dilateTextureSeams` in `smartUVUnwrap.ts` was not edited.
- Eyes were **not welded**. On `Suzanne x.obj`, head sockets and the eye shell do not meet (median gap about 0.07; 0 verts within 1e-4). Welding would leave a hole or a double surface. Keep two objects.
- `npx tsc --noEmit` already fails on `main` from older files (`src/core/xblendFormat.ts`, `src/renderer/hdriManager.ts`, `src/renderer/surfaceShading.ts`, `src/ui/panels/MeshPartsPanel.tsx`, and `stack.indexOf` in the wood loop). Do not treat that as a regression from `18a80cb`. Vite is the build that matters.
- A plane-grid raster check (gutter 0 and gutter 2) showed no interior holes. That is not a Suzanne/filter screenshot.

### Combined to-do (self-host first)

1. **Pull `main`.** If the self-host workflow for `18a80cb` is still running, wait. If it failed, run `npm run host:sync` locally, commit only `self-host/public`, and push. Do not hand-edit generated bundles.
2. **Visual check of the seam fix** on the synced page: Suzanne with Smart UV islands, wood grain (blur on), hatching, triplanar fill, and material texture fill. The line to look for is at island borders and along the model silhouette. If it remains, record the mesh, UV channel, filter, and whether the layer was transparent in the gutter. Minimal follow-up only. Do not replace the UV editor.
3. **Model menu:** Squail stays the original OBJ. Suzanne Head + Eyes must load as parts `Head` and `Eyes`. Do not promote it over Squail.
4. **Hatching / hashing UI:** Feature scale %, Position jitter %, Angle jitter °. Defaults must match the old spacing (scale 100, both jitters 0). Seeded. Confirm they actually change the preview.
5. **Re-check** export packages, layer UV channel, seamless gutter button, Bump/Levels, options scroll, UI scale, Mountain GLB prefs, multi-select merge/move-to-group on this bundle.
6. **Manual QA** in a browser (desktop and a phone-sized viewport). CI is not device proof.
7. **Specialised / dedicated 2D UV** stays research-only until Victory asks to develop it. Do not start a second UV product.
8. Windows native redevelopment stays **later**. Shell is WebView2, not a D3D paint engine.
9. **Matcap layer (new, not built).** A layer type of its own. Do not reuse the existing per-layer reflection switch (`reflectionSource: 'hdri' | 'matcap'` and the chrome/ceramic/clay/pearl/gold presets). That switch stays as it is.
   - The matcap image is the material (fake reflection or any other matcap look). Painting on this layer writes **only an alpha mask** for where that material shows. Do not paint colour into the cookie.
   - **Convert to colour** turns it into a normal colour layer. Summarise the cookie: average from the dominant colours down toward the lesser ones, then add **20%** of the colour value taken from the **middle line** of the matcap. That summary is the layer colour. After conversion, export uses the normal colour path.
   - **Export while it is still a matcap layer:** normal → view vector → screen-space matcap lookup, then **MixRGB** in Blender. This mix is only for this layer type.
   - Source image may be any format. Store and export the matcap as **JPG**, not EXR.
   - Old `.xblend` files must still open. Undo applies. Paint performance stays off the full-canvas rebuild path.
10. **Add-button layout.** When the layers UI is too narrow, every special layer type sits under one Add button. When the panel is wide enough, those same actions sit in a row as they do today. Special types for this menu: Material texture fill, Matcap, and Group. Ordinary paint stays the default add. Do not hide them on a large layout.

### Work rules for every AI

- Work **on the actual self-host project**: `src/` + regenerated `self-host/`.
- Prefer short commits; update this PIN when a set completes; **append** history under STOP — do not wipe ledgers.
- Named worker notes may live under `agents/` without deleting main AGENTS history.

## STOP

---

### Agent status (2026-11-19 — self-host bundle and OBJ preservation updated)

The active product is the Vite/React/Three.js painter in `src/`, packaged into `self-host/public/`. The 2026-11-19 generated self-host output is committed on `main`.

**Completed and present in source/self-host bundle:**
- Existing follow-up feature set: Classic / RGB+ORM / AO×Albedo export packages; seeded Smart UV rotation; per-layer UV channel persistence and gutter; shared Bump/Displacement Levels; horizontal options rails and decimal UI scale; Mountain GLB preference; multi-select Merge and Move-to-Group.
- Split-view UV tools are bottom-centred inside the 2D pane; dedicated 2D tools remain at the top.
- The supplied Suzanne OBJ is committed as `src/assets/Suzanne.obj` and is used by the Suzanne preset. The procedural Suzanne generator was removed.
- Generated self-host bundle contains the Suzanne OBJ preset and current UV toolbar layout.

**Latest commits (as of that checkpoint):** source integration `d98df003290a1767f1655a033c5b3e0d3206ee74`; UV layout `7635dbb43bf8aee4d855ad2f0133bae826d5e217`; generated self-host output `b6b9a627ab6b4e8e89e647091cd7f14512ddf30e`. Self-host workflow run #178 succeeded.

**OBJ protection:** `.gitignore` ignores `*.obj` by default while keeping `src/assets/Suzanne.obj` tracked. `scripts/sync_self_host.mjs` preserves OBJ under `self-host/public/`.

**Still required (carried into PIN above):** manual tests; UV island-edge gaps; model-edge artefacts.

### Historical checkpoints (2026-11-19)

Pre-execution remaining task set, Suzanne integration notes, UI scroll/UV toolbar/scale-anchor implementation, final UV HUD ordering, Windows redevelopment handover, and outstanding shared issues remain in git history and in prior AGENTS revisions. Prefer the **PIN** for current work. Full Windows shell description: WebView2 + ANGLE, not native D3D paint.

For narrative of design discussions (UV NURBS, LTM, export ORM, filter wood rings, upload-pack gaps), see [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md).
