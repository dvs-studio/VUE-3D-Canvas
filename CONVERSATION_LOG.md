# CONVERSATION_LOG.md — append-only public conversation ledger

**Rules (all agents):**
- **Append only.** Never delete or rewrite prior day sections.
- **Every AI engine** must add a dated section for the day it worked if not already present.
- Sections **by date**: `## YYYY-MM-DD — EngineName`.
- Read full log only when Victory asks. No secrets.

---

## 2026-11-20 — Grok

- Conversation log introduced; self-host path; Suzanne.zip noted.

---

## 2026-11-21 — Grok

- Seam package; Head+Eyes; fabric/mask design F1–F8; cloth active plan; logo fabric on hold.

---

## 2026-11-22 — Grok

### Morning — test feedback → bugfix brief
- Head+Eyes default; remove Squail; UV seam accepted fixed; 3D view protected.
- Broken filters (dust/powder no-op); wood UI gaps; symmetry lag; part selection; UV shelf; F8.
- Docs: `SELF_HOST_BUGFIX_2026-11-22.md`.

### Late — after GPT Phase A1–A3 claims
- Victory: last command / error-diagnosis **no longer launching** after recent fixes.
- **Immediate:** scrutinise main self-host web app for regressions from last fixes (and deeper); fix first.
- **Then major to-do:** layer technology from `LAYER_FABRIC_MASK_PLAN.md` — cloth F2–F5, torn F1/F1b, mask F6, F8 bump merge; F7 logo fabric still on hold.
- PIN updated in `AGENTS.md` accordingly.

---

## 2026-11-22 — GPT-5

### Phase A1–A3 (claimed complete — CI only)
- Powderiser two-pass; wood frequency randomisation UI; filter audit checklist in bugfix MD.
- Squail removed; Head+Eyes default.
- Symmetry: independent stroke state per mirror path; dirty bounds include previous mirror point.
- Workflows #184 / #187 / #191 cited. Victory visual verification still pending at that note.
- Was next: A4 part selection. Superseded for ordering by Grok late PIN (scrutinise regressions first).

---

## 2026-11-22 — GPT-6 (continued)

- Re-read the current authoritative AGENTS.md, AGENT_STATE.md, SELF_HOST_HANDOFF.md, SELF_HOST_BUGFIX_2026-11-22.md, LAYER_FABRIC_MASK_PLAN.md, LAYER_PBR_PLAN.md, SELF_HOST_TASK_2026-11-19.md, CONVERSATION_LOG.md and the GPT agent log. The latest AGENTS.md checklist supersedes the older handoff/agent-log statement that A4 was next: Step 0 regression scrutiny must happen first.
- Inspected the current diagnostics menu callback and GpuDiagnosticsModal: the Help-menu callback, state setter and modal mount are wired in source. This is not proof that the reported diagnose/last-command workflow works at runtime; preserve that as an unverified test item.
- Rechecked the filter dialog, apply caller and all eight filter branches. Found a concrete Wood Grain runtime bug: woodSeed was read by seeded frequency jitter before its const declaration, which triggers a temporal-dead-zone error when Wood Grain executes.
- Fixed by moving seed resolution before the pixel loop. Source commit: 7475d5368f9813f1d6f50db3e10f58d11dd036a8. This is a minimal filter-only fix; no viewport, brush, UV, native Rust, or safety archive changes.
- Build/self-host sync is pending at this log entry. Do not call the fix packaged until the workflow has completed and generated self-host/public/ is confirmed current. Device visual testing remains Victory's unless requested.
- Remaining Step 0 checks: diagnose/last-command runtime launch, all filters including Powderiser/Wood, symmetry axes and long strokes, startup model, painting, export, and verify-only subdivision preview. A4 remains blocked until this scrutiny is complete.

---

### Step 0 follow-up — generated self-host sync

