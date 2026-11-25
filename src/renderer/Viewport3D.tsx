/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Main 3D Viewport with Blender 2.8+ Navigation & Surface Painting
 * Created by Victory Ukpong
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { applyHeightLevels } from '../tools/heightLevels';
import { 
  ToolType, 
  BrushPreset, 
  Layer,
  BaseLayerSettings,
  ViewportShadingMode,
  SelectionMask,
  HDRISettings,
  ThemeMode,
  BloomSettings,
  PatternStampConfig,
  GizmoStyle,
} from '../core/types';
import { BrushEngine } from '../tools/brushEngine';
import { getUVIslandIds } from '../tools/uvIslandMap';
import { buildUVIslandClipPath } from '../tools/uvIslandClip';
import { PatternStampEngine } from '../tools/patternStampTool';
import { SelectionTool } from '../tools/selectionTool';
import { SymmetryConfig, SymmetryEngine, SymmetryAxis } from '../tools/symmetryEngine';
import { MaskEngine } from '../tools/maskEngine';
import { HDRIManager, HDRIPreset } from './hdriManager';
import { UndoRingBuffer } from '../core/history';
import { BoxGizmo } from './boxGizmo';
import { FillSuite } from '../tools/fillSuite';

function drawingRatio(w: number, h: number): number {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const budget = 1920 * 1080 * 1.25;
  if (w * h * dpr * dpr <= budget) return dpr;
  return Math.max(1, Math.sqrt(budget / Math.max(1, w * h)));
}
import { BUILTIN_MODELS, parseOBJ } from './modelGeometry';
import { applyFreeCamera, gizmoAngles, quatFromSpherical, tumbleFreeCamera } from './freeCamera';
import { SurfaceShadingEngine, SurfaceShadingType } from './surfaceShading';
import { LayoutGrid, Sun, Sparkles, Sliders, Image, Check, Zap, Compass } from 'lucide-react';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface Viewport3DProps {
  layers: Layer[];
  baseLayerSettings: BaseLayerSettings;
  activeLayerId: string;
  activeTool: ToolType;
  brush: BrushPreset;
  modelKey: string;
  customOBJText?: string;
  shadingMode: ViewportShadingMode;
  materialProps: { metallic: number; roughness: number; normalStrength: number };
  undoBuffer: UndoRingBuffer;
  onTextureUpdated: () => void;
  onColorSampled?: (hex: string) => void;
  isOrtho: boolean;
  onToggleOrtho: () => void;
  zoomFactor: number;
  onZoomChange?: (z: number) => void;
  touchNavEnabled: boolean;
  onToggleTouchNav: () => void;
  compositeCanvas?: HTMLCanvasElement;
  textureVersion?: number;
  onCompositeCanvasReady?: (canvas: HTMLCanvasElement) => void;
  showGizmo?: boolean;
  viewLayout?: 'perspective' | 'quad';
  onSelectViewLayout?: (layout: 'perspective' | 'quad') => void;
  surfaceMode?: 'default' | 'smooth' | 'flat' | 'hard';
  meshComponentVisibility?: string;
  hiddenMeshComponents?: string[];
  isolateSelectedGroupOnly?: boolean;
  frameMeshComponentTrigger?: { id: string; timestamp: number } | null;
  isSymmetryX?: boolean;
  selectionMask?: SelectionMask | null;
  onUpdateSelectionMask?: (mask: SelectionMask | null) => void;
  symmetryConfig?: SymmetryConfig;
  hdriSettings?: HDRISettings;
  onUpdateHDRISettings?: (settings: Partial<HDRISettings>) => void;
  bloomSettings?: BloomSettings;
  onUpdateBloomSettings?: (settings: Partial<BloomSettings>) => void;
  currentTheme?: ThemeMode;
  patternStampConfig?: PatternStampConfig;
  geometry?: THREE.BufferGeometry;
  onGeometryUpdated?: () => void;
  activeUVChannel?: string;
  uvGeometryVersion?: number;
  isXRayBrushActive?: boolean;
  onToggleXRayBrush?: () => void;
  selectedVertices?: Set<number>;
  onUpdateSelectedVertices?: (verts: Set<number>) => void;
  gizmoStyle?: GizmoStyle;
  gizmoSizePercent?: number;
  constantRefresh?: boolean;
  navSensitivity?: number;
  refreshRateMode?: 'on_demand' | '30' | '60' | '120' | 'custom' | 'uncapped';
  customRefreshRate?: number;
  viewSnapTrigger?: { view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom'; timestamp: number } | null;
}

function createMatcapPresetTexture(preset: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const palettes: Record<string, [string, string, string, string]> = {
    chrome: ['#080d18', '#d9e5f4', '#343f52', '#f8fbff'], ceramic: ['#302d31', '#f6eee4', '#a69b91', '#fffaf2'],
    clay: ['#211b18', '#d7a58a', '#805b4b', '#f3c5a8'], pearl: ['#24243a', '#f3e9f5', '#b7a9c7', '#ffffff'],
    gold: ['#241609', '#f8d77b', '#9c681d', '#fff1b3'],
  };
  const [dark, light, mid, highlight] = palettes[preset] || palettes.chrome;
  const bg = ctx.createLinearGradient(0, 0, 256, 256);
  bg.addColorStop(0, dark); bg.addColorStop(0.28, light); bg.addColorStop(0.52, mid); bg.addColorStop(0.72, dark); bg.addColorStop(1, highlight);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 256);
  const glow = ctx.createRadialGradient(82, 62, 4, 112, 100, 170);
  glow.addColorStop(0, highlight); glow.addColorStop(0.18, light); glow.addColorStop(0.5, 'rgba(255,255,255,0.12)'); glow.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = glow; ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true; return texture;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  layers,
  baseLayerSettings,
  activeLayerId,
  activeTool,
  brush,
  modelKey,
  customOBJText,
  shadingMode,
  materialProps,
  undoBuffer,
  onTextureUpdated,
  onColorSampled,
  isOrtho,
  onToggleOrtho,
  zoomFactor,
  onZoomChange,
  touchNavEnabled,
  onToggleTouchNav,
  compositeCanvas,
  textureVersion,
  onCompositeCanvasReady,
  showGizmo = true,
  viewLayout: controlledViewLayout,
  onSelectViewLayout,
  surfaceMode = 'default',
  meshComponentVisibility = 'all',
  hiddenMeshComponents = [],
  isolateSelectedGroupOnly = false,
  frameMeshComponentTrigger = null,
  isSymmetryX = false,
  selectionMask = null,
  onUpdateSelectionMask,
  symmetryConfig,
  hdriSettings: controlledHdriSettings,
  onUpdateHDRISettings,
  bloomSettings: controlledBloomSettings,
  onUpdateBloomSettings,
  currentTheme = 'cs5',
  patternStampConfig,
  geometry,
  onGeometryUpdated,
  activeUVChannel,
  uvGeometryVersion = 0,
  isXRayBrushActive = false,
  onToggleXRayBrush,
  selectedVertices,
  onUpdateSelectedVertices,
  gizmoStyle = 'box',
  gizmoSizePercent = 100,
  constantRefresh = false,
  navSensitivity = 1.0,
  refreshRateMode = 'on_demand',
  customRefreshRate = 60,
  viewSnapTrigger = null,
}) => {
  const [internalViewLayout, setInternalViewLayout] = useState<'perspective' | 'quad'>('perspective');
  const viewLayout = controlledViewLayout || internalViewLayout;
  const viewLayoutRef = useRef<'perspective' | 'quad'>(viewLayout);
  viewLayoutRef.current = viewLayout;

  const isOrthoRef = useRef<boolean>(isOrtho);
  isOrthoRef.current = isOrtho;

  const constantRefreshRef = useRef<boolean>(constantRefresh);
  constantRefreshRef.current = constantRefresh;

  const refreshRateModeRef = useRef<'on_demand' | '30' | '60' | '120' | 'custom' | 'uncapped'>(refreshRateMode);
  refreshRateModeRef.current = refreshRateMode;

  const customRefreshRateRef = useRef<number>(customRefreshRate || 60);
  customRefreshRateRef.current = customRefreshRate || 60;

  const needsRenderRef = useRef<boolean>(true);

  const [zoomPulseTrigger, setZoomPulseTrigger] = useState(0);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tetherCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraPerspRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraOrthoRef = useRef<THREE.OrthographicCamera | null>(null);
  const quadCamerasRef = useRef<{
    top: THREE.OrthographicCamera;
    front: THREE.OrthographicCamera;
    right: THREE.OrthographicCamera;
  } | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const xrayPointsRef = useRef<THREE.Points | null>(null);
  const [internalSelectedVerts, setInternalSelectedVerts] = useState<Set<number>>(new Set());
  const activeSelectedVerts = selectedVertices !== undefined ? selectedVertices : internalSelectedVerts;
  const dynamicTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const matcapTextureRef = useRef<THREE.Texture | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Multi-Touch tracking for Android / WASM touch navigation
  const activePointers = useRef<Map<number, { x: number; y: number; pointerType: string }>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartRadius = useRef<number>(4.8);
  const twoFingerStartMidpoint = useRef<{ x: number; y: number } | null>(null);

  // Quaternion tumble. No theta/phi clamp, so the view does not lock at the poles.
  const orbitState = useRef({
    radius: 4.8,
    target: new THREE.Vector3(0, 0, 0),
    quat: quatFromSpherical(0.78, 1.15),
    isOrbiting: false,
    isPanning: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const [boxRotation, setBoxRotation] = useState({ x: 0, y: 0 });
  const [isDroneNavActive, setIsDroneNavActive] = useState<boolean>(false);
  const [invertNav, setInvertNav] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vue3d_invert_nav') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleInvertNav = useCallback(() => {
    setInvertNav(prev => {
      const next = !prev;
      try {
        localStorage.setItem('vue3d_invert_nav', String(next));
      } catch {}
      return next;
    });
  }, []);

  const isPaintingRef = useRef(false);
  const lastUVIslandIdRef = useRef<number>(-1);
  const lastCompositePaintPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastCompositeMirrorPointsRef = useRef<{ x: number; y: number }[]>([]);
  const brushEngine = BrushEngine.getInstance();
  const raycaster = useRef(new THREE.Raycaster());
  const uvIslandPathRef = useRef<Path2D | null>(null);

  // Keep the live paint clip in the same UV channel and pixel dimensions as the active layer.
  useEffect(() => {
    const sourceGeometry = geometry || meshRef.current?.geometry;
    const layer = layers.find(item => item.id === activeLayerId) || layers[0];
    if (!sourceGeometry || !layer) {
      uvIslandPathRef.current = null;
      return;
    }
    const uvArray = activeUVChannel
      ? sourceGeometry.userData?.uvChannels?.[activeUVChannel] as Float32Array | undefined
      : undefined;
    uvIslandPathRef.current = buildUVIslandClipPath(
      sourceGeometry,
      layer.canvas.width,
      layer.canvas.height,
      uvArray,
    );
  }, [geometry, activeLayerId, layers, activeUVChannel, uvGeometryVersion]);

  // PERF-1/PERF-2: RAF gate — pending paint events queued per frame
  const pendingPaintEventsRef = useRef<PointerEvent[]>([]);
  const rafPaintHandleRef = useRef<number | null>(null);

  const resetPaintPaths = (x?: number, y?: number) => {
    brushEngine.resetStrokePath('primary', x, y);
    for (const key of ['mirror-X', 'mirror-Y', 'mirror-Z', 'mirror-XY']) {
      brushEngine.resetStrokePath(key);
    }
    lastCompositePaintPointRef.current =
      typeof x === 'number' && typeof y === 'number' ? { x, y } : null;
    lastCompositeMirrorPointsRef.current = [];
  };

  // HDRI Reflections & Viewport Lighting Settings
  const [internalHdri, setInternalHdri] = useState<HDRISettings>({
    enabled: true,
    preset: 'studio',
    lightViewport: true, // Checkbox to light main viewport vs reflections only
    blurredBackground: false,
    backgroundBlur: 0.35,
    intensity: 1.0,
    roughnessFilter: 0.35,
  });
  const hdri = controlledHdriSettings || internalHdri;
  const updateHdri = (patch: Partial<HDRISettings>) => {
    if (onUpdateHDRISettings) {
      onUpdateHDRISettings(patch);
    } else {
      setInternalHdri(h => ({ ...h, ...patch }));
    }
  };
  const [showHdriPopover, setShowHdriPopover] = useState(false);

  // Bloom Post-Processing Pass State & Controls
  const [internalBloom, setInternalBloom] = useState<BloomSettings>({
    enabled: true,
    strength: 1.4,
    radius: 0.45,
    threshold: 0.15,
  });
  const bloom = controlledBloomSettings || internalBloom;
  const updateBloom = (patch: Partial<BloomSettings>) => {
    if (onUpdateBloomSettings) {
      onUpdateBloomSettings(patch);
    } else {
      setInternalBloom(b => ({ ...b, ...patch }));
    }
  };
  const [showBloomPopover, setShowBloomPopover] = useState(false);

  // Post-processing composer & passes refs
  const composerRef = useRef<EffectComposer | null>(null);
  const renderPassRef = useRef<RenderPass | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const bloomSettingsRef = useRef<BloomSettings>(bloom);
  bloomSettingsRef.current = bloom;

  // Emissive canvas & texture for glowing materials
  const emissiveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const emissiveTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const hasEmissiveRef = useRef(false);
  const heightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heightTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const roughnessCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const roughnessTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const normalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const normalTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Light refs for HDRI light toggling
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Composite colour and PBR maps. The colour path remains cheap; secondary maps rebuild on texture updates.
  const updateCompositeTexture = useCallback(() => {
    const compCanvas = compositeCanvas || compositeCanvasRef.current;
    if (!compCanvas) return;
    const ctx = compCanvas.getContext('2d');
    if (!ctx) return;

    const width = compCanvas.width;
    const height = compCanvas.height;
    const pixelCount = width * height;

    const ensureCanvas = (ref: React.MutableRefObject<HTMLCanvasElement | null>, fill: string) => {
      if (!ref.current) {
        ref.current = document.createElement('canvas');
        ref.current.width = width;
        ref.current.height = height;
      }
      const canvas = ref.current;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const c = canvas.getContext('2d');
      if (c) {
        c.clearRect(0, 0, width, height);
        c.fillStyle = fill;
        c.fillRect(0, 0, width, height);
      }
      return canvas;
    };

    const emCanvas = ensureCanvas(emissiveCanvasRef, '#000000');
    const emCtx = emCanvas.getContext('2d');
    const heightCanvas = ensureCanvas(heightCanvasRef, '#000000');
    const roughnessCanvas = ensureCanvas(roughnessCanvasRef, '#ffffff');
    const normalCanvas = ensureCanvas(normalCanvasRef, 'rgb(128,128,255)');
    const heightValues = new Float32Array(pixelCount);
    const reflectionValues = new Float32Array(pixelCount);
    let lockedNormalLayer: Layer | null = null;

    ctx.clearRect(0, 0, width, height);

    // Mask layers are non-destructive helpers. Their luminance controls the
    // opacity of the layer they target; they are never drawn as colour layers.
    const maskAlphaByTarget = new Map<string, Uint8ClampedArray>();
    for (const maskLayer of layers) {
      if (!maskLayer.visible || maskLayer.layerRole !== 'mask' || !maskLayer.maskTargetLayerId) continue;
      if (maskLayer.groupId) {
        const parentGroup = layers.find(candidate => candidate.id === maskLayer.groupId);
        if (parentGroup && !parentGroup.visible) continue;
      }
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width; maskCanvas.height = height;
      const maskContext = maskCanvas.getContext('2d');
      if (!maskContext) continue;
      maskContext.drawImage(maskLayer.canvas, 0, 0, width, height);
      try {
        const pixels = maskContext.getImageData(0, 0, width, height).data;
        const combined = maskAlphaByTarget.get(maskLayer.maskTargetLayerId) || new Uint8ClampedArray(pixelCount).fill(255);
        for (let pixel = 0; pixel < pixelCount; pixel++) {
          const i = pixel * 4;
          const luminance = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
          const maskValue = luminance * (pixels[i + 3] / 255);
          const maskOpacity = Math.max(0, Math.min(1, (maskLayer.opacity ?? 100) / 100));
          const coverage = 1 - maskOpacity + maskValue * maskOpacity;
          combined[pixel] = Math.round(combined[pixel] * coverage);
        }
        maskAlphaByTarget.set(maskLayer.maskTargetLayerId, combined);
      } catch (error) {
        console.warn('Skipping an unreadable layer mask:', error);
      }
    }

    let hasEmissive = false;
    for (const layer of layers) {
      if (!layer.visible || layer.isGroup || layer.isBaseLayer || layer.layerRole === 'mask' || layer.layerRole === 'tear') continue;
      if (layer.groupId) {
        const parentGroup = layers.find(candidate => candidate.id === layer.groupId);
        if (parentGroup && !parentGroup.visible) continue;
      }
      const saved = layer.pbrSettings || ({} as any);
      const channel = layer.channel;
      const opacity = Math.max(0, Math.min(1, (layer.opacity ?? 100) / 100));
      const colorOn = saved.colorOn ?? !['height', 'normal', 'emission', 'roughness'].includes(channel);
      const colorInfluence = Math.max(0, Math.min(1, saved.colorInfluence ?? 1));
      const emissionOn = saved.emissionOn ?? channel === 'emission';
      const emissionInfluence = Math.max(0, Math.min(1, saved.emissionInfluence ?? (channel === 'emission' ? 1 : 0)));
      const bumpOn = saved.bumpOn ?? channel === 'height';
      const bumpInfluence = Math.max(0, Math.min(1, saved.bumpInfluence ?? (channel === 'height' ? 1 : 0)));
      const reflectionOn = saved.reflectionOn ?? channel === 'roughness';
      const reflectionInfluence = Math.max(0, Math.min(1, saved.reflectionInfluence ?? (channel === 'roughness' ? 1 : 0)));
      const normalLock = saved.normalLock ?? channel === 'normal';

      const maskAlpha = maskAlphaByTarget.get(layer.id);
      let maskedLayerCanvas: HTMLCanvasElement | null = null;
      if (maskAlpha) {
        maskedLayerCanvas = document.createElement('canvas');
        maskedLayerCanvas.width = width; maskedLayerCanvas.height = height;
        const maskedContext = maskedLayerCanvas.getContext('2d');
        if (maskedContext) {
          maskedContext.drawImage(layer.canvas, 0, 0, width, height);
          const alphaPixels = maskedContext.getImageData(0, 0, width, height);
          for (let pixel = 0; pixel < pixelCount; pixel++) alphaPixels.data[pixel * 4 + 3] = Math.round(alphaPixels.data[pixel * 4 + 3] * maskAlpha[pixel] / 255);
          maskedContext.putImageData(alphaPixels, 0, 0);
        } else maskedLayerCanvas = null;
      }
      if (colorOn && colorInfluence > 0) {
        ctx.save();
        ctx.globalAlpha = opacity * colorInfluence;
        ctx.globalCompositeOperation = layer.blendMode === 'multiply' ? 'multiply'
          : layer.blendMode === 'screen' ? 'screen'
          : layer.blendMode === 'overlay' ? 'overlay'
          : layer.blendMode === 'darken' ? 'darken'
          : layer.blendMode === 'lighten' ? 'lighten'
          : 'source-over';
        ctx.drawImage(maskedLayerCanvas || layer.canvas, 0, 0, width, height);
        ctx.restore();
      }

      const emissionStrength = Math.max(0, Math.min(10, saved.emissionStrength ?? 1));
      if (emissionOn && emissionInfluence > 0 && emissionStrength > 0 && emCtx) {
        hasEmissive = true;
        const emissionSource = document.createElement('canvas');
        emissionSource.width = layer.canvas.width;
        emissionSource.height = layer.canvas.height;
        const emissionSourceContext = emissionSource.getContext('2d');
        if (emissionSourceContext) {
          emissionSourceContext.drawImage(layer.canvas, 0, 0);
          try {
            const emissionPixels = emissionSourceContext.getImageData(0, 0, emissionSource.width, emissionSource.height);
            const emissionData = emissionPixels.data;
            const tint = String(saved.emissionColor || '#ffffff').match(/^#([0-9a-f]{6})$/i)?.[1] || 'ffffff';
            const tintR = parseInt(tint.slice(0, 2), 16) / 255;
            const tintG = parseInt(tint.slice(2, 4), 16) / 255;
            const tintB = parseInt(tint.slice(4, 6), 16) / 255;
            for (let pixel = 0; pixel < emissionData.length; pixel += 4) {
              emissionData[pixel] = Math.min(255, emissionData[pixel] * tintR * emissionStrength);
              emissionData[pixel + 1] = Math.min(255, emissionData[pixel + 1] * tintG * emissionStrength);
              emissionData[pixel + 2] = Math.min(255, emissionData[pixel + 2] * tintB * emissionStrength);
            }
            emissionSourceContext.putImageData(emissionPixels, 0, 0);
          } catch (error) {
            console.warn('Emission tint skipped for an unreadable layer canvas:', error);
          }
          emCtx.save();
          emCtx.globalCompositeOperation = 'lighter';
          emCtx.globalAlpha = opacity * emissionInfluence;
          emCtx.drawImage(emissionSource, 0, 0, width, height);
          emCtx.restore();
        }
      }

      if (normalLock) {
        // A single visible normal-locked layer is authoritative; never mix tangent-space normals.
        lockedNormalLayer = layer;
      }

      if ((bumpOn && bumpInfluence > 0) || (reflectionOn && reflectionInfluence > 0)) {
        try {
          const source = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
          const sourceData = source.data;
          const ramp = (saved.bumpRamp?.length ? saved.bumpRamp : [{ position: 0, height: 0 }, { position: 1, height: 1 }])
            .slice().sort((a: any, b: any) => a.position - b.position);
          const rampValue = (v: number) => {
            if (v <= ramp[0].position) return ramp[0].height;
            if (v >= ramp[ramp.length - 1].position) return ramp[ramp.length - 1].height;
            for (let ri = 0; ri < ramp.length - 1; ri++) {
              const left = ramp[ri];
              const right = ramp[ri + 1];
              if (v >= left.position && v <= right.position) {
                const t = (v - left.position) / Math.max(0.000001, right.position - left.position);
                return left.height + (right.height - left.height) * t;
              }
            }
            return v;
          };
          for (let y = 0; y < height; y++) {
            const sy = Math.min(layer.canvas.height - 1, Math.floor(y * layer.canvas.height / height));
            for (let x = 0; x < width; x++) {
              const sx = Math.min(layer.canvas.width - 1, Math.floor(x * layer.canvas.width / width));
              const si = (sy * layer.canvas.width + sx) * 4;
              const di = y * width + x;
              const alpha = (sourceData[si + 3] / 255) * (maskAlpha ? maskAlpha[di] / 255 : 1);
              if (alpha <= 0) continue;
              const luminance = (0.299 * sourceData[si] + 0.587 * sourceData[si + 1] + 0.114 * sourceData[si + 2]) / 255;
              if (bumpOn && bumpInfluence > 0) {
                heightValues[di] = Math.min(1, heightValues[di] + rampValue(applyHeightLevels(luminance, saved.heightLevels)) * bumpInfluence * opacity * alpha);
              }
              if (reflectionOn && reflectionInfluence > 0) {
                reflectionValues[di] = Math.max(reflectionValues[di], luminance * reflectionInfluence * opacity * alpha);
              }
            }
          }
        } catch (error) {
          console.warn('Skipping a PBR map for a canvas that cannot be read:', error);
        }
      }
    }

    const heightContext = heightCanvas.getContext('2d');
    const roughnessContext = roughnessCanvas.getContext('2d');
    const normalContext = normalCanvas.getContext('2d');
    if (heightContext && roughnessContext && normalContext) {
      const heightImage = heightContext.createImageData(width, height);
      const roughnessImage = roughnessContext.createImageData(width, height);
      for (let i = 0; i < pixelCount; i++) {
        const h = Math.round(Math.max(0, Math.min(1, heightValues[i])) * 255);
        const r = Math.round((1 - Math.max(0, Math.min(1, reflectionValues[i]))) * 255);
        const offset = i * 4;
        heightImage.data[offset] = heightImage.data[offset + 1] = heightImage.data[offset + 2] = h;
        heightImage.data[offset + 3] = 255;
        roughnessImage.data[offset] = roughnessImage.data[offset + 1] = roughnessImage.data[offset + 2] = r;
        roughnessImage.data[offset + 3] = 255;
      }
      heightContext.putImageData(heightImage, 0, 0);
      roughnessContext.putImageData(roughnessImage, 0, 0);

      if (lockedNormalLayer) {
        normalContext.clearRect(0, 0, width, height);
        normalContext.drawImage(lockedNormalLayer.canvas, 0, 0, width, height);
      } else {
        const normalImage = normalContext.createImageData(width, height);
        const getHeight = (x: number, y: number) => heightValues[Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))];
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = -getHeight(x - 1, y - 1) + getHeight(x + 1, y - 1) - 2 * getHeight(x - 1, y) + 2 * getHeight(x + 1, y) - getHeight(x - 1, y + 1) + getHeight(x + 1, y + 1);
            const dy = -getHeight(x - 1, y - 1) - 2 * getHeight(x, y - 1) - getHeight(x + 1, y - 1) + getHeight(x - 1, y + 1) + 2 * getHeight(x, y + 1) + getHeight(x + 1, y + 1);
            let nx = -dx * 2.5;
            let ny = -dy * 2.5;
            let nz = 1;
            const length = Math.hypot(nx, ny, nz) || 1;
            nx /= length; ny /= length; nz /= length;
            const offset = (y * width + x) * 4;
            normalImage.data[offset] = Math.round((nx * 0.5 + 0.5) * 255);
            normalImage.data[offset + 1] = Math.round((ny * 0.5 + 0.5) * 255);
            normalImage.data[offset + 2] = Math.round((nz * 0.5 + 0.5) * 255);
            normalImage.data[offset + 3] = 255;
          }
        }
        normalContext.putImageData(normalImage, 0, 0);
      }
    }

    const updateTexture = (texture: THREE.CanvasTexture | null) => {
      if (!texture) return;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.needsUpdate = true;
    };
    updateTexture(dynamicTextureRef.current);
    updateTexture(emissiveTextureRef.current);
    updateTexture(heightTextureRef.current);
    updateTexture(roughnessTextureRef.current);
    updateTexture(normalTextureRef.current);

    if (meshRef.current?.material) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveMap = hasEmissive ? emissiveTextureRef.current : null;
      mat.emissive.set(0xffffff);
      mat.emissiveIntensity = hasEmissive ? 1 : 0;
      mat.roughnessMap = roughnessTextureRef.current;
      mat.normalMap = normalTextureRef.current;
      mat.needsUpdate = true;
    }
    hasEmissiveRef.current = hasEmissive;
    if (onCompositeCanvasReady) onCompositeCanvasReady(compCanvas);
  }, [layers, compositeCanvas, onCompositeCanvasReady]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#242424');
    sceneRef.current = scene;

    const aspect = width / height;
    // Unlimited near/far clipping planes for infinite zoom
    const perspCam = new THREE.PerspectiveCamera(45, aspect, 0.0001, 1e7);
    const orthoCam = new THREE.OrthographicCamera(-3 * aspect, 3 * aspect, 3, -3, 0.0001, 1e7);
    cameraPerspRef.current = perspCam;
    cameraOrthoRef.current = orthoCam;

    // Quad View Orthographic Cameras (Top, Front, Right)
    const topCam = new THREE.OrthographicCamera(-2.5 * aspect, 2.5 * aspect, 2.5, -2.5, 0.0001, 1e7);
    topCam.position.set(0, 30, 0);
    topCam.up.set(0, 0, -1);
    topCam.lookAt(0, 0, 0);

    const frontCam = new THREE.OrthographicCamera(-2.5 * aspect, 2.5 * aspect, 2.5, -2.5, 0.0001, 1e7);
    frontCam.position.set(0, 0, 30);
    frontCam.up.set(0, 1, 0);
    frontCam.lookAt(0, 0, 0);

    const rightCam = new THREE.OrthographicCamera(-2.5 * aspect, 2.5 * aspect, 2.5, -2.5, 0.0001, 1e7);
    rightCam.position.set(30, 0, 0);
    rightCam.up.set(0, 1, 0);
    rightCam.lookAt(0, 0, 0);

    quadCamerasRef.current = { top: topCam, front: frontCam, right: rightCam };

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current || undefined,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(drawingRatio(width, height));
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;
    const glCanvas = renderer.domElement;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      needsRenderRef.current = true;
    };
    const onContextRestored = () => {
      needsRenderRef.current = true;
    };
    glCanvas.addEventListener('webglcontextlost', onContextLost);
    glCanvas.addEventListener('webglcontextrestored', onContextRestored);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    // 3-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xfff8eb, 1.6);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.8);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    const targetComp = compositeCanvas || document.createElement('canvas');
    if (targetComp.width !== 1024) targetComp.width = 1024;
    if (targetComp.height !== 1024) targetComp.height = 1024;
    compositeCanvasRef.current = targetComp;
    const tex = new THREE.CanvasTexture(targetComp);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = maxAniso;
    dynamicTextureRef.current = tex;

    // Emissive Canvas Texture
    const emCanvas = emissiveCanvasRef.current || document.createElement('canvas');
    if (emCanvas.width !== 1024) emCanvas.width = 1024;
    if (emCanvas.height !== 1024) emCanvas.height = 1024;
    emissiveCanvasRef.current = emCanvas;
    const emTex = new THREE.CanvasTexture(emCanvas);
    emTex.colorSpace = THREE.SRGBColorSpace;
    emTex.generateMipmaps = true;
    emTex.minFilter = THREE.LinearMipmapLinearFilter;
    emTex.magFilter = THREE.LinearFilter;
    emTex.anisotropy = maxAniso;
    emissiveTextureRef.current = emTex;

    const makeMapTexture = (ref: React.MutableRefObject<HTMLCanvasElement | null>, fill: string) => {
      if (!ref.current) {
        ref.current = document.createElement('canvas');
        ref.current.width = 1024;
        ref.current.height = 1024;
      }
      const mapContext = ref.current.getContext('2d');
      if (mapContext) {
        mapContext.fillStyle = fill;
        mapContext.fillRect(0, 0, 1024, 1024);
      }
      const texture = new THREE.CanvasTexture(ref.current);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = maxAniso;
      return texture;
    };
    heightTextureRef.current = makeMapTexture(heightCanvasRef, '#000000');
    roughnessTextureRef.current = makeMapTexture(roughnessCanvasRef, '#ffffff');
    normalTextureRef.current = makeMapTexture(normalCanvasRef, 'rgb(128,128,255)');

    const modelPreset = BUILTIN_MODELS[modelKey] ? BUILTIN_MODELS[modelKey]() : BUILTIN_MODELS.suzanneHeadEyes();
    const material = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: emTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.0,
      roughnessMap: roughnessTextureRef.current,
      normalMap: normalTextureRef.current,
      roughness: materialProps.roughness,
      metalness: materialProps.metallic,
    });
    const mesh = new THREE.Mesh(geometry || modelPreset.geometry, material);
    scene.add(mesh);
    mesh.updateMatrixWorld(true);
    (mesh.geometry as any).worldMatrix = mesh.matrixWorld;
    meshRef.current = mesh;

    // 3D Viewport X-Ray Vertex Highlight Helper
    const xrayGeom = new THREE.BufferGeometry();
    const xrayMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 7,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    const xrayPoints = new THREE.Points(xrayGeom, xrayMat);
    xrayPoints.renderOrder = 999;
    xrayPoints.visible = false;
    scene.add(xrayPoints);
    xrayPointsRef.current = xrayPoints;

    // Keep the first visible frame on the direct renderer. The post-processing
    // composer and bloom GPU resources are allocated on the following frame.
    let animId: number;
    let bloomInitFrame = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const interacting = orbitState.current.isOrbiting || orbitState.current.isPanning || isPaintingRef.current || activePointers.current.size > 0;
      if (!interacting && !needsRenderRef.current) return;
      needsRenderRef.current = false;

      updateCameraPosition();

      const currentLayout = viewLayoutRef.current;
      const currentIsOrtho = isOrthoRef.current;
      const r = rendererRef.current;
      if (!r) return;

      if (currentLayout === 'quad' && quadCamerasRef.current) {
        const fullW = r.domElement.clientWidth || width;
        const fullH = r.domElement.clientHeight || height;
        const halfW = Math.floor(fullW / 2);
        const halfH = Math.floor(fullH / 2);

        r.setScissorTest(true);

        // 1. Top-Left: Top Ortho View
        r.setViewport(0, halfH, halfW, halfH);
        r.setScissor(0, halfH, halfW, halfH);
        r.render(scene, quadCamerasRef.current.top);

        // 2. Top-Right: Front Ortho View
        r.setViewport(halfW, halfH, halfW, halfH);
        r.setScissor(halfW, halfH, halfW, halfH);
        r.render(scene, quadCamerasRef.current.front);

        // 3. Bottom-Left: Right Ortho View
        r.setViewport(0, 0, halfW, halfH);
        r.setScissor(0, 0, halfW, halfH);
        r.render(scene, quadCamerasRef.current.right);

        // 4. Bottom-Right: User Perspective Orbit View
        r.setViewport(halfW, 0, halfW, halfH);
        r.setScissor(halfW, 0, halfW, halfH);
        r.render(scene, perspCam);

        r.setScissorTest(false);
      } else {
        r.setScissorTest(false);
        r.setViewport(0, 0, r.domElement.clientWidth || width, r.domElement.clientHeight || height);
        const activeCam = currentIsOrtho ? orthoCam : perspCam;
        const shouldBloom = bloomSettingsRef.current.enabled && hasEmissiveRef.current;
        if (shouldBloom && composerRef.current && renderPassRef.current) {
          renderPassRef.current.camera = activeCam;
          composerRef.current.render();
        } else {
          r.render(scene, activeCam);
        }
      }
    };
    animate();

    bloomInitFrame = requestAnimationFrame(() => {
      if (!rendererRef.current || composerRef.current) return;
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, perspCam);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        bloomSettingsRef.current.strength,
        bloomSettingsRef.current.radius,
        bloomSettingsRef.current.threshold
      );
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      composerRef.current = composer;
      renderPassRef.current = renderPass;
      bloomPassRef.current = bloomPass;
      needsRenderRef.current = true;
    });

    const fitViewport = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 2 || h < 2) return;
      const pr = drawingRatio(w, h);
      renderer.setPixelRatio(pr);
      const asp = w / h;
      perspCam.aspect = asp;
      perspCam.updateProjectionMatrix();

      orthoCam.left = -3 * asp;
      orthoCam.right = 3 * asp;
      orthoCam.top = 3;
      orthoCam.bottom = -3;
      orthoCam.updateProjectionMatrix();

      if (quadCamerasRef.current) {
        const qAsp = (w / 2) / (h / 2);
        ['top', 'front', 'right'].forEach((k) => {
          const c = (quadCamerasRef.current as any)[k];
          if (c) {
            c.left = -2.5 * qAsp;
            c.right = 2.5 * qAsp;
            c.top = 2.5;
            c.bottom = -2.5;
            c.updateProjectionMatrix();
          }
        });
      }

      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      if (composerRef.current) {
        composerRef.current.setSize(w, h);
      }
      if (bloomPassRef.current) {
        bloomPassRef.current.resolution.set(Math.floor(w * pr), Math.floor(h * pr));
      }
      const tether = tetherCanvasRef.current;
      if (tether && (tether.width !== w || tether.height !== h)) {
        tether.width = w;
        tether.height = h;
      }
      needsRenderRef.current = true;
    };

    const onOrient = () => requestAnimationFrame(fitViewport);
    const ro = new ResizeObserver(() => fitViewport());
    ro.observe(container);
    window.addEventListener('resize', fitViewport);
    window.addEventListener('orientationchange', onOrient);
    window.visualViewport?.addEventListener('resize', fitViewport);
    requestAnimationFrame(fitViewport);

    return () => {
      cancelAnimationFrame(animId);
      if (bloomInitFrame) cancelAnimationFrame(bloomInitFrame);
      window.removeEventListener('resize', fitViewport);
      window.removeEventListener('orientationchange', onOrient);
      window.visualViewport?.removeEventListener('resize', fitViewport);
      ro.disconnect();
      glCanvas.removeEventListener('webglcontextlost', onContextLost);
      glCanvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (composerRef.current) {
        composerRef.current.dispose();
        composerRef.current = null;
      }
      dynamicTextureRef.current?.dispose();
      emissiveTextureRef.current?.dispose();
      heightTextureRef.current?.dispose();
      roughnessTextureRef.current?.dispose();
      normalTextureRef.current?.dispose();
      renderer.dispose();
    };
  }, []);

  // Sync bloom settings dynamically
  useEffect(() => {
    bloomSettingsRef.current = bloom;
    if (bloomPassRef.current) {
      bloomPassRef.current.strength = bloom.strength;
      bloomPassRef.current.radius = bloom.radius;
      bloomPassRef.current.threshold = bloom.threshold;
    }
  }, [bloom]);

  // The viewport works on a private geometry clone. Part visibility changes
  // swap its index buffer for rendering/raycasting and must never mutate the
  // source geometry used by UV editing, project saves, or exports.
  useEffect(() => {
    if (!meshRef.current) return;
    let sourceGeom: THREE.BufferGeometry;

    if (geometry) {
      sourceGeom = geometry;
    } else if (customOBJText) {
      sourceGeom = parseOBJ(customOBJText);
    } else if (BUILTIN_MODELS[modelKey]) {
      sourceGeom = BUILTIN_MODELS[modelKey]().geometry;
    } else {
      sourceGeom = BUILTIN_MODELS.suzanneHeadEyes().geometry;
    }

    const newGeom = sourceGeom.clone();
    // BufferGeometry.clone JSON-copies userData; restore typed inventory/index
    // buffers explicitly so component filtering and full-topology normals work.
    newGeom.userData = {
      ...sourceGeom.userData,
      componentIndices: sourceGeom.userData?.componentIndices,
      excludeIndices: sourceGeom.userData?.excludeIndices,
      componentNames: sourceGeom.userData?.componentNames,
      fullIndex: sourceGeom.userData?.fullIndex?.clone?.() || sourceGeom.getIndex()?.clone(),
      uvChannels: Object.fromEntries(Object.entries(sourceGeom.userData?.uvChannels || {}).map(([key, value]) => [key, value instanceof Float32Array ? new Float32Array(value) : value])),
      activeUVChannel: sourceGeom.userData?.activeUVChannel || activeUVChannel || 'uv_original',
    };
    const activeUV = (sourceGeom.userData?.uvChannels?.[sourceGeom.userData?.activeUVChannel || activeUVChannel || 'uv_original']) as Float32Array | undefined;
    if (activeUV && newGeom.getAttribute('uv')?.array.length === activeUV.length) {
      (newGeom.getAttribute('uv') as THREE.BufferAttribute).copyArray(activeUV);
      (newGeom.getAttribute('uv') as THREE.BufferAttribute).needsUpdate = true;
    }
    SurfaceShadingEngine.ensureDefaultNormalsCached(newGeom);
    meshRef.current.geometry.dispose();
    meshRef.current.geometry = newGeom;
    meshRef.current.updateMatrixWorld(true);
    (newGeom as any).worldMatrix = meshRef.current.matrixWorld;
    needsRenderRef.current = true;
  }, [modelKey, customOBJText, geometry, uvGeometryVersion, activeUVChannel]);

  // Apply surface shading once per mode/geometry change, then explicitly wake
  // the on-demand renderer. This prevents the old behaviour where the new
  // normals were computed but only became visible after camera navigation.
  useEffect(() => {
    if (!meshRef.current) return;
    const geom = meshRef.current.geometry;
    if (!geom) return;
    const effMode: SurfaceShadingType = surfaceMode === 'hard' ? 'flat' : surfaceMode;
    SurfaceShadingEngine.applySurfaceShading(geom, meshRef.current.material, effMode);
    needsRenderRef.current = true;
  }, [surfaceMode, modelKey, customOBJText, geometry, uvGeometryVersion, activeUVChannel]);

  // Sync X-Ray Selected Vertex Highlight Points in 3D
  useEffect(() => {
    if (!xrayPointsRef.current || !meshRef.current) return;
    const geom = meshRef.current.geometry;
    const posAttr = geom.getAttribute('position');
    if (!posAttr) return;

    if (!isXRayBrushActive || activeSelectedVerts.size === 0) {
      xrayPointsRef.current.visible = false;
      return;
    }

    const positions: number[] = [];
    activeSelectedVerts.forEach((vIdx) => {
      if (vIdx < posAttr.count) {
        positions.push(posAttr.getX(vIdx), posAttr.getY(vIdx), posAttr.getZ(vIdx));
      }
    });

    xrayPointsRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    xrayPointsRef.current.geometry.attributes.position.needsUpdate = true;
    xrayPointsRef.current.visible = true;
  }, [activeSelectedVerts, isXRayBrushActive, geometry]);

  // Update Shading and Dynamic Normals
  useEffect(() => {
    if (!meshRef.current || !dynamicTextureRef.current) return;
    const mesh = meshRef.current;
    const hasEmissive = layers.some(l => l.visible && l.channel === 'emission');

    if (shadingMode === 'wireframe') {
      mesh.material = new THREE.MeshBasicMaterial({
        color: '#3d7fb8',
        wireframe: true,
      });
    } else if (shadingMode === 'normal') {
      mesh.material = new THREE.MeshNormalMaterial();
    } else if (shadingMode === 'flat') {
      mesh.material = new THREE.MeshBasicMaterial({
        map: dynamicTextureRef.current,
      });
    } else if (shadingMode === 'clay') {
      mesh.material = new THREE.MeshStandardMaterial({
        color: '#b0a89f',
        roughness: 0.6,
        metalness: 0.05,
      });
    } else if (shadingMode === 'uv_check') {
      const uvCvs = document.createElement('canvas');
      uvCvs.width = 512;
      uvCvs.height = 512;
      const uctx = uvCvs.getContext('2d')!;
      for (let cy = 0; cy < 16; cy++) {
        for (let cx = 0; cx < 16; cx++) {
          uctx.fillStyle = (cx + cy) % 2 === 0 ? '#e6e6e6' : '#252525';
          uctx.fillRect(cx * 32, cy * 32, 32, 32);
        }
      }
      const uvTex = new THREE.CanvasTexture(uvCvs);
      mesh.material = new THREE.MeshBasicMaterial({ map: uvTex });
    } else {
      mesh.material = new THREE.MeshStandardMaterial({
        map: dynamicTextureRef.current,
        emissiveMap: hasEmissive ? emissiveTextureRef.current || undefined : undefined,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: hasEmissive ? 1.0 : 0.0,
        roughnessMap: roughnessTextureRef.current,
        normalMap: normalTextureRef.current,
        roughness: materialProps.roughness,
        metalness: materialProps.metallic,
      });
    }

    // The protected Base Layer is a world-space checker background, not a UV texture.
    // The dominant world-space face normal selects the projection plane for stable coverage.
    // Keep the checker underneath the alpha-composited paint map.
    const baseMaterial = mesh.material;
    const matcapLayer = [...layers].reverse().find(layer => layer.visible && !layer.isGroup && !layer.isBaseLayer && layer.pbrSettings?.reflectionSource === 'matcap');
    if (matcapTextureRef.current) { matcapTextureRef.current.dispose(); matcapTextureRef.current = null; }
    let matcapIntensity = 0;
    if (matcapLayer?.pbrSettings) {
      const pbr = matcapLayer.pbrSettings;
      matcapIntensity = THREE.MathUtils.clamp((pbr.reflectionIntensity ?? 0.8) * (pbr.reflectionInfluence ?? 1) * ((matcapLayer.opacity ?? 100) / 100), 0, 1);
      if (pbr.matcapPreset === 'custom' && pbr.customMatcapUrl) {
        const texture = new THREE.TextureLoader().load(pbr.customMatcapUrl, () => {
          if (meshRef.current === mesh && mesh.material === baseMaterial) { baseMaterial.needsUpdate = true; needsRenderRef.current = true; }
        });
        texture.colorSpace = THREE.SRGBColorSpace; matcapTextureRef.current = texture;
      } else matcapTextureRef.current = createMatcapPresetTexture(pbr.matcapPreset || 'chrome');
    }
    if (baseMaterial instanceof THREE.MeshStandardMaterial) {
      const colourA = new THREE.Color(baseLayerSettings.colorA || '#9c9c9c');
      const colourB = new THREE.Color(baseLayerSettings.colorB || '#9c9c9c');
      baseMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.vueBaseColourA = { value: colourA };
        shader.uniforms.vueBaseColourB = { value: colourB };
        shader.uniforms.vueBaseOpacityA = { value: Math.max(0, Math.min(1, baseLayerSettings.colorAOpacity / 100)) };
        shader.uniforms.vueBaseOpacityB = { value: Math.max(0, Math.min(1, baseLayerSettings.colorBOpacity / 100)) };
        shader.uniforms.vueBaseLayerOpacity = { value: Math.max(0, Math.min(1, baseLayerSettings.layerOpacity / 100)) };
        shader.uniforms.vueMatcapMap = { value: matcapTextureRef.current };
        shader.uniforms.vueMatcapIntensity = { value: matcapIntensity };
        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vVueMatcapNormal;\nvarying vec3 vVueWorldPosition;\nvarying vec3 vVueWorldNormal;'
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <worldpos_vertex>',
          '#include <worldpos_vertex>\nvVueMatcapNormal = normalize(transformedNormal);\nvVueWorldPosition = worldPosition.xyz;\nvVueWorldNormal = normalize(mat3(modelMatrix) * objectNormal);'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vVueWorldPosition;\nvarying vec3 vVueWorldNormal;\nvarying vec3 vVueMatcapNormal;\nuniform sampler2D vueMatcapMap;\nuniform float vueMatcapIntensity;\nuniform vec3 vueBaseColourA;\nuniform vec3 vueBaseColourB;\nuniform float vueBaseOpacityA;\nuniform float vueBaseOpacityB;\nuniform float vueBaseLayerOpacity;'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#ifdef USE_MAP
            vec4 vuePaintSample = texture2D(map, vMapUv);
            vec3 vueAbsWorldNormal = abs(normalize(vVueWorldNormal));
            vec2 vueCheckerCoordinates = vueAbsWorldNormal.x >= vueAbsWorldNormal.y && vueAbsWorldNormal.x >= vueAbsWorldNormal.z
              ? vVueWorldPosition.yz
              : (vueAbsWorldNormal.y >= vueAbsWorldNormal.z ? vVueWorldPosition.xz : vVueWorldPosition.xy);
            // Increase checker frequency on tightly curved details (e.g. fingers),
            // keeping broad, flatter surfaces on the original larger tile scale.
            vec3 vueN = normalize(vVueWorldNormal);
            float vueNormalRate = length(dFdx(vueN)) / max(length(dFdx(vVueWorldPosition)), 0.0001)
              + length(dFdy(vueN)) / max(length(dFdy(vVueWorldPosition)), 0.0001);
            float vueCurvature = smoothstep(0.15, 1.8, vueNormalRate);
            float vueTileScale = mix(2.0, 4.0, vueCurvature);
            float vueCheckerIndex = mod(floor(vueCheckerCoordinates.x * vueTileScale) + floor(vueCheckerCoordinates.y * vueTileScale), 2.0);
            vec3 vueCheckerColour = mix(vueBaseColourA, vueBaseColourB, vueCheckerIndex);
            float vueCheckerOpacity = mix(vueBaseOpacityA, vueBaseOpacityB, vueCheckerIndex) * vueBaseLayerOpacity;
            vec3 vueBackgroundColour = mix(vec3(0.1569), vueCheckerColour, vueCheckerOpacity);
            diffuseColor.rgb = mix(vueBackgroundColour, vuePaintSample.rgb, vuePaintSample.a);
            if (vueMatcapIntensity > 0.001) {
              vec3 vueMatcapN = normalize(vVueMatcapNormal);
              vec2 vueMatcapUv = vueMatcapN.xy * 0.5 + 0.5;
              vec4 vueMatcapSample = texture2D(vueMatcapMap, vueMatcapUv);
              diffuseColor.rgb = mix(diffuseColor.rgb, vueMatcapSample.rgb, vueMatcapIntensity * vueMatcapSample.a);
            }
          #endif`
        );
      };
      baseMaterial.customProgramCacheKey = () => 'vue-world-space-base-checker-curvature-matcap-v3';
      baseMaterial.needsUpdate = true;
    }

    // A material replacement only needs its flat-shading flag synchronised;
    // the geometry normal buffers are handled by the dedicated mode effect.
    const effMode: SurfaceShadingType = surfaceMode === 'hard' ? 'flat' : surfaceMode;
    SurfaceShadingEngine.syncMaterialFlatShading(mesh.material, effMode);
  }, [shadingMode, materialProps, layers, baseLayerSettings]);

  // Mesh Parts Inventory visibility: all part changes update the same geometry
  // index used by both rendering and raycasting, so hidden parts cannot receive paint.
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const geom = mesh.geometry;
    const parts = geom.userData?.componentIndices as Record<string, Uint32Array> | undefined;
    if (parts && Object.keys(parts).length > 0) {
      const allIds = Object.keys(parts);
      const visibleIds = isolateSelectedGroupOnly && meshComponentVisibility !== 'all'
        ? (parts[meshComponentVisibility] ? [meshComponentVisibility] : [])
        : allIds.filter(id => !hiddenMeshComponents.includes(id));
      if (visibleIds.length === allIds.length && hiddenMeshComponents.length === 0 && !isolateSelectedGroupOnly && geom.userData?.fullIndex) {
        geom.setIndex(geom.userData.fullIndex);
      } else {
        const total = visibleIds.reduce((sum, id) => sum + (parts[id]?.length || 0), 0);
        const merged = new Uint32Array(total);
        let offset = 0;
        for (const id of visibleIds) {
          const indices = parts[id];
          if (!indices) continue;
          merged.set(indices, offset);
          offset += indices.length;
        }
        geom.setIndex(new THREE.BufferAttribute(merged, 1));
      }
      geom.setDrawRange(0, Infinity);
      mesh.visible = visibleIds.length > 0;
    } else if (meshComponentVisibility === 'all' || !meshComponentVisibility) {
      mesh.visible = true;
      if (geom.userData?.fullIndex) geom.setIndex(geom.userData.fullIndex);
      geom.setDrawRange(0, Infinity);
    } else if (isolateSelectedGroupOnly && geom.groups?.length) {
      const groupIdx = parseInt(meshComponentVisibility, 10);
      if (!Number.isNaN(groupIdx) && geom.groups[groupIdx]) {
        geom.setDrawRange(geom.groups[groupIdx].start, geom.groups[groupIdx].count);
      }
    }
    needsRenderRef.current = true;
  }, [meshComponentVisibility, hiddenMeshComponents, isolateSelectedGroupOnly, geometry]);



  // HDRI Reflection & Viewport Lighting Controller
  useEffect(() => {
    if (!sceneRef.current || !meshRef.current) return;
    const scene = sceneRef.current;
    const mesh = meshRef.current;

    if (!hdri.enabled) {
      scene.environment = null;
      scene.background = new THREE.Color('#242424');
      (scene as any).backgroundBlurriness = 0;
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.envMap = null;
        mesh.material.needsUpdate = true;
      }
      return;
    }

    const hdriTex = HDRIManager.getHDRITexture(hdri.preset, hdri.customUrl);

    // 1. Checkbox: Use HDRI to light main viewport vs 3-point studio lighting with reflections only
    if (hdri.lightViewport) {
      scene.environment = hdriTex;
      if (ambientLightRef.current) ambientLightRef.current.intensity = 0.45;
      if (keyLightRef.current) keyLightRef.current.intensity = 0.85;
      if (fillLightRef.current) fillLightRef.current.intensity = 0.4;
      if (rimLightRef.current) rimLightRef.current.intensity = 0.5;
    } else {
      // Reflections only! Main viewport lit by standard 3-point studio lighting
      scene.environment = null;
      if (ambientLightRef.current) ambientLightRef.current.intensity = 0.85;
      if (keyLightRef.current) keyLightRef.current.intensity = 1.6;
      if (fillLightRef.current) fillLightRef.current.intensity = 0.8;
      if (rimLightRef.current) rimLightRef.current.intensity = 1.2;
    }

    // 2. Sample HDRI using view reflection vector R = reflect(-V, N) for reflective surface rendering only
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.envMap = hdriTex;
      mesh.material.envMapIntensity = hdri.intensity;
      mesh.material.roughness = THREE.MathUtils.clamp(materialProps.roughness, 0.04, 1.0);
      mesh.material.metalness = THREE.MathUtils.clamp(materialProps.metallic, 0.0, 1.0);
      mesh.material.needsUpdate = true;
    }

    // 3. Blurred background equirectangular panorama
    if (hdri.blurredBackground) {
      scene.background = hdriTex;
      (scene as any).backgroundBlurriness = hdri.backgroundBlur;
    } else {
      scene.background = new THREE.Color('#242424');
      (scene as any).backgroundBlurriness = 0;
    }
  }, [hdri, shadingMode, materialProps, surfaceMode]);

  useEffect(() => {
    updateCompositeTexture();
    if (dynamicTextureRef.current) {
      dynamicTextureRef.current.needsUpdate = true;
    }
    needsRenderRef.current = true;
  }, [layers, textureVersion, updateCompositeTexture]);

  // Virtual 3D Origin Cursor / Plane Helper for Symmetry with X-Ray Overlay and Axis Label
  const virtualSymmetryHelperRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (virtualSymmetryHelperRef.current) {
      sceneRef.current.remove(virtualSymmetryHelperRef.current);
      virtualSymmetryHelperRef.current = null;
    }

    if (symmetryConfig?.showVirtualCursorPlane) {
      const group = new THREE.Group();
      const loc = symmetryConfig.locatorValue;
      
      // 1. Semi-transparent mirror slice plane with X-Ray overlay (visible through mesh)
      const planeGeom = new THREE.PlaneGeometry(5.5, 5.5);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0x3d7fb8,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      });
      const planeMesh = new THREE.Mesh(planeGeom, planeMat);
      planeMesh.renderOrder = 9996;
      group.add(planeMesh);

      // 2. 3D Axis Crosshair Locator with X-Ray overlay
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x89b4fa,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
      });
      const pts = [
        new THREE.Vector3(-2.8, 0, 0), new THREE.Vector3(2.8, 0, 0),
        new THREE.Vector3(0, -2.8, 0), new THREE.Vector3(0, 2.8, 0),
      ];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const cross = new THREE.LineSegments(lineGeom, lineMat);
      cross.renderOrder = 9998;
      group.add(cross);

      // 3. 3D Cursor Target Ring (Blender style 3D cursor visible through mesh)
      const ringPts: THREE.Vector3[] = [];
      const segs = 36;
      const ringRadius = 0.5;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(Math.cos(a) * ringRadius, Math.sin(a) * ringRadius, 0));
      }
      const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPts);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0xff3b3b,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.95,
      });
      const ring = new THREE.LineLoop(ringGeom, ringMat);
      ring.renderOrder = 9998;
      group.add(ring);

      // 4. Dynamic Text Sprite Bearing the Name of the Axis
      const canvas = document.createElement('canvas');
      canvas.width = 340;
      canvas.height = 84;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(16, 26, 42, 0.92)';
      ctx.roundRect ? ctx.roundRect(4, 4, 332, 76, 12) : ctx.rect(4, 4, 332, 76);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#3d7fb8';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${symmetryConfig.axis}-Axis 3D Cursor`, 170, 32);

      ctx.fillStyle = '#a6e3a1';
      ctx.font = '18px monospace';
      ctx.fillText(`Loc: ${loc.toFixed(2)} [X-Ray Overlay]`, 170, 58);

      const spriteTex = new THREE.CanvasTexture(canvas);
      spriteTex.colorSpace = THREE.SRGBColorSpace;
      const spriteMat = new THREE.SpriteMaterial({
        map: spriteTex,
        depthTest: false,
        depthWrite: false,
        transparent: true,
      });
      const labelSprite = new THREE.Sprite(spriteMat);
      labelSprite.scale.set(1.4, 0.35, 1.0);
      labelSprite.position.set(0, 0.9, 0);
      labelSprite.renderOrder = 9999;
      group.add(labelSprite);

      if (symmetryConfig.axis === 'X') {
        group.rotation.y = Math.PI / 2;
        group.position.set(loc, 0, 0);
      } else if (symmetryConfig.axis === 'Y') {
        group.rotation.x = Math.PI / 2;
        group.position.set(0, loc, 0);
      } else {
        group.rotation.set(0, 0, 0);
        group.position.set(0, 0, loc);
      }

      sceneRef.current.add(group);
      virtualSymmetryHelperRef.current = group;
    }
  }, [symmetryConfig?.showVirtualCursorPlane, symmetryConfig?.axis, symmetryConfig?.locatorValue]);

  const updateCameraPosition = () => {
    const zoom = zoomFactor || 1;
    if (cameraPerspRef.current) applyFreeCamera(cameraPerspRef.current, orbitState.current, zoom);
    if (cameraOrthoRef.current) applyFreeCamera(cameraOrthoRef.current, orbitState.current, zoom);
    setBoxRotation(gizmoAngles(orbitState.current.quat));
  };

  const snapToView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => {
    const snaps = {
      front: [0, Math.PI / 2],
      back: [Math.PI, Math.PI / 2],
      right: [Math.PI / 2, Math.PI / 2],
      left: [-Math.PI / 2, Math.PI / 2],
      top: [0, 0],
      bottom: [0, Math.PI],
    } as const;
    const [theta, phi] = snaps[view];
    orbitState.current.quat.copy(quatFromSpherical(theta, phi));
    needsRenderRef.current = true;
    updateCameraPosition();
  };

  useEffect(() => {
    if (viewSnapTrigger) {
      snapToView(viewSnapTrigger.view);
    }
  }, [viewSnapTrigger]);

  const handleFlipView = () => {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orbitState.current.quat);
    orbitState.current.quat.premultiply(new THREE.Quaternion().setFromAxisAngle(up, Math.PI));
    orbitState.current.quat.normalize();
    needsRenderRef.current = true;
    updateCameraPosition();
  };

  const handlePanDelta = (dx: number, dy: number) => {
    const camera = cameraPerspRef.current;
    const sens = navSensitivity !== undefined ? navSensitivity : 1.0;
    if (camera) {
      const panSpeed = (orbitState.current.radius / zoomFactor) * 0.0011 * sens;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());
      orbitState.current.target.addScaledVector(right, -dx * panSpeed);
      orbitState.current.target.addScaledVector(up, dy * panSpeed);
    } else {
      orbitState.current.target.x -= dx * 0.0035 * sens;
      orbitState.current.target.y += dy * 0.0035 * sens;
    }
    needsRenderRef.current = true;
    updateCameraPosition();
  };

  const handleZoomDelta = (delta: number) => {
    // Nearly infinite zoom in and out
    const factor = Math.exp(-delta * 0.05);
    orbitState.current.radius = Math.max(1e-6, orbitState.current.radius * factor);
    needsRenderRef.current = true;
    setZoomPulseTrigger(p => p + 1);
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    orbitState.current.radius = 4.8;
    orbitState.current.quat.copy(quatFromSpherical(0.78, 1.15));
    orbitState.current.target.set(0, 0, 0);
    if (onZoomChange) onZoomChange(1.0);
    needsRenderRef.current = true;
    setZoomPulseTrigger(p => p + 1);
    updateCameraPosition();
  };

  // Auto-fit / frame model in viewport
  const handleAutoFitModel = useCallback(() => {
    if (!meshRef.current) return;
    meshRef.current.geometry.computeBoundingBox();
    meshRef.current.geometry.computeBoundingSphere();
    const sphere = meshRef.current.geometry.boundingSphere;
    if (!sphere) return;

    orbitState.current.target.copy(sphere.center);
    const r = Math.max(sphere.radius, 0.25);
    const fovRad = (45 * Math.PI) / 180;
    const dist = (r / Math.sin(fovRad / 2)) * 1.15;
    orbitState.current.radius = dist;
    if (onZoomChange) onZoomChange(1.0);
    needsRenderRef.current = true;
    setZoomPulseTrigger(p => p + 1);
    updateCameraPosition();
  }, [onZoomChange]);

  // Frame the selected part without changing the source mesh or its geometry.
  useEffect(() => {
    if (!frameMeshComponentTrigger || !meshRef.current) return;
    const geom = meshRef.current.geometry;
    const indices = (geom.userData?.componentIndices as Record<string, Uint32Array> | undefined)?.[frameMeshComponentTrigger.id];
    const positions = geom.getAttribute('position');
    if (!indices || !positions || indices.length === 0) return;
    const bounds = new THREE.Box3();
    const point = new THREE.Vector3();
    bounds.makeEmpty();
    for (let i = 0; i < indices.length; i++) {
      const vertex = indices[i];
      point.set(positions.getX(vertex), positions.getY(vertex), positions.getZ(vertex));
      bounds.expandByPoint(point);
    }
    if (bounds.isEmpty()) return;
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    orbitState.current.target.copy(sphere.center);
    const radius = Math.max(sphere.radius, 0.15);
    const fov = cameraPerspRef.current?.fov || 45;
    orbitState.current.radius = (radius / Math.sin(THREE.MathUtils.degToRad(fov / 2))) * 1.2;
    if (onZoomChange) onZoomChange(1.0);
    needsRenderRef.current = true;
    setZoomPulseTrigger(value => value + 1);
    updateCameraPosition();
  }, [frameMeshComponentTrigger, onZoomChange]);

  // Blender-style Drone Flight Navigator (WASD + QE + Shift boost)
  useEffect(() => {
    const handleDroneKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // Shift + ~ or Shift + ` toggles Blender Drone Navigator
      if (e.shiftKey && (e.key === '~' || e.key === '`')) {
        e.preventDefault();
        setIsDroneNavActive(prev => !prev);
        return;
      }

      const isNavigating = isDroneNavActive || orbitState.current.isOrbiting || orbitState.current.isPanning;
      if (!isNavigating) return;

      const camera = cameraPerspRef.current;
      if (!camera) return;

      const speed = (orbitState.current.radius / zoomFactor) * (e.shiftKey ? 0.08 : 0.035);
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      const forward = new THREE.Vector3();
      camera.matrixWorld.extractBasis(right, up, forward);
      forward.negate(); // In Three.js, camera looks along -Z

      let moved = false;
      const k = e.key.toLowerCase();
      if (k === 'w') {
        orbitState.current.target.addScaledVector(forward, speed);
        moved = true;
      } else if (k === 's') {
        orbitState.current.target.addScaledVector(forward, -speed);
        moved = true;
      } else if (k === 'a') {
        orbitState.current.target.addScaledVector(right, -speed);
        moved = true;
      } else if (k === 'd') {
        orbitState.current.target.addScaledVector(right, speed);
        moved = true;
      } else if (k === 'e') {
        orbitState.current.target.addScaledVector(up, speed);
        moved = true;
      } else if (k === 'q') {
        orbitState.current.target.addScaledVector(up, -speed);
        moved = true;
      }

      if (moved) {
        e.preventDefault();
        updateCameraPosition();
      }
    };

    window.addEventListener('keydown', handleDroneKeyDown);
    return () => window.removeEventListener('keydown', handleDroneKeyDown);
  }, [isDroneNavActive, zoomFactor]);

  const performXRayVertexSelection = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !meshRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const geom = meshRef.current.geometry;
    const pos = geom.getAttribute('position');
    if (!pos) return;

    const cam = isOrthoRef.current ? (cameraOrthoRef.current || cameraPerspRef.current!) : (cameraPerspRef.current || cameraOrthoRef.current!);
    if (!cam) return;

    const matrix = meshRef.current.matrixWorld;
    const nextSet = new Set(activeSelectedVerts);
    const isErase = e.shiftKey || e.altKey || e.button === 2 || e.buttons === 2;
    const rPx = 28;
    const rSq = rPx * rPx;

    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(matrix).project(cam);
      // In perspective, skip vertices behind the near plane
      if (v.z > 1.0) continue;
      const sx = ((v.x + 1) * 0.5) * rect.width;
      const sy = ((-v.y + 1) * 0.5) * rect.height;
      const dSq = (sx - mouseX) * (sx - mouseX) + (sy - mouseY) * (sy - mouseY);
      if (dSq <= rSq) {
        if (isErase) nextSet.delete(i);
        else nextSet.add(i);
      }
    }

    if (onUpdateSelectedVertices) {
      onUpdateSelectedVertices(nextSet);
    } else {
      setInternalSelectedVerts(nextSet);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    activePointers.current.set(e.pointerId, { 
      x: e.clientX, 
      y: e.clientY, 
      pointerType: e.pointerType 
    });

    if (isXRayBrushActive && (e.button === 0 || e.button === 2)) {
      performXRayVertexSelection(e);
      return;
    }

    if (activePointers.current.size >= 2) {
      if (isPaintingRef.current) {
        if (rafPaintHandleRef.current !== null) {
          cancelAnimationFrame(rafPaintHandleRef.current);
          rafPaintHandleRef.current = null;
        }
        flushPendingPaintEvents();
      }
      isPaintingRef.current = false;
      lastUVIslandIdRef.current = -1;
      lastCompositePaintPointRef.current = null;
      lastCompositeMirrorPointsRef.current = [];
      brushEngine.endStroke();
      const pts = Array.from(activePointers.current.values());
      pinchStartDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRadius.current = orbitState.current.radius;
      twoFingerStartMidpoint.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      return;
    }

    // Touch Navigation & Tool Execution Mode
    const hit = raycastUV(e);
    const isNavigationTool = activeTool === 'hand' || activeTool === 'zoom';
    const isExplicitOrbit = e.altKey || e.button === 1 || e.button === 2;

    // Orbit camera if explicit navigation, or if touching empty background space outside the mesh
    if (isExplicitOrbit || isNavigationTool || (!hit && (e.pointerType === 'mouse' || touchNavEnabled))) {
      if (e.shiftKey || activeTool === 'hand') {
        orbitState.current.isPanning = true;
      } else {
        orbitState.current.isOrbiting = true;
      }
      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;
      return;
    }

    // Direct 3D Surface Tool Execution (Works for ALL tools on touch, pen, or mouse)
    const targetLayer = layers.find(l => l.id === activeLayerId);
    if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

    if (hit) {
      const { uv, uvIslandId } = hit;
      isPaintingRef.current = true;
      lastUVIslandIdRef.current = uvIslandId;
      const pixelX = uv.x * targetLayer.canvas.width;
      const pixelY = (1 - uv.y) * targetLayer.canvas.height;

      if (activeTool === 'mask_brush') {
        const baseMask = selectionMask || {
          active: true,
          type: 'brush' as const,
          points: [],
          bounds: { x: pixelX, y: pixelY, width: brush.size, height: brush.size },
          inverted: false,
        };
        const updated = MaskEngine.paintMaskDab(
          baseMask,
          pixelX,
          pixelY,
          brush.size,
          brush.hardness || 50,
          false,
          targetLayer.canvas.width,
          targetLayer.canvas.height,
          uvIslandPathRef.current
        );
        if (onUpdateSelectionMask) onUpdateSelectionMask(updated);
        needsRenderRef.current = true;
        return;
      }

      lastCompositeMirrorPointsRef.current = [];
      brushEngine.beginStroke(pixelX, pixelY, e.pressure || 1.0);
      executePaintTool(targetLayer, pixelX, pixelY, e.pressure || 1.0);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { 
        x: e.clientX, 
        y: e.clientY, 
        pointerType: e.pointerType 
      });
    }

    if (isXRayBrushActive && (e.buttons === 1 || e.buttons === 2)) {
      performXRayVertexSelection(e);
      return;
    }

    // Multi-touch gestures (Pinch-to-zoom & two-finger pan)
    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);

      if (pinchStartDist.current && pinchStartDist.current > 0) {
        const ratio = pinchStartDist.current / currentDist;
        orbitState.current.radius = Math.max(1e-6, pinchStartRadius.current * ratio);
        setZoomPulseTrigger(p => p + 1);
      }

      const currentMidpoint = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      if (twoFingerStartMidpoint.current) {
        const dx = currentMidpoint.x - twoFingerStartMidpoint.current.x;
        const dy = currentMidpoint.y - twoFingerStartMidpoint.current.y;
        orbitState.current.target.x -= dx * 0.004;
        orbitState.current.target.y += dy * 0.004;
        twoFingerStartMidpoint.current = currentMidpoint;
      }

      needsRenderRef.current = true;
      updateCameraPosition();
      return;
    }

    if (orbitState.current.isOrbiting) {
      const dx = e.clientX - orbitState.current.lastMouseX;
      const dy = e.clientY - orbitState.current.lastMouseY;
      // Natural Blender Navigation:
      // Dragging right rotates the model clockwise (camera theta decreases).
      // Inverted flips the axis.
      const dirSign = invertNav ? 1 : -1;
      const baseSpeed = 0.005 * (navSensitivity !== undefined ? navSensitivity : 1.0);
      tumbleFreeCamera(orbitState.current, dx * dirSign, dy * dirSign, baseSpeed);
      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;
      updateCameraPosition();
      return;
    }

    if (orbitState.current.isPanning) {
      const dx = e.clientX - orbitState.current.lastMouseX;
      const dy = e.clientY - orbitState.current.lastMouseY;
      handlePanDelta(dx, dy);
      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;
      return;
    }

    if (isPaintingRef.current) {
      // Queue native pointer events and drain them once per animation frame.
      pendingPaintEventsRef.current.push(e.nativeEvent);
      if (rafPaintHandleRef.current === null) {
        rafPaintHandleRef.current = requestAnimationFrame(() => {
          rafPaintHandleRef.current = null;
          flushPendingPaintEvents();
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.delete(e.pointerId);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (activePointers.current.size < 2) {
      pinchStartDist.current = null;
      twoFingerStartMidpoint.current = null;
    }

    if (activePointers.current.size === 0) {
      orbitState.current.isOrbiting = false;
      orbitState.current.isPanning = false;
    }

    if (isPaintingRef.current) {
      // Include the final pointer position and drain every queued/coalesced event
      // before ending the stroke. Clearing this queue here used to drop the tail.
      pendingPaintEventsRef.current.push(e.nativeEvent);
      if (rafPaintHandleRef.current !== null) {
        cancelAnimationFrame(rafPaintHandleRef.current);
        rafPaintHandleRef.current = null;
      }
      flushPendingPaintEvents();

      isPaintingRef.current = false;
      lastUVIslandIdRef.current = -1;
      lastCompositePaintPointRef.current = null;
      lastCompositeMirrorPointsRef.current = [];
      brushEngine.endStroke();
      clearStabilizerTether();
      if (dynamicTextureRef.current) {
        dynamicTextureRef.current.generateMipmaps = true;
        dynamicTextureRef.current.minFilter = THREE.LinearMipmapLinearFilter;
        dynamicTextureRef.current.needsUpdate = true;
      }
      needsRenderRef.current = true;
      onTextureUpdated();
      undoBuffer.pushState(`${brush.name} 3D Paint`, layers);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Smooth proportional zoom nearly infinitely in and out
    const factor = Math.exp(e.deltaY * 0.0012);
    orbitState.current.radius = Math.max(1e-6, orbitState.current.radius * factor);
    needsRenderRef.current = true;
    setZoomPulseTrigger(p => p + 1);
    updateCameraPosition();
  };

  const raycastUV = (e: React.PointerEvent<HTMLCanvasElement>): { uv: THREE.Vector2; faceIndex: number; uvIslandId: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas || !meshRef.current || !cameraPerspRef.current) return null;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    let ndcX = (mouseX / w) * 2 - 1;
    let ndcY = -(mouseY / h) * 2 + 1;
    let cam: THREE.Camera = isOrtho ? cameraOrthoRef.current! : cameraPerspRef.current!;

    // In Quad View, detect the quadrant and use that specific camera
    if (viewLayout === 'quad' && quadCamerasRef.current) {
      const halfW = w / 2;
      const halfH = h / 2;
      if (mouseX < halfW && mouseY < halfH) {
        // Top-Left: Top Ortho
        ndcX = (mouseX / halfW) * 2 - 1;
        ndcY = -(mouseY / halfH) * 2 + 1;
        cam = quadCamerasRef.current.top;
      } else if (mouseX >= halfW && mouseY < halfH) {
        // Top-Right: Front Ortho
        ndcX = ((mouseX - halfW) / halfW) * 2 - 1;
        ndcY = -(mouseY / halfH) * 2 + 1;
        cam = quadCamerasRef.current.front;
      } else if (mouseX < halfW && mouseY >= halfH) {
        // Bottom-Left: Right Ortho
        ndcX = (mouseX / halfW) * 2 - 1;
        ndcY = -((mouseY - halfH) / halfH) * 2 + 1;
        cam = quadCamerasRef.current.right;
      } else {
        // Bottom-Right: User Persp
        ndcX = ((mouseX - halfW) / halfW) * 2 - 1;
        ndcY = -((mouseY - halfH) / halfH) * 2 + 1;
        cam = cameraPerspRef.current!;
      }
    }

    raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);

    const intersects = raycaster.current.intersectObject(meshRef.current);
    if (intersects.length > 0 && intersects[0].uv) {
      const faceIndex = intersects[0].faceIndex ?? -1;
      const activeUVArray = activeUVChannel
        ? meshRef.current.geometry.userData?.uvChannels?.[activeUVChannel] as Float32Array | undefined
        : undefined;
      const islandIds = faceIndex >= 0
        ? getUVIslandIds(meshRef.current.geometry, activeUVArray, uvGeometryVersion)
        : null;
      const uvIslandId = islandIds && faceIndex < islandIds.length ? islandIds[faceIndex] : -1;
      return { uv: intersects[0].uv, faceIndex, uvIslandId };
    }
    return null;
  };

  const executePaintTool = (layer: Layer, x: number, y: number, pressure: number) => {
    // 1. Temporary Selection Mask: Only allow painting inside selection
    if (selectionMask && selectionMask.active && !SelectionTool.isPointInSelection(x, y, selectionMask)) {
      return;
    }

    const ctx = layer.ctx;

    const applyDabAt = (dx: number, dy: number, strokeKey = 'primary') => {
      ctx.save();
      if (uvIslandPathRef.current) ctx.clip(uvIslandPathRef.current);
      if (activeTool === 'brush') {
        brushEngine.paintDabs(ctx, dx, dy, brush, pressure, false, strokeKey);
      } else if (activeTool === 'eraser') {
        brushEngine.paintDabs(ctx, dx, dy, brush, pressure, true, strokeKey);
      } else if (activeTool === 'pen') {
        brushEngine.paintDabs(ctx, dx, dy, { ...brush, hardness: 100, size: Math.max(2, brush.size * 0.4) }, pressure, false, strokeKey);
      } else if (activeTool === 'blur') {
        brushEngine.applyBlurAt(ctx, dx, dy, brush);
      } else if (activeTool === 'clone') {
        brushEngine.applyCloneStampAt(ctx, dx, dy, brush);
      } else if (activeTool === 'smudge') {
        brushEngine.applySmudgeAt(ctx, dx, dy, dx, dy, brush, strokeKey);
      } else if (activeTool === 'bucket') {
        FillSuite.applyBucketFill(ctx, brush.color, brush.opacity);
      } else if (activeTool === 'gradient_linear') {
        FillSuite.applyLinearGradient(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, brush.color, '#1a1a1a', brush.opacity);
      } else if (activeTool === 'gradient_radial') {
        FillSuite.applyRadialGradient(ctx, dx, dy, dx + brush.size * 3.5, dy, brush.color, 'transparent', brush.opacity);
      } else if (activeTool === 'pattern_stamp' || activeTool === 'stamp_decal') {
        if (patternStampConfig) {
          PatternStampEngine.stampOnCanvas(ctx, dx / ctx.canvas.width, dy / ctx.canvas.height, patternStampConfig);
        }
      } else if (activeTool === 'eyedropper' && onColorSampled) {
        const p = ctx.getImageData(Math.floor(dx), Math.floor(dy), 1, 1).data;
        const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
        onColorSampled(hex);
      }
      ctx.restore();
    };

    // Primary stroke dab. Retain the previous input point so the dirty
    // composite covers the complete interpolated dab trail, not just its end.
    const previousPaintPoint = lastCompositePaintPointRef.current || { x, y };
    const previousMirrorPaintPoints = lastCompositeMirrorPointsRef.current;
    lastCompositePaintPointRef.current = { x, y };
    applyDabAt(x, y);
    const changedPoints: { x: number; y: number }[] = [{ x, y }];

    // 2. Real-time Multi-Axis Symmetry Mirror Stroke Dab
    const axes = symmetryConfig?.axes || (isSymmetryX ? { X: true, Y: false, Z: false } : { X: false, Y: false, Z: false });
    const hasAnyAxis = Boolean(axes.X || axes.Y || axes.Z);
    const isMirrorActive = symmetryConfig ? (symmetryConfig.activeRealtimeMirror && hasAnyAxis) : (isSymmetryX && hasAnyAxis);

    if (isMirrorActive) {
      const activeAxes: SymmetryAxis[] = [];
      if (axes.X) activeAxes.push('X');
      if (axes.Y) activeAxes.push('Y');
      if (axes.Z) activeAxes.push('Z');

      const mirroredCoords: { x: number; y: number; strokeKey: string }[] = [];

      activeAxes.forEach(ax => {
        const subCfg: SymmetryConfig = {
          axis: ax,
          direction: symmetryConfig?.direction || '+ to -',
          originMode: symmetryConfig?.originMode || 'mesh_origin',
          locatorValue: symmetryConfig?.locatorValue ?? 0,
          activeRealtimeMirror: true,
          showVirtualCursorPlane: false,
          axes: axes,
        };
        const pt = SymmetryEngine.getMirroredCoord(x, y, subCfg, layer.canvas.width, layer.canvas.height);
        mirroredCoords.push({ ...pt, strokeKey: `mirror-${ax}` });
      });

      // Diagonal cross-mirror if both X and Y are checked
      if (axes.X && axes.Y) {
        const xCfg = { ...symmetryConfig, axis: 'X' as const } as SymmetryConfig;
        const yCfg = { ...symmetryConfig, axis: 'Y' as const } as SymmetryConfig;
        const ptX = SymmetryEngine.getMirroredCoord(x, y, xCfg, layer.canvas.width, layer.canvas.height);
        const ptXY = SymmetryEngine.getMirroredCoord(ptX.x, ptX.y, yCfg, layer.canvas.width, layer.canvas.height);
        mirroredCoords.push({ ...ptXY, strokeKey: 'mirror-XY' });
      }

      mirroredCoords.forEach(m => {
        if (!selectionMask || !selectionMask.active || SelectionTool.isPointInSelection(m.x, m.y, selectionMask)) {
          applyDabAt(m.x, m.y, m.strokeKey);
          changedPoints.push({ x: m.x, y: m.y });
        }
      });
      lastCompositeMirrorPointsRef.current = mirroredCoords.map(({ x: mx, y: my }) => ({ x: mx, y: my }));
    } else {
      lastCompositeMirrorPointsRef.current = [];
    }

    // Update only the painted area in the canonical colour composite. The old
    // path copied the complete active 1K texture on every dab; destination-out
    // erasing also needs the region recomposited from every visible layer so
    // lower layers show through correctly.
    const regionTools = ['brush', 'eraser', 'pen', 'blur', 'clone', 'smudge'];
    if (compositeCanvas && regionTools.includes(activeTool) && brush.strokeType !== 'dragged-dot') {
      const cctx = compositeCanvas.getContext('2d');
      if (cctx) {
        const radius = Math.max(4, brush.size * 3 + 4);
        const width = compositeCanvas.width;
        const height = compositeCanvas.height;
        const trailPoints = [previousPaintPoint, ...previousMirrorPaintPoints, ...changedPoints];
        const left = Math.max(0, Math.floor(Math.min(...trailPoints.map(point => point.x)) - radius));
        const top = Math.max(0, Math.floor(Math.min(...trailPoints.map(point => point.y)) - radius));
        const right = Math.min(width, Math.ceil(Math.max(...trailPoints.map(point => point.x)) + radius));
        const bottom = Math.min(height, Math.ceil(Math.max(...trailPoints.map(point => point.y)) + radius));
        const dirtyWidth = right - left;
        const dirtyHeight = bottom - top;
        if (dirtyWidth > 0 && dirtyHeight > 0) {
          cctx.save();
          cctx.beginPath();
          cctx.rect(left, top, dirtyWidth, dirtyHeight);
          cctx.clip();
          cctx.clearRect(left, top, dirtyWidth, dirtyHeight);
          cctx.fillStyle = '#2b2b2b';
          cctx.fillRect(left, top, dirtyWidth, dirtyHeight);

          for (const candidate of layers) {
            if (!candidate.visible || candidate.isGroup) continue;
            if (candidate.groupId) {
              const parent = layers.find(item => item.id === candidate.groupId);
              if (parent && !parent.visible) continue;
            }
            const pbr = candidate.pbrSettings || ({} as any);
            const colorOn = pbr.colorOn ?? !['height', 'normal', 'emission', 'roughness'].includes(candidate.channel);
            const influence = Math.max(0, Math.min(1, pbr.colorInfluence ?? 1));
            if (!colorOn || influence <= 0) continue;

            cctx.save();
            cctx.globalAlpha = (candidate.opacity / 100) * influence;
            switch (candidate.blendMode) {
              case 'multiply': cctx.globalCompositeOperation = 'multiply'; break;
              case 'screen': cctx.globalCompositeOperation = 'screen'; break;
              case 'overlay': cctx.globalCompositeOperation = 'overlay'; break;
              case 'darken': cctx.globalCompositeOperation = 'darken'; break;
              case 'lighten': cctx.globalCompositeOperation = 'lighten'; break;
              case 'hard_light': cctx.globalCompositeOperation = 'hard-light'; break;
              case 'soft_light': cctx.globalCompositeOperation = 'soft-light'; break;
              case 'difference': cctx.globalCompositeOperation = 'difference'; break;
              default: cctx.globalCompositeOperation = 'source-over'; break;
            }
            const sourceLeft = (left / width) * candidate.canvas.width;
            const sourceTop = (top / height) * candidate.canvas.height;
            const sourceWidth = (dirtyWidth / width) * candidate.canvas.width;
            const sourceHeight = (dirtyHeight / height) * candidate.canvas.height;
            cctx.drawImage(candidate.canvas, sourceLeft, sourceTop, sourceWidth, sourceHeight, left, top, dirtyWidth, dirtyHeight);
            cctx.restore();
          }
          cctx.restore();
        }
      }
    } else if (compositeCanvas) {
      // Large-area tools keep the full-composite path; they are infrequent and
      // may change pixels outside a brush-sized region.
      const cctx = compositeCanvas.getContext('2d');
      if (cctx) {
        cctx.save();
        cctx.fillStyle = '#2b2b2b';
        cctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
        for (const candidate of layers) {
          if (!candidate.visible || candidate.isGroup) continue;
          if (candidate.groupId) {
            const parent = layers.find(item => item.id === candidate.groupId);
            if (parent && !parent.visible) continue;
          }
          const pbr = candidate.pbrSettings || ({} as any);
          const colorOn = pbr.colorOn ?? !['height', 'normal', 'emission', 'roughness'].includes(candidate.channel);
          const influence = Math.max(0, Math.min(1, pbr.colorInfluence ?? 1));
          if (!colorOn || influence <= 0) continue;
          cctx.save();
          cctx.globalAlpha = (candidate.opacity / 100) * influence;
          cctx.globalCompositeOperation = candidate.blendMode === 'multiply' ? 'multiply'
            : candidate.blendMode === 'screen' ? 'screen'
            : candidate.blendMode === 'overlay' ? 'overlay'
            : candidate.blendMode === 'darken' ? 'darken'
            : candidate.blendMode === 'lighten' ? 'lighten'
            : candidate.blendMode === 'hard_light' ? 'hard-light'
            : candidate.blendMode === 'soft_light' ? 'soft-light'
            : candidate.blendMode === 'difference' ? 'difference'
            : 'source-over';
          cctx.drawImage(candidate.canvas, 0, 0);
          cctx.restore();
        }
        cctx.restore();
      }
    }
    if (dynamicTextureRef.current) {
      dynamicTextureRef.current.generateMipmaps = false;
      dynamicTextureRef.current.minFilter = THREE.LinearFilter;
      dynamicTextureRef.current.needsUpdate = true;
    }
    needsRenderRef.current = true;
  };

  const flushPendingPaintEvents = () => {
    const events = pendingPaintEventsRef.current;
    pendingPaintEventsRef.current = [];
    if (events.length === 0) return;

    const coalesced: PointerEvent[] = [];
    for (const event of events) {
      if (typeof event.getCoalescedEvents === 'function') {
        const samples = event.getCoalescedEvents();
        if (samples.length > 0) {
          coalesced.push(...samples);
          continue;
        }
      }
      coalesced.push(event);
    }

    const targetLayer = layers.find(layer => layer.id === activeLayerId);
    if (!targetLayer) return;

    for (const event of coalesced) {
      const synth = event as unknown as React.PointerEvent<HTMLCanvasElement>;
      const hit = raycastUV(synth);
      if (!hit) {
        lastUVIslandIdRef.current = -1;
        resetPaintPaths();
        continue;
      }

      const { uv, uvIslandId } = hit;
      const targetX = uv.x * targetLayer.canvas.width;
      const targetY = (1 - uv.y) * targetLayer.canvas.height;

      if (activeTool === 'mask_brush') {
        const baseMask = selectionMask || {
          active: true,
          type: 'brush' as const,
          points: [],
          bounds: { x: targetX, y: targetY, width: brush.size, height: brush.size },
          inverted: false,
        };
        const updated = MaskEngine.paintMaskDab(
          baseMask,
          targetX,
          targetY,
          brush.size,
          brush.hardness || 50,
          false,
          targetLayer.canvas.width,
          targetLayer.canvas.height,
          uvIslandPathRef.current
        );
        if (onUpdateSelectionMask) onUpdateSelectionMask(updated);
        lastUVIslandIdRef.current = uvIslandId;
        needsRenderRef.current = true;
        continue;
      }

      const previousIsland = lastUVIslandIdRef.current;
      const crossedUVIsland = previousIsland >= 0 && uvIslandId >= 0 && uvIslandId !== previousIsland;
      if (crossedUVIsland) {
        // Start a fresh path at the corresponding UV location. Do not infer
        // seams from face-index ordering; triangle order is not topological.
        resetPaintPaths(targetX, targetY);
        lastUVIslandIdRef.current = uvIslandId;
        executePaintTool(targetLayer, targetX, targetY, event.pressure || 1.0);
        drawStabilizerTether(synth, { x: targetX, y: targetY }, targetLayer);
        continue;
      }

      lastUVIslandIdRef.current = uvIslandId;
      const stabilized = brushEngine.updateStabilizer(targetX, targetY, brush.stabilizer);
      const lastDab = brushEngine.getLastDabPos();
      const jumped = lastDab != null &&
        Math.hypot(stabilized.x - lastDab.x, stabilized.y - lastDab.y) > brush.size * 4;
      if (!jumped) {
        executePaintTool(targetLayer, stabilized.x, stabilized.y, event.pressure || 1.0);
        drawStabilizerTether(synth, stabilized, targetLayer);
      }
    }
  };

  const drawStabilizerTether = (
    e: React.PointerEvent,
    stabilized: { x: number; y: number },
    layer: Layer
  ) => {
    const tether = tetherCanvasRef.current;
    if (!tether) return;
    const ctx = tether.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, tether.width, tether.height);
    if (brush.stabilizer <= 10) return;

    const rect = tether.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3d7fb8';
    ctx.fill();

    ctx.strokeStyle = 'rgba(61, 127, 184, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cursorX, cursorY);
    ctx.lineTo(cursorX - 8, cursorY - 8);
    ctx.stroke();
  };

  const clearStabilizerTether = () => {
    const tether = tetherCanvasRef.current;
    if (tether) {
      const ctx = tether.getContext('2d');
      ctx?.clearRect(0, 0, tether.width, tether.height);
    }
  };

  return (
    <div 
      ref={mountRef} 
      className="relative w-full h-full bg-[#202020] overflow-hidden select-none touch-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-crosshair block touch-none"
      />

      {/* Overlay Canvas for Stabilizer Tether & Guides */}
      <canvas
        ref={tetherCanvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
      />

      {/* Authentic Square 3D Orientation Box Gizmo */}
      {showGizmo && (
        <BoxGizmo
          rotation={boxRotation}
          onSnapView={snapToView}
          onFlipView={handleFlipView}
          onPanDelta={handlePanDelta}
          onZoomDelta={handleZoomDelta}
          onToggleOrtho={onToggleOrtho}
          onResetCamera={handleResetCamera}
          onAutoFit={handleAutoFitModel}
          isOrtho={isOrtho}
          touchNavEnabled={touchNavEnabled}
          onToggleTouchNav={onToggleTouchNav}
          invertNav={invertNav}
          onToggleInvertNav={handleToggleInvertNav}
          gizmoStyle={gizmoStyle}
          gizmoSizePercent={gizmoSizePercent}
          zoomPulseTrigger={zoomPulseTrigger}
        />
      )}

      {/* Top Controls: Viewport Layout & HDRI Environment Settings */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 select-none">
        <div className="flex items-center gap-1.5 bg-[#252525]/90 px-2 py-1 rounded border border-[#444] shadow-md backdrop-blur-xs">
          <LayoutGrid className="w-3.5 h-3.5 text-[#3d7fb8]" />
          <select
            value={viewLayout}
            onChange={(e) => onSelectViewLayout ? onSelectViewLayout(e.target.value as any) : setInternalViewLayout(e.target.value as any)}
            className="bg-[#1e1e1e] border border-[#555] text-white text-[11px] rounded px-1.5 py-0.5 outline-none font-medium cursor-pointer"
            title="Viewport Layout: Perspective View vs Quad View (Blender 4-way)"
          >
            <option value="perspective">Perspective View</option>
            <option value="quad">Quad View (4-Way)</option>
          </select>
        </div>

        {/* 3D X-Ray Vertex Selection Brush Toggle Button */}
        <div className="flex items-center gap-1 bg-[#252525]/90 px-1.5 py-1 rounded border border-[#444] shadow-md backdrop-blur-xs">
          <button
            onClick={() => onToggleXRayBrush ? onToggleXRayBrush() : undefined}
            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 transition-colors border ${
              isXRayBrushActive
                ? 'bg-[#1e3a5f] text-[#38bdf8] border-[#38bdf8] shadow-xs'
                : 'bg-[#333] hover:bg-[#3e3e3e] text-[#aaa] border-[#555]'
            }`}
            title="3D X-Ray Vertex Brush for UV Symmetrize (Drag across mesh to select vertices through depth)"
          >
            <Sparkles className="w-3 h-3 text-[#38bdf8]" />
            <span>X-Ray Brush: {isXRayBrushActive ? 'ON' : 'OFF'}</span>
          </button>
          {activeSelectedVerts.size > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-[#38bdf8] px-1">{activeSelectedVerts.size}v</span>
              <button
                onClick={() => {
                  if (onUpdateSelectedVertices) onUpdateSelectedVertices(new Set());
                  else setInternalSelectedVerts(new Set());
                }}
                className="px-1 py-0.5 bg-[#444] hover:bg-[#555] text-[#ccc] rounded text-[9px]"
                title="Clear selected vertices"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* HDRI Environment & Reflection Controls Button */}
        <div className="relative">
          <button
            onClick={() => setShowHdriPopover(p => !p)}
            className={`px-2 py-1 rounded border text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-md backdrop-blur-xs ${
              hdri.enabled
                ? 'bg-[#1b3a5a] text-[#89b4fa] border-[#3d7fb8]'
                : 'bg-[#252525]/90 text-[#aaa] border-[#444] hover:text-white'
            }`}
            title="HDRI Reflections, Equirectangular Environment & Viewport Lighting"
          >
            <Sun className={`w-3.5 h-3.5 ${hdri.enabled ? 'text-[#ffc83b]' : 'text-[#888]'}`} />
            <span>HDRI {hdri.enabled ? (hdri.lightViewport ? 'Light+Refl' : 'Refl Only') : 'Off'}</span>
          </button>

          {showHdriPopover && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#282828] border border-[#555] rounded-md shadow-2xl p-2.5 z-50 text-[11px] text-[#ccc] space-y-2 cs5-outset">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#444]">
                <span className="font-bold text-[#eee] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#3d7fb8]" />
                  HDRI Environment
                </span>
                <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hdri.enabled}
                    onChange={(e) => updateHdri({ enabled: e.target.checked })}
                    className="accent-[#3d7fb8]"
                  />
                  <span>Active</span>
                </label>
              </div>

              {/* Equirectangular Map Preset */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#aaa] block">Environment Map:</label>
                <select
                  value={hdri.preset}
                  onChange={(e) => updateHdri({ preset: e.target.value as any })}
                  className="w-full bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-[10px]"
                >
                  <option value="studio">Studio Neutral Softbox</option>
                  <option value="sunset">Warm Golden Sunset</option>
                  <option value="cyberpunk">Cyberpunk Neon Horizon</option>
                  <option value="outdoor">Daylight Sky &amp; Horizon</option>
                  <option value="custom">Custom Image Upload</option>
                </select>
              </div>

              {hdri.preset === 'custom' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] text-[#aaa] block">Upload Panorama Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            updateHdri({ customUrl: ev.target.result as string });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-[10px] text-[#888]"
                  />
                </div>
              )}

              {/* Checkbox: Use HDRI to light main viewport vs reflections only */}
              <label className="flex items-center gap-2 p-1.5 bg-[#202020] rounded border border-[#3c3c3c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hdri.lightViewport}
                  onChange={(e) => updateHdri({ lightViewport: e.target.checked })}
                  className="accent-[#3d7fb8]"
                />
                <span className="text-[10px] text-[#eee] leading-tight">
                  Use HDRI to light main viewport
                  <span className="block text-[9px] text-[#888]">
                    {hdri.lightViewport ? 'Full scene irradiance lighting' : 'Reflections only (3-point lights active)'}
                  </span>
                </span>
              </label>

              {/* Checkbox: Blurred Panoramic Background */}
              <label className="flex items-center gap-2 p-1.5 bg-[#202020] rounded border border-[#3c3c3c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hdri.blurredBackground}
                  onChange={(e) => updateHdri({ blurredBackground: e.target.checked })}
                  className="accent-[#3d7fb8]"
                />
                <span className="text-[10px] text-[#eee]">Blurred Background Map</span>
              </label>

              {/* Sliders: Blur & Reflection Intensity */}
              {hdri.blurredBackground && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#aaa]">Background Blur:</span>
                    <span className="font-mono text-[#89b4fa]">{Math.round(hdri.backgroundBlur * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={hdri.backgroundBlur}
                    onChange={(e) => updateHdri({ backgroundBlur: Number(e.target.value) })}
                    className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Reflection Intensity:</span>
                  <span className="font-mono text-[#a6e3a1]">{hdri.intensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={hdri.intensity}
                  onChange={(e) => updateHdri({ intensity: Number(e.target.value) })}
                  className="w-full accent-[#a6e3a1] h-1.5 cursor-pointer"
                />
              </div>

              <div className="text-[9px] text-[#777] font-mono border-t border-[#444] pt-1 leading-tight">
                Reflections sampled via R = reflect(-V, N)
              </div>
            </div>
          )}
        </div>

        {/* Bloom Post-Processing Pass Controls Button */}
        <div className="relative">
          <button
            onClick={() => setShowBloomPopover(p => !p)}
            className={`px-2 py-1 rounded border text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-md backdrop-blur-xs cursor-pointer ${
              bloom.enabled
                ? 'bg-[#40192e] text-[#f49bb8] border-[#ec4899]'
                : 'bg-[#252525]/90 text-[#aaa] border-[#444] hover:text-white'
            }`}
            title="UnrealBloomPass Post-Processing: Enhance glowing emissive materials"
          >
            <Zap className={`w-3.5 h-3.5 ${bloom.enabled ? 'text-[#ec4899] animate-pulse' : 'text-[#888]'}`} />
            <span>Bloom {bloom.enabled ? `${bloom.strength.toFixed(1)}x` : 'Off'}</span>
          </button>

          {showBloomPopover && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#282828] border border-[#555] rounded-md shadow-2xl p-2.5 z-50 text-[11px] text-[#ccc] space-y-2 cs5-outset">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#444]">
                <span className="font-bold text-[#eee] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#ec4899]" />
                  Bloom Post-Processing
                </span>
                <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bloom.enabled}
                    onChange={(e) => updateBloom({ enabled: e.target.checked })}
                    className="accent-[#ec4899]"
                  />
                  <span>Active</span>
                </label>
              </div>

              {/* Bloom Strength */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Bloom Strength:</span>
                  <span className="font-mono text-[#ec4899]">{bloom.strength.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={bloom.strength}
                  onChange={(e) => updateBloom({ strength: Number(e.target.value) })}
                  className="w-full accent-[#ec4899] h-1.5 cursor-pointer"
                />
              </div>

              {/* Bloom Radius */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Bloom Radius:</span>
                  <span className="font-mono text-[#89b4fa]">{bloom.radius.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.5"
                  step="0.05"
                  value={bloom.radius}
                  onChange={(e) => updateBloom({ radius: Number(e.target.value) })}
                  className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
                />
              </div>

              {/* Bloom Threshold */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Luminance Threshold:</span>
                  <span className="font-mono text-[#a6e3a1]">{bloom.threshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.02"
                  value={bloom.threshold}
                  onChange={(e) => updateBloom({ threshold: Number(e.target.value) })}
                  className="w-full accent-[#a6e3a1] h-1.5 cursor-pointer"
                />
              </div>

              {/* Quick Presets */}
              <div className="pt-1.5 border-t border-[#444] space-y-1">
                <span className="text-[9px] text-[#888] uppercase tracking-wider block font-bold">Presets:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <button
                    onClick={() => updateBloom({ enabled: true, strength: 1.4, radius: 0.45, threshold: 0.15 })}
                    className="px-1.5 py-0.5 bg-[#333] hover:bg-[#444] text-[#eee] rounded border border-[#555] text-left cursor-pointer"
                  >
                    Radiant Neon
                  </button>
                  <button
                    onClick={() => updateBloom({ enabled: true, strength: 0.8, radius: 0.3, threshold: 0.3 })}
                    className="px-1.5 py-0.5 bg-[#333] hover:bg-[#444] text-[#eee] rounded border border-[#555] text-left cursor-pointer"
                  >
                    Soft Glow
                  </button>
                  <button
                    onClick={() => updateBloom({ enabled: true, strength: 2.5, radius: 0.8, threshold: 0.05 })}
                    className="px-1.5 py-0.5 bg-[#333] hover:bg-[#444] text-[#eee] rounded border border-[#555] text-left cursor-pointer"
                  >
                    Cyberpunk Max
                  </button>
                  <button
                    onClick={() => updateBloom({ enabled: true, strength: 0.4, radius: 0.2, threshold: 0.5 })}
                    className="px-1.5 py-0.5 bg-[#333] hover:bg-[#444] text-[#eee] rounded border border-[#555] text-left cursor-pointer"
                  >
                    Subtle Shimmer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Physical Selection Shading Status in 3D Viewport */}
        {selectionMask && selectionMask.active && (
          <div className="bg-[#141824]/90 text-[#89b4fa] font-mono text-[10px] px-2 py-1 rounded border border-[#3d7fb8] shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1] animate-pulse" />
            <span className="font-bold text-[#eee]">Selection Mask:</span>
            <span className="text-[#a6e3a1]">Shaded Light (Editable)</span>
            <span className="text-[#666]">|</span>
            <span className="text-[#aaa]">Shaded Dark (Protected)</span>
          </div>
        )}
      </div>

      {/* Quad Viewport Overlays when in Quad View Mode */}
      {viewLayout === 'quad' && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
          {/* Top Half */}
          <div className="flex-1 flex border-b border-[#444]/70">
            {/* Top-Left: Top Ortho */}
            <div className="flex-1 relative border-r border-[#444]/70 p-2 flex items-start justify-end">
              <span className="bg-[#181818]/90 text-[#a6e3a1] font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-[#333] shadow-xs">
                TOP ORTHO
              </span>
            </div>
            {/* Top-Right: Front Ortho */}
            <div className="flex-1 relative p-2 flex items-start justify-end">
              <span className="bg-[#181818]/90 text-[#89b4fa] font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-[#333] shadow-xs">
                FRONT ORTHO
              </span>
            </div>
          </div>
          {/* Bottom Half */}
          <div className="flex-1 flex">
            {/* Bottom-Left: Right Ortho */}
            <div className="flex-1 relative border-r border-[#444]/70 p-2 flex items-start justify-end">
              <span className="bg-[#181818]/90 text-[#f38ba8] font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-[#333] shadow-xs">
                RIGHT ORTHO
              </span>
            </div>
            {/* Bottom-Right: User Persp */}
            <div className="flex-1 relative p-2 flex items-start justify-end">
              <span className="bg-[#181818]/90 text-[#f9e2af] font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-[#333] shadow-xs">
                USER PERSP
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drone Flight Mode & Navigation Axis Quick Toggles */}
      <div className="absolute top-12 left-3 z-20 flex items-center gap-1.5">
        <button
          onClick={() => setIsDroneNavActive(d => !d)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors shadow-xs ${
            isDroneNavActive
              ? 'bg-[#fab387]/25 border-[#fab387] text-[#fab387]'
              : 'bg-[#242424]/85 hover:bg-[#333] border-[#444] text-[#aaa]'
          }`}
          title="Blender Drone Navigation Mode (Shift + ~). Controls: WASD to fly, QE for elevation, Shift to boost, Alt / Middle-Mouse to freelook."
        >
          <Compass className="w-3 h-3" />
          <span>Drone Nav {isDroneNavActive ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={handleToggleInvertNav}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors shadow-xs ${
            invertNav
              ? 'bg-[#89b4fa]/25 border-[#89b4fa] text-[#89b4fa]'
              : 'bg-[#242424]/85 hover:bg-[#333] border-[#444] text-[#aaa]'
          }`}
          title="Toggle Navigation Axis Direction (Inverts orbit and drone freelook)"
        >
          <span>⇄</span>
          <span>Axis: {invertNav ? 'INVERTED' : 'NATURAL'}</span>
        </button>
      </div>

      {/* Bottom Viewport Info Bar */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 text-[10px] text-[#888] font-mono bg-[#282828]/85 px-2.5 py-1 rounded border border-[#404040] pointer-events-none">
        <span>MODEL: {modelKey.toUpperCase()}</span>
        <span>·</span>
        <span>SHADING: {shadingMode.toUpperCase()}</span>
        <span>·</span>
        <span className="text-[#89b4fa] font-bold">VIEW: {viewLayout.toUpperCase()}</span>
        <span>·</span>
        <span className={touchNavEnabled ? 'text-[#3d7fb8] font-bold' : 'text-[#888]'}>
          {touchNavEnabled ? 'TOUCH NAV ACTIVE' : 'DIRECT PAINT'}
        </span>
        <span>·</span>
        <span className={isDroneNavActive ? 'text-[#fab387] font-bold' : 'text-[#888]'}>
          {isDroneNavActive ? 'DRONE: WASD+QE ACTIVE' : 'DRONE: ALT/MMB TO FLY'}
        </span>
        <span>·</span>
        <span className={invertNav ? 'text-[#89b4fa] font-bold' : 'text-[#888]'}>
          AXIS: {invertNav ? 'INVERTED' : 'NATURAL'}
        </span>
        <span>·</span>
        <span className="text-[#a6e3a1]">{showGizmo ? 'GIZMO: ON' : 'GIZMO: HIDDEN'}</span>
      </div>
    </div>
  );
};
