# Independent Asset Gallery Module — 2026-11-25

## Scope and sequencing

The user requested one shared asset-gallery module, with later connections to the features that consume images. The gallery must be developed and tested independently first. Do **not** mount it in `App.tsx`, add it to a menu, or connect it to any brush, filter, layer, Matcap, Triplanar, or renderer pipeline during this phase.

After the standalone module is stable, continue the outstanding application stabilisation and layer/filter tasks. Only after those tasks have been completed and tested should the gallery be connected to consumers one at a time.

## Source files added

- `src/tools/assetGallery.ts` — IndexedDB-backed asset records and storage operations.
- `src/ui/AssetGalleryModule.tsx` — standalone, currently unmounted gallery interface.

## Data model

One original image may carry multiple categories without duplicating its stored binary:

- Stencil — brush-stamp image; preserve alpha.
- Brush Texture — image interpreted as brush surface detail.
- Mask — image used to control effect coverage.
- Surface Texture — image suitable for material/triplanar use.
- Matcap — image intended for Matcap shading.
- Image Pattern — raster pattern, separate from mathematical/procedural patterns.

Procedural patterns are intentionally not represented as raster image assets.

## Storage and safety

- IndexedDB database: `vue3d-asset-gallery`, store: `assets`.
- Preserve the original image Blob unchanged.
- Generate a separate 320 px maximum-edge WebP thumbnail and average-colour metadata.
- Store metadata, original and thumbnail together by stable asset ID.
- Import accepts PNG, JPEG, WebP, GIF, BMP and AVIF.
- The gallery has no filesystem scanning, network access, or source-file write/delete behaviour.
- Removing an entry deletes only the gallery's stored copy; it does not delete the user's original file.
- Category assignments are metadata; the same image can appear in several consumer categories without duplicate image storage.

## Current interface

The unmounted standalone component provides:
- Multi-category import assignment.
- Category filtering and text search.
- Grid thumbnails and a larger detail preview.
- Basic metadata including dimensions, file size, MIME type and average colour.
- Removal from the gallery's IndexedDB store.

The optional `onAssetSelected` callback is a future integration seam only; no consumers are wired.

## Known limitations / next checks

- This is the first independent module foundation, not the completed end-to-end gallery.
- Directory scanning and the older `externalAssetLibrary.ts` scanner are deliberately not connected yet. Later reconcile the scanner with this canonical store rather than maintaining two competing libraries.
- Add automated unit/browser tests for category validation, multi-category indexing, original-blob integrity, duplicate imports, deletion and storage failure handling.
- Test import and thumbnail generation in the self-host browser, including transparent PNGs and animated GIFs.
- Add storage quota reporting and a clear recovery path for IndexedDB failures before wide integration.
- Confirm low-memory behaviour with larger image collections; do not eagerly load original blobs into the grid.
- The module has not yet been run through the repository's TypeScript/build workflow in this session.

## Separate active UI task: 2D UV N-Panel

The user has requested that the existing 2D UV workspace controls be reorganised into a left-side N-panel. This is a new active task, not a claim that the previous A6 work was rejected. Preserve the existing UV channel, composite, rebake, selection, and touch behaviour while moving the controls. Avoid disturbing the accepted 3D viewport.

## Related follow-up corrections

- Base Layer dialog's bottom action should read **Close**, not Cancel. Close retains live in-session settings; Save alone persists checker colours. Update UI copy and docs without changing this behaviour.
- The Base Layer checker is intended to become shape-sensitive around narrow geometry (for example, fingers). Treat this as a separate shader/design task and preserve the world-space projection until a safe solution is validated.
- The procedural sphere should become the startup mesh; Suzanne remains in the alphabetically ordered model preset list. Investigate holes in the sphere when subdivision is enabled.

## Verification status

Source files have been committed, but no TypeScript diagnostics, Vite build, self-host sync, browser import test, or visual acceptance has been run yet for this module. Do not describe it as verified or complete until those checks pass.
