/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Symmetry & Symmetrize Cloning Engine
 * Created by Victory Ukpong
 */

import { Layer } from '../core/types';

export type SymmetryAxis = 'X' | 'Y' | 'Z';
export type SymmetryDirection = '+ to -' | '- to +';
export type SymmetryOriginMode = 'mesh_origin' | 'virtual_cursor';

export interface SymmetryConfig {
  axis: SymmetryAxis;
  direction: SymmetryDirection;
  originMode: SymmetryOriginMode;
  locatorValue: number; // -2.0 to 2.0 (slider / number coordinate along the axis)
  activeRealtimeMirror: boolean; // Bilateral mirror painting
  showVirtualCursorPlane: boolean; // Visual 3D slice plane
}

export class SymmetryEngine {
  /**
   * Symmetrizes the texture of the target layer by cloning pixels
   * from the chosen side across the symmetry line onto the opposite side.
   */
  public static symmetrizeLayer(
    layer: Layer,
    config: SymmetryConfig,
    w = layer.canvas.width,
    h = layer.canvas.height
  ) {
    const ctx = layer.ctx;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // In 0..1 UV coordinate space, map axis locator to UV pivot
    // For X-axis symmetry: mirrors horizontally (u)
    // For Y-axis symmetry: mirrors vertically (v)
    // For Z-axis symmetry: spherical polar longitude / latitude slice
    const pivot = Math.max(0.05, Math.min(0.95, 0.5 + config.locatorValue * 0.25));
    const pivotPixelX = Math.round(pivot * w);
    const pivotPixelY = Math.round(pivot * h);

    if (config.axis === 'X') {
      // Horizontal Symmetry (Left/Right)
      // + to - means copy right (+X, u > pivot) to left (-X, u < pivot)
      // - to + means copy left (-X, u < pivot) to right (+X, u > pivot)
      const copyFromRight = config.direction === '+ to -';

      for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
          const isSourceSide = copyFromRight ? x >= pivotPixelX : x <= pivotPixelX;

          if (!isSourceSide) {
            // Target pixel: calculate mirror counterpart
            const distFromPivot = pivotPixelX - x;
            const srcX = Math.max(0, Math.min(w - 1, pivotPixelX + distFromPivot));

            const dstIdx = (row + x) * 4;
            const srcIdx = (row + srcX) * 4;

            data[dstIdx] = data[srcIdx];
            data[dstIdx + 1] = data[srcIdx + 1];
            data[dstIdx + 2] = data[srcIdx + 2];
            data[dstIdx + 3] = data[srcIdx + 3];
          }
        }
      }
    } else if (config.axis === 'Y') {
      // Vertical Symmetry (Top/Bottom)
      const copyFromTop = config.direction === '+ to -';

      for (let y = 0; y < h; y++) {
        const isSourceSide = copyFromTop ? y >= pivotPixelY : y <= pivotPixelY;

        if (!isSourceSide) {
          const distFromPivot = pivotPixelY - y;
          const srcY = Math.max(0, Math.min(h - 1, pivotPixelY + distFromPivot));
          const srcRow = srcY * w;
          const dstRow = y * w;

          for (let x = 0; x < w; x++) {
            const dstIdx = (dstRow + x) * 4;
            const srcIdx = (srcRow + x) * 4;

            data[dstIdx] = data[srcIdx];
            data[dstIdx + 1] = data[srcIdx + 1];
            data[dstIdx + 2] = data[srcIdx + 2];
            data[dstIdx + 3] = data[srcIdx + 3];
          }
        }
      }
    } else {
      // Z-axis / Diagonal Polar Symmetry
      for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
          // Half-canvas diagonal mirror
          const isSourceSide = config.direction === '+ to -' ? x + y >= w : x + y <= w;
          if (!isSourceSide) {
            const srcX = Math.max(0, Math.min(w - 1, h - 1 - y));
            const srcY = Math.max(0, Math.min(h - 1, w - 1 - x));
            const dstIdx = (row + x) * 4;
            const srcIdx = (srcY * w + srcX) * 4;

            data[dstIdx] = data[srcIdx];
            data[dstIdx + 1] = data[srcIdx + 1];
            data[dstIdx + 2] = data[srcIdx + 2];
            data[dstIdx + 3] = data[srcIdx + 3];
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Calculates mirrored UV coordinate for real-time bilateral painting
   */
  public static getMirroredCoord(
    x: number,
    y: number,
    config: SymmetryConfig,
    w = 1024,
    h = 1024
  ): { x: number; y: number } {
    const pivotX = (0.5 + config.locatorValue * 0.25) * w;
    const pivotY = (0.5 + config.locatorValue * 0.25) * h;

    if (config.axis === 'X') {
      const mirrorX = 2 * pivotX - x;
      return { x: Math.max(0, Math.min(w - 1, mirrorX)), y };
    } else if (config.axis === 'Y') {
      const mirrorY = 2 * pivotY - y;
      return { x, y: Math.max(0, Math.min(h - 1, mirrorY)) };
    } else {
      // Z-axis diagonal symmetry
      const mirrorX = h - 1 - y;
      const mirrorY = w - 1 - x;
      return { x: mirrorX, y: mirrorY };
    }
  }
}
