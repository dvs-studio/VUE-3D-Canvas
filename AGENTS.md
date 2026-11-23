# AGENTS.md - VUE 3D Canvas Developer Handover

## PIN — read only this far (unless absolutely necessary)

### Agent status — 2026-11-23 (Grok-Atelier-PIN)

**Product path:** `src/` → `npm run host:sync` → `self-host/public/`. Self-host only. No `crates/vue3d_core`. Do not delete safety ZIPs.

**Protected:** 3D viewport / paint path / accepted UV-island seam fix. **Carve-out:** S0-1 stroke continuity only as previously ordered.

**Agent identity (mandatory):** Every AI that writes `CONVERSATION_LOG.md` must use a **unique session id** and display name. There are **multiple concurrent Grok (and other) conversations** on this project — do not sign as a generic “Grok” without an id. This PIN session is **Grok-Atelier-PIN** / `LOG-2026-11-23-GROK-ATELIER-PIN`.

**Out of queue:** dedicated UV desk unless Victory asks. **F7 logo fabric ON HOLD.** **HOLD-SEL** not until Victory acknowledges.

### AUTHORITATIVE — F1 Tear layer (corrects prior mix-up)

**Rename:** product name is **Tear layer** (was “Torn fabric”). Layer kind id may stay `tear` / `tear_layer`.

| Pixel | Meaning (Victory 2026-11-23 — authoritative) |
|-------|-----------------------------------------------|
| **Black or transparent** | Hole — composite shows the **immediate layer below** (not a procedural fabric multiply) |
| **White** | **Torn / fray edges** — hand-paintable; optional procedural auto-edge |
| **Green** | **Mask** — controls influence / which stack participation is masked (not “fabric pattern”) |

**What previous agents mixed up (do not re-apply):**
- Claude INVEST described F1 as a **procedural seamless fabric** that multiplies lightness micro-pixels into the layer beneath, auto-enables displacement, and rotates fabric by world normal. That is a **different feature class**. Discard as the definition of F1.
- F1b was bounced between “F1 sub-control” and “filter-side only”. For **tear stacking scope**, keep target/mesh influence **on the Tear layer panel**. A separate **filter-side** mesh/UV limit for Pattern Craft may still exist as its own control — **do not merge the two concepts into one confused toggle**.

**Retain from earlier useful design:**
- Convert paint → Tear layer; convert/apply-down bake; export apply then restore session.
- Procedural white edge generation.
- Hand-paint edges; under-paint relation: content **two levels below** may receive painted contribution when applying tear rims (document in UI).

Full write-up: [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md).

### CURRENT TODO (ordered)

#### Step 0 — Immediate scrutiny (do first)
- [ ] **S0-1** Brush stroke teleports across UV islands (investigate, then minimal fix)
- [ ] **S0-2** Powderiser / filter suite (confirmed double `noise/100` — fix; audit all kinds)
- [ ] Other regressions (diagnose UI, symmetry, boot, Head+Eyes default, paint, export)
- [ ] Spot-check **2E** subdiv preview (verify only)

#### 2A — Stabilisation chrome — OPEN
- [ ] **A4** Filter mesh-part selection
- [ ] **A5** Filter panel title-drag
- [ ] **A6** 2D UV tool shelf layout
- [ ] **A7 / F8** Merge bump/displacement → Levels → 100% bump
- [ ] **UI1** Persist window enable/disable state
- [ ] **UI2** Menu dropdowns dismiss on unfocus
- [ ] **UI3** Giant Undo/Redo lower 3D viewport

