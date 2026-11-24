import * as THREE from 'three';

type GeometryAttribute = THREE.BufferAttribute | THREE.InterleavedBufferAttribute;

interface UVIslandCacheEntry {
  position: GeometryAttribute;
  uv: GeometryAttribute;
  index: THREE.BufferAttribute | null;
  positionVersion: number;
  uvVersion: number;
  indexVersion: number;
  ids: Int32Array;
}

const cache = new WeakMap<THREE.BufferGeometry, UVIslandCacheEntry>();
const POSITION_EPSILON = 1e-5;
const UV_EPSILON = 1e-5;

const attributeVersion = (attribute: GeometryAttribute | THREE.BufferAttribute | null): number => {
  if (!attribute) return -1;
  const value = attribute as GeometryAttribute & { version?: number; data?: { version?: number } };
  return value.version ?? value.data?.version ?? 0;
};

const quantizedPosition = (value: number) => Math.round(value / POSITION_EPSILON);

const sameUV = (a: number, b: number) => Math.abs(a - b) <= UV_EPSILON;

/**
 * Builds a per-triangle UV-island index by connecting triangles only when
 * they share a geometric edge whose UV coordinates agree at both endpoints.
 * Position matching also recognises duplicated vertices along UV seams.
 */
export function getUVIslandIds(geometry: THREE.BufferGeometry): Int32Array | null {
  const position = geometry.getAttribute('position') as GeometryAttribute | undefined;
  const uv = geometry.getAttribute('uv') as GeometryAttribute | undefined;
  const index = geometry.getIndex();

  if (!position || !uv || uv.itemSize < 2) return null;

  const faceCount = Math.floor((index?.count ?? position.count) / 3);
  if (faceCount < 1) return null;

  const positionVersion = attributeVersion(position);
  const uvVersion = attributeVersion(uv);
  const indexVersion = attributeVersion(index);
  const cached = cache.get(geometry);
  if (
    cached &&
    cached.position === position &&
    cached.uv === uv &&
    cached.index === index &&
    cached.positionVersion === positionVersion &&
    cached.uvVersion === uvVersion &&
    cached.indexVersion === indexVersion &&
    cached.ids.length === faceCount
  ) {
    return cached.ids;
  }

  const parent = new Int32Array(faceCount);
  const rank = new Uint8Array(faceCount);
  for (let i = 0; i < faceCount; i++) parent[i] = i;

  const find = (value: number): number => {
    let root = value;
    while (parent[root] !== root) root = parent[root];
    while (parent[value] !== value) {
      const next = parent[value];
      parent[value] = root;
      value = next;
    }
    return root;
  };

  const unite = (a: number, b: number) => {
    let rootA = find(a);
    let rootB = find(b);
    if (rootA === rootB) return;
    if (rank[rootA] < rank[rootB]) [rootA, rootB] = [rootB, rootA];
    parent[rootB] = rootA;
    if (rank[rootA] === rank[rootB]) rank[rootA]++;
  };

  interface EdgeUse {
    face: number;
    startU: number;
    startV: number;
    endU: number;
    endV: number;
  }

  const edges = new Map<string, EdgeUse[]>();
  const vertexAt = (element: number) => index ? index.getX(element) : element;

  const positionKey = (vertex: number) => {
    const x = quantizedPosition(position.getX(vertex));
    const y = quantizedPosition(position.getY(vertex));
    const z = quantizedPosition(position.getZ(vertex));
    return `${x},${y},${z}`;
  };

  for (let face = 0; face < faceCount; face++) {
    const element = face * 3;
    const vertices = [vertexAt(element), vertexAt(element + 1), vertexAt(element + 2)];
    if (vertices.some(vertex => !Number.isInteger(vertex) || vertex < 0 || vertex >= position.count || vertex >= uv.count)) continue;

    for (const [from, to] of [[0, 1], [1, 2], [2, 0]] as const) {
      const a = vertices[from];
      const b = vertices[to];
      const keyA = positionKey(a);
      const keyB = positionKey(b);
      if (keyA === keyB) continue;

      const forward = keyA < keyB;
      const edgeKey = forward ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
      const startVertex = forward ? a : b;
      const endVertex = forward ? b : a;
      const use: EdgeUse = {
        face,
        startU: uv.getX(startVertex),
        startV: uv.getY(startVertex),
        endU: uv.getX(endVertex),
        endV: uv.getY(endVertex),
      };
      const uses = edges.get(edgeKey);
      if (uses) uses.push(use);
      else edges.set(edgeKey, [use]);
    }
  }

  for (const uses of edges.values()) {
    if (uses.length < 2) continue;
    for (let i = 0; i < uses.length; i++) {
      for (let j = i + 1; j < uses.length; j++) {
        const a = uses[i];
        const b = uses[j];
        if (
          sameUV(a.startU, b.startU) &&
          sameUV(a.startV, b.startV) &&
          sameUV(a.endU, b.endU) &&
          sameUV(a.endV, b.endV)
        ) {
          unite(a.face, b.face);
        }
      }
    }
  }

  const rootToIsland = new Map<number, number>();
  const ids = new Int32Array(faceCount);
  for (let face = 0; face < faceCount; face++) {
    const root = find(face);
    let island = rootToIsland.get(root);
    if (island === undefined) {
      island = rootToIsland.size;
      rootToIsland.set(root, island);
    }
    ids[face] = island;
  }

  cache.set(geometry, {
    position,
    uv,
    index,
    positionVersion,
    uvVersion,
    indexVersion,
    ids,
  });
  return ids;
}
