/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Medibang / ArmorPaint Inspired Brush Engine
 * Created by Victory Ukpong
 */

import { BrushPreset, BrushStrokeType, BrushMaskType, BrushPatternType } from '../core/types';
import { WasmMemoryEngine } from '../core/wasmMemoryEngine';

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

export class BrushEngine {
  private static instance: BrushEngine;
  private wasmMemory = WasmMemoryEngine.getInstance();

  // Stabilizer (Lazy-Mouse) state
  private stabilizedPos: { x: number; y: number } | null = null;
  private lastDabPos: { x: number; y: number } | null = null;
  private residualDistance = 0;

  // Stroke Type state
  private strokeStartPos: { x: number; y: number } | null = null;
  private dotPlaced = false;
  private curvePoints: { x: number; y: number }[] = [];

  // Clone stamp source point
  public cloneSourcePoint: { x: number; y: number } | null = null;
  public cloneOffset: { dx: number; dy: number } | null = null;

  // Smudge pickup buffer
  private smudgeColor: { r: number; g: number; b: number; a: number } | null = null;
  private imageMaskCache = new Map<string, HTMLImageElement>();

  public static getInstance(): BrushEngine {
    if (!BrushEngine.instance) {
      BrushEngine.instance = new BrushEngine();
    }
    return BrushEngine.instance;
  }

