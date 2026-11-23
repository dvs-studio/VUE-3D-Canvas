# INVESTIGATION_2026-11-22.md
## VUE 3D Canvas — Root-cause findings, full bug sweep, and expanded specifications
### Written by Claude Sonnet 4.6, 2026-11-22 (read-only pass; no code was changed)

---

> **For the executing agent:** This document records what was found by investigation. You hold the live source tree and may have already fixed some of these. Compare every section against your fixed copy and decide whether to keep your solution or adopt the one here. The Powderiser root cause below is the primary new finding not yet in AGENTS.md at the time of writing. The other confirmed bugs are listed for completeness — incorporate them into your one-pass execution if still open.

---

## 1. Layer types — full inventory

### Existing layer channels (`Layer.channel` in `src/core/types.ts` line 96)
| Channel | Purpose |
|---|---|
| `color` | Standard RGBA paint layer |
| `roughness` | PBR roughness map (grey) |
| `metallic` | PBR metallic map (grey) |
| `normal` | Tangent-space normal map |
| `height` | Displacement / bump height map |
| `emission` | Emissive colour map |

### Existing blend modes (`BlendMode`, `types.ts` line 30)
`normal | multiply | screen | overlay | darken | lighten | hard_light | soft_light | difference`

**Blend mode mismatch bug (P1):** The full composite (`Viewport3D.tsx` lines 365–372) only handles `multiply | screen | overlay | darken | lighten`. The dirty-rect fast composite (lines 1830–1840) adds `hard_light | soft_light | difference`. Layers using those three modes look correct while actively painting (dirty-rect path) but switch appearance at stroke end when the full composite runs. Fix: bring the full composite up to parity with the dirty-rect path for all 9 blend modes.

### Existing special layer flags
- `isTextureFill` + `textureFillConfig` — procedural tile fill (triplanar/box projection, scale, repeat, rotation, randomize)
- `isGroup` / `collapsed` — group/folder layers
- `pbrSettings` — per-layer PBR overrides (roughness, metallic, bumpHeight, normalStrength, emissionStrength, emissionColor, reflectionSource, matcapPreset)
- `uvChannel` — optional UV set override

### Planned new layer types (from AGENTS.md 2B/LAYER_FABRIC_MASK_PLAN.md)
| ID | Name | Status | Description |
|---|---|---|---|
| F6 | Mask layer | OPEN | Independent alpha mask alongside a target layer; erases other layers non-destructively. NOT the same as HOLD-SEL. |
| F1 | Torn fabric | OPEN | **Layer type** (like raster vs vector — a distinct kind of layer, not a filter). Sits in the layer stack. Black pixels/transparent = hole (shows layers below). White = torn edge/fray rim (can be auto-generated procedurally). Green = tear influence zone (which layers below are affected). If a layer beneath has image content: multiplies fabric lightness/darkness into it. If no image: produces raw black/white procedural fabric pattern. Auto-enables displacement checkbox. Rotates seamless fabric across limbs using world-normal displacement. Convert-from-paint workflow; export bake → restore. |
| F1b | Mesh/UV influence switch | OPEN | **Sub-control of F1 torn fabric layer** (not a filter, not standalone). Controls which mesh UV islands the torn layer's stacking influence (green-key reach) applies to. Default off = influence applies to all UVs beneath. When on = restricted to checked mesh UV islands only. Part of F1's own layer control panel. |
| F2–F5 | **Pattern Craft** filter family | OPEN | **Filter type** applied to an existing layer's pixel buffer via the filter menu. Family: world cloth (F2), wool/fur (F3), cotton (F4), bamboo-raft/wrap/strip stack (F5). Renamed from "Cloth filter family" (Victory 2026-11-23). |
| M1 | Matcap layer | OPEN | Dedicated matcap-driven layer with narrow Add menu; presets: chrome/ceramic/clay/pearl/gold/custom |
| F7 | Logo fabric | ON HOLD | Do not build until Victory approves. |

---

## 2. Filter types — full inventory

### Existing filters (`TextureFilterKind`, `src/tools/textureFilters.ts` line 6)

```
'wood' | 'hatching' | 'cross-hatching' | 'hashing' | 'powderiser' | 'noise-shader' | 'dither' | 'mosaic'
```

