/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Smart UV Projection & Automatic Unwrap Engine
 * Created by Victory Ukpong
 * 
 * Implements:
 * 1. Mesh analysis for open edges and sharp dihedral angles between adjacent faces.
 * 2. Projection of face islands based on user-adjustable angle limit (default 60°).
 * 3. Stretch minimization preserving relative surface proportions.
 * 4. Automatic 2D island bin-packing into [0..1] range with user-defined margins.
 * 5. Automatic assignment of the default generated UV map to the mesh geometry.
 */

import * as THREE from 'three';

export interface SmartUVOptions {
  angleLimitDegrees?: number; // e.g. 60°
  islandMargin?: number;      // e.g. 0.02 (2% margin)
}

export interface SmartUVResult {
  islandCount: number;
  facesProcessed: number;
}

interface FaceData {
  index: number;
  iA: number;
  iB: number;
  iC: number;
  normal: THREE.Vector3;
  area: number;
  islandId: number;
}

interface UVIsland {
  id: number;
  faces: FaceData[];
  normal: THREE.Vector3;
  // Local 2D projected coordinates per vertex reference: faceIdx_localVertexIdx -> { u, v }
  coords: Map<string, { u: number; v: number }>;
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
  width: number;
  height: number;
}

export class SmartUVUnwrapEngine {
  /**
   * Main entry point: Performs complete smart automatic UV unwrap and updates geom 'uv' attribute.
   */
  public static unwrapGeometry(geom: THREE.BufferGeometry, options: SmartUVOptions = {}): SmartUVResult {
    const angleLimitDeg = options.angleLimitDegrees ?? 60;
    const angleLimitRad = (angleLimitDeg * Math.PI) / 180.0;
    const margin = Math.max(0.005, Math.min(0.1, options.islandMargin ?? 0.02));

    const posAttr = geom.getAttribute('position');
    if (!posAttr) {
      return { islandCount: 0, facesProcessed: 0 };
    }

    const indexAttr = geom.getIndex();
    const faceCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

    // 1. Build Face structures & calculate Face Normals and Areas
    const faces: FaceData[] = [];
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const edge1 = new THREE.Vector3();
    const edge2 = new THREE.Vector3();

    // Map edge (quantized endpoints) -> list of face indices sharing that edge
    const edgeMap = new Map<string, number[]>();

    const quantKey = (x: number, y: number, z: number) => {
      const e = 1e-4;
      return `${Math.round(x / e)}_${Math.round(y / e)}_${Math.round(z / e)}`;
    };

    const makeEdgeKey = (p1Key: string, p2Key: string) => {
      return p1Key < p2Key ? `${p1Key}|${p2Key}` : `${p2Key}|${p1Key}`;
    };

    for (let f = 0; f < faceCount; f++) {
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

    // 2. Build Adjacency Graph and Cluster Faces into Islands based on Angle Threshold
    let currentIsland = 0;
    for (let f = 0; f < faces.length; f++) {
      if (faces[f].islandId !== -1) continue;

      const islandId = currentIsland++;
      const queue: number[] = [f];
      faces[f].islandId = islandId;

      const islandNormal = faces[f].normal.clone();

      while (queue.length > 0) {
        const currIdx = queue.shift()!;
        const currFace = faces[currIdx];

        // Find neighboring faces sharing edges
        const getNeighbors = (fIdx: number): number[] => {
          const neighbors: number[] = [];
          const fData = faces[fIdx];
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
                if (other !== fIdx) neighbors.push(other);
              }
            }
          });
          return neighbors;
        };

        const neighbors = getNeighbors(currIdx);
        for (const nIdx of neighbors) {
          const neighborFace = faces[nIdx];
          if (neighborFace.islandId !== -1) continue;

          // Check dihedral angle between adjacent faces
          const angle = currFace.normal.angleTo(neighborFace.normal);
          // Also check angle against average island normal to prevent excessive curvature accumulation
          const angleToIsland = islandNormal.angleTo(neighborFace.normal);

          if (angle <= angleLimitRad && angleToIsland <= angleLimitRad * 1.25) {
            neighborFace.islandId = islandId;
            queue.push(nIdx);
            islandNormal.addScaledVector(neighborFace.normal, neighborFace.area).normalize();
          }
        }
      }
    }

    // 3. Project Islands into 2D and minimize distortion
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

      // Establish orthonormal projection basis (U axis, V axis, Normal axis)
      let uAxis = new THREE.Vector3();
      if (Math.abs(avgNormal.y) < 0.9) {
        uAxis.crossVectors(avgNormal, new THREE.Vector3(0, 1, 0)).normalize();
      } else {
        uAxis.crossVectors(avgNormal, new THREE.Vector3(0, 0, 1)).normalize();
      }
      const vAxis = new THREE.Vector3().crossVectors(avgNormal, uAxis).normalize();

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
          const u = p.dot(uAxis);
          const v = p.dot(vAxis);

          const key = `${face.index}_${localIdx}`;
          coords.set(key, { u, v });

          if (u < minU) minU = u;
          if (u > maxU) maxU = u;
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        });
      });

      const width = Math.max(1e-5, maxU - minU);
      const height = Math.max(1e-5, maxV - minV);

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
      });
    });

    // 4. Sort islands descending by area (max(width, height)) for greedy shelf bin-packing
    islands.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));

    // Calculate total bounding box area to determine ideal grid scale
    let totalIslandArea = 0;
    islands.forEach((isl) => {
      totalIslandArea += (isl.width + margin) * (isl.height + margin);
    });

    // Determine packing scale factor to fit in 1.0 x 1.0 UV square
    const packingDimension = Math.sqrt(totalIslandArea) * 1.15 || 1.0;
    const globalScale = (1.0 - margin * 2) / packingDimension;

    // Shelf bin packing
    let currentX = margin;
    let currentY = margin;
    let rowMaxHeight = 0;

    const packedOffsets = new Map<number, { x: number; y: number; scale: number }>();

    for (const isl of islands) {
      const scaledW = isl.width * globalScale;
      const scaledH = isl.height * globalScale;

      if (currentX + scaledW > 1.0 - margin) {
        // Move to next row
        currentX = margin;
        currentY += rowMaxHeight + margin;
        rowMaxHeight = 0;
      }

      packedOffsets.set(isl.id, {
        x: currentX,
        y: currentY,
        scale: globalScale,
      });

      currentX += scaledW + margin;
      if (scaledH > rowMaxHeight) {
        rowMaxHeight = scaledH;
      }
    }

    // 5. Write packed UV coordinates back to geometry BufferAttribute
    const uvArray = new Float32Array(posAttr.count * 2);

    for (const isl of islands) {
      const pack = packedOffsets.get(isl.id)!;
      for (const face of isl.faces) {
        const indices = [face.iA, face.iB, face.iC];
        indices.forEach((vIdx, localIdx) => {
          const c = isl.coords.get(`${face.index}_${localIdx}`)!;
          // Map to local normalized UV
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

    return {
      islandCount: islands.length,
      facesProcessed: faces.length,
    };
  }
}