  public getImageMask(url: string): HTMLImageElement | null {
    if (this.imageMaskCache.has(url)) {
      const img = this.imageMaskCache.get(url)!;
      return img.complete ? img : null;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    this.imageMaskCache.set(url, img);
    return null;
  }

  public beginStroke(x: number, y: number, pressure = 1.0) {
    this.stabilizedPos = { x, y };
    this.lastDabPos = { x, y };
    this.strokeStartPos = { x, y };
    this.residualDistance = 0;
    this.smudgeColor = null;
    this.dotPlaced = false;
    this.curvePoints = [{ x, y }];
  }

  public endStroke() {
    this.stabilizedPos = null;
    this.lastDabPos = null;
    this.strokeStartPos = null;
    this.dotPlaced = false;
    this.curvePoints = [];
  }

  /**
   * Updates stabilizer (Medibang lazy mouse interpolation)
   * Higher stabilizer value = heavier tether drag with smooth inertia
   */
  public updateStabilizer(
    targetX: number,
    targetY: number,
    stabilizerLevel: number // 0 - 100
  ): { x: number; y: number } {
    if (!this.stabilizedPos) {
      this.stabilizedPos = { x: targetX, y: targetY };
      return this.stabilizedPos;
    }

    if (stabilizerLevel <= 0) {
      this.stabilizedPos = { x: targetX, y: targetY };
      return this.stabilizedPos;
    }

    // Weight factor: 0 => 1.0 (instant), 100 => 0.08 (smooth heavy lazy tether)
    const factor = Math.max(0.06, 1.0 - (stabilizerLevel / 100) * 0.92);
    this.stabilizedPos.x += (targetX - this.stabilizedPos.x) * factor;
    this.stabilizedPos.y += (targetY - this.stabilizedPos.y) * factor;

    return { x: this.stabilizedPos.x, y: this.stabilizedPos.y };
  }

  public getStabilizedPos() {
    return this.stabilizedPos;
  }

  /**
   * Paints along the stroke respecting Brush Type (space, airbrush, dot, dragged-dot, curve)
   */
  public paintDabs(
    ctx: CanvasRenderingContext2D,
    toX: number,
    toY: number,
    brush: BrushPreset,
    pressure = 1.0,
    isEraser = false
  ) {
    const strokeType: BrushStrokeType = brush.strokeType || 'space';

    // 1. DOT MODE: exactly 1 dab per stroke at start position
    if (strokeType === 'dot') {
      if (this.dotPlaced) return;
      this.renderSingleDab(ctx, toX, toY, brush.size * pressure, brush, isEraser);
      this.dotPlaced = true;
      return;
    }

    // 2. DRAGGED-DOT MODE: single dab whose scale and rotation follow drag distance
    if (strokeType === 'dragged-dot') {
      if (!this.strokeStartPos) this.strokeStartPos = { x: toX, y: toY };
      const dx = toX - this.strokeStartPos.x;
      const dy = toY - this.strokeStartPos.y;
      const dragDist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const dynamicSize = Math.max(brush.size * 0.5, dragDist * 1.5);
      this.renderSingleDab(ctx, this.strokeStartPos.x, this.strokeStartPos.y, dynamicSize, brush, isEraser, angle);
      return;
    }

    // 3. CURVE MODE: accumulate points and smooth via cardinal/bezier interpolation
    if (strokeType === 'curve') {
      this.curvePoints.push({ x: toX, y: toY });
      if (this.curvePoints.length >= 3) {
        const p0 = this.curvePoints[this.curvePoints.length - 3];
        const p1 = this.curvePoints[this.curvePoints.length - 2];
        const p2 = this.curvePoints[this.curvePoints.length - 1];

        // Midpoint interpolation
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        this.renderSingleDab(ctx, midX, midY, brush.size * pressure, brush, isEraser);
      } else {
        this.renderSingleDab(ctx, toX, toY, brush.size * pressure, brush, isEraser);
      }
      return;
    }

    // 4. AIRBRUSH MODE: tighter continuous spray with softer flow
    if (strokeType === 'airbrush') {
      const effectiveSize = Math.max(1, brush.size * Math.max(0.3, pressure));
      const step = Math.max(1, effectiveSize * 0.08); // very tight step for seamless spray
      if (!this.lastDabPos) this.lastDabPos = { x: toX, y: toY };

      const fromX = this.lastDabPos.x;
      const fromY = this.lastDabPos.y;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const distance = Math.hypot(dx, dy);

      const dabsCount = Math.max(1, Math.floor(distance / step));
      for (let i = 0; i <= dabsCount; i++) {
        const t = dabsCount > 0 ? i / dabsCount : 1;
        const dabX = fromX + dx * t;
        const dabY = fromY + dy * t;
        this.renderSingleDab(ctx, dabX, dabY, effectiveSize, brush, isEraser);
      }
      this.lastDabPos = { x: toX, y: toY };
      return;
    }

    // 5. SPACE MODE: standard spaced step dabs (default)
    if (!this.lastDabPos) {
      this.lastDabPos = { x: toX, y: toY };
    }

    const fromX = this.lastDabPos.x;
    const fromY = this.lastDabPos.y;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);

    // Dynamic size adjusted by stylus pen pressure and min-size dynamics
    let sizeFactor = 1.0;
    if (brush.pressureSize ?? true) {
      const minPercent = (brush.minSizePercent ?? 20) / 100;
      sizeFactor = minPercent + (1.0 - minPercent) * pressure;
    }
    const effectiveSize = Math.max(1, brush.size * sizeFactor);
    // Spacing in pixels
    const step = Math.max(1, (effectiveSize * (brush.spacing / 100)));

    if (distance + this.residualDistance < step) {
      this.residualDistance += distance;
      this.lastDabPos = { x: toX, y: toY };
      return;
    }

    let progress = (step - this.residualDistance) / distance;
    while (progress <= 1.0) {
      let dabX = fromX + dx * progress;
      let dabY = fromY + dy * progress;

      // Apply Scattering Effect
      if (brush.scatter > 0) {
        const scatterRadius = (effectiveSize * 2) * (brush.scatter / 100);
        const scatterAngle = Math.random() * Math.PI * 2;
        const scatterDist = Math.random() * scatterRadius;
        dabX += Math.cos(scatterAngle) * scatterDist;
        dabY += Math.sin(scatterAngle) * scatterDist;
      }

      // Calculate dab rotation with stencil angle & angle jitter
      let dabRotation = (brush.stencilAngle || 0) * (Math.PI / 180);
      if (brush.stencilAngleJitter && brush.stencilAngleJitter > 0) {
        dabRotation += (Math.random() - 0.5) * Math.PI * 2 * (brush.stencilAngleJitter / 100);
      }

      this.renderSingleDab(ctx, dabX, dabY, effectiveSize, brush, isEraser, dabRotation, pressure);
      progress += step / distance;
    }

    this.residualDistance = (1.0 - (progress - step / distance)) * distance;
    this.lastDabPos = { x: toX, y: toY };
  }

