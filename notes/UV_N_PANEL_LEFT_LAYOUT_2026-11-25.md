# 2D UV Left N-Panel — 2026-11-25

## User request

Move the existing 2D UV workspace tools into a left-side N-Panel instead of keeping the working controls spread across the top HUD. This is a reorganisation of the existing UV workspace, not a request for a separate UV desk.

## Source changes

- `src/ui/UVNPanel.tsx`
  - Moved the open panel from the right edge to the left edge.
  - Changed the collapsed handle to the left edge with a right-pointing affordance.
  - Added a Display tab for UV wireframe visibility, opacity and colour.
  - Kept the existing Unwrap, Channels, Mirror and Sculpt tabs.
  - Added a Quick UV Unwrap entry point in the Unwrap tab for the existing quick dialog.
- `src/renderer/Viewport2D.tsx`
  - Moved UV wireframe toggle/opacity, UV set selection and Smart UV entry out of the horizontal HUD and into the N-Panel's existing controls.
  - Kept the HUD for viewport identity, texture dimensions, zoom and live selection/mask status.
  - When the N-Panel is open, offsets the HUD to avoid overlapping the left panel.
  - Retains the existing N-key focus/pointer scope and touch navigation paths.

## Behaviour that must remain intact

- Active UV channel selection and channel creation/deletion.
- Smart unwrap and quick unwrap entry points.
- Seamless gutter and inverse rebake.
- Symmetrize and selected-vertex scope.
- UV sculpt modes, radius and strength.
- UV wireframe toggle, opacity and colour.
- 2D painting, selection overlays, pen tools and touch navigation.

## Verification

Workflow #318 passed TypeScript diagnostics, Vite build, self-host sync, package validation and artifact creation after the panel/viewport wiring. Workflow #320 (import cleanup) is the final follow-up check and must be confirmed before marking the current source as fully CI-verified.

Manual acceptance is still required for:
1. Left panel open/close and N shortcut.
2. Panel behaviour at narrow desktop and tablet widths.
3. Top HUD not overlapping the open panel.
4. Display tab controls and UV overlay visibility/opacity/colour.
5. Channel switch, channel creation/deletion and rebake.
6. Quick unwrap, seeded unwrap, symmetrize and sculpt.
7. Painting and selection interaction while the panel is open.
8. Touch navigation and stylus painting.
