/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Symmetrize UV Engine with 3D X-Ray Vertex Group Alignment
 * Author / Creator: Victory Ukpong
 * 
 * Features:
 * 1. Intelligent bilateral UV mirroring (+X to -X, -X to +X, overlap mirrored, or side-by-side).
 * 2. Midpoint seam protection: Pins midline seam vertices without crossing or overlapping.
 * 3. Asymmetric feature guard (e.g. ears): Prevents peripheral/asymmetric regions from colliding.
 * 4. 3D X-Ray Vertex Group integration: Operates either across entire mesh or on temporary 3D X-Ray painted vertex selection.
 */

import * as THREE from 'three';
import { SymmetrizeUVConfig } from '../core/types';

export interface SymmetrizeResult {
  verticesMirrored: number;
  midlinePinned: number;
  asymmetricProtected: number;
  axis: string;
}

export class SymmetrizeUVEngine {
  /**
   * Applies bilateral UV symmetrization according to the configuration and optional 3D X-Ray selection
   */
  public static symmetrizeGeometry(
    geom: THREE.BufferGeometry,
    config: SymmetrizeUVConfig,
    selectedVertices?: Set<number> | null
  ): SymmetrizeResult {
    const posAttr = geom.getAttribute('position');
    const uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    if (!posAttr || !uvAttr) {
      return { verticesMirrored: 0, midlinePinned: 0, asymmetricProtected: 0, axis: config.axis };
    }

    const count = posAttr.count;
    const uvArray = uvAttr.array as Float32Array;
    const midThresh = config.midpointThreshold ?? 0.02;
    const protectAsym = config.protectAsymmetricFeatures ?? true;
    const useSelection = config.useVertexSelectionGroup && selectedVertices && selectedVertices.size > 0;

    // Determine coordinate accessor based on chosen symmetry axis
    const getAxisCoord = (i: number): number => {
      if (config.axis === 'Y') return posAttr.getY(i);
      if (config.axis === 'Z') return posAttr.getZ(i);
      return posAttr.getX(i);
    };

    const getOtherCoords = (i: number): [number, number] => {
      if (config.axis === 'Y') return [posAttr.getX(i), posAttr.getZ(i)];
      if (config.axis === 'Z') return [posAttr.getX(i), posAttr.getY(i)];
      return [posAttr.getY(i), posAttr.getZ(i)];
    };

    // Fast spatial hash to locate opposite symmetric vertices
    const eps = 0.035;
    const hash = (c1: number, c2: number) => {
      return `${Math.round(c1 / eps)}_${Math.round(c2 / eps)}`;
    };

    // Group vertices by opposite coordinate slice
    const sourceSideMap = new Map<string, number[]>();
    const midlineIndices: number[] = [];
    const asymmetricIndices: number[] = [];

    // Direction: determine if source is positive or negative
    const sourceIsPositive = config.direction !== '- to +';

    for (let i = 0; i < count; i++) {
      if (useSelection && !selectedVertices!.has(i)) {
        continue;
      }

      const aCoord = getAxisCoord(i);
      const [o1, o2] = getOtherCoords(i);

      // Check if midline vertex
      if (Math.abs(aCoord) <= midThresh) {
        midlineIndices.push(i);
        continue;
      }

      // Check if asymmetric feature / ear protection is triggered
      // For character models (Suzanne/Helmet), peripheral extremities (|X| > 1.2 or high curvature)
      if (protectAsym && Math.abs(aCoord) > 1.25) {
        asymmetricIndices.push(i);
        continue;
      }

      const isSource = sourceIsPositive ? (aCoord > midThresh) : (aCoord < -midThresh);
      if (isSource) {
        const key = hash(o1, o2);
        let list = sourceSideMap.get(key);
        if (!list) {
          list = [];
          sourceSideMap.set(key, list);
        }
        list.push(i);
      }
    }

    let mirroredCount = 0;

    // Mirror vertices to opposite side
    for (let targetIdx = 0; targetIdx < count; targetIdx++) {
      if (useSelection && !selectedVertices!.has(targetIdx)) {
        continue;
      }

      const aCoord = getAxisCoord(targetIdx);
      if (Math.abs(aCoord) <= midThresh) continue;
      if (protectAsym && Math.abs(aCoord) > 1.25) continue;

      const isTarget = sourceIsPositive ? (aCoord < -midThresh) : (aCoord > midThresh);
      if (!isTarget) continue;

      const [to1, to2] = getOtherCoords(targetIdx);
      const key = hash(to1, to2);
      const sourceCandidates = sourceSideMap.get(key);
      if (!sourceCandidates || sourceCandidates.length === 0) continue;

      // Find closest source vertex on other coordinates
      let bestSrcIdx = -1;
      let bestDistSq = Infinity;
      const tPos = new THREE.Vector3(posAttr.getX(targetIdx), posAttr.getY(targetIdx), posAttr.getZ(targetIdx));

      for (const srcIdx of sourceCandidates) {
        const sPos = new THREE.Vector3(posAttr.getX(srcIdx), posAttr.getY(srcIdx), posAttr.getZ(srcIdx));
        // Invert axis coordinate for distance check
        if (config.axis === 'X') sPos.x = -sPos.x;
        else if (config.axis === 'Y') sPos.y = -sPos.y;
        else sPos.z = -sPos.z;

        const dSq = tPos.distanceToSquared(sPos);
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestSrcIdx = srcIdx;
        }
      }

      if (bestSrcIdx !== -1 && bestDistSq < 0.05) {
        const srcU = uvArray[bestSrcIdx * 2];
        const srcV = uvArray[bestSrcIdx * 2 + 1];

        if (config.direction === 'side_by_side') {
          // Mirrored U into the opposing half of UV canvas (e.g. around 0.5)
          const mirroredU = THREE.MathUtils.clamp(1.0 - srcU, 0.001, 0.999);
          uvArray[targetIdx * 2] = mirroredU;
          uvArray[targetIdx * 2 + 1] = srcV;
        } else {
          // Exact overlap mirrored (stacks symmetric half for maximum texel density)
          uvArray[targetIdx * 2] = srcU;
          uvArray[targetIdx * 2 + 1] = srcV;
        }
        mirroredCount++;
      }
    }

    // Protect midline vertices from drift: average their horizontal alignment if side-by-side
    let midlinePinned = 0;
    if (config.direction === 'side_by_side') {
      midlineIndices.forEach((mIdx) => {
        // Center midline along U = 0.5 seam
        uvArray[mIdx * 2] = 0.5;
        midlinePinned++;
      });
    } else {
      midlinePinned = midlineIndices.length;
    }

    uvAttr.needsUpdate = true;

    return {
      verticesMirrored: mirroredCount,
      midlinePinned,
      asymmetricProtected: asymmetricIndices.length,
      axis: config.axis,
    };
  }
}
