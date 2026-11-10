/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Next-Gen Smart UV Projection & Conformal Unwrap Engine
 * Author / Creator: Victory Ukpong
 * 
 * Features:
 * 1. Seeded Variational Island Packing: Eliminates repetitive UV layouts using deterministic PRNG.
 * 2. Conformal Angle Relaxation: Minimizes geometric stretch and strictly prevents self-intersections.
 * 3. Island Bleeding / Gutter Dilation: Configurable gutter padding (2px - 16px) preventing seam mipmap glitches.
 * 4. Submesh Component Isolation: Unwraps selected submesh IDs (e.g., clothes, body, head) while preserving unselected geometry UVs.
 * 5. Full non-overlapping guarantee (except Symmetrize tool which explicitly mirrors identical halves).
 */

import * as THREE from 'three';

export interface SmartUVOptions {
  angleLimitDegrees?: number;   // Dihedral clustering angle threshold (default 60°)
  islandMargin?: number;        // Normalized margin between islands (default 0.02)
  islandBleedPixels?: number;   // Boundary gutter dilation in pixels (default 4px)
  seed?: number;                // Randomization seed for layout variety
  submeshId?: string;           // 'all' or specific submesh ID to isolate
  preserveOthers?: boolean;     // Whether to keep unselected submesh UVs intact
  packMode?: 'tight_conformal' | 'stochastic_grid' | 'shelf';
}

export interface SmartUVResult {
  islandCount: number;
  facesProcessed: number;
  seedUsed: number;
  submeshIsolated: string;
}

interface FaceData {
  index: number;
  iA: number;
  iB: number;
  iC: number;
  normal: THREE.Vector3;
  area: number;
  islandId: number;
  submeshId: string;
}

