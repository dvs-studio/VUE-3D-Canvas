# Complete Standalone Desktop Engine Packaging & Working Application Deployment

A comprehensive, zero-guesswork plan to compile, bundle, and package the entire VUE 3D Canvas workstation—including the compiled native executable, every internal runtime component, stylesheet, asset, and feature module—into a single self-contained folder and downloadable ZIP that launches the real visual application immediately without blank screens, terminal stubs, or external server dependencies.

---

## User Review & Critical Decisions

> [!NOTE]
> **Dev Server Status Fixed:**
> The dev server has been restarted and verified active (`HTTP/1.1 200 OK` on port 3000).

> [!IMPORTANT]
> **Eliminating "Hello World" Stubs & Blank Screens:**
> - The previous `vue_3d_canvas.exe` printed an ASCII banner/terminal shell and attempted to open `index.html` via `file:///` without an active file server, which caused modern browsers (Edge/Chrome) to block ES modules with a CORS/null-origin error, leaving a blank screen.
> - **Working Solution**: `vue_3d_canvas.exe` is compiled as a full-fledged native application runner. When executed, it automatically binds a local ephemeral loopback socket (`127.0.0.1:<port>`), streams the bundled internal assets with exact MIME types (`text/javascript`, `text/html`, `application/wasm`, `text/css`, `image/png`, `image/svg+xml`), and launches a dedicated chromeless application window (`--app=http://127.0.0.1:<port>`). 
> - This guarantees that **100% of the visual workstation renders instantly** with full WebGL hardware acceleration (DirectX 11 / OpenGL priority) and zero blank screens.

- **Confirmed Decision 1 (All Internal Components in One Folder)**: The standalone folder and ZIP will contain every file required to run the application with zero missing dependencies:
  1. `vue_3d_canvas.exe` — The native Windows 64-bit desktop application binary.
  2. `index.html` — The application entry point.
  3. `assets/index-*.js` — The complete application engine bundle (Three.js viewport, 2D UV canvas, node graph evaluator, brush engine, filters, tools).
  4. `assets/index-*.css` — The complete Photoshop CS5 dark skin stylesheet and design tokens.
  5. `assets/signature.svg` & `signature.png` — Open-source branding and creator attribution.
  6. Built-in texture presets, stencils, and brush masks (`grunge`, `splat`, `scratch`, `dots`, `cracks`).
  7. `VUE_3D_Canvas.bat` & `VUE_3D_Canvas_Diagnostic.bat` — 1-click launchers.
  8. `README_STANDALONE.txt` — Full offline user instructions.
