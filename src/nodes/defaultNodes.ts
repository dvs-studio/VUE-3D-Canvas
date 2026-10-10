/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Procedural Nodes Setup (Blender 2.79 / 2.83 LTS Style)
 * Created by Victory Ukpong
 */

import { GraphNode, NodeConnection } from '../core/types';

export const INITIAL_NODES: GraphNode[] = [
  {
    id: 'tex_coord_1',
    type: 'tex_coord',
    title: 'Texture Coordinate',
    x: 40,
    y: 80,
    inputs: [],
    outputs: [
      { id: 'uv', name: 'UV', type: 'vector' },
      { id: 'generated', name: 'Generated', type: 'vector' },
      { id: 'normal', name: 'Normal', type: 'vector' },
    ],
    properties: {},
  },
  {
    id: 'noise_1',
    type: 'noise',
    title: 'Noise Texture',
    x: 280,
    y: 60,
    inputs: [
      { id: 'vector', name: 'Vector', type: 'vector' },
      { id: 'scale', name: 'Scale', type: 'float', value: 8.5 },
      { id: 'detail', name: 'Detail', type: 'float', value: 3.0 },
      { id: 'roughness', name: 'Roughness', type: 'float', value: 0.5 },
    ],
    outputs: [
      { id: 'fac', name: 'Fac', type: 'float' },
      { id: 'color', name: 'Color', type: 'color' },
    ],
    properties: { scale: 8.5, detail: 3.0, roughness: 0.5 },
  },
  {
    id: 'color_ramp_1',
    type: 'color_ramp',
    title: 'ColorRamp',
    x: 520,
    y: 70,
    inputs: [
      { id: 'fac', name: 'Fac', type: 'float' },
    ],
    outputs: [
      { id: 'color', name: 'Color', type: 'color' },
      { id: 'alpha', name: 'Alpha', type: 'float' },
    ],
    properties: {
      color1: '#2c3e50',
      pos1: 0.2,
      color2: '#e74c3c',
      pos2: 0.8,
    },
  },
  {
    id: 'principled_1',
    type: 'principled_bsdf',
    title: 'Principled BSDF',
    x: 760,
    y: 50,
    inputs: [
      { id: 'base_color', name: 'Base Color', type: 'color', value: '#d4d4d4' },
      { id: 'metallic', name: 'Metallic', type: 'float', value: 0.15 },
      { id: 'roughness', name: 'Roughness', type: 'float', value: 0.35 },
      { id: 'normal', name: 'Normal', type: 'vector' },
    ],
    outputs: [
      { id: 'bsdf', name: 'BSDF', type: 'color' },
    ],
    properties: {
      metallic: 0.15,
      roughness: 0.35,
    },
  },
  {
    id: 'mat_output_1',
    type: 'material_output',
    title: 'Material Output',
    x: 1000,
    y: 80,
    inputs: [
      { id: 'surface', name: 'Surface', type: 'color' },
      { id: 'displacement', name: 'Displacement', type: 'vector' },
    ],
    outputs: [],
    properties: {},
  },
];

export const INITIAL_CONNECTIONS: NodeConnection[] = [
  {
    id: 'c1',
    fromNodeId: 'tex_coord_1',
    fromSocketId: 'uv',
    toNodeId: 'noise_1',
    toSocketId: 'vector',
  },
  {
    id: 'c2',
    fromNodeId: 'noise_1',
    fromSocketId: 'fac',
    toNodeId: 'color_ramp_1',
    toSocketId: 'fac',
  },
  {
    id: 'c3',
    fromNodeId: 'color_ramp_1',
    fromSocketId: 'color',
    toNodeId: 'principled_1',
    toSocketId: 'base_color',
  },
  {
    id: 'c4',
    fromNodeId: 'principled_1',
    fromSocketId: 'bsdf',
    toNodeId: 'mat_output_1',
    toSocketId: 'surface',
  },
];
