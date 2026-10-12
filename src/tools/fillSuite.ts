/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Fill Suite & Triplanar Box Mapping
 * Created by Victory Ukpong
 */

import { SelectionMask } from '../core/types';
import { SelectionTool } from './selectionTool';

export interface TriplanarConfig {
  pattern: 'checker' | 'noise' | 'carbon_fiber' | 'brushed_metal' | 'grid' | 'cellular';
  scale: number;
  blendSharpness: number;
  primaryColor: string;
  secondaryColor: string;
  coordinateSpace?: 'object' | 'world';
  // Slope mask
  enableSlopeMask?: boolean;
  slopeThreshold?: number; // 0.0 to 1.0
  slopeSmoothing?: number; // 0.01 to 0.5
  slopeStrength?: number; // 0.0 to 1.0
  slopeInvert?: boolean;
  slopeUpAxis?: 'Y+' | 'Z+' | 'X+';
  // Altitude mask
  enableAltitudeMask?: boolean;
  altitudeLower?: number; // -1.0 to 1.0
  altitudeUpper?: number; // -1.0 to 1.0
  altitudeSmoothing?: number; // 0.01 to 0.5
  altitudeStrength?: number; // 0.0 to 1.0
  altitudeInvert?: boolean;
  // Height-aware blending
  heightAwareBlending?: boolean;
  heightContrast?: number; // 0.1 to 2.0
  // Texture offset
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
}

export class FillSuite {
  /**
   * Bucket Fill tool: Fills the active selection or whole canvas
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

    const radius = Math.hypot(endX - startX, endY - startY);
    const grad = ctx.createRadialGradient(startX, startY, 0, startX, startY, Math.max(1, radius));
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.restore();
  }

  /**
   * Smoothstep utility for safe numerical transitions
   */
  private static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0.0, Math.min(1.0, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
    return t * t * (3.0 - 2.0 * t);
  }

  /**
   * Procedural sample generator for a 2D plane (UV or planar coordinates)
   */
  private static evaluatePlanarPattern(
    u: number,
    v: number,
    pattern: TriplanarConfig['pattern']
  ): number {
    if (pattern === 'checker') {
      const px = (Math.floor(u) % 2 + 2) % 2;
      const py = (Math.floor(v) % 2 + 2) % 2;
      return (px ^ py) ? 1.0 : 0.0;
    } else if (pattern === 'grid') {
      const gx = Math.abs(u % 1.0);
      const gy = Math.abs(v % 1.0);
      return (gx < 0.07 || gy < 0.07) ? 1.0 : 0.0;
    } else if (pattern === 'carbon_fiber') {
      const cx = Math.sin(u * Math.PI * 4);
      const cy = Math.cos(v * Math.PI * 4);
      return (cx * cy > 0) ? 0.85 : 0.15;
    } else if (pattern === 'brushed_metal') {
      // High-frequency directional streaks with micro jitter
      const s = Math.sin(v * 32.0 + Math.sin(u * 2.0) * 1.5);
      return s * 0.5 + 0.5;
    } else if (pattern === 'cellular') {
      // Cellular Voronoi approximation
      const fx = Math.abs((u * 2) % 1.0 - 0.5);
      const fy = Math.abs((v * 2) % 1.0 - 0.5);
      const dist = Math.hypot(fx, fy);
      return Math.min(1.0, dist * 1.8);
    } else {
      // Procedural multi-frequency sine noise (Perlin-like approximation)
      const n1 = Math.sin(u * 2.4 + v * 1.8) * 0.5 + 0.5;
      const n2 = Math.cos(u * 5.1 - v * 4.3) * 0.25 + 0.25;
      const n3 = Math.sin((u + v) * 8.7) * 0.125 + 0.125;
      return Math.max(0.0, Math.min(1.0, n1 + n2 + n3));
    }
  }

