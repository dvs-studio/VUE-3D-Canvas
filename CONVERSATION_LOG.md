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

- Seam package `18a80cb`; Head+Eyes candidate; fabric/mask design F1–F8; cloth active plan; logo fabric on hold; log discipline required.

---

## 2026-11-22 — Grok

### Victory test results
- **Suzanne Head + Eyes:** perfect → default; **remove Squail** from product menu/default.
- **UV seam issue:** accepted **fixed** — do not reopen without new repro.
- **3D viewport:** satisfactory — **do not damage** while fixing other areas.

### Bugs / gaps to fix first
- Symmetry ON → lag / spanning gaps; OFF normal.
- Wood (and other) filters: UI incomplete (banding/wave + frequency randomisation exposure); audit unfinished kinds.
- Filter **part selection** so outside parts get no influence.
- Filter panel title-drag glitch.
- 2D UV tool shelf: original location + group/spacer; top-left except N-panel.
- F8 merge bump/displacement conversion.

### Later features
- New filters: warp/wavy, pointillism, honeycomb (tri/square/circle/hex, world+normal), stochastic scatter.
- Texture gallery + browser storage + GPU-tier downscale (e.g. 1K→256 mobile).
- Fabric/mask plan still design-only; F7 logo fabric remains on hold.

### Docs
- Announcement in `AGENTS.md` PIN.
- Full brief: `SELF_HOST_BUGFIX_2026-11-22.md` (code pointers for wood config in `textureFilters.ts`, presets in `modelGeometry.ts`).

---

## 2026-11-22 — GPT-6

### Phase A3 — layer filter recovery
- Read the current repository Markdown handovers and plans, with `AGENTS.md` and `SELF_HOST_BUGFIX_2026-11-22.md` governing the current task. Kept the work inside the self-host React/Three.js source; no native Rust, safety archive, accepted viewport or accepted UV seam changes.
- Deep-scanned `textureFilters.ts`, `TextureFilterDialog.tsx`, and the `App.tsx` apply caller. The caller passes the full config to the active unlocked layer canvas, pushes undo before the operation, then updates/notifies the composite.
- Repaired Powderiser's single-pass scatter overwrite defect with separate source-fade and dust-composite passes.
- Added seeded Wood Grain frequency randomisation and exposed it in the dialog alongside the Band / wave frequency control.
- Audited wood, hatching, cross-hatching, hashing, powderiser, noise-shader, dither and mosaic; detailed static checklist is in `SELF_HOST_BUGFIX_2026-11-22.md`.
- Source commits: `6b614ed`, `fb3b68b`, `0ac87f4`. Latest source commit `0ac87f4` passed self-host workflow run #184 / `44965787108`; generated output commit `9185d39`; artifact `14731308126`.
- CI verifies compilation and packaging only. Victory's visual confirmation of Powderiser and Wood remains pending.
- Next: A1 model menu cleanup/default Head + Eyes, then A2 symmetry-on brush lag. Phase B filters remain blocked until the current suite is accepted.

---
