/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Multi-UV Channel Manager & Inverse Barycentric Re-Bake Engine
 * Author / Creator: Victory Ukpong
 * 
 * Supports:
 * 1. Adding, deleting, duplicating, and switching between arbitrary UV channels.
 * 2. Permanent reference to 'uv_original' (imported mesh UVs) for material slots.
 * 3. Inverse barycentric dynamic re-baking from generated tight-map UVs back to original UVs.
 * 4. Gutter edge dilation to prevent seam glitches during baking.
 */

import * as THREE from 'three';
import { UVChannelInfo } from '../core/types';
import { SmartUVUnwrapEngine } from './smartUVUnwrap';

export class UVChannelManager {
  /**
   * Initializes and ensures standard UV channels exist on the geometry
   */
  public static ensureBaseChannels(geom: THREE.BufferGeometry): void {
    if (!geom.userData) geom.userData = {};
    if (!geom.userData.uvChannels) geom.userData.uvChannels = {};

    const uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    if (!uvAttr) return;

    // Save original UVs if not already recorded
    if (!geom.userData.uvChannels['uv_original']) {
      geom.userData.uvChannels['uv_original'] = new Float32Array(uvAttr.array);
    }

    if (!geom.userData.activeUVChannel) {
      geom.userData.activeUVChannel = 'uv_original';
    }
  }

  /**
   * Returns metadata for all UV channels present on the geometry
   */
  public static getChannels(geom: THREE.BufferGeometry): UVChannelInfo[] {
    this.ensureBaseChannels(geom);
    const channelsObj = geom.userData?.uvChannels || {};
    const keys = Object.keys(channelsObj);
    const posAttr = geom.getAttribute('position');
    const vertCount = posAttr ? posAttr.count : 0;

    return keys.map((key) => {
      let displayName = key;
      if (key === 'uv_original') displayName = 'Original Mesh UVs';
      else if (key === 'uv_tightmap') displayName = 'TightMap (Smart Unwrap)';
      else if (key.startsWith('uv_custom_')) displayName = key.replace('uv_custom_', 'Channel: ');

      return {
        id: key,
        name: displayName,
        isDefault: key === 'uv_original',
        isGenerated: key === 'uv_tightmap',
        vertexCount: vertCount,
      };
    });
  }

  /**
   * Adds a new custom UV channel copied from the current active UVs
   */
  public static addChannel(geom: THREE.BufferGeometry, name?: string): string {
    this.ensureBaseChannels(geom);
    const uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    if (!uvAttr) throw new Error('Geometry lacks UV attribute');

    const cleanName = name ? name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : `slot_${Date.now().toString().slice(-4)}`;
    const channelId = `uv_custom_${cleanName}`;

    geom.userData.uvChannels[channelId] = new Float32Array(uvAttr.array);
    return channelId;
  }

  /**
   * Deletes a UV channel (protecting 'uv_original')
   */
  public static deleteChannel(geom: THREE.BufferGeometry, channelId: string): boolean {
    if (channelId === 'uv_original') return false; // Cannot delete base original UVs
    if (!geom.userData?.uvChannels?.[channelId]) return false;

    delete geom.userData.uvChannels[channelId];

    if (geom.userData.activeUVChannel === channelId) {
      this.setActiveChannel(geom, 'uv_original');
    }
    return true;
  }

