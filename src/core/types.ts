/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Core Type Definitions
 * Created by Victory Ukpong
 */

export type ToolType = 
  | 'brush'
  | 'mask_brush'
  | 'eraser'
  | 'blur'
  | 'clone'
  | 'smudge'
  | 'pen'
  | 'pattern_stamp'
  | 'marquee_rect'
  | 'marquee_ellipse'
  | 'lasso'
  | 'polygon_lasso'
  | 'bucket'
  | 'gradient_linear'
  | 'gradient_radial'
  | 'triplanar'
  | 'stamp_decal'
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

export type SurfaceShadingMode = 'default' | 'smooth' | 'flat';

export interface LayerPBRSettings {
  roughness: number; // 0.0 to 1.0
  metallic: number; // 0.0 to 1.0
  bumpHeight: number; // 0.0 to 2.0
  normalStrength: number; // 0.0 to 2.0
  emissionStrength: number; // 0.0 to 10.0
  emissionColor?: string;
  opacity: number; // 0.0 to 1.0
  // Bump & Color Toggle: allow bump to be enabled while colors are disabled
  enableColor: boolean; // default true
  enableBump: boolean; // default true
  // Reflection driver: HDRI vs Matcap
  reflectionSource: 'hdri' | 'matcap';
  reflectionIntensity: number; // 0.0 to 2.0
  matcapPreset?: 'chrome' | 'ceramic' | 'clay' | 'pearl' | 'gold' | 'custom';
  customMatcapUrl?: string;
  // Node editor integration
  customNodeTreeActive?: boolean;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0 - 100
  blendMode: BlendMode;
  locked: boolean;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  channel: 'color' | 'roughness' | 'metallic' | 'normal' | 'height' | 'emission';
  groupId?: string;
  isGroup?: boolean;
  collapsed?: boolean;
  pbrSettings?: LayerPBRSettings;
}

export interface BloomSettings {
  enabled: boolean;
  strength: number;
  radius: number;
  threshold: number;
}

export type BrushStrokeType = 'space' | 'airbrush' | 'dot' | 'dragged-dot' | 'curve';

export type BrushMaskType = 
  | 'none' 
  | 'grunge' 
  | 'splat' 
  | 'scratch' 
  | 'dots' 
  | 'noise' 
  | 'canvas' 
  | 'cracks'
  | 'hex_grid'
  | 'camo'
  | 'veins'
  | string;

export type BrushPatternType = 
  | 'none' 
  | 'checker' 
  | 'carbon' 
  | 'halftone' 
  | 'diagonal' 
  | 'leather' 
  | 'wood' 
  | 'weave'
  | 'hex_mesh'
  | 'marble'
  | string;

export type StencilApplicationMode = 'spacing' | 'grid' | 'random' | 'triplanar';

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
  // Brush Type (Stroke method) vs Brush Settings
  strokeType?: BrushStrokeType;
  
  // Stencil Mask & Sub-Settings
  maskType?: BrushMaskType;
  maskScale?: number;
  stencilMode?: StencilApplicationMode;
  stencilAngle?: number;
  stencilAngleJitter?: number;
  stencilContrast?: number;
  stencilInvert?: boolean;
  stencilUrl?: string;

  // Pattern & Sub-Settings
  patternType?: BrushPatternType;
  patternScale?: number;
  patternBlend?: 'multiply' | 'overlay' | 'hard_light' | 'screen' | 'normal';
  patternAngle?: number;
  patternOffsetJitter?: number;
  patternDepth?: number;
  patternInvert?: boolean;

  // Stylus / Pen Tablet (Wintab / Windows Ink) Dynamics
  pressureSize?: boolean;
  minSizePercent?: number; // e.g. 15%
  pressureOpacity?: boolean;
  minOpacityPercent?: number; // e.g. 10%
  tiltDynamics?: boolean; // stylus angle/tiltX/tiltY influence
  twistDynamics?: boolean; // stylus barrel rotation
  startTaperPercent?: number; // 0% - 50% stroke start taper
  endTaperPercent?: number; // 0% - 50% stroke end taper
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
  type: 'rect' | 'ellipse' | 'polygon' | 'lasso' | 'brush' | 'bitmap';
  points: { x: number; y: number }[];
  bounds: { x: number; y: number; width: number; height: number };
  inverted: boolean;
  maskCanvas?: HTMLCanvasElement;
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
  type: 'color' | 'float' | 'vector' | 'shader';
  value?: any;
}

