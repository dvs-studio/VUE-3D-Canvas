/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Exact Blender 2.8+ / ArmorPaint Shader Node Definitions
 * Created by Victory Ukpong
 */

import { GraphNode, NodeConnection } from '../core/types';

/**
 * Exact Blender 2.8 Principled BSDF Node Definition with all 22 official inputs
 */
export const BLENDER_28_PRINCIPLED_BSDF: GraphNode = {
  id: 'principled_bsdf_1',
  type: 'principled_bsdf',
  title: 'Principled BSDF',
  x: 640,
  y: 60,
  inputs: [
    { id: 'base_color', name: 'Base Color', type: 'color', value: '#d4d4d4' },
    { id: 'subsurface', name: 'Subsurface', type: 'float', value: 0.0 },
    { id: 'subsurface_radius', name: 'Subsurface Radius', type: 'vector', value: [1.0, 0.2, 0.1] },
    { id: 'subsurface_color', name: 'Subsurface Color', type: 'color', value: '#ffffff' },
    { id: 'metallic', name: 'Metallic', type: 'float', value: 0.15 },
    { id: 'specular', name: 'Specular', type: 'float', value: 0.5 },
    { id: 'specular_tint', name: 'Specular Tint', type: 'float', value: 0.0 },
    { id: 'roughness', name: 'Roughness', type: 'float', value: 0.35 },
    { id: 'anisotropic', name: 'Anisotropic', type: 'float', value: 0.0 },
    { id: 'anisotropic_rotation', name: 'Anisotropic Rotation', type: 'float', value: 0.0 },
    { id: 'sheen', name: 'Sheen', type: 'float', value: 0.0 },
    { id: 'sheen_tint', name: 'Sheen Tint', type: 'float', value: 0.5 },
    { id: 'clearcoat', name: 'Clearcoat', type: 'float', value: 0.0 },
    { id: 'clearcoat_roughness', name: 'Clearcoat Roughness', type: 'float', value: 0.03 },
    { id: 'ior', name: 'IOR', type: 'float', value: 1.45 },
    { id: 'transmission', name: 'Transmission', type: 'float', value: 0.0 },
    { id: 'transmission_roughness', name: 'Transmission Roughness', type: 'float', value: 0.0 },
    { id: 'emission', name: 'Emission', type: 'color', value: '#000000' },
    { id: 'alpha', name: 'Alpha', type: 'float', value: 1.0 },
    { id: 'normal', name: 'Normal', type: 'vector' },
    { id: 'clearcoat_normal', name: 'Clearcoat Normal', type: 'vector' },
    { id: 'tangent', name: 'Tangent', type: 'vector' },
  ],
  outputs: [
    { id: 'bsdf', name: 'BSDF', type: 'color' },
  ],
  properties: {
    metallic: 0.15,
    roughness: 0.35,
    ior: 1.45,
  },
};

export const BLENDER_28_MATERIAL_OUTPUT: GraphNode = {
  id: 'material_output_1',
  type: 'material_output',
  title: 'Material Output',
  x: 980,
  y: 80,
  inputs: [
    { id: 'surface', name: 'Surface', type: 'color' },
    { id: 'volume', name: 'Volume', type: 'color' },
    { id: 'displacement', name: 'Displacement', type: 'vector' },
  ],
  outputs: [],
  properties: { target: 'All' },
};

/**
 * Creates any ArmorPaint / Blender 2.8+ Shader Node template
 */
