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
9. `npm run host:sync`. When this whole set is concluded, update the PIN: this set becomes Current history, the view set becomes History, and the filter set moves under `STOP`. Do not delete it. Checking one item does not move the pin. Also append `agents/<your-name>.md`.

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


---

# 2026-11-17 — Self-host viewport, geometry, painting performance and UV roadmap

This section supersedes earlier narrow task descriptions where they conflict with Victory's 2026-11-17 direction. The product remains the Vite/React/Three.js painter under `src/`, packaged into `self-host/public/index.html` with `npm run host:sync`. The safety ZIP and Rust workspace are protected.

## Execution order — build now

### A. Input-to-frame latency and painting hot path (highest priority)
- [ ] Instrument pointer-down, pointer-move, dab execution, layer-canvas mutation, composite sync, GPU upload, and completed viewport frame. Use rolling measurements and development-only diagnostics; do not add permanent per-dab console logging.
- [ ] Verify whether `notifyTextureUpdated` performs a full 1024×1024 composite for every pointer event. Coalesce repeated notifications to at most one composite/upload request per animation frame; preserve immediate visual feedback at the next frame.
- [ ] Separate layer pixel mutation from whole-document composite work. Track dirty rectangles from brush/eraser dabs and union them per frame; only composite the affected region when blend/group dependencies allow it. Fall back to full composite for filters, visibility, opacity, blend-mode, group, undo/redo, and other global operations.
- [ ] Keep mipmap generation deferred until stroke end. Ensure no texture allocation, full mipmap rebuild, BVH rebuild, geometry conversion, or synchronous readback occurs inside the pointer-move/dab hot path.
- [ ] Reuse scratch canvases, typed arrays, gradient/pattern caches, and GPU textures. Avoid creating temporary canvases per dab; cache stencil images and procedural brush resources with bounded lifetime.
- [ ] Check eraser specifically: `destination-out` should mutate only the active layer's dirty pixels; avoid an extra full-resolution composite per dab. Keep alpha, pressure, flow, blend mode, and undo semantics identical.
- [ ] Add a repeatable benchmark scene and record median/p95 input-to-frame latency, composite time, and GPU upload time before/after. If no reliable device timing is available, mark measurements as not captured rather than inventing values.
- [ ] Test brush, soft brush, eraser, clone, smudge, pattern stamp, symmetry, 2D painting, 3D painting, undo/redo, and tablet pressure after optimisation.

### B. Model parts and isolation
- [ ] Enumerate every imported mesh/object/mesh group with stable IDs and readable names; avoid merging distinct OBJ groups or GLB nodes in the UI inventory.
- [ ] Add per-part visibility, isolate selected, show all, and frame/view selected controls.
- [ ] Keep selected part, mesh visibility, paint hit testing, raycasting, and export visibility in agreement. Hidden parts must not receive paint or block raycasts.
- [ ] Preserve hierarchy and visibility in the session; define whether visibility persists in `.xblend` only after checking the existing schema.
- [ ] Test OBJ groups, multi-mesh GLB, nested groups, duplicate names, missing names, and a single-mesh model.

### C. Subdivision workspace — floating and dockable
- [ ] Keep the existing Catmull-Clark and Simple algorithms, sharp-angle/crease/boundary controls, and displacement preview.
- [ ] Support both docked and floating modes, including resize, close, restore, and workspace state consistency.
- [ ] Make the distinction explicit between **Preview** (transient, non-destructive) and **Apply Subdivision** (creates replacement geometry only after an explicit user action).
- [ ] Applying must be undoable, update geometry bounds/normals/UVs/material groups, preserve source asset backup for undo, and never silently alter the model merely because preview is enabled.
- [ ] Confirm level caps and memory estimates before high subdivision. Warn or refuse if projected face/vertex counts exceed safe limits.
- [ ] Validate topology, UV seams, boundary handling, sharp edges, normals, and export/import round trips. Never claim a destructive apply is implemented until undo and export have been tested.

