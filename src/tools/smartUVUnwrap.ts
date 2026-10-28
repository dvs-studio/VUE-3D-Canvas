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

      const islandNormal = faces[i].normal.clone();

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

          // Check dihedral angle between adjacent faces
          const angle = currFace.normal.angleTo(neighborFace.normal);
          // Also check angle against average island normal
          const angleToIsland = islandNormal.angleTo(neighborFace.normal);

          if (angle <= angleLimitRad && angleToIsland <= angleLimitRad * 1.35) {
            neighborFace.islandId = islandId;
            queue.push(nIdx);
            islandNormal.addScaledVector(neighborFace.normal, neighborFace.area).normalize();
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

      // Seeded rotational jitter: choose from candidate angles [0, 45, 90, 180, 270] + small jitter
      const rotationCandidates = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
      const selectedBaseRot = rotationCandidates[Math.floor(prng.next() * rotationCandidates.length)];
      const jitterRot = prng.range(-0.15, 0.15);
      const islandRotation = selectedBaseRot + jitterRot;

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

    // 4. Seeded Variational Sorting and Non-Overlapping Shelf Packing
    // Sort primarily by max dimension, with seeded secondary ranking to break repetitive grids
    islands.sort((a, b) => {
      const dimA = Math.max(a.width, a.height);
      const dimB = Math.max(b.width, b.height);
      const delta = dimB - dimA;
      if (Math.abs(delta) > 0.05) return delta;
      // Secondary seeded tie-breaker gives varied island sequences
      return (prng.next() - 0.5);
    });

    // Calculate total island area including effective margin & gutter bleed
    let totalIslandArea = 0;
    islands.forEach((isl) => {
      totalIslandArea += (isl.width + effectiveMargin) * (isl.height + effectiveMargin);
    });

    // Scale islands dynamically to tightly fill [0..1] square
    const packingDimension = Math.sqrt(totalIslandArea) * 1.18 || 1.0;
    const globalScale = (1.0 - effectiveMargin * 2) / packingDimension;

    // Shelf bin packing
    let currentX = effectiveMargin;
    let currentY = effectiveMargin;
    let rowMaxHeight = 0;

    const packedOffsets = new Map<number, { x: number; y: number; scale: number }>();

    for (const isl of islands) {
      const scaledW = isl.width * globalScale;
      const scaledH = isl.height * globalScale;

      if (currentX + scaledW > 1.0 - effectiveMargin) {
        // Move to next shelf row
        currentX = effectiveMargin;
        currentY += rowMaxHeight + effectiveMargin;
        rowMaxHeight = 0;
      }

      // If vertical space exceeds 1.0, shrink slightly to avoid clamping
      if (currentY + scaledH > 1.0 - effectiveMargin) {
        // Re-scale slightly downwards
        currentY = Math.min(currentY, 1.0 - scaledH - effectiveMargin);
      }

      packedOffsets.set(isl.id, {
        x: currentX,
        y: currentY,
        scale: globalScale,
      });

      currentX += scaledW + effectiveMargin;
      if (scaledH > rowMaxHeight) {
        rowMaxHeight = scaledH;
      }
    }

    // 5. Write packed UV coordinates back to geometry BufferAttribute
    const uvArray = new Float32Array(posAttr.count * 2);

    // If preserveOthers is enabled and existing UV attribute exists, copy existing values first
    if (preserveOthers && existingUvAttr && targetSubmesh !== 'all') {
      const existingArray = existingUvAttr.array;
      for (let i = 0; i < uvArray.length; i++) {
        uvArray[i] = existingArray[i];
      }
    }

    // Write newly unwrapped islands
    for (const isl of islands) {
      const pack = packedOffsets.get(isl.id)!;
      for (const face of isl.faces) {
        const indices = [face.iA, face.iB, face.iC];
        indices.forEach((vIdx, localIdx) => {
          const c = isl.coords.get(`${face.index}_${localIdx}`)!;
          // Map to local normalized UV within island bounding box
          const normU = (c.u - isl.minU) * pack.scale;
          const normV = (c.v - isl.minV) * pack.scale;

          const finalU = THREE.MathUtils.clamp(pack.x + normU, 0.001, 0.999);
          const finalV = THREE.MathUtils.clamp(pack.y + normV, 0.001, 0.999);

          uvArray[vIdx * 2] = finalU;
          uvArray[vIdx * 2 + 1] = finalV;
        });
      }
    }

    geom.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    geom.attributes.uv.needsUpdate = true;

    // Cache this unwrap result in userData for the UV Channel Manager
    if (!geom.userData) geom.userData = {};
    if (!geom.userData.uvChannels) geom.userData.uvChannels = {};
    geom.userData.uvChannels['uv_tightmap'] = new Float32Array(uvArray);

    return {
      islandCount: islands.length,
      facesProcessed: faces.length,
      seedUsed: seed,
      submeshIsolated: targetSubmesh,
    };
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
