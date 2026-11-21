# CONVERSATION_LOG.md — append-only public conversation ledger

**Rules (all agents):**
- **Append only.** Never delete or rewrite prior day sections.
- **One update per calendar day** (UTC or session day): add a new dated section if the day’s block does not exist; otherwise append bullets under that day.
- **Read-only full history** unless the user explicitly asks to read the entire conversation log.
- Each day section is **personified by the AI engine** that wrote it (e.g. Grok, Claude).
- Store **public summaries** of decisions and product direction — not secrets or credentials.

---

## 2026-11-20 — Grok

### Access and repo state
- GitHub connector confirmed as `dvs-studio` (Victory / VUE).
- No MD commits dated 2026-11-20 prior to this Grok session; latest product MD activity was 2026-11-19.
- `Suzanne.zip` is present at **repository root** (`Suzanne.zip`). `src/assets/Suzanne.obj` already tracked; zip is the multi-candidate pack for head/eyes integration work.

### Product direction (from this thread + prior Grok sessions)
- **Active product:** self-host Vite + React + Three.js painter (`src/` → `self-host/public/` via `npm run host:sync`). Agents must **edit source and refresh self-host output**; do not treat docs-only updates as feature delivery.
- **Not active unless Victory asks:** full native D3D11 rewrite; do not restore removed Python/C runners.
- Windows exe remains **WebView2 shell** around the web painter (ANGLE/D3D11), not a native paint engine.

### Specialised / dedicated 2D UV technology (research backlog — expand when Victory asks)
Held from earlier Grok design discussions; **not fully implemented** as a standalone product module:
- Dedicated UV desk / floating full-screen UV utility communicating with the mesh (Coming soon docker was earlier direction).
- Virtual **NURBS-like** surface tools: edge-to-edge snap, face projection / shrink-wrap, semi-sculpt “pen” that burns surface for UV boundary, grease-pencil 4-corner auto-patch, edge dissolve between patches.
- **LTM** format idea (reverse-style of MTL): pre-bake UV identity clusters; seamless tiling clusters vs free NURBS-editable clusters; group scale/move without free vertex drag on tiling sets.
- Seamless tiling UV trigger: dedicated UV set fills 0–1; selectable on layers / PBR import; link later to improved unwrap.
- Per-layer **UV channel** selector and export honouring channel hierarchy.
- Smart UV upgrades (simple first): better cuts, light relax/pack, planar fallback; later research denser packing / gutter / island edge filter seams.
- UDIM explained in chat (tile numbering 1001+); optional future UV map set offsets — not required for current minimal seamless button.
- When Victory asks to develop specialised UV unwrapping further: **research and expand in detail** (algorithms, packing, density, island margins, filter seam causes) before large rewrites; preserve current working UV editor as baseline.

### Layer / filter / export (from this multi-session Grok work)
- Wood grain: banding + rings + ring noise + roughness + randomisation/seed (designed offline; verify on `main` source).
- Hashing: size, density, seed, algorithm.
- Export modes discussed: Classic multi-map; RGB+ORM; optional AO×albedo — **export only**.
- Multi-select layers, group/delete; merge/move-to-group still on open lists in some checkpoints.

### Process issues recorded
- Source upload from Grok sometimes failed to land on GitHub (docs landed; `src/**` lagged). Upload pack zip was provided to the user for manual/other-agent apply. Later 2026-11-19 agents reported evening/filter pack and broader self-host features already on `main` — treat `main` as authority; do not re-apply stale offline patches blindly.
- Session length / quota fragmentation noted by Victory; prefer **small focused commits**, PIN-only agentic reads, and self-host folder always kept in sync after code changes.

### Agentic hygiene (binding)
- Work **directly on the self-host product path**: change `src/`, then `npm run host:sync` so `self-host/` reflects the app.
- **AGENTS.md** PIN is the daily task surface; history below STOP is archive.
- Individual workers may keep named notes under `agents/` without deleting main history.
- Conversation log (this file): append-only, daily, personified engine name.

---

## 2026-11-21 — Grok

### Where this session stopped
- Halfway source is on `main` at `18a80cb8c784be3c61c21010455c3d2c07bb5a0f`. Docs for the hand-off are a later commit. The self-host HTML bundle was **not** rebuilt in the session. `build-self-host.yml` should do that on the `src/**` push. The next agent pulls that generated commit before judging the painter.
- No browser, desktop, or Android pass. Do not tell Victory the seam is fixed until the synced page has been looked at.

### What was implemented (do not redo)
- **Cause recorded for the island line:** neighbourhood filters (especially wood blur) mix transparent UV gutters into the island, and the object-position map left cracks whose value was the bounding-box corner `(0,0,0)`. Triplanar and material texture fill projected a sphere from canvas UV, so a character atlas broke along island cuts and along the model edge.
- **Minimal fix, UV editor left as baseline:** conservative raster plus gutter dilation in `rasterizeMeshSurface`; wood ignores uncovered (`NaN`) texels; blur and filter apply pad opaque color into transparent gutters; triplanar and material fill sample mesh position and normal when `App.tsx` passes geometry, then pad the island edge. `smartUVUnwrap` packing/cuts were not replaced.
- **Hatching, cross-hatching, hashing:** Feature scale % (100 = old spacing), Position jitter %, Angle jitter °. Both jitters default to 0 so old results stay put. Still seeded.
- **Suzanne.zip:** `Suzanne.obj` in the zip is one group (`off` holds every face — a Blender "grouping off" export). `Suzanne x.obj` is two objects (head 13824 tris, eyes 480). Eye verts are not on the socket boundary, so they were **not welded**. Candidate committed as `src/assets/Suzanne.head-eyes.obj` with objects `Head` and `Eyes`, preset id `suzanneHeadEyes`, menu label "Suzanne Head + Eyes". Original `src/assets/Suzanne.obj` unchanged. Squail remains that original.

### Procedure for the next agent
1. Read only the PIN in `AGENTS.md` unless Victory asks for history.
2. `git pull` `main`. Confirm `18a80cb` is an ancestor. Find the following `chore(self-host): sync generated painter output [skip ci]` commit, or the failed Actions run.
3. If the workflow failed, `npm run host:sync` and commit `self-host/public` only. Do not edit `crates/vue3d_core`. Do not delete ZIPs. Do not overwrite `src/assets/Suzanne.obj`. Do not weld the eyes.
4. Open the synced self-host page. Check wood, hatch, triplanar, and material fill on island UVs and on a clean 0–1 UV. Check Head + Eyes parts. Check the three new sliders at their defaults.
5. Re-check export packages and the 2026-11-19 UI behaviour listed in the PIN. Append this log; do not rewrite it.

### Known non-blocking typecheck
`npx tsc --noEmit` fails on older files (`xblendFormat.ts` duplicate keys, `hdriManager.ts`, `surfaceShading.ts`, `MeshPartsPanel.tsx`, wood `stack.indexOf`). Those errors were already on `main`. The package build is Vite, not `tsc`.


---
