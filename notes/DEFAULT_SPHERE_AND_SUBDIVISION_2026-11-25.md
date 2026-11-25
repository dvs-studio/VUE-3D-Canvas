# Procedural Sphere Startup and Subdivision Pole Repair — 2026-11-25

## User direction

- Start the application with the procedural sphere.
- Keep Suzanne available in the alphabetically ordered model preset list, not as the startup model.
- Fix visible holes on the procedural sphere when subdivision preview is enabled.

## Changes

- `src/App.tsx`: initial `modelKey` and initial active geometry now use `BUILTIN_MODELS.sphere()`; the invalid-key fallback also uses the sphere.
- `src/ui/PhotoshopMenuBar.tsx`: model preset list is alphabetically ordered and includes both `Suzanne` and `Suzanne Head + Eyes`; the selected-model fallback is `sphere`.
- `src/renderer/Viewport2D.tsx`: standalone/default UV viewport geometry and local fallback now use the sphere.
- `src/renderer/modelGeometry.ts`: marks the procedural sphere geometry with `userData.modelKey = 'sphere'`.
- `src/renderer/subdivisionPreview.ts`: for the tagged procedural sphere only, weld coincident top and bottom pole vertices before subdivision and centre their undefined U coordinate at 0.5. This creates a connected pole fan for Catmull-Clark rather than treating each coincident pole copy as an independent boundary vertex. Degenerate triangles created by the remap are skipped.

## Scope and safety

- Other meshes retain their existing topology handling.
- Suzanne remains available and is only instantiated when selected.
- No accepted Suzanne OBJ assets were changed or deleted.
- No changes to the protected 3D paint path or UV-island seam logic.

## Verification

The code has been committed. Automated TypeScript/build/self-host checks are pending the latest workflow. Manual testing must compare the sphere at subdivision levels 0, 1 and 2, using both Catmull-Clark and Simple, and inspect the north/south poles, UV seam and silhouette. Do not mark the hole repair accepted based on compilation alone.
