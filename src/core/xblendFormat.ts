/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - .xblend Custom Project Format, Blender Interop & ZIP Bundle Exporter
 * Created by Victory Ukpong
 */

import JSZip from 'jszip';
import { Layer, MeshModelAsset, XBlendProject, LayerPBRSettings } from './types';
import { UndoRingBuffer } from './history';

type LayerMapKind = 'color' | 'emission' | 'height' | 'reflection' | 'normal';

function getLayerPbr(layer: Layer): LayerPBRSettings {
  const saved = layer.pbrSettings || {} as LayerPBRSettings;
  const channel = layer.channel;
  return {
    roughness: saved.roughness ?? 0.5,
    metallic: saved.metallic ?? 0,
    bumpHeight: saved.bumpHeight ?? 1,
    normalStrength: saved.normalStrength ?? 1,
    emissionStrength: saved.emissionStrength ?? 0,
    emissionColor: saved.emissionColor ?? '#ffffff',
    opacity: saved.opacity ?? (layer.opacity ?? 100) / 100,
    enableColor: saved.enableColor ?? true,
    enableBump: saved.enableBump ?? channel === 'height',
    reflectionSource: saved.reflectionSource ?? 'hdri',
    reflectionIntensity: saved.reflectionIntensity ?? 0.8,
    colorOn: saved.colorOn ?? !['height', 'normal', 'emission', 'roughness'].includes(channel),
    colorInfluence: saved.colorInfluence ?? 1,
    reflectionOn: saved.reflectionOn ?? channel === 'roughness',
    reflectionInfluence: saved.reflectionInfluence ?? (channel === 'roughness' ? 1 : 0),
    emissionOn: saved.emissionOn ?? channel === 'emission',
    emissionInfluence: saved.emissionInfluence ?? (channel === 'emission' ? 1 : 0),
    bumpOn: saved.bumpOn ?? channel === 'height',
    bumpInfluence: saved.bumpInfluence ?? (channel === 'height' ? 1 : 0),
    bumpRamp: (saved.bumpRamp?.length ? saved.bumpRamp : [{ position: 0, height: 0 }, { position: 1, height: 1 }])
      .map(stop => ({ position: Math.max(0, Math.min(1, stop.position)), height: Math.max(0, Math.min(1, stop.height)) }))
      .sort((a, b) => a.position - b.position),
    normalLock: saved.normalLock ?? channel === 'normal',
  };
}

