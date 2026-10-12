# VUE 3D Canvas

**Author / Creator:** Victory Ukpong  
**Target Architecture:** Rust Core + WASM-first (Browser Testing) + Native Windows Desktop (DirectX 11 / OpenGL 2.0 Fallback)  
**Project Format:** `.xblend` (Linked 3D Assets Default + 3-State Undo Ring Buffer)  

---

## 1. Project Overview & Philosophy

**VUE 3D Canvas** is an ultra-lightweight, high-performance 3D texture painting and digital sculpting workstation designed with a low memory footprint and zero raytracing or D3D12 dependency.

The software fuses the productivity paradigms of classic digital art suites:
- **Photoshop CS5 Fusion:** Dark gray workspace palette (`#333333`, `#2b2b2b`, `#3c3c3c`), layer stack, blend modes, marquee selectors, and separable filter pipelines.
- **Autodesk Sketchbook & MediBang:** Dockable Docker tab groups and a circular carousel brush wheel (`V` key).
- **Blender 2.8+ Viewport:** Middle-mouse orbit/pan/zoom navigation, standard numpad camera hotkeys, quad split-view layout, and node graph evaluator.

---

## 2. Compiling for Windows Desktop (DirectX 11 & OpenGL)

### Prerequisites
1. **Rust Toolchain:** Install `rustup` from [https://rustup.rs](https://rustup.rs).
2. **MSVC Build Tools:** Visual Studio 2019/2022 with **Desktop development with C++** and the Windows 10/11 SDK.
3. **DirectX 11 SDK:** Included with the Windows SDK (provides `fxc.exe` for HLSL shader compilation).

### Configuration & Build
Open a Developer Command Prompt for VS or PowerShell:

```powershell
# Set default Rust target to MSVC 64-bit
rustup default stable-x86_64-pc-windows-msvc

# Navigate to project directory
cd vue-3d-canvas

# Build release executable
cargo build --release --target x86_64-pc-windows-msvc

# Run native Windows application
cargo run --release
```

### Release Binary Location
The compiled native executable will be located at:
```
target/x86_64-pc-windows-msvc/release/vue_3d_canvas.exe
```

---

## 3. Compiling for Linux & macOS

### Linux (Ubuntu / Debian / Fedora / Arch)
Install required development libraries for OpenGL, X11, and ALSA:

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y build-essential pkg-config libx11-dev libasound2-dev libgl1-mesa-dev libxcursor-dev libxrandr-dev libxi-dev

# Fedora
sudo dnf install -y gcc pkgconf-pkg-config libX11-devel alsa-lib-devel mesa-libGL-devel libXcursor-devel libXrandr-devel libXi-devel

# Compile release binary
cargo build --release
```

The native Linux binary will be located at `target/release/vue_3d_canvas`.

### macOS (Apple Silicon & Intel)
Ensure Xcode Command Line Tools are installed:

```bash
xcode-select --install

# Apple Silicon (M1/M2/M3)
cargo build --release --target aarch64-apple-darwin

# Intel Mac
cargo build --release --target x86_64-apple-darwin
```

---

## 4. WASM Compilation & Self-Hosting Guide

VUE 3D Canvas is designed from the ground up for instantaneous browser testing and self-hosted deployment using WebAssembly and WebGL.

### 1. Build WebAssembly Package with wasm-pack
Install `wasm-pack`:
```bash
cargo install wasm-pack
```

Build the optimized WASM output targeting web browsers:
```bash
wasm-pack build --target web --release --out-dir wasm_pkg
```

### 2. Frontend Web Client Build
The application uses Vite and React:
```bash
npm install
npm run build
```
This produces a static output directory in `dist/`.

### 3. Self-Hosting with Nginx
Create an Nginx configuration file (`/etc/nginx/conf.d/vue3dcanvas.conf`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/vue-3d-canvas/dist;
    index index.html;

    # Enable correct MIME types for WebAssembly
    types {
        application/wasm wasm;
        application/javascript js;
        text/css css;
        text/html html;
        image/svg+xml svg;
        image/png png;
        application/pdf pdf;
        application/vnd.openxmlformats-officedocument.wordprocessingml.document docx;
    }

    # Cross-Origin Isolation headers for SharedArrayBuffer & high-performance timers
    add_header Cross-Origin-Opener-Policy "same-origin";
    add_header Cross-Origin-Embedder-Policy "require-corp";

    # Gzip & Brotli compression for rapid initial load
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/wasm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(wasm|js|css|png|jpg|jpeg|gif|ico|svg|obj)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 4. Self-Hosting with Docker
Create a `Dockerfile` in the repository root:

```dockerfile
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run the container:
```bash
docker build -t vue-3d-canvas:latest .
docker run -d -p 3000:80 --name vue-3d-canvas-app vue-3d-canvas:latest
```
Access the application at `http://localhost:3000`.

### 5. Offline Local Testing
To test the web application locally without an external web server:
```bash
# Using Node.js
npx serve dist -p 3000

# Using Python 3
python3 -m http.server 3000 --directory dist
```

---

## 5. Feature Architecture Breakdown

| Module | Location | Description |
|---|---|---|
| **Symmetry Tool Docker** | `src/ui/panels/SymmetryPanel.tsx` | Cloning across X/Y/Z, + to - or - to + side selection, Mesh Origin vs 3D Virtual Cursor Locator with coordinate slider, 3D visual slice plane, and real-time bilateral mirror painting. Right-clicking the symmetry button in the top bar pops up the docker. |
| **Mask Painting Docker** | `src/ui/panels/MaskPanel.tsx` | Physical 2D selection masks on active texture that temporarily protect unselected pixels during 2D and 3D painting. Morphological feathering (blur), dilation (expand), and erosion (shrink). |
| **Pen Curve Vector Tool** | `src/tools/penVectorTool.ts` | Vector curve point placement, path closure, fill area with color, erase curve loop area, stroke with active brush, and right-click menu to convert curve into selection mask. |
| **Triplanar Box Filter** | `src/tools/fillSuite.ts` | UV-less XYZ box projection using YZ, XZ, XY coordinates, normal-based weighting with adjustable sharpness power, slope and altitude masks, and height-aware blending. |
| **Gaussian Blur Tool** | `src/tools/gaussianBlur.ts` | Image-editor style separable 1D convolution passes strictly targeting the selected layer. Radius 0.1 to 250px with Low (7x7), Medium (15x15), and High (31x31) presets and premultiplied alpha. |
| **Stochastic Layer Scattering** | `src/tools/stochasticScatter.ts` | Random stamp distribution with repeat mode (`number_of_repeats > 0`) or continuous stochastic non-repeating mode (`number_of_repeats = 0`), seed, density, scale, and blend modes. |
| **Jenny Stitch Studio** | `src/tools/stitchStudio.ts` | Follows 3D mesh vertex edge topology with displacement depth, thread shaders, and stitch spacing. |
| **Layer Conversions** | `src/tools/layerConversions.ts` | 1-click conversion to Bump Map (Grayscale height), Normal Map (Sobel RGB), or Alpha Clip Mask (Binary transparency). |
| **Undo / Redo Preferences** | `src/ui/UndoSettingsDialog.tsx` | Integrated into `Edit > Undo & Redo Settings (Ctrl+K)` to customize in-memory undo buffer state limit (3 to 120 states) with live RAM estimation. |
| **Help & Tutorial Docs** | `help.docx`, `public/help.pdf`, `public/tutorial.pdf` | Documentation and tutorial guides accessible from the `Help` menu. |

---

## 6. Project Specifications & Memory Constraints

- **`.xblend` File Format:** Custom specification saving layer stack, blend modes, node graphs, and 3-state undo ring buffer. Mesh models remain linked by default to preserve minimal project size.
- **Hardware Limits:** Compatible with DirectX 11 Feature Level 10_0 and WebGL 1.0/2.0 standard extensions without requiring DirectX 12 DXR hardware raytracing.
- **Attribution:** Open-source software created by Victory Ukpong.
