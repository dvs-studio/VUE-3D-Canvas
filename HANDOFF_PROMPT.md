# Continuation prompt — paste this into the next AI account

Status: the desktop-window change is on `main` as commit `e6e4169`. The pre-execution note was commit `5c5d9f6`. Read `AGENTS.md` before editing.

You are continuing work on the private product repository https://github.com/dvs-studio/VUE-3D-Canvas (owner `dvs-studio`, default branch `main`). The author is Victory Ukpong. Read `AGENTS.md` and `AGENT_STATE.md` before you edit anything. When you finish a task, append the result to both files. Do not wipe the painting-feature ledger. Do not recreate the things this prompt retires.

## What the programme actually is

VUE 3D Canvas is a 3D texture-painting workstation. The application that already works inside Google AI Studio is the Vite + React + Three.js programme under `src/` (`src/App.tsx`, `src/renderer/Viewport3D.tsx`, `src/renderer/Viewport2D.tsx`, the `src/tools/` and `src/ui/` panels). It paints with WebGL. On Windows, WebView2 runs that WebGL through ANGLE, which talks to DirectX 11 (or OpenGL if launched with `--opengl`). That is the fast path. It is not a from-scratch D3D11 rewrite of the panels, and it must not become one unless Victory explicitly asks.

The project file is `.xblend` (max 3 undo states stored in the file, 1-step undo in the live session). Linked 3D assets by default. No ray tracing. No D3D12 requirement. UI skin is Photoshop CS5 dark (`#333333`, `#2b2b2b`, `#3c3c3c`, `#222222`).

## What was going wrong

`cargo build --release --bin vue_3d_canvas` used to succeed while producing the wrong programme. `crates/vue3d_core/src/main.rs` printed an ASCII banner and a `vue3d>` diagnostic shell. Lines that said "DirectX 11 pipeline initialized" only printed text. They did not create a device, a window, or the painting UI. Double-clicking that exe flashed a console and closed, or sat on that shell. That is the hello-world failure.

A second wrong path, `native_runner/vue_3d_canvas.c`, was a Winsock loopback HTTP server that opened a browser window. Victory does not want a server, a localhost URL, or a hosted copy as the application.

`python_desktop/` and `native_c/` were never in this repository. Old docs and old GitHub Actions told agents to keep rebuilding them. Those folders, and any workflow whose job is to zip or restore Python or C, stay deleted. Do not put them back.

`src/nodes/blender_28_importer.py` is a Blender `bpy` add-on script. It is not the Python desktop app. Leave it. `scripts/generate_help_docx.py` only builds the help document. Leave it.

## What this session is building

A Windows application, not a website:

- `npm run build` produces the real UI in `dist/` (`index.html` plus `assets/`). Vite `base` is already `'./'`.
- `crates/vue3d_core/src/main.rs` on Windows opens a native window (wry + tao + WebView2). There is no console hello-world and no listening server.
- The built files are loaded with an in-process custom protocol (`vue://localhost/...`, which WebView2 maps to `http://vue.localhost/...`). The files ship in a `ui/` folder beside `vue_3d_canvas.exe`.
- Before the webview is created, the process sets `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` so ANGLE uses DirectX 11. `--opengl` uses OpenGL. The in-app GPU menu writes `gpu-backend.txt` and restarts the exe.
- WebGL contexts in `Viewport3D.tsx` and `NavigatorPanel.tsx` request `powerPreference: 'high-performance'`.
- The only GitHub Action is `.github/workflows/build-windows-app.yml`. It is `workflow_dispatch` only. Victory runs it by hand: Actions tab → "Build Windows Application" → Run workflow. The artifact is `VUE_3D_Canvas_Windows.zip`. Inside: `vue_3d_canvas.exe` and `ui/`. Extract the whole zip. Do not separate the exe from `ui/`.
- Windows 11 already includes WebView2. Windows 10 needs the Evergreen WebView2 Runtime if the window does not open. A failure is written to `vue3d-startup-error.log` beside the exe, not to a fake success banner.

## Do not do these

- Do not bring back `.github/workflows/build-all.yml`, `windows-build.yml`, `build-windows-rust.yml`, `build-self-host.yml`, `export-rust.yml`, `import-extract.yml`, `backup-codebases.yml`, or `restore-backup.yml`.
- Do not make `cargo build` the product. The product is the window showing the React painting UI.
- Do not open `index.html` with `file://` or `cmd /c start`. ES modules will be a blank page.
- Do not add a Node, Python, or Winsock server as the way the desktop app launches.
- Do not recreate `python_desktop/`, `native_c/`, or `native_runner/`.
- Do not claim DirectX is active unless ANGLE or a real device is actually created.
- Do not depend on D3D12 or ray tracing.

## If you are the next session

1. Append a pre-execution note to `AGENTS.md` and push it before other edits.
2. `git clone` `https://github.com/dvs-studio/VUE-3D-Canvas` and read `HANDOFF_PROMPT.md`, `AGENTS.md`, and `AGENT_STATE.md`.
3. Confirm the Windows workflow still builds `dist/index.html` and `vue_3d_canvas.exe`, and that `main.rs` opens the wry window instead of a diagnostic shell.
4. Continue only the gap Victory names. Likely leftovers: the GPU menu must keep matching ANGLE after restart, the packaged zip must contain every Vite asset, and a double-click on a machine with WebView2 must show the same UI as AI Studio, not a terminal.
5. Append the post-execution note to `AGENTS.md` and `AGENT_STATE.md` when you stop.

## Useful paths

| Path | Role |
|---|---|
| `src/App.tsx` | Shell, composite canvas, GPU menu state `vue3d_gpu_backend` |
| `src/renderer/Viewport3D.tsx` | Three.js WebGL painting view |
| `src/ui/panels/NavigatorPanel.tsx` | Small 3D navigator, also WebGL |
| `crates/vue3d_core/src/lib.rs` | Rust library / WASM hooks, not the window |
| `crates/vue3d_core/src/main.rs` | Windows window process |
| `crates/vue3d_core/src/desktop.rs` | WebView2 window, custom protocol, ANGLE flags |
| `crates/vue3d_core/Cargo.toml` | `vue_3d_canvas` bin; wry/tao only on Windows |
| `.github/workflows/build-windows-app.yml` | Manual Windows package |
| `XBLEND_FORMAT_SPECIFICATION.md` | Project format |
| `self-host/` | Old Node hosting folder. Not the desktop product. |

## Status after 2026-11-03

The esbuild peer conflict named in the 2026-11-03 pre-execution note is fixed. `package.json` pins `esbuild@^0.28.0`. `npm install` and `npm run build` were verified (`dist/index.html` and a JavaScript bundle). The manual Windows workflow has still not been clicked. Do not rebuild Python, native C, or a server. If Victory asks for the next step, it is Actions → Build Windows Application, then confirm the zip contains `vue_3d_canvas.exe` and `ui/` with `index.html` and the JS bundle.

## Status after the self-hosted standalone

Victory asked for a self-hosted app that is not the exe. That package is `self-host/`. `public/` now matches the painter build (`index-B-mwzPmH.js`). Start it with `node server.js` inside `self-host/`, `start.bat`, or `npm run host`. The Windows exe workflow is still manual and was not run. Do not recreate Python, native C, `native_runner/`, or the deleted GitHub workflows. Do not open the UI with `file://`.
