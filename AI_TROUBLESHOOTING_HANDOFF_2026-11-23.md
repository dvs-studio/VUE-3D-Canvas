# AI Troubleshooting Handoff — 2026-11-23

**Repository:** `dvs-studio/VUE-3D-Canvas`  
**Scope:** self-hosted application only  
**Status:** investigation and regression harness handoff; no runtime source fix is claimed by this commit.

## Important instructions for the next agent

1. Read the current root `AGENTS.md` first. It is authoritative if this handoff or older notes conflict.
2. Work only in the self-hosted application. Do not modify `crates/vue3d_core`.
3. Treat the findings below as reproducible leads, not as proof that an integrated fix has shipped.
4. Preserve accepted viewport behaviour, independent primary/mirror brush paths, brush-dab compositing, UV bake/unwrap and the UV-island filter edge correction.
5. Do not delete protected safety ZIPs.
6. Do not start HOLD-SEL; F7 Logo Fabric remains excluded. Subdivision/2E is verification-only.
7. Re-read the Markdown plans and compare their latest revisions before implementing. The development sequence in the latest `AGENTS.md` takes precedence.

## Current immediate work

### S0-1 — UV-island stroke teleport / bridge

**Observed code path:** `src/renderer/Viewport3D.tsx` raycasts UV coordinates, then feeds texture-pixel positions to the brush engine. A missed raycast currently leaves the prior stroke/stabilizer path alive. The brush engine interpolates dabs from its previous dab position.

**Likely failure mechanism:** a UV discontinuity between distant islands, or leaving and re-entering the mesh, can cause interpolation to bridge unrelated UV locations.

**Candidate repair prepared locally:** retain the world-space hit point with the UV hit; detect implausible UV travel relative to world-space surface travel; begin a fresh stroke and clear composite/stabilizer anchors on discontinuity; end/reset the path when raycast misses; reset on pointer up/cancel and multi-touch transitions.

**Important:** the candidate patch has not been integrated into `src/renderer/Viewport3D.tsx` or validated in the running app. Do not claim S0-1 is fixed. Face-index changes alone should not be treated as UV seams because normal adjacent triangles change face index.

**Regression cases required:** same-island slow stroke; seam crossing; fast seam crossing; pointer leaves/re-enters mesh; pointer cancel; stabilizer on/off; symmetry OFF/X/Y/XY/Z; Suzanne Head and Eyes.

### S0-2 — Filter suite scrutiny

The current eight filters identified in the bundle are:

- Wood
- Hatching
- Cross-hatching
- Hashing
- Powderiser
- Noise Shader
- Dither
- Mosaic

**Powderiser diagnosis:** the common filter configuration already normalises `noise` to 0–1, but the Powderiser branch divides it by 100 again. Thus UI 25 becomes 0.0025 rather than 0.25, and UI 100 becomes 0.01 rather than 1.0. Candidate source correction: use the already-normalised value directly, clamped to 0–1.

A pixel-diff harness executed the actual minified `transformTexturePixels` function extracted from self-host run #193 using a Node ImageData shim on a 128×128 fixture:

| Powderiser case | Changed pixels | Mean absolute channel delta |
|---|---:|---:|
| Current default bundle | 100 | 0.2119 |
| Corrected default in-memory expression | 16,384 | 22.2957 |

This supports the double-normalisation diagnosis. The corrected expression was tested in memory/local generated-bundle proof; it has not yet been integrated into source and built from source.

**Preview/apply mismatch:** Apply dilates transparent UV atlas gutters by 8px before and after transformation. The filter dialog preview transforms without equivalent padding. On a transparent island-atlas fixture, the preview/apply comparison differed by 7,228 pixels (mean absolute channel delta 37.6228); applying matching pre/post dilation at the same resolution produced zero difference in the fixture. A scaled preview-padding correction is proposed but not integrated.

**Eight-filter scan (128×128 textured fixture):**

| Filter | Default changed pixels | Strong changed pixels | Uniform fixture |
|---|---:|---:|---:|
| Wood | 16,384 | 16,384 | 16,384 |
| Hatching | 5,110 | 5,113 | 0 |
| Cross-hatching | 8,626 | 8,629 | 0 |
| Hashing | 5,139 | 15,343 | 0 |
| Powderiser (unfixed bundle) | 100 | 16,384 | 50 |
| Noise Shader | 16,121 | 16,314 | 16,027 |
| Dither | 16,383 | 16,383 | 16,384 |
| Mosaic | 16,384 | 16,384 | 0 |

Hatching, Cross-hatching and Hashing appear displacement-only in this scan, so flat-colour input is unchanged. Confirm intended semantics before redesigning them. Mosaic unchanged on flat colour is expected.

## Local verification already performed

- `tests/uv-continuity-regression.cjs`: PASS (pure threshold/logic harness only; not integrated viewport testing).
- `tests/powderiser-regression.cjs`: PASS.
- `tests/filter-suite-bundle-pixel-diff.cjs`: PASS.
- Patched local generated JS bundle passed `node --check`.
- Local self-host server page and health endpoint returned HTTP 200.
- Chromium headless DOM/UI test did not complete (timed out); do not report browser interaction/device testing as passed.

## Local work-copy limitation

The previous local copy was built from GitHub Actions self-host run #193 (run ID `44969065239`, artifact ID `14733027134`, source commit `39734500951c655628776a293c9d20402860298d`). It contains the deployable app and minified bundle, not the complete TypeScript source tree. A local `git clone` was blocked by outbound DNS/network failure.

Therefore:
- No source-level fix has been integrated or built.
- The generated-bundle change is a local proof only and must not be treated as the source of truth.
- Obtain a complete current repository checkout/source ZIP before implementing and building the source patches.
- Do not copy the local generated bundle into `self-host/public/` as a substitute for source fixes.

## New development plan alignment

The latest `AGENTS.md` broadens the work beyond the original S0-1/S0-2 pass. Follow its current order, including the Step 0 completion and subsequent 2A, 2A-W, 2A-T, 2B, 2C and 2D work. The plans include the F1 Tear Layer, Pattern Craft filter suite and PBR/layer technology. Treat plans as specifications, not completed features. Keep the explicitly excluded F7/HOLD-SEL work untouched and 2E verification-only.

In particular, do not confuse:
- **F1 Tear Layer:** a layer type with black/white/green mask roles.
- **Pattern Craft:** a filter suite, with behaviour depending on whether the layer is empty or already painted.

Before coding, inspect the latest `LAYER_FABRIC_MASK_PLAN.md`, `LAYER_PBR_PLAN.md`, task handovers and agent notes. Reconcile any new debugging notes from the user's test session and record whether they are observations, hypotheses or verified reproductions.

## Expected next actions

1. Obtain complete source checkout and verify its HEAD against latest `main`.
2. Re-read all current Markdown plans and agent notes; compare against the 2026-11-23 baseline/handoff.
3. Integrate S0-1 minimally and run the complete UV/stroke matrix.
4. Fix Powderiser normalisation in source.
5. Implement preview/apply transparent-gutter parity without changing Apply's established behaviour.
6. Re-run all eight filters on textured, uniform and transparent-island fixtures at default and strong settings.
7. Complete the remaining Step 0 regression checklist.
8. Proceed through the current `AGENTS.md` sequence, recording blocked items and preserving exclusions.
9. Build the self-host app from source and synchronize generated `self-host/public/` output.
10. Only then report source/build verification and merge/push runtime changes.

## Provenance

This handoff consolidates the local investigation from 2026-11-22 and the updated Markdown review / execution matrix prepared on 2026-11-23. It intentionally does not claim that the runtime source has been modified.
