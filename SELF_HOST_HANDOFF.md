# Self-host handover

## PIN — read only this far

Stop at `STOP`.

### To do

Build [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md). Not started. Keep `release/vue3d-self-host-safety-2026-11-14.zip`.

### Current implementation

None. `index-DXhSIj8p.js`. `f3b43f6` did not change the painter.

### Done — three slots

1. Zoom redraws and the canvas follows the window — done.
2. Triplanar, Scatter, and Edge Wear no longer cover the view — done.
3. Those three dialogs open, and the view sleeps while idle — done.

When you finish a slice, mark it done in slot 1 here and in `AGENTS.md`. Move the old third slot under `STOP`.

## STOP

Read past this line only if absolutely necessary.

Read this file first. The product to finish is the self-hosted painter. Do not start the Windows DirectX rewrite until Victory says this folder is accepted.

## Next task

Do [`LAYER_PBR_PLAN.md`](LAYER_PBR_PLAN.md). The node editor is rejected. Painted layers become three switches with influence sliders. Material fill stays. Victory is slightly satisfied with the current page: it lags at the first moment, then settles. The safety copy of this folder before that work is `release/vue3d-self-host-safety-2026-11-14.zip`. Do not delete it.

On 2026-11-15 the other guides were aligned with this file. `file://` is allowed. Older sentences that forbid it, restore a refresh-rate control, or call for a 1-step undo are retired. The task above is the one to build.

## What to run

- Folder: `self-host/`
- Open `self-host/public/index.html` with `file://`, or `node server.js` / `npm run host` for `http://`
- Rebuild with `npm run host:sync`. That inlines the script and CSS so both `file://` and `http://` work.
- GitHub: Actions → **Build Self-Hosted Programme** (`workflow_dispatch` only). Victory clicks Run himself.
- Do not edit `crates/vue3d_core`. Do not add Python, native C, or a server just to show the UI.

## What already works

- Free tumble. No pitch lock. `src/renderer/freeCamera.ts`.
- Imported OBJ keeps file normals. Smooth blends every shared edge. Flat stays faceted. Def restores the file normals.
- Smart unwrap splits a closed mesh by the angle limit, packs islands into 0..1, and clones a vertex that would sit in two charts.
- Double-click selects a UV island. Right-click keeps the side of U = 0.5 under the cursor. Sculpt → Drag Island moves it.
- Layer Settings has a UV channel per layer. Node **Bake to Layer** replaces that layer's pixels.
- Gaussian Blur and Stitch open and apply. Their drag hooks are declared before `if (!isOpen) return null`.
- Session undo is 30. A `.xblend` file still stores 3.

## What is broken right now

Nothing from the zoom and resize report is still open in `index-DXhSIj8p.js`. Confirm on the tablet: zoom without panning, then rotate from portrait to landscape without reloading.

## Landed 2026-11-14 (`index-DXhSIj8p.js`)

- The main view redraws on wheel, pinch, and gizmo zoom. It still sleeps when idle.
- The canvas follows the container. A rotation should not leave a dead strip.
- Strokes skip mipmaps until the pen lifts. The buffer is capped so a GTX 1650 is not asked to draw a 4K view.
- Push about every 4 minutes while there are uncommitted changes. No empty commits.

## This session does

Done. See the landed list above.



## Landed 2026-11-14 (`index-D2VONoEr.js`)

- Triplanar, Scatter, and Edge Wear are a single fixed panel. They do not cover the 3D view with a full-screen layer, and they do not use `translate3d`.
- Edge Wear applies once. Scatter waits 50ms before the first preview. A lost WebGL context is asked to restore instead of staying black.
- Gaussian and Stitch are unchanged.
- The Windows exe only shows this page. Do not reimplement these filters in Rust.

## This session does

Done. See the landed list above. Push cadence while this work was open: about every 4 minutes, only when the tree has changes.



## Landed 2026-11-12 (`index-DwCqaqSC.js`)

- Triplanar, Scatter, and Edge Wear declare every hook before `if (!isOpen) return null`. Opening them no longer throws the React hook error that took the painter down.
- Scatter still hides when closed. Repeats are capped at 300 so a typed value cannot lock the tab.
- The 3D view draws while orbiting, painting, or after a texture change, and not faster than 60. It does not draw the bloom pass while idle. The refresh buttons stay removed.
- Pre-edit bookend is `ab1a766`. `crates/vue3d_core` was not edited.

## This session does

Done. See the landed list above.

## Later, do not do these until Victory asks

- Rewrite the Windows exe onto a real DirectX 11 device and an OpenGL context. The behaviour to copy is this self-host build, not a hello-world console.
- Make the node graph evaluate connections live. Bake-to-layer is enough for now.
- Bring back a frame-rate control on the web build. A cap belongs on the Windows exe later, if he wants one.
- Re-read the whole repository at the start of a session. Read this file, `AGENTS.md`, and `AGENT_STATE.md`, then the files you will edit.

## Bookend

Append a short note to `AGENTS.md` before the first code edit, and again after `npm run host:sync`. Append `API_DOCUMENTATION.md` only after the code works.


## Correction — 2026-11-14 evening

`LAYER_PBR_PLAN.md` now says: Edit shows Undo, then Redo, then Undo & Redo Settings. The node dock is removed and a UV dock says Coming soon. Import Texture stays and feeds the switches. Do not build the full-screen UV desk yet. Windows compile waits until Victory accepts this self-host page.


## Subdivision preview

`LAYER_PBR_PLAN.md` adds a Subdivision dock. Preview only. It follows sharp edges by angle and the combined bump. It never replaces the cage.


## Next task — 2026-11-16

`f3b43f6` rewrote guides and did not build `LAYER_PBR_PLAN.md`. Ignore that commit as a product change. The page is still `index-DXhSIj8p.js`.

Build the plan, including the `.xblend` zip and the Blender mix chains. The line below that says to make the node graph evaluate live is retired. The node panel is removed. Import Texture stays.

Until that page is verified, append notes only here, in `AGENTS.md`, in `AGENT_STATE.md`, and in `agents/<your-name>.md`. Push code every 3.5 minutes, not in the same commit as a guide rewrite. Do not edit `crates/vue3d_core`. Windows waits until Victory accepts this page and says to compile.
