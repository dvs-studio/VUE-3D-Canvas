import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const pub = path.join(root, 'self-host', 'public');
const index = path.join(dist, 'index.html');

if (!fs.existsSync(index)) {
  console.error('dist/index.html is missing. Run npm run build first.');
  process.exit(1);
}

const assetsDir = path.join(dist, 'assets');
const bundles = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter((name) => name.endsWith('.js'))
  : [];
if (bundles.length === 0) {
  console.error('dist/assets has no JavaScript bundle. Refusing to publish a blank self-host.');
  process.exit(1);
}

fs.rmSync(pub, { recursive: true, force: true });
fs.cpSync(dist, pub, { recursive: true });
console.log(`self-host/public now serves ${bundles.join(', ')}`);
