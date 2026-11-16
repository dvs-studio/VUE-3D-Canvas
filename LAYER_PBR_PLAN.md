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
6. Subdivision preview dock. It never writes the mesh.
7. Remove the node editor. Put a UV dock in its place that only says Coming soon. Keep Import Texture and point it at the switches.
8. On export, bake each layer and write the `.xblend` zip. Extend `src/nodes/blender_28_importer.py` so Blender rebuilds one mix chain per channel.
9. `npm run host:sync`. Update the PIN at the top of `AGENTS.md`, `AGENT_STATE.md`, and `SELF_HOST_HANDOFF.md`. Move the oldest of the three done slots under `STOP`. Do not delete it. Append a short note under `STOP` only. Also append `agents/<your-name>.md`.

Do not start a native DirectX or OpenGL window in this task. Do not edit `crates/vue3d_core`. When Victory has accepted this self-host page and gives the go-ahead, the Windows package is compiled around this same page. That compile is not this task. A real DirectX 11 or OpenGL device is later still.

While you build, push the painter about every 3.5 minutes. Do not push an empty commit. Do not put a guide rewrite in the same commit as code. Do not edit `README.md`, `DEVELOPMENT.md`, `API_DOCUMENTATION.md`, `HANDOFF_PROMPT.md`, or the Windows guides until this page is verified. Commit `f3b43f6` did that and skipped the build. Do not repeat it.

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

Do not delete `src/nodes/blender_28_importer.py`. Extend it in this task. The export section says how. Do not put the node editor back on the page.

Old `.xblend` files may still contain `nodeGraph`. Loading one must not crash. Ignore the graph. Missing switch fields mean the defaults in "What a layer is".

## Export and Blender

This is part of the same task, not a later one. The painter's node panel stays gone. The Blender file is the only node tree.

When the user exports a project, write a zip. Prefer the existing bundle action if one exists. Inside it:

- The `.xblend` JSON, still with only the last 3 undo states, still linking the mesh by default.
- One baked image per layer per job that layer actually does. A fill layer is rasterized on its UV channel before the bake. The user does not export maps one by one.
- A manifest, next to the JSON, listing for every layer: id, name, order, visible, opacity, blend mode, UV channel, the three switches, both influences, the bump ramp, `normalLock`, and the file names of the baked images.

File names are `<project>__<layerId>__color.png`, `__emission.png`, `__height.png`, `__reflection.png`, `__normal.png`. Skip a file the layer does not contribute. Colour and emission are sRGB. Height, reflection, and normal are non-colour. Reflection is stored as the strength grayscale, not as roughness. The importer turns it into roughness with `1 - strength`.

The manifest fields to add, if the current schema has no place for them, sit on each layer object:

- `colorOn`, `colorInfluence`, `reflectionOn`, `reflectionInfluence`
- `emissionOn`, `emissionInfluence`
- `bumpOn`, `bumpInfluence`, `bumpRamp` as `{ position, height }[]`
- `normalLock`
- `maps`: `{ color?, emission?, height?, reflection?, normal? }` paths inside the zip

An old file without these fields still opens. Do not require `nodeGraph`.

`src/nodes/blender_28_importer.py` loads that zip and builds one material. It does not make one Principled shader per layer, and it does not mix whole shaders. Mix Shader is the wrong node for this.

For each channel, a chain of Mix nodes in layer order, bottom to top:

| Channel | Inputs | How a layer joins | Into Principled |
|---|---|---|---|
| Base Color | the layer colour image | The layer's blend mode. Normal means Mix. Multiply, Screen, Overlay, and the other modes already in the app map to the matching Mix blend. Factor is opacity times colour influence, and 0 if the switch is off or the layer is hidden. | Base Color |
| Roughness | the reflection image, as `1 - strength` | Not a colour blend. Multiply the strength by reflection influence, then invert. Hidden or off contributes nothing (roughness stays 1 under that layer). | Roughness |
| Emission | the emission image | Add, multiplied by emission influence. Colour and strength stay the image and the factor. Do not run this through the albedo mix. | Emission |
| Height | the height image after that layer's ramp | Add, multiplied by bump influence. | Used to build the normal. Also into Displacement if that output exists. |
| Normal | one image | If any visible layer has `normalLock`, that image is the normal and the height chain is not converted. Otherwise one Normal Map node reads a normal baked from the combined height. Do not mix several tangent-space colours together as if they were paint. | Normal |

Document a blend mode you cannot match in a comment at the top of the generated node group. Do not silently treat it as Mix. Alpha is the Mix factor, not a discarded channel.

If Blender is not installed where you build, do not claim the material was opened. Check that the zip contains the images and the manifest, and that the script's node names match the table. Say that limit in the note.

The web node panel is still removed. `Viewport2D` stays. The UV dock still says Coming soon.

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

## Subdivision preview

Add a dock named **Subdivision**. Window menu label: `Subdivision Preview`. It behaves like Blender's Subdivision Surface modifier, and it is only a preview. It must never write the cage.

The cage is the mesh already in the session: the OBJ, the preset, the positions, the UVs, and `origFileNormal`. Paint, Smooth, Flat, Def, unwrap, UV drag, and OBJ export all keep using that cage. Turning the preview on, moving its sliders, or closing the file must not replace those positions. Do not store subdivided vertices in the `.xblend`. The six slider values may be saved with the project. The mesh block stays the cage.