- Automatic self-host workflow committed the regenerated page at 297f230 (2026-11-22 00:55:25Z). Generated JavaScript asset: self-host/public/assets/index-CqmOQpy4.js.
- Retrieved the generated JS blob and verified the compiled Wood Grain branch resolves the seed before the pixel loop and before the band/ring frequency hashes. Retrieved the generated index.html blob and verified it contains the root mount, has no external script src, and includes the inlined app bundle.
- Updated README.md and self-host/README.md to point to index-CqmOQpy4.js. Updated AGENTS.md, AGENT_STATE.md, SELF_HOST_HANDOFF.md, SELF_HOST_BUGFIX_2026-11-22.md and agents/gpt-6.md so the source and generated-output checkpoint agree.
- This confirms production build + host:sync + generated output commit. The available connector did not expose the push-triggered workflow run ID/artifact status, so do not claim the ZIP artifact upload step was verified. Browser/device interaction remains untested.

---

## 2026-11-19 — Grok — id `LOG-2026-11-19-GROK-01`

- Victory asked for the self-host page only: read the notes, use `Suzanne.obj` from the supplied zip (not `Suzanne x.obj`), isolate parts from mesh names or vertex groups, remember which dockers were off, fix fill seams and paint squash/drift, improve Smart UV, keep the split-view UV tools at the bottom, add a split-view resize, and offer a round or a pill scroll handle.
- He also described a selection overlay and a Selection menu, and asked that a boolean/thorn mask layer and world-space cloth, basket, and fractal filters be written as later to-dos, not built first.
- That pass did not land on `main`. Local scaffolds were stashed and are not the packaged page. Later notes (Head + Eyes, UV seam accepted, fabric plan) supersede the asset choice. Do not revive the stash.

---

## 2026-11-22 — Grok — id `LOG-2026-11-22-GROK-STATUS`

- Victory asked for a status report from the notes, not a code change.
- Report given from `origin/main` at `936ec38`: Head + Eyes and the UV-island seam are accepted; paint stays protected; Powderiser, Wood (`7475d53`, bundle `index-CqmOQpy4.js`), and symmetry are in source without device sign-off; Step 0 is still open; 2A–2D are open; F7 is on hold.

---

## 2026-11-22 — Grok — id `LOG-2026-11-22-GROK-SEL`

- Victory specified the selection cage: a fake surface highlight, marching ants, and a blink on feathered edges instead of ants, with unselected area dimmed 10%. Selection menu: Select, Deselect, Reselect, Inverse, Grow, Shrink, Feather. The mask brush stays a separate selector with Clear, Invert, Smooth, Rough, and Edge shift.
- He asked for the research in the current to-do, not a new plan file. It is `HOLD-SEL-2026-11-22` in `AGENTS.md`. Do not build it until he acknowledges that item.
- He told the next agent: after his next reply, execute every other open CURRENT TODO item in one pass. Exclude HOLD-SEL. Exclude F7.
- This entry is the conversation record only. The procedure itself is in the PIN so a later agent does not have to read this log to find it.

## 2026-11-22 evening — Claude — id `LOG-2026-11-22-CLAUDE-S0`

- Victory reported two defects and asked that the next agent finish the whole open to-do in one pass so he can test the new layers, filters, and everything outstanding at once. The item he still has to confirm (HOLD-SEL) and F7 stay excluded.
- Defect 1: with symmetry now working, a brush crossing a UV island boundary in the 3D viewport jumps and draws a line across the whole texture (visible in the 2D view). Untouched areas, such as the frontal lobe when drawing through the centre of the head, get a flash. Recorded as S0-1 with the A2 interpolation root cause as the lead hypothesis, and a narrow carve-out in the protected-path rule so the agent may fix stroke continuity.
- Defect 2: Powderiser is still not fixed. Recorded as S0-2: a full scrutiny of the filter path with a run-and-diff test, plus the 2026-11-14 safety build in `release/` as a runtime comparison. The copy of that zip under `self-host/` is a 48-byte pointer, not a zip.
- No code was changed in this entry.

---

## 2026-11-22 late — Claude Sonnet 4.6 — id `LOG-2026-11-22-CLAUDE-INVEST`

### Read-only investigation pass + spec corrections

