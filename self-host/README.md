# VUE 3D Canvas - Self-Hosted Full Programme

**Author / Creator:** Victory Ukpong  
**Version:** 0.1.0  
**License:** Apache-2.0  

---

## 1. Overview

This directory contains the **Self-Hosted Standalone Distribution** of **VUE 3D Canvas**. It allows you to run the complete 3D texture painting suite on your own machine, local network (LAN), or private VPS without any third-party cloud service, telemetry, or external dependencies.

### Features
- **Zero-Dependency Node Server:** Pure Node.js HTTP implementation (`server.js`) with WebAssembly MIME support and COOP/COEP isolation headers.
- **Local Persistent Storage:** Automatically stores `.xblend` project files in `./storage/projects/` and uploaded custom decals/textures in `./storage/textures/`.
- **VS Code First:** Designed to launch with a single click or command inside Visual Studio Code.
- **Docker & Docker Compose:** Ready for 1-command containerized deployment.
- **Cross-Platform:** Runs on Windows 10/11, macOS, Linux, and WSL.

---

## 2. Quick Start

### Method A: Using VS Code Integrated Terminal (Recommended)

1. Open the repository root or the `self-host/` folder in **Visual Studio Code**.
2. Open the integrated terminal (`Ctrl + ~` or `Cmd + ~`).
3. Run:
   ```bash
   node server.js
   ```
   Or using npm:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Method B: 1-Click Launch Scripts
- **Windows:** Double-click `start.bat`.
- **Linux / macOS:** Run `./start.sh`.

### Method C: Docker & Docker Compose
To run as a background service:
```bash
docker compose up -d
```
Access at `http://localhost:3000`. Storage is automatically mounted and preserved in a persistent Docker volume (`vue3d_canvas_data`).

---

## 3. Configuration & Options

The server can be configured via command-line flags or environment variables:

| Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--port <port>` | `PORT` | `3000` | Port for the HTTP server |
| `--host <ip>` | `HOST` | `0.0.0.0` | Bind host (`0.0.0.0` allows LAN access, `127.0.0.1` restricts to localhost) |

Example:
```bash
node server.js --port 8080 --host 0.0.0.0
```

---

## 4. REST API Endpoints

The self-hosted server provides built-in endpoints for integration:

- `GET /api/health` - Server health status, system uptime, and memory usage.
- `GET /api/projects` - List all saved `.xblend` project files.
- `POST /api/projects/save` - Save a `.xblend` project payload to disk.
- `GET /api/projects/:name` - Retrieve a saved project file.
- `GET /api/textures` - List uploaded custom textures and stamps.
- `POST /api/textures/upload` - Upload a PNG/JPEG texture to the server library.

---

## 5. Rebuilding Frontend Assets

If you make modifications to the source code in `src/`:
1. From the repository root, run:
   ```bash
   npm run build
   ```
2. Copy the fresh build to `self-host/public/`:
   ```bash
   # Linux / macOS
   cp -r dist/* self-host/public/

   # Windows PowerShell
   Copy-Item -Recurse -Force dist/* self-host/public/
   ```
