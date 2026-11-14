# Toggle layers — task for the next agent

Read this file and do it. Finish the self-host painter. Do not open `crates/vue3d_core` in this task.

Victory tested the web app through commit `a1dd03d` (`index-DXhSIj8p.js`). He is slightly satisfied. The view lags for a moment at start, then feels fine, like a page that warms up. Keep that shape: first frame cheap, heavier work after. He rejected the node editor. It does not drive materials any more.

A safety copy of the self-host folder as it is before this task is `release/vue3d-self-host-safety-2026-11-14.zip`. Do not delete it. Do not overwrite it.

## Order

1. Types and the layer property panel.
2. One combined colour image, one height, one emission, one reflection. Wire those four into the existing Three.js material.
3. Layer right-click export, then the conversion commands.
4. Triplanar previews and colour mixes.
5. Themes on the whole interface. Gizmo redraw. Labels.
6. Remove the node editor. Put a UV dock in its place that only says Coming soon. Keep Import Texture and point it at the switches.
7. `npm run host:sync`. Append the post-note to `AGENTS.md`, `AGENT_STATE.md`, and `SELF_HOST_HANDOFF.md`.

Do not start a native DirectX or OpenGL window in this task. When Victory says the self-host page is perfected, put this same page into the Windows package and compile `vue_3d_canvas.exe`. That package hosts the page. It does not grow a second painter. A real DirectX 11 or OpenGL device is a later project, after that package is the finished page.

## What a layer is

Keep the material fill layer (`layer.isTextureFill` and `textureFillConfig` in `src/core/types.ts`). It stays a procedural fill.

Every other layer stops being “a colour layer” or “a height layer” (`layer.channel`). It becomes a toggle layer. The pixels stay in `layer.canvas`. Three switches decide what those pixels contribute. Each switch has its own checkbox and its own influence slider from 0 to 1.

| Switch | What the pixels mean | Combined with the other layers |
|---|---|---|
| Colour and reflection | Albedo. A second slider on this same switch is reflection strength. | Colour stacks top to bottom with the existing blend modes. Reflection is one grayscale image: for each pixel, the maximum reflection strength of the visible layers that have this switch on. |
| Bloom and emission | Glow colour. | Add the RGB of every enabled layer, multiplied by that layer’s influence. Clamp at 1. Bloom is the one viewport bloom pass already in `Viewport3D.tsx`. It reads this combined image. There is no per-layer bloom. |
| Bump and displacement | Height, after a colour ramp. | Add every enabled layer’s ramped height times its influence. Clamp at 1. |

Normal colour is the exception. Do not add tangent-space normal colours from several layers. The view builds one normal from the combined height (the Sobel already in `src/tools/layerConversions.ts`). A layer that has been converted to Normal is the only normal source, and the height-built normal is not used while that layer is visible.

Put the switches on `LayerPBRSettings` in `src/core/types.ts`. Suggested fields:

- `colorOn`, `colorInfluence` (default on, 1, so a new layer still paints)
- `reflectionOn`, `reflectionInfluence` (default off, 0)
- `emissionOn`, `emissionInfluence` (default off, 0)
- `bumpOn`, `bumpInfluence` (default off, 0)
- `bumpRamp`: at least two stops `{ position: number, height: number }`. Position is 0 to 1 along the layer’s luminance. Height is 0 to 1. Default stops are `{0, 0}` and `{1, 1}`.
- `normalLock`: true only after Convert to Normal.

The property button in `src/ui/panels/LayersPanel.tsx` already opens `src/ui/LayerSettingsModal.tsx`. Replace the node wording in that modal with the three switches, the reflection slider, and the ramp. Keep the UV channel menu. Delete the “open node editor” button from this modal.

The ramp is a row of stops, as in Blender’s Colour Ramp. Click the bar to add a stop. Drag a stop. Delete a stop with a small button. Two stops minimum. The bar shows a greyscale of the heights. This ramp is only on the bump switch.

When any slider, check, or ramp stop changes, rebuild the combined maps and mark the 3D texture dirty. While the user is painting, update the colour composite on the dab (the current fast path in `Viewport3D.tsx`). Rebuild height, emission, and reflection once on pointer-up, not on every dab.

## How the four images reach the material

