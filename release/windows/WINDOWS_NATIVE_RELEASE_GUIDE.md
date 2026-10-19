# VUE 3D Canvas - Native Windows Release Guide (DirectX 11 / OpenGL)

**Author / Creator:** Victory Ukpong  
**Architecture:** Rust Native Desktop Binary (`vue_3d_canvas.exe`)  
**Graphics APIs:** Direct Direct3D 11 (HLSL 5.0) & OpenGL 2.0+ Core Fallback  
**Target IDE:** Visual Studio Code — *Zero Visual Studio Community Edition Required*  

---

## 1. Why Native Windows (.exe) vs. WebGL?

If you experienced sluggishness or high latency in the browser / WebGL environment on Windows, running the **Native Windows Executable (`vue_3d_canvas.exe`)** bypasses:
1. **WebGL Compositor Latency:** Eliminates Chromium/browser sandbox overhead and IPC context switches.
2. **Direct Hardware Context:** Directly binds to your GPU via **DirectX 11 (D3D11)** or **WGL/OpenGL**, providing instantaneous 60+ FPS brush strokes and surface projection.
3. **Zero-Copy Double-Buffered Swapchain:** Eliminates browser memory copies for large 4K and 8K textures.
4. **Hardware Tablet Stylus Precision:** Direct access to Windows Ink and Wintab tablet APIs with zero polling delay.

---

## 2. Compiling in Visual Studio Code (2 Options)

Open the project in **VS Code**. You do NOT need the 20-30 GB Visual Studio Community Edition IDE.

### Option A: Microsoft MSVC Build Tools (Headless CLI, ~1.5 GB)
1. Run in Windows PowerShell as Administrator (one-time setup):
   ```powershell
   winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools;includeRecommended"
   ```
2. Double-click `build_release_msvc.bat`, or in the VS Code Terminal run:
   ```powershell
   cargo build --release --bin vue_3d_canvas
   ```
3. The executable will be generated at `release/windows/bin/vue_3d_canvas.exe`.

### Option B: MinGW-w64 GNU (100% Free of Visual Studio)
1. Install MSYS2 / GCC (one-time setup):
   ```powershell
   winget install MSYS2.MSYS2
   ```
2. Double-click `build_release_gnu.bat`, or in the VS Code Terminal run:
   ```powershell
   rustup target add x86_64-pc-windows-gnu
   cargo build --release --target x86_64-pc-windows-gnu --bin vue_3d_canvas
   ```

---

## 3. Running the Native Application

Double-click `run_vue3d_native.bat` or run:
```powershell
.\bin\vue_3d_canvas.exe --dx11 --high-perf
```

### CLI Command Flags:
- `--dx11`: Direct3D 11 native hardware pipeline (Default on Windows 10/11).
- `--opengl`: OpenGL 2.0+ native hardware pipeline.
- `--high-perf`: Request dedicated high-performance discrete GPU clock rates.
- `--bench`: Run procedural triplanar & node graph benchmark (1,000,000 vector tests).
- `--xblend <FILE>`: Validate and inspect `.xblend` project files.
- `--serve 3000`: Launch native local network bridge.

---

## 4. Troubleshooting
- **Missing DLLs (`vcruntime140.dll`):** Install the lightweight [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) or compile via `build_release_gnu.bat` (statically linked GCC runtime).
- **GPU Driver Warning:** Ensure your GPU graphics drivers (NVIDIA, AMD, or Intel) are up to date. The engine supports any DirectX 11 Feature Level 10_0 or OpenGL 2.0+ GPU (Intel HD 4000+, GeForce 400+, Radeon HD 5000+).
