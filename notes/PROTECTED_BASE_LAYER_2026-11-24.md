# Protected Base Layer history — 2026-11-24

## Original protection pass

The initial implementation introduced `Layer.isBaseLayer`, kept a permanent bottom `Base Color Layer`, and blocked painting, hiding, unlocking, reordering, duplication, deletion, grouping, and merging.

That first pass treated the layer as a neutral grey UV fallback coat. **That rendering model was superseded by the user's clarification and the world-space checker implementation.** Do not restore the old solid-colour UV-coat behaviour.

## Current authoritative behaviour

The Base Layer is a protected world-space procedural checker background. It is not a UV texture and is excluded from the UV composite and exported texture. It remains below the working layers and appears behind painted colour in the 3D material.

See [WORLD_SPACE_BASE_LAYER_2026-11-24.md](WORLD_SPACE_BASE_LAYER_2026-11-24.md) for the current behaviour contract, Save / Cancel / Reset rules, facility bookmarks, code map, and manual acceptance checklist.

## Original protection controls retained

- `Layer.isBaseLayer` metadata identifies the reserved base layer.
- The layer is locked against painting and remains permanently visible.
- App handlers and Layers-panel controls protect it from ordinary stack operations.
- Legacy `.xblend` projects restore a base layer if missing and place it at the bottom.

## Verification

The original protection pass was CI-checked separately. The world-space checker implementation requires its own successful CI run and manual browser/device acceptance. Do not treat the earlier CI run as validation of the current shader or dialog.
