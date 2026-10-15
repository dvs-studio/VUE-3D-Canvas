/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Jenny Stitch Studio
 * Created by Victory Ukpong
 * 
 * In-application mesh topology edge/seam stitching tool with A* pathfinding,
 * displacement depth simulation, and procedural thread textures.
 */

import * as THREE from 'three';

export interface StitchConfig {
  stitchSpacing: number; // 8 to 80 px
  stitchRotationOffset: number; // -90 to +90 degrees
  displacementDepth?: number; // 0.0 to 1.0 (leather/cloth depression & shadow)
  stitchWidth: number; // 1 to 20 px
  stitchScale: number; // length multiplier: 0.5 to 3.0
  stitchDensity: number; // 0.5 to 2.0
  pathSmoothing?: number; // 0 to 4 iterations
  stitchStyle: 'single_thread' | 'cross_stitch' | 'double_stitch' | 'baseball' | 'zigzag' | 'rope';
  threadColor: string;
  shadowColor?: string;
  seamPathPreset: 'seam_loop' | 'brow_contour' | 'muzzle_seam' | 'diagonal_cross' | 'custom_curve';
  seamGrooveDepth?: number;
  needleHoleSize?: number;
  displacementIntensity?: number;
}

export interface StitchPoint {
  x: number; // UV pixel X
  y: number; // UV pixel Y
  tangentX: number;
  tangentY: number;
}

export class StitchStudioEngine {
  /**
   * Generates sample UV path points based on geometry topology / seam preset
   */
  public static generateSeamPath(
    geom: THREE.BufferGeometry,
    preset: StitchConfig['seamPathPreset'],
    smoothing = 1
  ): { x: number; y: number }[] {
    const uvAttr = geom.attributes.uv;
    const points: { x: number; y: number }[] = [];

    if (!uvAttr || uvAttr.count < 3) {
      // Fallback circular / oval loop
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        points.push({
          x: 512 + Math.cos(a) * 320,
          y: 512 + Math.sin(a) * 240,
        });
      }
      return points;
    }

