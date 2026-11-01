/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Stochastic Layer Scattering Engine
 * Created by Victory Ukpong
 * 
 * Extends the texture/layer workflow to distribute patterns, stamps, or stencils
 * with controlled procedural variation, deterministic reproducibility, custom texture
 * import, physical color masking, and alpha-based outline dilation/blur.
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
  stampType: 'grunge' | 'splat' | 'scratch' | 'dots' | 'cracks' | 'leaves' | 'stars' | 'hex' | 'circuit' | 'custom';
  primaryColor: string;
  secondaryColor?: string;
  colorJitter?: number; // 0.0 to 1.0
  rotationJitter?: number; // 0 to 180 degrees
  opacity: number; // 1 to 100
  // Custom image texture & physical mask fill
  customImageElement?: HTMLImageElement | HTMLCanvasElement | null;
  customImageUrl?: string;
  usePhysicalFillColor?: boolean;
  // Alpha outline effect
  enableOutline?: boolean;
  outlineColor?: string;
  outlineSpread?: number; // 0 to 20 px
  outlineBlur?: number; // 0 to 15 px
}

/**
 * Fast deterministic PRNG (Mulberry32)
 */
export class MulberryPRNG {
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
   * Generates a single procedural or custom texture stamp canvas
   */
  public static createStampCanvas(
    config: StochasticScatterConfig,
    baseSize: number,
    prng: MulberryPRNG
  ): HTMLCanvasElement {
    const rawSize = baseSize;
    const rawCvs = document.createElement('canvas');
    rawCvs.width = rawSize;
    rawCvs.height = rawSize;
    const rawCtx = rawCvs.getContext('2d', { willReadFrequently: true })!;

    const center = rawSize / 2;
    const radius = rawSize * 0.44;
    const type = config.stampType;
    
    // Preset authentic default colors when usePhysicalFillColor is false
    const presetDefaultColors: Record<string, string> = {
      grunge: '#4b433b',
      splat: '#e5a038',
      scratch: '#94a3b8',
      dots: '#0284c7',
      cracks: '#71717a',
      hex: '#8b5cf6',
      stars: '#eab308',
      leaves: '#16a34a',
      circuit: '#06b6d4',
    };

    // If usePhysicalFillColor is checked, use the user's selected primaryColor
    // Otherwise use authentic preset color (or custom image's native pixels)
    const color = config.usePhysicalFillColor
      ? config.primaryColor
      : (presetDefaultColors[type] || config.primaryColor);
    const contrast = config.edgeBlendContrast;

    rawCtx.save();
    rawCtx.fillStyle = color;

    if (type === 'custom' && config.customImageElement) {
      // Custom image texture stamp:
      // By default (!config.usePhysicalFillColor), draws native image texture colors as imported!
      const img = config.customImageElement;
      const imgAspect = (img.width || 1) / (img.height || 1);
      let drawW = rawSize * 0.88;
      let drawH = rawSize * 0.88;
      if (imgAspect > 1) {
        drawH = drawW / imgAspect;
      } else {
        drawW = drawH * imgAspect;
      }
      const dx = center - drawW / 2;
      const dy = center - drawH / 2;
      rawCtx.drawImage(img, dx, dy, drawW, drawH);

      // If usePhysicalFillColor is checked, replace the colors with the chosen primaryColor using mask alpha
      if (config.usePhysicalFillColor) {
        rawCtx.globalCompositeOperation = 'source-in';
        rawCtx.fillStyle = config.primaryColor;
        rawCtx.fillRect(0, 0, rawSize, rawSize);
      }
    } else if (type === 'grunge') {
      for (let i = 0; i < 28; i++) {
        const angle = prng.nextRange(0, Math.PI * 2);
        const dist = prng.nextRange(0, radius);
        const r = prng.nextRange(2, radius * 0.35);
        rawCtx.globalAlpha = prng.nextRange(0.2, 0.85);
        rawCtx.beginPath();
        rawCtx.arc(center + Math.cos(angle) * dist, center + Math.sin(angle) * dist, r, 0, Math.PI * 2);
        rawCtx.fill();
      }
    } else if (type === 'splat') {
      rawCtx.beginPath();
      rawCtx.arc(center, center, radius * 0.4, 0, Math.PI * 2);
      rawCtx.fill();
      const drops = 18;
      for (let i = 0; i < drops; i++) {
        const angle = prng.nextRange(0, Math.PI * 2);
        const dist = prng.nextRange(radius * 0.35, radius * 0.95);
        const dropR = prng.nextRange(1.5, radius * 0.16);
        rawCtx.beginPath();
        rawCtx.arc(center + Math.cos(angle) * dist, center + Math.sin(angle) * dist, dropR, 0, Math.PI * 2);
        rawCtx.fill();
      }
    } else if (type === 'scratch') {
      rawCtx.lineWidth = Math.max(1.2, radius * 0.08);
      rawCtx.strokeStyle = color;
      rawCtx.lineCap = 'round';
      const lines = 7;
      for (let i = 0; i < lines; i++) {
        const x1 = prng.nextRange(rawSize * 0.1, rawSize * 0.9);
        const y1 = prng.nextRange(rawSize * 0.1, rawSize * 0.9);
        const len = prng.nextRange(radius * 0.4, radius * 1.2);
        const ang = prng.nextRange(-0.4, 0.4);
        rawCtx.beginPath();
        rawCtx.moveTo(x1, y1);
        rawCtx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
        rawCtx.stroke();
      }
    } else if (type === 'dots') {
      const dotCount = 20;
      for (let i = 0; i < dotCount; i++) {
        const x = prng.nextRange(rawSize * 0.1, rawSize * 0.9);
        const y = prng.nextRange(rawSize * 0.1, rawSize * 0.9);
        const r = prng.nextRange(radius * 0.06, radius * 0.24);
        rawCtx.beginPath();
        rawCtx.arc(x, y, r, 0, Math.PI * 2);
        rawCtx.fill();
      }
    } else if (type === 'cracks') {
      rawCtx.lineWidth = Math.max(1.4, radius * 0.06);
      rawCtx.strokeStyle = color;
      rawCtx.lineCap = 'round';
      let cx = center;
      let cy = center;
      rawCtx.beginPath();
      rawCtx.moveTo(cx, cy);
      for (let i = 0; i < 8; i++) {
        cx += prng.nextRange(-radius * 0.32, radius * 0.32);
        cy += prng.nextRange(-radius * 0.32, radius * 0.32);
        rawCtx.lineTo(cx, cy);
      }
      rawCtx.stroke();
    } else if (type === 'hex') {
      rawCtx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = center + Math.cos(a) * radius;
        const y = center + Math.sin(a) * radius;
        if (i === 0) rawCtx.moveTo(x, y);
        else rawCtx.lineTo(x, y);
      }
      rawCtx.closePath();
      rawCtx.fill();
    } else if (type === 'stars') {
      rawCtx.beginPath();
      const points = 5;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? radius : radius * 0.45;
        const a = (i * Math.PI) / points - Math.PI / 2;
        const x = center + Math.cos(a) * r;
        const y = center + Math.sin(a) * r;
        if (i === 0) rawCtx.moveTo(x, y);
        else rawCtx.lineTo(x, y);
      }
      rawCtx.closePath();
      rawCtx.fill();
    } else if (type === 'leaves') {
      // Procedural stylized leaves
      rawCtx.beginPath();
      rawCtx.ellipse(center, center, radius * 0.8, radius * 0.35, Math.PI / 4, 0, Math.PI * 2);
      rawCtx.fill();
      rawCtx.beginPath();
      rawCtx.ellipse(center - radius * 0.3, center + radius * 0.2, radius * 0.5, radius * 0.25, -Math.PI / 6, 0, Math.PI * 2);
      rawCtx.fill();
    } else if (type === 'circuit') {
      // Procedural cyber circuit traces
      rawCtx.lineWidth = Math.max(1.5, radius * 0.08);
      rawCtx.strokeStyle = color;
      rawCtx.lineCap = 'square';
      rawCtx.beginPath();
      rawCtx.moveTo(center - radius * 0.7, center);
      rawCtx.lineTo(center - radius * 0.2, center);
      rawCtx.lineTo(center + radius * 0.2, center - radius * 0.4);
      rawCtx.lineTo(center + radius * 0.7, center - radius * 0.4);
      rawCtx.stroke();

      rawCtx.beginPath();
      rawCtx.moveTo(center - radius * 0.5, center + radius * 0.4);
      rawCtx.lineTo(center, center + radius * 0.4);
      rawCtx.lineTo(center + radius * 0.4, center + radius * 0.7);
      rawCtx.stroke();

      // Terminal vias
      rawCtx.beginPath();
      rawCtx.arc(center + radius * 0.7, center - radius * 0.4, radius * 0.12, 0, Math.PI * 2);
      rawCtx.arc(center + radius * 0.4, center + radius * 0.7, radius * 0.12, 0, Math.PI * 2);
      rawCtx.fill();
    } else {
      // Default soft circular dab with edge contrast
      const grad = rawCtx.createRadialGradient(center, center, radius * contrast, center, center, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      rawCtx.fillStyle = grad;
      rawCtx.beginPath();
      rawCtx.arc(center, center, radius, 0, Math.PI * 2);
      rawCtx.fill();
    }

    rawCtx.restore();

    // If outline is not requested, return raw canvas directly
    if (!config.enableOutline) {
      return rawCvs;
    }

    // Generate outline from mask alpha with spread and blur
    const spread = Math.max(0, Math.min(25, config.outlineSpread ?? 4));
    const blur = Math.max(0, Math.min(20, config.outlineBlur ?? 2));
    const outlineColor = config.outlineColor || '#000000';
    const padding = Math.ceil(spread + blur * 2 + 6);

    const outCvs = document.createElement('canvas');
    outCvs.width = rawSize + padding * 2;
    outCvs.height = rawSize + padding * 2;
    const outCtx = outCvs.getContext('2d', { willReadFrequently: true })!;

    // 1. Dilate silhouette using radial spread steps
    const dilateCvs = document.createElement('canvas');
    dilateCvs.width = outCvs.width;
    dilateCvs.height = outCvs.height;
    const dCtx = dilateCvs.getContext('2d', { willReadFrequently: true })!;

    dCtx.save();
    if (spread === 0) {
      dCtx.drawImage(rawCvs, padding, padding);
    } else {
      // Multi-step radial dilation around center
      const steps = Math.min(16, Math.max(8, Math.round(spread * 1.5)));
      for (let s = 1; s <= spread; s += Math.max(1, spread / 5)) {
        for (let i = 0; i < steps; i++) {
          const angle = (i * Math.PI * 2) / steps;
          const ox = Math.cos(angle) * s;
          const oy = Math.sin(angle) * s;
          dCtx.drawImage(rawCvs, padding + ox, padding + oy);
        }
      }
      dCtx.drawImage(rawCvs, padding, padding);
    }

    // Apply outline color to silhouette mask
    dCtx.globalCompositeOperation = 'source-in';
    dCtx.fillStyle = outlineColor;
    dCtx.fillRect(0, 0, dilateCvs.width, dilateCvs.height);
    dCtx.restore();

    // 2. Draw dilated outline with blur onto final canvas
    outCtx.save();
    if (blur > 0) {
      outCtx.filter = `blur(${blur}px)`;
    }
    outCtx.drawImage(dilateCvs, 0, 0);
    outCtx.restore();

    // 3. Draw pristine stamp on top of the outline
    outCtx.drawImage(rawCvs, padding, padding);

    return outCvs;
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
      config,
      baseStampSize,
      prng
    );

    const stampRenderWidth = stampCanvas.width;
    const stampRenderHeight = stampCanvas.height;

    // Determine sample count:
    // If numberOfRepeats > 0: repeat-aware mode with exact repeat count
    // If numberOfRepeats = 0: stochastic non-repeating mode based on stamp density
    let totalStamps = 0;
    if (config.numberOfRepeats > 0) {
      totalStamps = config.numberOfRepeats;
    } else {
      // Stochastic continuous density (15 to 300 stamps)
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

      // Rotation & Scaling with Rotation Jitter
      const rotBase = prng.nextRange(config.rotationMin, config.rotationMax);
      const rotJitter = config.rotationJitter && config.rotationJitter > 0
        ? prng.nextRange(-config.rotationJitter, config.rotationJitter)
        : 0;
      const rotRad = (rotBase + rotJitter) * radToDeg;
      const scale = prng.nextRange(config.scaleMin, config.scaleMax);

      const stampW = stampRenderWidth * scale;
      const stampH = stampRenderHeight * scale;

      // Opacity with slight natural variation
      const stampAlpha = Math.max(0.05, Math.min(1.0, (config.opacity / 100) * prng.nextRange(0.85, 1.0)));

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