Stay on `MeshStandardMaterial` in `src/renderer/Viewport3D.tsx`. No new shader. No ray tracing. Nothing that needs WebGL 2 features the current painter does not already use.

- Colour composite → `material.map` (already the composite canvas).
- Combined emission → `material.emissiveMap`. Set emissive to white and `emissiveIntensity` from the strongest emission influence, or leave intensity at 1 and let the image carry the strength.
- Combined height → one Sobel normal → `material.normalMap`, unless a visible layer has `normalLock`.
- Combined reflection → roughness. For each pixel, `roughness = 1 - reflection`. That is the reflection control on this material without a second lighting model. Metalness stays 0 unless the layer already had a metal value; do not invent a metal workflow.

Displacement is the height image. The WebGL view may also set a small `displacementScale` from the average bump influence, capped so the silhouette does not explode. The exported displacement file is the height image, not a re-author of the mesh.

## Reflection image

Victory will replace the studio image later. Until then, generate a neutral equirectangular JPEG, at most 1024 by 512, soft grey studio, no people, no text. Save it as `public/background.jpg` in the Vite public folder.

`scripts/sync_self_host.mjs` deletes `self-host/public` and copies `dist/`. A file placed only in `self-host/public` is destroyed on the next sync. Vite copies `public/` into `dist/`, so `public/background.jpg` lands beside `self-host/public/index.html` after `npm run host:sync`.

Use it like this:

- First frame: studio lights and the colour map only. Do not build a PMREM and do not enable bloom on that frame.
- After the first frame, if the browser can make a PMREM from `background.jpg` without a long stall, assign it to `scene.environment` and the material `envMap`. If that compile is slow, skip it and keep the lights. The reflection slider still changes roughness either way.
- Also set `scene.background` from that image only when the user has reflection turned on for at least one visible layer. Otherwise keep the flat `#242424` background.
- The same JPEG is what a later DirectX 11 or OpenGL 2 view is allowed to sample. Do not require cubemap filtering, HDR, or image-based ray tracing.

## Right-click export

In the layer context menu in `src/ui/panels/LayersPanel.tsx`, add three items beside the existing convert items:

- Export displacement — this layer’s ramped height only, one PNG.
- Export emission — this layer’s RGB times its emission influence, one PNG.
- Export colour and reflection — the layer albedo PNG, plus a second grayscale PNG of its reflection strength.

Export is allowed even when that switch is off. The file then shows a black image, which is the honest result. Do not export the other layers mixed in.

## Conversion

Keep Convert to Bump, Convert to Normal, Convert to Alpha Clip, and Convert to Emissive in that same menu. Add Convert to Displacement and Convert to Reflection. The code is `src/tools/layerConversions.ts`, called from `src/App.tsx`.

Each conversion rebuilds that layer’s canvas with the algorithm already used for that map, then forces the switches:

| Command | Canvas | Switches left on | Everything else |
|---|---|---|---|
| Convert to Bump (the “rising” command) | Keep the painted colour. Do not wipe albedo. | Colour at influence 1, bump at influence 1, ramp reset to black-to-white. | Emission off, reflection off, `normalLock` false. |
| Convert to Displacement | Greyscale the current pixels into the height image (existing bump path). | Bump at influence 1, ramp black-to-white. | Colour, emission, reflection off. `normalLock` false. |
| Convert to Normal | Existing Sobel RGB normal. | `normalLock` true. Influence of that normal is full. | Colour, bump, emission, reflection off. |
| Convert to Emissive | Keep the painted RGB as the glow. | Emission at influence 1. | Colour, bump, reflection off. `normalLock` false. |
| Convert to Reflection | Greyscale the current pixels into a strength mask. | Reflection at influence 1. | Colour, bump, emission off. `normalLock` false. |
| Convert to Alpha Clip | Existing clip. | Leave colour on so the clip still has something to show. | Bump, emission, reflection off. |

Material fill layers still have to be baked to pixels before bump or normal conversion. Keep the Bake to Layer button for a fill. That bake is “rasterize the fill”, not “evaluate a node graph”.

## Triplanar

File: `src/ui/TriplanarDialog.tsx`. Engine: `src/tools/fillSuite.ts`.

Each texture row shows a preview, about 48 pixels, of the image the user picked. No image means an empty checker, not a broken icon.

