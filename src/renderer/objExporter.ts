import * as THREE from 'three';

const cleanName = (value: string) => value.trim().replace(/[^a-zA-Z0-9_.-]+/g, '_') || 'VUE3D_Model';
const fmt = (value: number) => Number.isFinite(value) ? String(Number(value.toFixed(6))) : '0';

/**
 * Serializes the active BufferGeometry as a real Wavefront OBJ mesh.
 * UV override is an optional packed [u, v, ...] channel from geometry.userData.uvChannels.
 * The source geometry is read-only; this function never mutates it.
 */
export function geometryToOBJ(
  geometry: THREE.BufferGeometry,
  objectName = 'VUE3D_Model',
  uvOverride?: ArrayLike<number>
): string {
  const positions = geometry.getAttribute('position');
  if (!positions || positions.count < 3) {
    throw new Error('The active model has no exportable vertex positions.');
  }

  const uv = geometry.getAttribute('uv');
  const normals = geometry.getAttribute('normal');
  const useUVOverride = !!uvOverride && uvOverride.length >= positions.count * 2;
  const hasUV = useUVOverride || (!!uv && uv.count >= positions.count);
  const hasNormals = !!normals && normals.count >= positions.count;
  const index = geometry.getIndex();
  const elementCount = index ? index.count : positions.count;
  const safeObjectName = cleanName(objectName);
  const lines: string[] = [
    '# VUE 3D Canvas Wavefront OBJ Export',
    '# Author: Victory Ukpong',
    `o ${safeObjectName}`,
  ];

  for (let i = 0; i < positions.count; i++) {
    lines.push(`v ${fmt(positions.getX(i))} ${fmt(positions.getY(i))} ${fmt(positions.getZ(i))}`);
  }

  if (hasUV) {
    for (let i = 0; i < positions.count; i++) {
      const u = useUVOverride ? Number(uvOverride![i * 2]) : uv!.getX(i);
      const v = useUVOverride ? Number(uvOverride![i * 2 + 1]) : uv!.getY(i);
      lines.push(`vt ${fmt(u)} ${fmt(v)}`);
    }
  }

  if (hasNormals) {
    for (let i = 0; i < positions.count; i++) {
      lines.push(`vn ${fmt(normals!.getX(i))} ${fmt(normals!.getY(i))} ${fmt(normals!.getZ(i))}`);
    }
  }

  lines.push('s off');
  const groups = geometry.groups || [];
  let currentGroup = -2;
  for (let offset = 0; offset + 2 < elementCount; offset += 3) {
    const groupIndex = groups.findIndex(group => offset >= group.start && offset < group.start + group.count);
    if (groupIndex !== currentGroup) {
      currentGroup = groupIndex;
      const groupNames = geometry.userData?.groupNames as string[] | undefined;
      const label = groupIndex >= 0
        ? cleanName(groupNames?.[groupIndex] || `mesh_part_${groupIndex + 1}`)
        : safeObjectName;
      lines.push(`g ${label}`);
    }

    const a = index ? index.getX(offset) : offset;
    const b = index ? index.getX(offset + 1) : offset + 1;
    const c = index ? index.getX(offset + 2) : offset + 2;
    if ([a, b, c].some(vertex => !Number.isInteger(vertex) || vertex < 0 || vertex >= positions.count)) continue;

    const ref = (vertex: number) => {
      const n = vertex + 1;
      if (hasUV && hasNormals) return `${n}/${n}/${n}`;
      if (hasUV) return `${n}/${n}`;
      if (hasNormals) return `${n}//${n}`;
      return String(n);
    };
    lines.push(`f ${ref(a)} ${ref(b)} ${ref(c)}`);
  }

  return lines.join('\n') + '\n';
}