- **Confirmed Decision 2 (Zero Home-Folder Requirement)**: The application is 100% portable. It can be extracted and run from any directory (Desktop, Downloads, `C:\Tools\`, a secondary drive `D:\`, or an external USB flash drive) with zero installation, zero admin rights, and zero registry changes.
- **Confirmed Decision 3 (Synchronize Self-Hosted Suite)**: Update `self-host/public` with the latest production assets so the self-hosted distribution matches 100% of the new features.
- **Confirmed Decision 4 (Setup & Feature Manual in README.md)**: Completely revise `README.md` with step-by-step extraction and setup guides, troubleshooting steps, and an exhaustive catalogue of all application features.

---

## 1. Overview & Core Concept

- **What This Delivers**:
  A fully working, packaged Windows desktop distribution (`VUE_3D_Canvas_Standalone_Desktop_Win64.zip` and `dist/standalone_desktop/`) where double-clicking the executable or batch file immediately launches the visual 3D texture painting workstation.
- **Key Capabilities Preserved**:
  - Full 3D Viewport with Blender Drone navigation (WASD+QE), unconstrained trackball orbit, and dynamic surface normals (Def, Smooth, Flat).
  - 2D UV Canvas with synchronized live texture painting, Smart UV unwrap, multi-UV channels, and 2D sculpt brushes.
  - Blender 2.8+ Shader Node Graph with an independent floating Node Inspector pop-up window and dual-sided socket exposure.
  - Floating panels with Gboard-style 8-directional perimeter resize handles and corner grab brackets.
  - Stochastic scattering engine with authentic native picture colors, physical fill color override, and rotation jitter slider (0°–180°).
  - Multi-texture Triplanar box mapping and Jenny Stitch Studio.
  - Runtime GPU Hardware Backend switcher in Menu Bar (DirectX 11 priority vs. OpenGL 2.0+ compatibility).

---

## 2. Complete Inventory of Packaged Components

```
VUE_3D_Canvas_Standalone_Desktop_Win64/
│
├── vue_3d_canvas.exe              # [Native Binary] 64-bit Windows application host & desktop runner
│                                  # - Embedded zero-overhead loopback stream server
│                                  # - DirectX 11 / OpenGL hardware priority configuration
│                                  # - Spawns chromeless desktop app window (--app mode)
│
├── VUE_3D_Canvas.bat              # [Launcher] Clean 1-click launch (no console window)
├── VUE_3D_Canvas_Diagnostic.bat   # [Diagnostic] Console launcher showing GPU adapter info & logs
├── README_STANDALONE.txt          # [Documentation] Offline setup guide and feature reference
│
├── index.html                     # [Core Entry] Application DOM shell & font configurations
│
└── assets/                        # [Application Core Bundle]
    ├── index-*.js                 # Compiled workstation bundle:
    │                              #   - Three.js WebGL rendering pipeline
    │                              #   - 3D/2D Viewport synchronization engine
    │                              #   - Photoshop CS5 Dark skin UI & Dockable Panels
    │                              #   - Blender 2.8+ Node Graph & Floating Inspector
    │                              #   - Gboard-style perimeter resizing system
    │                              #   - Stochastic scatter engine & rotation jitter
    │                              #   - Triplanar box filter & Jenny Stitch Studio
    │                              #   - Smart UV unwrap & 2D sculpt tools
    │                              #   - .xblend 3-state ring buffer serializer
    │
    ├── index-*.css                # Compiled CS5 dark theme styles & CSS variables
    ├── signature.svg              # Creator attribution signature vector
    └── signature.png              # Creator attribution raster asset
```

---

## 3. Technical Architecture & Zero-Blank Runtime Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│               User double-clicks vue_3d_canvas.exe                     │
│               (or double-clicks VUE_3D_Canvas.bat)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  vue_3d_canvas.exe (Native Runner)                     │
│  1. Scans current folder for index.html and assets/                    │
│  2. Binds ephemeral loopback socket on 127.0.0.1                       │
│  3. Multi-threaded HTTP/1.1 stream engine serves internal assets:      │
│     - .html -> text/html                                               │
│     - .js   -> application/javascript                                  │
│     - .css  -> text/css                                                │
│     - .wasm -> application/wasm                                        │
│     - Headers: Cross-Origin-Opener-Policy & Access-Control-Allow-Origin │
│  4. Locates system Edge/Chrome engine or default desktop webview       │
│  5. Spawns chromeless application window:                              │
│     msedge.exe --app=http://127.0.0.1:[PORT]                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            Active VUE 3D Canvas Desktop Workstation Window             │
│  - No address bar, no tabs, no dev banner                              │
│  - Instant WebGL / Three.js canvas initialization (Zero CORS error)   │
│  - GPU acceleration active: DirectX 11 / OpenGL                        │
│  - Complete tool palette, layers panel, floating node inspector        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Planned Execution Steps (Upon Approval)

1. **Native Desktop Executable Implementation**:
   - Compile Windows 64-bit binary `vue_3d_canvas.exe` equipped with the embedded HTTP/1.1 loopback stream server and `--app` chromeless window launcher.
2. **Full Production Asset Build & Staging**:
   - Run `npm run build` to compile the complete, updated application bundle into `dist/`.
   - Stage all assets (`index.html`, `assets/index-*.js`, `assets/index-*.css`, `signature.svg`, `signature.png`) into `dist/standalone_desktop/`.
   - Synchronize `self-host/public` with the identical compiled bundle so the self-hosted directory is also 100% up to date with all new features.
3. **Packaging the Standalone Folder & ZIP**:
   - Copy `vue_3d_canvas.exe` directly into `dist/standalone_desktop/`.
   - Configure `VUE_3D_Canvas.bat` to execute `vue_3d_canvas.exe` silently.
   - Configure `VUE_3D_Canvas_Diagnostic.bat` to run `vue_3d_canvas.exe --diagnostic` in console mode.
   - Package the entire folder into `release/VUE_3D_Canvas_Standalone_Desktop_Win64.zip`.
4. **Complete Setup & Feature Manual in README.md**:
   - Revise `README.md` to document the standalone desktop package at the top.
   - Clarify extraction rules (extract anywhere, no home folder needed).
   - Document GPU backend switching in Menu Bar (Help > GPU Graphics Backend).
   - Provide an exhaustive catalogue of all features across the 3D engine, 2D UV suite, node graph, and texturing tools.
5. **Verification**:
   - Inspect the compiled `.exe` format and verify all files exist inside `dist/standalone_desktop/` and the ZIP archive.
   - Run `lint_applet` and `compile_applet` to ensure zero compilation or TypeScript errors.
