/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Layer Gaussian Blur Engine
 * Created by Victory Ukpong
 * 
 * Image-editor style separable Gaussian blur targeting the selected layer only.
 * Features:
 * - Efficient separable horizontal & vertical passes.
 * - Quality presets: LOW_7x7, MEDIUM_15x15, HIGH_31x31.
 * - Radius control from 0.1 to 250 pixels with radius-aware multi-scale downsampling for large radii.
 * - Premultiplied alpha accumulation to completely eliminate dark halos/color fringes at transparent boundaries.
 */

export type BlurQualityPreset = 'LOW_7x7' | 'MEDIUM_15x15' | 'HIGH_31x31';

export interface GaussianBlurOptions {
  radius: number; // 0.1 to 250 pixels
  quality: BlurQualityPreset;
}

export class GaussianBlurEngine {
  /**
   * Generates a 1D Gaussian kernel array normalized to sum = 1.0
   */
  public static generateKernel(radius: number, maxTaps: number): Float32Array {
    // Sigma derived from radius: radius ≈ 2 * sigma
    const sigma = Math.max(0.2, radius / 2.0);
    const halfSize = Math.max(1, Math.min(Math.floor(maxTaps / 2), Math.ceil(radius)));
    const kernelSize = halfSize * 2 + 1;
    const kernel = new Float32Array(kernelSize);

    let sum = 0.0;
    const twoSigmaSq = 2.0 * sigma * sigma;

    for (let i = 0; i < kernelSize; i++) {
      const x = i - halfSize;
      const weight = Math.exp(-(x * x) / twoSigmaSq);
      kernel[i] = weight;
      sum += weight;
    }

    // Normalize
    for (let i = 0; i < kernelSize; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  /**
   * Determines maximum kernel taps based on quality preset
   */
  public static getMaxTapsForQuality(quality: BlurQualityPreset): number {
    switch (quality) {
      case 'LOW_7x7':
        return 7;
      case 'MEDIUM_15x15':
        return 15;
      case 'HIGH_31x31':
      default:
        return 31;
    }
  }

  /**
   * Applies Gaussian blur directly to a target CanvasRenderingContext2D
   */
  public static applyGaussianBlur(
    ctx: CanvasRenderingContext2D,
    options: GaussianBlurOptions
  ) {
    const { radius, quality } = options;
    if (radius <= 0.05) return;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const maxTaps = this.getMaxTapsForQuality(quality);

    // For very large radii (> 32px), use radius-aware downsample strategy
    // to maintain high interactive frame rates while accurately producing large blur radius.
    if (radius > 32) {
      this.applyMultiScaleBlur(ctx, radius, quality, maxTaps);
      return;
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    const src = imgData.data;
    const kernel = this.generateKernel(radius, maxTaps);

    const temp = new Uint8ClampedArray(src.length);
    const dst = new Uint8ClampedArray(src.length);

    // Pass 1: Horizontal Blur (src -> temp) with premultiplied alpha
    this.separablePassHorizontal(src, temp, w, h, kernel);

    // Pass 2: Vertical Blur (temp -> dst) with premultiplied alpha
    this.separablePassVertical(temp, dst, w, h, kernel);

    imgData.data.set(dst);
    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Multi-scale downsample/separable blur/upsample for large radii (> 32 to 250px)
   */
  private static applyMultiScaleBlur(
    ctx: CanvasRenderingContext2D,
    radius: number,
    quality: BlurQualityPreset,
    maxTaps: number
  ) {
    const origW = ctx.canvas.width;
    const origH = ctx.canvas.height;

    // Scale factor: downscale 2x for radius <= 80, 4x for radius > 80
    const downscale = radius > 80 ? 4 : 2;
    const scaledRadius = radius / downscale;

    // Create intermediate downscaled canvas
    const downCvs = document.createElement('canvas');
    downCvs.width = Math.max(32, Math.floor(origW / downscale));
    downCvs.height = Math.max(32, Math.floor(origH / downscale));
    const downCtx = downCvs.getContext('2d')!;

    // Smooth downscale
    downCtx.imageSmoothingEnabled = true;
    downCtx.imageSmoothingQuality = 'high';
    downCtx.drawImage(ctx.canvas, 0, 0, downCvs.width, downCvs.height);

    // Perform blur on downscaled image
    const dw = downCvs.width;
    const dh = downCvs.height;
    const downImg = downCtx.getImageData(0, 0, dw, dh);
    const kernel = this.generateKernel(scaledRadius, maxTaps);

    const temp = new Uint8ClampedArray(downImg.data.length);
    const dst = new Uint8ClampedArray(downImg.data.length);

    this.separablePassHorizontal(downImg.data, temp, dw, dh, kernel);
    this.separablePassVertical(temp, dst, dw, dh, kernel);

    downImg.data.set(dst);
    downCtx.putImageData(downImg, 0, 0);

    // Upscale back smoothly onto original canvas
    ctx.clearRect(0, 0, origW, origH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(downCvs, 0, 0, origW, origH);
  }

  /**
   * Separable Horizontal Pass with Premultiplied Alpha
   */
  private static separablePassHorizontal(
    src: Uint8ClampedArray,
    dst: Uint8ClampedArray,
    w: number,
    h: number,
    kernel: Float32Array
  ) {
    const half = Math.floor(kernel.length / 2);

    for (let y = 0; y < h; y++) {
      const rowOffset = y * w;

      for (let x = 0; x < w; x++) {
        let rAcc = 0;
        let gAcc = 0;
        let bAcc = 0;
        let aAcc = 0;

        for (let k = 0; k < kernel.length; k++) {
          const weight = kernel[k];
          const sampleX = Math.min(w - 1, Math.max(0, x + k - half));
          const idx = (rowOffset + sampleX) * 4;

          const a = src[idx + 3] / 255.0;
          rAcc += src[idx] * a * weight;
          gAcc += src[idx + 1] * a * weight;
          bAcc += src[idx + 2] * a * weight;
          aAcc += a * weight;
        }

        const outIdx = (rowOffset + x) * 4;
        if (aAcc > 0.0001) {
          dst[outIdx] = Math.round(rAcc / aAcc);
          dst[outIdx + 1] = Math.round(gAcc / aAcc);
          dst[outIdx + 2] = Math.round(bAcc / aAcc);
          dst[outIdx + 3] = Math.round(aAcc * 255.0);
        } else {
          dst[outIdx] = 0;
          dst[outIdx + 1] = 0;
          dst[outIdx + 2] = 0;
          dst[outIdx + 3] = 0;
        }
      }
    }
  }

  /**
   * Separable Vertical Pass with Premultiplied Alpha
   */
  private static separablePassVertical(
    src: Uint8ClampedArray,
    dst: Uint8ClampedArray,
    w: number,
    h: number,
    kernel: Float32Array
  ) {
    const half = Math.floor(kernel.length / 2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rAcc = 0;
        let gAcc = 0;
        let bAcc = 0;
        let aAcc = 0;

        for (let k = 0; k < kernel.length; k++) {
          const weight = kernel[k];
          const sampleY = Math.min(h - 1, Math.max(0, y + k - half));
          const idx = (sampleY * w + x) * 4;

          const a = src[idx + 3] / 255.0;
          rAcc += src[idx] * a * weight;
          gAcc += src[idx + 1] * a * weight;
          bAcc += src[idx + 2] * a * weight;
          aAcc += a * weight;
        }

        const outIdx = (y * w + x) * 4;
        if (aAcc > 0.0001) {
          dst[outIdx] = Math.round(rAcc / aAcc);
          dst[outIdx + 1] = Math.round(gAcc / aAcc);
          dst[outIdx + 2] = Math.round(bAcc / aAcc);
          dst[outIdx + 3] = Math.round(aAcc * 255.0);
        } else {
          dst[outIdx] = 0;
          dst[outIdx + 1] = 0;
          dst[outIdx + 2] = 0;
          dst[outIdx + 3] = 0;
        }
      }
    }
  }
}
