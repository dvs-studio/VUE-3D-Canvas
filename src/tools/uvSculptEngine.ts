/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Interactive 2D UV Sculpt Engine
 * Author / Creator: Victory Ukpong
 * 
 * Implements 5 dedicated UV sculpting brushes:
 * 1. Straighten: Snaps and aligns UV edge strips along cardinal U/V axes.
 * 2. Smooth (Relax): Topological Laplacian relaxation reducing local texture stretch.
 * 3. Pinch: Pulls UV vertices toward cursor centroid to allocate higher texel density.
 * 4. Expand: Pushes UV vertices outward to expand UV area.
 * 5. Crease: Sharpens UV contours and pulls vertices toward localized seam tangents.
 */

import * as THREE from 'three';
import { UVSculptMode } from '../core/types';

export interface UVSculptStroke {
  u: number;            // Normalized brush center [0..1]
  v: number;            // Normalized brush center [0..1]
  radius: number;       // Normalized radius [0.01..0.5]
  strength: number;     // Normalized stroke strength [0.05..1.0]
  mode: UVSculptMode;
}

export class UVSculptEngine {
  /**
   * Applies an interactive sculpting brush stroke to the geometry's active UV coordinates
   */
  public static applyStroke(geom: THREE.BufferGeometry, stroke: UVSculptStroke): number {
    const uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const posAttr = geom.getAttribute('position');
    if (!uvAttr || !posAttr) return 0;

    const count = posAttr.count;
    const uvArray = uvAttr.array as Float32Array;
    const indexAttr = geom.getIndex();

    const { u: bU, v: bV, radius, strength, mode } = stroke;
    const rSq = radius * radius;
    let modifiedCount = 0;

    // Build topological adjacency on demand for Smooth mode
    let adjacencyMap: Map<number, Set<number>> | null = null;
    if (mode === 'smooth') {
      adjacencyMap = new Map();
      const faceCount = indexAttr ? indexAttr.count / 3 : count / 3;
      for (let f = 0; f < faceCount; f++) {
        const iA = indexAttr ? indexAttr.getX(f * 3) : f * 3;
        const iB = indexAttr ? indexAttr.getX(f * 3 + 1) : f * 3 + 1;
        const iC = indexAttr ? indexAttr.getX(f * 3 + 2) : f * 3 + 2;

        const addEdge = (p1: number, p2: number) => {
          let s = adjacencyMap!.get(p1);
          if (!s) {
            s = new Set();
            adjacencyMap!.set(p1, s);
          }
          s.add(p2);
        };

        addEdge(iA, iB); addEdge(iB, iA);
        addEdge(iB, iC); addEdge(iC, iB);
        addEdge(iC, iA); addEdge(iA, iC);
      }
    }

    for (let i = 0; i < count; i++) {
      const u = uvArray[i * 2];
      const v = uvArray[i * 2 + 1];

      const dU = u - bU;
      const dV = v - bV;
      const dSq = dU * dU + dV * dV;

      if (dSq > rSq) continue;

      const dist = Math.sqrt(dSq);
      // Smooth cosine falloff
      const falloff = Math.cos((dist / radius) * (Math.PI * 0.5));
      const effStrength = strength * falloff;

      switch (mode) {
        case 'smooth': {
          if (adjacencyMap) {
            const neighbors = adjacencyMap.get(i);
            if (neighbors && neighbors.size > 0) {
              let avgU = 0;
              let avgV = 0;
              neighbors.forEach((nIdx) => {
                avgU += uvArray[nIdx * 2];
                avgV += uvArray[nIdx * 2 + 1];
              });
              avgU /= neighbors.size;
              avgV /= neighbors.size;

              uvArray[i * 2] = THREE.MathUtils.clamp(u + (avgU - u) * effStrength * 0.5, 0.001, 0.999);
              uvArray[i * 2 + 1] = THREE.MathUtils.clamp(v + (avgV - v) * effStrength * 0.5, 0.001, 0.999);
              modifiedCount++;
            }
          }
          break;
        }

        case 'straighten': {
          // Align along either dominant horizontal or vertical axis through brush center
          if (Math.abs(dU) < Math.abs(dV)) {
            // Snap U toward brush center vertical line
            uvArray[i * 2] = THREE.MathUtils.clamp(u + (bU - u) * effStrength * 0.6, 0.001, 0.999);
          } else {
            // Snap V toward brush center horizontal line
            uvArray[i * 2 + 1] = THREE.MathUtils.clamp(v + (bV - v) * effStrength * 0.6, 0.001, 0.999);
          }
          modifiedCount++;
          break;
        }

        case 'pinch': {
          // Pull toward brush center
          uvArray[i * 2] = THREE.MathUtils.clamp(u - dU * effStrength * 0.4, 0.001, 0.999);
          uvArray[i * 2 + 1] = THREE.MathUtils.clamp(v - dV * effStrength * 0.4, 0.001, 0.999);
          modifiedCount++;
          break;
        }

        case 'expand': {
          // Push radially away from brush center
          const pushU = dist > 1e-5 ? (dU / dist) * radius * 0.15 : 0;
          const pushV = dist > 1e-5 ? (dV / dist) * radius * 0.15 : 0;
          uvArray[i * 2] = THREE.MathUtils.clamp(u + pushU * effStrength, 0.001, 0.999);
          uvArray[i * 2 + 1] = THREE.MathUtils.clamp(v + pushV * effStrength, 0.001, 0.999);
          modifiedCount++;
          break;
        }

        case 'crease': {
          // Sharpens UV edge by pulling toward nearest quadrant axis
          const targetU = dU > 0 ? bU + radius * 0.5 : bU - radius * 0.5;
          const targetV = dV > 0 ? bV + radius * 0.5 : bV - radius * 0.5;
          uvArray[i * 2] = THREE.MathUtils.clamp(u + (targetU - u) * effStrength * 0.35, 0.001, 0.999);
          uvArray[i * 2 + 1] = THREE.MathUtils.clamp(v + (targetV - v) * effStrength * 0.35, 0.001, 0.999);
          modifiedCount++;
          break;
        }
      }
    }

    if (modifiedCount > 0) {
      uvAttr.needsUpdate = true;
    }
    return modifiedCount;
  }
}
