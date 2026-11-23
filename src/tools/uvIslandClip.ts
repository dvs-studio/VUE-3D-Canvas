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
/**
 * Test whether two raycasted surface triangles share a geometric edge but
 * encode that edge at different UV texel positions. This is the key distinction
 * between ordinary triangle transitions and an actual UV island seam.
 *
 * Three.js faceIndex identifies the intersected triangle; we compare its
 * geometric vertices in object space so this also works for duplicated,
 * non-indexed vertices used by split UV charts.
 */
export function isUVSeamTransition(
  geometry: THREE.BufferGeometry | null | undefined,
  previousFace: number | null,
  currentFace: number | null,
  width: number,
  height: number,
  uvArray?: Float32Array,
  tolerancePixels = 2,
): boolean {
  if (!geometry || previousFace == null || currentFace == null || previousFace === currentFace) return false;
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
  const uv = uvArray || (uvAttribute?.array as Float32Array | undefined);
  if (!position || !uv) return false;

  const index = geometry.getIndex();
  const tri = (face: number) => {
    const offset = face * 3;
    if (offset + 2 >= (index ? index.count : position.count)) return null;
    return [0, 1, 2].map(k => index ? index.getX(offset + k) : offset + k);
  };
  const a = tri(previousFace), b = tri(currentFace);
  if (!a || !b) return false;

  const bounds = new THREE.Box3().setFromBufferAttribute(position);
  const toleranceWorld = Math.max(1e-7, bounds.getSize(new THREE.Vector3()).length() * 1e-5);
  const common: { oldIndex: number; newIndex: number }[] = [];
  for (const oldIndex of a) {
    const oldPosition = new THREE.Vector3(position.getX(oldIndex), position.getY(oldIndex), position.getZ(oldIndex));
    for (const newIndex of b) {
      const newPosition = new THREE.Vector3(position.getX(newIndex), position.getY(newIndex), position.getZ(newIndex));
      if (oldPosition.distanceTo(newPosition) <= toleranceWorld) {
        common.push({ oldIndex, newIndex });
        break;
      }
    }
  }
  // A shared edge must have two common geometric endpoints. Sharing only a
  // vertex is not enough to establish immediate surface continuity.
  if (common.length < 2) return false;

  let totalDelta = 0;
  let splitEndpoints = 0;
  for (const pair of common.slice(0, 2)) {
    const oldU = uv[pair.oldIndex * 2], oldV = uv[pair.oldIndex * 2 + 1];
    const newU = uv[pair.newIndex * 2], newV = uv[pair.newIndex * 2 + 1];
    const du = (oldU - newU) * width;
    const dv = (oldV - newV) * height;
    const delta = Math.hypot(du, dv);
    totalDelta += delta;
    if (delta > tolerancePixels) splitEndpoints++;
  }
  return splitEndpoints === 2 && totalDelta / 2 > tolerancePixels;
}
