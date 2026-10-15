/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - .xblend Custom Project Format, Blender Interop & ZIP Bundle Exporter
 * Created by Victory Ukpong
 */

import JSZip from 'jszip';
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
   * Exports project in .xblend + ZIP format:
   * Packages project .xblend, separate texture maps, individual alpha masks, and texture_to_node_mapping.json
   * (Triplanar filter is already applied/baked into the texture images and is omitted from procedural node exports)
   */
  public static async exportProjectBundleZip(
    projectName: string,
    embed3DAssets: boolean,
    model: MeshModelAsset,
    layers: Layer[],
    nodeGraph: { nodes: GraphNode[]; connections: NodeConnection[] },
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
      nodeGraph,
      undoBuffer,
      materialProps
    );
    zip.file(`${cleanProjectName}.xblend`, xblendContent);

    // Folders
    const texturesFolder = zip.folder('textures')!;
    const alphaMasksFolder = zip.folder('alpha_masks')!;

    const textureMappingEntries: any[] = [];

    // 2. Export individual layer textures & alpha masks
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const cleanLayerName = layer.name.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Texture image blob
      const textureDataUrl = layer.canvas.toDataURL('image/png');
      const base64Data = textureDataUrl.split(',')[1];
      const texFileName = `${cleanLayerName}_Texture.png`;
      texturesFolder.file(texFileName, base64Data, { base64: true });

      // Alpha mask generation
      const alphaCanvas = document.createElement('canvas');
      alphaCanvas.width = layer.canvas.width;
      alphaCanvas.height = layer.canvas.height;
      const actx = alphaCanvas.getContext('2d')!;
      actx.drawImage(layer.canvas, 0, 0);

      const imgData = actx.getImageData(0, 0, alphaCanvas.width, alphaCanvas.height);
      const data = imgData.data;
      for (let p = 0; p < data.length; p += 4) {
        const alphaVal = data[p + 3];
        data[p] = alphaVal;     // R
        data[p + 1] = alphaVal; // G
        data[p + 2] = alphaVal; // B
        data[p + 3] = 255;      // Full opaque B&W
      }
      actx.putImageData(imgData, 0, 0);

      const alphaDataUrl = alphaCanvas.toDataURL('image/png');
      const alphaBase64 = alphaDataUrl.split(',')[1];
      const maskFileName = `${cleanLayerName}_AlphaMask.png`;
      alphaMasksFolder.file(maskFileName, alphaBase64, { base64: true });

      // Add to texture-to-node mapping schema
      textureMappingEntries.push({
        layerIndex: i,
        layerId: layer.id,
        layerName: layer.name,
        channel: layer.channel,
        blendMode: layer.blendMode,
        opacity: layer.opacity,
        textureFile: `textures/${texFileName}`,
        alphaMaskFile: `alpha_masks/${maskFileName}`,
        blenderTargetSocket: i === 0 ? 'Base Color' : 'Color',
        colorSpace: 'sRGB',
        maskColorSpace: 'Non-Color',
      });
    }

    // 3. Texture to node mapping JSON
    const mappingDoc = {
      format: "VUE3D_TEXTURE_TO_NODE_MAPPING",
      version: "1.2.0",
      targetApplication: "Blender 2.8+",
      projectName: cleanProjectName,
      materialName: `${cleanProjectName}_Material`,
      textureCount: layers.length,
      principledBSDFConfig: {
        metallic: materialProps.metallic,
        roughness: materialProps.roughness,
        normalStrength: materialProps.normalStrength,
        ior: materialProps.ior || 1.45,
      },
      layers: textureMappingEntries,
      notes: "Triplanar filter is already baked into texture images and omitted from node export as per specification.",
    };
    zip.file('texture_to_node_mapping.json', JSON.stringify(mappingDoc, null, 2));

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
   * Exports a Blender 2.8+ compatible material specification JSON matching the exact
   * data dictionary keys (ShaderNodeTexCoord, ShaderNodeMapping, ShaderNodeValToRGB, etc.)
   */
  public static exportBlenderMaterialSetup(
    materialName: string,
    nodes: GraphNode[],
    connections: NodeConnection[],
    materialProps: any
  ): string {
    const blenderTypeMap: Record<string, string> = {
      tex_coord: 'ShaderNodeTexCoord',
      uv_map: 'ShaderNodeUVMap',
      geometry: 'ShaderNodeNewGeometry',
      rgb: 'ShaderNodeRGB',
      value: 'ShaderNodeValue',
      image_texture: 'ShaderNodeTexImage',
      noise: 'ShaderNodeTexNoise',
      voronoi: 'ShaderNodeTexVoronoi',
      wave: 'ShaderNodeTexWave',
      musgrave: 'ShaderNodeTexMusgrave',
      gradient: 'ShaderNodeTexGradient',
      checker: 'ShaderNodeTexChecker',
      brick: 'ShaderNodeTexBrick',
      mix_rgb: 'ShaderNodeMixRGB',
      invert: 'ShaderNodeInvert',
      color_ramp: 'ShaderNodeValToRGB',
      bright_contrast: 'ShaderNodeBrightContrast',
      hue_saturation: 'ShaderNodeHueSaturation',
      gamma: 'ShaderNodeGamma',
      mapping: 'ShaderNodeMapping',
      vector_math: 'ShaderNodeVectorMath',
      math: 'ShaderNodeMath',
      rgb_to_bw: 'ShaderNodeRGBToBW',
      separate_rgb: 'ShaderNodeSeparateRGB',
      combine_rgb: 'ShaderNodeCombineRGB',
      separate_xyz: 'ShaderNodeSeparateXYZ',
      combine_xyz: 'ShaderNodeCombineXYZ',
      bump: 'ShaderNodeBump',
      normal_map: 'ShaderNodeNormalMap',
      mix_shader: 'ShaderNodeMixShader',
      emission: 'ShaderNodeEmission',
      principled_bsdf: 'ShaderNodeBsdfPrincipled',
      material_output: 'ShaderNodeOutputMaterial',
    };

    const blenderDoc = {
      type: "BLENDER_MATERIAL_SPECIFICATION",
      targetBlenderVersion: "2.80+",
      material_name: materialName || "VUE3D_PBR_Material",
      useNodes: true,
      nodes: nodes.map(n => {
        const bTypeName = blenderTypeMap[n.type] || (n.type.startsWith('ShaderNode') ? n.type : 'ShaderNodeBsdfPrincipled');
        return {
          id: n.id,
          title: n.title,
          blender_type_name: bTypeName,
          location: [n.x, n.y],
          properties: n.properties || {},
          inputs: n.inputs.map(inp => ({
            identifier: inp.id,
            name: inp.name,
            type: inp.type,
            value: inp.value,
          })),
          outputs: n.outputs.map(out => ({
            identifier: out.id,
            name: out.name,
            type: out.type,
          })),
        };
      }),
      links: connections.map(c => ({
        from_node_id: c.fromNodeId,
        from_socket: c.fromSocketId,
        to_node_id: c.toNodeId,
        to_socket: c.toSocketId,
      })),
      principledBSDF: {
        BaseColor: [0.8, 0.8, 0.8, 1.0],
        Metallic: materialProps?.metallic ?? 0.15,
        Roughness: materialProps?.roughness ?? 0.35,
        NormalStrength: materialProps?.normalStrength ?? 1.0,
        IOR: materialProps?.ior ?? 1.45,
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
