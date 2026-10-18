/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Edge Wear & Ambient Occlusion Curvature Filter
 * Created by Victory Ukpong
 * 
 * Provides procedural edge wear and cavity dirt generation:
 * 1. Analyzes surface curvature and normal divergence to detect sharp ridges vs concave crevices
 * 2. Generates organic edge peeling, bare metal chips, and cavity ambient occlusion dirt
 * 3. Supports noise jitter, edge contrast, wear color tinting, and blend modes
 */

import { Layer, EdgeWearConfig, BlendMode } from '../core/types';

export class EdgeWearEngine {
  /**
   * Applies Edge Wear and Ambient Occlusion to target layer
   */
  public static applyEdgeWear(layer: Layer, config: EdgeWearConfig): void {
    const ctx = layer.ctx;
    const w = layer.canvas.width;
    const h = layer.canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const origData = new Uint8ClampedArray(data);

    // Parse wear color
    const wearRgb = this.hexToRgb(config.wearColor || '#c0c0c0');

    const wearAmount = config.wearAmount ?? 0.5;
    const contrast = config.contrast ?? 1.5;
    const edgeNoise = config.edgeNoise ?? 0.35;
    const cavityDarkening = config.cavityDarkening ?? 0.6;
    const applyRidges = config.applyToRidges ?? true;
    const applyCavity = config.applyToCavity ?? true;

    // Convolution kernel radius for curvature gradient
    const r = Math.max(1, Math.min(8, Math.round(config.curvatureRadius ?? 2)));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const a = origData[idx + 3];
        if (a === 0) continue;

        // Sample adjacent pixels for Laplacian / 2nd derivative curvature
        const leftIdx = (y * w + Math.max(0, x - r)) * 4;
        const rightIdx = (y * w + Math.min(w - 1, x + r)) * 4;
        const topIdx = (Math.max(0, y - r) * w + x) * 4;
        const bottomIdx = (Math.min(h - 1, y + r) * w + x) * 4;

        // Luminance proxy for height/surface relief
        const lumCenter = this.getLum(origData, idx);
        const lumL = this.getLum(origData, leftIdx);
        const lumR = this.getLum(origData, rightIdx);
        const lumT = this.getLum(origData, topIdx);
        const lumB = this.getLum(origData, bottomIdx);

        // Discrete Laplacian: L = (L + R + T + B) - 4 * Center
        // Positive: Concave cavity / valley (dark ambient occlusion)
        // Negative: Convex ridge / peak (exposed edge wear)
        const laplacian = (lumL + lumR + lumT + lumB) / 4.0 - lumCenter;

        // Micro-noise perturbation for organic chipped edge boundaries
        const jitter = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1.0) * edgeNoise;
        const perturbed = laplacian + jitter * 35.0;

        let rVal = origData[idx];
        let gVal = origData[idx + 1];
        let bVal = origData[idx + 2];

        // 1. Convex Ridges: Bare metal exposure / peeling paint
        if (applyRidges && perturbed < -5.0 * (1.1 - wearAmount)) {
          let edgeFactor = Math.abs(perturbed) / (40.0 / Math.max(0.1, contrast));
          edgeFactor = Math.min(1.0, Math.max(0.0, edgeFactor * wearAmount * 2.0));

          // Blend with wear color (exposed metal / primer)
          rVal = Math.round(rVal * (1 - edgeFactor) + wearRgb.r * edgeFactor);
          gVal = Math.round(gVal * (1 - edgeFactor) + wearRgb.g * edgeFactor);
          bVal = Math.round(bVal * (1 - edgeFactor) + wearRgb.b * edgeFactor);
        }

        // 2. Concave Crevices: Ambient occlusion dirt & grim accumulation
        if (applyCavity && perturbed > 4.0 * (1.1 - cavityDarkening)) {
          let cavityFactor = perturbed / (45.0 / Math.max(0.1, contrast));
          cavityFactor = Math.min(1.0, Math.max(0.0, cavityFactor * cavityDarkening * 1.5));

          // Grime darkening towards dirt black/brown
          rVal = Math.round(rVal * (1 - cavityFactor * 0.7));
          gVal = Math.round(gVal * (1 - cavityFactor * 0.75));
          bVal = Math.round(bVal * (1 - cavityFactor * 0.8));
        }

        data[idx] = rVal;
        data[idx + 1] = gVal;
        data[idx + 2] = bVal;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  private static getLum(data: Uint8ClampedArray, idx: number): number {
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }
}