function mapPath(projectName: string, layerId: string, kind: LayerMapKind): string {
  const project = (projectName || 'VUE3D_Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const id = layerId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `layer_maps/${project}__${id}__${kind}.png`;
}

function makeLayerMapDataUrl(layer: Layer, kind: LayerMapKind, pbr: LayerPBRSettings): string {
  if (kind === 'color' || kind === 'emission' || kind === 'normal') return layer.canvas.toDataURL('image/png');

  const canvas = document.createElement('canvas');
  canvas.width = layer.canvas.width;
  canvas.height = layer.canvas.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create an offscreen canvas for layer map export.');
  context.drawImage(layer.canvas, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;

  const ramp = (pbr.bumpRamp || [{ position: 0, height: 0 }, { position: 1, height: 1 }])
    .slice().sort((a, b) => a.position - b.position);
  const rampHeight = (value: number) => {
    if (value <= ramp[0].position) return ramp[0].height;
    if (value >= ramp[ramp.length - 1].position) return ramp[ramp.length - 1].height;
    for (let i = 0; i < ramp.length - 1; i++) {
      const left = ramp[i];
      const right = ramp[i + 1];
      if (value >= left.position && value <= right.position) {
        const span = right.position - left.position || 1;
        const t = (value - left.position) / span;
        return left.height + (right.height - left.height) * t;
      }
    }
    return value;
  };

  for (let i = 0; i < data.length; i += 4) {
    const luminance = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    const value = kind === 'height' ? rampHeight(luminance) : luminance;
    const byte = Math.round(Math.max(0, Math.min(1, value)) * 255);
    data[i] = data[i + 1] = data[i + 2] = byte;
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function layerMapManifest(layer: Layer, index: number, projectName: string, effectiveVisible = layer.visible && !layer.isGroup) {
  const pbr = getLayerPbr(layer);
  const maps: Partial<Record<LayerMapKind, string>> = {};
  if (!layer.isGroup && pbr.colorOn && (pbr.colorInfluence ?? 0) > 0) maps.color = mapPath(projectName, layer.id, 'color');
  if (!layer.isGroup && pbr.emissionOn && (pbr.emissionInfluence ?? 0) > 0) maps.emission = mapPath(projectName, layer.id, 'emission');
  if (!layer.isGroup && pbr.bumpOn && (pbr.bumpInfluence ?? 0) > 0) maps.height = mapPath(projectName, layer.id, 'height');
  if (!layer.isGroup && pbr.reflectionOn && (pbr.reflectionInfluence ?? 0) > 0) maps.reflection = mapPath(projectName, layer.id, 'reflection');
  if (!layer.isGroup && pbr.normalLock) maps.normal = mapPath(projectName, layer.id, 'normal');
  return {
    id: layer.id,
    name: layer.name,
    order: index,
    visible: effectiveVisible,
    opacity: layer.opacity,
    blendMode: layer.blendMode,
    uvChannel: layer.uvChannel || 'uv_original',
    colorOn: !!pbr.colorOn,
    colorInfluence: pbr.colorInfluence ?? 1,
    reflectionOn: !!pbr.reflectionOn,
    reflectionInfluence: pbr.reflectionInfluence ?? 0,
    emissionOn: !!pbr.emissionOn,
    emissionInfluence: pbr.emissionInfluence ?? 0,
    bumpOn: !!pbr.bumpOn,
    bumpInfluence: pbr.bumpInfluence ?? 0,
    bumpRamp: pbr.bumpRamp || [{ position: 0, height: 0 }, { position: 1, height: 1 }],
    bumpHeight: pbr.bumpHeight ?? 1,
    normalStrength: pbr.normalStrength ?? 1,
    emissionStrength: pbr.emissionStrength ?? 0,
    emissionColor: pbr.emissionColor ?? '#ffffff',
    normalLock: !!pbr.normalLock,
    maps,
    _pbr: pbr,
  };
}

export class XBlendManager {
  /**
   * Generates the serialized .xblend project structure
   */
  public static async exportProject(
    projectName: string,
    embed3DAssets: boolean,
    model: MeshModelAsset,
    layers: Layer[],
    undoBuffer: UndoRingBuffer,
    materialProps: { metallic: number; roughness: number; normalStrength: number; clearcoat: number; ior: number }
  ): Promise<string> {
    // 1. Process layers to dataURLs
    const cleanProjectName = (projectName || 'VUE3D_Project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const serializedLayers = layers.map((layer, index) => {
      const entry = layerMapManifest(layer, index, cleanProjectName, layer.visible && !layer.isGroup && (!layer.groupId || layers.find(parent => parent.id === layer.groupId)?.visible !== false));
      const { _pbr, ...manifest } = entry;
      return {
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        locked: layer.locked,
        channel: layer.channel,
        dataUrl: layer.canvas.toDataURL('image/png'),
        pbrSettings: _pbr,
        ...manifest,
      };
    });

    // 2. Process Undo states (Strictly 3 states stored into .xblend file structure upon save)
    const undoStatesMeta = undoBuffer.getSaveStatesForXBlend().map(s => ({
      id: `slot_${s.slotIndex}`,
      timestamp: s.timestamp || Date.now(),
      description: s.description,
      dataUrls: {}, // Lightweight reference in project file to preserve tiny footprint
    }));

    // 3. Process 3D Mesh (Linked vs. Embedded)
    const modelAssetToSave: MeshModelAsset = {
      ...model,
      linked: !embed3DAssets,
      embeddedGeometryData: embed3DAssets ? model.embeddedGeometryData || 'packed_mesh_binary' : undefined,
    };

    const project: XBlendProject = {
      formatVersion: '1.2.0',
      application: 'VUE 3D Canvas',
      author: 'Victory Ukpong',
      projectName: projectName || 'Untitled_Project',
      embed3DAssets,
      model: modelAssetToSave,
      layers: serializedLayers,
      nodeGraph: { nodes: [], connections: [] },
      undoRingBuffer: {
        maxStates: 3,
        states: undoStatesMeta,
      },
      materialProperties: materialProps,
      createdDate: new Date().toISOString(),
      savedDate: new Date().toISOString(),
    };

    return JSON.stringify(project, null, 2);
  }

  /**
   * Parses an uploaded .xblend file
   */
  public static parseProject(jsonString: string): XBlendProject {
    try {
      const data = JSON.parse(jsonString);
      if (data.application !== 'VUE 3D Canvas' && !data.formatVersion) {
        throw new Error('Not a valid VUE 3D Canvas (.xblend) file format.');
      }
      return data as XBlendProject;
    } catch (err: any) {
      throw new Error(`Failed to parse .xblend file: ${err.message}`);
    }
  }

  /**
   * Exports project in .xblend + ZIP format:
   * Packages the .xblend project, one baked map per enabled layer contribution, and the PBR manifest.
   */
  public static async exportProjectBundleZip(
    projectName: string,
    embed3DAssets: boolean,
    model: MeshModelAsset,
    layers: Layer[],
    undoBuffer: UndoRingBuffer,
    materialProps: any
  ): Promise<void> {
    const zip = new JSZip();
    const cleanProjectName = (projectName || 'VUE3D_Project').replace(/\s+/g, '_');

    // 1. Export .xblend project file
    const xblendContent = await this.exportProject(
      projectName,
      embed3DAssets,
      model,
      layers,
      undoBuffer,
      materialProps
    );
    zip.file(`${cleanProjectName}.xblend`, xblendContent);

    // Only channel maps that a layer actually contributes are included.
    const layerMapsFolder = zip.folder('layer_maps')!;
    const mapKinds: LayerMapKind[] = ['color', 'emission', 'height', 'reflection', 'normal'];

    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index];
      const entry = layerMapManifest(layer, index, cleanProjectName, layer.visible && !layer.isGroup && (!layer.groupId || layers.find(parent => parent.id === layer.groupId)?.visible !== false));
      const pbr = entry._pbr;
      for (const kind of mapKinds) {
        const relativePath = entry.maps[kind];
        if (!relativePath) continue;
        const dataUrl = makeLayerMapDataUrl(layer, kind, pbr);
        const base64 = dataUrl.split(',')[1];
        const fileName = relativePath.slice('layer_maps/'.length);
        layerMapsFolder.file(fileName, base64, { base64: true });
      }
    }

    const layerManifest = {
      format: 'VUE3D_LAYER_PBR_MANIFEST',
      version: '1.0.0',
      projectName: cleanProjectName,
      layers: layers.map((layer, index) => {
        const entry = layerMapManifest(layer, index, cleanProjectName);
        const { _pbr, ...manifestEntry } = entry;
        return manifestEntry;
      }),
      colorSpace: { color: 'sRGB', emission: 'sRGB', height: 'Non-Color', reflection: 'Non-Color', normal: 'Non-Color' },
    };
    zip.file('layer_manifest.json', JSON.stringify(layerManifest, null, 2));

    // 4. Generate and download ZIP bundle
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${cleanProjectName}_xblend_bundle.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Triggers a browser file download
   */
  public static downloadFile(content: string, filename: string, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