#### 2A-W — Wood filter rings (before triplanar correction)
- [ ] **Wood is not “push rings forward/back only”.** Implement real wood technology:
  - **Uniform ring form:** concentric growth rings like the inner face of a cut tree; controllable **ring count / years**, even spacing baseline, slight natural variance.
  - **Organic / abnormal ring form:** rings that **merge, pinch, and fingerprint** — finished-wood / glossy plank feel; **not** a repetitive sine stack.
  - **Curvature / grain flow:** rings and bands follow twists and turns of the surface (object-space aware), not only planar UV waves.
  - **World coordinates:** uniform placement along chosen axes (X, Y, Z, pairs, or all) — stable in the world for landscapes/props.
  - **Object coordinates:** stronger **angle sensing** when dispersing and spreading grain — orientation-sensitive wrap on the mesh.
  - Banding remains available; ring mode must read as wood, not a slider that only offsets ring phase.

#### 2A-T — Triplanar / dual-texture fill correction (after wood rings note is understood)
- [ ] **Triplanar fill missed parts of its original design** at some levels. Correctional pass:
  - Blender reference: true triplanar = sample texture on **three axes**, blend by **|normal|** sharpness; dual-texture realism = **MixRGB / height / noise mask** between two (or more) materials for landscape variation.
  - Compare current self-host triplanar / material-fill path to that; restore normal-weighted blend, consistent scale across maps, world vs object space, and **two-texture procedural mix** (mask from noise, height, or painted factor).
  - **Sample folder:** Victory will keep a folder of textures that **replace built-in** triplanar samples and get written into the system — wire load path + prefs, do not hard-only embed one set.
  - Expand useful existing procedural machinery; fix what was diluted or broken; do not delete working island-padding / mesh-position sampling without replacement.

Detail: see **Triplanar correction specification** section below PIN tables.

#### 2B — Layer technology — OPEN (after Step 0 + 2A healthy)
- [ ] **F6** Mask layer
- [ ] **F1 Tear layer** (roles above; convert; edges; export apply/restore)
- [ ] Tear-layer mesh/target scope controls (panel on F1 — not confused with filter-only F1b)
- [ ] Filter-side mesh/UV limit for Pattern Craft (separate control if still desired)
- [ ] **F2–F5 Pattern Craft** filters
- [ ] **M1** Matcap + narrow Add menu
- [x] Keep import material texture
- [ ] **F7** Logo fabric — **ON HOLD**

#### 2C — Additional filters — OPEN
Warp/wavy · Pointillism · Honeycomb cells · Stochastic scatter

#### 2D — Texture gallery — OPEN (later)
Bundle → storage + preview; GPU-tier scale; can share path with triplanar sample folder.

#### 2E — Subdiv preview — DONE (verify only)

### Triplanar correction specification (research summary)

**How Blender users get realism from two textures**
1. **Mix by factor:** MixRGB / Mix Colour between Texture A and B; factor from Noise, Musgrave, painted mask, or vertex colours — breaks tiling on landscapes.
2. **Height / cavity blend:** use one map’s height or a procedural to prefer rock on slopes and soil on flats (often combined with normal.z).
3. **True triplanar:** position → three planar UVs (XY, YZ, ZX); three samples; weights = pow(abs(normal), sharpness) normalised; same scale/offset on all channels.
4. **World vs Object:** World keeps texture locked in the scene; Object moves with the mesh and respects local axes for props.

**What VUE should correct toward**
- Normal-weighted triplanar (not a single fake sphere UV or one-axis projection).
- Explicit **Texture A / Texture B** (or slot list) + **mix mask** (noise / height / user image).
- Sharpness, scale, offset, world|object space.
- Load from **user sample folder** replacing built-ins when present.
- Keep mesh-surface raster / NaN off-mesh behaviour from the seam fix era.

**Log:** [`CONVERSATION_LOG.md`](CONVERSATION_LOG.md) · **Plan:** [`LAYER_FABRIC_MASK_PLAN.md`](LAYER_FABRIC_MASK_PLAN.md)

**Testing:** Victory tests unless he asks the agent to test.

### Work rules

Meticulous. Unique agent log ids. Short commits. Self-host only. Do not damage the accepted 3D view.

## STOP

Prior PIN history in git. Older F1 “procedural fabric multiply” text in prior agent notes is **void** for implementation.