  /**
   * Triplanar Box Mapping Fill:
   * Projects a seamless texture across XYZ planes directly onto the active texture canvas.
   * Includes UV-less X, Y, Z projections (YZ, XZ, XY coordinates),
   * normal-based projection weights with normalized blending and adjustable sharpness,
   * slope masks with configurable up direction, altitude masks, and optional height-aware blending.
   */
  public static applyTriplanarBoxFill(
    ctx: CanvasRenderingContext2D,
    config: TriplanarConfig,
    opacity = 100
  ) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    const scale = Math.max(0.5, config.scale);
    const c1 = this.hexToRgb(config.primaryColor);
    const c2 = this.hexToRgb(config.secondaryColor);
    const sharpness = Math.max(0.1, config.blendSharpness);

    // Configurable Up-Vector for slope and altitude
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

        // Spherical polar coordinate mapping to surface normal and position
        const phi = (u - 0.5) * Math.PI * 2.0;
        const theta = (v - 0.5) * Math.PI;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        // Position P & Normal N
        const px = cosTheta * cosPhi + offX;
        const py = sinTheta + offY;
        const pz = cosTheta * sinPhi + offZ;

        const nx = cosTheta * cosPhi;
        const ny = sinTheta;
        const nz = cosTheta * sinPhi;

        // 1. UV-less X, Y, and Z Planar Coordinates:
        // X projection plane: uses YZ coordinates
        const uX = (pz * scale);
        const vX = (py * scale);
        // Y projection plane: uses XZ coordinates
        const uY = (px * scale);
        const vY = (pz * scale);
        // Z projection plane: uses XY coordinates
        const uZ = (px * scale);
        const vZ = (py * scale);

        // Evaluate planar patterns
        const valX = this.evaluatePlanarPattern(uX, vX, config.pattern);
        const valY = this.evaluatePlanarPattern(uY, vY, config.pattern);
        const valZ = this.evaluatePlanarPattern(uZ, vZ, config.pattern);

        // 2. Normal-based projection weights with normalized blending and adjustable sharpness
        let wx = Math.pow(Math.abs(nx), sharpness);
        let wy = Math.pow(Math.abs(ny), sharpness);
        let wz = Math.pow(Math.abs(nz), sharpness);

        // Optional height-aware blending modulation
        if (config.heightAwareBlending) {
          const hContrast = config.heightContrast || 1.0;
          wx *= Math.pow(valX + 0.1, hContrast);
          wy *= Math.pow(valY + 0.1, hContrast);
          wz *= Math.pow(valZ + 0.1, hContrast);
        }

        const sumW = (wx + wy + wz) || 1.0;
        wx /= sumW;
        wy /= sumW;
        wz /= sumW;

        // Triplanar blended pattern value
        let patternVal = wx * valX + wy * valY + wz * valZ;

        // 3. Slope Mask (based on dot product with up direction)
        if (config.enableSlopeMask) {
          const cosSlope = nx * upX + ny * upY + nz * upZ;
          const thresh = config.slopeThreshold ?? 0.5;
          const smooth = config.slopeSmoothing ?? 0.15;
          let slopeFactor = this.smoothstep(thresh - smooth, thresh + smooth, cosSlope);
          if (config.slopeInvert) slopeFactor = 1.0 - slopeFactor;
          const strength = config.slopeStrength ?? 1.0;
          patternVal = patternVal * (1.0 - strength + strength * slopeFactor);
        }

        // 4. Altitude Mask (based on position along up direction)
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
          patternVal = patternVal * (1.0 - strength + strength * altFactor);
        }

        patternVal = Math.max(0.0, Math.min(1.0, patternVal));

        const r = Math.round(c1.r * (1 - patternVal) + c2.r * patternVal);
        const g = Math.round(c1.g * (1 - patternVal) + c2.g * patternVal);
        const b = Math.round(c1.b * (1 - patternVal) + c2.b * patternVal);
        const alpha = Math.round(255 * (opacity / 100));

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = alpha;
      }
    }

    ctx.putImageData(imgData, 0, 0);
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