  /**
   * Renders an individual brush stamp dab onto canvas with Mask & Pattern support
   */
  private renderSingleDab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    brush: BrushPreset,
    isEraser: boolean,
    rotationAngle = 0,
    pressure = 1.0
  ) {
    const radius = size / 2;
    ctx.save();
    ctx.translate(x, y);
    if (rotationAngle !== 0) ctx.rotate(rotationAngle);

    // Pressure Opacity Dynamics
    let opacityFactor = 1.0;
    if (brush.pressureOpacity ?? true) {
      const minOp = (brush.minOpacityPercent ?? 15) / 100;
      opacityFactor = minOp + (1.0 - minOp) * pressure;
    }

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = (brush.opacity / 100) * (brush.flow / 100) * opacityFactor;
    } else {
      ctx.globalCompositeOperation = brush.patternBlend === 'overlay' ? 'overlay'
        : brush.patternBlend === 'multiply' ? 'multiply'
        : brush.patternBlend === 'screen' ? 'screen'
        : brush.patternBlend === 'hard_light' ? 'hard-light'
        : 'source-over';
      ctx.globalAlpha = (brush.opacity / 100) * (brush.flow / 100) * opacityFactor * 0.85;
    }

    // 1. Custom Stencil Image Mask (if active)
    if (brush.stencilUrl) {
      const maskImg = this.getImageMask(brush.stencilUrl);
      if (maskImg && maskImg.complete) {
        ctx.drawImage(maskImg, -radius, -radius, size, size);
      }
    }

    // 2. Procedural Mask Modulation (if active)
    if (brush.maskType && brush.maskType !== 'none') {
      this.applyMaskModulation(ctx, radius, brush.maskType, brush.maskScale || 1.0);
    }

    // 3. Procedural Pattern Fill (if active)
    if (brush.patternType && brush.patternType !== 'none' && !isEraser) {
      this.applyPatternFill(ctx, radius, brush.color, brush.patternType, brush.patternScale || 1.0);
    } else if (brush.hardness < 85) {
      // Soft radial gradient dab (works for both brush color and eraser destination-out)
      const grad = ctx.createRadialGradient(0, 0, radius * (brush.hardness / 100), 0, 0, radius);
      grad.addColorStop(0, isEraser ? '#000000' : brush.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (brush.tipShape === 'flat') {
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      ctx.fillRect(-radius, -radius * 0.35, size, size * 0.7);
    } else if (brush.tipShape === 'hex') {
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      this.drawPolygon(ctx, 0, 0, radius, 6);
    } else if (brush.tipShape === 'grunge') {
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      for (let i = 0; i < 4; i++) {
        const offX = (Math.random() - 0.5) * radius * 1.2;
        const offY = (Math.random() - 0.5) * radius * 1.2;
        const r = (radius * 0.3) + Math.random() * (radius * 0.4);
        ctx.beginPath();
        ctx.arc(offX, offY, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Crisp round circle
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Procedural Mask stencil generator
   */
  private applyMaskModulation(
    ctx: CanvasRenderingContext2D,
    radius: number,
    maskType: BrushMaskType,
    scale: number
  ) {
    if (maskType === 'grunge') {
      // Jitter opacity & stipple
      ctx.globalAlpha *= 0.75 + Math.random() * 0.25;
      for (let i = 0; i < 5; i++) {
        const offX = (Math.random() - 0.5) * radius * scale;
        const offY = (Math.random() - 0.5) * radius * scale;
        ctx.beginPath();
        ctx.arc(offX, offY, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (maskType === 'splat') {
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius * scale;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (maskType === 'scratch') {
      ctx.beginPath();
      ctx.moveTo(-radius * scale, -radius * 0.2);
      ctx.lineTo(radius * scale, radius * 0.2);
      ctx.lineWidth = Math.max(1, radius * 0.2);
      ctx.stroke();
    } else if (maskType === 'dots') {
      for (let dx = -radius; dx <= radius; dx += Math.max(4, radius * 0.4 * scale)) {
        for (let dy = -radius; dy <= radius; dy += Math.max(4, radius * 0.4 * scale)) {
          if (dx * dx + dy * dy <= radius * radius) {
            ctx.beginPath();
            ctx.arc(dx, dy, Math.max(1, radius * 0.1), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  /**
   * Procedural Pattern fill generator
   */
  private applyPatternFill(
    ctx: CanvasRenderingContext2D,
    radius: number,
    color: string,
    patternType: BrushPatternType,
    scale: number
  ) {
    const pCanvas = document.createElement('canvas');
    const tileSize = Math.max(4, Math.floor(16 * scale));
    pCanvas.width = tileSize;
    pCanvas.height = tileSize;
    const pctx = pCanvas.getContext('2d');
    if (!pctx) return;

    pctx.fillStyle = color;
    pctx.fillRect(0, 0, tileSize, tileSize);

    if (patternType === 'checker') {
      pctx.fillStyle = 'rgba(0,0,0,0.45)';
      pctx.fillRect(0, 0, tileSize / 2, tileSize / 2);
      pctx.fillRect(tileSize / 2, tileSize / 2, tileSize / 2, tileSize / 2);
    } else if (patternType === 'carbon') {
      pctx.fillStyle = 'rgba(0,0,0,0.5)';
      pctx.fillRect(0, 0, tileSize, tileSize / 2);
      pctx.fillStyle = 'rgba(255,255,255,0.2)';
      pctx.fillRect(0, tileSize / 2, tileSize / 2, tileSize / 2);
    } else if (patternType === 'halftone') {
      pctx.fillStyle = 'rgba(0,0,0,0.4)';
      pctx.beginPath();
      pctx.arc(tileSize / 2, tileSize / 2, tileSize * 0.35, 0, Math.PI * 2);
      pctx.fill();
    } else if (patternType === 'wood' || patternType === 'leather') {
      pctx.fillStyle = 'rgba(0,0,0,0.3)';
      pctx.fillRect(0, 0, tileSize, tileSize * 0.3);
      pctx.fillRect(0, tileSize * 0.6, tileSize, tileSize * 0.2);
    }

    const pat = ctx.createPattern(pCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Blur tool: Smooths texture seams and paint transitions in local area
   */
  public applyBlurAt(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    brush: BrushPreset
  ) {
    const radius = Math.max(4, Math.floor(brush.size / 2));
    const minX = Math.max(0, Math.floor(x - radius));
    const minY = Math.max(0, Math.floor(y - radius));
    const maxX = Math.min(ctx.canvas.width, Math.ceil(x + radius));
    const maxY = Math.min(ctx.canvas.height, Math.ceil(y + radius));
    const w = maxX - minX;
    const h = maxY - minY;

    if (w <= 0 || h <= 0) return;

    const imgData = ctx.getImageData(minX, minY, w, h);
    this.wasmMemory.applyFastBoxBlur(imgData.data, w, h, 2);
    ctx.putImageData(imgData, minX, minY);
  }

  /**
   * Clone Stamp tool: Copies pixels from source offset into target dab
   */
  public applyCloneStampAt(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    brush: BrushPreset
  ) {
    if (!this.cloneOffset) return;
    const srcX = x - this.cloneOffset.dx;
    const srcY = y - this.cloneOffset.dy;
    const radius = Math.floor(brush.size / 2);

    const sMinX = Math.max(0, Math.floor(srcX - radius));
    const sMinY = Math.max(0, Math.floor(srcY - radius));
    const sW = Math.min(ctx.canvas.width - sMinX, radius * 2);
    const sH = Math.min(ctx.canvas.height - sMinY, radius * 2);

    if (sW <= 0 || sH <= 0) return;

    const sourceData = ctx.getImageData(sMinX, sMinY, sW, sH);

    ctx.save();
    ctx.globalAlpha = brush.opacity / 100;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sW;
    tempCanvas.height = sH;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(sourceData, 0, 0);

    ctx.drawImage(tempCanvas, x - radius, y - radius);
    ctx.restore();
  }

  /**
   * Smudge tool: pushes and blends local pixels along the motion vector
   */
  public applySmudgeAt(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    brush: BrushPreset
  ) {
    const radius = Math.max(3, Math.floor(brush.size / 2));
    const size = radius * 2;

    const sampleX = Math.max(0, Math.min(ctx.canvas.width - 1, Math.floor(fromX)));
    const sampleY = Math.max(0, Math.min(ctx.canvas.height - 1, Math.floor(fromY)));

    if (!this.smudgeColor) {
      const sample = ctx.getImageData(sampleX, sampleY, 1, 1).data;
      this.smudgeColor = { r: sample[0], g: sample[1], b: sample[2], a: sample[3] };
    } else {
      const sample = ctx.getImageData(sampleX, sampleY, 1, 1).data;
      if (sample[3] > 0) {
        this.smudgeColor.r = Math.round(this.smudgeColor.r * 0.75 + sample[0] * 0.25);
        this.smudgeColor.g = Math.round(this.smudgeColor.g * 0.75 + sample[1] * 0.25);
        this.smudgeColor.b = Math.round(this.smudgeColor.b * 0.75 + sample[2] * 0.25);
        this.smudgeColor.a = Math.round(this.smudgeColor.a * 0.75 + sample[3] * 0.25);
      }
    }

    ctx.save();
    ctx.translate(toX, toY);
    ctx.globalAlpha = (brush.opacity / 100) * 0.45;

    const smudgeRgba = `rgba(${this.smudgeColor.r}, ${this.smudgeColor.g}, ${this.smudgeColor.b}, ${this.smudgeColor.a / 255})`;

    // 1. Custom Image Stencil Mask for Smudge tip
    if (brush.stencilUrl) {
      const maskImg = this.getImageMask(brush.stencilUrl);
      if (maskImg && maskImg.complete) {
        ctx.drawImage(maskImg, -radius, -radius, size, size);
      }
    }

    // 2. Procedural Mask Modulation for Smudge tip
    if (brush.maskType && brush.maskType !== 'none') {
      this.applyMaskModulation(ctx, radius, brush.maskType, brush.maskScale || 1.0);
    }

    // 3. Pattern Overlay on Smudge
    if (brush.patternType && brush.patternType !== 'none') {
      this.applyPatternFill(ctx, radius, smudgeRgba, brush.patternType, brush.patternScale || 1.0);
    } else if (brush.hardness < 85) {
      const grad = ctx.createRadialGradient(0, 0, radius * (brush.hardness / 100), 0, 0, radius);
      grad.addColorStop(0, smudgeRgba);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = smudgeRgba;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