  /**
   * Sets the active UV channel, copying its values into geom.attributes.uv
   */
  public static setActiveChannel(geom: THREE.BufferGeometry, channelId: string): boolean {
    this.ensureBaseChannels(geom);
    const targetArray = geom.userData?.uvChannels?.[channelId] as Float32Array | undefined;
    if (!targetArray) return false;

    const uvAttr = geom.getAttribute('uv') as THREE.BufferAttribute | undefined;
    if (!uvAttr) {
      geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(targetArray), 2));
    } else {
      // Before switching, save current active UVs back to their channel slot
      const currentActive = geom.userData.activeUVChannel;
      if (currentActive && geom.userData.uvChannels[currentActive]) {
        geom.userData.uvChannels[currentActive].set(uvAttr.array);
      }

      uvAttr.copyArray(targetArray);
      uvAttr.needsUpdate = true;
    }

    geom.userData.activeUVChannel = channelId;
    return true;
  }

  /**
   * Gets the active UV channel ID
   */
  public static getActiveChannelId(geom: THREE.BufferGeometry): string {
    this.ensureBaseChannels(geom);
    return geom.userData?.activeUVChannel || 'uv_original';
  }

  /**
   * Performs high-fidelity inverse barycentric re-baking from source UV channel to target UV channel.
   * E.g. transferring textures painted under 'uv_tightmap' back to 'uv_original'.
   */
  public static rebakeTexture(
    geom: THREE.BufferGeometry,
    sourceCanvas: HTMLCanvasElement,
    fromChannelId: string,
    toChannelId: string,
    resolution: number = 1024
  ): HTMLCanvasElement {
    this.ensureBaseChannels(geom);

    const fromUVs = geom.userData?.uvChannels?.[fromChannelId] as Float32Array | undefined;
    const toUVs = geom.userData?.uvChannels?.[toChannelId] as Float32Array | undefined;

    if (!fromUVs || !toUVs) {
      throw new Error(`Cannot re-bake: missing UV channel data for ${fromChannelId} or ${toChannelId}`);
    }

    const indexAttr = geom.getIndex();
    const posAttr = geom.getAttribute('position');
    const faceCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

    // Target output canvas
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = resolution;
    targetCanvas.height = resolution;
    const targetCtx = targetCanvas.getContext('2d')!;
    const targetImgData = targetCtx.createImageData(resolution, resolution);
    const targetData = targetImgData.data;

    // Source context and data
    const sourceCtx = sourceCanvas.getContext('2d')!;
    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;
    const sourceImgData = sourceCtx.getImageData(0, 0, srcW, srcH);
    const srcData = sourceImgData.data;

    // Bilinear sample helper
    const sampleSourceBilinear = (u: number, v: number, out: [number, number, number, number]) => {
      // In Three.js UV space, V=0 is bottom, V=1 is top
      const x = Math.max(0, Math.min(srcW - 1, u * srcW));
      const y = Math.max(0, Math.min(srcH - 1, (1.0 - v) * srcH));

      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const y1 = Math.min(srcH - 1, y0 + 1);

      const fx = x - x0;
      const fy = y - y0;

      const idx00 = (y0 * srcW + x0) * 4;
      const idx10 = (y0 * srcW + x1) * 4;
      const idx01 = (y1 * srcW + x0) * 4;
      const idx11 = (y1 * srcW + x1) * 4;

      for (let c = 0; c < 4; c++) {
        const top = srcData[idx00 + c] * (1 - fx) + srcData[idx10 + c] * fx;
        const bot = srcData[idx01 + c] * (1 - fx) + srcData[idx11 + c] * fx;
        out[c] = top * (1 - fy) + bot * fy;
      }
    };

    const sampledColor: [number, number, number, number] = [0, 0, 0, 0];

    // Iterate through triangles and rasterize into target UV space
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

      // Target UV coordinates
      const tUA = toUVs[iA * 2];
      const tVA = toUVs[iA * 2 + 1];
      const tUB = toUVs[iB * 2];
      const tVB = toUVs[iB * 2 + 1];
      const tUC = toUVs[iC * 2];
      const tVC = toUVs[iC * 2 + 1];

      // Source UV coordinates
      const sUA = fromUVs[iA * 2];
      const sVA = fromUVs[iA * 2 + 1];
      const sUB = fromUVs[iB * 2];
      const sVB = fromUVs[iB * 2 + 1];
      const sUC = fromUVs[iC * 2];
      const sVC = fromUVs[iC * 2 + 1];

      // Screen/pixel space coordinates in target canvas (converting V: 0 bottom to top)
      const pAX = tUA * resolution;
      const pAY = (1.0 - tVA) * resolution;
      const pBX = tUB * resolution;
      const pBY = (1.0 - tVB) * resolution;
      const pCX = tUC * resolution;
      const pCY = (1.0 - tVC) * resolution;

      // Triangle bounding box
      const minX = Math.max(0, Math.floor(Math.min(pAX, pBX, pCX)));
      const maxX = Math.min(resolution - 1, Math.ceil(Math.max(pAX, pBX, pCX)));
      const minY = Math.max(0, Math.floor(Math.min(pAY, pBY, pCY)));
      const maxY = Math.min(resolution - 1, Math.ceil(Math.max(pAY, pBY, pCY)));

      // Determinant for barycentric coordinates
      const denom = (pBY - pCY) * (pAX - pCX) + (pCX - pBX) * (pAY - pCY);
      if (Math.abs(denom) < 1e-7) continue;

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          // Compute barycentric weights
          const wA = ((pBY - pCY) * (px - pCX) + (pCX - pBX) * (py - pCY)) / denom;
          const wB = ((pCY - pAY) * (px - pCX) + (pAX - pCX) * (py - pCY)) / denom;
          const wC = 1.0 - wA - wB;

          // Conservative sub-pixel tolerance to avoid seam gaps between triangles
          const eps = -0.005;
          if (wA >= eps && wB >= eps && wC >= eps) {
            // Compute mapped UV in source channel
            const srcU = wA * sUA + wB * sUB + wC * sUC;
            const srcV = wA * sVA + wB * sVB + wC * sVC;

            sampleSourceBilinear(srcU, srcV, sampledColor);

            const targetIdx = (py * resolution + px) * 4;
            targetData[targetIdx] = Math.round(sampledColor[0]);
            targetData[targetIdx + 1] = Math.round(sampledColor[1]);
            targetData[targetIdx + 2] = Math.round(sampledColor[2]);
            targetData[targetIdx + 3] = Math.round(sampledColor[3]);
          }
        }
      }
    }

    targetCtx.putImageData(targetImgData, 0, 0);

    // Apply gutter dilation (4px) to ensure zero edge bleeding or mipmap seam fringes
    SmartUVUnwrapEngine.dilateTextureSeams(targetCanvas, 4);

    return targetCanvas;
  }
}
