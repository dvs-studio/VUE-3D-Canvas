/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Procedural Texture Evaluator
 * Created by Victory Ukpong
 */

import { GraphNode, NodeConnection } from '../core/types';

export class NodeEvaluator {
  /**
   * Bakes the procedural shader node graph to a 2D canvas context
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

    // Identify active nodes
    const mappingNode = nodes.find(n => n.type === 'mapping');
    const vectorTransformNode = nodes.find(n => n.type === 'vector_transform');
    const noiseNode = nodes.find(n => n.type === 'noise');
    const voronoiNode = nodes.find(n => n.type === 'voronoi');
    const musgraveNode = nodes.find(n => n.type === 'musgrave');
    const waveNode = nodes.find(n => n.type === 'wave');
    const brickNode = nodes.find(n => n.type === 'brick');
    const checkerNode = nodes.find(n => n.type === 'checker');
    const rampNode = nodes.find(n => n.type === 'color_ramp');
    const mixNode = nodes.find(n => n.type === 'mix_rgb');

    // Vector Mapping parameters
    const locX = mappingNode?.properties.locX ?? 0;
    const locY = mappingNode?.properties.locY ?? 0;
    const scaleX = mappingNode?.properties.scaleX ?? 1;
    const scaleY = mappingNode?.properties.scaleY ?? 1;

    // Vector Transform coordinate space conversions
    const vTransType = vectorTransformNode?.properties.transform_type || 'Vector';
    const vTransFrom = vectorTransformNode?.properties.convert_from || 'World';
    const vTransTo = vectorTransformNode?.properties.convert_to || 'Object';

    // ColorRamp stops
    const stops = rampNode?.properties.stops || [
      { pos: 0.0, color: '#000000' },
      { pos: 1.0, color: '#ffffff' },
    ];

    for (let y = 0; y < h; y++) {
      let v = (y / h) * scaleY + locY;
      for (let x = 0; x < w; x++) {
        let u = (x / w) * scaleX + locX;

        // Apply Vector Transform if node is present
        if (vectorTransformNode) {
          // Point / Vector / Normal coordinate transformation
          let tx = u - 0.5;
          let ty = v - 0.5;
          let tz = 0.0;

          if (vTransFrom !== vTransTo) {
            // Coordinate frame change matrix simulation:
            // World <-> Object: 45-deg rotation / scale
            // World <-> Camera: view rotation (X-Y tilt)
            const angle = (vTransFrom === 'World' && vTransTo === 'Camera') ? 0.7853 : 
                          (vTransFrom === 'Camera' && vTransTo === 'World') ? -0.7853 : 
                          (vTransFrom === 'World' && vTransTo === 'Object') ? 1.5708 : -1.5708;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const rx = tx * cosA - ty * sinA;
            const ry = tx * sinA + ty * cosA;
            tx = rx;
            ty = ry;

            if (vTransType === 'Point') {
              tx += (vTransTo === 'Object' ? 0.25 : -0.25);
            } else if (vTransType === 'Normal') {
              const len = Math.hypot(tx, ty, 0.5) || 1.0;
              tx /= len;
              ty /= len;
            }
          }
          u = tx + 0.5;
          v = ty + 0.5;
        }

        const idx = (y * w + x) * 4;

        let val = 0;
        if (brickNode) {
          const bScale = brickNode.properties.scale || 10;
          const row = Math.floor(v * bScale);
          const shift = (row % 2) * 0.5;
          const bx = Math.abs((u * bScale + shift) % 1);
          const by = Math.abs((v * bScale) % 1);
          val = (bx < 0.08 || by < 0.08) ? 0.1 : 0.9;
        } else if (checkerNode) {
          const cScale = checkerNode.properties.scale || 8;
          const cx = Math.floor(Math.abs(u) * cScale) % 2;
          const cy = Math.floor(Math.abs(v) * cScale) % 2;
          val = (cx ^ cy) ? 1.0 : 0.0;
        } else if (voronoiNode) {
          const vScale = voronoiNode.properties.scale || 6;
          const fx = Math.abs((u * vScale) % 1);
          const fy = Math.abs((v * vScale) % 1);
          val = Math.hypot(fx - 0.5, fy - 0.5) * 2;
          val = Math.min(1, Math.max(0, val));
        } else if (waveNode) {
          const wScale = waveNode.properties.scale || 5;
          val = (Math.sin(u * wScale * Math.PI * 2) + 1) / 2;
        } else if (musgraveNode) {
          const mScale = musgraveNode.properties.scale || 4;
          val = Math.abs(Math.sin(u * mScale * 3) * Math.cos(v * mScale * 3));
        } else {
          // Noise
          const nScale = noiseNode?.properties.scale || 8;
          const s1 = Math.sin(u * nScale * Math.PI + Math.cos(v * nScale * 2));
          const s2 = Math.cos(v * nScale * Math.PI + Math.sin(u * nScale * 2));
          val = (s1 + s2 + 2) / 4;
        }

        val = Math.max(0, Math.min(1, val));

        // Evaluate ColorRamp stops
        const color = this.sampleColorRamp(val, stops);

        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  private static sampleColorRamp(t: number, stops: { pos: number; color: string }[]): { r: number; g: number; b: number } {
    if (stops.length === 0) return { r: 255, g: 255, b: 255 };
    if (stops.length === 1) return this.hexToRgb(stops[0].color);

    const sorted = [...stops].sort((a, b) => a.pos - b.pos);
    if (t <= sorted[0].pos) return this.hexToRgb(sorted[0].color);
    if (t >= sorted[sorted.length - 1].pos) return this.hexToRgb(sorted[sorted.length - 1].color);

    for (let i = 0; i < sorted.length - 1; i++) {
      const s0 = sorted[i];
      const s1 = sorted[i + 1];
      if (t >= s0.pos && t <= s1.pos) {
        const span = s1.pos - s0.pos;
        const factor = span > 0 ? (t - s0.pos) / span : 0;
        const c0 = this.hexToRgb(s0.color);
        const c1 = this.hexToRgb(s1.color);
        return {
          r: Math.round(c0.r * (1 - factor) + c1.r * factor),
          g: Math.round(c0.g * (1 - factor) + c1.g * factor),
          b: Math.round(c0.b * (1 - factor) + c1.b * factor),
        };
      }
    }

    return this.hexToRgb(sorted[sorted.length - 1].color);
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
