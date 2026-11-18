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

// Preserve hand-maintained self-host support assets while replacing all generated app bundles.
const preserved = path.join(root, '.self-host-preserved');
fs.rmSync(preserved, { recursive: true, force: true });
fs.mkdirSync(preserved, { recursive: true });
for (const rel of ['assets/Gizmo', 'help.docx', 'help.pdf', 'tutorial.pdf', 'signature.svg']) {
  const source = path.join(pub, rel);
  if (fs.existsSync(source)) {
    const target = path.join(preserved, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true });
  }
}
fs.rmSync(pub, { recursive: true, force: true });
fs.cpSync(dist, pub, { recursive: true });
for (const rel of ['assets/Gizmo', 'help.docx', 'help.pdf', 'tutorial.pdf', 'signature.svg']) {
  const source = path.join(preserved, rel);
  if (fs.existsSync(source)) {
    const target = path.join(pub, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true });
  }
}
fs.rmSync(preserved, { recursive: true, force: true });

const publicIndex = path.join(pub, 'index.html');
let html = fs.readFileSync(publicIndex, 'utf8');
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (tag, href) => {
  if (/^https?:/i.test(href)) return tag;
  const file = path.join(pub, href.replace(/^\.\//, ''));
  if (!fs.existsSync(file)) return tag;
  const css = fs.readFileSync(file, 'utf8');
  return `<style>\n${css}\n</style>`;
});
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (tag, src) => {
  if (/^https?:/i.test(src)) return tag;
  const file = path.join(pub, src.replace(/^\.\//, ''));
  if (!fs.existsSync(file)) return tag;
  const js = fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">\n${js}\n</script>`;
});
fs.writeFileSync(publicIndex, html);
if (/src="[^"]+\.js"/.test(html)) {
  console.error('self-host/public/index.html still points at an external script.');
  process.exit(1);
}
console.log(`self-host/public now serves ${bundles.join(', ')} inlined into index.html for file:// and http://`);
