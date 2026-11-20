# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-20 (Grok)

**Product path:** Vite/React/Three.js under `src/`. **Every feature change must update the running self-host package:** edit `src/`, then `npm run host:sync` so `self-host/public/` stays current. Do not stop at documentation-only commits.

**Do not edit** `crates/vue3d_core` unless Victory explicitly orders Windows-shell work. **Do not delete** safety ZIPs under `release/` or `self-host/`.

**Conversation log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) — append-only, one section per day, personified by AI engine name. Read the full log only when Victory asks; never delete history.

**Assets:** `Suzanne.zip` is at **repo root**. Existing tracked mesh: `src/assets/Suzanne.obj`. Prefer preserve-original + separate candidate for head/eyes candidates inside the zip; validate before promote.

**Briefs:** [`SELF_HOST_TASK_2026-11-19.md`](SELF_HOST_TASK_2026-11-19.md) · [`SELF_HOST_HANDOFF.md`](SELF_HOST_HANDOFF.md) · [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md)

### Combined to-do (self-host first)

1. **Manual QA:** browser / desktop / Android interaction and paint performance (CI ≠ device proof).
2. **UV island-edge filter gap** and **model-edge fill artefact** — isolate cause; minimal fix; keep current UV editor as baseline.
3. **Suzanne.zip integration** (aside from generic UV research): inspect zip contents; preserve original Suzanne; optional multi-mesh head/eyes candidate; weld/validate; wire preset only after inspection.
4. **Specialised / dedicated 2D UV technology** — when Victory asks to develop it further: **research and expand in detail** (unwrap cuts, relax/pack, texel density, gutters, seamless/tiling sets, optional NURBS-like authoring, LTM-style UV identity clusters, per-layer UV channels, export hierarchy). Do not half-implement a second UV product without a clear slice. See `CONVERSATION_LOG.md` 2026-11-20.
5. Confirm export packages (Classic / RGB+ORM / AO×albedo), layer UV persistence, seamless UV trigger, Bump/Levels merge, options-bar scroll, UI scale, Mountain GLB prefs, multi-select merge/move-to-group remain correct on current `main` after any edit.
6. Hatching / hashing user-facing size + jitter controls if still thin in UI.
7. Windows native redevelopment stays **later** and separate; shell is WebView2, not a D3D paint engine.

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