export type ShaderNodeType =
  | 'noise'
  | 'voronoi'
  | 'musgrave'
  | 'wave'
  | 'brick'
  | 'checker'
  | 'mapping'
  | 'vector_transform'
  | 'color_ramp'
  | 'mix_rgb'
  | 'math'
  | 'vector_math'
  | 'invert'
  | 'separate_rgb'
  | 'combine_rgb'
  | 'bump'
  | 'normal_map'
  | 'tex_coord'
  | 'uv_map'
  | 'image_texture'
  | 'rgb'
  | 'value'
  | 'principled_bsdf'
  | 'emission'
  | 'material_output';

export interface GraphNode {
  id: string;
  type: ShaderNodeType;
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

export type ThemeMode = 'cs5' | 'bw78' | 'modern' | 'ps2022';

export interface HDRISettings {
  enabled: boolean;
  preset: 'studio' | 'sunset' | 'cyberpunk' | 'outdoor' | 'custom';
  customUrl?: string;
  lightViewport: boolean; // Checkbox to light main viewport vs reflections only
  blurredBackground: boolean;
  backgroundBlur: number; // 0.0 to 1.0
  intensity: number; // 0.1 to 3.0
  roughnessFilter: number; // 0.0 to 1.0
}

export interface TriplanarTextureItem {
  id: string;
  name: string;
  dataUrl?: string;
  isTransparentBlank?: boolean; // Blank alpha support for smooth blend with underlying surface
  opacity?: number; // 0 - 100
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  tintColor?: string;
}

export interface TriplanarConfig {
  pattern?: 'checker' | 'noise' | 'carbon_fiber' | 'brushed_metal' | 'grid' | 'cellular';
  scale: number;
  blendSharpness: number;
  primaryColor: string;
  secondaryColor: string;
  coordinateSpace?: 'object' | 'world';
  // Multi-texture image mixer
  textures?: TriplanarTextureItem[];
  mixerPattern?: 'clouds' | 'fractal_noise' | 'cellular' | 'checker' | 'grid' | 'carbon_fiber' | 'brushed_metal';
  mixerScale?: number;
  mixingValue?: number; // 0.0 to 1.0
  edgeNoiseValue?: number; // 0.0 to 1.0
  bleedingValue?: number; // 0.0 to 1.0
  tilingRandomization?: number; // 0.0 to 1.0
  // Slope mask
  enableSlopeMask?: boolean;
  slopeThreshold?: number; // 0.0 to 1.0
  slopeSmoothing?: number; // 0.01 to 0.5
  slopeStrength?: number; // 0.0 to 1.0
  slopeInvert?: boolean;
  slopeUpAxis?: 'Y+' | 'Z+' | 'X+';
  // Altitude mask
  enableAltitudeMask?: boolean;
  altitudeLower?: number; // -1.0 to 1.0
  altitudeUpper?: number; // -1.0 to 1.0
  altitudeSmoothing?: number; // 0.01 to 0.5
  altitudeStrength?: number; // 0.0 to 1.0
  altitudeInvert?: boolean;
  // Height-aware blending
  heightAwareBlending?: boolean;
  heightContrast?: number; // 0.1 to 2.0
  // Global offsets
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
}

export interface PatternStampConfig {
  stampId: string;
  stampName: string;
  stampDataUrl: string;
  size: number; // Stamp radius in pixels
  rotation: number; // In degrees
  opacity: number; // 0 - 100
  // Imperfections and edge sharpness
  sharpness: number; // 0.0 to 1.0
  missingEdgeAmount: number; // 0.0 to 1.0 (torn/chipped mask)
  edgeJitter: number; // 0.0 to 1.0
  // Grunge Overlay
  enableGrungeOverlay: boolean;
  grungePreset: 'scratched' | 'dirty_spots' | 'cracked_paint' | 'worn_patina' | 'custom';
  customGrungeUrl?: string;
  grungeBlendMode: BlendMode;
  grungeOpacity: number; // 0 - 100
  grungeScale: number;
}

export interface EdgeWearConfig {
  wearAmount: number; // 0.0 to 1.0
  contrast: number; // 0.5 to 3.0
  edgeNoise: number; // 0.0 to 1.0
  cavityDarkening: number; // 0.0 to 1.0 (ambient occlusion crevices)
  curvatureRadius: number; // 1 to 10
  wearColor: string; // e.g. bare metal #8f8f8f or dirt #2b1f14
  wearTextureUrl?: string;
  blendMode: BlendMode;
  applyToCavity: boolean;
  applyToRidges: boolean;
}