export function createShaderNode(type: string, id: string, x = 120, y = 120): GraphNode {
  switch (type) {
    case 'mapping':
      return {
        id,
        type: 'mapping' as any,
        title: 'Vector Mapping',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
          { id: 'location', name: 'Location', type: 'vector', value: [0, 0, 0] },
          { id: 'rotation', name: 'Rotation', type: 'vector', value: [0, 0, 0] },
          { id: 'scale', name: 'Scale', type: 'vector', value: [1, 1, 1] },
        ],
        outputs: [
          { id: 'vector_out', name: 'Vector', type: 'vector' },
        ],
        properties: {
          vector_type: 'Point',
          locX: 0, locY: 0, locZ: 0,
          rotX: 0, rotY: 0, rotZ: 0,
          scaleX: 1, scaleY: 1, scaleZ: 1,
        },
      };

    case 'color_ramp':
      return {
        id,
        type: 'color_ramp' as any,
        title: 'ColorRamp',
        x,
        y,
        inputs: [
          { id: 'fac', name: 'Fac', type: 'float', value: 0.5 },
        ],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
          { id: 'alpha', name: 'Alpha', type: 'float' },
        ],
        properties: {
          interpolation: 'Linear',
          stops: [
            { pos: 0.0, color: '#000000' },
            { pos: 1.0, color: '#ffffff' },
          ],
        },
      };

    case 'mix_rgb':
      return {
        id,
        type: 'mix_rgb' as any,
        title: 'Mix RGB',
        x,
        y,
        inputs: [
          { id: 'fac', name: 'Fac', type: 'float', value: 0.5 },
          { id: 'color1', name: 'Color1', type: 'color', value: '#ffffff' },
          { id: 'color2', name: 'Color2', type: 'color', value: '#3d7fb8' },
        ],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
        ],
        properties: {
          blend_mode: 'Mix',
          fac: 0.5,
        },
      };

    case 'math':
      return {
        id,
        type: 'math' as any,
        title: 'Math',
        x,
        y,
        inputs: [
          { id: 'val1', name: 'Value', type: 'float', value: 0.5 },
          { id: 'val2', name: 'Value', type: 'float', value: 0.5 },
        ],
        outputs: [
          { id: 'val_out', name: 'Value', type: 'float' },
        ],
        properties: {
          operation: 'Multiply',
        },
      };

    case 'vector_math':
      return {
        id,
        type: 'vector_math' as any,
        title: 'Vector Math',
        x,
        y,
        inputs: [
          { id: 'vec1', name: 'Vector', type: 'vector', value: [1, 1, 1] },
          { id: 'vec2', name: 'Vector', type: 'vector', value: [1, 1, 1] },
        ],
        outputs: [
          { id: 'vec_out', name: 'Vector', type: 'vector' },
          { id: 'val_out', name: 'Value', type: 'float' },
        ],
        properties: {
          operation: 'Add',
        },
      };

    case 'invert':
      return {
        id,
        type: 'invert' as any,
        title: 'Invert',
        x,
        y,
        inputs: [
          { id: 'fac', name: 'Fac', type: 'float', value: 1.0 },
          { id: 'color', name: 'Color', type: 'color', value: '#ffffff' },
        ],
        outputs: [
          { id: 'color_out', name: 'Color', type: 'color' },
        ],
        properties: {},
      };

    case 'separate_rgb':
      return {
        id,
        type: 'separate_rgb' as any,
        title: 'Separate RGB',
        x,
        y,
        inputs: [
          { id: 'image', name: 'Image', type: 'color', value: '#ffffff' },
        ],
        outputs: [
          { id: 'r', name: 'R', type: 'float' },
          { id: 'g', name: 'G', type: 'float' },
          { id: 'b', name: 'B', type: 'float' },
        ],
        properties: {},
      };

    case 'combine_rgb':
      return {
        id,
        type: 'combine_rgb' as any,
        title: 'Combine RGB',
        x,
        y,
        inputs: [
          { id: 'r', name: 'R', type: 'float', value: 1.0 },
          { id: 'g', name: 'G', type: 'float', value: 1.0 },
          { id: 'b', name: 'B', type: 'float', value: 1.0 },
        ],
        outputs: [
          { id: 'image', name: 'Image', type: 'color' },
        ],
        properties: {},
      };

    case 'bump':
      return {
        id,
        type: 'bump' as any,
        title: 'Bump',
        x,
        y,
        inputs: [
          { id: 'strength', name: 'Strength', type: 'float', value: 1.0 },
          { id: 'distance', name: 'Distance', type: 'float', value: 1.0 },
          { id: 'height', name: 'Height', type: 'float', value: 0.5 },
          { id: 'normal', name: 'Normal', type: 'vector' },
        ],
        outputs: [
          { id: 'normal_out', name: 'Normal', type: 'vector' },
        ],
        properties: { strength: 1.0, distance: 1.0 },
      };

    case 'normal_map':
      return {
        id,
        type: 'normal_map' as any,
        title: 'Normal Map',
        x,
        y,
        inputs: [
          { id: 'strength', name: 'Strength', type: 'float', value: 1.0 },
          { id: 'color', name: 'Color', type: 'color', value: '#8080ff' },
        ],
        outputs: [
          { id: 'normal_out', name: 'Normal', type: 'vector' },
        ],
        properties: { strength: 1.0 },
      };

    case 'noise':
      return {
        id,
        type: 'noise' as any,
        title: 'Noise Texture',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
          { id: 'scale', name: 'Scale', type: 'float', value: 5.0 },
          { id: 'detail', name: 'Detail', type: 'float', value: 2.0 },
          { id: 'roughness', name: 'Roughness', type: 'float', value: 0.5 },
          { id: 'distortion', name: 'Distortion', type: 'float', value: 0.0 },
        ],
        outputs: [
          { id: 'fac', name: 'Fac', type: 'float' },
          { id: 'color', name: 'Color', type: 'color' },
        ],
        properties: { scale: 5.0, detail: 2.0, roughness: 0.5, distortion: 0.0 },
      };

    case 'voronoi':
      return {
        id,
        type: 'voronoi' as any,
        title: 'Voronoi Texture',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
          { id: 'scale', name: 'Scale', type: 'float', value: 5.0 },
          { id: 'randomness', name: 'Randomness', type: 'float', value: 1.0 },
        ],
        outputs: [
          { id: 'distance', name: 'Distance', type: 'float' },
          { id: 'color', name: 'Color', type: 'color' },
        ],
        properties: { scale: 5.0, feature: 'F1' },
      };

    case 'musgrave':
      return {
        id,
        type: 'musgrave' as any,
        title: 'Musgrave Texture',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
          { id: 'scale', name: 'Scale', type: 'float', value: 4.0 },
          { id: 'detail', name: 'Detail', type: 'float', value: 2.5 },
          { id: 'dimension', name: 'Dimension', type: 'float', value: 2.0 },
        ],
        outputs: [
          { id: 'fac', name: 'Fac', type: 'float' },
        ],
        properties: { scale: 4.0, detail: 2.5 },
      };

    case 'wave':
      return {
        id,
        type: 'wave' as any,
        title: 'Wave Texture',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
          { id: 'scale', name: 'Scale', type: 'float', value: 5.0 },
          { id: 'distortion', name: 'Distortion', type: 'float', value: 1.0 },
        ],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
          { id: 'fac', name: 'Fac', type: 'float' },
        ],
        properties: { wave_type: 'Bands', scale: 5.0 },
      };

    case 'checker':
      return {
        id,
        type: 'checker' as any,
        title: 'Checker Texture',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
          { id: 'color1', name: 'Color1', type: 'color', value: '#ffffff' },
          { id: 'color2', name: 'Color2', type: 'color', value: '#000000' },
          { id: 'scale', name: 'Scale', type: 'float', value: 8.0 },
        ],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
          { id: 'fac', name: 'Fac', type: 'float' },
        ],
        properties: { scale: 8.0 },
      };

    case 'brick':
      return {
        id,
        type: 'brick' as any,
        title: 'Brick Texture',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
          { id: 'color1', name: 'Color1', type: 'color', value: '#8b3a1a' },
          { id: 'color2', name: 'Color2', type: 'color', value: '#552211' },
          { id: 'mortar', name: 'Mortar', type: 'color', value: '#d4d4d4' },
          { id: 'scale', name: 'Scale', type: 'float', value: 6.0 },
        ],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
          { id: 'fac', name: 'Fac', type: 'float' },
        ],
        properties: { scale: 6.0 },
      };

    case 'tex_coord':
      return {
        id,
        type: 'tex_coord' as any,
        title: 'Texture Coordinate',
        x,
        y,
        inputs: [],
        outputs: [
          { id: 'generated', name: 'Generated', type: 'vector' },
          { id: 'normal', name: 'Normal', type: 'vector' },
          { id: 'uv', name: 'UV', type: 'vector' },
          { id: 'object', name: 'Object', type: 'vector' },
          { id: 'camera', name: 'Camera', type: 'vector' },
          { id: 'window', name: 'Window', type: 'vector' },
          { id: 'reflection', name: 'Reflection', type: 'vector' },
        ],
        properties: {},
      };

    case 'image_texture':
      return {
        id,
        type: 'image_texture' as any,
        title: 'Image Texture',
        x,
        y,
        inputs: [
          { id: 'vector', name: 'Vector', type: 'vector' },
        ],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
          { id: 'alpha', name: 'Alpha', type: 'float' },
        ],
        properties: {
          image_name: 'Base_Color.png',
          color_space: 'sRGB',
        },
      };

    case 'rgb':
      return {
        id,
        type: 'rgb' as any,
        title: 'RGB Constant',
        x,
        y,
        inputs: [],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
        ],
        properties: { color: '#e6a15c' },
      };

    case 'value':
      return {
        id,
        type: 'value' as any,
        title: 'Value Constant',
        x,
        y,
        inputs: [],
        outputs: [
          { id: 'val', name: 'Value', type: 'float' },
        ],
        properties: { value: 1.0 },
      };

    default:
      return {
        id,
        type: type as any,
        title: type.toUpperCase(),
        x,
        y,
        inputs: [{ id: 'in', name: 'Input', type: 'color' }],
        outputs: [{ id: 'out', name: 'Output', type: 'color' }],
        properties: {},
      };
  }
}

