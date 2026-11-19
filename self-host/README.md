# VUE 3D Canvas - Self-Hosted Full Programme

**Author / Creator:** Victory Ukpong  
**Version:** 0.1.0  
**License:** Apache-2.0  

---

## 1. Overview

This directory contains the **Self-Hosted Standalone Distribution** of **VUE 3D Canvas**. It allows you to run the complete 3D texture painting suite on your own machine, local network (LAN), or private VPS without any third-party cloud service, telemetry, or external dependencies.

### Features
- **Zero-Dependency Node Server:** Pure Node.js HTTP implementation (`server.js`). It serves the inlined painter and saves `.xblend` files. It does not send COOP/COEP headers, because those headers blocked the page fonts.
- **Local Persistent Storage:** Automatically stores `.xblend` project files in `./storage/projects/` and uploaded custom decals/textures in `./storage/textures/`.
- **VS Code First:** Designed to launch with a single click or command inside Visual Studio Code.
- **Docker & Docker Compose:** Ready for 1-command containerized deployment.
- **Cross-Platform:** Runs on Windows 10/11, macOS, Linux, and WSL.

---

## 2. Quick Start

### Method A: Using VS Code Integrated Terminal (Recommended)

1. Open the repository root or the `self-host/` folder in **Visual Studio Code**.
2. Open the integrated terminal (`Ctrl + ~` or `Cmd + ~`).
3. Run:
   ```bash
   node server.js
   ```
   Or using npm:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   Or open `public/index.html` directly (`file://`). The page inlines the painter, so both addresses use the same JavaScript. Do not use an older copy that still has `<script src="./assets/...">`.

### Method B: 1-Click Launch Scripts
- **Windows:** Double-click `start.bat`.
- **Linux / macOS:** Run `./start.sh`.

### Method C: Docker & Docker Compose
To run as a background service:
```bash
docker compose up -d
```
Access at `http://localhost:3000`. Storage is automatically mounted and preserved in a persistent Docker volume (`vue3d_canvas_data`).

---

## 3. Configuration & Options

The server can be configured via command-line flags or environment variables:

| Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--port <port>` | `PORT` | `3000` | Port for the HTTP server |
| `--host <ip>` | `HOST` | `0.0.0.0` | Bind host (`0.0.0.0` allows LAN access, `127.0.0.1` restricts to localhost) |

Example:
```bash
node server.js --port 8080 --host 0.0.0.0
```

---

## 4. REST API Endpoints

The self-hosted server provides built-in endpoints for integration:

- `GET /api/health` - Server health status, system uptime, and memory usage.
- `GET /api/projects` - List all saved `.xblend` project files.
- `POST /api/projects/save` - Save a `.xblend` project payload to disk.
- `GET /api/projects/:name` - Retrieve a saved project file.
- `GET /api/textures` - List uploaded custom textures and stamps.
- `POST /api/textures/upload` - Upload a PNG/JPEG texture to the server library.

---

## 5. Rebuilding Frontend Assets

If you make modifications to the source code in `src/`:
1. From the repository root, run:
   ```bash
   npm run build
   ```
2. Copy the fresh build into this folder (this also deletes stale hashed bundles):
   ```bash
   npm run host:sync
   ```
   `host:sync` runs `vite build`, then `scripts/sync_self_host.mjs`.

This folder is the programme to finish. It is not `vue_3d_canvas.exe`. On Windows, double-click `start.bat` for `http://localhost:3000`, or open `public/index.html` with `file://`. Both use the same inlined page. The current bundle is `index-DXhSIj8p.js`. Do not open an older `index.html` that still points at `<script src="./assets/...">`.

`npm run host:sync` from the repository root is the only rebuild. It runs the Vite build and then inlines the script and CSS. Copying `dist/` by hand leaves a page that needs a server.

Zoom updates the main 3D view without a pan. Turning a tablet from portrait to landscape resizes the canvas. Triplanar, Scatter, and Edge Wear are panels, not a full-screen black layer. A stroke rebuilds mipmaps when the pen lifts, not on every dab.


## 6. Current self-host implementation and verification

The active implementation target is the Vite/React/Three.js painter in this directory's source project. The Rust workspace is not part of this work.

### Implemented in source

