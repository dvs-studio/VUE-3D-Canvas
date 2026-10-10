/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - .xblend Custom Project Format & Blender Interop
 * Created by Victory Ukpong
 */

import { Layer, MeshModelAsset, XBlendProject, GraphNode, NodeConnection } from './types';
import { UndoRingBuffer } from './history';

export class XBlendManager {
  /**
   * Generates the serialized .xblend project structure
   */
  public static async exportProject(
    projectName: string,
    embed3DAssets: boolean,
    model: MeshModelAsset,
    layers: Layer[],
    nodeGraph: { nodes: GraphNode[]; connections: NodeConnection[] },
    undoBuffer: UndoRingBuffer,
    materialProps: { metallic: number; roughness: number; normalStrength: number; clearcoat: number; ior: number }
  ): Promise<string> {
    // 1. Process layers to dataURLs
    const serializedLayers = layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      locked: layer.locked,
      channel: layer.channel,
      dataUrl: layer.canvas.toDataURL('image/png'),
    }));

    // 2. Process Undo states (Strictly 3 max states stored in ring buffer)
    const undoStatesMeta = undoBuffer.getRingSlots().filter(s => s.isFilled).map(s => ({
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
      nodeGraph,
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
   * Exports a Blender 2.79/2.83 compatible material specification JSON / py script
   */
  public static exportBlenderMaterialSetup(
    materialName: string,
    nodes: GraphNode[],
    connections: NodeConnection[],
    materialProps: any
  ): string {
    const blenderDoc = {
      type: "BLENDER_MATERIAL_SPECIFICATION",
      targetBlenderVersion: "2.83_LTS",
      materialName: materialName || "VUE3D_PBR_Material",
      useNodes: true,
      nodes: nodes.map(n => ({
        name: n.title,
        type: n.type.toUpperCase(),
        location: [n.x, n.y],
        properties: n.properties,
      })),
      links: connections.map(c => ({
        from_node: c.fromNodeId,
        from_socket: c.fromSocketId,
        to_node: c.toNodeId,
        to_socket: c.toSocketId,
      })),
      principledBSDF: {
        BaseColor: [0.8, 0.8, 0.8, 1.0],
        Metallic: materialProps.metallic,
        Roughness: materialProps.roughness,
        NormalStrength: materialProps.normalStrength,
        IOR: materialProps.ior || 1.45,
      },
      creator: "Victory Ukpong - VUE 3D Canvas",
    };

    return JSON.stringify(blenderDoc, null, 2);
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
