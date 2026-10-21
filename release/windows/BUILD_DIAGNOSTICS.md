# VUE 3D Canvas - Windows Build Diagnostics & Native Execution Breakdown

**Author & Creator:** Victory Ukpong  
**Project:** VUE 3D Canvas  
**Architecture:** Rust Native Desktop Engine + DirectX 11 / OpenGL 2.0+ Core  

---

## 1. Why Did Your Previous Windows Builds Fail or Close Instantly?

Here is the exact diagnostic breakdown of what was occurring and how it has now been resolved:

### A. Missing `[[bin]]` Declaration in Cargo
* **What Happened:** Previously, `crates/vue3d_core/Cargo.toml` only specified `[lib]` with `crate-type = ["cdylib", "rlib"]`. 
* **The Result:** When running `cargo build --release`, Cargo only created `vue3d_core.dll` or `vue3d_core.lib` (dynamic and static libraries). It did **not** generate an `.exe` file in `target/release/`. 
* **The Fix:** We added explicit binary target declarations in `crates/vue3d_core/Cargo.toml`:
  ```toml
  [[bin]]
  name = "vue_3d_canvas"
  path = "src/main.rs"

  [[bin]]
  name = "vue_3d_canvas_console"
  path = "src/main.rs"
  ```
  Now, running `cargo build --release` produces both `vue_3d_canvas.exe` and `vue_3d_canvas_console.exe`.

### B. Instant Process Termination on Launch
* **What Happened:** In standard Windows behavior, when you double-click a console executable in File Explorer, Windows spawns a temporary terminal window, runs `main()`, and when `main()` reaches the final closing brace `}`, Windows **instantly closes** the window.
* **The Result:** The application appeared to "flash open and immediately disappear" after a few milliseconds.
* **The Fix:** We implemented an interactive, persistent terminal loop with command prompt (`vue3d> `), diagnostics, status monitoring, benchmark runners, and local server integration. The window **stays open** indefinitely until you explicitly type `exit` or close the window.

### C. Web Self-Host Slowness on Windows
* **Why it was sluggish:** Running a self-host web build through Windows browsers can suffer from throttled WebGL frame rates if Windows power management sets the browser to "Power Saver" (integrated Intel/AMD graphics instead of your dedicated GPU).
* **The Solution:** The native Windows build (`vue_3d_canvas.exe`) communicates directly with DirectX 11 (D3D11) and OpenGL hardware buffers with zero browser abstraction overhead.

---

## 2. Dual Windows Binary Outputs

We now build two distinct Windows executables:

| Binary Name | Target Mode | Purpose |
|---|---|---|
| `vue_3d_canvas_console.exe` | Interactive Terminal | Displays hardware graphics logs, active DirectX 11 / OpenGL fallback, live diagnostics, benchmarks, and interactive command prompt. Stays open continuously. |
| `vue_3d_canvas.exe` | Silent Desktop GUI | Standard desktop release without a background console window. |

---

## 3. How to Compile in 1 Click on Windows (Using VS Code)

You do **not** need the heavy 40GB Visual Studio Community Edition. You only need **VS Code** with the standard Rust toolchain.

### Option 1: Using VS Code Built-In Build Task
1. Open the project folder in **VS Code**.
2. Press `Ctrl + Shift + B` (or go to **Terminal -> Run Build Task...**).
3. Select **"3. Cargo Build Release (Native Windows .exe)"**.
4. The executables will be generated in:
   ```
   target/release/vue_3d_canvas.exe
   target/release/vue_3d_canvas_console.exe
   ```

### Option 2: Running via VS Code Terminal
Open the VS Code integrated terminal (`Ctrl + \``) and run:
```powershell
cargo build --release
```

To run the interactive console build directly:
```powershell
.\target\release\vue_3d_canvas_console.exe
```

### Option 3: Download Pre-Packaged GitHub Actions ZIP Artifact
Every commit pushed to the repository automatically triggers the GitHub Actions workflow (`.github/workflows/windows-build.yml` and `build-all.yml`). The workflow:
1. Runs on a Windows Server runner with high-performance DirectX 11 SDKs.
2. Compiles `vue_3d_canvas.exe` and `vue_3d_canvas_console.exe`.
3. Packages them into `vue-3d-canvas-windows-x64.zip` and uploads it to GitHub Releases / Actions Artifacts.

---

## 4. Interactive Console Commands Reference

When running `vue_3d_canvas_console.exe`:
- `status`: Displays current GPU backend, shader model, memory overhead, and .xblend undo ring buffer status.
- `serve`: Launches the local high-speed assets server on `http://127.0.0.1:3000`.
- `bench`: Runs the 1,000,000-vector triplanar and normal evaluation speed benchmark.
- `dx11`: Verifies the Direct3D 11 feature level 10_0+ pipeline state.
- `opengl`: Verifies the OpenGL 2.0+ core profile pipeline state.
- `clear`: Clears the terminal screen.
- `exit`: Safely terminates the application.
