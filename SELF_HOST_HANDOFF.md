# Self-host handover

Read this file first. The product to finish is the self-hosted painter. Do not start the Windows DirectX rewrite until Victory says this folder is accepted.

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

Victory, after `f2c9496`: painting is smoother, and unwrap and Smooth stay good. Triplanar, Scatter, and Edge Wear still turn the **self-host** screen black (`file://` and `node server.js`). Gaussian and Stitch do not.

The same three dialogs do open when the source is served by `vite` (the Grok preview on 2026-11-12). That is not the package he ships. Test `self-host/public/index.html` after `npm run host:sync`, not the dev server.

The Rust exe does not contain these filters. It only shows this page. Fix them here.

## This session does

1. This note goes to `main` before any further code change.
2. Then open the inlined production page and capture the error that the dev server hides.
3. Fix that error so the three dialogs stay on screen and Apply changes the layer. Do not add a full-screen black veil. Do not edit `crates/vue3d_core`.


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
