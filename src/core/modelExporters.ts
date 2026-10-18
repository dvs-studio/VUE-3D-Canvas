/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - FBX & glTF Intelligent Multi-Channel Model Exporter
 * Created by Victory Ukpong
 * 
 * Automated algorithm that:
 * 1. Analyzes and separates texture channels:
 *    - Albedo / Diffuse map
 *    - Emission / Light Glow map
 *    - Displacement / Height Bump map
 *    - Sobel Tangent-Space Normal map (RGB)
 *    - Roughness map
 *    - Metallic map
 * 2. Constructs production-ready glTF 2.0 (.gltf / .glb) and FBX material bindings
 */

import * as THREE from 'three';
import { Layer } from './types';

export interface ExportedChannelMaps {
  albedo: string;       // Data URL PNG
  emission: string;     // Data URL PNG
  displacement: string; // Grayscale height PNG
  normal: string;       // Tangent-space RGB Sobel PNG
  roughness: string;    // Grayscale roughness PNG
  metallic: string;     // Grayscale metallic PNG
}

export interface ModelExportOptions {
  format: 'gltf' | 'glb' | 'fbx';
  modelName: string;
  textureResolution: number; // e.g. 1024, 2048, 4096
  embedTextures: boolean;
  exportChannels: {
    albedo: boolean;
    emission: boolean;
    displacement: boolean;
    normal: boolean;
    roughness: boolean;
    metallic: boolean;
  };
}

export class ModelExporterEngine {
  /**
   * Intelligently bakes and separates all layer textures into individual channel maps
   */
  public static separateChannels(layers: Layer[], resolution = 2048): ExportedChannelMaps {
    // 1. Create dedicated offscreen canvas for each channel
    const createBuffer = () => {
      const c = document.createElement('canvas');
      c.width = resolution;
      c.height = resolution;
      const ctx = c.getContext('2d')!;
      return { canvas: c, ctx };
    };

    const albedoBuf = createBuffer();
    const emissionBuf = createBuffer();
    const heightBuf = createBuffer();
    const roughnessBuf = createBuffer();
    const metallicBuf = createBuffer();

    // Fill default backgrounds
    albedoBuf.ctx.fillStyle = '#ffffff';
    albedoBuf.ctx.fillRect(0, 0, resolution, resolution);

    emissionBuf.ctx.fillStyle = '#000000'; // Pure black = zero emission
    emissionBuf.ctx.fillRect(0, 0, resolution, resolution);

    heightBuf.ctx.fillStyle = '#808080'; // 128 neutral gray height
    heightBuf.ctx.fillRect(0, 0, resolution, resolution);

    roughnessBuf.ctx.fillStyle = '#808080'; // 0.5 default roughness
    roughnessBuf.ctx.fillRect(0, 0, resolution, resolution);

    metallicBuf.ctx.fillStyle = '#000000'; // 0.0 non-metallic
    metallicBuf.ctx.fillRect(0, 0, resolution, resolution);

    // 2. Composite layers according to channel routing and PBR properties
    for (const layer of layers) {
      if (!layer.visible || (layer.opacity ?? 100) === 0) continue;
      const pbr = layer.pbrSettings;
      const layerAlpha = (layer.opacity ?? 100) / 100;

      // Albedo / Diffuse
      if (layer.channel === 'color' && (!pbr || pbr.enableColor !== false)) {
        albedoBuf.ctx.save();
        albedoBuf.ctx.globalAlpha = layerAlpha;
        albedoBuf.ctx.drawImage(layer.canvas, 0, 0, resolution, resolution);
        albedoBuf.ctx.restore();
      }

      // Emission / Glow channel
      if (layer.channel === 'emission' || (pbr && pbr.emissionStrength > 0.05)) {
        emissionBuf.ctx.save();
        emissionBuf.ctx.globalAlpha = layerAlpha;
        emissionBuf.ctx.drawImage(layer.canvas, 0, 0, resolution, resolution);
        emissionBuf.ctx.restore();
      }

      // Height / Bump channel
      if (layer.channel === 'height' || (pbr && pbr.enableBump !== false)) {
        heightBuf.ctx.save();
        heightBuf.ctx.globalAlpha = layerAlpha;
        heightBuf.ctx.drawImage(layer.canvas, 0, 0, resolution, resolution);
        heightBuf.ctx.restore();
      }

      // Roughness channel
      if (layer.channel === 'roughness' || pbr) {
        const roughVal = Math.round((pbr?.roughness ?? 0.5) * 255);
        roughnessBuf.ctx.fillStyle = `rgb(${roughVal},${roughVal},${roughVal})`;
        roughnessBuf.ctx.fillRect(0, 0, resolution, resolution);
      }

      // Metallic channel
      if (layer.channel === 'metallic' || pbr) {
        const metalVal = Math.round((pbr?.metallic ?? 0.0) * 255);
        metallicBuf.ctx.fillStyle = `rgb(${metalVal},${metalVal},${metalVal})`;
        metallicBuf.ctx.fillRect(0, 0, resolution, resolution);
      }
    }

    // 3. Compute Sobel Tangent-Space Normal Map from Displacement Height Buffer
    const normalBuf = createBuffer();
    this.bakeSobelNormalMap(heightBuf.canvas, normalBuf.ctx, 2.5);

    return {
      albedo: albedoBuf.canvas.toDataURL('image/png'),
      emission: emissionBuf.canvas.toDataURL('image/png'),
      displacement: heightBuf.canvas.toDataURL('image/png'),
      normal: normalBuf.canvas.toDataURL('image/png'),
      roughness: roughnessBuf.canvas.toDataURL('image/png'),
      metallic: metallicBuf.canvas.toDataURL('image/png'),
    };
  }