| Filter | Config fields used | Known state |
|---|---|---|
| `wood` | `woodGrainType`, `bandFrequency`, `ringFrequency`, `ringNoise`, `woodRoughness`, `woodSeed`, `woodFrequencyRandomization`, `woodSources[]` | Fixed in commit `297f230` (woodSeed declared-after-read). Believed working. |
| `hatching` | `angle`, `lineSpacing`, `bleed`, `shift`, `randomization`, `featureScale`, `positionJitter`, `angleJitter` | Believed working. |
| `cross-hatching` | Same as hatching, two-angle overlay | Believed working. |
| `hashing` | `hashSize`, `hashDensity`, `hashSeed`, `hashAlgorithm` (`sparse`/`cell`/`grid-jitter`), `positionJitter`, `angleJitter` | Believed working. |
| `powderiser` | `noise` (strength), `shift` (drift), `filterSeed` | **BROKEN — see section 3 below** |
| `noise-shader` | `noise`, `filterSeed` | Believed working (simple per-pixel darkness). |
| `dither` | `noise`, `levels`, `ditherPattern` (`hash`/`bayer`), `filterSeed` | Believed working. |
| `mosaic` | `mosaicSize` | Not verified; logic straightforward (block average). |

### Planned new filters (from AGENTS.md 2C, specified by Victory)
| Name | Description | Priority |
|---|---|---|
| Warp / wavy | Non-linear UV distortion; sinusoidal or noise-driven pixel displacement | OPEN |
| Pointillism | Scatter filled circles of sampled colour; size/density/jitter controls | OPEN |
| Honeycomb / vector cells | Voronoi cell fill; tri / square / circle / hex modes; world + normal space | OPEN |
| Stochastic scatter | Random placement of a chosen sub-texture stamp; density/scale/rotation-jitter controls | OPEN |

#### Expanded specifications for new filters

**Warp / wavy:**
- Two-pass: first build a UV offset field (sinusoidal with `angle`, `shift` amplitude, `lineSpacing` wavelength, `noise` turbulence, `filterSeed`); second pass: for each dst pixel sample source at `(x + offsetX, y + offsetY)`, bilinear.
- Controls: `shift` = max pixel offset (1–64); `lineSpacing` = wave period in pixels; `noise` = turbulence mixed in; `filterSeed` = seed; `angle` = wave direction.
- Edge handling: clamp to opaque island boundary (use `dilateImageData` pre-pass, then post-clip by original alpha).

**Pointillism:**
- Build a list of `N` random seed points (density × area). For each dst pixel find nearest seed point, sample source colour at that point, write. Optionally jitter per-cell with `positionJitter`.
- Controls: `mosaicSize` = average circle radius; `hashDensity` = point density; `noise` = colour jitter per cell; `filterSeed`.
- Render: cells are circles, not rectangles. Distance field — write if `dist(px, seed) < radius * (0.5 + 0.5 * hash(...))`. Use a spatial grid for performance (grid cell = radius).

**Honeycomb / vector cells:**
- Voronoi diagram seeded at regular offset lattice (hex, square, tri by `hashAlgorithm` repurposed). Per-cell: sample source at seed centroid, fill cell with that colour. Edge pixels (within `edge` percent of cell boundary) can receive a darkening/contrast treatment.
- Controls: `hashSize` = cell size; `hashAlgorithm` = `hex`/`square`/`tri` (new values); `noise` = centroid jitter; `edge` = edge darkness width; `directionSpace` / `axis` for world-space seeding via `objectPositionMap`.

**Stochastic scatter:**
- Load a source sub-texture (from `sourceImageDataUrl` or procedural pattern). For each stamp slot (Poisson disk or pure random based on `hashAlgorithm`): blit a rotated, scaled copy of the sub-texture stamp at that position with alpha compositing.
- Controls: `hashDensity` = stamp density; `hashSize` = average stamp size; `angleJitter` = rotation jitter; `shift` = scale jitter; `filterSeed`; `hashAlgorithm` = `random`/`poisson`.

---

## 3. Powderiser root cause (CONFIRMED by code reading, 2026-11-22)

**File:** `src/tools/textureFilters.ts`  
**Function:** `transformTexturePixels`  
**Lines:** 273 and 363

**Root cause — double division of `noise`:**

