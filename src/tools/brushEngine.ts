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

interface BrushStrokeState {
  lastDabPos: { x: number; y: number } | null;
  residualDistance: number;
  strokeStartPos: { x: number; y: number } | null;
  dotPlaced: boolean;
  curvePoints: { x: number; y: number }[];
  smudgeColor: { r: number; g: number; b: number; a: number } | null;
}

export class BrushEngine {
  private static instance: BrushEngine;
  private wasmMemory = WasmMemoryEngine.getInstance();

  // Stabilizer (Lazy-Mouse) remains tied to the physical pointer.
  private stabilizedPos: { x: number; y: number } | null = null;
  // Each symmetry path owns independent spacing/shape/smudge state. Sharing
  // lastDabPos between the primary and mirrored paths creates long bridge strokes.
  private strokeStates = new Map<string, BrushStrokeState>();

  // Clone stamp source point
  public cloneSourcePoint: { x: number; y: number } | null = null;
  public cloneOffset: { dx: number; dy: number } | null = null;

  private imageMaskCache = new Map<string, HTMLImageElement>();
  private patternCanvasCache = new Map<string, HTMLCanvasElement>();

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

  private getStrokeState(strokeKey = 'primary'): BrushStrokeState {
    let state = this.strokeStates.get(strokeKey);
    if (!state) {
      state = { lastDabPos: null, residualDistance: 0, strokeStartPos: null, dotPlaced: false, curvePoints: [], smudgeColor: null };
      this.strokeStates.set(strokeKey, state);
    }
    return state;
  }

  public beginStroke(x: number, y: number, pressure = 1.0, strokeKey = 'primary') {
    // A new pointer-down always starts a fresh set of primary/mirror paths,
    // including after a stroke was interrupted by a multi-touch gesture.
    this.strokeStates.clear();
    this.stabilizedPos = { x, y };
    this.strokeStates.set(strokeKey, {
      lastDabPos: { x, y },
      residualDistance: 0,
      strokeStartPos: { x, y },
      dotPlaced: false,
      curvePoints: [{ x, y }],
      smudgeColor: null,
    });
  }