If the row has no image, it is a colour mix. The user types one of:

- `rgba(r, g, b, a)` with r, g, b from 0 to 255 and a from 0 to 1
- `hsla(h, s%, l%, a)` with a from 0 to 1
- `#RGB`, `#RRGGBB`, or `#RRGGBBAA`

Alpha is never part of the colour. In `#RRGGBBAA` the last byte is alpha. In `rgba` and `hsla` the last number is alpha. A missing alpha means 1. The mix uses that alpha as the layer’s share. A picked image ignores the colour fields. No image uses the colour. Do not sample a missing image as black.

## Themes

Four themes already exist in `src/index.css`: `cs5`, `bw78`, `modern`, `ps2022`. They set `--cs5-bg`, `--cs5-panel`, `--cs5-panel-dark`, `--cs5-panel-light`, `--cs5-border`, `--cs5-text`, `--cs5-text-bright`, `--cs5-accent`. Most panels still use literal hex such as `bg-[#333333]`, and the override list only covers some of those classes, and mostly for `bw78`.

Make the theme cover the whole window: menu bar, options bar, toolbox, layers, dialogs, lagoon, preferences, viewport chrome, gizmo badge, and the status bar. Prefer the CSS variables on those surfaces. Where a literal hex remains, add it to the override list for all four themes, not only `bw78`. Do not leave the title bar on the theme and the dialogs on CS5 grey.

## Gizmos

File: `src/renderer/boxGizmo.tsx`. The box stays. The sphere and the mountain do not. Their six faces read as loose cards.

- Sphere: one ball. A radial gradient is enough. The six view names sit on that ball, not on separate flying panels. The same six buttons still call `onSnapView`.
- Mountain: one peak silhouette. The six names sit on that silhouette. No orbiting cards.

Hit targets stay: front, back, left, right, top, bottom.

## Edit menu

In `src/ui/PhotoshopMenuBar.tsx` the Edit menu undo block is three items, in this order, and nothing else about history:

1. `Undo` with `Ctrl+Z`. The label is the word Undo. Delete the suffix `(3-State Ring)`.
2. `Redo` with `Ctrl+Y`.
3. `Undo & Redo Settings...`

Preferences may stay under those three. It is not an undo command.

Delete the footer line in `src/App.tsx` that reads `UNDO: NORMALIZED (3 STATES SAVED TO .XBLEND)`. Do not replace it with another history sentence. Delete the Window menu entry `Undo History Ring Buffer`. Undo, Redo, and the settings dialog are the only undo controls. Session undo stays 30. The file still stores 3. That fact lives in the settings dialog, not on the menu label.

## Labels

- Gizmo badge says `DX11/WASM`. On this self-host page change it to `WebGL`. Do not print DirectX until a later build actually creates that device.
- `LayerSettingsModal` title becomes `Layer Properties`.
- Menu names, so the long ones read as tools: `Stochastic Layer Scattering...` becomes `Scatter...`, `Jenny Stitch Studio (Path Stitches)...` becomes `Stitch...`, `Triplanar Box Filter & Masking...` becomes `Triplanar Mix...`. Leave the engine file names alone.
- Import Texture strings are in the next section. Do not call it an auto-node in the interface.

## Import Texture

Keep this. It is not the node editor. The menu action is **Import Texture...** in the layers panel. The modal file may stay `src/ui/TextureAutoNodeModal.tsx`. The title the user sees is `Import Texture`. Delete the checkbox `createNodeSetup` and every sentence that says the image will be wired into a node graph.

The preview, zoom, and pan already in that modal stay. The role list stays, and each role only sets the new switches on the new layer:

| Role in the modal | Layer | Switches |
|---|---|---|
| Material Texture Fill | `isTextureFill` true, `textureFillConfig` kept (triplanar or box, scale, repeat, rotation, randomise) | Colour on at 1. Bump, emission, reflection off. |
| Colour / Albedo | Painted layer, image copied into `layer.canvas` | Colour on at 1. Others off. |
| Displacement / Height | Painted layer | Bump on at 1, ramp black-to-white. Colour, emission, reflection off. |
| Emission | Painted layer | Emission on at 1. Others off. |
| Reflection | Painted layer. The old Roughness role is this same choice. | Reflection on at 1. Others off. |
| Normal Map | Painted layer | `normalLock` true. Colour, bump, emission, reflection off. |

