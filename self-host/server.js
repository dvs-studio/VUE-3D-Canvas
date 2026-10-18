/**
 * VUE 3D Canvas - Standalone Self-Hosted Server
 * Author / Creator: Victory Ukpong
 * 
 * High-performance, zero-dependency self-hosted distribution server for VUE 3D Canvas.
 * Features:
 * - High-speed static file serving for WebGL, WebAssembly, and React SPA
 * - Automatic application/wasm MIME mapping & Cross-Origin-Opener-Policy headers
 * - Local filesystem persistence for .xblend projects and custom textures
 * - Zero external npm dependencies: runs on any standard Node.js runtime (v18+)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

const PORT = parseInt(process.env.PORT || getArg('--port', '3000'), 10);
const HOST = process.env.HOST || getArg('--host', '0.0.0.0');
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const STORAGE_DIR = path.resolve(__dirname, 'storage');
const PROJECTS_DIR = path.join(STORAGE_DIR, 'projects');
const TEXTURES_DIR = path.join(STORAGE_DIR, 'textures');

// Ensure storage directories exist
[STORAGE_DIR, PROJECTS_DIR, TEXTURES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.obj': 'text/plain; charset=utf-8',
  '.gltf': 'model/gltf+json',
  '.glb': 'model/gltf-binary',
  '.fbx': 'application/octet-stream',
  '.xblend': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // ----------------------------------------------------
  // API ROUTING
  // ----------------------------------------------------

  if (pathname.startsWith('/api/')) {
    // Health & System Info
    if (pathname === '/api/health' || pathname === '/api/status') {
      sendJson(res, 200, {
        status: 'online',
        app: 'VUE 3D Canvas Self-Hosted',
        version: '0.1.0',
        creator: 'Victory Ukpong',
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // List Projects
    if (pathname === '/api/projects' && req.method === 'GET') {
      try {
        const files = fs.readdirSync(PROJECTS_DIR);
        const projects = files
          .filter((f) => f.endsWith('.xblend'))
          .map((f) => {
            const stat = fs.statSync(path.join(PROJECTS_DIR, f));
            return {
              name: f,
              size: stat.size,
              updatedAt: stat.mtime.toISOString(),
            };
          });
        sendJson(res, 200, { projects });
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
      return;
    }

    // Save Project
    if (pathname === '/api/projects/save' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        let filename = (body.name || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_');
        if (!filename.endsWith('.xblend')) filename += '.xblend';

        const targetPath = path.join(PROJECTS_DIR, filename);
        const content = typeof body.data === 'string' ? body.data : JSON.stringify(body.data || body, null, 2);
        fs.writeFileSync(targetPath, content, 'utf-8');

        sendJson(res, 200, { success: true, filename, path: `/storage/projects/${filename}` });
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
      return;
    }

    // Load Project
    if (pathname.startsWith('/api/projects/') && req.method === 'GET') {
      const filename = path.basename(pathname.replace('/api/projects/', ''));
      const targetPath = path.join(PROJECTS_DIR, filename);
      if (fs.existsSync(targetPath)) {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(targetPath).pipe(res);
      } else {
        sendJson(res, 404, { error: 'Project not found' });
      }
      return;
    }

    // List Custom Textures
    if (pathname === '/api/textures' && req.method === 'GET') {
      try {
        const files = fs.readdirSync(TEXTURES_DIR);
        const textures = files.map((f) => ({
          name: f,
          url: `/storage/textures/${encodeURIComponent(f)}`,
        }));
        sendJson(res, 200, { textures });
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
      return;
    }

    // Upload Texture
    if (pathname === '/api/textures/upload' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        let filename = (body.name || `texture_${Date.now()}`).replace(/[^a-zA-Z0-9_.-]/g, '_');
        if (!path.extname(filename)) filename += '.png';

        const targetPath = path.join(TEXTURES_DIR, filename);
        if (body.dataUrl && body.dataUrl.includes(',')) {
          const base64Data = body.dataUrl.split(',')[1];
          fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
        } else if (body.data) {
          fs.writeFileSync(targetPath, Buffer.from(body.data, 'base64'));
        }

        sendJson(res, 200, { success: true, filename, url: `/storage/textures/${filename}` });
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
      return;
    }

    sendJson(res, 404, { error: 'Unknown API endpoint' });
    return;
  }

  // ----------------------------------------------------
  // STORAGE SERVING (Projects & Textures)
  // ----------------------------------------------------

  if (pathname.startsWith('/storage/')) {
    const relPath = pathname.replace('/storage/', '');
    const safePath = path.normalize(path.join(STORAGE_DIR, relPath));
    if (safePath.startsWith(STORAGE_DIR) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(safePath).pipe(res);
      return;
    }
  }

  // ----------------------------------------------------
  // STATIC ASSETS SERVING (Frontend SPA)
  // ----------------------------------------------------

  let requestedFile = pathname === '/' ? 'index.html' : pathname.slice(1);
  let filePath = path.normalize(path.join(PUBLIC_DIR, requestedFile));

  // Security: Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // SPA Fallback: If file doesn't exist, serve index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found - Public assets missing. Please run build script first.');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const headers = {
    'Content-Type': contentType,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'X-Content-Type-Options': 'nosniff',
  };

  // Cache static assets
  if (['.js', '.css', '.wasm', '.png', '.svg', '.jpg', '.woff2'].includes(ext)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['Cache-Control'] = 'no-cache';
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  const networkAddress = Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal);

  console.log('========================================================================');
  console.log('  VUE 3D Canvas - Self-Hosted Server');
  console.log('  Author / Creator: Victory Ukpong');
  console.log('========================================================================');
  console.log(`  Local URL    : ${localUrl}`);
  if (networkAddress) {
    console.log(`  Network URL  : http://${networkAddress.address}:${PORT}`);
  }
  console.log(`  Public Root  : ${PUBLIC_DIR}`);
  console.log(`  Storage Root : ${STORAGE_DIR}`);
  console.log('------------------------------------------------------------------------');
  console.log('  Ready to host in VS Code, terminal, or Docker container.');
  console.log('  Press Ctrl+C to terminate.');
  console.log('========================================================================\n');
});