  public endStroke() {
    this.stabilizedPos = null;
    this.strokeStates.clear();
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
    isEraser = false,
    strokeKey = 'primary'
  ) {
    const state = this.getStrokeState(strokeKey);
    const strokeType: BrushStrokeType = brush.strokeType || 'space';

    // 1. DOT MODE: exactly 1 dab per stroke at start position
    if (strokeType === 'dot') {
      if (state.dotPlaced) return;
      this.renderSingleDab(ctx, toX, toY, brush.size * pressure, brush, isEraser);
      state.dotPlaced = true;
      return;
    }

    // 2. DRAGGED-DOT MODE: single dab whose scale and rotation follow drag distance
    if (strokeType === 'dragged-dot') {
      if (!state.strokeStartPos) state.strokeStartPos = { x: toX, y: toY };
      const dx = toX - state.strokeStartPos.x;
      const dy = toY - state.strokeStartPos.y;
      const dragDist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const dynamicSize = Math.max(brush.size * 0.5, dragDist * 1.5);
      this.renderSingleDab(ctx, state.strokeStartPos.x, state.strokeStartPos.y, dynamicSize, brush, isEraser, angle);
      return;
    }

    // 3. CURVE MODE: accumulate points and smooth via cardinal/bezier interpolation
    if (strokeType === 'curve') {
      state.curvePoints.push({ x: toX, y: toY });
      if (state.curvePoints.length >= 3) {
        const p0 = state.curvePoints[state.curvePoints.length - 3];
        const p1 = state.curvePoints[state.curvePoints.length - 2];
        const p2 = state.curvePoints[state.curvePoints.length - 1];

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
      if (!state.lastDabPos) state.lastDabPos = { x: toX, y: toY };

      const fromX = state.lastDabPos.x;
      const fromY = state.lastDabPos.y;
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
      state.lastDabPos = { x: toX, y: toY };
      return;
    }

    // 5. SPACE MODE: standard spaced step dabs (default)
    if (!state.lastDabPos) {
      state.lastDabPos = { x: toX, y: toY };
    }

    const fromX = state.lastDabPos.x;
    const fromY = state.lastDabPos.y;
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

    if (distance + state.residualDistance < step) {
      state.residualDistance += distance;
      state.lastDabPos = { x: toX, y: toY };
      return;
    }

    let progress = (step - state.residualDistance) / distance;
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

    state.residualDistance = (1.0 - (progress - step / distance)) * distance;
    state.lastDabPos = { x: toX, y: toY };
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
    const tileSize = Math.max(8, Math.min(128, Math.floor(24 * scale)));
    const cacheKey = `${patternType}|${Math.round(scale * 100)}|${color}`;
    let pCanvas = this.patternCanvasCache.get(cacheKey);
    if (!pCanvas) {
      pCanvas = document.createElement('canvas');
      pCanvas.width = tileSize;
      pCanvas.height = tileSize;
      const pctx = pCanvas.getContext('2d');
      if (!pctx) return;
      pctx.fillStyle = color;
      pctx.fillRect(0, 0, tileSize, tileSize);
      const line = Math.max(1, tileSize / 18);
      const drawHatch = (reverse: boolean) => {
        pctx.save();
        pctx.strokeStyle = 'rgba(0,0,0,0.42)';
        pctx.lineWidth = line;
        for (let offset = -tileSize; offset <= tileSize * 2; offset += Math.max(4, tileSize / 4)) {
          pctx.beginPath();
          if (reverse) { pctx.moveTo(offset, 0); pctx.lineTo(offset + tileSize, tileSize); }
          else { pctx.moveTo(offset, tileSize); pctx.lineTo(offset + tileSize, 0); }
          pctx.stroke();
        }
        pctx.restore();
      };

      if (patternType === 'checker') {
        pctx.fillStyle = 'rgba(0,0,0,0.45)';
        pctx.fillRect(0, 0, tileSize / 2, tileSize / 2);
        pctx.fillRect(tileSize / 2, tileSize / 2, tileSize / 2, tileSize / 2);
      } else if (patternType === 'carbon') {
        pctx.fillStyle = 'rgba(0,0,0,0.5)';
        pctx.fillRect(0, 0, tileSize, tileSize / 2);
        pctx.fillStyle = 'rgba(255,255,255,0.2)';
        pctx.fillRect(0, tileSize / 2, tileSize / 2, tileSize / 2);
      } else if (patternType === 'halftone' || patternType === 'dither') {
        const cell = Math.max(3, tileSize / 4);
        pctx.fillStyle = 'rgba(0,0,0,0.48)';
        for (let y = cell / 2; y < tileSize; y += cell) for (let x = cell / 2; x < tileSize; x += cell) {
          const threshold = patternType === 'dither' ? ((Math.floor(x / cell) * 3 + Math.floor(y / cell) * 5) % 4 + 1) / 4 : 0.35;
          pctx.beginPath();
          pctx.arc(x, y, cell * threshold, 0, Math.PI * 2);
          pctx.fill();
        }
      } else if (patternType === 'hatching') {
        drawHatch(false);
      } else if (patternType === 'crosshatching' || patternType === 'crosshatch') {
        drawHatch(false);
        drawHatch(true);
      } else if (patternType === 'hashing') {
        pctx.strokeStyle = 'rgba(0,0,0,0.48)';
        pctx.lineWidth = line;
        for (let y = tileSize * 0.15; y < tileSize; y += tileSize / 3) {
          for (let x = tileSize * 0.1; x < tileSize; x += tileSize / 3) {
            pctx.beginPath(); pctx.moveTo(x, y); pctx.lineTo(x + tileSize / 5, y - tileSize / 5); pctx.stroke();
            pctx.beginPath(); pctx.moveTo(x + tileSize / 10, y); pctx.lineTo(x + tileSize / 5, y + tileSize / 5); pctx.stroke();
          }
        }
      } else if (patternType === 'powderiser' || patternType === 'powderizer') {
        for (let i = 0; i < tileSize * 2; i++) {
          const x = (i * 37.17 + 11) % tileSize;
          const y = (i * 19.73 + 7) % tileSize;
          const r = 0.5 + ((i * 13) % 7) * tileSize / 180;
          pctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.34)' : 'rgba(0,0,0,0.32)';
          pctx.beginPath(); pctx.arc(x, y, r, 0, Math.PI * 2); pctx.fill();
        }
      } else if (patternType === 'mosaic') {
        const cell = Math.max(3, Math.floor(tileSize / 4));
        for (let y = 0; y < tileSize; y += cell) for (let x = 0; x < tileSize; x += cell) {
          const shade = ((Math.floor(x / cell) * 7 + Math.floor(y / cell) * 11) % 5) * 0.055;
          pctx.fillStyle = `rgba(0,0,0,${shade})`;
          pctx.fillRect(x, y, cell - 1, cell - 1);
        }
        pctx.strokeStyle = 'rgba(255,255,255,0.16)';
        pctx.lineWidth = 0.7;
        for (let x = 0; x <= tileSize; x += cell) { pctx.beginPath(); pctx.moveTo(x, 0); pctx.lineTo(x, tileSize); pctx.stroke(); }
        for (let y = 0; y <= tileSize; y += cell) { pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(tileSize, y); pctx.stroke(); }
      } else if (patternType === 'wood') {
        pctx.strokeStyle = 'rgba(0,0,0,0.28)';
        pctx.lineWidth = Math.max(1, tileSize / 24);
        for (let i = 0; i < 5; i++) {
          const y = (i * tileSize) / 5;
          pctx.beginPath(); pctx.moveTo(0, y);
          pctx.bezierCurveTo(tileSize * 0.3, y - tileSize * 0.12, tileSize * 0.65, y + tileSize * 0.12, tileSize, y);
          pctx.stroke();
        }
      } else if (patternType === 'leather') {
        pctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let y = tileSize * 0.2; y < tileSize; y += tileSize / 3) for (let x = tileSize * 0.2; x < tileSize; x += tileSize / 3) {
          pctx.beginPath(); pctx.arc(x, y, tileSize / 18, 0, Math.PI * 2); pctx.fill();
        }
      } else if (patternType === 'weave') {
        pctx.fillStyle = 'rgba(0,0,0,0.28)';
        for (let i = 0; i < 4; i++) { pctx.fillRect(i * tileSize / 4, 0, tileSize / 8, tileSize); pctx.fillRect(0, i * tileSize / 4, tileSize, tileSize / 8); }
      }
      // Keep the cache bounded for long sessions with many colours and scales.
      if (this.patternCanvasCache.size >= 64) this.patternCanvasCache.delete(this.patternCanvasCache.keys().next().value!);
      this.patternCanvasCache.set(cacheKey, pCanvas);
    }