### D. Temporary axis-coloured gizmos
- [ ] Keep the current CSS box/sphere/mountain gizmos as temporary placeholders.
- [ ] Use a consistent axis convention: X red, Y green, Z blue, including negative directions and all three visual styles. Keep all six view hit targets and the existing pan/zoom/orbit/ortho/reset/fit controls.
- [ ] Retain WebGL badge and responsive orientation tracking.
- [ ] Future asset handoff: user will provide a `gizmos/` folder with low-poly GLB samples. Add a loader with graceful CSS fallback, stable named axis groups/material slots, documented scale/origin, and no hard dependency on files that are not yet present.
- [ ] Defer the mountain's soft/faded acoustic painting appearance to the later GLB asset pass; do not approximate or bake that effect into the temporary axis palette.

### E. Painting filters and procedural fills
- [ ] Review current filter registry and avoid duplicate implementations. Add/complete powderiser, wood grain, hatching/cross-hatching, hashing/dithering, mosaic, edge wear, cavity dirt, and scatter stamps with documented parameter ranges and deterministic seeds where appropriate.
- [ ] Wood filter defaults to the currently selected filter colours. Only use an image texture when the user explicitly chooses one.
- [ ] For every triplanar instance, expose a clear image-texture source toggle: checked = use that instance's own colour values; unchecked = use the selected image texture. Keep this if/else behaviour independent per instance.
- [ ] Preserve alpha, colour-space handling, UV-less projection, layer channel assignment, and non-destructive preview/apply behaviour.
- [ ] Profile filter previews on large canvases and avoid rebuilding the entire viewport for parameter changes that affect only a preview region.

### F. Verification and packaging
- [ ] Run TypeScript/lint and production build; run `npm run host:sync`.
- [ ] Confirm the generated `self-host/public/index.html` has inline JS/CSS and works both through `file://` and `node self-host/server.js`.
- [ ] Run browser interaction checks for painting, erasing, model isolation, gizmo orientation, subdivision preview/apply/undo, filters, and legacy `.xblend` compatibility.
- [ ] Confirm the protected safety ZIP has not changed and no `crates/vue3d_core` files are included in the diff.
- [ ] Keep CI evidence separate from manual browser/device evidence. A green build does not prove viewport responsiveness or Blender import.

## UV project — detailed backlog, documentation only until explicit confirmation

**Status: PLANNED / NOT AUTHORISED FOR IMPLEMENTATION.** Existing UV islands, unwrap and UV-channel features must continue to work. Do not replace them or start the standalone UV workspace until Victory explicitly says to begin UV development.

### UV-1. Goals, topology and data model
- [ ] Define a UV document model independent of viewport render objects: mesh/object ID, UV channel ID, chart/island ID, face/corner references, seam edges, pinned vertices, selection sets, and per-island transforms.
- [ ] Preserve per-corner UV coordinates so hard seams can duplicate UV vertices without corrupting shared 3D positions or normals.
- [ ] Define stable identifiers across geometry rebuilds and explicit invalidation rules when topology changes.
- [ ] Support multiple UV channels per mesh and the existing per-layer active UV channel selection.
- [ ] Document linked assets, source geometry immutability, serialization/version migration, and the relationship to `.xblend`.

### UV-2. Unwrap and chart generation algorithms
- [ ] **Smart UV / angle-based charting:** seed-face angle threshold, connected-face growth, seam cuts, chart limits, deterministic results, and explicit handling of non-manifold/boundary edges.
- [ ] **LSCM:** least-squares conformal mapping, boundary constraints, numerical conditioning, degenerate triangles, and distortion reporting.
- [ ] **ABF / ABF++:** angle-based flattening, angle constraints, convergence criteria, and fallback when the solver is unstable.
- [ ] **ARAP / SLIM:** local/global optimisation, distortion energy, pinned boundary support, iteration limits, and progressive convergence.
- [ ] **Tutte / barycentric embedding:** convex boundary mapping, flip prevention assumptions, and when it is suitable as a robust fallback.
- [ ] **Harmonic / BFF-style methods:** cotangent weights, boundary conditions, positive-weight safeguards, and distortion trade-offs.
- [ ] **Analytic projections:** planar, box/cube, cylindrical, spherical, camera, and triplanar-assisted chart creation with scale/orientation controls.
- [ ] Compare methods by angular distortion, area distortion, stretch, flipped triangles, overlap, solve time, and memory.

