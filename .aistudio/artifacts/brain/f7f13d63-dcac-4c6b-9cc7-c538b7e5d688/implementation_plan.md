# Implementation Plan: Stochastic Scatter Fixes, Independent Node Inspector Pop-up, Gboard-Style Resizable Floating Editor, & Multi-Language Windows Portable Builds

## 1. Executive Summary & Architecture Overview
This revised plan integrates all requested capabilities with strict adherence to `RULE[AGENTS_md]` (Photoshop CS5 dark theme, low memory footprint, max 3 undo states, multi-language parity, non-destructive ledger updates):

1. **Stochastic Scatter Filter Fixes & Enhancements**:
   - **Image Color Preservation by Default**: Imported picture textures retain their authentic native colors without tinting or replacement when loaded into the scatter engine.
   - **Physical Fill Checkbox Logic**: The "Physical Fill" checkbox explicitly acts as the color-replacement gate:
     - *Unchecked (Default)*: Uses whatever colors are in the imported picture (or preset pattern).
     - *Checked*: Replaces/fills the image stamp silhouette with the primary/secondary physical color chosen in the dialog.
   - **Rotation Jitter Slider**: Added independent `rotationJitter` control (0° to 180°) alongside the base rotation range, allowing stochastic angular variation to be dialed in smoothly.
   - **Alpha Outline Effect**: Dilates the stamp mask with configurable spread and Gaussian blur before stamping.

2. **Independent Floating Node Inspector Pop-up Window**:
   - Decouple node parameter editing from inside the node graph canvas into a dedicated, independent floating pop-up window (`NodeInspectorPopup.tsx`).
   - The pop-up behaves as its own movable, draggable window with a Photoshop CS5 dark title bar, close/minimize buttons, parameter sliders/color pickers/steppers, socket exposure toggles, and live 2-way data binding to the node graph evaluator.
   - Users can position it anywhere on screen or side-by-side with the node editor, keeping the node graph clean and unencumbered.

3. **Gboard-Style Perimeter Resize Handles on Floating Windows**:
   - Upgrade floating panel frames (`DockablePanelFrame.tsx` and `NodeGraphPanel.tsx`) with comprehensive 8-zone perimeter resizing (Top, Bottom, Left, Right, Top-Left, Top-Right, Bottom-Left, Bottom-Right).
   - Replicate the Gboard floating window resize UX: when hovering or interacting near edges, glowing accent pills and corner brackets appear along the perimeter.
   - Provides responsive mouse/touch resize dragging with smooth clamping (min 440px width, min 320px height) and screen boundary protection.

4. **Multi-Language Windows Portable Builds (Web/Rust, Native C, Python Desktop)**:
   - Provide complete Windows portable packaging automation for all supported languages that bundles binaries, runtime DLLs, launcher scripts, and asset dependencies into self-contained portable ZIP distributions:
     - **Native C (`native_c/`)**: MinGW/MSVC portable build pipeline bundling `vue_3d_canvas_c.exe`, `SDL2.dll`, `glew32.dll`, C-runtime DLLs (`libgcc_s_seh-1.dll`, `libwinpthread-1.dll`, `libstdc++-6.dll`), assets, and a zero-dependency launcher `run_vue3d.bat` into `vue3d_native_c_win64_portable.zip`.
     - **Python Desktop (`python_desktop/`)**: Standalone packaging automation bundling Python runtime, all binary wheels (PyQt/PySide, PyOpenGL, Pillow, NumPy), MSVC runtime DLLs (`msvcp140.dll`, `vcruntime140.dll`), assets, and `VUE_3D_Canvas.bat` into `vue3d_python_win64_portable.zip`.
     - **Web / Rust Core**: Standalone portable packaging script producing `vue3d_win64_portable.zip` with compiled binaries, assets, and launcher.
   - Update `AGENT_STATE.md`, `native_c/HANDOFF.md`, and `python_desktop/HANDOFF.md` per mandatory governance.

---

## 2. Technical Breakdown & Detailed Design

### Part 1: Stochastic Scatter Filter Updates

#### Engine Architecture (`/src/tools/stochasticScatter.ts`)
- **`StochasticScatterConfig` Expansion**:
  - Add `rotationJitter?: number` (degrees, 0° to 180°).
  - Clarify `usePhysicalFillColor?: boolean` semantics.
