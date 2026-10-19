# Revised Implementation Plan - VUE 3D Canvas Enhancements & Native Windows Release

Implement movable non-blocking filter dialogs, clone stamp quick launches, alpha-aware grunge and torn edge decal engine with random rotation, mesh selector with name IDs and isolate checkbox, Help menu theme switch, and native Windows `.exe` release with direct DirectX 11 / OpenGL acceleration.

---

## Proposed Changes

### 1. UI Dialogs & Floating Non-Blocking Windows
#### [src/ui/PatternStampDialog.tsx]
- Convert modal into a draggable/movable floating Photoshop CS5 window:
  - Track `position` state `{ x, y }` with mouse drag handlers on the window title bar.
  - Remove full-screen blur backdrop overlay (`backdrop-blur-xs` and full-screen blocking `div`) so the 3D canvas and other UI remain visible and interactive in real time.
  - Allow pointer events to pass through around the window.
- Add **Grunge Image Texture Overlay**:
  - Embedded high-res procedural grunge textures (Scratched Metal, Weathered Concrete, Peeling Paint, Leaking Grime, Dust Noise).
  - Button to import custom user grunge image texture (`+ Custom Grunge Overlay`).
  - Strict alpha-masking: grunge texture only modulates color and alpha within the existing decal alpha boundary (`ctx.globalCompositeOperation = 'destination-in'`), never exceeding outside of it.
- Add **Torn Edge & Mask Alpha Engine**:
  - Torn edge erosion influenced by procedural noise OR imported B/W texture mask.
  - Import custom mask/torn texture button with centered alignment.
  - Rotation slider from `0` to `360`:
    - Value `0` rendered as `"Random"` in the UI, applying dynamic random rotation per tip/stamp.
    - Values `1`–`360°` apply manual rotation.
    - Add **Randomization + Scattering** toggle and angle jitter slider.
  - Mask texture strictly affects decal alpha channel without exceeding outer boundaries.

#### [src/tools/patternStampTool.ts]
- Upgrade decal generator engine:
  1. Centered imported image texture for mask and torn edges.
  2. B/W luminance / alpha evaluation for torn edge masking.
  3. Embedded and custom grunge image textures with strict alpha clamping ($A_{\text{final}} \le A_{\text{decal}}$).
  4. Dynamic rotation handling with `rotation === 0 ? Math.random() * 360 : rotation`.
  5. Scatter angle jitter logic.

---

### 2. Tool Launchers, Menu Bar & Mesh Selector
#### [src/ui/ToolBox.tsx]
- Add double-click handler (`onDoubleClick`) to the Clone Stamp tool button to immediately open the Pattern Stamp Tool dialog (`onOpenPatternStampDialog`).

#### [src/ui/ToolOptionsBar.tsx]
- When Clone Stamp (`clone`) or Pattern Stamp (`patternStamp`) is active:
  - In the empty space of the options bar, add a prominent button: `[Open Stamp Decal Studio...]` with a decal icon.

#### [src/ui/PhotoshopMenuBar.tsx]
- **Empty Space Top Button**: Add a direct `Decal Stamp Studio` shortcut button in the menu bar right-side empty space.
- **Mesh Visibility Selector**:
  - Show which isolated mesh is included by their name ID (e.g. `[ID: head] Main Head`, `[ID: eyes] Eyes`, `[ID: visor] Visor Plate`, etc.).
  - "Show All" option shows everything.
  - Add a dedicated checkbox: `"Show only selected group"` (or `"Isolate Selected Group Only"`).
- **Help Menu Theme Switch**: Add a `Theme` submenu / picker under the `Help` menu dropdown (CS5 Dark Gray, 78% Black & White, Modern Studio Slate, Photoshop 2022 Flat Graphite) with active checkmarks.

---

### 3. Native Windows Release Package (`release/windows/`)
#### [crates/vue3d_core & release/windows/]
- Dedicated native Windows `.exe` build:
  - Native Windows executable (`vue_3d_canvas.exe`) with direct DirectX 11 / OpenGL window and rendering loop, bypassing WebGL browser overhead.
  - Provide `release/windows/` with:
    - `build_release_msvc.bat` (VS Code friendly MSVC build script)
    - `build_release_gnu.bat` (MinGW-w64 build script, 100% free of Visual Studio)
    - `run_vue3d_native.bat` (Direct hardware accelerated native runner)
    - `WINDOWS_RELEASE_GUIDE.md` detailing native compilation and performance tuning.

---

## Verification Plan
1. **Movable Dialog & Real-Time Viewport**: Open Pattern Stamp Dialog; confirm no background blur or screen-lock overlay. Drag dialog by header; verify 3D model is visible and interactive.
2. **Clone Stamp Quick Launch**: Double-click Clone Stamp tool in Toolbox; verify dialog opens. Verify button in Tool Options Bar and Menu Bar empty space.
3. **Grunge & Torn Edge Alpha Awareness**: Test grunge overlay and torn edge with custom textures; confirm no bleed outside decal alpha boundary. Test rotation slider at 0 ("Random") and values > 0.
4. **Mesh Selector & Group Checkbox**: Verify visible mesh selector displays name IDs, "Show All" works, and "Show only selected group" checkbox isolates the selected group.
5. **Help Menu Theme Switch**: Verify theme switcher inside Help menu works smoothly.
6. **Native Windows Release Package**: Verify `release/windows/` contains native scripts and build configuration.
