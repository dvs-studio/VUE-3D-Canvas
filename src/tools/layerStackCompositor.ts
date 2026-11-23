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
