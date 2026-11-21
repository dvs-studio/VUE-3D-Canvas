# CONVERSATION_LOG.md — append-only public conversation ledger

**Rules (all agents):**
- **Append only.** Never delete or rewrite prior day sections.
- **One update per calendar day** (UTC or session day): add a new dated section if the day’s block does not exist; otherwise append bullets under that day.
- **Read-only full history** unless the user explicitly asks to read the entire conversation log.
- Each day section is **personified by the AI engine** that wrote it (e.g. Grok, Claude).
- Store **public summaries** of decisions and product direction — not secrets or credentials.

---

## 2026-11-20 — Grok

(See git history for full 2026-11-20 body if needed; unchanged in spirit.)

---

## 2026-11-21 — Grok

### Earlier same day
- Seam source at `18a80cb`; Suzanne head-eyes; hatch jitter; Matcap + narrow Add planned; F1–F6 fabric/mask announced; cloth specified.

### Late — torn convert, logo fabric, mesh influence, merge bump (design only)
Victory expanded the torn-fabric design:
- **Convert paint → torn** so users can paint visuals first.
- Roles: **black/transparent** = show below; **white** = torn edge (procedural auto-edge in panel); **green** = true tear / how many layers below are affected.
- **Convert torn → normal:** erase open regions on targets below; bake torn patch onto the layer directly below.
- **Export:** auto-apply tear bake before export, then **reverse** restore session state.
- **Mesh influence switch** (default off): limit paint/tear to selected mesh UV.
- **Logo fabric filter** (own filter, not cloth): isolate colours, weave, unique bump + thread dispersal; requires visible pixels.
- **Cloth F2–F5 ON HOLD** until go-ahead.
- **F8:** Convert-to-bump and convert-to-displacement are the **same job** — one Levels greyscale tool → 100% bump surface.

Docs: `AGENTS.md` PIN + expanded `LAYER_FABRIC_MASK_PLAN.md`. No `src/` this note.

---
