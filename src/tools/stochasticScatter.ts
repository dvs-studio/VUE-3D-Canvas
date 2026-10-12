/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Stochastic Layer Scattering Engine
 * Created by Victory Ukpong
 * 
 * Extends the texture/layer workflow to distribute patterns, stamps, or stencils
 * with controlled procedural variation and deterministic reproducibility.
 */

export interface StochasticScatterConfig {
  numberOfRepeats: number; // 0 = stochastic non-repeating mode; > 0 = repeat-aware mode
  stampDensity: number; // 1 to 100
  edgeBlendContrast: number; // 0.0 to 1.0
  scatterStrength: number; // 0.0 to 1.0
  randomSeed: number; // deterministic seed
  rotationMin: number; // -180 to 180 degrees
  rotationMax: number; // -180 to 180 degrees
  scaleMin: number; // 0.2 to 3.0
  scaleMax: number; // 0.2 to 3.0
  blendMode: 'NORMAL' | 'MULTIPLY' | 'OVERLAY' | 'ADD';
  stampType: 'grunge' | 'splat' | 'scratch' | 'dots' | 'cracks' | 'leaves' | 'stars' | 'hex' | 'circuit';
  primaryColor: string;
  secondaryColor?: string;
  colorJitter?: number; // 0.0 to 1.0
  opacity: number; // 1 to 100
}

/**
 * Fast deterministic PRNG (Mulberry32)
 */
class MulberryPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  public next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}

export class StochasticScatterEngine {
  /**
   * Generates a single procedural stamp canvas
   */
  public static createStampCanvas(
    type: StochasticScatterConfig['stampType'],
    size: number,
    color: string,
    contrast: number,
    prng: MulberryPRNG
  ): HTMLCanvasElement {
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    const ctx = cvs.getContext('2d')!;
    const center = size / 2;
    const radius = size * 0.45;

    ctx.save();
    ctx.fillStyle = color;

    if (type === 'grunge') {
      for (let i = 0; i < 24; i++) {
        const angle = prng.nextRange(0, Math.PI * 2);
        const dist = prng.nextRange(0, radius);
        const r = prng.nextRange(2, radius * 0.35);
        ctx.globalAlpha = prng.nextRange(0.2, 0.85);
        ctx.beginPath();
        ctx.arc(center + Math.cos(angle) * dist, center + Math.sin(angle) * dist, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'splat') {
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      const drops = 16;
      for (let i = 0; i < drops; i++) {
        const angle = prng.nextRange(0, Math.PI * 2);
        const dist = prng.nextRange(radius * 0.4, radius * 0.95);
        const dropR = prng.nextRange(1.5, radius * 0.15);
        ctx.beginPath();
        ctx.arc(center + Math.cos(angle) * dist, center + Math.sin(angle) * dist, dropR, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'scratch') {
      ctx.lineWidth = Math.max(1, radius * 0.08);
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      const lines = 6;
      for (let i = 0; i < lines; i++) {
        const x1 = prng.nextRange(size * 0.1, size * 0.9);
        const y1 = prng.nextRange(size * 0.1, size * 0.9);
        const len = prng.nextRange(radius * 0.4, radius * 1.2);
        const ang = prng.nextRange(-0.4, 0.4);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
        ctx.stroke();
      }
    } else if (type === 'dots') {
      const dotCount = 18;
      for (let i = 0; i < dotCount; i++) {
        const x = prng.nextRange(size * 0.1, size * 0.9);
        const y = prng.nextRange(size * 0.1, size * 0.9);
        const r = prng.nextRange(radius * 0.05, radius * 0.25);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'cracks') {
      ctx.lineWidth = Math.max(1.2, radius * 0.06);
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      let cx = center;
      let cy = center;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let i = 0; i < 7; i++) {
        cx += prng.nextRange(-radius * 0.35, radius * 0.35);
        cy += prng.nextRange(-radius * 0.35, radius * 0.35);
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    } else if (type === 'hex') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = center + Math.cos(a) * radius;
        const y = center + Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else if (type === 'stars') {
      ctx.beginPath();
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? radius : radius * 0.45;
        const a = (i * Math.PI) / points - Math.PI / 2;
        const x = center + Math.cos(a) * r;
        const y = center + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Default soft circular dab with edge contrast
      const grad = ctx.createRadialGradient(center, center, radius * contrast, center, center, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return cvs;
  }

  /**
   * Applies stochastic scattering across the target layer context
   */
  public static applyScatter(
    ctx: CanvasRenderingContext2D,
    config: StochasticScatterConfig
  ) {
    const prng = new MulberryPRNG(config.randomSeed);
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.save();

    // Map blend modes to Canvas globalCompositeOperation
    if (config.blendMode === 'MULTIPLY') {
      ctx.globalCompositeOperation = 'multiply';
    } else if (config.blendMode === 'OVERLAY') {
      ctx.globalCompositeOperation = 'overlay';
    } else if (config.blendMode === 'ADD') {
      ctx.globalCompositeOperation = 'lighter';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    const baseStampSize = 96;
    const stampCanvas = this.createStampCanvas(
      config.stampType,
      baseStampSize,
      config.primaryColor,
      config.edgeBlendContrast,
      prng
    );

    // Determine sample count:
    // If numberOfRepeats > 0: repeat-aware mode with exact repeat count
    // If numberOfRepeats = 0: stochastic non-repeating mode based on stamp density
    let totalStamps = 0;
    if (config.numberOfRepeats > 0) {
      totalStamps = config.numberOfRepeats;
    } else {
      // Stochastic continuous density (e.g. 15 to 300 stamps)
      totalStamps = Math.round(15 + (config.stampDensity / 100) * 280);
    }

    const radToDeg = Math.PI / 180;

    for (let i = 0; i < totalStamps; i++) {
      // Position calculation
      let px: number;
      let py: number;

      if (config.numberOfRepeats > 0) {
        // Grid-aligned jittered repeats
        const cols = Math.ceil(Math.sqrt(totalStamps));
        const rows = Math.ceil(totalStamps / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);

        const cellW = w / cols;
        const cellH = h / rows;
        const jitterX = (prng.next() - 0.5) * cellW * config.scatterStrength;
        const jitterY = (prng.next() - 0.5) * cellH * config.scatterStrength;

        px = (col + 0.5) * cellW + jitterX;
        py = (row + 0.5) * cellH + jitterY;
      } else {
        // Pure stochastic non-repeating distribution across UV canvas
        px = prng.next() * w;
        py = prng.next() * h;
      }

      // Rotation & Scaling
      const rotDeg = prng.nextRange(config.rotationMin, config.rotationMax);
      const rotRad = rotDeg * radToDeg;
      const scale = prng.nextRange(config.scaleMin, config.scaleMax);

      const stampW = baseStampSize * scale;
      const stampH = baseStampSize * scale;

      // Opacity with slight natural variation
      const stampAlpha = Math.max(0.05, Math.min(1.0, (config.opacity / 100) * prng.nextRange(0.8, 1.0)));

      ctx.save();
      ctx.globalAlpha = stampAlpha;
      ctx.translate(px, py);
      ctx.rotate(rotRad);

      ctx.drawImage(stampCanvas, -stampW / 2, -stampH / 2, stampW, stampH);
      ctx.restore();
    }

    ctx.restore();
  }
}
