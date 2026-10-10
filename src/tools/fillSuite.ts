/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Fill Suite & Triplanar Box Mapping
 * Created by Victory Ukpong
 */

import { SelectionMask } from '../core/types';
import { SelectionTool } from './selectionTool';

export interface TriplanarConfig {
  pattern: 'checker' | 'noise' | 'carbon_fiber' | 'brushed_metal' | 'grid';
  scale: number;
  blendSharpness: number;
  primaryColor: string;
  secondaryColor: string;
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
   * Triplanar Box Mapping Fill:
   * Projects a seamless texture across XYZ planes directly onto the active texture canvas.
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

    const scale = Math.max(2, config.scale);
    const c1 = this.hexToRgb(config.primaryColor);
    const c2 = this.hexToRgb(config.secondaryColor);

    // Generate procedural triplanar mapping
    for (let y = 0; y < h; y++) {
      const v = y / h;
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const idx = (y * w + x) * 4;

        // Simulate 3D sphere/box surface coordinates from UV
        const phi = u * Math.PI * 2;
        const theta = v * Math.PI;
        const nx = Math.sin(theta) * Math.cos(phi);
        const ny = Math.cos(theta);
        const nz = Math.sin(theta) * Math.sin(phi);

        // Triplanar weights (XYZ blending with sharpness)
        let wx = Math.pow(Math.abs(nx), config.blendSharpness);
        let wy = Math.pow(Math.abs(ny), config.blendSharpness);
        let wz = Math.pow(Math.abs(nz), config.blendSharpness);
        const sum = (wx + wy + wz) || 1;
        wx /= sum;
        wy /= sum;
        wz /= sum;

        let patternVal = 0;

        if (config.pattern === 'checker') {
          const px = Math.floor(u * scale) % 2;
          const py = Math.floor(v * scale) % 2;
          patternVal = (px ^ py) ? 1 : 0;
        } else if (config.pattern === 'grid') {
          const gx = (u * scale) % 1;
          const gy = (v * scale) % 1;
          patternVal = (gx < 0.08 || gy < 0.08) ? 1 : 0;
        } else if (config.pattern === 'carbon_fiber') {
          const cx = Math.sin(u * scale * 20);
          const cy = Math.cos(v * scale * 20);
          patternVal = (cx * cy > 0) ? 0.8 : 0.2;
        } else {
          // Triplanar projected noise simulation
          const sampleX = Math.sin(u * scale * 8) * 0.5 + 0.5;
          const sampleY = Math.cos(v * scale * 8) * 0.5 + 0.5;
          const sampleZ = Math.sin((u + v) * scale * 6) * 0.5 + 0.5;
          patternVal = sampleX * wx + sampleY * wy + sampleZ * wz;
        }

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