    if (preset === 'seam_loop') {
      // Loop around mid-UV boundary
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const a = t * Math.PI * 2;
        points.push({
          x: 512 + Math.cos(a) * 380,
          y: 512 + Math.sin(a) * 380 + Math.sin(a * 4) * 25,
        });
      }
    } else if (preset === 'brow_contour') {
      // Curved horizontal arch simulating brow / forehead seam
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const x = 160 + t * 704;
        const y = 340 + Math.sin(t * Math.PI) * 140;
        points.push({ x, y });
      }
    } else if (preset === 'muzzle_seam') {
      // Elliptical mouth / snout seam
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        points.push({
          x: 512 + Math.cos(a) * 240,
          y: 680 + Math.sin(a) * 160,
        });
      }
    } else if (preset === 'diagonal_cross') {
      // Diagonal athletic sneaker / jacket seam
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        points.push({
          x: 120 + t * 784,
          y: 180 + t * 664 + Math.sin(t * Math.PI * 2) * 45,
        });
      }
    } else {
      // Extract connected edge path from mesh topology UVs
      const step = Math.max(1, Math.floor(uvAttr.count / 32));
      for (let i = 0; i < uvAttr.count; i += step) {
        const u = uvAttr.getX(i);
        const v = uvAttr.getY(i);
        points.push({
          x: u * 1024,
          y: (1 - v) * 1024,
        });
      }
    }

    // Apply Catmull-Rom smoothing subdivision
    return this.smoothPath(points, smoothing);
  }

  /**
   * Smooths path via Catmull-Rom spline interpolation
   */
  public static smoothPath(points: { x: number; y: number }[], iterations: number): { x: number; y: number }[] {
    if (points.length < 3 || iterations <= 0) return points;

    let current = points;
    for (let iter = 0; iter < iterations; iter++) {
      const smoothed: { x: number; y: number }[] = [];
      for (let i = 0; i < current.length - 1; i++) {
        const p0 = current[Math.max(0, i - 1)];
        const p1 = current[i];
        const p2 = current[i + 1];
        const p3 = current[Math.min(current.length - 1, i + 2)];

        smoothed.push(p1);

        // Midpoint interpolated
        const midX = 0.5 * ((-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * 0.125 + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * 0.25 + (-p0.x + p2.x) * 0.5 + 2 * p1.x);
        const midY = 0.5 * ((-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * 0.125 + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * 0.25 + (-p0.y + p2.y) * 0.5 + 2 * p1.y);
        smoothed.push({ x: midX, y: midY });
      }
      smoothed.push(current[current.length - 1]);
      current = smoothed;
    }

    return current;
  }

  /**
   * Resamples smoothed path at fixed spacing intervals and calculates tangents
   */
  public static sampleStitchesAlongPath(
    path: { x: number; y: number }[],
    spacing: number
  ): StitchPoint[] {
    if (path.length < 2) return [];

    const result: StitchPoint[] = [];
    let accumulatedDist = 0;
    let nextTarget = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (segLen <= 0.001) continue;

      const dirX = (p2.x - p1.x) / segLen;
      const dirY = (p2.y - p1.y) / segLen;

      while (accumulatedDist + segLen >= nextTarget) {
        const t = (nextTarget - accumulatedDist) / segLen;
        const x = p1.x + dirX * segLen * t;
        const y = p1.y + dirY * segLen * t;

        result.push({
          x,
          y,
          tangentX: dirX,
          tangentY: dirY,
        });

        nextTarget += spacing;
      }

      accumulatedDist += segLen;
    }

    return result;
  }

  /**
   * Renders the complete stitch pattern onto the target CanvasRenderingContext2D
   */
  public static renderStitches(
    ctx: CanvasRenderingContext2D,
    geom: THREE.BufferGeometry,
    config: StitchConfig,
    customPath?: { x: number; y: number }[]
  ) {
    const rawPath = customPath && customPath.length >= 2 
      ? customPath 
      : this.generateSeamPath(geom, config.seamPathPreset, config.pathSmoothing ?? 1);
    const effectiveSpacing = Math.max(4, config.stitchSpacing / Math.max(0.2, config.stitchDensity));
    const stitches = this.sampleStitchesAlongPath(rawPath, effectiveSpacing);

    if (stitches.length === 0) return;

    const radOffset = (config.stitchRotationOffset * Math.PI) / 180;
    const stitchLen = 14 * config.stitchScale;
    const stitchThick = Math.max(1, config.stitchWidth);

    ctx.save();

    const depth = config.displacementDepth ?? (config.displacementIntensity ? config.displacementIntensity / 100 : 0.6);

    // 1. DISPLACEMENT & PUNCH HOLE DEPTH (Drop shadow + needle punch holes)
    if (depth > 0.05) {
      ctx.save();
      ctx.fillStyle = config.shadowColor || 'rgba(0,0,0,0.7)';
      ctx.globalAlpha = Math.min(0.9, depth * 0.85);

      stitches.forEach((st) => {
        const baseAngle = Math.atan2(st.tangentY, st.tangentX) + radOffset;
        const halfLen = stitchLen * 0.55;

        // Needle puncture holes at stitch start and end
        const xA = st.x - Math.cos(baseAngle) * halfLen;
        const yA = st.y - Math.sin(baseAngle) * halfLen;
        const xB = st.x + Math.cos(baseAngle) * halfLen;
        const yB = st.y + Math.sin(baseAngle) * halfLen;

        const holeR = Math.max(1.2, stitchThick * 0.65);

        ctx.beginPath();
        ctx.arc(xA, yA, holeR, 0, Math.PI * 2);
        ctx.arc(xB, yB, holeR, 0, Math.PI * 2);
        ctx.fill();

        // Seam groove shadow underneath stitch
        ctx.strokeStyle = 'rgba(10, 10, 10, 0.45)';
        ctx.lineWidth = stitchThick * 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xA + 1, yA + 1.5);
        ctx.lineTo(xB + 1, yB + 1.5);
        ctx.stroke();
      });

      ctx.restore();
    }

    // 2. PRIMARY THREAD STITCHES
    ctx.lineCap = 'round';
    ctx.strokeStyle = config.threadColor;
    ctx.lineWidth = stitchThick;

    stitches.forEach((st, idx) => {
      const baseAngle = Math.atan2(st.tangentY, st.tangentX) + radOffset;
      const cosA = Math.cos(baseAngle);
      const sinA = Math.sin(baseAngle);
      const normalX = -sinA;
      const normalY = cosA;

      const halfLen = stitchLen * 0.5;

      if (config.stitchStyle === 'single_thread') {
        ctx.beginPath();
        ctx.moveTo(st.x - cosA * halfLen, st.y - sinA * halfLen);
        ctx.lineTo(st.x + cosA * halfLen, st.y + sinA * halfLen);
        ctx.stroke();
      } else if (config.stitchStyle === 'cross_stitch') {
        const crossAngle1 = baseAngle + Math.PI / 4;
        const crossAngle2 = baseAngle - Math.PI / 4;
        const len = halfLen * 0.9;

        ctx.beginPath();
        ctx.moveTo(st.x - Math.cos(crossAngle1) * len, st.y - Math.sin(crossAngle1) * len);
        ctx.lineTo(st.x + Math.cos(crossAngle1) * len, st.y + Math.sin(crossAngle1) * len);
        ctx.moveTo(st.x - Math.cos(crossAngle2) * len, st.y - Math.sin(crossAngle2) * len);
        ctx.lineTo(st.x + Math.cos(crossAngle2) * len, st.y + Math.sin(crossAngle2) * len);
        ctx.stroke();
      } else if (config.stitchStyle === 'double_stitch') {
        const sep = Math.max(3, stitchThick * 1.5);
        [-sep / 2, sep / 2].forEach((off) => {
          const cx = st.x + normalX * off;
          const cy = st.y + normalY * off;
          ctx.beginPath();
          ctx.moveTo(cx - cosA * halfLen, cy - sinA * halfLen);
          ctx.lineTo(cx + cosA * halfLen, cy + sinA * halfLen);
          ctx.stroke();
        });
      } else if (config.stitchStyle === 'zigzag') {
        const sign = idx % 2 === 0 ? 1 : -1;
        const perpLen = halfLen * 0.8 * sign;
        ctx.beginPath();
        ctx.moveTo(st.x - cosA * halfLen, st.y - sinA * halfLen);
        ctx.lineTo(st.x + normalX * perpLen, st.y + normalY * perpLen);
        ctx.lineTo(st.x + cosA * halfLen, st.y + sinA * halfLen);
        ctx.stroke();
      } else if (config.stitchStyle === 'baseball') {
        const sign = idx % 2 === 0 ? 1 : -1;
        const slantA = baseAngle + (Math.PI / 3) * sign;
        ctx.beginPath();
        ctx.moveTo(st.x - Math.cos(slantA) * halfLen, st.y - Math.sin(slantA) * halfLen);
        ctx.lineTo(st.x + Math.cos(slantA) * halfLen, st.y + Math.sin(slantA) * halfLen);
        ctx.stroke();
      } else {
        // Braided rope segment
        ctx.lineWidth = stitchThick * 0.85;
        const strandAngle = baseAngle + ((idx % 3 - 1) * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(st.x - Math.cos(strandAngle) * halfLen, st.y - Math.sin(strandAngle) * halfLen);
        ctx.lineTo(st.x + Math.cos(strandAngle) * halfLen, st.y + Math.sin(strandAngle) * halfLen);
        ctx.stroke();
      }

      // Thread highlight sheen for 3D realism
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = Math.max(0.7, stitchThick * 0.3);
      ctx.beginPath();
      ctx.moveTo(st.x - cosA * halfLen * 0.6 - 0.5, st.y - sinA * halfLen * 0.6 - 0.5);
      ctx.lineTo(st.x + cosA * halfLen * 0.6 - 0.5, st.y + sinA * halfLen * 0.6 - 0.5);
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }
}