### UV-3. Editing tools and interaction
- [ ] Island and vertex/edge/face selection; linked selection; hide/isolate; select by material/object/seam.
- [ ] Move, rotate, scale, pivot selection, snapping, numeric transforms, proportional editing, mirror, align, straighten, and orient-to-edge.
- [ ] Stitch/weld compatible borders with tolerance, orientation checks, seam continuity and UV overlap validation.
- [ ] Pin/unpin vertices and edges; lock islands; relax and optimise with fixed pins.
- [ ] Mark/clear seams in 3D and mirror seam edits where symmetry is enabled.
- [ ] Island packing with 0–1 UDIM tile support, configurable margin, rotation, padding in pixels, texel density, scale-to-fit, and optional uniform island scale.
- [ ] Preserve chains and islands when moving or transforming connected selections; report conflicts instead of silently breaking topology.
- [ ] Undo/redo every operation as a compact command/delta; avoid snapshotting every full UV buffer for every drag frame.

### UV-4. Validation and diagnostics
- [ ] Detect overlap, flipped triangles, zero-area UVs, degenerate faces, out-of-tile coordinates, insufficient padding, and texel-density outliers.
- [ ] Provide stretch/area/angle heatmaps, checker texture, selected-island bounds, seam overlays, and per-island statistics.
- [ ] Validate before export and offer non-destructive repair suggestions; do not silently repack or alter UVs.
- [ ] Test mirrored UVs, hard-normal seams, disconnected shells, non-manifold geometry, nested objects, and high-poly assets.

### UV-5. Standalone UV workspace architecture
- [ ] Design a dedicated full-window UV workspace that can be opened from the main painter but remains a separate interaction surface.
- [ ] Define a versioned message contract: `OPEN_DOCUMENT`, `CLOSE_DOCUMENT`, `UV_CHANNEL_CHANGED`, `UV_SELECTION_CHANGED`, `UV_EDIT_PREVIEW`, `UV_EDIT_COMMIT`, `GEOMETRY_REVISION_CHANGED`, `TEXTURE_UPDATED`, `UNDO_REQUEST`, `REDO_REQUEST`, and `STATE_SNAPSHOT`.
- [ ] Every message includes document ID, mesh ID, UV channel ID, geometry revision, transaction ID, and schema version where relevant.
- [ ] Main app remains the source of truth for mesh/layer/project data. UV workspace sends commands or previews; it must not maintain a competing project copy.
- [ ] Use preview messages during drag and one committed operation on pointer-up. Cancel restores the prior state. Stale geometry revisions must be rejected.
- [ ] Specify reconnect, focus, keyboard shortcut ownership, clipboard, selection synchronisation, dirty-state, save/close confirmation, and error recovery.
- [ ] Plan shared WebGL resource ownership and context-loss recovery; do not create duplicate full-resolution texture copies without a memory budget.

### UV-6. Delivery gates
1. Architecture and schema proposal.
2. Algorithm evaluation with representative meshes and documented metrics.
3. Editing/selection/packing interaction prototype.
4. Undo, persistence, validation and export integration.
5. Standalone workspace message bridge.
6. Compatibility and performance test suite.
7. Victory's explicit confirmation before implementation begins.

No UV code is authorised by this backlog entry. Keep the current UV Editor placeholder and existing UV tools intact until the explicit go-ahead.


## 2026-11-17 implementation checkpoint

- [x] Record the expanded execution plan and UV project backlog (documentation only).
- [x] Coalesce application-level paint texture notifications to one composite sync per animation frame.
- [x] Replace full active-layer copies during common 3D brush/eraser/pen/blur/clone/smudge dabs with clipped dirty-region recompositing across visible colour layers; retain full fallback for large-area tools.
- [x] Apply X-red, Y-green, Z-blue colour coding to the temporary box/sphere/mountain gizmos and correct face-axis labels.
- [x] Make the existing subdivision panel visible by default; dock/floating switch is already wired. Its subdivision remains preview geometry; a destructive Apply + undo-safe replacement is still a separate unfinished task.
- [x] CI install/build/host-sync/package checks passed on run 44196595476; generated bundle `index-DwkyI3V_.js`, artifact ID `14378169255`.
- [ ] Capture real before/after median and p95 input-to-frame latency on target hardware. No measurements were available in CI.
- [ ] Manually test eraser/brush responsiveness, 2D/3D paint, symmetry, model part isolation, subdivision and filter interactions on the packaged page.
- [ ] Complete dynamic mesh-part inventory/isolation and verify hidden-part raycast behaviour.
- [ ] Complete the remaining filter and triplanar per-instance source-toggle work.
- [ ] Implement destructive subdivision only with explicit Apply, undo restoration, UV/group preservation, and export validation.
- [ ] UV project remains documentation-only until explicit authorisation.


