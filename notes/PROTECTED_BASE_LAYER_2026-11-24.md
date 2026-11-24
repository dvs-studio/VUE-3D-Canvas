# Protected base layer restoration — 2026-11-24

## User clarification
The layer stack must contain a permanent base layer. It is a fallback/base coat, not a paintable working layer.

## Changes
- Added optional `Layer.isBaseLayer` metadata.
- Initial `Base Color Layer` is now tagged as the base and locked from creation.
- The Layers panel displays a `BASE` marker and fixed lock icon. The base cannot be hidden, unlocked, reordered, duplicated, deleted, grouped, or merged through the provided controls.
- Blend and opacity controls are disabled while the base is selected.
- Loading legacy `.xblend` projects now restores a neutral base layer if missing, or normalises an existing base layer to the protected state and bottom-of-stack position.
- The base remains selectable for reference but is not a painting target because the existing locked-layer guards reject edits.

## Design details
- Fallback base coat: neutral `#9c9c9c`.
- Base is always visible, 100% opacity, normal blend, locked.
- Additional user-created layers remain above it.
- This is a texture-stack fallback coat, not the viewport's UV grid/checkerboard display.

## Verification
CI is running after the commits. Browser UI acceptance and project round-trip tests are still required; do not claim those are manually completed.