export const BLENDER_28_INITIAL_NODES: GraphNode[] = [
  createShaderNode('tex_coord', 'tex_coord_1', 30, 100),
  createShaderNode('mapping', 'mapping_1', 200, 100),
  createShaderNode('noise', 'noise_1', 370, 80),
  createShaderNode('color_ramp', 'color_ramp_1', 480, 240),
  BLENDER_28_PRINCIPLED_BSDF,
  BLENDER_28_MATERIAL_OUTPUT,
];

export const BLENDER_28_INITIAL_CONNECTIONS: NodeConnection[] = [
  {
    id: 'conn_1',
    fromNodeId: 'tex_coord_1',
    fromSocketId: 'uv',
    toNodeId: 'mapping_1',
    toSocketId: 'vector',
  },
  {
    id: 'conn_2',
    fromNodeId: 'mapping_1',
    fromSocketId: 'vector_out',
    toNodeId: 'noise_1',
    toSocketId: 'vector',
  },
  {
    id: 'conn_3',
    fromNodeId: 'noise_1',
    fromSocketId: 'fac',
    toNodeId: 'color_ramp_1',
    toSocketId: 'fac',
  },
  {
    id: 'conn_4',
    fromNodeId: 'color_ramp_1',
    fromSocketId: 'color',
    toNodeId: 'principled_bsdf_1',
    toSocketId: 'base_color',
  },
  {
    id: 'conn_5',
    fromNodeId: 'principled_bsdf_1',
    fromSocketId: 'bsdf',
    toNodeId: 'material_output_1',
    toSocketId: 'surface',
  },
];