## 2026-11-17 follow-up — stroke trail and redundant rebuilds

- Dirty-region compositing now covers the segment from the prior pointer position to the current dab, as well as the bounds of symmetry points. It scales source rectangles for non-1024 layer canvases and falls back for dragged-dot/large-area tools.
- Mask-brush pointer updates no longer trigger full PBR texture rebuilds. Pointer-up relies on the canonical texture notification to trigger one PBR rebuild rather than invoking a duplicate directly.
- Latest code revision `d55a7ff` passed run `44197313538`; generated bundle `index-D6s9T1ZF.js`; artifact ID `14380475625`.
- Device responsiveness remains unmeasured. Manual test on Victory's target hardware is still required.


---

# 2026-11-18 — current implementation pass

## Priority 1 — Triplanar per-instance colour/image source
- [x] Add an explicit source mode to each triplanar texture item/config: instance colour vs selected image texture.
- [x] UI must communicate the agreed semantics clearly: checked = use this row's own tint/colour; unchecked = use selected image texture. Keep the choice independent per row.
- [x] In `FillSuite`, select the sampling path from the row's source mode. For colour mode, use tint colour and independent alpha. For image mode, sample the selected image and apply row transforms/tint/alpha as designed without silently substituting another row's image.
- [x] Preserve image-less fallback, transparent-blank rows, opacity, masks, projection scale/offset, serialization and legacy project defaults.
- [ ] Test multiple rows with mixed source modes, image changes, alpha, missing images and legacy configs.

## Priority 2 — real uploaded GLB orientation gizmos
- [x] Load `box.glb`, `sphere.glb`, and `mountain.glb` through Three.js GLTFLoader; `mountain_1.glb` is the mountain-load fallback.
- [x] Preserve orientation tracking and six view-snap directions; supplied GLB geometry/materials are not destructively overridden.
- [x] Add a screen-space 2D directional arrow/axis indicator with readable +X/-X/+Y/-Y/+Z/-Z labels and consistent X-red, Y-green, Z-blue coding. Arrows follow the current projected axis directions.
- [x] CSS placeholder remains a fallback only when the GLB is absent or fails to load. GLB requests are relative to the self-host asset root.

## Priority 3 — surface-normal mode toggle latency
- [ ] Trace the default/smooth/flat mode toggle from App state through the main viewport and Navigator. Profile synchronous normal recomputation and geometry updates.
- [ ] Avoid rebuilding normals synchronously in the input event handler. Use cached normal attributes where valid, schedule expensive recomputation off the immediate interaction path, and display a coherent previous frame until the new normals are ready.
- [x] Cache computed smooth/flat variants per geometry and mode; calculate from the full topology index and reuse normal attributes.
- [ ] Commit the new mode atomically to the main viewport and Navigator, and cancel stale jobs when a newer mode/model arrives.
- [ ] Verify file normals, smooth, flat/hard modes, imported OBJ/GLB geometry, custom OBJ updates and repeated toggling.

## Priority 4 — Navigator texture synchronisation
- [x] Replace effect-driven CanvasTexture allocation/replacement on every texture version with a persistent texture and explicit `needsUpdate` invalidation.
- [x] Coalesce source notifications per frame, downsample to a persistent 256×256 Navigator canvas, and avoid duplicate texture allocations.
- [ ] Synchronise after a completed paint frame and ensure visibility/material changes do not wait for an unrelated state change. Keep Navigator inspection non-painting.
- [ ] Test frequent painting, layer visibility, colour changes, texture replacement, model replacement, unmount and WebGL context loss.

## Priority 5 — permanent subdivision docker
- [x] Remove the floating subdivision panel path and place its tab permanently in the dock group beside Colour.
- [x] Keep subdivision preview as a view-only enhancement. The preview uses separate geometry and never mutates source mesh, export mesh, undo source geometry, or saved vertex lists.
- [x] Keep the panel preview-only; no Apply/commit subdivision action is exposed. Verify save/export manually.
- [x] Ensure the docker tab follows dock conventions and has no floating mode toggle.

