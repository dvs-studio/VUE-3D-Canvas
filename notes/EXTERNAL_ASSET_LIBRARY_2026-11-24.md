# External asset library foundation — 2026-11-24

## Implemented
- Added `src/tools/externalAssetLibrary.ts`.
- Supports a user-selected asset root through the File System Access API.
- Remembers the selected directory handle in IndexedDB when the browser supports it.
- Scans recursively and recognises directory names containing `texture`, `brush`, or `mask`, case-insensitively. The selected root itself is also classified when its own name contains one of those terms.
- Accepts PNG, JPEG, WebP, GIF, BMP, and AVIF files.
- Uses a small Web Worker to classify and sort discovered image records, with a main-thread fallback when Worker is unavailable.
- Reads image content only after explicit folder permission has been granted.

## Not yet complete
This is the scanner/data-access foundation, not the finished Brush Library integration. The panel still needs UI wiring for:
- Texture folder entries in the external texture gallery.
- Brush folder PNGs as pattern-stamp sources, including alpha-aware stamp previews.
- Mask folder entries as brush-tip replacements.
- Preferences for changing the remembered root and enabling/disabling each folder category.
- A controlled fallback for browsers without the File System Access API.

No supplied texture assets were bundled or renamed/resized. Triplanar built-ins remain untouched until Victory supplies the ZIP. The future import pipeline should normalise accepted triplanar images to 512 px width while preserving aspect ratio and file format/alpha where possible. PNG brush images must preserve transparency; black-background extraction should be an explicit optional import operation with a preview and threshold/feather controls, never an automatic destructive conversion.

## Security and platform boundary
A browser cannot silently enumerate arbitrary PC folders. The user must choose a root and grant read permission. Remembered handles may require permission to be granted again after browser restarts or permission revocation. Folder discovery should remain read-only; do not modify or delete source assets.

## Verification
The normal self-host workflow is triggered by source commits. Passing TypeScript/build/package checks will not prove folder picker permission persistence or Worker operation in a real browser. Manual acceptance is required on the Windows desktop browser and on the intended self-host launch mode.

## CI result
- Self-host workflow #287 passed: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/45434787995
- Artifact: `VUE_3D_Canvas_SelfHost`, ID `14939569386` (about 2.08 MB).
- This validates TypeScript diagnostics, Vite build, self-host synchronisation, package validation and artifact upload. It does not validate live folder permission prompts, IndexedDB handle persistence, or visual gallery integration.
