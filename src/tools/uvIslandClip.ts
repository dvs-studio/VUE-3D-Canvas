/**
 * Build a single clip path from the active mesh UV triangles.
 *
 * The path is deliberately not dilated: paint must be constrained to actual
 * UV coverage. Brush edge antialiasing is provided by Canvas2D's clip rasterizer.
 */
import * as THREE from 'three';

export function buildUVIslandClipPath(
  geometry: THREE.BufferGeometry | null | undefined,
  width: number,
  height: number,
  uvArray?: Float32Array,
): Path2D | null {
  if (!geometry || typeof Path2D === 'undefined') return null;
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
  const uv = uvArray || (uvAttribute?.array as Float32Array | undefined);
  if (!position || !uv || uv.length < position.count * 2) return null;

  const path = new Path2D();
  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  let triangles = 0;
  for (let i = 0; i + 2 < count; i += 3) {
    const a = index ? index.getX(i) : i;
    const b = index ? index.getX(i + 1) : i + 1;
    const c = index ? index.getX(i + 2) : i + 2;
    const ax = uv[a * 2] * width, ay = (1 - uv[a * 2 + 1]) * height;
    const bx = uv[b * 2] * width, by = (1 - uv[b * 2 + 1]) * height;
    const cx = uv[c * 2] * width, cy = (1 - uv[c * 2 + 1]) * height;
    if (![ax, ay, bx, by, cx, cy].every(Number.isFinite)) continue;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-8) continue;
    path.moveTo(ax, ay);
    path.lineTo(bx, by);
    path.lineTo(cx, cy);
    path.closePath();
    triangles++;
  }
  return triangles ? path : null;
}