- **Custom Image & Preset Color Handling**:
  - In `createStampCanvas`:
    - When `stampType === 'custom'`:
      - Draw imported image onto stamp canvas.
      - If `config.usePhysicalFillColor === true`: apply `globalCompositeOperation = 'source-in'` and fill with `config.primaryColor`.
      - If `!config.usePhysicalFillColor`: leave pristine native pixel colors of the imported image untouched.
    - When `stampType` is procedural (`grunge`, `splat`, `scratch`, `dots`, `cracks`, `hex`, `stars`, `leaves`, `circuit`):
      - If `!config.usePhysicalFillColor`: render with authentic theme colors (green for leaves, orange/gold for stars, cyan for circuit, amber for splat, etc.).
      - If `config.usePhysicalFillColor`: render with `config.primaryColor`.
- **Rotation Jitter Mathematics**:
  - In `applyScatter`:
    ```ts
    const baseRotDeg = prng.nextRange(config.rotationMin, config.rotationMax);
    const rotJitterDeg = config.rotationJitter ? prng.nextRange(-config.rotationJitter, config.rotationJitter) : 0;
    const finalRotRad = (baseRotDeg + rotJitterDeg) * (Math.PI / 180);
    ```

#### Dialog UI (`/src/ui/StochasticScatterDialog.tsx`)
- Set `usePhysicalFillColor` default state to `false`.
- When custom image is selected: preserve `usePhysicalFillColor = false` so image colors are immediately visible.
- Add "Rotation Jitter" slider (0° to 180°, step 1°, default 30°) right below rotation range inputs.
- Add clear explanatory subtitle under "Physical Fill" checkbox: "Unchecked: preserves original image & preset colors; Checked: replaces with chosen primary color".

---

### Part 2: Independent Floating Node Inspector Pop-up (`/src/ui/panels/NodeInspectorPopup.tsx`)

#### Architectural Design
- **Separation of Concerns**: The Node Graph canvas retains lightweight node representations with sockets and wires. Double-clicking or clicking a node opens/focuses the independent `NodeInspectorPopup`.
- **Window Behavior**:
  - Independent `z-index` floating window rendered at application level.
  - Draggable CS5 header (`#2b2b2b`, 1px solid `#3c3c3c`, subtle bevel) with move cursor.
  - Positionable anywhere across the screen, independent of whether the Node Graph is docked or floating.
  - Header controls: Category badge, editable node title, mute/bypass toggle, minimize, and close `X` button.
- **Inspector Content Sections**:
  - **Dynamic Parameter Controls**:
    - Sliders with numeric stepper inputs for float/int properties (Roughness, Metallic, Normal Strength, Scale, Detail, Distortion, etc.).
    - Color pickers with hex/RGB inputs for color properties (Base Color, Emission, Subsurface).
    - Dropdowns for blend modes, interpolation, and texture types.
  - **Socket Exposure Section**:
    - Two-column list of inputs (left) and outputs (right) with checkboxes to show/hide plugs on the node perimeter in the node editor.
  - **Live Reactivity**:
    - Dispatches parameter updates immediately to `onUpdateNode`, triggering live shader re-evaluation.

---

### Part 3: Gboard-Style Perimeter Resize Handles (`/src/ui/DockablePanelFrame.tsx` & `NodeGraphPanel.tsx`)

#### Architectural Design
- **8-Directional Perimeter Zone System**:
  - `top`, `bottom`, `left`, `right` edge zones (8px interactive border strips).
  - `top-left`, `top-right`, `bottom-left`, `bottom-right` corner zones (16x16px corner grab squares).
- **Gboard-Style Visual Pill & Accent Indicators**:
  - On hover or during resize, the active edges reveal centered rounded pills / accent grab bars (e.g. 36px x 4px glowing bar on top/bottom, 4px x 36px on sides, L-shaped brackets at corners).
  - Proper CSS cursor feedback: `ns-resize`, `ew-resize`, `nwse-resize`, `nesw-resize`.
- **Drag Resize Mathematics & Bounds Clamping**:
  - Pointer capture (`onPointerDown`, `setPointerCapture`, `onPointerMove`, `onPointerUp`) ensuring smooth resizing without lost drag focus even over iframes or 3D canvases.
  - Minimum dimensions: `width >= 440px`, `height >= 320px`.
  - Viewport boundary constraints: Prevents dragging window boundaries off the visible screen edges.

