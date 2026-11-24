# Self-hosted A4 / A6 / A7 follow-up — 2026-11-24

## Scope

This pass continues the troubleshooting handover in the self-hosted TypeScript application only. No Rust workspace, OBJ source asset, safety archive or built-in triplanar sample texture was changed.

## A4 — mesh-part filter target

- `TextureFilterDialog` receives mesh-part options, the selected part, active UV channel and UV geometry version.
- `TextureFilterConfig` carries a target mesh-part id, an enable flag and a byte coverage mask.
- `buildMeshPartPixelMask` rasterizes the selected component's triangles in the active UV channel. It supports `geometry.userData.componentIndices` and geometry groups.
- The transform applies the mask on all output paths. Pixels outside the selected component are blended back from the original source, preserving them unchanged.
- Atlas dilation is disabled while a part mask is active so it cannot alter adjacent parts.
- Preview and Apply validate mask creation and report an inline error if the target cannot be rasterized.
- The filter dialog is portaled outside the scaled app root. Its outer surface is pointer-transparent; the card remains interactive and outside pointer-down closes it.
- CI: [Run #262](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45387796699), artifact `14918105222`.

## A6 — 2D UV workspace

- The UV selector now uses the actual active UV channel list and updates the same channel state used by the rest of the application.
- The 2D layer composite respects layer opacity and supported Canvas blend modes.
- Canvas backing sizes, overlay sizes, pointer mapping, sculpt mapping, selection masks and fit-to-view follow the active layer's dimensions.
- Re-bake resizes every layer to the requested resolution, rebakes the active layer from the selected source channel to the target channel, and resamples the remaining layer canvases to maintain stack alignment.
- XBlend load restores each canvas to the image's natural width/height and rebuilds the composite as images finish loading.
- Selection shading reuses one offscreen canvas instead of allocating a new texture-sized canvas on pointer movement.
- Shelf order tokens were removed; the rail reserves space for the top-right touch controls.
- The UV N-Panel shortcut only responds while pointer/focus is inside the 2D viewport; the App Tablet drawer shortcut skips that region.
- CI: [Run #265](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45388498049), artifact `14918012437`.

## A7 / F8 — non-destructive Bump Levels

- Added `HeightLevels` to PBR settings and a shared `applyHeightLevels` helper.
- The Bump Levels preview computes grayscale from source luminance. Applying Levels stores input black/white, gamma, output black/white and bump influence as PBR metadata; the original color canvas is not rewritten.
- A 0–100% bump influence slider is available; newly converted bump/displacement layers and merged height results default to 100%.
- Paint-to-Bump retains color contribution. Height-only layers remain color-disabled. Conversions preserve the stored Levels.
- The 3D viewport height compositor, subdivision height builder and XBlend height-map exporter apply Levels before the height ramp.
- Merging selected bump-only/height-only layers on the same UV channel creates a dedicated evaluated grayscale height layer, preserving source Levels/ramp/influence in the merge result, then opens Bump Levels at 100%. Color-enabled bump layers are not included in this height-only merge.
- PBR preference saves and XBlend normalization retain the height Levels metadata.
- CI: [Run #283](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45389964959), artifact `14917704031`.

## Verification boundary

CI confirms TypeScript diagnostics, Vite build, self-host synchronisation, package validation, ZIP creation and artifact upload. It does **not** verify browser rendering, touch interaction or visual output.

Manual acceptance still required:
1. Filter a single mesh part and verify all other parts remain pixel-identical, including near UV borders and overlapping UV islands.
2. Switch between non-default UV channels and confirm the toolbar, UV wireframe and painting remain synchronized.
3. Re-bake at 512, 1024 and 2048 and verify all layers remain aligned.
4. Verify blend modes, shelf layout and N-Panel/Tablet shortcut routing.
5. Convert a painted color layer to bump, change Levels, and verify the color texture remains unchanged while the height response changes.
6. Merge bump/displacement layers and verify the height result, Levels preview, 100% influence and same-UV restriction.
7. Save/reload XBlend and export height maps; verify Levels persist and are applied.

A5 title dragging remains verify-only. Next tasks: UI1 window enable/disable persistence, 2A-W wood rings, 2A-T true triplanar A/B, 2B Mask/Tear/Pattern Craft/Matcap, 2C filters and 2D texture gallery. 2E subdivision remains verify-only. Do not replace built-in triplanar samples until user supplies replacements. PR #2 remains open and unmerged.
