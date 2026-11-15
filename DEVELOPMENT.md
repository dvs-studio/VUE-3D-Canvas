# VUE 3D Canvas — Program Architecture & Genesis Guide

**Author / Creator:** Victory Ukpong  
**Target:** Engineering Handover & AI Model Context Transfer  
**Current Release:** 1.5.0 Production  

---

## 1. Project Genesis & Architectural Heritage

### The Problem
Traditional 3D texturing suites (Substance 3D Painter, ArmorPaint, Mari) require high-end dedicated GPUs with DirectX 12, Vulkan, or hardware ray-tracing, often demanding 8GB+ of VRAM and massive install footprints. Meanwhile, 2D artists comfortable with Photoshop CS5 and Autodesk Sketchbook face steep learning curves with complicated node trees and bloated multi-gigabyte project files.

### The Vision
Victory Ukpong envisioned **VUE 3D Canvas**:
- A lightweight, non-raytraced 3D painting environment combining the tactile familiarity of Photoshop CS5 (layers, blend modes, dark neutral-gray UI) and Autodesk Sketchbook (circular tool carousel, Lagoon radial puck, lazy-mouse stabilizer).
- Strictly non-raytraced, capped at DirectX 11 and OpenGL 2.0+ limits so it runs smoothly on laptops, integrated Intel Iris/UHD graphics, and mid-range GPUs.
- Proprietary `.xblend` project format with a normalized 3-state ring buffer and linked assets by default.

---

## 2. Dual Deployment Architecture: Desktop Windows & Self-Hosted Web

VUE 3D Canvas ships in two synchronized formats:

```
                          [ VUE 3D Canvas Source ]
                           (/src, React 19, Vite)
                                     |
                    +----------------+----------------+
                    |                                 |
                    v (Vite Build)                    v (Vite Build)
          [ crates/vue3d_core ]                    [ self-host/ ]
          Windows Native Desktop               Self-Hosted Web Server
          - Rust entry process                 - Zero-dependency Node.js
          - Microsoft WebView2                 - Serves self-host/public/
          - In-process vue:// protocol         - Offline standalone package
          - ANGLE DirectX 11 / OpenGL          - Native .xblend file storage
```

### 2.1 Target A: Windows Native Desktop Window (`crates/vue3d_core/`)
- **Nature:** Real native Windows executable (`vue_3d_canvas.exe`), not a web wrapper running a background HTTP server.
- **Window Process:** Rust binary located in `crates/vue3d_core/src/main.rs` and `desktop.rs`.
- **In-Process Content Loading:** Uses Microsoft WebView2 with a custom `vue://` scheme handler loading built files directly from the adjacent `ui/` directory. No local ports, loopback proxies, or network sockets are opened.
- **Hardware GPU Acceleration:** WebGL reaches the GPU via Google ANGLE:
  - **DirectX 11 (Default):** Runs via D3D11 backend (`--use-angle=d3d11`).
  - **OpenGL Mode:** Runs via Desktop OpenGL Core Profile when started with `--opengl` flag or selected via Help menu (`--use-angle=gl`).
  - **Modern Auto-Detect:** Enables DirectX 11 plus experimental WebGPU flags (`--modern`).
- **GPU Switching:** Changing the GPU backend in the UI writes `gpu-backend.txt` next to the exe and prompts an instant process relaunch.

### 2.2 Target B: Self-Hosted Web Distribution (`self-host/`)
- **Nature:** Standalone, zero-dependency Node.js server (`self-host/server.js`) designed for local network deployment, Docker containers, and cross-platform browser access.
- **Directory Structure:**
  - `self-host/server.js`: Clean HTTP server with MIME detection, path containment checks, and `.xblend` project read/write API endpoints (`/api/projects/save`, `/api/projects/load`).
  - `self-host/public/`: Static distribution bundle synced directly from `npm run build` using `scripts/sync_self_host.mjs`.
  - `self-host/start.bat` / `self-host/start.sh`: 1-click launch scripts opening the default browser.
