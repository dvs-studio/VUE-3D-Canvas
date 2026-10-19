/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Pattern Stamp Tool Engine (3D Decal Surface Stamper)
 * Created by Victory Ukpong
 * 
 * Provides independent sticker/decal stamping directly onto the 3D model surface:
 * 1. Independent decal logic and asset handling (distinct from pattern fill layers)
 * 2. Dedicated sharpness and imperfection masks (torn edges, missing fragments, edge jitter)
 * 3. Mask & torn edge alpha-aware engine with centered imported texture support (B/W and alpha values)
 * 4. Blendable grunge texture overlays strictly alpha-aware (never bleeding outside decal boundaries)
 * 5. Randomization & scattering rotation (0 = Random angle per stamp)
 */

import { PatternStampConfig, BlendMode } from '../core/types';

export interface DecalPreset {
  id: string;
  name: string;
  category: string;
  render: (ctx: CanvasRenderingContext2D, size: number) => void;
}

export class PatternStampEngine {
  private static imageCache = new Map<string, HTMLImageElement>();

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

  private static getImage(url: string): HTMLImageElement | null {
    if (!url) return null;
    let img = this.imageCache.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      this.imageCache.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  /**
   * Generates a rendered stamp canvas with imperfections, torn edge mask, and strictly alpha-aware grunge
   */
  public static generateStampCanvas(config: PatternStampConfig, renderResolution = 256): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = renderResolution;
    canvas.height = renderResolution;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw Base Stamp Decal
    if (config.stampDataUrl && config.stampDataUrl.startsWith('data:')) {
      const img = this.getImage(config.stampDataUrl) || new Image();
      if (!img.src) img.src = config.stampDataUrl;

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, renderResolution, renderResolution);
      } else {
        this.renderPresetDecal(ctx, config.stampId, renderResolution);
      }
    } else {
      this.renderPresetDecal(ctx, config.stampId, renderResolution);
    }

    // 2. Apply Torn Edge & Mask Alpha Engine (B/W & Alpha Aware, Centered)
    this.applyTornEdgeAndMask(ctx, renderResolution, config);

    // 3. Apply Grunge Overlay (Strictly Transparency & Alpha Aware - Never Exceeding Outer Boundary)
    if (config.enableGrungeOverlay) {
      this.applyGrungeOverlay(ctx, renderResolution, config);
    }

    return canvas;
  }

  private static renderPresetDecal(ctx: CanvasRenderingContext2D, stampId: string, size: number) {
    const preset = this.BUILTIN_STAMPS.find(s => s.id === stampId) || this.BUILTIN_STAMPS[0];
    preset.render(ctx, size);
  }

  /**
   * Torn Edge & Mask Alpha Engine:
   * - Influences edges around the alpha channel
   * - Imported mask texture is centered and influences the torn part via B/W luminance or alpha values
   * - Only modifies the decal alpha channel without altering underlying external canvas
   */
  private static applyTornEdgeAndMask(
    ctx: CanvasRenderingContext2D,
    size: number,
    config: PatternStampConfig
  ) {
    const { sharpness, missingEdgeAmount, edgeJitter, tornMaskTextureUrl } = config;

    if (missingEdgeAmount <= 0.01 && edgeJitter <= 0.01 && sharpness >= 0.98 && !tornMaskTextureUrl) {
      return;
    }

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.48;

    // Optional imported mask texture sampler
    let maskData: Uint8ClampedArray | null = null;
    if (tornMaskTextureUrl) {
      const maskImg = this.getImage(tornMaskTextureUrl);
      if (maskImg) {
        const mCanvas = document.createElement('canvas');
        mCanvas.width = size;
        mCanvas.height = size;
        const mCtx = mCanvas.getContext('2d')!;
        mCtx.drawImage(maskImg, 0, 0, size, size);
        maskData = mCtx.getImageData(0, 0, size, size).data;
      }
    }

    for (let y = 0; y < size; y++) {
      const dy = y - cy;
      for (let x = 0; x < size; x++) {
        const dx = x - cx;
        const idx = (y * size + x) * 4;
        const alpha = data[idx + 3];
        if (alpha === 0) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = dist / maxR;

        // Sample imported mask texture at center if present
        let maskTearFactor = 1.0;
        if (maskData) {
          const mr = maskData[idx];
          const mg = maskData[idx + 1];
          const mb = maskData[idx + 2];
          const ma = maskData[idx + 3] / 255;
          // Calculate B/W luminance
          const lum = (0.299 * mr + 0.587 * mg + 0.114 * mb) / 255;
          maskTearFactor = lum * ma;
        }

        // Procedural edge noise for chipping / tearing
        const noise = (Math.sin(x * 0.18 + Math.cos(y * 0.22) * 3.0) + Math.cos(x * 0.35 - y * 0.28)) * 0.5 + 0.5;
        const microNoise = (Math.sin(x * 1.5 + y * 1.2) * 43758.5453 % 1.0);

        // Combined torn factor: procedural noise multiplied by mask texture
        const combinedTear = (noise * 0.7 + microNoise * 0.3) * (maskData ? maskTearFactor : 1.0);

        // Missing edge threshold (influences edges around the alpha channel)
        if (missingEdgeAmount > 0.05 && normDist > 0.55) {
          const tearThresh = 1.0 - missingEdgeAmount * 0.65;
          if (combinedTear > tearThresh || (maskData && maskTearFactor < (missingEdgeAmount * 0.8))) {
            data[idx + 3] = 0; // Torn edge eroded
            continue;
          }
        }

        // Edge jitter roughness
        if (edgeJitter > 0.05 && normDist > 0.75) {
          const jitterThresh = 1.0 - edgeJitter * 0.45;
          if (microNoise > jitterThresh) {
            data[idx + 3] = Math.round(alpha * 0.25);
            continue;
          }
        }

        // Softness / sharpness gradient
        if (sharpness < 0.95 && normDist > 0.68) {
          const falloff = 1.0 - (normDist - 0.68) / (0.32 * (1.05 - sharpness));
          data[idx + 3] = Math.round(data[idx + 3] * Math.max(0, Math.min(1, falloff)));
        }

        // If imported mask texture is enabled, mask strictly adds/restricts alpha channel
        if (maskData && config.tornInfluenceAlphaOnly) {
          data[idx + 3] = Math.round(data[idx + 3] * maskTearFactor);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  /**
   * Applies embedded image presets or custom imported grunge textures.
   * STRICT GUARANTEE: Grunge NEVER exceeds or bleeds outside the decal alpha boundary!
   */
  private static applyGrungeOverlay(
    ctx: CanvasRenderingContext2D,
    size: number,
    config: PatternStampConfig
  ) {
    const { grungePreset, grungeBlendMode, grungeOpacity, grungeScale, customGrungeUrl } = config;

    // 1. Record initial decal alpha mask so grunge cannot bleed outside it
    const preImgData = ctx.getImageData(0, 0, size, size);
    const preData = preImgData.data;
    const decalAlphaMask = new Uint8ClampedArray(size * size);
    for (let i = 0; i < size * size; i++) {
      decalAlphaMask[i] = preData[i * 4 + 3];
    }

    // 2. Render Grunge Image Texture
    const grungeCanvas = document.createElement('canvas');
    grungeCanvas.width = size;
    grungeCanvas.height = size;
    const gCtx = grungeCanvas.getContext('2d')!;

    let customImg: HTMLImageElement | null = null;
    if (customGrungeUrl) {
      customImg = this.getImage(customGrungeUrl);
    }

    if (customImg) {
      gCtx.drawImage(customImg, 0, 0, size, size);
    } else {
      this.renderEmbeddedGrunge(gCtx, size, grungePreset, grungeScale || 1.0);
    }

    // 3. Composite Grunge onto decal using specified Blend Mode
    ctx.save();
    ctx.globalCompositeOperation = this.toCanvasComposite(grungeBlendMode);
    ctx.globalAlpha = Math.max(0, Math.min(1, grungeOpacity / 100));
    ctx.drawImage(grungeCanvas, 0, 0);
    ctx.restore();

    // 4. STRICT ALPHA RE-CONSTRAIN: Zero out or clamp any pixel outside original decal alpha!
    const postImgData = ctx.getImageData(0, 0, size, size);
    const postData = postImgData.data;

    for (let i = 0; i < size * size; i++) {
      const origA = decalAlphaMask[i];
      const pIdx = i * 4;

      if (origA === 0) {
        // Completely transparent in original decal: enforce zero alpha
        postData[pIdx] = 0;
        postData[pIdx + 1] = 0;
        postData[pIdx + 2] = 0;
        postData[pIdx + 3] = 0;
      } else {
        // Pixel cannot exceed original decal opacity
        postData[pIdx + 3] = Math.min(origA, postData[pIdx + 3]);
      }
    }

    ctx.putImageData(postImgData, 0, 0);
  }

  /**
   * High-fidelity embedded procedural grunge image textures
   */
  private static renderEmbeddedGrunge(
    gCtx: CanvasRenderingContext2D,
    size: number,
    preset: string,
    scale: number
  ) {
    const imgData = gCtx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const sx = x * scale;
        const sy = y * scale;

        let val = 128;
        if (preset === 'scratched') {
          // Sharp directional scratches and micro scrapes
          const scratch = Math.abs(Math.sin(sx * 0.05 + sy * 0.05)) > 0.93 ? 30 : 240;
          const fine = Math.abs(Math.sin(sx * 0.22 - sy * 0.18)) > 0.95 ? 20 : 255;
          const cross = Math.abs(Math.sin(sx * 0.15 + sy * 0.28)) > 0.96 ? 40 : 250;
          val = Math.min(scratch, fine, cross);
        } else if (preset === 'dirty_spots') {
          // Organic grease stains and dust spatter
          const blob = (Math.sin(sx * 0.04) * Math.cos(sy * 0.04) + Math.sin(sx * 0.09 + sy * 0.07)) * 0.5 + 0.5;
          const speckle = (Math.sin(sx * 1.8 + sy * 2.3) * 43758.5453) % 1.0;
          val = Math.round((blob * 0.7 + (speckle > 0.85 ? 0.2 : 0.8) * 0.3) * 255);
        } else if (preset === 'cracked_paint') {
          // Fractured peeling network
          const gridX = Math.floor(sx * 0.08);
          const gridY = Math.floor(sy * 0.08);
          const cell = (Math.sin(gridX * 12.9898 + gridY * 78.233) * 43758.5453) % 1.0;
          val = cell > 0.82 ? 35 : 225;
        } else if (preset === 'concrete_weather') {
          // Pitted porous concrete weathering
          const n1 = Math.sin(sx * 0.12) * Math.cos(sy * 0.14);
          const n2 = Math.sin(sx * 0.45 + sy * 0.38) * 0.5;
          const pore = (Math.sin(sx * 2.2 + sy * 1.9) * 31415.92) % 1.0;
          val = Math.round(((n1 + n2 + 1.5) / 3.0 * 0.8 + (pore > 0.9 ? 0.1 : 0.9) * 0.2) * 255);
        } else if (preset === 'peeling_paint') {
          // Peeling flaked paint edges
          const flake = Math.sin(sx * 0.06 + Math.sin(sy * 0.06) * 2.0);
          val = flake > 0.3 ? 245 : 50;
        } else {
          // Worn patina grain
          const grain = (Math.sin(sx * 1.3 + sy * 1.7) * 23847.2) % 1.0;
          val = Math.round(grain * 255);
        }

        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }

    gCtx.putImageData(imgData, 0, 0);
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
   * Handles 0 = Random angle and randomization scattering
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

    // Determine final angle: 0 = Random angle per stamp
    let finalAngle = config.rotation;
    if (finalAngle === 0) {
      finalAngle = Math.random() * 360;
    }
    if (config.enableRandomScattering) {
      const variance = config.scatterAngleVariance ?? 45;
      finalAngle += (Math.random() - 0.5) * variance * 2;
    }

    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.rotate((finalAngle * Math.PI) / 180);
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
