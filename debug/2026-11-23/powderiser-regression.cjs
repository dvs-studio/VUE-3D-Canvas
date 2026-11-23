'use strict';
const assert = require('node:assert/strict');
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const hash = (x, y, seed) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
// Mirrors the Powderiser branch. The selectable strength expression models
// current (double-scaled) versus corrected code; this is not an app integration test.
function runPowderiser(source, width, height, uiNoise, shift, angleDeg, seed, corrected) {
  const out = new Uint8ClampedArray(source.length), dst = out, data = source;
  const noise = uiNoise / 100;
  const strength = clamp(corrected ? noise : noise / 100, 0, 1);
  const drift = clamp(shift || 12, 1, 48), a = angleDeg * Math.PI / 180;
  const dx = Math.cos(a), dy = Math.sin(a);
  dst.set(data);
  if (strength <= 0) return out;
  const selected = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const pixel = y * width + x, i = pixel * 4;
    if (data[i + 3] === 0) continue;
    const r = hash(x, y, seed);
    if (r < strength) { selected[pixel] = 1; dst[i + 3] = Math.round(data[i + 3] * (1 - strength) * 0.22); }
    else dst[i + 3] = Math.round(data[i + 3] * (1 - strength * 0.7));
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const pixel = y * width + x;
    if (!selected[pixel]) continue;
    const i = pixel * 4;
    const sx = clamp(Math.round(x + dx * drift * (0.25 + hash(x, y, seed + 19))), 0, width - 1);
    const sy = clamp(Math.round(y + dy * drift * (0.25 + hash(x, y, seed + 29))), 0, height - 1);
    const j = (sy * width + sx) * 4;
    const sourceAlpha = (data[i + 3] / 255) * (0.25 + 0.65 * (1 - strength));
    if (sourceAlpha <= 0) continue;
    const destAlpha = dst[j + 3] / 255, combinedAlpha = sourceAlpha + destAlpha * (1 - sourceAlpha);
    if (combinedAlpha <= 0) continue;
    for (let channel = 0; channel < 3; channel++)
      dst[j + channel] = Math.round((data[i + channel] * sourceAlpha + dst[j + channel] * destAlpha * (1 - sourceAlpha)) / combinedAlpha);
    dst[j + 3] = Math.round(combinedAlpha * 255);
  }
  return out;
}
function fixture(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    data[i] = (x * 3 + y) % 256; data[i + 1] = (y * 5 + x * 2) % 256;
    data[i + 2] = (x + y * 7) % 256; data[i + 3] = 255;
  }
  return data;
}
function changedPixels(a, b) {
  let count = 0;
  for (let i = 0; i < a.length; i += 4)
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) count++;
  return count;
}
function changedAlpha(a, b) {
  let count = 0;
  for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i]) count++;
  return count;
}
const width = 128, height = 128, source = fixture(width, height);
for (const uiNoise of [25, 100]) {
  const oldResult = runPowderiser(source, width, height, uiNoise, 6, 35, 211, false);
  const fixedResult = runPowderiser(source, width, height, uiNoise, 6, 35, 211, true);
  const oldChanged = changedPixels(source, oldResult), fixedChanged = changedPixels(source, fixedResult);
  const oldAlpha = changedAlpha(source, oldResult), fixedAlpha = changedAlpha(source, fixedResult);
  console.log(JSON.stringify({ uiNoise, oldStrength: uiNoise / 10000, fixedStrength: uiNoise / 100, oldChangedPixels: oldChanged, fixedChangedPixels: fixedChanged, oldAlphaChangedPixels: oldAlpha, fixedAlphaChangedPixels: fixedAlpha }));
  assert.ok(fixedChanged >= oldChanged, `expected corrected Powderiser to affect at least as many pixels at UI noise ${uiNoise}`);
  assert.ok(fixedAlpha > oldAlpha, `expected corrected Powderiser to alter more alpha pixels at UI noise ${uiNoise}`);
}
console.log('PASS: Powderiser strength scaling regression reproduced and corrected in local harness.');