- **Sync Command:** Running `npm run host:sync` rebuilds the frontend and populates `self-host/public/`.

---

## 3. Core Technical Constraints & Immutable Rules

Every engineer and AI assistant working on VUE 3D Canvas must adhere to these governing rules:

1. **Max 3 Undo States in `.xblend`:**
   To guarantee rapid saves, minimal memory usage, and instant project loading, the undo ring buffer stores a maximum of 3 states.
2. **Linked 3D Assets by Default:**
   Imported OBJ/MTL files are referenced by relative path rather than embedded as massive JSON blobs, keeping `.xblend` files tiny (~few kilobytes). Embedding is an opt-in toggle in Project Settings.
3. **No Ray-Tracing or D3D12 Dependency:**
   All shaders, viewports, and procedural generators must remain compatible with DirectX 11 and Desktop OpenGL 2.0+ via ANGLE.
4. **Photoshop CS5 Dark Neutral-Gray Skin:**
   Color palette is strictly locked to `#333333`, `#2b2b2b`, `#3c3c3c`, and `#222222`. Zero rounded neon pills or generic SaaS styling.
5. **Preservation of History & Ledgers:**
   Never overwrite, truncate, or wipe previous entries in `AGENTS.md` and `AGENT_STATE.md`. Always append new capabilities and handover logs.

---

## 4. Key Subsystems & File Layout

| Directory / File | Subsystem & Purpose |
| :--- | :--- |
| `/src/App.tsx` | Root application orchestrator, canonical composite canvas, tool switching, modal management. |
| `/src/renderer/Viewport3D.tsx` | Three.js 3D viewport, camera snapping, anisotropic filtering, mesh rendering, 3D painting. |
| `/src/renderer/Viewport2D.tsx` | 2D UV texture canvas, flat texture painting, UV channel coordinate viewer. |
| `/src/renderer/modelGeometry.ts` | OBJ/MTL parser, architectural mesh repair (coplanar normal snapping & vertex welding), procedural presets. |
| `/src/tools/brushEngine.ts` | Stabilizer lazy-mouse, stroke modes (Space, Airbrush, Dot, Dragged-Dot, Curve). |
| `/src/tools/fillSuite.ts` | Upgraded Triplanar Box Filter with XYZ projection and slope/altitude masking. |
| `/src/tools/gaussianBlur.ts` | Separable 2-pass Gaussian blur with premultiplied alpha. |
| `/src/tools/stochasticScatter.ts` | PRNG-seeded layer scatter engine with size/opacity jitter. |
| `/src/tools/edgeWearFilter.ts` | Topology curvature analyzer distinguishing convex edges from concave crevices. |
| `/src/tools/stitchStudio.ts` | Jenny Stitch Studio mesh topology edge following and displacement depth generator. |
| `/src/nodes/` | Blender 2.83 LTS procedural node graph evaluator and Python importer generator. |
| `/src/ui/LagoonMenu.tsx` | Autodesk Sketchbook / Maya radial interface with 6 wings (Tools, Brushes, Colors, Layers, Views, Project). |
| `/src/ui/TabletBrushCarousel.tsx` | Tablet mode top-left parameter carousel with Radial Arc Dial and Circular HUD sub-operators. |
| `/src/ui/PhotoshopMenuBar.tsx` | Photoshop CS5 top menu bar with View, Options, Window dropdowns and Lagoon toggle. |
| `/crates/vue3d_core/` | Native Windows WebView2 window host process. |
| `/self-host/` | Self-hosted Node.js distribution. |

---

## 5. Professional Transfer & Handover Recommendations for Future AI Models

When transferring ownership of this codebase to another AI model or engineering team:

1. **Mandatory Pre-Flight Reading Order:**
   - Step 1: Read `SELF_HOST_HANDOFF.md`. That is the current product.
   - Step 2: Read `AGENTS.md` for the rules and the chronological log.
   - Step 3: Read `AGENT_STATE.md`, starting at "Current self-host".
   - Step 4: Read `API_DOCUMENTATION.md`, starting at "Current self-host corrections".
   - Step 5: Read this file, then `HANDOFF_PROMPT.md`.