Blender's modifier has two level counts, viewport and render. This dock has one, because nothing is applied at export. Blender's types are Catmull-Clark and Simple. Use those two and no others. Blender keeps an edge sharp with a crease weight from 0 to 1: 0 lets the surface pull the edge, 1 leaves the edge on the cage. This model has no per-edge crease painting, so the dock decides which cage edges are creased from the angle between the two faces.

The dock controls, top to bottom:

| Control | Range | Default | What it does |
|---|---|---|---|
| On | checkbox | off | Off shows the cage. On shows the preview in the 3D view only. |
| Type | Catmull-Clark or Simple | Catmull-Clark | Catmull-Clark rounds the cage. Simple only cuts each face into smaller faces and leaves the cage vertices where they are. |
| Levels | integer 0–2 | 1 | How many times to subdivide the preview. 0 is the same as Off. Two is the maximum. A cage over 40,000 faces is forced to level 1 and the dock says so. |
| Sharp above | 0–180 degrees | 60 | A cage edge whose faces meet at this angle or steeper is a sharp edge. Flatter edges are smooth. |
| Crease | 0–1 | 1 | How hard those sharp edges resist rounding. 0 ignores the angle. 1 keeps a sharp edge on the original cage edge, which is Blender's crease of 1. |
| Keep boundary | checkbox | on | An open edge, and a corner where two open edges meet, stays on the cage. This is Blender's boundary smooth set to keep corners. |
| Displacement | 0–1 | 1 | How much of the combined bump image moves the preview. 0 subdivides the shape and ignores height. |

A line at the bottom of the dock reads: `Preview only. The saved mesh is not changed.`

Catmull-Clark, one level, on the cage:

1. Face point: average of that face's vertices.
2. Edge point: average of the two edge vertices and the face points of the faces that share the edge. If the edge is sharp, blend from that smooth point toward the edge midpoint by the crease weight. Crease 1 means the edge point is the midpoint.
3. A smooth interior vertex moves to `(F + 2R + (n - 3)P) / n`. `F` is the average of the neighbouring face points, `R` the average of the neighbouring edge midpoints, `P` the old vertex, `n` how many edges meet there. A vertex with two sharp edges moves to the average of itself and those two edge midpoints. A vertex with more than two sharp edges stays put. A boundary vertex stays put when Keep boundary is on.
4. Each old face becomes one quad per corner: vertex point, the two edge points, the face point.
5. UVs use the same weights as positions. Do not average UVs across a seam. If the two sides of an edge disagree in UV, the edge point is split, one UV for each side.
6. Repeat until Levels is reached.

Simple does not run steps 1–3. It only inserts midpoints and builds the quads, then the same UV seam rule.

Displacement runs after the last level, and only if the slider is above 0. Sample the combined height image at the preview vertex's UV. Move the vertex along its preview normal by `height * displacement * 0.05`. Height 1 and displacement 1 move the surface 0.05 in cage units, not farther. The normal used for that move is split across a sharp edge, so the two faces do not share a vertex normal and the corner stays crisp. The height image is the one the bump switches already combine. This dock does not build a second height. While the pen is down, do not rebuild the preview. Resample height on pointer-up, and when a bump slider or the ramp changes.

Shading of the preview follows the same sharp edges. Smooth on the cage does not round a preview edge that the angle marked sharp.

Put the builder in `src/renderer/subdivisionPreview.ts`. It takes the cage `BufferGeometry` and the seven controls and returns a new `BufferGeometry`. `src/renderer/Viewport3D.tsx` keeps the cage in a ref. When the preview is on, the mesh draws the preview geometry. When it is off, the mesh draws the cage again. Dispose the old preview when a new one is built. Do not call the builder from the animation loop. Do not assign the preview back into the React geometry or into the OBJ text.

The panel is `src/ui/panels/SubdivisionPanel.tsx`, listed in the Window menu beside Viewport Navigator. It uses the same dock colours as Layers. It must not sit on top of the WebGL view as a full-screen layer.

## Do not

- Do not edit `crates/vue3d_core`.
- Do not add a server as the way the page opens. `file://` and `node self-host/server.js` both stay.
- Do not bring back the refresh-rate buttons on the web build.
- Do not depend on D3D12 or ray tracing.
- Do not put a full-screen black layer behind a dialog.
- Do not delete `release/vue3d-self-host-safety-2026-11-14.zip`.
- Do not remove Import Texture or Auto-Texture from Folder.
- Do not build the full-screen UV desk. The dock says Coming soon.
- Do not write subdivided vertices into the mesh, the OBJ export, or the `.xblend`.
- Do not edit the guides outside `AGENTS.md`, `AGENT_STATE.md`, `SELF_HOST_HANDOFF.md`, this file, and `agents/<your-name>.md` until the page is verified.

## Done when

`npm run host:sync` has inlined a new bundle. Opening Layer Properties shows the three switches and the ramp. Two painted layers with bump on move the combined height, not two normal colours. Emission from two layers adds. A Normal conversion is the only normal. Triplanar shows a preview and accepts rgba, hsla, and hex with a separate alpha. Switching theme recolours the dialogs, not only the bar. Sphere and mountain are each one shape. Edit says Undo, then Redo, then Undo & Redo Settings, and the footer no longer mentions a ring. Import Texture still opens, with no node checkbox, and a fill image still makes a material-fill layer. The node panel is gone. The dock that replaced it says Coming soon. Subdivision Preview can be turned on without changing the exported mesh. A project zip contains the baked images and the manifest, and an old `.xblend` without the new fields still opens. The Blender script builds one mix chain per channel into one Principled shader. If Blender was not run, the note says so. `public/background.jpg` is beside the self-host `index.html` after sync.
