# VUE 3D Canvas

**Author / Creator:** Victory Ukpong  
**Target Architecture:** Native Windows Desktop (DirectX 11 / OpenGL 2.0 Fallback) + Rust Core + Standalone Offline Workstation  
**Project Format:** `.xblend` (Linked 3D Assets Default + 3-State Undo Ring Buffer)  
**Primary Distribution:** 100% Self-Contained Portable Desktop Package (Zero Compilers or Servers Needed)  

---

## 1. Quick Start: Standalone Offline Desktop (No Compiler Needed)

The standalone desktop package (`VUE_3D_Canvas_Standalone_Desktop_Win64.zip` or folder `dist/standalone_desktop/`) is a **100% self-contained, pre-compiled Windows workstation**.

### Where to Extract:
> [!IMPORTANT]
> **You do NOT need to move this to your user home folder.**
> The application is 100% portable. You can extract and run it from **any folder or drive of your choice**:
> - Your **Desktop** (e.g., `C:\Users\<Name>\Desktop\VUE_3D_Canvas`)
> - A **USB Flash Drive** (e.g., `E:\VUE_3D_Canvas`)
> - An Applications directory (e.g., `C:\Apps\VUE_3D_Canvas`)
> - A Secondary Drive (e.g., `D:\Tools\VUE_3D_Canvas`)
>
> It does not write to the Windows Registry, does not pollute `%USERPROFILE%`, and requires no administrative privileges.

### How to Launch:
Inside the extracted folder, choose your preferred launcher:

1. **Direct Executable (`vue_3d_canvas.exe`):**
   - Double-click `vue_3d_canvas.exe`.
   - The application starts its embedded zero-overhead loopback stream server and launches directly in a **clean, chromeless desktop window** (`--app` mode).
   - No browser tabs, no address bar, and **zero blank screens** (completely bypasses `file://` CORS restrictions).

2. **1-Click Batch Launcher (`VUE_3D_Canvas.bat`):**
   - Double-click `VUE_3D_Canvas.bat`.
   - Automatically executes `vue_3d_canvas.exe` (with a built-in background PowerShell streaming fallback).

3. **Diagnostic Launcher (`VUE_3D_Canvas_Diagnostic.bat`):**
   - Double-click `VUE_3D_Canvas_Diagnostic.bat`.
   - Opens a console window that checks graphics hardware accelerators, detects GPU adapter vendor & renderer, verifies DirectX 11 / OpenGL pipelines, checks core assets, and displays live runtime logs.

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

## 4. Package Contents (`VUE_3D_Canvas_Standalone_Desktop_Win64.zip`)

```
VUE_3D_Canvas_Standalone_Desktop_Win64/
├── vue_3d_canvas.exe              # 64-bit Windows Native Application Runner
├── VUE_3D_Canvas.bat              # 1-Click GUI Desktop Launcher
├── VUE_3D_Canvas_Diagnostic.bat   # Hardware Diagnostics & Console Launcher
├── README_STANDALONE.txt          # Offline Quick Start Manual
├── index.html                     # Application Frontend Entry
└── assets/
    ├── index-*.js                 # Complete VUE 3D Canvas Application Bundle
    ├── index-*.css                # Photoshop CS5 Dark Theme Stylesheet
    └── signature.svg              # Open-Source Creator Attribution
```

---

## 5. Developer & Source Compilation (Optional)

If modifying source code or compiling from scratch:

```bash
# 1. Compile web client assets
npm install
npm run build

# 2. Compile native Windows executable runner (via MinGW)
x86_64-w64-mingw32-gcc -O3 native_runner/vue_3d_canvas.c \
  -o native_runner/vue_3d_canvas.exe -lws2_32 -lshlwapi -mwindows

# 3. Build standalone distribution folder & ZIP
./scripts/build_standalone_desktop.sh
```

---

## 6. Attribution & Open-Source License
- **Author & Creator:** Victory Ukpong
- **UI Theme:** Photoshop CS5 Dark Gray (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`)
- **License:** Apache-2.0