2. **Rebuilding & Synchronizing:**
   - Always run `npm run host:sync` after frontend edits. This compiles Vite to `/dist` and inlines the result into `self-host/public`.
   - Verify compilation with `npm run build`.
3. **Avoid Deprecated Paths:**
   - Do not resurrect `python_desktop/`, `native_c/`, or `native_runner/`.
   - The product to finish is `self-host/`. `crates/vue3d_core` is the window that will show that page later. Do not rewrite it until Victory asks.
4. **Testing Checklist for the current self-host page:**
   - Open `self-host/public/index.html` with `file://` or `node self-host/server.js`. Do not treat the Vite dev server as the test.
   - Zoom the main view without panning. It should update. The navigator already did.
   - Rotate the window or the tablet. There should be no dead strip, and no reload.
   - Paint a stroke. It should stay smooth. Mipmaps wait until the pen lifts.
   - Open Triplanar, Scatter, and Edge Wear. The model and the menus stay. Apply changes the layer.
   - Smooth has no leftover 38° crease. Flat is faceted. Def is the file shading.
   - The refresh-rate checklist below is retired. Preferences has no frame-rate control on this build.

## 2026-11-10 — Web build changes

The refresh checklist line above is retired for the web / self-host build. Preferences no longer has a refresh cap, and the viewport draws every frame. A cap may return on the Windows exe only.

Verify on `self-host/public/index.html` (`file://` or `node server.js`):

- Smooth has no leftover hard crease from the 38° cut. Flat is still faceted. Def is the file shading.
- A filter Apply stays on the layer and shows on the model without changing a refresh setting.
- Smart Unwrap splits a closed mesh into separate islands. The angle is how wide one patch may turn. Islands do not sit on top of each other.
- Double-click an island to select it. Right-click keeps the left or the right of U = 0.5. Drag Island moves that piece.
- Layer Settings → UV for this layer switches the channel. Node panel → Bake to Layer replaces that layer.

## 2026-11-12 — filter dialogs

Open Triplanar, Scatter, and Edge Wear. They must appear and Apply without taking the painter down. The 3D view should stay still when you are not painting or orbiting, and a finished filter should still show up. Bundle: `index-DwCqaqSC.js`. The handover for the next agent is `SELF_HOST_HANDOFF.md`.

## 2026-11-13 — do not trust the dev server for filters

`vite` can show Edge Wear, Triplanar, and Scatter while `self-host/public/index.html` still goes black. Check the inlined page. The Windows exe loads that page and does not implement the filters itself.

## 2026-11-14 — self-host filter panels

`index-D2VONoEr.js` puts Triplanar, Scatter, and Edge Wear on a fixed panel instead of a full-screen layer. Open `self-host/public/index.html` with `file://` or `server.js` and confirm the menus and the model stay visible. Gaussian and Stitch were left as they were.

## 2026-11-14 — zoom and resize, not started

The main 3D view must redraw on zoom without a pan. The navigator already does. A tablet rotation must resize the drawing buffer to the new window. Push uncommitted work about every 4 minutes. No empty commits.

## 2026-11-14 — zoom and resize landed

`index-DXhSIj8p.js`. Scroll the 3D view and it should update without a pan. Rotate the tablet and the dead strip should be gone without a reload. Painting should feel lighter on a GTX 1650 because mipmaps wait until the stroke ends.







## 2026-11-14 — node editor rejected

Victory tested the self-host page and is slightly satisfied. The first moment of the view is slow; after that it is not. He does not want the node editor.

The next build is self-host only. Follow `LAYER_PBR_PLAN.md`. Keep the material fill layer. Replace the main layer with the three switches described there. The Windows crate is not part of that build. A later Windows window hosts the finished page; it does not grow its own filter code. The safety copy taken before this change is `release/vue3d-self-host-safety-2026-11-14.zip`.