```typescript
// Line 273 — shared for all filter kinds:
const edge=cfg.edge/100, noise=cfg.noise/100, bleed=cfg.bleed/100;

// ...

// Line 363 — Powderiser block:
const strength=clamp(noise/100,0,1),drift=clamp(cfg.shift||12,1,48);
```

`noise` is already `cfg.noise / 100` (a 0–1 fraction). The Powderiser block then divides by 100 again, making `strength = cfg.noise / 10000`. With the default `cfg.noise = 25`, `strength ≈ 0.0025`. The pass-one loop selects pixels only where `hash(x,y,seed) < strength`, so essentially zero pixels are selected. Pass two has nothing to composite. The output is a near-unmodified copy of the source.

**Fix (single line):**
```typescript
// Line 363, change:
const strength=clamp(noise/100,0,1),drift=...
// to:
const strength=clamp(noise,0,1),drift=...
```

`noise` is already a 0–1 fraction. No second division needed.

**Secondary check — `drift` direction:**  
`dx` and `dy` at line 272 are computed from `cfg.angle` and are correct directional unit vectors. The scatter direction in the Powderiser is therefore angle-driven, which is intentional. No bug here.

**Secondary check — pass-one vs pass-two interaction:**  
When `strength > 0` properly, `dst[i+3]` is lowered for selected pixels in pass one, then pass two composites scatter fragments at destination positions. The alpha blending formula is correct. The only bug is the double division.

**Verification procedure for the executing agent:**
```typescript
// Quick node harness test (no browser needed):
const { createCanvas } = require('@napi-rs/canvas'); // or node-canvas
const canvas = createCanvas(64, 64);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 64, 64);
const src = ctx.getImageData(0, 0, 64, 64);
const cfg = { ...DEFAULT_TEXTURE_FILTER, kind: 'powderiser', noise: 50 };
// Before fix: strength = 0.0050 → ~0 selected pixels → output identical to input
// After fix: strength = 0.50 → ~50% selected → visible scatter
```

---

## 4. S0-1 stroke teleport — confirmed root cause (from prior agent investigation)

**Files:** `src/renderer/Viewport3D.tsx`, `src/tools/brushEngine.ts`

### Chain of failure
1. **`raycastUV` (Viewport3D.tsx line 1647–1696):** Returns only `intersects[0].uv`. Discards `faceIndex` entirely. No caller can know which UV island or triangle was hit.
2. **Move handler (lines 1571–1601):** Takes the returned UV, converts to texels (`targetX = uv.x * W`, `targetY = (1-uv.y) * H`), feeds directly to `brushEngine.updateStabilizer` → `executePaintTool`. No distance check, no island check.
3. **`brushEngine.paintDabs` (lines 199–250):** `fromX = state.lastDabPos.x`, computes `distance = hypot(dx, dy)` in texel space, then `while(progress <= 1.0)` stamps a dab every `step` pixels. No max-distance cap. If the pointer moved from one UV island to another, `lastDabPos` is on island A and the new point is on island B, potentially 500+ texels apart. The engine fills that entire gap with dabs.
4. **`updateStabilizer` (brushEngine.ts lines 92–115):** Operates in texel space. After an island jump, the stabilizer tether glides through the intermediate empty texture region.
5. **Mirror paths:** Every mirror stroke key (`mirror-X`, `mirror-Y`, `mirror-XY`, `mirror-Z`) carries its own `lastDabPos` and receives the same unchecked UV. Each mirror path independently draws a bridge line.

### Fix direction
**Option A — faceIndex island guard (recommended, minimal):**
- Modify `raycastUV` to also return `faceIndex` (the index is on `intersects[0].face.a` or use `intersects[0].faceIndex`).
- In the move handler: compare current `faceIndex` with the face stored at last-dab time. If they differ by more than a threshold (or if the texel jump exceeds `brushSize * 2`), call `brushEngine.beginStroke(key)` for every active mirror key to reset `lastDabPos` to the new point. This skips the bridge.
- Store `lastFaceIndex` per stroke-key in `BrushStrokeState` (new field: `lastFaceIndex?: number`).

**Option B — screen-space sub-stepping:**
- Sub-divide the pointer segment in screen space, raycast each step, dab only where a hit is found. Expensive on dense pointer streams. Only do this if Option A is insufficient.