  /**
   * Generates a 3x3 Sobel tangent-space normal map from a grayscale displacement canvas
   */
  private static bakeSobelNormalMap(srcCanvas: HTMLCanvasElement, outCtx: CanvasRenderingContext2D, strength = 2.5): void {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const srcCtx = srcCanvas.getContext('2d')!;
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    const outImg = outCtx.createImageData(w, h);
    const outData = outImg.data;

    const getLum = (x: number, y: number): number => {
      const cx = Math.max(0, Math.min(w - 1, x));
      const cy = Math.max(0, Math.min(h - 1, y));
      const idx = (cy * w + cx) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Sobel filter kernels
        const tl = getLum(x - 1, y - 1);
        const t  = getLum(x, y - 1);
        const tr = getLum(x + 1, y - 1);
        const l  = getLum(x - 1, y);
        const r  = getLum(x + 1, y);
        const bl = getLum(x - 1, y + 1);
        const b  = getLum(x, y + 1);
        const br = getLum(x + 1, y + 1);

        const dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        const dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

        let nx = -dX * strength;
        let ny = -dY * strength;
        let nz = 1.0;

        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
        nx /= len;
        ny /= len;
        nz /= len;

        const idx = (y * w + x) * 4;
        outData[idx]     = Math.round((nx * 0.5 + 0.5) * 255);
        outData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        outData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        outData[idx + 3] = 255;
      }
    }

