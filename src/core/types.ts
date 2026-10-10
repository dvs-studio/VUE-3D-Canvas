/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Core Type Definitions
 * Created by Victory Ukpong
 */

export type ToolType = 
  | 'brush'
  | 'eraser'
  | 'blur'
  | 'clone'
  | 'smudge'
  | 'pen'
  | 'marquee_rect'
  | 'marquee_ellipse'
  | 'lasso'
  | 'polygon_lasso'
  | 'bucket'
  | 'gradient_linear'
  | 'gradient_radial'
  | 'triplanar'
  | 'eyedropper'
  | 'hand'
  | 'zoom';

export type BlendMode = 
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'hard_light'
  | 'soft_light'
  | 'difference';

export type ViewportShadingMode =
  | 'material'
  | 'flat'
  | 'normal'
  | 'wireframe'
  | 'clay'
  | 'uv_check';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0 - 100
  blendMode: BlendMode;
  locked: boolean;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  channel: 'color' | 'roughness' | 'metallic' | 'normal' | 'height';
}

export interface BrushPreset {
  id: string;
  name: string;
  category: 'Standard' | 'Inking' | 'Textures' | 'Organic' | 'Hard Surface' | 'VFX';
  size: number;
  opacity: number;
  flow: number;
  hardness: number;
  spacing: number; // 1 - 200%
  scatter: number; // 0 - 100%
  stabilizer: number; // 0 - 100% (Medibang lazy mouse)
  color: string;
  tipShape?: 'round' | 'flat' | 'grunge' | 'hex' | 'grain' | 'calligraphy';
}

export interface VectorPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface VectorPath {
  id: string;
  points: VectorPoint[];
  closed: boolean;
}

export interface SelectionMask {
  active: boolean;
  type: 'rect' | 'ellipse' | 'polygon' | 'lasso';
  points: { x: number; y: number }[];
  bounds: { x: number; y: number; width: number; height: number };
  inverted: boolean;
}

export interface UndoSnapshot {
  id: string;
  timestamp: number;
  description: string;
  layerData: {
    id: string;
    imageData: ImageData;
  }[];
}

export interface NodeSocket {
  id: string;
  name: string;
  type: 'color' | 'float' | 'vector';
  value?: any;
}

export interface GraphNode {
  id: string;
  type: 
    | 'noise'
    | 'voronoi'
    | 'brick'
    | 'checker'
    | 'color_ramp'
    | 'mix_rgb'
    | 'math'
    | 'tex_coord'
    | 'principled_bsdf'
    | 'material_output';
  title: string;
  x: number;
  y: number;
  inputs: NodeSocket[];
  outputs: NodeSocket[];
  properties: Record<string, any>;
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  fromSocketId: string;
  toNodeId: string;
  toSocketId: string;
}

export interface MeshModelAsset {
  id: string;
  name: string;
  source: 'primitive' | 'file';
  linked: boolean; // default true as per .xblend specification
  filePath: string;
  fileSizeEstimate: string;
  vertexCount: number;
  triangleCount: number;
  embeddedGeometryData?: string; // base64 / json if embed3DAssets is true
}

export interface XBlendProject {
  formatVersion: '1.2.0';
  application: 'VUE 3D Canvas';
  author: 'Victory Ukpong';
  projectName: string;
  embed3DAssets: boolean;
  model: MeshModelAsset;
  layers: {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    blendMode: BlendMode;
    locked: boolean;
    channel: string;
    dataUrl: string; // PNG encoded layer
  }[];
  nodeGraph: {
    nodes: GraphNode[];
    connections: NodeConnection[];
  };
  undoRingBuffer: {
    maxStates: 3;
    states: {
      id: string;
      timestamp: number;
      description: string;
      dataUrls: Record<string, string>;
    }[];
  };
  materialProperties: {
    metallic: number;
    roughness: number;
    normalStrength: number;
    clearcoat: number;
    ior: number;
  };
  createdDate: string;
  savedDate: string;
}

export interface ProjectionState {
  isActive: boolean;
  isNavLocked: boolean;
  screenshotDataUrl: string | null;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraFov: number;
  isOrtho: boolean;
  width: number;
  height: number;
}