    const pattern = ctx.createPattern(pCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
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
    brush: BrushPreset,
    strokeKey = 'primary'
  ) {
    const state = this.getStrokeState(strokeKey);
    const radius = Math.max(3, Math.floor(brush.size / 2));
    const size = radius * 2;

    const sampleX = Math.max(0, Math.min(ctx.canvas.width - 1, Math.floor(fromX)));
    const sampleY = Math.max(0, Math.min(ctx.canvas.height - 1, Math.floor(fromY)));

    if (!state.smudgeColor) {
      const sample = ctx.getImageData(sampleX, sampleY, 1, 1).data;
      state.smudgeColor = { r: sample[0], g: sample[1], b: sample[2], a: sample[3] };
    } else {
      const sample = ctx.getImageData(sampleX, sampleY, 1, 1).data;
      if (sample[3] > 0) {
        state.smudgeColor.r = Math.round(state.smudgeColor.r * 0.75 + sample[0] * 0.25);
        state.smudgeColor.g = Math.round(state.smudgeColor.g * 0.75 + sample[1] * 0.25);
        state.smudgeColor.b = Math.round(state.smudgeColor.b * 0.75 + sample[2] * 0.25);
        state.smudgeColor.a = Math.round(state.smudgeColor.a * 0.75 + sample[3] * 0.25);
      }
    }

    ctx.save();
    ctx.translate(toX, toY);
    ctx.globalAlpha = (brush.opacity / 100) * 0.45;

    const smudgeRgba = `rgba(${state.smudgeColor.r}, ${state.smudgeColor.g}, ${state.smudgeColor.b}, ${state.smudgeColor.a / 255})`;

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
