/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Fill Suite & Triplanar Box Mapping Engine
 * Created by Victory Ukpong
 * 
 * Re-architected with:
 * 1. Real Image Texture operations (photos/pictures) rather than raw colors.
 * 2. Mixing Value Operator utilizing cloud/noise and classic patterns.
 * 3. Support for blank alpha textures (blending nothing for seamless surface merging).
 * 4. Tiling randomization and world coordinate box-mapping.
 * 5. Bleed and edge noise parameterization.
 * 6. Protection via active selection and texture mask brush.
 */

import { SelectionMask, TriplanarConfig, TriplanarTextureItem } from '../core/types';
import { SelectionTool } from './selectionTool';

export type { TriplanarConfig, TriplanarTextureItem };

export class FillSuite {
  // Texture buffer cache for fast sampling
  private static textureBufferCache = new Map<string, { width: number; height: number; data: Uint8ClampedArray }>();

  /**
   * Generates or retrieves a pixel buffer for a triplanar texture item
   */
  public static getTextureBuffer(item: TriplanarTextureItem): { width: number; height: number; data: Uint8ClampedArray } {
    const key = item.id || item.name || 'default';
    if (this.textureBufferCache.has(key)) {
      return this.textureBufferCache.get(key)!;
    }

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    if (item.isTransparentBlank) {
      // Blank alpha: Completely transparent
      ctx.clearRect(0, 0, size, size);
    } else if (item.dataUrl) {
      // Image data URL provided
      const img = new Image();
      img.src = item.dataUrl;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, size, size);
      } else {
        this.renderProceduralPreset(ctx, item.id || item.name, size);
      }
    } else {
      this.renderProceduralPreset(ctx, item.id || item.name, size);
    }

    const imgData = ctx.getImageData(0, 0, size, size);
    const result = { width: size, height: size, data: imgData.data };
    this.textureBufferCache.set(key, result);
    return result;
  }

  /**
   * Pre-renders high quality procedural image textures for built-in presets
   */
  private static renderProceduralPreset(ctx: CanvasRenderingContext2D, preset: string, size: number): void {
    const p = preset.toLowerCase();
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    if (p.includes('sand_fine') || p.includes('desert') || p.includes('sand 1') || p.includes('sand')) {
      // Golden fine desert sand with wind ripples
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const ripple = Math.sin(x * 0.08 + Math.cos(y * 0.04) * 2.0) * 0.5 + 0.5;
          const grain = (Math.sin(x * 12.3 + y * 9.7) * 43758.5453 % 1.0) * 0.15;
          const factor = 0.8 + ripple * 0.15 + grain;
          data[idx] = Math.min(255, Math.floor(218 * factor));     // R: warm gold
          data[idx + 1] = Math.min(255, Math.floor(180 * factor)); // G: sand amber
          data[idx + 2] = Math.min(255, Math.floor(125 * factor)); // B: dark earth
          data[idx + 3] = 255;
        }
      }
    } else if (p.includes('sand_coarse') || p.includes('grit') || p.includes('sand 2')) {
      // Coarse dark river sand / gravel pebbles
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const pebble = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.5 + 0.5;
          const grain = (Math.sin(x * 15.1 - y * 13.9) * 28374.2 % 1.0) * 0.3;
          const factor = 0.65 + pebble * 0.2 + grain;
          data[idx] = Math.min(255, Math.floor(165 * factor));
          data[idx + 1] = Math.min(255, Math.floor(135 * factor));
          data[idx + 2] = Math.min(255, Math.floor(95 * factor));
          data[idx + 3] = 255;
        }
      }
    } else if (p.includes('moss') || p.includes('foliage')) {
      // Deep green forest moss
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const cluster = Math.sin(x * 0.09) * Math.sin(y * 0.09) * 0.5 + 0.5;
          const micro = (Math.sin(x * 21.0 + y * 18.0) * 12948.3 % 1.0) * 0.2;
          const factor = 0.7 + cluster * 0.25 + micro;
          data[idx] = Math.min(255, Math.floor(65 * factor));      // Dark forest green
          data[idx + 1] = Math.min(255, Math.floor(135 * factor)); // Vibrant moss
          data[idx + 2] = Math.min(255, Math.floor(45 * factor));
          data[idx + 3] = 255;
        }
      }
    } else if (p.includes('rock') || p.includes('stone') || p.includes('granite')) {
      // Granite stone flecks
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const n = Math.sin(x * 0.05 + y * 0.05) * 0.2 + 0.8;
          const fleck = (Math.sin(x * 37.1 + y * 41.3) * 43928.1 % 1.0) > 0.65 ? 0.35 : 0.0;
          const val = Math.min(255, Math.floor((120 * n) + (fleck * 80)));
          data[idx] = val;
          data[idx + 1] = Math.floor(val * 0.96);
          data[idx + 2] = Math.floor(val * 0.92);
          data[idx + 3] = 255;
        }
      }
    } else if (p.includes('rust') || p.includes('oxide')) {
      // Rusted metal with peeling oxide flakes
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const patch = Math.sin(x * 0.07 - y * 0.06) * 0.5 + 0.5;
          const flake = (Math.sin(x * 19.3 + y * 27.1) * 38291.5 % 1.0);
          data[idx] = Math.min(255, Math.floor(180 * patch + flake * 40));
          data[idx + 1] = Math.min(255, Math.floor(75 * patch + flake * 20));
          data[idx + 2] = Math.min(255, Math.floor(30 * patch + flake * 10));
          data[idx + 3] = 255;
        }
      }
    } else if (p.includes('wood') || p.includes('timber')) {
      // Fine woodgrain planks
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const ring = Math.sin(x * 0.25 + Math.sin(y * 0.04) * 4.0) * 0.5 + 0.5;
          const streak = (Math.sin(y * 0.8) * 0.5 + 0.5) * 0.15;
          const factor = 0.7 + ring * 0.2 + streak;
          data[idx] = Math.min(255, Math.floor(115 * factor));
          data[idx + 1] = Math.min(255, Math.floor(75 * factor));
          data[idx + 2] = Math.min(255, Math.floor(45 * factor));
          data[idx + 3] = 255;
        }
      }
    } else {
      // Default weathered slate / concrete
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const n = Math.sin(x * 0.06 + y * 0.04) * 0.15 + 0.85;
          const noise = (Math.sin(x * 17.0 + y * 23.0) * 23948.1 % 1.0) * 0.15;
          const val = Math.min(255, Math.floor(130 * (n + noise)));
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Samples RGBA color from a texture buffer at UV coordinates with scaling and offset
   */
  private static sampleTextureBuffer(
    buf: { width: number; height: number; data: Uint8ClampedArray },
    u: number,
    v: number,
    scale = 1.0,
    offX = 0,
    offY = 0
  ): [number, number, number, number] {
    const su = (((u * scale + offX) % 1.0) + 1.0) % 1.0;
    const sv = (((v * scale + offY) % 1.0) + 1.0) % 1.0;
    const px = Math.min(buf.width - 1, Math.max(0, Math.floor(su * buf.width)));
    const py = Math.min(buf.height - 1, Math.max(0, Math.floor(sv * buf.height)));
    const idx = (py * buf.width + px) * 4;
    return [buf.data[idx], buf.data[idx + 1], buf.data[idx + 2], buf.data[idx + 3]];
  }

  /**
   * Evaluates the procedural mixer pattern (clouds, fractal noise, cellular, classic patterns)
   */
  private static evaluateMixerOperator(
    u: number,
    v: number,
    pattern: TriplanarConfig['mixerPattern'] = 'clouds',
    edgeNoise = 0.0,
    bleed = 0.0
  ): number {
    let baseVal = 0.5;

    if (pattern === 'checker') {
      const px = (Math.floor(u) % 2 + 2) % 2;
      const py = (Math.floor(v) % 2 + 2) % 2;
      baseVal = (px ^ py) ? 1.0 : 0.0;
    } else if (pattern === 'grid') {
      const gx = Math.abs(u % 1.0);
      const gy = Math.abs(v % 1.0);
      baseVal = (gx < 0.08 || gy < 0.08) ? 1.0 : 0.0;
    } else if (pattern === 'cellular') {
      const fx = Math.abs((u * 2) % 1.0 - 0.5);
      const fy = Math.abs((v * 2) % 1.0 - 0.5);
      baseVal = Math.min(1.0, Math.hypot(fx, fy) * 2.0);
    } else if (pattern === 'carbon_fiber') {
      const cx = Math.sin(u * Math.PI * 4);
      const cy = Math.cos(v * Math.PI * 4);
      baseVal = (cx * cy > 0) ? 0.85 : 0.15;
    } else if (pattern === 'brushed_metal') {
      baseVal = Math.sin(v * 32.0 + Math.sin(u * 2.0) * 1.5) * 0.5 + 0.5;
    } else {
      // Default: Multi-octave fractal clouds & noise (fBm)
      const n1 = Math.sin(u * 2.4 + v * 1.8) * 0.5 + 0.5;
      const n2 = Math.cos(u * 5.1 - v * 4.3) * 0.25 + 0.25;
      const n3 = Math.sin((u + v) * 10.7) * 0.125 + 0.125;
      const n4 = Math.cos(u * 22.0 - v * 19.0) * 0.0625 + 0.0625;
      baseVal = Math.max(0.0, Math.min(1.0, n1 + n2 + n3 + n4));
    }

    // Apply edge noise distortion
    if (edgeNoise > 0.01) {
      const noisePerturb = (Math.sin(u * 37.3 + v * 43.1) * 0.5 + 0.5) * edgeNoise * 0.5;
      baseVal = THREE_Math_clamp(baseVal + (noisePerturb - edgeNoise * 0.25), 0.0, 1.0);
    }

    // Apply bleeding / boundary softness transition
    if (bleed > 0.01) {
      const edge0 = Math.max(0.0, 0.5 - bleed * 0.45);
      const edge1 = Math.min(1.0, 0.5 + bleed * 0.45);
      baseVal = this.smoothstep(edge0, edge1, baseVal);
    }

    return baseVal;
  }

  /**
   * Smoothstep utility
   */
  private static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0.0, Math.min(1.0, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
    return t * t * (3.0 - 2.0 * t);
  }

  /**
   * Advanced Triplanar Box Mapping Fill with Multi-Texture Mixing Operator:
   * 1. Operates on real image textures (photos/presets).
   * 2. Uses noise/cloud patterns as a mixing value operator between textures.
   * 3. Seamlessly blends blank alpha textures into underlying surface paint.
   * 4. Eliminates repetitive tiling with randomized coordinate jitter.
   * 5. Protects areas masked by the Mask brush or active selections.
   */
  public static applyTriplanarBoxFill(
    ctx: CanvasRenderingContext2D,
    config: TriplanarConfig,
    opacity = 100,
    mask: SelectionMask | null = null
  ) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const currentImgData = ctx.getImageData(0, 0, w, h);
    const origData = currentImgData.data;

    const outImgData = ctx.createImageData(w, h);
    const data = outImgData.data;

    // Default to at least 2 textures
    const textureList: TriplanarTextureItem[] = (config.textures && config.textures.length > 0)
      ? config.textures
      : [
          { id: 'sand_fine', name: 'Desert Dune Sand', scale: 1.0 },
          { id: 'sand_coarse', name: 'Coarse Grit Sand', scale: 1.0 },
        ];

    const buffers = textureList.map(t => ({
      item: t,
      buf: this.getTextureBuffer(t),
    }));

    const globalScale = Math.max(0.2, config.scale || 6.0);
    const sharpness = Math.max(0.1, config.blendSharpness || 3.0);
    const mixerPattern = config.mixerPattern || 'clouds';
    const mixingValue = config.mixingValue ?? 0.5;
    const edgeNoise = config.edgeNoiseValue ?? 0.35;
    const bleed = config.bleedingValue ?? 0.25;
    const tilingRand = config.tilingRandomization ?? 0.45;

    // Up axis for slope & altitude
    let upX = 0, upY = 1, upZ = 0;
    if (config.slopeUpAxis === 'Z+') {
      upX = 0; upY = 0; upZ = 1;
    } else if (config.slopeUpAxis === 'X+') {
      upX = 1; upY = 0; upZ = 0;
    }

    const offX = config.offsetX || 0;
    const offY = config.offsetY || 0;
    const offZ = config.offsetZ || 0;

    for (let y = 0; y < h; y++) {
      const v = y / h;
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const idx = (y * w + x) * 4;

        // Selection & Mask Brush Check: Protect area outside selection
        if (mask && mask.active && !SelectionTool.isPointInSelection(x, y, mask)) {
          data[idx] = origData[idx];
          data[idx + 1] = origData[idx + 1];
          data[idx + 2] = origData[idx + 2];
          data[idx + 3] = origData[idx + 3];
          continue;
        }

        // Spherical polar projection to 3D surface position & normal
        const phi = (u - 0.5) * Math.PI * 2.0;
        const theta = (v - 0.5) * Math.PI;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const px = cosTheta * cosPhi + offX;
        const py = sinTheta + offY;
        const pz = cosTheta * sinPhi + offZ;

        const nx = cosTheta * cosPhi;
        const ny = sinTheta;
        const nz = cosTheta * sinPhi;

        // Normal-based projection weights
        let wx = Math.pow(Math.abs(nx), sharpness);
        let wy = Math.pow(Math.abs(ny), sharpness);
        let wz = Math.pow(Math.abs(nz), sharpness);
        const sumW = (wx + wy + wz) || 1.0;
        wx /= sumW;
        wy /= sumW;
        wz /= sumW;

        // Tiling Randomization jitter
        let jX = 0, jY = 0, jZ = 0;
        if (tilingRand > 0.01) {
          const cX = Math.floor(px * globalScale);
          const cY = Math.floor(py * globalScale);
          const cZ = Math.floor(pz * globalScale);
          const h1 = (Math.sin(cX * 12.9898 + cY * 78.233) * 43758.5453 % 1.0) * tilingRand * 0.4;
          const h2 = (Math.sin(cY * 23.1111 + cZ * 45.191) * 23421.6312 % 1.0) * tilingRand * 0.4;
          const h3 = (Math.sin(cZ * 34.5678 + cX * 67.891) * 31245.8921 % 1.0) * tilingRand * 0.4;
          jX = h1; jY = h2; jZ = h3;
        }

        // Planar coordinates for XYZ projections
        const uX = (pz + jX) * globalScale;
        const vX = (py + jY) * globalScale;

        const uY = (px + jY) * globalScale;
        const vY = (pz + jZ) * globalScale;

        const uZ = (px + jX) * globalScale;
        const vZ = (py + jZ) * globalScale;

        // Sample and blend each texture item across XYZ planes
        const sampledTextureColors: [number, number, number, number][] = buffers.map(({ item, buf }) => {
          if (item.isTransparentBlank) {
            // Sample the underlying canvas pixel so blank alpha leaves original surface intact
            return [origData[idx], origData[idx + 1], origData[idx + 2], 0];
          }

          const cX = this.sampleTextureBuffer(buf, uX, vX, item.scale || 1.0, item.offsetX, item.offsetY);
          const cY = this.sampleTextureBuffer(buf, uY, vY, item.scale || 1.0, item.offsetX, item.offsetY);
          const cZ = this.sampleTextureBuffer(buf, uZ, vZ, item.scale || 1.0, item.offsetX, item.offsetY);

          const r = cX[0] * wx + cY[0] * wy + cZ[0] * wz;
          const g = cX[1] * wx + cY[1] * wy + cZ[1] * wz;
          const b = cX[2] * wx + cY[2] * wy + cZ[2] * wz;
          const a = cX[3] * wx + cY[3] * wy + cZ[3] * wz;

          return [r, g, b, a];
        });

        // 2. MIXING VALUE OPERATOR between multiple textures
        const mixCoordU = (px * 0.5 + pz * 0.5) * (config.mixerScale || 4.0);
        const mixCoordV = py * (config.mixerScale || 4.0);
        const rawMix = this.evaluateMixerOperator(mixCoordU, mixCoordV, mixerPattern, edgeNoise, bleed);

        let finalR = sampledTextureColors[0][0];
        let finalG = sampledTextureColors[0][1];
        let finalB = sampledTextureColors[0][2];
        let finalA = sampledTextureColors[0][3];

        if (sampledTextureColors.length === 2) {
          // 2 textures: smooth blend driven by mixingValue and rawMix
          const mixFactor = this.smoothstep(
            Math.max(0, mixingValue - 0.35 * (bleed + 0.1)),
            Math.min(1, mixingValue + 0.35 * (bleed + 0.1)),
            rawMix
          );

          const cA = sampledTextureColors[0];
          const cB = sampledTextureColors[1];

          if (buffers[1].item.isTransparentBlank) {
            // Blank alpha: blend from texture 0 into original underlying canvas pixels!
            finalR = cA[0] * (1 - mixFactor) + origData[idx] * mixFactor;
            finalG = cA[1] * (1 - mixFactor) + origData[idx + 1] * mixFactor;
            finalB = cA[2] * (1 - mixFactor) + origData[idx + 2] * mixFactor;
            finalA = cA[3] * (1 - mixFactor) + origData[idx + 3] * mixFactor;
          } else {
            finalR = cA[0] * (1 - mixFactor) + cB[0] * mixFactor;
            finalG = cA[1] * (1 - mixFactor) + cB[1] * mixFactor;
            finalB = cA[2] * (1 - mixFactor) + cB[2] * mixFactor;
            finalA = cA[3] * (1 - mixFactor) + cB[3] * mixFactor;
          }
        } else if (sampledTextureColors.length > 2) {
          // Multi-texture stack with + button: sequentially mix each additional texture
          const nTex = sampledTextureColors.length;
          const segment = 1.0 / (nTex - 1);
          const scaledMix = THREE_Math_clamp(rawMix * (mixingValue * 2.0), 0.0, 0.999);
          const segIdx = Math.min(nTex - 2, Math.floor(scaledMix / segment));
          const localT = (scaledMix - segIdx * segment) / segment;

          const cA = sampledTextureColors[segIdx];
          const cB = sampledTextureColors[segIdx + 1];

          if (buffers[segIdx + 1].item.isTransparentBlank) {
            finalR = cA[0] * (1 - localT) + origData[idx] * localT;
            finalG = cA[1] * (1 - localT) + origData[idx + 1] * localT;
            finalB = cA[2] * (1 - localT) + origData[idx + 2] * localT;
            finalA = cA[3] * (1 - localT) + origData[idx + 3] * localT;
          } else {
            finalR = cA[0] * (1 - localT) + cB[0] * localT;
            finalG = cA[1] * (1 - localT) + cB[1] * localT;
            finalB = cA[2] * (1 - localT) + cB[2] * localT;
            finalA = cA[3] * (1 - localT) + cB[3] * localT;
          }
        }

        // 3. Slope Mask
        let maskMultiplier = 1.0;
        if (config.enableSlopeMask) {
          const cosSlope = nx * upX + ny * upY + nz * upZ;
          const thresh = config.slopeThreshold ?? 0.5;
          const smooth = config.slopeSmoothing ?? 0.15;
          let slopeFactor = this.smoothstep(thresh - smooth, thresh + smooth, cosSlope);
          if (config.slopeInvert) slopeFactor = 1.0 - slopeFactor;
          const strength = config.slopeStrength ?? 1.0;
          maskMultiplier *= (1.0 - strength + strength * slopeFactor);
        }

        // 4. Altitude Mask
        if (config.enableAltitudeMask) {
          const altitude = px * upX + py * upY + pz * upZ;
          const altLower = config.altitudeLower ?? -0.6;
          const altUpper = config.altitudeUpper ?? 0.6;
          const altSmooth = config.altitudeSmoothing ?? 0.15;
          const maskLower = this.smoothstep(altLower - altSmooth, altLower + altSmooth, altitude);
          const maskUpper = 1.0 - this.smoothstep(altUpper - altSmooth, altUpper + altSmooth, altitude);
          let altFactor = maskLower * maskUpper;
          if (config.altitudeInvert) altFactor = 1.0 - altFactor;
          const strength = config.altitudeStrength ?? 1.0;
          maskMultiplier *= (1.0 - strength + strength * altFactor);
        }

        maskMultiplier = Math.max(0.0, Math.min(1.0, maskMultiplier));

        // Blend triplanar fill onto existing pixel data based on opacity and mask
        const effAlpha = (opacity / 100) * (finalA / 255) * maskMultiplier;
        data[idx] = Math.round(finalR * effAlpha + origData[idx] * (1 - effAlpha));
        data[idx + 1] = Math.round(finalG * effAlpha + origData[idx + 1] * (1 - effAlpha));
        data[idx + 2] = Math.round(finalB * effAlpha + origData[idx + 2] * (1 - effAlpha));
        data[idx + 3] = Math.max(origData[idx + 3], Math.round(255 * effAlpha));
      }
    }

    ctx.putImageData(outImgData, 0, 0);
  }

  /**
   * Bucket Fill tool
   */
  public static applyBucketFill(
    ctx: CanvasRenderingContext2D,
    color: string,
    opacity = 100,
    mask: SelectionMask | null = null
  ) {
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = color;

    if (mask && mask.active) {
      SelectionTool.clipContextToSelection(ctx, mask);
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    ctx.restore();
  }

  /**
   * Linear Gradient Fill
   */
  public static applyLinearGradient(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color1: string,
    color2: string,
    opacity = 100,
    mask: SelectionMask | null = null
  ) {
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    if (mask && mask.active) {
      SelectionTool.clipContextToSelection(ctx, mask);
    }

    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.restore();
  }

  /**
   * Radial Gradient Fill
   */
  public static applyRadialGradient(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color1: string,
    color2: string,
    opacity = 100,
    mask: SelectionMask | null = null
  ) {
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    if (mask && mask.active) {
      SelectionTool.clipContextToSelection(ctx, mask);
    }

    const rad = Math.hypot(endX - startX, endY - startY);
    const grad = ctx.createRadialGradient(startX, startY, 0, startX, startY, Math.max(1, rad));
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.restore();
  }
}

function THREE_Math_clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