- Per-layer colour, reflection, emission, and bump switches with influence values.
- Editable bump ramps. Enabling bump on a painted colour layer keeps its colour pixels intact.
- Combined viewport colour, emission, height, roughness, and normal maps.
- .xblend stores the PBR layer settings and remains backward-compatible with files that do not contain the new fields.
- ZIP export writes only the channel maps that enabled layers contribute, plus layer_manifest.json.
- The Blender importer reads that manifest and builds one Principled BSDF material with one mix chain per channel. It does not rebuild the retired painter node graph.
- Texture import and Auto-Texture from Folder configure layer switches instead of creating painter nodes.
- Triplanar rows support image previews or solid colour values in rgba(), hsla(), #RGB, #RRGGBB, and #RRGGBBAA, with a separate alpha control.
- UV Editor is a Coming Soon placeholder; Viewport2D remains available.
- Subdivision Preview supports Catmull-Clark and Simple modes with user-controlled levels and no artificial level-2 cap, plus sharp-angle detection, crease and boundary controls, and optional height displacement. It is preview-only and does not alter the source mesh or exported model; high levels can consume substantial memory and processing time.
- The first viewport render uses the direct renderer; bloom resources are allocated on the following frame.
- public/background.jpg is the neutral equirectangular studio environment copied beside the self-hosted index.html during sync.

### Build and test sequence

From the repository root (first-time setup):

    npm install
    npm run host:sync

Then open self-host/public/index.html directly or run the self-host server:

    cd self-host
    node server.js

You can also build the package in GitHub without installing Node.js locally:

1. Open the repository's **Actions** tab.
2. Select **Build Self-Hosted Programme**.
3. Click **Run workflow** on the main branch.
4. When it finishes, download the **VUE_3D_Canvas_SelfHost** artifact.

The workflow can be run manually and also runs automatically when relevant self-host source, public assets, build scripts, or package configuration change on main.

Manual verification checklist:

1. Open a legacy .xblend project and confirm it loads without missing-field errors.
2. Convert a painted layer to Bump and confirm its colour remains visible.
3. Toggle each PBR contribution, change its influence, and edit the bump ramp.
4. Export a ZIP and confirm it contains layer_manifest.json and only the expected files in layer_maps/.
5. In Blender, select a mesh and run import_vue_layer_bundle('/path/to/project.zip'); inspect the single Principled material and its channel chains.
6. Test Import Texture and Auto-Texture from Folder with colour, height, reflection, emission, and normal maps.
7. Test triplanar rows with an image and with each supported solid-colour syntax; check separate alpha.
8. Toggle subdivision modes and levels, then export the model and confirm the original cage geometry is unchanged.
9. Check the first viewport frame, studio background, theme changes, and the sphere/mountain gizmos.

**Latest verification status (2026-11-19):** GitHub Actions run #156 (`44480073408`) completed npm install, Vite production build, `npm run host:sync`, self-host HTML validation, generated-output commit, ZIP packaging and artifact upload. Source revision `5ec840915c3812eacb68f1577659c1ab6b8509e2`; generated self-host output commit `c26301294da0465d5402b6800fbd15dab39cae59`. Artifact `VUE_3D_Canvas_SelfHost` is 1,076,269 bytes: [download from the workflow artifact page](https://github.com/dvs-studio/VUE-3D-Canvas/actions/runs/44480073408/artifacts/14508410797). Browser interaction and Blender import still require manual testing.

---

## 7. Safety copy and maintenance

`release/vue3d-self-host-safety-2026-11-14.zip` at the repository root is a copy of this folder before the toggle-layer work. The active self-host work is tracked in `SELF_HOST_TASK_2026-11-19.md` and `LAYER_PBR_PLAN.md`. Do not treat this folder as the Windows exe.


## 7. 2026-11-19 self-host feature update

- Export-only texture package modes: Classic separate maps, RGB+ORM packing (R=height-derived AO approximation, G=roughness, B=metallic), and AO×Albedo. AO is an approximation derived from local height differences, not geometry-baked or ray-traced AO. Model-file format output remains the standard exporter.
- Smart UV supports deterministic seeded quarter-turn island rotation. Layer selection restores that layer's UV channel; channel edits persist to the selected layer. The UV Channels panel includes a 0–16 px seamless gutter action for the active layer's texture pixels.
- Bump and Displacement conversions share grayscale Levels controls.
- The desktop Tool Options bar scrolls horizontally. Preferences provides 75.0–125.0% UI scale with 0.1% steps.
- Preferences imports/replaces/clears the Mountain gizmo GLB. It is persisted in IndexedDB for the current browser origin, not synced between devices.
- Layer multi-select supports Merge and Move-to-Group. Merge requires visible unlocked layers with the same channel and PBR settings; the merged result remains at the source stack position.

Manual validation is still required for Android touch and desktop interactions, AO export quality/performance, UV switching/rebake/seam appearance, Levels undo, Mountain GLB persistence after reload, and layer merge/group operations. A successful CI run confirms compilation and packaging, not these runtime behaviours.
