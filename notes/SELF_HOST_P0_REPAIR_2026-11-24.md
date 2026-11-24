# Self-host P0 repair pass — 2026-11-24

## Scope and source of truth

- Target: the self-hosted TypeScript/React/Three.js application on remote main.
- Root AGENTS.md remains authoritative; AGENT_STATE.md contains the Gemini Hydrogen audit and this execution record.
- No changes were made to crates/vue3d_core, Suzanne OBJ assets, release/safety archives, or the unmerged PR #2 branch.
- The audit supplied a new, concrete reason to revisit the previously accepted paint path: face-index ordering was being used as a UV seam heuristic, and queued pointer samples were discarded at pointer-up.

## P0 fixes landed

1. **TypeScript and CI**
   - Fixed the five audited TypeScript problem areas: XBlend manifest duplicate keys, HDRI canvas fallback typing, interleaved normal-attribute typing, Wood filter fallback typing, and Mesh Parts selected-ID callback.
   - Added npm run lint as a required step before the self-host build.
   - Added workflow concurrency cancellation so stale main-branch builds do not race while committing generated output.

2. **UI regressions**
   - Removed the duplicate View menu and kept Reset View Zoom plus Frame Selected Mesh in the surviving menu.
   - Removed pointer-leave dismissal from dropdowns; outside-pointer and Escape dismissal remain.
   - Moved the bulk layer-selection actions out of the compact bottom toolbar and allowed the action strip to wrap.
   - Restored missing Grouped/Expanded Stack callbacks and Navigator surface/shading props.
   - Moved Drone/Axis controls below the top viewport toolbar to avoid overlap.

3. **Export and filter parsing**
   - Added src/renderer/objExporter.ts to serialize the actual active BufferGeometry as Wavefront OBJ, including vertices, available UVs, normals and geometry groups.
   - The glTF/FBX export dialog now receives a mesh wrapping the active geometry instead of null.
   - Fixed the double-escaped RGB/RGBA/HSL regex in fillSuite.ts.

4. **UV seam continuity and pointer delivery**
   - Added src/tools/uvIslandMap.ts, which caches connected UV-island IDs using shared geometric edges and matching UV coordinates. It supports the active UV channel and invalidates by UV geometry version.
   - Replaced the face-index-delta heuristic with UV-island identity checks.
   - Added per-path brush reset and an entry dab so a seam transition restarts primary and symmetry paths at the new UV location without an atlas-spanning bridge.
   - Added pointer capture and a shared event-drain routine. Pointer-up/cancel now processes the final pointer position and queued/coalesced samples before ending the stroke.

5. **UV coverage clipping**
   - Added src/tools/uvIslandClip.ts to build a non-dilated Path2D from the active mesh UV triangles.
   - 3D brush/eraser/pen, gradients, clone, smudge, blur and Mask Brush are drawn through that clip. Blur now renders its processed patch through drawImage because putImageData ignores Canvas2D clipping.
   - The clip is a live paint-space aid and is not written into exported texture pixels.

## CI evidence

Final source revision tested: b54476cc1455c9bc18d895bc638cf5d858d315b3.

- Workflow run #258: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45386790536
- Result: success — TypeScript diagnostics, Vite build, self-host sync, blank-package validation, generated-output commit, ZIP and artifact upload all passed.
- Artifact: VUE_3D_Canvas_SelfHost, ID 14917995630, approximately 2.07 MB.
- Earlier successful checkpoints: #247, #252, #255 and #256. Intermediate failures were corrected before the final #258 pass.

## Verification boundary

CI verifies type-checking, build and packaging only. It does not prove pen/touch feel, visual seam continuity, clipping appearance, actual model export round-trips, or UI layout at different screen sizes.

### Manual acceptance checklist for Victory

- [ ] Launch the newest self-host package and confirm Suzanne Head + Eyes is visible.
- [ ] Paint quickly across UV seams on a complex mesh; confirm no line is drawn across the atlas and direction continues on the corresponding UV edge.
- [ ] Paint near island borders with brush, eraser, blur, clone, smudge, gradients and Mask Brush; confirm no pixels appear outside UV triangle coverage.
- [ ] Repeat with a non-default active UV channel.
- [ ] Test symmetry OFF, X, Y, XY and Z across a seam; check the final segment and undo/redo.
- [ ] Drag outside the viewport and release; confirm the final queued segment is not lost.
- [ ] Export OBJ and glTF/FBX; confirm the exported geometry is the loaded model, not a placeholder.
- [ ] Check View menu, expanded/grouped Layers panels, Navigator controls and narrow-window layout.
- [ ] Check RGB/RGBA/HSL tint parsing in the Triplanar fill flow.
- [ ] Verify startup, save/load and the diagnose/last-command workflow.

## Remaining work

- **2E Subdivision Preview remains verify-only**; it was not redesigned or capped in this pass.
- A4 mesh-part filter selection and UV pixel mask remain next.
- A5 title-drag remains verify-only.
- A6 UV tool shelf, A7 bump/displacement-to-levels workflow, UI1 window persistence, 2A-W Wood rings, 2A-T dual-texture triplanar, 2B layer/filter features, 2C additional filters and 2D texture gallery remain open.
- Do not change built-in triplanar sample textures until Victory supplies replacements.