**Carve-out:** The S0-1 carve-out in AGENTS.md permits touching `Viewport3D.tsx` pointer paths + `raycastUV` + `brushEngine.ts` beginStroke/paintDabs/getStrokeState/lastDabPos/residual for this fix only. Nothing else in those files changes.

---

## 5. Additional confirmed bugs from bug sweep (P0/P1/P2)

### P0 — Critical

**Undo stack memory exhaustion (`src/core/history.ts` lines 70–95)**
- `pushState` snapshots every layer canvas via `getImageData` → `createImageData` + `.set`. At 1024², 4 bytes/px = 4 MB per layer. With 10 layers and 30 undo states: 10 × 4 MB × 30 = **1.2 GB**. Mobile/low-RAM devices will OOM.
- Fix: use `canvas.toDataURL('image/png')` compressed PNG strings (≈50–100 KB each). On restore: `drawImage` from an `Image` created from the data URL. Keep at most 20 states, not 30.
- Structural note: `applySnapshotToLayers` only restores canvas pixels for layer ids that exist. Layer adds/deletes/reorders are not undoable. Document this limit or expand the snapshot to include layer metadata arrays.

**Material leak (Viewport3D.tsx lines 933–985)**
- Effect that depends on `[shadingMode, materialProps, layers]` creates a new `MeshStandardMaterial` every time `layers` changes. The old material is never disposed. Each stroke end triggers a re-render which may update layer state → new material. Over a session: hundreds of leaked GPU materials.
- Fix: hoist the material creation outside the effect. Update material properties in-place via `material.map = ...`, `material.needsUpdate = true`. Only recreate when shading mode changes.

**Scene teardown memory leak (Viewport3D.tsx lines 828–844)**
- Component unmount never calls `geometry.dispose()`, `material.dispose()`, `texture.dispose()` on the mesh, x-ray points, or symmetry helper.
- Fix: explicit dispose calls in the cleanup return of the mount effect.

### P1 — High

**Blend mode mismatch** (described in section 1 above)

**PBR texture rebuild on every stroke (Viewport3D.tsx line 1084)**
- `updateCompositeTexture` rebuilds 1024² Float32 height/reflection/normal buffers + 5 `texture.needsUpdate` uploads whenever `layers` changes. Every stroke end triggers this.
- Fix: debounce `updateCompositeTexture` by 100 ms, or gate it behind a dirty flag that only sets when PBR-relevant layer channels (height, normal, roughness, metallic) actually changed.

**No pointer capture on 3D canvas**
- The pointer-move handler (Viewport3D.tsx ~1571) will miss events if the pointer leaves the canvas. Add `canvas.setPointerCapture(e.pointerId)` on pointer-down, `releasePointerCapture` on pointer-up. Prevents dropped strokes at canvas edges.

**No `getCoalescedEvents`**
- Fast pointer movement generates coalesced events that are silently dropped. Result: strokes on fast gestures look like dots with large gaps.
- Fix: in the pointer-move handler, call `e.getCoalescedEvents()` and process each event's UV in sequence.

**`willReadFrequently` missing on most layer canvas contexts (App.tsx lines 121, 267, 705, 746)**
- Layer canvases are frequently read with `getImageData` for compositing, blur, smudge, clone. Missing `willReadFrequently: true` on `getContext('2d')` causes Chrome to store the canvas on the GPU and round-trip on every read. Add it on all layer canvas creation.

**Duplicate View menu (PhotoshopMenuBar.tsx lines 284 and 507)**
- Two top-level "VIEW MENU" blocks both respond to the same `'view'` key. Both open simultaneously on a View menu click. Remove or merge one.
- Menus close only via `onMouseLeave` — never fires on touch/pen. Add Escape keydown handler + outside-click (pointerdown outside the menu) to close any open dropdown.

**MeshPartsPanel.tsx line 80 TypeScript error**
- `onClick` handler typed as `(id?: string) => void` but receives a `React.MouseEvent` from the JSX `onClick` prop. The event is passed as the `id` parameter. Fix: `onClick={() => handler(part.id)}`.

**Per-dab `getImageData` in blur/clone/smudge tools (brushEngine.ts lines 538, 564, 602, 605)**
- Each dab reads the entire layer canvas. At 60 fps and 100-pixel spacing this is hundreds of full-canvas reads per second.
- Fix for blur/clone: read once at stroke begin, work on that snapshot. For smudge: accumulate in a small local buffer around the dab position.

