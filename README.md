# VUE 3D Canvas

**Author / Creator:** Victory Ukpong  
**Target Architecture:** Native Windows Desktop (DirectX 11 / OpenGL 2.0 Fallback) + Rust Core + Standalone Offline Workstation  
**Project Format:** `.xblend` (Linked 3D Assets Default + 3-State Undo Ring Buffer)  
**Primary Distribution:** 100% Self-Contained Portable Desktop Package (Zero Compilers or Servers Needed)  

---

## 1. Quick Start: Windows Application (No Server)

Download the artifact from the **Build Windows Application** workflow, or build it on a Windows machine with `scripts\build_standalone_desktop.bat`.

Extract the whole zip. Keep `vue_3d_canvas.exe` and the `ui` folder side by side, then double-click the exe.

- The painting programme opens in its own window. There is no localhost server and no console menu.
- WebGL runs through ANGLE on DirectX 11. Start the exe with `--opengl` for the OpenGL path.
- Windows 11 includes WebView2. Windows 10 needs the Evergreen WebView2 Runtime if the window does not appear. Failures are written to `vue3d-startup-error.log` beside the exe.

You can extract it anywhere, including the Desktop or a USB drive. It does not write to the registry.

### Launch from a checkout on Windows

```powershell
npm install
npm run build
cargo build --release --bin vue_3d_canvas
```

Place `target\release\vue_3d_canvas.exe` next to a `ui` folder that contains `dist`'s `index.html` and `assets`. `scripts\build_standalone_desktop.bat` does that for you.

---

## 2. Graphics Hardware Backend Switching (DirectX 11 & OpenGL)

You can switch the graphics rendering backend at any time directly from the top Menu Bar:
- Click **Help > GPU Graphics Backend**:
  - `● DirectX 11 (D3D11 - Priority)` *(Default - optimal for Windows desktop hardware)*
  - `○ OpenGL 2.0+ / Desktop GL` *(Compatibility mode for older GPUs or virtual machines)*
  - `○ Modern Auto-Detect` *(DirectX 12 / Vulkan / Metal auto-negotiation)*
- Click **Help > GPU Hardware Diagnostics...**:
  - Opens the interactive hardware modal displaying your unmasked GPU card name, driver vendor, maximum texture dimension (e.g., 8192×8192 or 16384×16384), shader precision limits, and offline filesystem status.

---

## 3. Comprehensive Application Feature Index

### A. 3D Texture Painting & Viewport Engine
- **Blender Drone Navigation:** Orbit, planar pan (along camera local right/up axes), and WASD+QE drone flight controls with Shift speed boost.
- **Dynamic Surface Normals:** Blender-style normal recalculations toggled on the fly:
  - `Def` (Original vertex normals)
  - `Smooth` (Angle-weighted surface smoothing)
  - `Flat` (Faceted low-poly visualization)
- **Quad & Perspective Cameras:** 1-click quad split-view (Top, Front, Right, Perspective) with numpad camera hotkeys.
- **Lighting & Reflections:** Studio, Sunset, Cyberpunk, and Daylight HDRI environments, custom panorama upload, and Matcap reflection shaders.
- **Post-Processing:** UnrealBloomPass high-dynamic-range bloom with intensity and threshold controls.

### B. 2D UV Texture Canvas & Sculpt Suite
- **Real-Time 2D/3D Synchronization:** Edits on the 2D UV canvas immediately reflect on the 3D model and Navigator window.
- **Smart UV Unwrap Engine:** Automatic seam detection (angles > 60°), conformal chart relaxation, and Mulberry32 seeded stochastic island packing with configurable gutter bleeding (2px–16px).
- **Multi-UV Channel System:** Dynamic UV slot manager (`uv_original`, `uv_tightmap`, custom slots) and inverse barycentric triangle re-baking from tight-map back to original reference UVs.
- **Bilateral Symmetrize (+X/-X):** Bilateral UV chart mirroring with centerline seam welding, ear feature pinning, and 3D X-Ray depth vertex selection brush.
- **2D UV Sculpt Brushes (N-Panel):** Press `N` to open the dockable sculpt panel featuring:
  - *Straighten* (aligns chart borders)
  - *Smooth* (Laplacian edge relaxation)
  - *Pinch* (condenses vertex cluster density)
  - *Expand* (relieves texture stretching)
  - *Crease* (sharpens UV chart boundaries)

