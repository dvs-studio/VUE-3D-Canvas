import * as THREE from 'three';

type GeometryAttribute = THREE.BufferAttribute | THREE.InterleavedBufferAttribute;

/**
 * Build an exact, non-dilated path from the active mesh UV triangles.
 * The path is only a live paint-space clipping aid; it is never baked into
 * a layer texture or included in an export.
 */
export function buildUVIslandClipPath(
  geometry: THREE.BufferGeometry | null | undefined,
  width: number,
  height: number,
  uvArray?: Float32Array,
): Path2D | null {
  if (!geometry || typeof Path2D === 'undefined' || width <= 0 || height <= 0) return null;

  const position = geometry.getAttribute('position') as GeometryAttribute | undefined;
  const uvAttribute = geometry.getAttribute('uv') as GeometryAttribute | undefined;
  if (!position || (!uvArray && (!uvAttribute || uvAttribute.count < position.count))) return null;
  if (uvArray && uvArray.length < position.count * 2) return null;

  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  const uvAt = (vertex: number) => uvArray
    ? { u: uvArray[vertex * 2], v: uvArray[vertex * 2 + 1] }
    : { u: uvAttribute!.getX(vertex), v: uvAttribute!.getY(vertex) };

  const path = new Path2D();
  let triangles = 0;
  for (let offset = 0; offset + 2 < count; offset += 3) {
    const a = index ? index.getX(offset) : offset;
    const b = index ? index.getX(offset + 1) : offset + 1;
    const c = index ? index.getX(offset + 2) : offset + 2;
    if ([a, b, c].some(vertex => !Number.isInteger(vertex) || vertex < 0 || vertex >= position.count)) continue;

    const ua = uvAt(a), ub = uvAt(b), uc = uvAt(c);
    const ax = ua.u * width, ay = (1 - ua.v) * height;
    const bx = ub.u * width, by = (1 - ub.v) * height;
    const cx = uc.u * width, cy = (1 - uc.v) * height;
    if (![ax, ay, bx, by, cx, cy].every(Number.isFinite)) continue;

    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-8) continue;

    path.moveTo(ax, ay);
    path.lineTo(bx, by);
    path.lineTo(cx, cy);
    path.closePath();
    triangles++;
  }

  return triangles > 0 ? path : null;
}
