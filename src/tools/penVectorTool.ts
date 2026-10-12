/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Pen Vector Path Tool
 * Created by Victory Ukpong
 */

import { VectorPath, VectorPoint, BrushPreset } from '../core/types';
import { BrushEngine } from './brushEngine';

export class PenVectorTool {
  private activePath: VectorPath | null = null;

  public getActivePath(): VectorPath | null {
    return this.activePath;
  }

  public startNewPath(startX: number, startY: number): VectorPath {
    this.activePath = {
      id: `path_${Date.now()}`,
      points: [{ x: startX, y: startY }],
      closed: false,
    };
    return this.activePath;
  }

  public addPoint(x: number, y: number) {
    if (!this.activePath) {
      this.startNewPath(x, y);
      return;
    }
    this.activePath.points.push({ x, y });
  }

  public closePath() {
    if (this.activePath && this.activePath.points.length > 2) {
      this.activePath.closed = true;
    }
  }

  public clearPath() {
    this.activePath = null;
  }

  /**
   * Action 1: Distribute brush paint along the path with custom spacing
   */
  public distributeBrushAlongPath(
    ctx: CanvasRenderingContext2D,
    brush: BrushPreset,
    spacingMultiplier = 1.0
  ) {
    if (!this.activePath || this.activePath.points.length < 2) return;
    const brushEngine = BrushEngine.getInstance();
    const pts = this.activePath.points;

    brushEngine.beginStroke(pts[0].x, pts[0].y, 1.0);

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      
      // Interpolate along segment
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const steps = Math.max(10, Math.ceil(dist / 4));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const ix = p1.x + (p2.x - p1.x) * t;
        const iy = p1.y + (p2.y - p1.y) * t;
        brushEngine.paintDabs(ctx, ix, iy, { ...brush, spacing: brush.spacing * spacingMultiplier });
      }
    }

    if (this.activePath.closed && pts.length > 2) {
      const pLast = pts[pts.length - 1];
      const pFirst = pts[0];
      const dist = Math.hypot(pFirst.x - pLast.x, pFirst.y - pLast.y);
      const steps = Math.max(10, Math.ceil(dist / 4));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const ix = pLast.x + (pFirst.x - pLast.x) * t;
        const iy = pLast.y + (pFirst.y - pLast.y) * t;
        brushEngine.paintDabs(ctx, ix, iy, { ...brush, spacing: brush.spacing * spacingMultiplier });
      }
    }

    brushEngine.endStroke();
  }

  /**
   * Action 2: Fill path with solid color, pattern, or texture
   */
  public fillPath(
    ctx: CanvasRenderingContext2D,
    fillColor: string,
    opacity = 100
  ) {
    if (!this.activePath || this.activePath.points.length < 3) return;
    const pts = this.activePath.points;

    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Action 2b: Erase area enclosed by curve path
   */
  public erasePath(ctx: CanvasRenderingContext2D) {
    if (!this.activePath || this.activePath.points.length < 3) return;
    const pts = this.activePath.points;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Action 3: Convert path to plain selection
   */
  public convertPathToSelection() {
    if (!this.activePath || this.activePath.points.length < 3) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.activePath.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      active: true,
      type: 'polygon' as const,
      points: [...this.activePath.points],
      bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      inverted: false,
    };
  }
}