After import, Layer Properties can turn the other switches on. A photo may be colour and bump together. Do not ask the user to import it twice.

The companion-folder button in `src/ui/ProjectSettingsModal.tsx` (`Auto-Texture Model & Replace Layers`) also stays. Point its existing filename tokens at the same switches: diffuse words → colour, bump and height words → bump, emission words → emission, roughness and specular words → reflection, normal words → `normalLock`. It must not create nodes.

Rename the visible button to `Auto-Texture from Folder`. The behaviour above is the behaviour. Do not drop the feature.

## Node editor and the UV dock

Remove the node editor from the page. Take `Node Graph` out of the panel list in `src/ui/PhotoshopMenuBar.tsx` and stop mounting `src/ui/panels/NodeGraphPanel.tsx` in `src/App.tsx`. Do not keep a hidden panel that still builds a graph.

Put a dock in that same slot. Title: `UV Editor`. The body is one line: `Coming soon.` Under it, one sentence: `A full-screen UV desk for this mesh. Not in this build.` No fake tools, no disabled buttons that look broken.

`src/renderer/Viewport2D.tsx` stays. It is the UV view that exists today (double-click island, right-click split, drag). Do not remove it while the dock says Coming soon.

Later, and not in this task: that dock becomes a floating UV application. It can fill the screen. It still reads and writes the open mesh (positions and UVs), and it uses the same undo stack. Tools for that later build are island select, split a mirrored pair, move, pack, unwrap with the angle limit, pin, and sew. Write nothing for those tools now except the Coming soon line.

Do not delete `src/nodes/blender_28_importer.py`. It runs inside Blender, not in this page. Do not write the Blender add-on in this task. Old `.xblend` files may still contain `nodeGraph`. Loading one must not crash. Ignore the graph.

## Painting feel

Do not undo the fast dab path. A stroke writes the active layer and blits the colour composite. Mipmaps rebuild once on pointer-up. The view sleeps when idle. Zoom and resize already mark a frame; do not remove that.

The opening stall is the bloom pass and the texture upload on the first frames. Draw the lit mesh once before creating `UnrealBloomPass`. Create the bloom pass on the following frame. Same rule for the environment image.

Session undo stays 30 (`src/core/history.ts`). The `.xblend` file still stores 3. New switch fields must round-trip in that file (`XBLEND_FORMAT_SPECIFICATION.md`). The settings dialog may say that. The menu must not.

The lagoon Undo item stays the word Undo. The settings dialog title is `Undo & Redo`. Delete the words "ring buffer" from anything the user can see.

## Also while those files are open

- A layer created by Import Texture is selected and visible, so the user sees it on the model without hunting the stack.
- A huge image is drawn into the 1024 canvas after the modal closes, not before the modal has painted its preview.
- Companion-folder auto-texture still makes one layer per matched file. It does not collapse them into one node.
- The Coming soon UV dock must not capture the pointer over the 3D view. It is a dock panel, same as Layers.

## Do not

- Do not edit `crates/vue3d_core`.
- Do not add a server as the way the page opens. `file://` and `node self-host/server.js` both stay.
- Do not bring back the refresh-rate buttons on the web build.
- Do not depend on D3D12 or ray tracing.
- Do not put a full-screen black layer behind a dialog.
- Do not delete `release/vue3d-self-host-safety-2026-11-14.zip`.
- Do not remove Import Texture or Auto-Texture from Folder.
- Do not build the full-screen UV desk. The dock says Coming soon.

## Done when

`npm run host:sync` has inlined a new bundle. Opening Layer Properties shows the three switches and the ramp. Two painted layers with bump on move the combined height, not two normal colours. Emission from two layers adds. A Normal conversion is the only normal. Triplanar shows a preview and accepts rgba, hsla, and hex with a separate alpha. Switching theme recolours the dialogs, not only the bar. Sphere and mountain are each one shape. Edit says Undo, then Redo, then Undo & Redo Settings, and the footer no longer mentions a ring. Import Texture still opens, with no node checkbox, and a fill image still makes a material-fill layer. The node panel is gone. The dock that replaced it says Coming soon. `public/background.jpg` is beside the self-host `index.html` after sync.