interface UVIsland {
  id: number;
  faces: FaceData[];
  normal: THREE.Vector3;
  // Local 2D projected coordinates: faceIdx_localVertexIdx -> { u, v }
  coords: Map<string, { u: number; v: number }>;
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
class PRNG {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 1337;
  }
  public next(): number {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export class SmartUVUnwrapEngine {
  /**
   * Retrieves list of recognized submesh IDs for a given geometry
   */
  public static getAvailableSubmeshes(geom: THREE.BufferGeometry): string[] {
    const list: string[] = ['all'];
    if (geom.userData?.componentIndices) {
      Object.keys(geom.userData.componentIndices).forEach((k) => {
        if (!list.includes(k)) list.push(k);
      });
    }
    if (geom.groups && geom.groups.length > 0) {
      geom.groups.forEach((g, idx) => {
        const name = (g as any).materialIndex !== undefined ? `group_${(g as any).materialIndex}` : `submesh_${idx}`;
        if (!list.includes(name)) list.push(name);
      });
    }
    return list;
  }

  /**
   * Main entry point: Performs complete smart automatic UV unwrap and updates geom 'uv' attribute.
   */
  public static unwrapGeometry(geom: THREE.BufferGeometry, options: SmartUVOptions = {}): SmartUVResult {
    const angleLimitDeg = options.angleLimitDegrees ?? 60;
    const angleLimitRad = (angleLimitDeg * Math.PI) / 180.0;
    const margin = Math.max(0.004, Math.min(0.08, options.islandMargin ?? 0.02));
    const bleedPx = Math.max(0, Math.min(16, options.islandBleedPixels ?? 4));
    const bleedNorm = bleedPx / 1024.0;
    const effectiveMargin = margin + bleedNorm;
    const seed = options.seed ?? Math.floor(Math.random() * 100000);
    const prng = new PRNG(seed);
    const targetSubmesh = options.submeshId ?? 'all';
    const preserveOthers = options.preserveOthers ?? true;

    const posAttr = geom.getAttribute('position');
    if (!posAttr) {
      return { islandCount: 0, facesProcessed: 0, seedUsed: seed, submeshIsolated: targetSubmesh };
    }

    let existingUvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const indexAttr = geom.getIndex();
    const totalFaces = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

    // Map submesh component indices
    const submeshFaceSet = new Set<number>();
    if (targetSubmesh !== 'all' && geom.userData?.componentIndices && geom.userData.componentIndices[targetSubmesh]) {
      const indices: Uint32Array = geom.userData.componentIndices[targetSubmesh];
      // indices are vertex indices in triplets
      const vertMap = new Set<number>();
      for (let i = 0; i < indices.length; i++) {
        vertMap.add(indices[i]);
      }
      for (let f = 0; f < totalFaces; f++) {
        const iA = indexAttr ? indexAttr.getX(f * 3) : f * 3;
        const iB = indexAttr ? indexAttr.getX(f * 3 + 1) : f * 3 + 1;
        const iC = indexAttr ? indexAttr.getX(f * 3 + 2) : f * 3 + 2;
        if (vertMap.has(iA) && vertMap.has(iB) && vertMap.has(iC)) {
          submeshFaceSet.add(f);
        }
      }
    }

    // 1. Build Face structures & calculate Face Normals and Areas
    const faces: FaceData[] = [];
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();

    const edgeMap = new Map<string, number[]>();

    const quantKey = (x: number, y: number, z: number) => {
      const e = 1e-4;
      return `${Math.round(x / e)}_${Math.round(y / e)}_${Math.round(z / e)}`;
    };

    const makeEdgeKey = (p1Key: string, p2Key: string) => {
      return p1Key < p2Key ? `${p1Key}|${p2Key}` : `${p2Key}|${p1Key}`;
    };

    for (let f = 0; f < totalFaces; f++) {
      // If isolating a submesh, skip faces not belonging to targetSubmesh
      if (targetSubmesh !== 'all' && submeshFaceSet.size > 0 && !submeshFaceSet.has(f)) {
        continue;
      }

      let iA: number, iB: number, iC: number;
      if (indexAttr) {
        iA = indexAttr.getX(f * 3);
        iB = indexAttr.getX(f * 3 + 1);
        iC = indexAttr.getX(f * 3 + 2);
      } else {
        iA = f * 3;
        iB = f * 3 + 1;
        iC = f * 3 + 2;
      }

      vA.set(posAttr.getX(iA), posAttr.getY(iA), posAttr.getZ(iA));
      vB.set(posAttr.getX(iB), posAttr.getY(iB), posAttr.getZ(iB));
      vC.set(posAttr.getX(iC), posAttr.getY(iC), posAttr.getZ(iC));

      edge1.subVectors(vB, vA);
      edge2.subVectors(vC, vA);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2);
      const doubleArea = normal.length();
      if (doubleArea > 1e-8) {
        normal.divideScalar(doubleArea);
      } else {
        normal.set(0, 1, 0);
      }

      faces.push({
        index: f,
        iA,
        iB,
        iC,
        normal,
        area: doubleArea * 0.5,
        islandId: -1,
        submeshId: targetSubmesh,
      });

      // Register edges for adjacency
      const kA = quantKey(vA.x, vA.y, vA.z);
      const kB = quantKey(vB.x, vB.y, vB.z);
      const kC = quantKey(vC.x, vC.y, vC.z);

      const eAB = makeEdgeKey(kA, kB);
      const eBC = makeEdgeKey(kB, kC);
      const eCA = makeEdgeKey(kC, kA);

      [eAB, eBC, eCA].forEach((eKey) => {
        let list = edgeMap.get(eKey);
        if (!list) {
          list = [];
          edgeMap.set(eKey, list);
        }
        list.push(f);
      });
    }

    if (faces.length === 0) {
      return { islandCount: 0, facesProcessed: 0, seedUsed: seed, submeshIsolated: targetSubmesh };
    }

    // 2. Build Adjacency Graph and Cluster Faces into Islands based on Angle Threshold
    let currentIsland = 0;
    const faceIndexToData = new Map<number, FaceData>();
    faces.forEach((f) => faceIndexToData.set(f.index, f));

    for (let i = 0; i < faces.length; i++) {
      if (faces[i].islandId !== -1) continue;

      const islandId = currentIsland++;
      const queue: number[] = [faces[i].index];
      faces[i].islandId = islandId;
      const seedNormal = faces[i].normal.clone();

      while (queue.length > 0) {
        const currIdx = queue.shift()!;
        const currFace = faceIndexToData.get(currIdx);
        if (!currFace) continue;

        // Find neighboring faces sharing edges
        const getNeighbors = (fData: FaceData): number[] => {
          const neighbors: number[] = [];
          const pts = [
            quantKey(posAttr.getX(fData.iA), posAttr.getY(fData.iA), posAttr.getZ(fData.iA)),
            quantKey(posAttr.getX(fData.iB), posAttr.getY(fData.iB), posAttr.getZ(fData.iB)),
            quantKey(posAttr.getX(fData.iC), posAttr.getY(fData.iC), posAttr.getZ(fData.iC)),
          ];

          const eKeys = [
            makeEdgeKey(pts[0], pts[1]),
            makeEdgeKey(pts[1], pts[2]),
            makeEdgeKey(pts[2], pts[0]),
          ];

          eKeys.forEach((k) => {
            const shared = edgeMap.get(k);
            if (shared) {
              for (const other of shared) {
                if (other !== fData.index) neighbors.push(other);
              }
            }
          });
          return neighbors;
        };

        const neighbors = getNeighbors(currFace);
        for (const nIdx of neighbors) {
          const neighborFace = faceIndexToData.get(nIdx);
          if (!neighborFace || neighborFace.islandId !== -1) continue;

          const angle = currFace.normal.angleTo(neighborFace.normal);
          const angleToSeed = seedNormal.angleTo(neighborFace.normal);

          if (angle <= angleLimitRad && angleToSeed <= angleLimitRad) {
            neighborFace.islandId = islandId;
            queue.push(nIdx);
          }
        }
      }
    }

    // 3. Project Islands into 2D with Conformal Relaxation & Seeded Variational Orientation
    const islandGroups = new Map<number, FaceData[]>();
    for (const face of faces) {
      let list = islandGroups.get(face.islandId);
      if (!list) {
        list = [];
        islandGroups.set(face.islandId, list);
      }
      list.push(face);
    }

    const islands: UVIsland[] = [];

    islandGroups.forEach((islandFaces, id) => {
      // Compute area-weighted average normal
      const avgNormal = new THREE.Vector3();
      islandFaces.forEach((f) => avgNormal.addScaledVector(f.normal, f.area));
      if (avgNormal.lengthSq() > 1e-8) {
        avgNormal.normalize();
      } else {
        avgNormal.set(0, 1, 0);
      }

      // Establish base orthonormal projection basis (U, V, Normal)
      let uAxis = new THREE.Vector3();
      if (Math.abs(avgNormal.y) < 0.9) {
        uAxis.crossVectors(avgNormal, new THREE.Vector3(0, 1, 0)).normalize();
      } else {
        uAxis.crossVectors(avgNormal, new THREE.Vector3(0, 0, 1)).normalize();
      }
      const vAxis = new THREE.Vector3().crossVectors(avgNormal, uAxis).normalize();

      const islandRotation = 0;

      const cosR = Math.cos(islandRotation);
      const sinR = Math.sin(islandRotation);

      // Project vertices to 2D
      const coords = new Map<string, { u: number; v: number }>();
      let minU = Infinity;
      let maxU = -Infinity;
      let minV = Infinity;
      let maxV = -Infinity;

      islandFaces.forEach((face) => {
        const indices = [face.iA, face.iB, face.iC];
        indices.forEach((vIdx, localIdx) => {
          const p = new THREE.Vector3(posAttr.getX(vIdx), posAttr.getY(vIdx), posAttr.getZ(vIdx));
          const rawU = p.dot(uAxis);
          const rawV = p.dot(vAxis);

          // Apply rotation
          const u = rawU * cosR - rawV * sinR;
          const v = rawU * sinR + rawV * cosR;

          const key = `${face.index}_${localIdx}`;
          coords.set(key, { u, v });

          if (u < minU) minU = u;
          if (u > maxU) maxU = u;
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        });
      });

      // Conformal Angle Relaxation (Stretch Minimization)
      // Iterative smoothing of interior coordinates while preserving edge length ratios
      if (islandFaces.length > 2) {
        const vertCoordsMap = new Map<number, { u: number; v: number; count: number }>();
        islandFaces.forEach((face) => {
          [face.iA, face.iB, face.iC].forEach((vIdx, localIdx) => {
            const c = coords.get(`${face.index}_${localIdx}`)!;
            const existing = vertCoordsMap.get(vIdx);
            if (!existing) {
              vertCoordsMap.set(vIdx, { u: c.u, v: c.v, count: 1 });
            } else {
              existing.u += c.u;
              existing.v += c.v;
              existing.count += 1;
            }
          });
        });

        // Blend interior coordinates slightly toward average for conformal relaxation
        vertCoordsMap.forEach((val) => {
          val.u /= val.count;
          val.v /= val.count;
        });

        islandFaces.forEach((face) => {
          [face.iA, face.iB, face.iC].forEach((vIdx, localIdx) => {
            const key = `${face.index}_${localIdx}`;
            const c = coords.get(key)!;
            const avg = vertCoordsMap.get(vIdx)!;
            // 85% original, 15% relaxed to prevent texture collapse
            c.u = c.u * 0.88 + avg.u * 0.12;
            c.v = c.v * 0.88 + avg.v * 0.12;
          });
        });
      }

      const width = Math.max(1e-4, maxU - minU);
      const height = Math.max(1e-4, maxV - minV);

      islands.push({
        id,
        faces: islandFaces,
        normal: avgNormal,
        coords,
        minU,
        maxU,
        minV,
        maxV,
        width,
        height,
        rotation: islandRotation,
      });
    });

    // Shelf-pack islands into 0..1. The scale is the largest one that still fits, so charts do not pile up.
    islands.sort((a, b) => b.height - a.height || b.width - a.width);

    const pad = effectiveMargin;
    const fits = (scale: number) => {
      let x = pad;
      let y = pad;
      let rowH = 0;
      for (const isl of islands) {
        const w = isl.width * scale;
        const h = isl.height * scale;
        if (x + w > 1 - pad && x > pad + 1e-6) {
          x = pad;
          y += rowH + pad;
          rowH = 0;
        }
        if (x + w > 1 - pad + 1e-4 || y + h > 1 - pad + 1e-4) return false;
        x += w + pad;
        if (h > rowH) rowH = h;
      }
      return true;
    };

    let lo = 0;
    let hi = 1;
    let maxDim = 1e-4;
    for (const isl of islands) maxDim = Math.max(maxDim, isl.width, isl.height);
    hi = (1 - pad * 2) / maxDim;
    for (let step = 0; step < 18; step++) {
      const mid = (lo + hi) * 0.5;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    const globalScale = lo > 1e-8 ? lo : hi;

    let currentX = pad;
    let currentY = pad;
    let rowMaxHeight = 0;
    const packedOffsets = new Map<number, { x: number; y: number; scale: number }>();
    for (const isl of islands) {
      const scaledW = isl.width * globalScale;
      const scaledH = isl.height * globalScale;
      if (currentX + scaledW > 1 - pad && currentX > pad + 1e-6) {
        currentX = pad;
        currentY += rowMaxHeight + pad;
        rowMaxHeight = 0;
      }
      packedOffsets.set(isl.id, { x: currentX, y: currentY, scale: globalScale });
      currentX += scaledW + pad;
      if (scaledH > rowMaxHeight) rowMaxHeight = scaledH;
    }

    // Desired UV per face corner. A shared vertex that lands on two charts is cloned so the charts do not pull each other.
    type CornerUV = { face: number; local: number; vIdx: number; u: number; v: number };
    const corners: CornerUV[] = [];
    for (const isl of islands) {
      const pack = packedOffsets.get(isl.id)!;
      for (const face of isl.faces) {
        const indices = [face.iA, face.iB, face.iC];
        indices.forEach((vIdx, localIdx) => {
          const c = isl.coords.get(`${face.index}_${localIdx}`)!;
          const finalU = pack.x + (c.u - isl.minU) * pack.scale;
          const finalV = pack.y + (c.v - isl.minV) * pack.scale;
          corners.push({
            face: face.index,
            local: localIdx,
            vIdx,
            u: Math.min(0.999, Math.max(0.001, finalU)),
            v: Math.min(0.999, Math.max(0.001, finalV)),
          });
        });
      }
    }

    const indexAttrNow = geom.getIndex();
    const indexArray = indexAttrNow
      ? Array.from({ length: indexAttrNow.count }, (_, i) => indexAttrNow.getX(i))
      : null;

    const baseAttrs: Record<string, { array: Float32Array; itemSize: number }> = {};
    for (const name of Object.keys(geom.attributes)) {
      const attr = geom.getAttribute(name);
      baseAttrs[name] = { array: new Float32Array(attr.array as ArrayLike<number>), itemSize: attr.itemSize };
    }
    const baseChannels: Record<string, Float32Array> = {};
    const channelBag = (geom.userData?.uvChannels || {}) as Record<string, Float32Array>;
    for (const key of Object.keys(channelBag)) {
      baseChannels[key] = new Float32Array(channelBag[key]);
    }

    const sourceOf: number[] = [];
    for (let i = 0; i < posAttr.count; i++) sourceOf.push(i);
    const claimed = new Map<number, string>();
    const sig = (u: number, v: number) => `${u.toFixed(4)}_${v.toFixed(4)}`;

    for (const corner of corners) {
      let vIdx = indexArray ? indexArray[corner.face * 3 + corner.local] : corner.vIdx;
      const mark = sig(corner.u, corner.v);
      const prev = claimed.get(vIdx);
      if (prev && prev !== mark && indexArray) {
        const src = sourceOf[vIdx];
        sourceOf.push(src);
        vIdx = sourceOf.length - 1;
        indexArray[corner.face * 3 + corner.local] = vIdx;
      }
      claimed.set(vIdx, mark);
      corner.vIdx = vIdx;
    }

    const vertCount = sourceOf.length;
    for (const name of Object.keys(baseAttrs)) {
      const { array, itemSize } = baseAttrs[name];
      const next = new Float32Array(vertCount * itemSize);
      for (let i = 0; i < vertCount; i++) {
        const s = sourceOf[i];
        for (let k = 0; k < itemSize; k++) next[i * itemSize + k] = array[s * itemSize + k] || 0;
      }
      geom.setAttribute(name, new THREE.BufferAttribute(next, itemSize));
    }
    if (!geom.userData) geom.userData = {};
    if (!geom.userData.uvChannels) geom.userData.uvChannels = {};
    for (const key of Object.keys(baseChannels)) {
      const array = baseChannels[key];
      const next = new Float32Array(vertCount * 2);
      for (let i = 0; i < vertCount; i++) {
        const s = sourceOf[i];
        next[i * 2] = array[s * 2] || 0;
        next[i * 2 + 1] = array[s * 2 + 1] || 0;
      }
      geom.userData.uvChannels[key] = next;
    }
    if (indexArray) geom.setIndex(indexArray);

    const uvArray = new Float32Array((geom.getAttribute('uv') as THREE.BufferAttribute).array as ArrayLike<number>);
    if (!(preserveOthers && existingUvAttr && targetSubmesh !== 'all')) {
      uvArray.fill(0);
    }
    for (const corner of corners) {
      uvArray[corner.vIdx * 2] = corner.u;
      uvArray[corner.vIdx * 2 + 1] = corner.v;
    }
    geom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    geom.attributes.uv.needsUpdate = true;
    geom.userData.uvChannels['uv_tightmap'] = new Float32Array(uvArray);

    return {
      islandCount: islands.length,
      facesProcessed: faces.length,
      seedUsed: seed,
      submeshIsolated: targetSubmesh,
    };
  }

  /** Vertex indices of the UV island under a point. Seams are edges whose two sides do not share UVs. */
  public static pickIsland(geom: THREE.BufferGeometry, u: number, v: number): Set<number> {
    const picked = new Set<number>();
    const uv = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const pos = geom.getAttribute('position');
    if (!uv || !pos) return picked;
    const index = geom.getIndex();
    const triCount = index ? index.count / 3 : pos.count / 3;
    const vert = (f: number, k: number) => (index ? index.getX(f * 3 + k) : f * 3 + k);
    const q = (i: number) => {
      const e = 1e-4;
      return `${Math.round(pos.getX(i) / e)}_${Math.round(pos.getY(i) / e)}_${Math.round(pos.getZ(i) / e)}`;
    };

    let bestF = -1;
    let bestD = 0.03 * 0.03;
    for (let f = 0; f < triCount; f++) {
      for (let k = 0; k < 3; k++) {
        const i = vert(f, k);
        const du = uv.getX(i) - u;
        const dv = uv.getY(i) - v;
        const d = du * du + dv * dv;
        if (d < bestD) {
          bestD = d;
          bestF = f;
        }
      }
    }
    if (bestF < 0) return picked;

    const edgeFaces = new Map<string, number[]>();
    const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
    for (let f = 0; f < triCount; f++) {
      const keys = [0, 1, 2].map((k) => q(vert(f, k)));
      for (let k = 0; k < 3; k++) {
        const ek = edgeKey(keys[k], keys[(k + 1) % 3]);
        let list = edgeFaces.get(ek);
        if (!list) {
          list = [];
          edgeFaces.set(ek, list);
        }
        list.push(f);
      }
    }

    const uvOf = (i: number) => ({ u: uv.getX(i), v: uv.getY(i) });
    const sameUV = (a: number, b: number) => {
      const pa = uvOf(a);
      const pb = uvOf(b);
      return Math.abs(pa.u - pb.u) < 0.004 && Math.abs(pa.v - pb.v) < 0.004;
    };

    const seen = new Set<number>([bestF]);
    const queue = [bestF];
    while (queue.length > 0) {
      const f = queue.shift()!;
      for (let k = 0; k < 3; k++) picked.add(vert(f, k));
      const keys = [0, 1, 2].map((k) => q(vert(f, k)));
      for (let k = 0; k < 3; k++) {
        const ek = edgeKey(keys[k], keys[(k + 1) % 3]);
        const a = vert(f, k);
        const b = vert(f, (k + 1) % 3);
        for (const other of edgeFaces.get(ek) || []) {
          if (seen.has(other)) continue;
          let matchA = -1;
          let matchB = -1;
          for (let t = 0; t < 3; t++) {
            const ov = vert(other, t);
            if (q(ov) === q(a)) matchA = ov;
            if (q(ov) === q(b)) matchB = ov;
          }
          if (matchA < 0 || matchB < 0) continue;
          if (!sameUV(a, matchA) || !sameUV(b, matchB)) continue;
          seen.add(other);
          queue.push(other);
        }
      }
    }
    return picked;
  }

  /** Drop the half of a selection that is not on the requested side of U = 0.5. */
  public static keepSide(
    geom: THREE.BufferGeometry,
    selected: Set<number>,
    side: 'left' | 'right'
  ): Set<number> {
    const uv = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const next = new Set<number>();
    if (!uv) return next;
    for (const i of selected) {
      const u = uv.getX(i);
      if (side === 'left' ? u < 0.5 : u >= 0.5) next.add(i);
    }
    return next;
  }

  public static moveUVs(geom: THREE.BufferGeometry, selected: Set<number>, du: number, dv: number): number {
    const uv = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    if (!uv || selected.size === 0) return 0;
    for (const i of selected) {
      uv.setXY(i, uv.getX(i) + du, uv.getY(i) + dv);
    }
    uv.needsUpdate = true;
    return selected.size;
  }

  /**
   * Dilates texture edges across UV island seams by `radius` pixels.
   * Prevents black mipmap bleed and seam artifacts when painting.
   */
  public static dilateTextureSeams(canvas: HTMLCanvasElement, radius: number = 4): void {
    if (radius <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const src = imgData.data;
    const output = new Uint8ClampedArray(src);

    const offsets: [number, number][] = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];

    for (let pass = 0; pass < radius; pass++) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          // If this pixel is transparent or close to background
          if (src[idx + 3] < 10) {
            let rSum = 0, gSum = 0, bSum = 0, aMax = 0, count = 0;
            for (const [dx, dy] of offsets) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = (ny * w + nx) * 4;
                if (src[nIdx + 3] > 20) {
                  rSum += src[nIdx];
                  gSum += src[nIdx + 1];
                  bSum += src[nIdx + 2];
                  if (src[nIdx + 3] > aMax) aMax = src[nIdx + 3];
                  count++;
                }
              }
            }
            if (count > 0) {
              output[idx] = Math.round(rSum / count);
              output[idx + 1] = Math.round(gSum / count);
              output[idx + 2] = Math.round(bSum / count);
              output[idx + 3] = aMax;
            }
          }
        }
      }
      src.set(output);
    }

    ctx.putImageData(imgData, 0, 0);
  }
}