### C. Procedural Shader Node Graph & Floating Inspector
- **Blender 2.8+ Node Graph:** Interactive node network for procedural textures, mixes, color ramps, math operators, UV mapping, and emission.
- **Independent Floating Node Inspector Pop-up:**
  - Standalone floating dialog decoupled from the node graph canvas.
  - Close and minimize controls, live 2-way value synchronization, steppers, and color swatches.
  - Dual-sided Sockets Exposure Manager (inputs on left, outputs on right) to reveal or hide connection plugs on the node perimeter.
- **Gboard-Style Perimeter Resize Handles:**
  - 8-directional perimeter grab zones on floating panels.
  - Interactive glowing accent pills and corner grab brackets that appear when hovering or resizing.
  - Enforced minimum dimensions and screen clamping.
- **Multi-Branch Wire Connections:** 2-click sequential wiring with dynamic rubber-band guide lines, glowing branch junction dots, and Shift-click multi-connection support.

### D. Advanced Texturing Tools & Filters
- **Stochastic Layer Scattering Engine:**
  - Import custom image textures (PNG, JPG, WebP, SVG) or pick presets (grunge, leaves, cracks, stars, hex, circuit).
  - Authentic native image colors preserved by default.
  - "Use physical fill color" checkbox to override stamp silhouettes with chosen palette colors.
  - Dedicated Rotation Jitter slider (0° to 180°).
  - Alpha outline effect with configurable spread dilation (0–20px) and Gaussian blur.
- **Multi-Texture Triplanar Box Filter:** UV-less XYZ box projection with multi-texture mixing operators, noise/cloud blending, edge bleed, tiling randomization, and custom upload stack.
- **3D Pattern Stamp Decal Tool:** Surface decal stamper with sharpness masks, edge imperfection sliders, and blendable grunge overlays.
- **Edge Wear & AO Filter:** Curvature analysis and ambient occlusion cavity dirt generator for realistic distress.
- **Jenny Stitch Studio:** Mesh vertex edge topology follower with thread shaders and displacement depth.

### E. File Format, Undo & Export Architecture
- **`.xblend` Project Format:** Custom low-overhead specification saving layer stack, blend modes, node graphs, and strictly up to 3 undo states. 3D assets remain linked by default to keep files small.
- **1-Step Live Undo / Redo:** Strict 1-state undo (`Ctrl+Z`) and redo (`Ctrl+Y`) with repeat guard.
- **Multi-Channel Model Exporters:** Automated FBX and glTF 2.0 texture baking separated into Albedo, Emission, Normal/Displacement, Roughness, and Metallic maps.

---

## 4. Package Contents (`VUE_3D_Canvas_Windows.zip`)

```
VUE_3D_Canvas_Windows/
├── vue_3d_canvas.exe     # Native window. No server.
├── README.txt
└── ui/
    ├── index.html        # Painting application entry
    └── assets/           # The compiled React / Three.js programme
```

---

## 5. Developer Build

```bash
npm install
npm run build
```

The Windows window is compiled on Windows, or by the manual GitHub Action **Build Windows Application** (Actions → Run workflow). That job fails if `dist/index.html` or the JavaScript bundle is missing, so it cannot upload a console stub in their place.

```powershell
cargo build --release --bin vue_3d_canvas
```

---

## 6. Self-hosted standalone (no exe)

This is the package Victory can run without `vue_3d_canvas.exe`. It is the current painter, already built into `self-host/public/`. Node serves those files. It does not compile Rust and it does not open a WebView2 window.

```bash
cd self-host
node server.js
```

Windows: double-click `self-host/start.bat`. Linux or macOS: `./start.sh`. Then use `http://localhost:3000`. Do not open `public/index.html` as a file.

From the repository root, `npm run host` starts that server. `npm run host:sync` rebuilds `src/` and replaces `self-host/public/` so the folder cannot keep an old bundle.

The Windows exe in section 1 is unchanged. This server is only the non-exe package.

---

## 7. Attribution & Open-Source License
- **Author & Creator:** Victory Ukpong
- **UI Theme:** Photoshop CS5 Dark Gray (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`)
- **License:** Apache-2.0
