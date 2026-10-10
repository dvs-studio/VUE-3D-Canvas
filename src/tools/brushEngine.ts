/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Medibang-Inspired Brush Engine
 * Created by Victory Ukpong
 */

import { BrushPreset } from '../core/types';
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

  // Clone stamp source point
  public cloneSourcePoint: { x: number; y: number } | null = null;
  public cloneOffset: { dx: number; dy: number } | null = null;

  // Smudge pickup buffer
  private smudgeColor: { r: number; g: number; b: number; a: number } | null = null;

  public static getInstance(): BrushEngine {
    if (!BrushEngine.instance) {
      BrushEngine.instance = new BrushEngine();
    }
    return BrushEngine.instance;
  }

  public beginStroke(x: number, y: number, pressure = 1.0) {
    this.stabilizedPos = { x, y };
    this.lastDabPos = { x, y };
    this.residualDistance = 0;
    this.smudgeColor = null;
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
   * Paints along the line from previous dab to new point with spacing, scattering, and hardness
   */
  public paintDabs(
    ctx: CanvasRenderingContext2D,
    toX: number,
    toY: number,
    brush: BrushPreset,
    pressure = 1.0,
    isEraser = false
  ) {
    if (!this.lastDabPos) {
      this.lastDabPos = { x: toX, y: toY };
    }

    const fromX = this.lastDabPos.x;
    const fromY = this.lastDabPos.y;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);

    // Dynamic size adjusted by pressure
    const effectiveSize = Math.max(1, brush.size * Math.max(0.2, pressure));
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

      this.renderSingleDab(ctx, dabX, dabY, effectiveSize, brush, isEraser);

      progress += step / distance;
    }

    this.residualDistance = (1.0 - (progress - step / distance)) * distance;
    this.lastDabPos = { x: toX, y: toY };
  }

  /**
   * Renders an individual brush stamp dab onto canvas
   */
  private renderSingleDab(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    brush: BrushPreset,
    isEraser: boolean
  ) {
    const radius = size / 2;
    ctx.save();

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = (brush.opacity / 100) * (brush.flow / 100);
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = (brush.opacity / 100) * (brush.flow / 100) * 0.85;
    }

    if (brush.hardness < 85 && !isEraser) {
      // Soft / radial gradient dab
      const grad = ctx.createRadialGradient(x, y, radius * (brush.hardness / 100), x, y, radius);
      grad.addColorStop(0, brush.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (brush.tipShape === 'flat') {
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      ctx.fillRect(x - radius, y - radius * 0.35, size, size * 0.7);
    } else if (brush.tipShape === 'hex') {
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      this.drawPolygon(ctx, x, y, radius, 6);
    } else if (brush.tipShape === 'grunge') {
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      // Procedural grunge cluster
      for (let i = 0; i < 4; i++) {
        const offX = (Math.random() - 0.5) * radius * 1.2;
        const offY = (Math.random() - 0.5) * radius * 1.2;
        const r = (radius * 0.3) + Math.random() * (radius * 0.4);
        ctx.beginPath();
        ctx.arc(x + offX, y + offY, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Crisp round circle
      ctx.fillStyle = isEraser ? '#000000' : brush.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
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
    const radius = brush.size / 2;

    const srcMinX = Math.max(0, Math.floor(srcX - radius));
    const srcMinY = Math.max(0, Math.floor(srcY - radius));
    const patchW = Math.min(ctx.canvas.width - srcMinX, Math.ceil(radius * 2));
    const patchH = Math.min(ctx.canvas.height - srcMinY, Math.ceil(radius * 2));

    if (patchW <= 0 || patchH <= 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = (brush.opacity / 100);
    // Draw cloned region
    ctx.drawImage(
      ctx.canvas,
      srcMinX, srcMinY, patchW, patchH,
      x - radius, y - radius, patchW, patchH
    );
    ctx.restore();
  }

  /**
   * Smudge tool: Memory-optimized pixel dragging
   */
  public applySmudgeAt(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    brush: BrushPreset
  ) {
    const radius = Math.max(2, brush.size / 2);
    // Sample color if not yet picked
    const sampleX = Math.min(Math.max(0, Math.floor(fromX)), ctx.canvas.width - 1);
    const sampleY = Math.min(Math.max(0, Math.floor(fromY)), ctx.canvas.height - 1);
    const p = ctx.getImageData(sampleX, sampleY, 1, 1).data;
    
    if (p[3] > 0) {
      this.smudgeColor = { r: p[0], g: p[1], b: p[2], a: p[3] / 255 };
    }

    if (!this.smudgeColor) return;

    ctx.save();
    ctx.globalAlpha = (brush.opacity / 100) * 0.45;
    ctx.fillStyle = `rgba(${this.smudgeColor.r}, ${this.smudgeColor.g}, ${this.smudgeColor.b}, ${this.smudgeColor.a})`;
    ctx.beginPath();
    ctx.arc(toX, toY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public endStroke() {
    this.stabilizedPos = null;
    this.lastDabPos = null;
    this.smudgeColor = null;
    this.residualDistance = 0;
  }
}
