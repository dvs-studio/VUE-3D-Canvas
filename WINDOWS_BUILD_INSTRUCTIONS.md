# VUE 3D Canvas - Windows Compilation Guide (VS Code Edition)

**Author / Creator:** Victory Ukpong  
**Project:** VUE 3D Canvas  
**Target Environment:** Visual Studio Code (VS Code)  
*Note: This guide is designed exclusively for VS Code users. You do NOT need the heavy Visual Studio Community Edition IDE.*

---

## 1. Prerequisites Setup

You only need lightweight command-line tools and Visual Studio Code:

### Step 1: Install Visual Studio Code
Download and install [Visual Studio Code](https://code.visualstudio.com/).

### Step 2: Install Recommended VS Code Extensions
Launch VS Code, press `Ctrl + P`, and install:
- `ext install rust-lang.rust-analyzer`
- `ext install tamasfe.even-better-toml`
- `ext install dbaeumer.vscode-eslint`

### Step 3: Install Rustup
1. Download `rustup-init.exe` from [https://rustup.rs](https://rustup.rs).
2. Choose default installation (stable toolchain).

### Step 4: Install Lightweight C++ Compiler (No VS Community Needed)
Choose either of the following two options:

#### Option A: Standalone Visual Studio Build Tools (CLI Only, ~1.5 GB)
In PowerShell as Administrator:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"
```
*(This installs only the headless MSVC compiler and Windows SDK command-line tools without the 20GB+ Visual Studio Community GUI).*

#### Option B: MinGW-w64 (100% Free of Visual Studio)
If you prefer not to install any Microsoft build tools at all:
```powershell
# 1. Install MSYS2 MinGW-w64
winget install MSYS2.MSYS2

# 2. Add GNU target to Rust
rustup target add x86_64-pc-windows-gnu
rustup default stable-x86_64-pc-windows-gnu
```

### Step 5: Install Node.js
Download and install Node.js v18 or v20 LTS from [https://nodejs.org](https://nodejs.org).

---

## 2. Compiling and Running in VS Code

Open the project folder in VS Code (`File > Open Folder...`).

### Method 1: Using Pre-Configured VS Code Tasks
Press `Ctrl + Shift + B` (or menu `Terminal > Run Task...`):
- Select **`1. Run Dev Server (Vite)`** to start the local web application at `http://localhost:3000`.
- Select **`4. Cargo: Build Rust Core & Native CLI (Release)`** to compile `vue_3d_canvas.exe`.
- Select **`3. Run Self-Hosted Server`** to launch the standalone local self-hosted server.
- Select **`6. Package Self-Hosted Distribution (ZIP)`** to bundle the self-hosted distribution into a ZIP file.

### Method 2: Using the VS Code Integrated Terminal
Open the terminal (`Ctrl + ~`):

#### A. Run Development Server
```powershell
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

#### B. Compile Native Windows Executable (`vue_3d_canvas.exe`)
```powershell
cargo build --release --bin vue_3d_canvas
```
The resulting binary is located at:
```
target\release\vue_3d_canvas.exe
```

#### C. Run the Native Executable
```powershell
# Run benchmark
.\target\release\vue_3d_canvas.exe --bench

# Launch self-hosted native server on port 3000
.\target\release\vue_3d_canvas.exe --serve 3000
```

#### D. Compile WASM Module
```powershell
# Install wasm-pack
cargo install wasm-pack

# Build WASM
wasm-pack build crates\vue3d_core --target web --release --out-dir wasm_pkg
```

---

## 3. Running the Self-Hosted Version (`self-host/`)

A turnkey, self-hosted distribution is located in `self-host/`:

1. **One-Click Launch:**
   Double-click `self-host\start.bat`.
2. **From VS Code Terminal:**
   ```powershell
   node self-host\server.js
   ```
3. Open `http://localhost:3000`.
4. Projects are persistently stored in `self-host\storage\projects\` and textures in `self-host\storage\textures\`.

---

## 4. GitHub Actions CI & ZIP Artifacts

All workflow artifacts are zipped and ready for direct download.

---

## 5. Portable Multi-Language Windows Distributions (Binaries + DLLs in ZIP)

For maximum portability across different Windows computers without requiring development runtimes, dedicated packaging tools create self-contained ZIP distributions bundling executables, runtime DLLs (`SDL2.dll`, `glew32.dll`, Qt platform runtimes), assets, and zero-dependency `.bat` launchers:

### A. Native C Portable Windows ZIP (`native_c/`)
- **One-Click Packager:** Run `native_c\package_windows.bat` (or `./native_c/package_windows.sh` in bash/CI).
- **Output:** `native_c/dist/vue3d_native_c_win64_portable.zip`
- **Contents:**
  - `vue_3d_canvas_c.exe` (Stand-alone native C executable)
  - `SDL2.dll` (Hardware windowing and multi-touch input)
  - `glew32.dll` (OpenGL 2.0 / DirectX 11 GL driver)
  - `assets/` (Open-source attribution and brush presets)
  - `run_vue3d.bat` (Zero-dependency click-to-run launcher)

### B. Python Desktop Portable Windows ZIP (`python_desktop/`)
- **One-Click Packager:** Run `python_desktop\package_windows.bat` or `python python_desktop/package_windows.py`.
- **Output:** `python_desktop/dist/vue3d_python_win64_portable.zip`
- **Contents:**
  - `vue_3d_canvas_py.exe` / standalone Python runtime
  - Qt / PyQt platform DLLs and libraries
  - PyOpenGL, NumPy, and Pillow modules
  - `assets/` and `vue3d/` modules
  - `VUE_3D_Canvas.bat` (One-click portable launcher)

### C. Web / Rust Core Desktop Portable ZIP (`scripts/`)
- **One-Click Packager:** Run `scripts\package_windows_portable.bat` (or `./scripts/package_windows_portable.sh`).
- **Output:** `dist/vue3d_win64_portable.zip`
- **Contents:**
  - `vue_3d_canvas.exe` / production web application
  - `app/` pre-compiled production client workspace
  - `assets/`
  - `start_vue3d.bat` (Zero-dependency instant launcher)

