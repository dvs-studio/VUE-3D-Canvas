# Canonical Asset Gallery — 2026-11-25

## User direction

Build one independent gallery/storage module first, then connect consumers individually after the other application work is complete. Keep consumer-specific behaviour (brush stamp alpha, procedural-vs-image pattern, Triplanar colour-vs-texture preview, Matcap interpretation, mask luminance) in the consumers rather than duplicating asset stores.

The gallery foundation and first integration pass are now complete. Do not revert it to an unmounted module or create new consumer-specific image databases.

## Canonical source

- `src/tools/assetGallery.ts` — IndexedDB metadata/original/thumbnail records and category operations.
- `src/ui/AssetGalleryModule.tsx` — dedicated gallery workspace panel, import/delete/search/category management and folder scan.
- `src/ui/GalleryAssetPicker.tsx` — compact reusable accordion/grid picker for consumer panels.
- `src/tools/externalAssetLibrary.ts` — browser folder scanner; folder-scan originals are reconciled into the canonical gallery.

## Categories

One original image can belong to multiple categories without duplicating its stored binary:

- Stencil — brush stamp image; preserve alpha.
- Brush Texture — image interpreted as brush surface detail.
- Mask — image used to control effect coverage.
- Surface Texture — material/triplanar texture.
- Matcap — image interpreted by the Matcap viewport shader.
- Image Pattern — raster pattern, distinct from mathematical/procedural patterns.

Procedural patterns remain procedural settings and are not stored as raster assets.

## Storage model

- IndexedDB database: `vue3d-asset-gallery`, version 3.
- `assets`: metadata only.
- `originals`: unchanged source Blob.
- `thumbnails`: derived preview Blob.
- Metadata links the other stores by stable asset ID. Listing and grid browsing do not load full-resolution originals.
- Thumbnail maximum edge: 320 px, WebP.
- Import supports PNG, JPEG, WebP, GIF, BMP and AVIF.
- Versioned migration preserves early combined v1 records and v2 metadata/original/thumbnail records; v3 adds a source-path index.
- Removing a gallery entry removes only the stored gallery copy, never the user's source file.

## Folder scanner reconciliation

The existing File System Access scanner still enumerates user-granted directories and processes image previews in a Worker where supported. It now also:

- Classifies `stencil`, `matcap`, `mask`, `brush`, `pattern` and `texture` folder names into the matching gallery category.
- Stores original file Blobs in the canonical gallery; the scanner's smaller WebP remains available to legacy consumers.
- Records source path and source modification time.
- Skips unchanged files and replaces a gallery copy when file size or modification time changes.
- Keeps the legacy scan result available if canonical gallery persistence fails.

The gallery panel exposes a **Scan library folder** action. After scanning, use the refresh control in a compact picker if it was already open.

## Consumer integrations

- Triplanar: compact Surface Texture Gallery accordion in each texture row. The existing preview still shows the selected colour when instance-colour mode is enabled and the image when disabled. Hover quick-look is enabled only in image mode.
- Material Fill: Surface Texture Gallery inside the texture import/auto-node dialog.
- Mask Layer: Mask Gallery; selected image is applied to the target-linked mask canvas.
- Tear Layer: Mask Gallery; selected image is applied to the RGB-role tear canvas.
- Matcap: Matcap Gallery in Layer Settings; selection switches the layer to custom Matcap.
- Brush Library: image Stencil Gallery and image Pattern/Brush Texture Gallery, kept separate from procedural pattern types. Selected image micro-previews sit below the brush menu tabs.
- Pattern Stamp: Stencil/Decal gallery, Mask gallery for torn-edge input, and Surface/Brush Texture gallery for grunge overlays.
- Full gallery workspace is mounted as a dedicated Docker tab.

## Brush image vs procedural pattern distinction

- `stencilUrl` is the actual brush-stamp image, including its alpha.
- `patternUrl` is a raster image pattern/brush texture.
- `patternType` remains the mathematical/procedural pattern setting.
- Selecting a procedural pattern clears the image URL; selecting an image pattern clears the procedural type. This prevents the two concepts from being conflated.

## Verification

- Workflow #386 passed TypeScript diagnostics, Vite build, self-host sync, package validation and artifact upload after the final Tear Layer fray-boundary correction.
- Self-host artifact ID: `15000797321`.
- Run: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45569008417
- Earlier #385 also passed the full gallery integration build (artifact `15001151525`).

This is automated build/package verification only. Still required:
- Browser test IndexedDB migration from v1/v2 to v3.
- Import and re-import scans, changed-file refresh, categories and source path reconciliation.
- Transparent PNG and animated GIF preview/original integrity.
- Quota/storage failure handling and large-library memory behaviour.
- Verify each consumer selection, persistence, hover quick-look and alpha handling on desktop/tablet.
- Add GPU-tier auto-scaling and bundle/resource packaging policy.

## Related project state

- 2D UV workspace left N-Panel is implemented; manual desktop/tablet acceptance remains.
- Base Layer Close copy, curvature-adaptive checker, procedural sphere startup, sphere subdivision pole repair, Wood rings, Triplanar world matrix, Mask/Tear, Matcap, Pattern Craft and additional filters are documented in `AGENTS.md`, `AGENT_STATE.md` and `notes/WOOD_FILTERS_MATCAP_AND_CURVATURE_2026-11-25.md`.