**Clone tool allocates a new canvas per dab (brushEngine.ts line 572)**
- `const c = document.createElement('canvas')` per dab. GC pressure.
- Fix: create one clone canvas at stroke begin, reuse.

**Stale-closure risk in keydown effect (App.tsx lines 594–673)**
- Large effect with many dependencies. Many of the values accessed inside are likely captured from render, not from ref. Audit for any value that changes during a stroke and is captured by the effect closure rather than read from a ref.

### P2 — Medium

**TypeScript errors (tsc --noEmit, Vite build passes but types are wrong):**
- `xblendFormat.ts` lines 142–153: duplicate keys in object literal — first value silently overwritten. Fix: deduplicate.
- `hdriManager.ts:145`: HTMLCanvasElement passed where HTMLImageElement expected.
- `surfaceShading.ts:85`: InterleavedBufferAttribute assigned to BufferAttribute.
- `textureFilters.ts:316`: WoodSource union typed as intersection (`&` instead of `|`).
- `MeshPartsPanel.tsx:80`: as above.

---

## 6. Speed tooling — recommendations for the executing agent

These are setup tasks that pay dividends across the whole one-pass execution. Install them in a preliminary commit before coding.

### Vitest unit tests (pure functions only)
```bash
npm i -D vitest @vitest/ui
# package.json:
"test": "vitest run",
"test:ui": "vitest --ui"
```
Write tests for `textureFilters.ts → transformTexturePixels` using `@napi-rs/canvas` (no browser):
```typescript
// tests/textureFilters.test.ts
import { createCanvas } from '@napi-rs/canvas';
import { transformTexturePixels, DEFAULT_TEXTURE_FILTER } from '../src/tools/textureFilters';
// Test: powderiser changes pixels
// Test: wood produces >0 unique values
// Test: dither produces quantised output
```
Run before each commit that touches `textureFilters.ts`.

### TypeScript strict watch
```bash
# package.json:
"typecheck": "tsc --noEmit",
"typecheck:watch": "tsc --noEmit --watch"
```
Run `npm run typecheck` before committing. Fixes the 10 silent errors above.

### ESLint with react-hooks + typescript-eslint
```bash
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks
```
Catches stale closures (the keydown bug pattern), missing deps in useEffect, and type mismatches.

### Playwright smoke test
```bash
npm i -D playwright
npx playwright install chromium
# tests/smoke.spec.ts: launch page, pick brush, click canvas, assert canvas not blank
```
Run after `npm run host:sync` to verify the built page loads and paints.

### Fast iteration — use `npm run dev` during development
During the one-pass execution, run `npm run dev` (Vite HMR) rather than `npm run host:sync` after every change. Only run `host:sync` once at the very end. HMR reflects changes in under 1 second vs. a full bundle rebuild.

### Three.js chunk splitting
```js
// vite.config.ts, build.rollupOptions:
manualChunks: { three: ['three'] }
```
Separates the 600 KB Three.js bundle from the app chunk. Reduces main-chunk parse time on first load.

---

## 7. Expanded new filter + layer specifications

### Cloth filter family (F2–F5) — expanded detail

**F2 — World cloth**
- Principle: simulate cloth drape using a mass-spring grid in object space. Use the `objectPositionMap` (already built by `buildObjectSpacePositionMap`) to know real 3D positions of texels. Apply a downward gravity vector, pin top row, run N (default 4) Verlet iterations per apply call. Output: a UV offset field → warp the paint layer.
- Controls: `shift` = drape amount; `noise` = fabric sag randomisation; `angle` = gravity direction in UV space; `filterSeed` = initial fold seed.
- Implementation path: pure 2D on the UV/object map, no Three.js at apply time.

**F3 — Wool / fur**
- Principle: directional fibre noise. For each texel, trace a short line (length = `lineSpacing`, direction = `angle` + `noise`-driven jitter from `filterSeed`) in UV space. Accumulate source colour along the trace (like a mini motion blur). The fibre gives texture a soft fibrous look.
- Controls: `lineSpacing` = fibre length; `noise` = fibre direction jitter; `shift` = fibre density; `angle`.