## Priority 6 — Colour docker Palette/HSL modes
- [x] Add Palette and HSL mode tabs/toggle within the existing Colour docker.
- [x] Palette mode preserves the existing colour wheel, swatches and current inputs.
- [x] HSL mode provides visual Hue (0–360), Saturation (0–100%), and Lightness (0–100%) sliders, live preview, numeric values and hex/RGB synchronization.
- [x] Switching modes preserves the current colour; external currentColor changes update both modes and existing onChange contract.

## Priority 7 — dynamic model part inventory/isolation
- [x] Enumerate built-in model parts and OBJ object/group/material sections with stable IDs and readable labels.
- [x] Implement per-part visibility, isolate selected, show all, and frame selected.
- [x] Hidden parts are removed from the viewport index used for raycasting and are mirrored in Navigator. Viewport edits use a private geometry clone; source geometry remains intact for exports.
- [ ] Test GLB nodes, OBJ groups, duplicate names, nested groups, single-mesh models and geometry replacement.

## Priority 8 — remaining filters
- [x] Add cached powderiser, wood grain, hatching/cross-hatching, hashing/dithering and mosaic brush patterns; retain existing edge-wear/cavity and scatter engines.
- [x] Wood grain brush pattern uses the active brush/filter colour; image textures are only used through explicit texture-source selection.
- [ ] Preserve deterministic seeds, alpha, colour management, selection masks and undo.

## Verification / release
- [x] Production build and `npm run host:sync` pass in CI. Vite build transpiles TypeScript; a separate `tsc --noEmit` run is not yet recorded.
- [x] CI run 44219704658 packaged the latest source and uploaded GLB assets.
- [ ] Browser/device testing for surface-mode response, Navigator sync, gizmo click zones, HSL colour round-trip, triplanar mixed sources, subdivision non-destructive export and model isolation.
- [ ] Do not report latency improvements without actual measured timing. CI green is build/package evidence only.

UV roadmap remains documentation-only until Victory explicitly authorises implementation.


### 2026-11-18 — implementation checkpoint: gizmos, shading responsiveness, Navigator, subdivision/colour docks, triplanar and mesh inventory

Implemented in the self-host Vite/React/Three.js source:

- **Uploaded gizmos:** the box, sphere and mountain styles now load `self-host/public/assets/Gizmo/{box,sphere,mountain}.glb`, with `mountain_1.glb` as mountain fallback. The CSS models remain a load-failure fallback. A screen-space six-direction arrow overlay follows the model orientation and labels +X/-X (red), +Y/-Y (green), +Z/-Z (blue). The mountain acoustic/faded-paint treatment is intentionally deferred.
- **Surface-normal responsiveness:** geometry normal variants are cached per geometry; calculations use the full topology index even when part visibility changes. The on-demand viewport is explicitly woken after a normal-mode change, and normal recomputation was removed from the frequently-running material/layer update effect. Navigator no longer calculates normals twice on initial/model updates.
- **Navigator synchronisation:** one persistent 256×256 canvas texture replaces the full-resolution texture upload; a layout effect copies the newest composite and flags the existing texture for update.
- **Subdivision docker:** subdivision now sits permanently beside Colour (as an adjacent tab in the grouped docker, or a fixed docker in the expanded layout). It remains a non-destructive visibility preview; there is no Apply/commit subdivision workflow.
- **Colour docker:** Palette/HSL mode switch added. Palette mode retains the existing wheel and swatches; HSL mode exposes live Hue/Saturation/Lightness sliders. Hex entry remains available in both modes.
- **Triplanar source:** each texture row now has an explicit `useInstanceColor` setting. Checked samples the row's tint/alpha; unchecked samples that row's uploaded image. Legacy rows preserve prior behaviour by sampling an existing image unless explicitly switched to colour. Missing-image fallback remains solid colour.
- **Dynamic parts inventory:** built-in model parts and OBJ `o`/`g`/material sections are exposed as stable IDs/names. The Mesh Parts docker supports selection, per-part visibility, isolate, Show All and Frame Selected. The same filtered index drives viewport raycasting, and Navigator visibility follows the main view. The original geometry remains the save/export source; subdivision preview is bypassed while parts are hidden/isolated so part controls stay functional.
- **Remaining brush filters:** cached procedural pattern tiles now include powderiser, wood grain, hatching, cross-hatching, hashing, dithering and mosaic. Existing edge-wear/cavity and stochastic scatter engines remain available.
- **UV:** still documentation-only until explicit authorisation.

