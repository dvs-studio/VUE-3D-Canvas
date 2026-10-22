# VUE 3D Canvas — Native C Production Engine

**Author & Creator:** Victory Ukpong  
**Version:** 0.1.0  
**Target Architecture:** Native Windows Desktop (DirectX 11 / Desktop OpenGL 2.0+) / Portable ANSI C99/C11  
**Runtime Footprint:** Ultra-lightweight (< 30 MB Heap, Zero WebGL / Zero Node / Zero Python dependencies)  
**Specification:** Max 3 undo states in `.xblend`, linked assets default, no ray-tracing or D3D12 dependency  

---

## 1. Overview & Capabilities

The **Native C Engine** provides a high-performance, bare-metal C implementation of the VUE 3D Canvas pipeline. It is architected for zero-overhead execution on Windows and embedded devices, providing direct hardware rendering via native DirectX 11 / OpenGL 2.0+ without web browsers, electron wrappers, or runtime interpreters.

### Core Modules
- **`include/vue3d.h`**: Core data structures for math vectors, RGBA pixels, layers, brush presets, undo snapshots, and camera state.
- **`include/surface_shading.h` & `src/renderer_gl.c`**:
  - `V3D_SHADING_DEF`: Default original vertex normals.
  - `V3D_SHADING_SMOOTH`: Angle-weighted shared vertex normals.
  - `V3D_SHADING_FLAT`: Faceted per-face polygon normals.
- **`include/brush_engine.h` & `src/brush_engine.c`**:
  - Lazy-mouse stroke stabilizer with configurable tether length.
  - Dual-coordinate interpolation ensuring smooth continuous dabs regardless of mouse polling rates.
  - Tip mask stencils (Grunge, Splat, Scratch, Dots, Cracks).
  - Pattern overlays (Checker, Carbon, Halftone, Leather, Wood, Weave).
  - Dual-point smudge blending and destination-out eraser math.
- **`include/xblend.h` & `src/xblend.c`**:
  - Compact serialization into standard `.xblend` project archives.
  - Clamped strictly to the **3-state undo ring buffer budget**.
- **Blender Drone Navigation & Axis Flip**:
  - Continuous 360° spherical turntable orbit.
  - Camera-relative planar panning.
  - First-person WASD+QE drone flight.
  - **Invert Axis Toggle**: Natural directional navigation with 1-command flip between standard and inverted mouse axes.

---

## 2. Directory Layout

```
native_c/
├── include/
│   ├── vue3d.h                 # Core engine definitions & structures
│   ├── brush_engine.h          # Brush stroke, smudge, mask API
│   ├── surface_shading.h       # Blender surface normal shaders
│   └── xblend.h                # .xblend project serializer
├── src/
│   ├── main.c                  # Application context & interactive shell
│   ├── brush_engine.c          # Painting & smudge implementation
│   ├── renderer_gl.c           # OpenGL / DirectX 11 camera & normal math
│   └── xblend.c                # JSON / binary project export
├── build_gcc.bat               # 1-click GCC/MinGW compiler for Windows
├── build_msvc.bat              # 1-click Visual Studio compiler for Windows
├── Makefile                    # Portable Unix/Linux makefile
├── README.md                   # This operational guide
├── HANDOFF.md                  # AI model governance ledger & architectural decisions
└── API.md                      # Complete C API function reference
```

---

## 3. How to Compile on Windows

### Option A: Using GCC / MinGW (Recommended)
Double-click `build_gcc.bat` or run:
```cmd
gcc -std=c99 -O2 src\main.c src\brush_engine.c src\renderer_gl.c src\xblend.c -Iinclude -o vue3d_native.exe -lopengl32 -lgdi32 -luser32 -lm
```

### Option B: Using Microsoft Visual C++ (MSVC)
Open the **Developer Command Prompt for VS** and run `build_msvc.bat` or:
```cmd
cl /O2 /W3 /Fe:vue3d_native.exe src\main.c src\brush_engine.c src\renderer_gl.c src\xblend.c /Iinclude opengl32.lib gdi32.lib user32.lib
```

### Option C: Compiling on Linux / macOS
```bash
make
./vue3d_native
```

---

## 4. Interactive Console Shell

The compiled binary launches directly into an interactive shell with diagnostic control:

```
vue3d-c> help

Commands:
  status                - View memory usage, layer count, and active camera position
  stroke [x1 y1 x2 y2]  - Simulate a brush stroke dab with lazy-mouse tether
  smudge                - Simulate a smudge/smear dab
  undo                  - Undo exactly 1 step (Ctrl+Z)
  redo                  - Redo exactly 1 step (Ctrl+Y)
  save [filename]       - Save active project to .xblend with 3-state ring buffer
  drone [on|off]        - Toggle Blender drone flight navigation (WASD+QE)
  axis [nat|inv]        - Toggle or set navigation mouse axis direction
  theme <cs5|bw78|modern|ps2022> - Switch UI theme
  exit                  - Terminate engine
```

---

## 5. Memory Management & Safety Rules

1. **Deterministic Allocation**: The application maintains a fixed composite canvas and layer allocation.
2. **Undo Pruning**: The runtime maintains up to 30 snapshots in memory, automatically pruning the oldest snapshot using `memmove` when capacity is exceeded.
3. **Strict `.xblend` Save Limit**: Regardless of runtime undo depth, `v3d_xblend_save()` strictly writes only the latest **3 states** to the project file.
4. **Context Cleanup**: Call `v3d_destroy_context(ctx)` to free all heap buffers upon exit.

---

## 6. AI Governance Directive
In accordance with `AGENTS.md`: Any future AI model modifying this directory must **ADD**, never remove, overwrite, truncate, or wipe prior architectural decisions or commit history, and must update `AGENT_STATE.md` and `HANDOFF.md` before and after tasks.
