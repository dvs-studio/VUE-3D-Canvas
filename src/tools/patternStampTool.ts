/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Pattern Stamp Tool Engine (3D Decal Surface Stamper)
 * Created by Victory Ukpong
 * 
 * Provides independent sticker/decal stamping directly onto the 3D model surface:
 * 1. Independent decal logic and asset handling (distinct from pattern fill layers)
 * 2. Dedicated sharpness and imperfection masks (torn edges, missing fragments, edge jitter)
 * 3. Blendable grunge texture overlays (scratches, grease, peeling distress)
 */

import { PatternStampConfig, BlendMode } from '../core/types';

export interface DecalPreset {
  id: string;
  name: string;
  category: string;
  render: (ctx: CanvasRenderingContext2D, size: number) => void;
}

export class PatternStampEngine {
  private static stampCache = new Map<string, HTMLCanvasElement>();

  public static readonly BUILTIN_STAMPS: DecalPreset[] = [
    {
      id: 'hazard_stripes',
      name: 'Hazard Caution',
      category: 'Industrial',
      render: (ctx, s) => {
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(0, 0, s, s);
        ctx.fillStyle = '#111111';
        const stripeWidth = s / 7;
        for (let i = -s; i < s * 2; i += stripeWidth * 2) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + stripeWidth, 0);
          ctx.lineTo(i + stripeWidth - s, s);
          ctx.lineTo(i - s, s);
          ctx.closePath();
          ctx.fill();
        }
      }
    },
    {
      id: 'military_star',
      name: 'Allied Star',
      category: 'Insignia',
      render: (ctx, s) => {
        const cx = s / 2;
        const cy = s / 2;
        const r = s * 0.42;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = s * 0.04;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const innerR = r * 0.38;
        for (let i = 0; i < 5; i++) {
          const aOuter = (i * 72 - 90) * Math.PI / 180;
          const aInner = ((i * 72 + 36) - 90) * Math.PI / 180;
          const ox = cx + Math.cos(aOuter) * (r * 0.88);
          const oy = cy + Math.sin(aOuter) * (r * 0.88);
          const ix = cx + Math.cos(aInner) * innerR;
          const iy = cy + Math.sin(aInner) * innerR;
          if (i === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
      }
    },
    {
      id: 'biohazard',
      name: 'Biohazard Warning',
      category: 'Warning',
      render: (ctx, s) => {
        const cx = s / 2;
        const cy = s / 2;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111111';
        ctx.font = `bold ${Math.round(s * 0.22)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BIO', cx, cy - s * 0.08);
        ctx.fillText('HAZARD', cx, cy + s * 0.12);
      }
    },
    {
      id: 'squad_07',
      name: 'Squad Unit 07',
      category: 'Military',
      render: (ctx, s) => {
        ctx.strokeStyle = '#e5a038';
        ctx.lineWidth = s * 0.04;
        ctx.strokeRect(s * 0.1, s * 0.1, s * 0.8, s * 0.8);

        ctx.fillStyle = '#e5a038';
        ctx.font = `900 ${Math.round(s * 0.42)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('07', s / 2, s / 2);
      }
    },
    {
      id: 'circuit_chip',
      name: 'Cyber Core IC',
      category: 'Sci-Fi',
      render: (ctx, s) => {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6);
        ctx.strokeStyle = '#3d7fb8';
        ctx.lineWidth = s * 0.03;
        ctx.strokeRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6);

        // Circuit pins
        ctx.fillStyle = '#fab387';
        for (let i = 0; i < 4; i++) {
          const off = s * 0.3 + i * (s * 0.13);
          ctx.fillRect(s * 0.08, off, s * 0.12, s * 0.04);
          ctx.fillRect(s * 0.8, off, s * 0.12, s * 0.04);
        }
      }
    },
    {
      id: 'skull_insignia',
      name: 'Corsair Skull',
      category: 'Insignia',
      render: (ctx, s) => {
        const cx = s / 2;
        const cy = s * 0.44;
        ctx.fillStyle = '#f5f5f5';

        // Skull dome
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Jaw
        ctx.fillRect(cx - s * 0.15, cy + s * 0.15, s * 0.3, s * 0.18);

        // Eye sockets
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx - s * 0.1, cy, s * 0.08, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.1, cy, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Crossbones behind
        ctx.strokeStyle = '#f5f5f5';
        ctx.lineWidth = s * 0.06;
        ctx.beginPath();
        ctx.moveTo(s * 0.15, s * 0.85);
        ctx.lineTo(s * 0.85, s * 0.15);
        ctx.moveTo(s * 0.85, s * 0.85);
        ctx.lineTo(s * 0.15, s * 0.15);
        ctx.stroke();
      }
    }
  ];

  /**
   * Generates or retrieves a rendered stamp canvas with imperfections & grunge overlay
   */
  public static generateStampCanvas(config: PatternStampConfig, renderResolution = 256): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = renderResolution;
    canvas.height = renderResolution;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw Base Stamp Decal
    if (config.stampDataUrl && config.stampDataUrl.startsWith('data:')) {
      const img = new Image();
      img.src = config.stampDataUrl;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, renderResolution, renderResolution);
      } else {
        this.renderPresetDecal(ctx, config.stampId, renderResolution);
      }
    } else {
      this.renderPresetDecal(ctx, config.stampId, renderResolution);
    }

    // 2. Apply Sharpness & Imperfection Mask (torn edges / chipped mask)
    this.applyImperfectionMask(ctx, renderResolution, config.sharpness, config.missingEdgeAmount, config.edgeJitter);

    // 3. Apply Grunge Overlay with Blend Mode
    if (config.enableGrungeOverlay) {
      this.applyGrungeOverlay(
        ctx,
        renderResolution,
        config.grungePreset,
        config.grungeBlendMode,
        config.grungeOpacity,
        config.grungeScale,
        config.customGrungeUrl
      );
    }

    return canvas;
  }

  private static renderPresetDecal(ctx: CanvasRenderingContext2D, stampId: string, size: number) {
    const preset = this.BUILTIN_STAMPS.find(s => s.id === stampId) || this.BUILTIN_STAMPS[0];
    preset.render(ctx, size);
  }

  /**
   * Chipping, tearing, and edge jitter imperfection algorithm
   */
  private static applyImperfectionMask(
    ctx: CanvasRenderingContext2D,
    size: number,
    sharpness: number,
    missingEdge: number,
    edgeJitter: number
  ) {
    if (missingEdge <= 0.01 && edgeJitter <= 0.01 && sharpness >= 0.98) return;

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.48;

    for (let y = 0; y < size; y++) {
      const dy = y - cy;
      for (let x = 0; x < size; x++) {
        const dx = x - cx;
        const idx = (y * size + x) * 4;
        const alpha = data[idx + 3];
        if (alpha === 0) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = dist / maxR;

        // Procedural edge noise for chipping / tearing
        const noise = (Math.sin(x * 0.18 + Math.cos(y * 0.22) * 3.0) + Math.cos(x * 0.35 - y * 0.28)) * 0.5 + 0.5;
        const microNoise = (Math.sin(x * 1.5 + y * 1.2) * 43758.5453 % 1.0);

        // Missing edge threshold
        if (missingEdge > 0.05 && normDist > 0.65) {
          const tearThresh = 1.0 - missingEdge * 0.6;
          if (noise * 0.7 + microNoise * 0.3 > tearThresh) {
            data[idx + 3] = 0; // Chipped / torn fragment
            continue;
          }
        }

        // Edge jitter roughness
        if (edgeJitter > 0.05 && normDist > 0.8) {
          const jitterThresh = 1.0 - edgeJitter * 0.4;
          if (microNoise > jitterThresh) {
            data[idx + 3] = Math.round(alpha * 0.3);
            continue;
          }
        }

        // Softness / sharpness gradient
        if (sharpness < 0.95 && normDist > 0.7) {
          const falloff = 1.0 - (normDist - 0.7) / (0.3 * (1.05 - sharpness));
          data[idx + 3] = Math.round(alpha * Math.max(0, Math.min(1, falloff)));
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Applies procedural or custom grunge overlay with blend modes
   */
  private static applyGrungeOverlay(
    ctx: CanvasRenderingContext2D,
    size: number,
    preset: string,
    blendMode: BlendMode,
    opacity: number,
    scale: number,
    customUrl?: string
  ) {
    const grungeCanvas = document.createElement('canvas');
    grungeCanvas.width = size;
    grungeCanvas.height = size;
    const gCtx = grungeCanvas.getContext('2d')!;

    // Generate grunge texture pattern
    const imgData = gCtx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const sx = x * (scale || 1.0);
        const sy = y * (scale || 1.0);

        let val = 128;
        if (preset === 'scratched') {
          // Sharp directional scratches
          const scratch = Math.abs(Math.sin(sx * 0.05 + sy * 0.05)) > 0.94 ? 0 : 255;
          const fine = Math.abs(Math.sin(sx * 0.2 - sy * 0.15)) > 0.96 ? 0 : 255;
          val = Math.min(scratch, fine);
        } else if (preset === 'dirty_spots') {
          // Organic grease stains
          const blob = (Math.sin(sx * 0.04) * Math.cos(sy * 0.04) + Math.sin(sx * 0.08 + sy * 0.06)) * 0.5 + 0.5;
          val = Math.round(blob * 255);
        } else if (preset === 'cracked_paint') {
          // Voronoi / cracked network
          const gridX = Math.floor(sx * 0.1);
          const gridY = Math.floor(sy * 0.1);
          const cell = (Math.sin(gridX * 12.9898 + gridY * 78.233) * 43758.5453) % 1.0;
          val = cell > 0.85 ? 40 : 230;
        } else {
          // Worn patina grain
          const grain = (Math.sin(sx * 1.3 + sy * 1.7) * 23847.2) % 1.0;
          val = Math.round(grain * 255);
        }

        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = Math.round((opacity / 100) * 255);
      }
    }

    gCtx.putImageData(imgData, 0, 0);

    // Composite with specified blend mode
    ctx.save();
    ctx.globalCompositeOperation = this.toCanvasComposite(blendMode);
    ctx.globalAlpha = opacity / 100;
    ctx.drawImage(grungeCanvas, 0, 0);
    ctx.restore();
  }

  private static toCanvasComposite(mode: BlendMode): GlobalCompositeOperation {
    switch (mode) {
      case 'multiply': return 'multiply';
      case 'screen': return 'screen';
      case 'overlay': return 'overlay';
      case 'darken': return 'darken';
      case 'lighten': return 'lighten';
      case 'hard_light': return 'hard-light';
      case 'soft_light': return 'soft-light';
      case 'difference': return 'difference';
      default: return 'source-over';
    }
  }

  /**
   * Stamps a decal onto target canvas at (u, v) UV coordinates with rotation and size
   */
  public static stampOnCanvas(
    targetCtx: CanvasRenderingContext2D,
    u: number,
    v: number,
    config: PatternStampConfig
  ): void {
    const w = targetCtx.canvas.width;
    const h = targetCtx.canvas.height;
    const stampCanvas = this.generateStampCanvas(config, 256);

    const cx = u * w;
    const cy = v * h;
    const stampRadius = config.size || 64;

    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.rotate((config.rotation * Math.PI) / 180);
    targetCtx.globalAlpha = (config.opacity ?? 100) / 100;

    targetCtx.drawImage(
      stampCanvas,
      -stampRadius,
      -stampRadius,
      stampRadius * 2,
      stampRadius * 2
    );

    targetCtx.restore();
  }
}
