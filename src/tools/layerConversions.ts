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
   * Enables bump contribution without destroying the painted colour pixels.
   * Height is derived from the source luminance during map composition/export.
   */
  public static convertToBumpMap(layer: Layer): void {
    const previous = layer.pbrSettings;
    layer.pbrSettings = {
      roughness: previous?.roughness ?? 0.5,
      metallic: previous?.metallic ?? 0,
      bumpHeight: previous?.bumpHeight ?? 1,
      normalStrength: previous?.normalStrength ?? 1,
      emissionStrength: previous?.emissionStrength ?? 0,
      emissionColor: previous?.emissionColor ?? '#ffffff',
      opacity: previous?.opacity ?? (layer.opacity ?? 100) / 100,
      enableColor: true,
      enableBump: true,
      reflectionSource: previous?.reflectionSource ?? 'hdri',
      reflectionIntensity: previous?.reflectionIntensity ?? 0.8,
      colorOn: true,
      colorInfluence: 1,
      reflectionOn: false,
      reflectionInfluence: 0,
      emissionOn: false,
      emissionInfluence: 0,
      bumpOn: true,
      bumpInfluence: 1,
      bumpRamp: [{ position: 0, height: 0 }, { position: 1, height: 1 }],
      normalLock: false,
    };
    if (!layer.name.includes('(Bump)')) layer.name = `${layer.name} (Bump)`;
  }

  /**
   * Converts the painted pixels to a standalone grayscale displacement source.
   */
  public static convertToDisplacementMap(layer: Layer): void {
    // Keep source pixels intact; the height channel is derived from luminance at bake time.
    layer.channel = 'height';
    const previous = layer.pbrSettings;
    layer.pbrSettings = {
      roughness: previous?.roughness ?? 0.5,
      metallic: previous?.metallic ?? 0,
      bumpHeight: previous?.bumpHeight ?? 1,
      normalStrength: previous?.normalStrength ?? 1,
      emissionStrength: previous?.emissionStrength ?? 0,
      emissionColor: previous?.emissionColor ?? '#ffffff',
      opacity: previous?.opacity ?? (layer.opacity ?? 100) / 100,
      enableColor: false,
      enableBump: true,
      reflectionSource: previous?.reflectionSource ?? 'hdri',
      reflectionIntensity: previous?.reflectionIntensity ?? 0.8,
      colorOn: false,
      colorInfluence: 0,
      reflectionOn: false,
      reflectionInfluence: 0,
      emissionOn: false,
      emissionInfluence: 0,
      bumpOn: true,
      bumpInfluence: 1,
      bumpRamp: [{ position: 0, height: 0 }, { position: 1, height: 1 }],
      normalLock: false,
    };
    if (!layer.name.includes('(Displacement)')) layer.name = `${layer.name} (Displacement)`;
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
    const previous = layer.pbrSettings;
    layer.pbrSettings = {
      roughness: previous?.roughness ?? 0.5,
      metallic: previous?.metallic ?? 0,
      bumpHeight: previous?.bumpHeight ?? 1,
      normalStrength: previous?.normalStrength ?? 1,
      emissionStrength: previous?.emissionStrength ?? 0,
      emissionColor: previous?.emissionColor ?? '#ffffff',
      opacity: previous?.opacity ?? (layer.opacity ?? 100) / 100,
      enableColor: false,
      enableBump: false,
      reflectionSource: previous?.reflectionSource ?? 'hdri',
      reflectionIntensity: previous?.reflectionIntensity ?? 0.8,
      colorOn: false,
      colorInfluence: 0,
      reflectionOn: false,
      reflectionInfluence: 0,
      emissionOn: false,
      emissionInfluence: 0,
      bumpOn: false,
      bumpInfluence: 0,
      bumpRamp: [{ position: 0, height: 0 }, { position: 1, height: 1 }],
      normalLock: true,
    };
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
   * Uses the existing painted RGB as emission; no destructive colour boost.
   */
  public static convertToEmissive(layer: Layer): void {
    const previous = layer.pbrSettings;
    layer.channel = 'emission';
    layer.pbrSettings = {
      roughness: previous?.roughness ?? 0.5,
      metallic: previous?.metallic ?? 0,
      bumpHeight: previous?.bumpHeight ?? 1,
      normalStrength: previous?.normalStrength ?? 1,
      emissionStrength: previous?.emissionStrength ?? 1,
      emissionColor: previous?.emissionColor ?? '#ffffff',
      opacity: previous?.opacity ?? (layer.opacity ?? 100) / 100,
      enableColor: false,
      enableBump: false,
      reflectionSource: previous?.reflectionSource ?? 'hdri',
      reflectionIntensity: previous?.reflectionIntensity ?? 0.8,
      colorOn: false,
      colorInfluence: 0,
      reflectionOn: false,
      reflectionInfluence: 0,
      emissionOn: true,
      emissionInfluence: 1,
      bumpOn: false,
      bumpInfluence: 0,
      bumpRamp: [{ position: 0, height: 0 }, { position: 1, height: 1 }],
      normalLock: false,
    };
    if (!layer.name.includes('(Emission)')) layer.name = `${layer.name} (Emission)`;
  }

  /**
   * Converts the current pixels to a grayscale reflection-strength map.
   */
  public static convertToReflection(layer: Layer): void {
    // Reflection strength is derived from source luminance; do not grayscale or overwrite albedo.
    const previous = layer.pbrSettings;
    layer.pbrSettings = {
      roughness: previous?.roughness ?? 0.5,
      metallic: previous?.metallic ?? 0,
      bumpHeight: previous?.bumpHeight ?? 1,
      normalStrength: previous?.normalStrength ?? 1,
      emissionStrength: previous?.emissionStrength ?? 0,
      emissionColor: previous?.emissionColor ?? '#ffffff',
      opacity: previous?.opacity ?? (layer.opacity ?? 100) / 100,
      enableColor: true,
      enableBump: previous?.enableBump ?? false,
      reflectionSource: previous?.reflectionSource ?? 'hdri',
      reflectionIntensity: previous?.reflectionIntensity ?? 0.8,
      colorOn: true,
      colorInfluence: previous?.colorInfluence ?? 1,
      reflectionOn: true,
      reflectionInfluence: 1,
      emissionOn: previous?.emissionOn ?? false,
      emissionInfluence: previous?.emissionInfluence ?? 0,
      bumpOn: previous?.bumpOn ?? false,
      bumpInfluence: previous?.bumpInfluence ?? 0,
      bumpRamp: previous?.bumpRamp || [{ position: 0, height: 0 }, { position: 1, height: 1 }],
      normalLock: false,
    };
    if (!layer.name.includes('(Reflection)')) layer.name = `${layer.name} (Reflection)`;
  }

  /**
   * Inverts the RGB colors of the layer while preserving its alpha mask
   */
  public static invertLayerColor(layer: Layer): void {
    const ctx = layer.ctx;
    const w = layer.canvas.width;
    const h = layer.canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    ctx.putImageData(imgData, 0, 0);
  }
}

