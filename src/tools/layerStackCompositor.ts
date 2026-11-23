import { Layer } from '../core/types';

/**
 * Produce the target layer's visible pixels after applying linked greyscale
 * Mask and Tear layers. The helper is intentionally non-destructive: source
 * layer canvases and mask canvases remain independently editable.
 */
export function createLayerCompositeSource(target: Layer, stack: Layer[]): HTMLCanvasElement {
  const linked = stack.filter(layer =>
    layer.visible &&
    !layer.isGroup &&
    (layer.layerType === 'mask' || layer.layerType === 'tear') &&
    layer.targetLayerId === target.id
  );
  if (!linked.length) return target.canvas;

  const canvas = document.createElement('canvas');
  canvas.width = target.canvas.width;
  canvas.height = target.canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return target.canvas;
  ctx.drawImage(target.canvas, 0, 0);

  try {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    for (const maskLayer of linked) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskContext = maskCanvas.getContext('2d');
      if (!maskContext) continue;
      maskContext.drawImage(maskLayer.canvas, 0, 0, canvas.width, canvas.height);
      const mask = maskContext.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = mask[i + 3] / 255;
        const r = mask[i] / 255, g = mask[i + 1] / 255, b = mask[i + 2] / 255;
        let influence = (0.299 * r + 0.587 * g + 0.114 * b) * alpha;
        if (maskLayer.layerType === 'tear') {
          // Green-coded pixels are the Tear stack-mask role; white retains
          // the torn edge, while black or transparent pixels cut a hole.
          influence = g > r * 1.2 && g > b * 1.2 ? g * alpha : Math.max(r, g, b) * alpha;
        }
        data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, influence)));
      }
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  } catch (error) {
    console.warn('Layer mask composition skipped; retaining original layer pixels.', error);
    return target.canvas;
  }
}
export interface LayerBlendRect {
  sx: number; sy: number; sw: number; sh: number;
  dx: number; dy: number; dw: number; dh: number;
}

/**
 * Composite a layer using the same blend semantics in the 2D UV preview,
 * 3D material atlas, merged layer output and application composite.
 * Subtract is implemented as a real channel subtraction; the remaining modes
 * use the Canvas2D compositing operators.
 */
export function drawLayerWithBlend(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  mode: Layer['blendMode'],
  opacity = 1,
  rect?: LayerBlendRect,
): void {
  const area = rect || {
    sx: 0, sy: 0, sw: source.width, sh: source.height,
    dx: 0, dy: 0, dw: ctx.canvas.width, dh: ctx.canvas.height,
  };
  const alpha = Math.max(0, Math.min(1, opacity));
  if (alpha <= 0 || area.sw <= 0 || area.sh <= 0 || area.dw <= 0 || area.dh <= 0) return;

  if (mode === 'subtract') {
    try {
      const width = Math.max(1, Math.ceil(area.dw));
      const height = Math.max(1, Math.ceil(area.dh));
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      const sourceContext = sourceCanvas.getContext('2d');
      if (!sourceContext) return;
      sourceContext.drawImage(source, area.sx, area.sy, area.sw, area.sh, 0, 0, width, height);
      const sourcePixels = sourceContext.getImageData(0, 0, width, height);
      const destinationPixels = ctx.getImageData(area.dx, area.dy, width, height);
      const src = sourcePixels.data;
      const dst = destinationPixels.data;
      for (let i = 0; i < dst.length; i += 4) {
        const destinationAlpha = dst[i + 3] / 255;
        if (destinationAlpha <= 0) continue;
        const sourceCoverage = (src[i + 3] / 255) * alpha;
        if (sourceCoverage <= 0) continue;
        dst[i] = Math.max(0, Math.round(dst[i] - src[i] * sourceCoverage));
        dst[i + 1] = Math.max(0, Math.round(dst[i + 1] - src[i + 1] * sourceCoverage));
        dst[i + 2] = Math.max(0, Math.round(dst[i + 2] - src[i + 2] * sourceCoverage));
      }
      ctx.putImageData(destinationPixels, area.dx, area.dy);
      return;
    } catch (error) {
      // Cross-origin images may taint a canvas. Keep the operation visible with
      // a safe difference fallback instead of interrupting the paint workflow.
      console.warn('Subtractive layer blend fell back to difference:', error);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'difference';
      ctx.drawImage(source, area.sx, area.sy, area.sw, area.sh, area.dx, area.dy, area.dw, area.dh);
      ctx.restore();
      return;
    }
  }

  const operators: Record<string, GlobalCompositeOperation> = {
    normal: 'source-over',
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay',
    darken: 'darken',
    lighten: 'lighten',
    hard_light: 'hard-light',
    soft_light: 'soft-light',
    difference: 'difference',
    add: 'lighter',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = operators[mode] || 'source-over';
  ctx.drawImage(source, area.sx, area.sy, area.sw, area.sh, area.dx, area.dy, area.dw, area.dh);
  ctx.restore();
}