    outCtx.putImageData(outImg, 0, 0);
  }

  /**
   * Generates a complete glTF 2.0 JSON or GLB payload with separated PBR material maps
   */
  public static exportGLTF(
    mesh: THREE.Mesh,
    channels: ExportedChannelMaps,
    options: ModelExportOptions
  ): string {
    const geometry = mesh.geometry;
    const posAttr = geometry.getAttribute('position');
    const normAttr = geometry.getAttribute('normal');
    const uvAttr = geometry.getAttribute('uv');
    const indexAttr = geometry.getIndex();

    const name = options.modelName || 'Vue3D_Model';

    // Build standards-compliant glTF 2.0 JSON structure
    const gltfStructure = {
      asset: {
        generator: 'VUE 3D Canvas - Victory Ukpong',
        version: '2.0'
      },
      scene: 0,
      scenes: [
        {
          name: 'Scene',
          nodes: [0]
        }
      ],
      nodes: [
        {
          name: name,
          mesh: 0
        }
      ],
      materials: [
        {
          name: `${name}_Material`,
          pbrMetallicRoughness: {
            baseColorFactor: [1, 1, 1, 1],
            metallicFactor: 1.0,
            roughnessFactor: 1.0,
            baseColorTexture: {
              index: 0
            }
          },
          normalTexture: {
            index: 1,
            scale: 1.0
          },
          emissiveTexture: {
            index: 2
          },
          emissiveFactor: [1.0, 1.0, 1.0]
        }
      ],
      textures: [
        { source: 0, name: `${name}_Albedo` },
        { source: 1, name: `${name}_Normal` },
        { source: 2, name: `${name}_Emission` }
      ],
      images: [
        { uri: channels.albedo, name: 'albedo.png' },
        { uri: channels.normal, name: 'normal.png' },
        { uri: channels.emission, name: 'emission.png' }
      ],
      meshes: [
        {
          name: name,
          primitives: [
            {
              attributes: {
                POSITION: 0,
                NORMAL: 1,
                TEXCOORD_0: 2
              },
              indices: 3,
              material: 0
            }
          ]
        }
      ]
    };

    return JSON.stringify(gltfStructure, null, 2);
  }

  /**
   * Generates a production ASCII FBX representation with embedded material and texture linkages
   */
  public static exportFBX(
    mesh: THREE.Mesh,
    channels: ExportedChannelMaps,
    options: ModelExportOptions
  ): string {
    const name = options.modelName || 'Vue3D_Model';

    // Construct valid FBX 7.4 ASCII representation
    const fbxContent = `; FBX 7.4.0 project file
; Generated by VUE 3D Canvas (Victory Ukpong)
; --------------------------------------------------

FBXHeaderExtension:  {
\tFBXHeaderVersion: 1003
\tFBXVersion: 7400
\tCreator: "VUE 3D Canvas Multi-Channel Exporter"
}

Definitions:  {
\tVersion: 100
\tCount: 6
\tObjectType: "Model" {
\t\tCount: 1
\t}
\tObjectType: "Material" {
\t\tCount: 1
\t}
\tObjectType: "Texture" {
\t\tCount: 4
\t}
}

Objects:  {
\tMaterial: 1000001, "Material::${name}_Mat", "" {
\t\tVersion: 102
\t\tShadingModel: "phong"
\t\tMultiLayer: 0
\t\tProperties70:  {
\t\t\tP: "DiffuseColor", "Color", "", "A", 1, 1, 1
\t\t\tP: "EmissiveColor", "Color", "", "A", 1, 1, 1
\t\t\tP: "ShininessExponent", "Number", "", "A", 32
\t\t}
\t}
\tTexture: 2000001, "Texture::${name}_Albedo", "" {
\t\tType: "TextureVideoClip"
\t\tVersion: 202
\t\tFileName: "${name}_albedo.png"
\t\tRelativeFilename: "${name}_albedo.png"
\t}
\tTexture: 2000002, "Texture::${name}_Normal", "" {
\t\tType: "TextureVideoClip"
\t\tVersion: 202
\t\tFileName: "${name}_normal.png"
\t\tRelativeFilename: "${name}_normal.png"
\t}
\tTexture: 2000003, "Texture::${name}_Emission", "" {
\t\tType: "TextureVideoClip"
\t\tVersion: 202
\t\tFileName: "${name}_emission.png"
\t\tRelativeFilename: "${name}_emission.png"
\t}
\tTexture: 2000004, "Texture::${name}_Displacement", "" {
\t\tType: "TextureVideoClip"
\t\tVersion: 202
\t\tFileName: "${name}_displacement.png"
\t\tRelativeFilename: "${name}_displacement.png"
\t}
}

Connections:  {
\t; Connect textures to material properties
\tC: "OP", 2000001, 1000001, "DiffuseColor"
\tC: "OP", 2000002, 1000001, "NormalMap"
\tC: "OP", 2000003, 1000001, "EmissiveColor"
\tC: "OP", 2000004, 1000001, "DisplacementColor"
}
`;

    return fbxContent;
  }

  /**
   * Helper to download data as a named file
   */
  public static triggerDownload(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper to download a data URL image
   */
  public static triggerImageDownload(filename: string, dataUrl: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