---

### Part 4: Windows Portable Build Pipelines for All Languages

#### 1. Native C (`native_c/`)
- **Scripts**: `native_c/package_windows.bat` & `native_c/package_windows.sh`
- **Output**: `native_c/dist/vue3d_native_c_win64_portable.zip`
- **Bundle Contents**:
  - `bin/vue_3d_canvas_c.exe`: Compiled Native C executable.
  - `bin/SDL2.dll`, `bin/glew32.dll`: Graphics and windowing runtime libraries.
  - `bin/libgcc_s_seh-1.dll`, `bin/libwinpthread-1.dll`, `bin/libstdc++-6.dll`: MinGW runtime dependencies.
  - `assets/`: Required brushes, shaders, and signatures.
  - `run_vue3d.bat`: Zero-setup launcher script setting relative `PATH` to `bin/` and launching `vue_3d_canvas_c.exe`.
  - `README_PORTABLE.txt`: Portability documentation and requirements.

#### 2. Python Desktop (`python_desktop/`)
- **Scripts**: `python_desktop/package_windows.py` & `python_desktop/package_windows.bat`
- **Output**: `python_desktop/dist/vue3d_python_win64_portable.zip`
- **Bundle Contents**:
  - Complete standalone distribution with bundled embeddable Python 3.11, pre-configured `.pth`.
  - All binary wheels and C-extensions: PyQt/PySide, PyOpenGL, Pillow, NumPy.
  - Visual C++ Runtime DLLs (`msvcp140.dll`, `vcruntime140.dll`, `vcruntime140_1.dll`).
  - `VUE_3D_Canvas.bat`: One-click portable launcher.
  - `verify_dependencies.py`: Self-check diagnostic script ensuring all DLLs and packages load cleanly.

#### 3. Rust Core / Web Native Target (`src/core/` & Root)
- **Scripts**: `scripts/package_windows_portable.sh` & `scripts/package_windows_portable.bat`
- **Output**: `dist/vue3d_win64_portable.zip`
- **Bundle Contents**:
  - Standalone release package including pre-compiled Rust/WASM binaries, offline asset bundles, portable runner, and launcher.

---

## 3. Step-by-Step Implementation Sequence

1. **Step 1: Stochastic Scatter Updates**:
   - Update `src/tools/stochasticScatter.ts`: Add `rotationJitter`, preserve custom image colors by default, update `usePhysicalFillColor` logic, and apply rotation jitter.
   - Update `src/ui/StochasticScatterDialog.tsx`: Wire `rotationJitter` slider, set `usePhysicalFillColor` default to `false`, and add clear user guidance.
2. **Step 2: Independent Floating Node Inspector Pop-up**:
   - Create `src/ui/panels/NodeInspectorPopup.tsx` with CS5 styling, draggable header, dynamic parameter controls, and socket exposure checkboxes.
   - Update `src/ui/panels/NodeGraphPanel.tsx` to emit `onInspectNode` and allow double clicking outside to escape.
   - Update `src/App.tsx` to host `NodeInspectorPopup` as an independent floating window.
3. **Step 3: Gboard-Style Perimeter Resize Handles**:
   - Enhance `src/ui/DockablePanelFrame.tsx` with resizable support and 8-zone Gboard perimeter pills and corner brackets.
   - Enable resizable on floating panels including `NodeGraphPanel`.
4. **Step 4: Windows Portable Build Pipelines**:
   - Create `native_c/package_windows.bat` & `native_c/package_windows.sh`.
   - Create `python_desktop/package_windows.py` & `python_desktop/package_windows.bat`.
   - Create `scripts/package_windows_portable.sh` & `scripts/package_windows_portable.bat`.
   - Update `WINDOWS_BUILD_INSTRUCTIONS.md`.
5. **Step 5: Documentation & Historical Ledgers**:
   - Update `AGENT_STATE.md`, `native_c/HANDOFF.md`, and `python_desktop/HANDOFF.md` per `RULE[AGENTS_md]`.
6. **Step 6: Verification**:
   - Run `lint_applet` (`npm run lint` / `tsc --noEmit`).
   - Run `compile_applet` (`npm run build`).