**Verification:** latest completed build/package checkpoint before the final frame-selected visibility tweak: run `44219296497` passed, generated bundle `index-3kZ9-qhy.js`, artifact `14390310542`. The final frame-selected visibility tweak passed run `44219451453`; the latest code revision and final package verification are recorded below. CI is build/package evidence only. Actual GLB rendering, UI interaction, and device latency still require manual testing. No measured before/after timing is claimed.


### 2026-11-18 — final verification update
- Latest code revision: `5cd8deab` (`Viewport3D` now uses a private geometry clone, so hide/isolate operations cannot mutate source geometry used by UV editing, saves or exports).
- GitHub Actions run [44219704658](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44219704658) completed successfully: install, production build, `npm run host:sync`, package identity checks, ZIP packaging and artifact upload all passed.
- Generated bundle: `index-BIQQ4eFN.js`. Latest artifact: `VUE_3D_Canvas_SelfHost`, ID `14390800060` (851,024 bytes; expires 2027-02-16).
- This verifies source compilation and packaging, not browser behaviour. Still require manual tests for GLB appearance/load path, all six gizmo arrows, HSL round-trip, mixed triplanar rows, part inventory/raycast isolation, subdivision source/export preservation, Navigator updates, and target-device surface-normal response. No latency measurements are claimed.

## Correction pass implementation checkpoint — 2026-11-18

Implemented in root self-host painter source (not native Rust):
- Triplanar dialog responsive width/height and input containment; drag bounds updated.
- Color wheel canvas stays mounted across Palette/HSL switches.
- App uses dynamic viewport height (100dvh).
- Grouped docker tab lists now filter by activePanels; Window menu includes Mesh Parts.
- Gizmo labels use plain X/Y/Z with direction arrows; positive axes are brighter, negative axes darker, and rear/opposing indicators fade. Preference controls added for radial label spacing and font size. These are projected overlay arrows/labels aligned to the model axis projections, not arrow geometry baked into the GLB.
- Selected-layer image filter dialog and image-processing engine added: Wood Grain (Image/Colour source, edge, noise, bleed/blend, blur), Hatching/Cross-Hatching/Hashing (pixel displacement), Powderiser, Dithering and Mosaic. Filters apply destructively to the active image layer, with an undo checkpoint and dialog preview. Preview downsamples to 320×320; Apply processes the full selected-layer canvas.
- Bump conversion now opens grayscale Levels (black input, white input, gamma, output black, output white), previews, then converts the selected layer image to grayscale before enabling bump.
- The repository OBJ self-host/public/assets/suzanne.obj is now imported as raw bundled text and used as the built-in Squail model; one Catmull-Clark subdivision is baked into preset geometry, and a simple planar UV is generated when OBJ has no UV attribute.

Known limitations / manual validation:
- Hatching displacement is currently computed in image/UV coordinates. Object/world axis options use a simplified angle mapping; exact per-model world/object-to-UV transform is not implemented yet.
- Gizmo arrow direction is a projected axis overlay; the actual gizmo GLB still has no embedded material. Verify axis label overlap, rear fade, and snapping in device/browser.
- Squail planar UV projection is intentionally simplified; validate seams/distortion and model bounds. OBJ subdivision and UV bake are CI compile-tested only.
- Wood Grain, hatching displacement, Bump Levels, dialogs, mobile sizing, docker toggles, and color-wheel persistence require manual interaction testing. No browser-level test or measured performance run has been performed.

Latest successful CI/package checkpoint: run 44269171028 (run #85), commit 92ad447447a0e9633e3d0efc649fff7aaa85e25e, artifact 14412325195 (VUE_3D_Canvas_SelfHost), 889,628 bytes, SHA-256 2bda18bb932c48b22da2bf40153893f6065c96bf791e81bda6bb5a2bf23b2124, expires 2027-02-16. Build/package pass does not establish browser behavior.
