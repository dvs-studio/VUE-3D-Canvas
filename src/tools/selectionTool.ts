/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Selection Utilities (Marquee, Lasso, Polygon)
 * Created by Victory Ukpong
 * 
 * Explicitly excludes resource-heavy magic wand tools to preserve low memory footprint.
 */

import { SelectionMask } from '../core/types';

export class SelectionTool {
  public static isPointInSelection(x: number, y: number, mask: SelectionMask | null): boolean {
    if (!mask || !mask.active) return true; // No selection = whole canvas editable

    let inside = false;
    if (mask.type === 'rect') {
      const b = mask.bounds;
      inside = x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
    } else if (mask.type === 'ellipse') {
      const b = mask.bounds;
      const rx = b.width / 2;
      const ry = b.height / 2;
      const cx = b.x + rx;
      const cy = b.y + ry;
      if (rx <= 0 || ry <= 0) return false;
      const normX = (x - cx) / rx;
      const normY = (y - cy) / ry;
      inside = normX * normX + normY * normY <= 1;
    } else {
      // Polygon / Lasso Raycasting algorithm
      const pts = mask.points;
      let j = pts.length - 1;
      for (let i = 0; i < pts.length; i++) {
        if ((pts[i].y > y) !== (pts[j].y > y) &&
            x < ((pts[j].x - pts[i].x) * (y - pts[i].y)) / (pts[j].y - pts[i].y) + pts[i].x) {
          inside = !inside;
        }
        j = i;
      }
    }

    return mask.inverted ? !inside : inside;
  }

  public static clipContextToSelection(ctx: CanvasRenderingContext2D, mask: SelectionMask | null) {
    if (!mask || !mask.active) return;

    ctx.beginPath();
    if (mask.type === 'rect') {
      ctx.rect(mask.bounds.x, mask.bounds.y, mask.bounds.width, mask.bounds.height);
    } else if (mask.type === 'ellipse') {
      const rx = mask.bounds.width / 2;
      const ry = mask.bounds.height / 2;
      ctx.ellipse(
        mask.bounds.x + rx,
        mask.bounds.y + ry,
        Math.max(1, rx),
        Math.max(1, ry),
        0, 0, Math.PI * 2
      );
    } else if (mask.points.length > 2) {
      ctx.moveTo(mask.points[0].x, mask.points[0].y);
      for (let i = 1; i < mask.points.length; i++) {
        ctx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      ctx.closePath();
    }
    ctx.clip();
  }
}
