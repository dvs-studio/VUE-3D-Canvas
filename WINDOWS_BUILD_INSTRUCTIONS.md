# VUE 3D Canvas - Windows Compilation Guide (VS Code Edition)

**The build that produces the application is the manual GitHub Action `Build Windows Application` (`.github/workflows/build-windows-app.yml`), or `scripts\build_standalone_desktop.bat` on Windows.** It compiles the painting UI and a native window. It does not zip a console demo. Sections below that mention `python_desktop/`, `native_c/`, or older Actions are retired and must not be followed.

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

#### C. Run the Windows application
Copy `dist\index.html` and `dist\assets` into a `ui` folder beside `target\release\vue_3d_canvas.exe`, then double-click the exe. `scripts\build_standalone_desktop.bat` does this. There is no `--serve` mode.

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

### Retired
`native_c/` and `python_desktop/` are not in this repository and are not build targets. Do not recreate their packagers.

### C. Windows application folder (`scripts/`)
- **On Windows:** `scripts\build_standalone_desktop.bat`
- **Output:** `dist\VUE_3D_Canvas_Windows\vue_3d_canvas.exe` with a `ui` folder beside it
- **GitHub:** Actions → Build Windows Application → Run workflow. Download `VUE_3D_Canvas_Windows.zip`.

---

## 6. Windows application folder

`scripts\build_standalone_desktop.bat` writes `dist\VUE_3D_Canvas_Windows\`. Double-click `vue_3d_canvas.exe` in that folder. The `ui` folder must stay beside the exe. Do not launch `index.html` by itself, and do not use the removed diagnostic batch files. The same package is the artifact from the manual **Build Windows Application** workflow.

The Help menu GPU switch writes `gpu-backend.txt` and restarts the window so ANGLE can change between DirectX 11 and OpenGL.


