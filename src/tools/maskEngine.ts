/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Mask Processing & Morphological Operations Engine
 * Created by Victory Ukpong
 */

import { SelectionMask } from '../core/types';

export class MaskEngine {
  /**
   * Renders the current SelectionMask into a binary/grayscale 1024x1024 mask canvas
   */
  public static rasterizeMask(mask: SelectionMask, w = 1024, h = 1024): HTMLCanvasElement {
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();

    if ((mask.type === 'brush' || mask.type === 'bitmap') && mask.maskCanvas) {
      ctx.drawImage(mask.maskCanvas, 0, 0, w, h);
    } else if (mask.type === 'rect') {
      ctx.rect(mask.bounds.x, mask.bounds.y, mask.bounds.width, mask.bounds.height);
      ctx.fill();
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
      ctx.fill();
    } else if (mask.points.length > 2) {
      ctx.moveTo(mask.points[0].x, mask.points[0].y);
      for (let i = 1; i < mask.points.length; i++) {
        ctx.lineTo(mask.points[i].x, mask.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }

    if (mask.inverted) {
      // Invert mask
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const val = 255 - d[i];
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
      ctx.putImageData(img, 0, 0);
    }

    return cvs;
  }

  /**
   * Expands (dilates) the selection mask by radius pixels
   */
  public static expandMask(mask: SelectionMask, radius = 5): SelectionMask {
    const r = Math.max(1, Math.min(60, radius));
    if (mask.type === 'rect' || mask.type === 'ellipse') {
      return {
        ...mask,
        bounds: {
          x: Math.max(0, mask.bounds.x - r),
          y: Math.max(0, mask.bounds.y - r),
          width: Math.min(1024, mask.bounds.width + r * 2),
          height: Math.min(1024, mask.bounds.height + r * 2),
        },
      };
    }

    // Polygon / Lasso: offset points outward along normal
    const center = mask.points.reduce(
      (acc, p) => ({ x: acc.x + p.x / mask.points.length, y: acc.y + p.y / mask.points.length }),
      { x: 0, y: 0 }
    );

    const newPoints = mask.points.map(p => {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      const dist = Math.hypot(dx, dy) || 1.0;
      return {
        x: Math.max(0, Math.min(1024, p.x + (dx / dist) * r)),
        y: Math.max(0, Math.min(1024, p.y + (dy / dist) * r)),
      };
    });

    return {
      ...mask,
      points: newPoints,
      bounds: {
        x: Math.max(0, mask.bounds.x - r),
        y: Math.max(0, mask.bounds.y - r),
        width: Math.min(1024, mask.bounds.width + r * 2),
        height: Math.min(1024, mask.bounds.height + r * 2),
      },
    };
  }

  /**
   * Shrinks (erodes) the selection mask by radius pixels
   */
  public static shrinkMask(mask: SelectionMask, radius = 5): SelectionMask {
    const r = Math.max(1, Math.min(60, radius));
    if (mask.type === 'rect' || mask.type === 'ellipse') {
      const newW = Math.max(4, mask.bounds.width - r * 2);
      const newH = Math.max(4, mask.bounds.height - r * 2);
      return {
        ...mask,
        bounds: {
          x: mask.bounds.x + r,
          y: mask.bounds.y + r,
          width: newW,
          height: newH,
        },
      };
    }

    const center = mask.points.reduce(
      (acc, p) => ({ x: acc.x + p.x / mask.points.length, y: acc.y + p.y / mask.points.length }),
      { x: 0, y: 0 }
    );

    const newPoints = mask.points.map(p => {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      const dist = Math.hypot(dx, dy) || 1.0;
      return {
        x: p.x - (dx / dist) * Math.min(r, dist * 0.4),
        y: p.y - (dy / dist) * Math.min(r, dist * 0.4),
      };
    });

    return {
      ...mask,
      points: newPoints,
      bounds: {
        x: mask.bounds.x + r,
        y: mask.bounds.y + r,
        width: Math.max(4, mask.bounds.width - r * 2),
        height: Math.max(4, mask.bounds.height - r * 2),
      },
    };
  }

  /**
   * Directly paints or erases with a soft/hard brush on a SelectionMask bitmap
   */
  public static paintMaskDab(
    mask: SelectionMask,
    x: number,
    y: number,
    size: number,
    hardness: number,
    erase = false,
    w = 1024,
    h = 1024
  ): SelectionMask {
    let cvs = mask.maskCanvas;
    if (!cvs) {
      cvs = this.rasterizeMask(mask, w, h);
    }
    const ctx = cvs.getContext('2d')!;
    ctx.save();
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';

    const r = Math.max(1, size / 2);
    const innerR = Math.max(0, r * (hardness / 100));
    const grad = ctx.createRadialGradient(x, y, innerR, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return {
      active: true,
      type: 'brush',
      points: [],
      bounds: {
        x: Math.max(0, Math.min(mask.bounds.x, x - r)),
        y: Math.max(0, Math.min(mask.bounds.y, y - r)),
        width: Math.min(w, Math.max(mask.bounds.width, x + r - mask.bounds.x)),
        height: Math.min(h, Math.max(mask.bounds.height, y + r - mask.bounds.y)),
      },
      inverted: mask.inverted,
      maskCanvas: cvs,
    };
  }
}
