# Self-host handover

## PIN — read only this far

Same sets as `AGENTS.md`. `STOP` comes after History.

### To do — this set, not started

The ten numbered items in the `AGENTS.md` pin. How: [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md).

**Safety backup (do not delete or overwrite):**
- `release/vue3d-self-host-safety-2026-11-14.zip` (canonical)
- `self-host/vue3d-self-host-safety-2026-11-14.zip` (same backup inside this folder; added 2026-11-19)
- See also `self-host/SAFETY_BACKUP.md`

### Current implementation

See `AGENTS.md` PIN (in progress on self-host painter). Do not edit `crates/vue3d_core`. Do not delete the safety ZIP.

### Current history — concluded set

2026-11-14 view set. Zoom redraws. The canvas follows the window. `index-DXhSIj8p.js`.

### History — concluded set

2026-11-12 filter set. Triplanar, Scatter, and Edge Wear open and stay off the view. The view sleeps while idle.

When the to-do set is concluded, move the filter set under `STOP`. Do not delete it.

## STOP

Read past this line only if absolutely necessary.

2026-11-09 navigation set, concluded. Free tumble, file normals, full Smooth, UV islands, `file://`.

The detailed 2026-11-17 / 2026-11-18 execution checkpoints remain in git history for this file (commits before this PIN refresh). Prefer the PIN above for current work. Full recent self-host detail is also in Actions logs and `LAYER_PBR_PLAN.md`.

Read this file first. The product to finish is the self-hosted painter. Do not start the Windows DirectX rewrite until Victory says this folder is accepted.

## What to run

- Folder: `self-host/`
- Open `self-host/public/index.html` with `file://`, or `node server.js` / `npm run host` for `http://`
- Rebuild with `npm run host:sync`
- Do not edit `crates/vue3d_core`. Do not delete `self-host/vue3d-self-host-safety-2026-11-14.zip` or `release/vue3d-self-host-safety-2026-11-14.zip`.


## 2026-11-19 — blank-screen repair
`Viewport3D` used `uvGeometryVersion` in effect dependency arrays without receiving it in the component parameter destructuring. This free identifier caused a render-time `ReferenceError`, explaining the blank screen on both desktop and hosted Android. The prop is now destructured with a safe default (`0`); `App.tsx` already passes the version. Commit: `e6c3201a0d3d93a540599ec21d2cab2eaca19458`. The safety archive dated 2026-11-14 was not modified. CI and manual device checks are still required before calling the hosted build verified.


## 2026-11-19 — user-requested gizmo and interaction development checkpoint

Implemented source changes on the self-hosted painter:
- Box and Sphere orientation gizmos are now generated from built-in Three.js geometry in application code; they no longer require the external Box/Sphere GLB files. Their materials are replaced with axis-coloured, non-image materials. Box faces use solid axis colours; Sphere uses vertex-colour blending across axes.
- Mountain now has a built-in procedural fallback and a Mountain-only axis-colour influence slider. A user can select a replacement binary GLB; the model is loaded with GLTFLoader and its image materials are discarded/replaced by position-derived vertex colours. The selected GLB is stored in IndexedDB under the browser's local origin, not localStorage, to avoid its small quota. It remains on that browser/device and is not automatically synced to another device or included in exported project files.
- Subdivision preview level type and controls no longer cap the level at 2. Increasing levels remains user-controlled; memory and processing costs grow rapidly with each level.
- UV panel tab order now places Sculpt before Mirror, with updated tooltips.
- Wood Grain now generates opaque output even when the selected layer is initially transparent/empty, so the user does not need to pre-paint the layer.
- The Layer Filter dialog header supports mouse dragging and a double-tap touch drag gesture.

Source commits: 2fcff5500d6a8b589eed22ab1189fd4c4bde976c, 8637d1779a72f1e2a11b8dfd5b980c2be265ba36, 70217e62400998cfe578e9518288eb4e57fad58b, 576f0e91e3c4e48b2e6626063064b9844c2927ec, 5ed97845f1622b190ab6a46c5c41fb9e690f9a6e, and d249c4ba751bf41d7beeeda7024b8c48a43cddf7.

Remaining work in this request: Wood Grain still needs true object-space sampling derived from mesh positions/normals (not the current UV/image-space grain calculation); touch-drag support must be applied consistently to the other floating filter windows, not only Layer Filter; review and refine the full 2D UV tool information architecture beyond the initial tab-order adjustment. Confirm whether the built-in Mountain fallback's silhouette meets the intended design after visual testing. Build/CI and browser/device interaction tests have not yet been run for this checkpoint. Do not mark these remaining items complete based on source edits alone. The 2026-11-14 safety archive remains protected and unchanged.


## 2026-11-19 — follow-up implementation and verified self-host package

Follow-up changes completed after the initial checkpoint:
- Wood Grain now rasterizes the selected mesh's local-space position into the active UV target, then evaluates grain from those interpolated object coordinates. UV coordinates are used only as the destination address for writing the texture; grain direction and flow are derived from mesh position, so rotating/repacking UV islands does not rotate or stretch the grain pattern. The selected active UV channel is used to map the output to the current texture layout. The generated layer remains opaque even when the source layer was empty.
- Double-tap touch dragging has been added to the Layer Filter, Edge Wear, Gaussian Blur, Stochastic Scatter, Triplanar, Pattern Stamp, and Bump Levels windows. Mouse dragging remains available. On touch, the first tap arms the gesture and the second tap starts the drag on the title/header.
- Corrected BoxGeometry material ordering so +X/-X are red shades, +Y/-Y green shades, and +Z/-Z blue shades.

The complete source revision for this checkpoint is `e592e9e98d7199443b9131d843a0e422c2d8c3d0`. GitHub Actions run #136 (`44462561950`) passed every step: dependency installation, Vite production build, self-host sync, blank-package validation, generated-output commit, ZIP packaging, and artifact upload. Artifact `14500731368` (`VUE_3D_Canvas_SelfHost`, 1,065,779 bytes; SHA-256 `82940c38c45c0abab968104f218ddb60bea104e93b22f84248ee249c2c935854`) is available until 2027-02-17. Run URL: https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44462561950

This is compile/package verification, not manual visual or touch-device validation. Please manually test Box face direction colours, Sphere blending, the Mountain fallback and uploaded GLB with image maps stripped, Mountain influence slider, IndexedDB persistence after reload, wood grain on an empty layer and across UV seams, high subdivision levels on representative meshes, and double-tap dragging on touch. Browser storage is local to the current browser/device and may be cleared by site-data cleanup; it is not a cross-device asset sync mechanism. The protected 2026-11-14 safety archive remains unchanged.
