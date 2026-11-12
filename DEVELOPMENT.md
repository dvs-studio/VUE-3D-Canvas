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
   - Step 1: Read `AGENTS.md` to review the chronological feature log and strict rules.
   - Step 2: Read `AGENT_STATE.md` to see the exact state of all UI panels, viewports, and tools.
   - Step 3: Read `API_DOCUMENTATION.md` for technical API specifications across all engines.
   - Step 4: Read `DEVELOPMENT.md` (this file) for structural understanding.
   - Step 5: Read `HANDOFF_PROMPT.md` for conversational prompting patterns.
2. **Rebuilding & Synchronizing:**
   - Always run `npm run host:sync` after frontend edits. This compiles Vite to `/dist` and updates `self-host/public` in one atomic step.
   - Verify compilation with `npm run build` and check for TypeScript errors.
3. **Avoid Deprecated Paths:**
   - Do not resurrect `python_desktop/`, `native_c/`, or `native_runner/`. These were early experimental prototypes and are retired.
   - The official Windows application is `crates/vue3d_core`.
   - The official browser distribution is `self-host/`.
4. **Testing Checklist for Verification:**
   - 3D Viewport renders without WebGL context loss.
   - Direct-on-mesh 3D painting reflects immediately on the 2D UV canvas and 3D preview.
   - View menu camera viewpoints (Front, Back, Right, Left, Top, Bottom) snap camera angles instantly.
   - Lagoon mode toggle (`Tab` or menu bar button) expands viewport while keeping 3D gizmo and right dockers accessible.
   - Refresh rate settings in Preferences (`on-demand`, `30fps`, `60fps`, `120fps`, `custom`, `uncapped`) function as expected.

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


