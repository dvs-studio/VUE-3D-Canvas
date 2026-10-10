/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Procedural Texture Evaluator
 * Created by Victory Ukpong
 */

import { GraphNode, NodeConnection } from '../core/types';

export class NodeEvaluator {
  /**
   * Bakes the procedural graph to a 2D canvas context
   */
  public static bakeToCanvas(
    nodes: GraphNode[],
    connections: NodeConnection[],
    ctx: CanvasRenderingContext2D
  ) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    // Find active generator and color ramp
    const noiseNode = nodes.find(n => n.type === 'noise');
    const voronoiNode = nodes.find(n => n.type === 'voronoi');
    const brickNode = nodes.find(n => n.type === 'brick');
    const checkerNode = nodes.find(n => n.type === 'checker');
    const rampNode = nodes.find(n => n.type === 'color_ramp');
    const principledNode = nodes.find(n => n.type === 'principled_bsdf');

    const rampC1 = rampNode?.properties.color1 || '#2c3e50';
    const rampC2 = rampNode?.properties.color2 || '#e74c3c';
    const rgb1 = this.hexToRgb(rampC1);
    const rgb2 = this.hexToRgb(rampC2);

    for (let y = 0; y < h; y++) {
      const v = y / h;
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const idx = (y * w + x) * 4;

        let val = 0;
        if (brickNode) {
          const bScale = brickNode.properties.scale || 10;
          const row = Math.floor(v * bScale);
          const shift = (row % 2) * 0.5;
          const bx = (u * bScale + shift) % 1;
          const by = (v * bScale) % 1;
          val = (bx < 0.08 || by < 0.08) ? 0.1 : 0.9;
        } else if (checkerNode) {
          const cScale = checkerNode.properties.scale || 8;
          const cx = Math.floor(u * cScale) % 2;
          const cy = Math.floor(v * cScale) % 2;
          val = (cx ^ cy) ? 1.0 : 0.0;
        } else if (voronoiNode) {
          const vScale = voronoiNode.properties.scale || 6;
          const fx = (u * vScale) % 1;
          const fy = (v * vScale) % 1;
          val = Math.hypot(fx - 0.5, fy - 0.5) * 2;
          val = Math.min(1, Math.max(0, val));
        } else {
          // Noise
          const nScale = noiseNode?.properties.scale || 8;
          const s1 = Math.sin(u * nScale * 3.14 + Math.cos(v * nScale * 2));
          const s2 = Math.cos(v * nScale * 3.14 + Math.sin(u * nScale * 2));
          val = (s1 + s2 + 2) / 4;
        }

        // Apply Color Ramp interpolation
        const r = Math.round(rgb1.r * (1 - val) + rgb2.r * val);
        const g = Math.round(rgb1.g * (1 - val) + rgb2.g * val);
        const b = Math.round(rgb1.b * (1 - val) + rgb2.b * val);

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }
}
