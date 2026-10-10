# VUE 3D Canvas - Windows Compilation & Build Guide
**Author / Creator:** Victory Ukpong  
**Project:** VUE 3D Canvas  
**Target Architecture:** Rust (Core/Logic) + WASM-first (Browser / Electron / Tauri) + Native Windows Desktop (DirectX 11 / OpenGL 2.0 Fallback)

---

## 1. Overview & System Requirements

VUE 3D Canvas is engineered with a strict **low-memory footprint**, linked-asset philosophy, and 3-state undo ring buffer adhering to the `.xblend` open format. It is designed to run seamlessly on Windows 10/11 with support for:
- **DirectX 11 (D3D11 / HLSL)** and **OpenGL 2.0+** fallbacks (no DirectX 12 or Raytracing hardware lock).
- **Wintab / Windows Ink Tablet Stylus API** (pressure, tilt, barrel twist dynamics).
- **Blender 2.8+ Node Graph Bridge** and ArmorPaint PBR layer structure.

### Minimum Hardware & Software
- **OS:** Windows 10 (64-bit) or Windows 11
- **RAM:** 4 GB minimum (optimized for low-end hardware)
- **GPU:** Any DirectX 11 or OpenGL 2.0 capable GPU (Intel HD 4000+, NVIDIA GeForce 400+, AMD Radeon HD 5000+)
- **Build Tools:**
  - [Node.js](https://nodejs.org/) v18.x or v20.x LTS
  - [Rustup](https://rustup.rs/) (stable-x86_64-pc-windows-msvc)
  - Microsoft Visual Studio C++ Build Tools (with "Desktop development with C++" workload)
  - [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) for compiling Rust to WASM

---

## 2. Option A: Web / WASM-First Build (Quickest)

This compiles the TypeScript/React frontend and WASM memory engine for local desktop execution or browser testing.

### Step 1: Open Terminal (PowerShell or Command Prompt)
```powershell
cd C:\path\to\vue-3d-canvas
```

### Step 2: Install NPM Dependencies
```powershell
npm install
```

### Step 3: Run Local Development Server
```powershell
npm run dev
```
Open your browser at `http://localhost:3000` to run the application with full hardware acceleration.

### Step 4: Build Production Distribution
```powershell
npm run build
```
This generates the optimized static assets in the `/dist` directory. You can test the production build locally via:
```powershell
npm run preview
```

---

## 3. Option B: Compiling Native Windows Desktop Application (.exe)

To bundle VUE 3D Canvas as a standalone Windows `.exe` desktop application with direct hardware access, use **Tauri** (Rust native wrapper) or **Electron**.

### Method 1: Building with Tauri (Recommended for Low Memory & Native Speed)

1. **Install Tauri CLI**:
   ```powershell
   npm install --save-dev @tauri-apps/cli
   ```

2. **Initialize Tauri in Project**:
   ```powershell
   npx tauri init
   ```
   When prompted:
   - App name: `VUE 3D Canvas`
   - Window title: `VUE 3D Canvas - Victory Ukpong`
   - Web assets directory: `../dist`
   - Dev URL: `http://localhost:3000`

3. **Configure Tauri for DirectX 11 / WebView2**:
   Ensure `tauri.conf.json` specifies:
   ```json
   {
     "tauri": {
       "bundle": {
         "active": true,
         "targets": "msi",
         "identifier": "com.victoryukpong.vue3dcanvas"
       },
       "windows": [
         {
           "title": "VUE 3D Canvas",
           "width": 1400,
           "height": 900,
           "resizable": true,
           "fullscreen": false
         }
       ]
     }
   }
   ```

4. **Build the Standalone Windows Executable**:
   ```powershell
   npm run build
   npx tauri build
   ```
   The generated standalone executable and installer will be located at:
   `src-tauri\target\release\VUE 3D Canvas.exe`
   `src-tauri\target\release\bundle\msi\VUE 3D Canvas_x64.msi`

---

## 4. Option C: Compiling the Rust Core Engine via `wasm-pack`

If you are developing or modifying the low-level Rust data structures (`/src/core/`), compile them to WebAssembly for the browser runtime:

1. **Install wasm-pack**:
   ```powershell
   cargo install wasm-pack
   ```

2. **Compile to Release WASM**:
   ```powershell
   wasm-pack build --target web --release
   ```

3. **Verify Output**:
   The output `.wasm` binary and `.js` binding glue will be generated in `pkg/`.

---

## 5. Digital Pen Tablet & Wintab Configuration on Windows

VUE 3D Canvas supports pressure, tilt, and twist on digital drawing tablets (Wacom, Huion, XP-Pen, Microsoft Surface Pen):
- Ensure your tablet driver has **Windows Ink** enabled in the tablet control panel.
- In VUE 3D Canvas, toggle **Touch Nav: ON** on the top toolbar or bottom status bar. This activates the dual-mode interaction:
  - **Fingers:** Pan and pinch-to-zoom the 3D viewport or 2D UV canvas.
  - **Stylus Pen:** Directly paints with pressure sensitivity, tilt falloff, and stroke stabilization.

---

## 6. Troubleshooting Common Windows Build Issues

1. **`node-gyp` or C++ build tools error:**
   - Install Visual Studio Build Tools from `https://visualstudio.microsoft.com/visual-cpp-build-tools/` and select "Desktop development with C++".
2. **Execution policy error in PowerShell:**
   - Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
3. **WebView2 Missing (Windows 10 only):**
   - Windows 11 includes WebView2 by default. On older Windows 10 builds, download the evergreen WebView2 runtime from Microsoft.

---

*VUE 3D Canvas - Developed by Victory Ukpong. Licensed under the Apache-2.0 License.*
