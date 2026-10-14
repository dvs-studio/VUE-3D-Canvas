/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Layer Conversion Tools
 * Created by Victory Ukpong
 * 
 * Provides production-grade conversions for texture layers:
 * 1. Convert to Bump Map (Grayscale luminance height distribution)
 * 2. Convert to Normal Map (Sobel gradient filter with tangent-space [128, 128, 255] baseline)
 * 3. Convert to Alpha Clip Mask (Binary thresholded alpha mask)
 */

import { Layer } from '../core/types';

export class LayerConversions {
  /**
   * Converts target layer to a Grayscale Bump / Height Map
   */
  public static convertToBumpMap(layer: Layer, contrast = 1.2): void {
    const ctx = layer.ctx;
    const w = layer.canvas.width;
    const h = layer.canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;

      // Standard perceptual luminance
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Contrast expansion around midpoint 128
      lum = (lum - 128) * contrast + 128;
      lum = Math.max(0, Math.min(255, Math.round(lum)));

      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
      // Preserve alpha
    }

    ctx.putImageData(imgData, 0, 0);
    layer.channel = 'height';
    if (!layer.name.includes('(Bump)')) {
      layer.name = `${layer.name} (Bump)`;
    }
  }

  /**
   * Converts target layer into a Tangent-Space Normal Map using a 3x3 Sobel operator
   */
  public static convertToNormalMap(layer: Layer, strength = 2.5): void {
    const ctx = layer.ctx;
    const w = layer.canvas.width;
    const h = layer.canvas.height;

    const srcImgData = ctx.getImageData(0, 0, w, h);
    const src = srcImgData.data;

    // First generate 1-channel luminance buffer
    const lum = new Float32Array(w * h);
    for (let i = 0; i < src.length; i += 4) {
      const a = src[i + 3] / 255.0;
      const l = (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) / 255.0;
      lum[i / 4] = l * a;
    }

    const dstImgData = ctx.createImageData(w, h);
    const dst = dstImgData.data;

    const getLum = (x: number, y: number): number => {
      const cx = Math.max(0, Math.min(w - 1, x));
      const cy = Math.max(0, Math.min(h - 1, y));
      return lum[cy * w + cx];
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Sobel filter kernels for dX and dY
        // [-1 0 1]
        // [-2 0 2]
        // [-1 0 1]
        const dX =
          -1.0 * getLum(x - 1, y - 1) +
           1.0 * getLum(x + 1, y - 1) +
          -2.0 * getLum(x - 1, y) +
           2.0 * getLum(x + 1, y) +
          -1.0 * getLum(x - 1, y + 1) +
           1.0 * getLum(x + 1, y + 1);

        // [-1 -2 -1]
        // [ 0  0  0]
        // [ 1  2  1]
        const dY =
          -1.0 * getLum(x - 1, y - 1) +
          -2.0 * getLum(x, y - 1) +
          -1.0 * getLum(x + 1, y - 1) +
           1.0 * getLum(x - 1, y + 1) +
           2.0 * getLum(x, y + 1) +
           1.0 * getLum(x + 1, y + 1);

        // Invert dY for standard DirectX / Three.js tangent space
        let nx = -dX * strength;
        let ny = -dY * strength;
        let nz = 1.0;

        // Normalize vector
        const len = Math.hypot(nx, ny, nz) || 1.0;
        nx /= len;
        ny /= len;
        nz /= len;

        // Encode [-1..1] into [0..255] RGB with baseline [128, 128, 255]
        const outIdx = (y * w + x) * 4;
        dst[outIdx] = Math.round((nx * 0.5 + 0.5) * 255);
        dst[outIdx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        dst[outIdx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        dst[outIdx + 3] = 255;
      }
    }

    ctx.putImageData(dstImgData, 0, 0);
    layer.channel = 'normal';
    if (!layer.name.includes('(Normal)')) {
      layer.name = `${layer.name} (Normal)`;
    }
  }

  /**
   * Converts target layer into a binary Alpha Clip Mask
   */
  public static convertToAlphaClipMask(layer: Layer, threshold = 128): void {
    const ctx = layer.ctx;
    const w = layer.canvas.width;
    const h = layer.canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      // Use alpha if partially transparent; otherwise use luminance
      const metric = a < 250 ? a : (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

      if (metric >= threshold) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    if (!layer.name.includes('(ClipMask)')) {
      layer.name = `${layer.name} (ClipMask)`;
    }
  }

  /**
   * Converts target layer into an Emissive glowing texture layer
   */
  public static convertToEmissive(layer: Layer, boost = 1.5): void {
    const ctx = layer.ctx;
    const w = layer.canvas.width;
    const h = layer.canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      data[i] = Math.min(255, Math.round(data[i] * boost));
      data[i + 1] = Math.min(255, Math.round(data[i + 1] * boost));
      data[i + 2] = Math.min(255, Math.round(data[i + 2] * boost));
    }

    ctx.putImageData(imgData, 0, 0);
    layer.channel = 'emission';
    if (!layer.name.includes('(Emission)')) {
      layer.name = `${layer.name} (Emission)`;
    }
  }
}
