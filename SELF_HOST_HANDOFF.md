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

Victory, 2026-11-10: unwrap and Smooth are good. Gaussian and Stitch are good. Triplanar, Scatter, and Edge Wear break the app. The view is also a bit laggy.

Cause of the crash: `TriplanarDialog.tsx` still does `if (!isOpen) return null` and then calls `useState` for the window position. React throws as soon as the dialog opens, which takes the whole painter down. Gaussian and Stitch do not do this.

`EdgeWearDialog.tsx` was moved in the working tree so the early return is after the hooks. That edit is not on `main` yet.

`StochasticScatterDialog.tsx` had the same bug. The early return was deleted so the hooks always run, but the dialog is then drawn even when it is closed. Put `if (!isOpen) return null` back, after the last hook and before the JSX.

The lag is from `Viewport3D.tsx`. The loop draws the bloom pass on every animation frame, including when nothing changed. That was done so filters would show. It should draw when the user is orbiting, painting, or a texture just changed, and not faster than 60. Do not put the refresh-rate buttons back.

## This session does

1. Move Triplanar's early return to after every hook.
2. Put Scatter's early return back after every hook.
3. Keep Edge Wear's early return after every hook.
4. Stop idle redraws. Cap active redraws at 60. Set `needsRenderRef` when `textureVersion` changes so a filter still appears.

## Later, do not do these until Victory asks

- Rewrite the Windows exe onto a real DirectX 11 device and an OpenGL context. The behaviour to copy is this self-host build, not a hello-world console.
- Make the node graph evaluate connections live. Bake-to-layer is enough for now.
- Bring back a frame-rate control on the web build. A cap belongs on the Windows exe later, if he wants one.
- Re-read the whole repository at the start of a session. Read this file, `AGENTS.md`, and `AGENT_STATE.md`, then the files you will edit.

## Bookend

Append a short note to `AGENTS.md` before the first code edit, and again after `npm run host:sync`. Append `API_DOCUMENTATION.md` only after the code works.