**F4 — Cotton**
- Principle: woven textile grid. Two families of threads (warp/weft). Each thread occupies `lineSpacing/2` pixels, alternately over/under. Thread colour sampled from source image at thread centre. Thread edge softened by `bleed`.
- Controls: `lineSpacing` = thread pitch; `angle` = warp direction; `bleed` = thread edge softness; `noise` = thread tension variation; `shift` = thread displacement jitter.

**F5 — Bamboo-raft / strip stack**
- Principle: rigid horizontal strips. Each strip is `lineSpacing` pixels tall, samples source at strip centre row, fills entire strip height with that colour. Strips can be offset by `shift` pixels horizontally based on `hash(stripIndex, 0, seed)`.
- Controls: `lineSpacing` = strip height; `shift` = max horizontal offset; `noise` = strip colour jitter; `filterSeed`.

### Mask layer (F6) — expanded detail

The mask layer stores an independent alpha channel alongside a target colour layer. It is not a selection — it is a persistent, paintable, non-destructive mask:
- Stored as a separate `Layer` with `channel: 'mask'` (new channel type to add to `types.ts`).
- The compositor multiplies the mask layer's red channel into the target layer's alpha before blending.
- Mask brush (`mask_brush` tool) already exists. Its output writes to the active mask layer, not to a colour channel.
- UI: mask layer thumbnail shown in the layer panel as a greyscale badge alongside the target layer's thumbnail. Click to switch between painting the layer and painting its mask.
- When no mask layer is attached, behaviour is unchanged. No mask layer is created by default.

### Matcap layer (M1) — expanded detail

A matcap layer reads the mesh normal in view space and samples a 512×512 matcap texture at `(normal.x * 0.5 + 0.5, normal.y * 0.5 + 0.5)`. The result is composited as a colour layer.
- Implementation: rendered per-frame by the PBR material, not as a paint canvas layer. The existing `reflectionSource: 'matcap'` in `LayerPBRSettings` already drives this for PBR purposes. M1 is a dedicated layer type that exposes matcap as a first-class layer with its own opacity/blend mode in the layer stack.
- Add `channel: 'matcap'` to the `Layer.channel` union.
- The composite function reads the per-pixel matcap value from a pre-rendered matcap texture (computed once on model load / normal-map change, stored as an `ImageData`).
- Presets: chrome, ceramic, clay, pearl, gold, custom (URL input).

---

## 8. Summary for executing agent

| Item | Root cause confirmed? | Fix complexity | Priority |
|---|---|---|---|
| Powderiser broken | YES — double `/100` on `noise`, line 363 | 1-line fix | P0 |
| Stroke teleport (S0-1) | YES — no faceIndex, no texel-jump guard | ~30 lines in Viewport3D + 5 in brushEngine | P0 |
| Blend mode mismatch | YES — full composite missing 3 modes | ~20 lines | P1 |
| Material leak | YES — no dispose in layers-change effect | ~5 lines | P0 |
| Scene teardown leak | YES — no dispose in unmount | ~10 lines | P0 |
| Undo OOM | YES — raw ImageData snapshots | Moderate refactor | P0 |
| PBR rebuild on stroke | YES — no debounce | ~10 lines | P1 |
| Pointer capture | YES — missing setPointerCapture | ~4 lines | P1 |
| getCoalescedEvents | YES — not called | ~10 lines | P1 |
| willReadFrequently | YES — missing | ~5 lines across App.tsx | P1 |
| Duplicate View menu | YES — two blocks, same key | ~5 lines | P1 |
| Menu close on unfocus | YES — only onMouseLeave | ~15 lines | P1 |
| MeshPartsPanel onClick | YES — TS error, event passed as id | ~2 lines | P1 |
| xblendFormat TS errors | YES — duplicate keys | ~10 lines | P2 |
| hdriManager TS error | YES | ~2 lines | P2 |
| surfaceShading TS error | YES | ~2 lines | P2 |
| textureFilters:316 TS | YES — & vs \| | 1 char | P2 |

**One-pass execution order:** Fix the TypeScript errors first (they're mechanical and confirm the build is clean). Then Powderiser (1-line fix, verifiable immediately). Then S0-1 (requires Viewport3D + brushEngine edits under the carve-out). Then blend mode mismatch. Then the P0 memory bugs. Then the remaining P1 items. Then run the new filter and layer implementations (2B → 2C). Speed tooling setup should be first commit of the session.