**Powderiser root cause confirmed (code reading, no changes made in this entry):**
- `transformTexturePixels` declares `noise = cfg.noise / 100` at line 273 (shared for all filters). The Powderiser block at line 363 then does `strength = clamp(noise / 100, 0, 1)` — dividing by 100 a second time. With default `cfg.noise = 25`, `strength ≈ 0.0025`. Pass-one selects ~0 pixels; pass-two composites nothing; output is visually unchanged. Fix: change `noise/100` → `noise` on line 363. Written into `AGENTS.md` S0-2 block and `INVESTIGATION_2026-11-22.md`.

**S0-1 stroke teleport root cause confirmed:**
- `raycastUV` (Viewport3D.tsx ~1647) discards `faceIndex`. Move handler (~1571) feeds texels directly to the brush with no texel-jump guard. `brushEngine.paintDabs` interpolates without distance cap. All mirror paths affected independently.

**Full bug sweep completed (not yet fixed — for the executing agent):**
- P0: undo stack OOM (raw ImageData, up to 1.2 GB), material leak (MeshStandardMaterial never disposed on layers change), scene teardown leak (geometry/material/texture never disposed on unmount).
- P1: blend mode mismatch (full composite missing hard_light/soft_light/difference), PBR texture rebuild on every stroke (no debounce), no pointer capture, no getCoalescedEvents, willReadFrequently missing, duplicate View menu, menu close only on mouseLeave (broken on touch), MeshPartsPanel onClick receives event as id.
- P2: 10 TypeScript errors confirmed (xblendFormat duplicate keys, hdriManager canvas/image mismatch, surfaceShading InterleavedBufferAttribute, textureFilters.ts:316 union typed as intersection, MeshPartsPanel onClick type).
- All findings with file+line in `INVESTIGATION_2026-11-22.md`. Commit: `9c1be07`.

**Layer and filter type correction (Victory 2026-11-22 23:47 + 23:56):**
- F2–F5 are **not** layer types. They are pixel filters applied to an existing layer, under a renamed family: **Pattern Craft** (previously called "cloth filter family"). This is the corrected classification — the executing agent should treat F2–F5 as entries in `TextureFilterKind`, not as new `Layer.channel` values.
- F1b (mesh/UV influence switch) is a sub-toggle that belongs to F1 (the torn fabric layer), not to the Pattern Craft filters.
- F1 is confirmed a **dedicated layer type** (not a filter). It sits in the layer stack like a clip mask. Behaviour: if the layer beneath has image content, it multiplies the procedural fabric's lightness/darkness micro-pixels into that layer (darkening/texturing it); if no image is present, it produces the raw black/white procedural fabric pattern. Auto-enables the displacement checkbox on the current layer. Intelligently rotates the seamless fabric pattern across limbs using world-normal displacement. The pattern is procedurally generated seamless black/white fabric. Useful for: torn patches, rusty surface framing, manually-drawn surface texturing.
- F1b (mesh/UV influence switch): toggles whether the fabric distortion follows the UV island or stays in flat UV space. Default off. Attached to F1 only.
- Corrected classification written into `INVESTIGATION_2026-11-22.md` and `AGENTS.md`.


## 2026-11-23 — Claude Sonnet 4.6 — id `LOG-2026-11-23-CLAUDE-CORRECT`

### Classification correction for F1, F1b, F2–F5

Victory corrected two errors introduced in the previous session's doc edits:

**F1b** was wrongly moved to the Pattern Craft filter group in the last write. Victory confirmed: F1b is a sub-control of the **F1 torn fabric layer**, not a filter. It governs which mesh UV islands the torn layer's stacking influence (the green-key mask reach) applies to — this is a layer-stack behaviour toggle, the same kind as a clip mask's target scope. It belongs in F1's own control panel.

**F2–F5** rename to **Pattern Craft** is correct (previously "Cloth filter family"). These are filters applied to an existing layer's pixels, not layer types.

The key distinction Victory stated: layer types are like vector vs raster vs bone — a fundamental kind of layer. Filters affect a layer. F1 and F1b both belong to the layer-type side. F2–F5 (Pattern Craft) belong to the filter side. These are separate concerns entirely.

Docs corrected: `LAYER_FABRIC_MASK_PLAN.md`, `AGENTS.md`, `INVESTIGATION_2026-11-22.md`. Commit follows.
