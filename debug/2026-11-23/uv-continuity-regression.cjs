'use strict';
const assert = require('node:assert/strict');

// Candidate threshold logic for the S0-1 patch. It intentionally caps the
// allowed UV jump so a fast pointer event cannot hide a seam jump behind a
// large world-space travel estimate.
function shouldBreakUvPath(previous, current, brushSize, textureWidth, textureHeight, meshDiameter) {
  if (!previous || !current) return true;
  const uvDistance = Math.hypot(current.x - previous.x, current.y - previous.y);
  const worldDistance = Math.hypot(current.wx - previous.wx, current.wy - previous.wy, current.wz - previous.wz);
  const expectedTexelTravel = (worldDistance / Math.max(meshDiameter, 1e-6)) * Math.max(textureWidth, textureHeight);
  const upperBound = Math.max(brushSize * 8, 96);
  const threshold = Math.min(Math.max(brushSize * 1.5, expectedTexelTravel * 4 + brushSize * 0.5), upperBound);
  return uvDistance > threshold;
}
const prior = { x: 240, y: 320, wx: 0.01, wy: 0.02, wz: 0.00 };
const sameIsland = { x: 253, y: 329, wx: 0.015, wy: 0.025, wz: 0.00 };
const seamJump = { x: 910, y: 840, wx: 0.012, wy: 0.022, wz: 0.001 };
const fastSeamJump = { x: 840, y: 100, wx: 0.20, wy: 0.25, wz: 0.10 };
assert.equal(shouldBreakUvPath(prior, sameIsland, 16, 1024, 1024, 2), false, 'continuous same-island stroke should stay connected');
assert.equal(shouldBreakUvPath(prior, seamJump, 16, 1024, 1024, 2), true, 'UV island jump with tiny surface travel should break');
assert.equal(shouldBreakUvPath(prior, fastSeamJump, 16, 1024, 1024, 2), true, 'large UV jump must break even on a fast pointer event');
assert.equal(shouldBreakUvPath(prior, null, 16, 1024, 1024, 2), true, 'null raycast must break the path');
console.log('PASS: candidate UV continuity threshold covers same-island, seam, fast-seam and null-hit cases.');
