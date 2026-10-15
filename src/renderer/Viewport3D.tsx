/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Main 3D Viewport with Blender 2.8+ Navigation & Surface Painting
 * Created by Victory Ukpong
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  ToolType, 
  BrushPreset, 
  Layer, 
  ViewportShadingMode,
  SelectionMask,
  HDRISettings,
  ThemeMode,
  BloomSettings,
} from '../core/types';
import { BrushEngine } from '../tools/brushEngine';
import { SelectionTool } from '../tools/selectionTool';
import { SymmetryConfig, SymmetryEngine, SymmetryAxis } from '../tools/symmetryEngine';
import { MaskEngine } from '../tools/maskEngine';
import { HDRIManager, HDRIPreset } from './hdriManager';
import { UndoRingBuffer } from '../core/history';
import { BoxGizmo } from './boxGizmo';
import { FillSuite } from '../tools/fillSuite';
import { BUILTIN_MODELS, parseOBJ } from './modelGeometry';
import { SurfaceShadingEngine, SurfaceShadingType } from './surfaceShading';
import { LayoutGrid, Sun, Sparkles, Sliders, Image, Check, Zap } from 'lucide-react';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface Viewport3DProps {
  layers: Layer[];
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
  isSymmetryX?: boolean;
  selectionMask?: SelectionMask | null;
  onUpdateSelectionMask?: (mask: SelectionMask | null) => void;
  symmetryConfig?: SymmetryConfig;
  hdriSettings?: HDRISettings;
  onUpdateHDRISettings?: (settings: Partial<HDRISettings>) => void;
  bloomSettings?: BloomSettings;
  onUpdateBloomSettings?: (settings: Partial<BloomSettings>) => void;
  currentTheme?: ThemeMode;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  layers,
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
  isSymmetryX = false,
  selectionMask = null,
  onUpdateSelectionMask,
  symmetryConfig,
  hdriSettings: controlledHdriSettings,
  onUpdateHDRISettings,
  bloomSettings: controlledBloomSettings,
  onUpdateBloomSettings,
  currentTheme = 'cs5',
}) => {
  const [internalViewLayout, setInternalViewLayout] = useState<'perspective' | 'quad'>('perspective');
  const viewLayout = controlledViewLayout || internalViewLayout;
  const viewLayoutRef = useRef<'perspective' | 'quad'>(viewLayout);
  viewLayoutRef.current = viewLayout;

  const isOrthoRef = useRef<boolean>(isOrtho);
  isOrthoRef.current = isOrtho;

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
  const dynamicTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Multi-Touch tracking for Android / WASM touch navigation
  const activePointers = useRef<Map<number, { x: number; y: number; pointerType: string }>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartRadius = useRef<number>(4.8);
  const twoFingerStartMidpoint = useRef<{ x: number; y: number } | null>(null);

  // Camera Orbit State (Zero rotation lock - smooth intuitive navigation always!)
  const orbitState = useRef({
    radius: 4.8,
    theta: 0.78, // Y-axis angle
    phi: 1.15,   // X-axis angle
    target: new THREE.Vector3(0, 0, 0),
    isOrbiting: false,
    isPanning: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const [boxRotation, setBoxRotation] = useState({ x: 0, y: 0 });
  const isPaintingRef = useRef(false);
  const brushEngine = BrushEngine.getInstance();
  const raycaster = useRef(new THREE.Raycaster());

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

  // Light refs for HDRI light toggling
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Composite texture generator (diffuse + emissive channels)
  const updateCompositeTexture = useCallback(() => {
    const compCanvas = compositeCanvas || compositeCanvasRef.current;
    if (!compCanvas) return;

    const ctx = compCanvas.getContext('2d');
    if (!ctx) return;

    // Initialize or prepare emissive canvas
    if (!emissiveCanvasRef.current) {
      const emCvs = document.createElement('canvas');
      emCvs.width = compCanvas.width;
      emCvs.height = compCanvas.height;
      emissiveCanvasRef.current = emCvs;
    }
    const emCanvas = emissiveCanvasRef.current;
    const emCtx = emCanvas.getContext('2d');
    if (emCtx) {
      emCtx.fillStyle = '#000000';
      emCtx.fillRect(0, 0, emCanvas.width, emCanvas.height);
    }

    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

    let hasEmissive = false;
    layers.forEach(layer => {
      if (!layer.visible) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode === 'multiply' ? 'multiply'
        : layer.blendMode === 'screen' ? 'screen'
        : layer.blendMode === 'overlay' ? 'overlay'
        : 'source-over';
      ctx.drawImage(layer.canvas, 0, 0, compCanvas.width, compCanvas.height);
      ctx.restore();

      // If layer is converted to emission, composite onto emissive map
      if (layer.channel === 'emission' && emCtx) {
        hasEmissive = true;
        emCtx.save();
        emCtx.globalAlpha = layer.opacity / 100;
        emCtx.drawImage(layer.canvas, 0, 0, emCanvas.width, emCanvas.height);
        emCtx.restore();
      }
    });

    if (dynamicTextureRef.current) {
      dynamicTextureRef.current.needsUpdate = true;
    }
    if (emissiveTextureRef.current) {
      emissiveTextureRef.current.needsUpdate = true;
    }

    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (hasEmissive) {
        if (!mat.emissiveMap && emissiveTextureRef.current) {
          mat.emissiveMap = emissiveTextureRef.current;
        }
        mat.emissive.set(0xffffff);
        mat.emissiveIntensity = 2.2;
        mat.needsUpdate = true;
      } else {
        mat.emissiveIntensity = 0.0;
      }
    }

    hasEmissiveRef.current = hasEmissive;

    if (onCompositeCanvasReady) {
      onCompositeCanvasReady(compCanvas);
    }
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
    const perspCam = new THREE.PerspectiveCamera(45, aspect, 0.001, 100000);
    const orthoCam = new THREE.OrthographicCamera(-3 * aspect, 3 * aspect, 3, -3, 0.001, 100000);
    cameraPerspRef.current = perspCam;
    cameraOrthoRef.current = orthoCam;

    // Quad View Orthographic Cameras (Top, Front, Right)
    const topCam = new THREE.OrthographicCamera(-2.5 * aspect, 2.5 * aspect, 2.5, -2.5, 0.001, 100000);
    topCam.position.set(0, 30, 0);
    topCam.up.set(0, 0, -1);
    topCam.lookAt(0, 0, 0);

    const frontCam = new THREE.OrthographicCamera(-2.5 * aspect, 2.5 * aspect, 2.5, -2.5, 0.001, 100000);
    frontCam.position.set(0, 0, 30);
    frontCam.up.set(0, 1, 0);
    frontCam.lookAt(0, 0, 0);

    const rightCam = new THREE.OrthographicCamera(-2.5 * aspect, 2.5 * aspect, 2.5, -2.5, 0.001, 100000);
    rightCam.position.set(30, 0, 0);
    rightCam.up.set(0, 1, 0);
    rightCam.lookAt(0, 0, 0);

    quadCamerasRef.current = { top: topCam, front: frontCam, right: rightCam };

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current || undefined,
      antialias: true,
      powerPreference: 'default',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

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
    dynamicTextureRef.current = tex;

    // Emissive Canvas Texture
    const emCanvas = emissiveCanvasRef.current || document.createElement('canvas');
    if (emCanvas.width !== 1024) emCanvas.width = 1024;
    if (emCanvas.height !== 1024) emCanvas.height = 1024;
    emissiveCanvasRef.current = emCanvas;
    const emTex = new THREE.CanvasTexture(emCanvas);
    emTex.colorSpace = THREE.SRGBColorSpace;
    emissiveTextureRef.current = emTex;

    const modelPreset = BUILTIN_MODELS[modelKey] ? BUILTIN_MODELS[modelKey]() : BUILTIN_MODELS.suzanne();
    const material = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: emTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.0,
      roughness: materialProps.roughness,
      metalness: materialProps.metallic,
    });
    const mesh = new THREE.Mesh(modelPreset.geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // UnrealBloomPass Post-Processing Composer Setup
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    const renderPass = new RenderPass(scene, perspCam);
    renderPassRef.current = renderPass;
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloom.strength,
      bloom.radius,
      bloom.threshold
    );
    bloomPassRef.current = bloomPass;
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
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

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
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

      renderer.setSize(w, h);
      if (composerRef.current) {
        composerRef.current.setSize(w, h);
      }
      if (bloomPassRef.current) {
        bloomPassRef.current.resolution.set(w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (composerRef.current) {
        composerRef.current.dispose();
      }
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

  // Update Geometry & Surface Shading
  useEffect(() => {
    if (!meshRef.current) return;
    let newGeom: THREE.BufferGeometry;

    if (customOBJText) {
      newGeom = parseOBJ(customOBJText);
    } else if (BUILTIN_MODELS[modelKey]) {
      newGeom = BUILTIN_MODELS[modelKey]().geometry;
    } else {
      newGeom = BUILTIN_MODELS.suzanne().geometry;
    }

    SurfaceShadingEngine.ensureDefaultNormalsCached(newGeom);
    meshRef.current.geometry.dispose();
    meshRef.current.geometry = newGeom;

    // Apply Blender-style dynamic surface shading: Def, Smooth, or Flat
    const effMode: SurfaceShadingType = surfaceMode === 'hard' ? 'flat' : surfaceMode;
    SurfaceShadingEngine.applySurfaceShading(newGeom, meshRef.current.material, effMode);
  }, [modelKey, customOBJText]);

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
        emissiveIntensity: hasEmissive ? 2.2 : 0.0,
        roughness: materialProps.roughness,
        metalness: materialProps.metallic,
      });
    }

    // Apply Blender-style dynamic surface normal calculation
    const effMode: SurfaceShadingType = surfaceMode === 'hard' ? 'flat' : surfaceMode;
    SurfaceShadingEngine.applySurfaceShading(mesh.geometry, mesh.material, effMode);
  }, [shadingMode, materialProps, surfaceMode, layers]);

  // Mesh Component Visibility Controller
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const geom = mesh.geometry;

    if (meshComponentVisibility === 'all' || !meshComponentVisibility) {
      mesh.visible = true;
      if (geom.userData?.fullIndex) {
        geom.setIndex(geom.userData.fullIndex);
      }
      geom.setDrawRange(0, Infinity);
      return;
    }

    if (meshComponentVisibility.startsWith('hide_')) {
      const compKey = meshComponentVisibility.replace('hide_', '');
      if (geom.userData?.excludeIndices && geom.userData.excludeIndices[compKey]) {
        mesh.visible = true;
        geom.setIndex(new THREE.BufferAttribute(geom.userData.excludeIndices[compKey], 1));
        geom.setDrawRange(0, Infinity);
      }
    } else {
      // Solo / isolate individual component
      if (geom.userData?.componentIndices && geom.userData.componentIndices[meshComponentVisibility]) {
        mesh.visible = true;
        geom.setIndex(new THREE.BufferAttribute(geom.userData.componentIndices[meshComponentVisibility], 1));
        geom.setDrawRange(0, Infinity);
      } else if (geom.groups && geom.groups.length > 0) {
        const groupIdx = parseInt(meshComponentVisibility, 10);
        if (!isNaN(groupIdx) && geom.groups[groupIdx]) {
          geom.setDrawRange(geom.groups[groupIdx].start, geom.groups[groupIdx].count);
        }
      }
    }
  }, [meshComponentVisibility]);

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
    const { radius, theta, phi, target } = orbitState.current;
    const r = radius / zoomFactor;

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    const x = r * sinPhi * Math.sin(theta);
    const y = r * cosPhi;
    const z = r * sinPhi * Math.cos(theta);

    // Continuous, non-singular up-vector ensuring looking straight at top or bottom NEVER locks
    const upX = -cosPhi * Math.sin(theta);
    const upY = sinPhi;
    const upZ = -cosPhi * Math.cos(theta);

    if (cameraPerspRef.current) {
      cameraPerspRef.current.up.set(upX, upY, upZ);
      cameraPerspRef.current.position.set(x + target.x, y + target.y, z + target.z);
      cameraPerspRef.current.lookAt(target);
    }
    if (cameraOrthoRef.current) {
      cameraOrthoRef.current.up.set(upX, upY, upZ);
      cameraOrthoRef.current.position.set(x + target.x, y + target.y, z + target.z);
      cameraOrthoRef.current.lookAt(target);
    }

    setBoxRotation({ x: phi - Math.PI / 2, y: -theta });
  };

  const snapToView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => {
    if (view === 'front') {
      orbitState.current.theta = 0;
      orbitState.current.phi = Math.PI / 2;
    } else if (view === 'back') {
      orbitState.current.theta = Math.PI;
      orbitState.current.phi = Math.PI / 2;
    } else if (view === 'right') {
      orbitState.current.theta = Math.PI / 2;
      orbitState.current.phi = Math.PI / 2;
    } else if (view === 'left') {
      orbitState.current.theta = -Math.PI / 2;
      orbitState.current.phi = Math.PI / 2;
    } else if (view === 'top') {
      orbitState.current.theta = 0;
      orbitState.current.phi = 0.0001;
    } else if (view === 'bottom') {
      orbitState.current.theta = 0;
      orbitState.current.phi = Math.PI - 0.0001;
    }
    updateCameraPosition();
  };

  const handleFlipView = () => {
    orbitState.current.theta = (orbitState.current.theta + Math.PI) % (2 * Math.PI);
    orbitState.current.phi = Math.max(0.0001, Math.min(Math.PI - 0.0001, Math.PI - orbitState.current.phi));
    updateCameraPosition();
  };

  const handlePanDelta = (dx: number, dy: number) => {
    orbitState.current.target.x -= dx * 0.005;
    orbitState.current.target.y += dy * 0.005;
    updateCameraPosition();
  };

  const handleZoomDelta = (delta: number) => {
    // Nearly infinite zoom in and out
    const factor = Math.exp(-delta * 0.05);
    orbitState.current.radius = Math.max(0.0001, Math.min(100000.0, orbitState.current.radius * factor));
    updateCameraPosition();
  };

  const handleResetCamera = () => {
    orbitState.current.radius = 4.8;
    orbitState.current.theta = 0.78;
    orbitState.current.phi = 1.15;
    orbitState.current.target.set(0, 0, 0);
    if (onZoomChange) onZoomChange(1.0);
    updateCameraPosition();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.set(e.pointerId, { 
      x: e.clientX, 
      y: e.clientY, 
      pointerType: e.pointerType 
    });

    if (activePointers.current.size >= 2) {
      isPaintingRef.current = false;
      const pts = Array.from(activePointers.current.values());
      pinchStartDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRadius.current = orbitState.current.radius;
      twoFingerStartMidpoint.current = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      return;
    }

    // Touch Navigation & Tool Execution Mode
    const uv = raycastUV(e);
    const isNavigationTool = activeTool === 'hand' || activeTool === 'zoom';
    const isExplicitOrbit = e.altKey || e.button === 1 || e.button === 2;

    // Orbit camera if explicit navigation, or if touching empty background space outside the mesh
    if (isExplicitOrbit || isNavigationTool || (!uv && (e.pointerType === 'mouse' || touchNavEnabled))) {
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

    if (uv) {
      isPaintingRef.current = true;
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
          targetLayer.canvas.height
        );
        if (onUpdateSelectionMask) onUpdateSelectionMask(updated);
        updateCompositeTexture();
        onTextureUpdated();
        return;
      }

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

    // Multi-touch gestures (Pinch-to-zoom & two-finger pan)
    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);

      if (pinchStartDist.current && pinchStartDist.current > 0) {
        const ratio = pinchStartDist.current / currentDist;
        orbitState.current.radius = Math.max(0.0001, Math.min(100000.0, pinchStartRadius.current * ratio));
      }

      const currentMidpoint = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      if (twoFingerStartMidpoint.current) {
        const dx = currentMidpoint.x - twoFingerStartMidpoint.current.x;
        const dy = currentMidpoint.y - twoFingerStartMidpoint.current.y;
        orbitState.current.target.x -= dx * 0.004;
        orbitState.current.target.y += dy * 0.004;
        twoFingerStartMidpoint.current = currentMidpoint;
      }

      updateCameraPosition();
      return;
    }

    if (orbitState.current.isOrbiting) {
      const dx = e.clientX - orbitState.current.lastMouseX;
      const dy = e.clientY - orbitState.current.lastMouseY;
      orbitState.current.theta += dx * 0.008;
      // Allow unrestricted pitch rotation without gimbal lock at the poles
      orbitState.current.phi = Math.max(0.0001, Math.min(Math.PI - 0.0001, orbitState.current.phi - dy * 0.008));
      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;
      updateCameraPosition();
      return;
    }

    if (orbitState.current.isPanning) {
      const dx = e.clientX - orbitState.current.lastMouseX;
      const dy = e.clientY - orbitState.current.lastMouseY;
      orbitState.current.target.x -= dx * 0.005;
      orbitState.current.target.y += dy * 0.005;
      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;
      updateCameraPosition();
      return;
    }

    if (isPaintingRef.current) {
      const targetLayer = layers.find(l => l.id === activeLayerId);
      if (!targetLayer) return;

      const uv = raycastUV(e);
      if (uv) {
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
            targetLayer.canvas.height
          );
          if (onUpdateSelectionMask) onUpdateSelectionMask(updated);
          updateCompositeTexture();
          onTextureUpdated();
          return;
        }

        const stabilized = brushEngine.updateStabilizer(targetX, targetY, brush.stabilizer);
        executePaintTool(targetLayer, stabilized.x, stabilized.y, e.pressure || 1.0);
        drawStabilizerTether(e, stabilized, targetLayer);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size < 2) {
      pinchStartDist.current = null;
      twoFingerStartMidpoint.current = null;
    }

    if (activePointers.current.size === 0) {
      orbitState.current.isOrbiting = false;
      orbitState.current.isPanning = false;
    }

    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      brushEngine.endStroke();
      clearStabilizerTether();
      undoBuffer.pushState(`${brush.name} 3D Paint`, layers);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Smooth proportional zoom nearly infinitely in and out
    const factor = Math.exp(e.deltaY * 0.0015);
    orbitState.current.radius = Math.max(0.0001, Math.min(100000.0, orbitState.current.radius * factor));
    updateCameraPosition();
  };

  const raycastUV = (e: React.PointerEvent<HTMLCanvasElement>): THREE.Vector2 | null => {
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
      return intersects[0].uv;
    }
    return null;
  };

  const executePaintTool = (layer: Layer, x: number, y: number, pressure: number) => {
    // 1. Temporary Selection Mask: Only allow painting inside selection
    if (selectionMask && selectionMask.active && !SelectionTool.isPointInSelection(x, y, selectionMask)) {
      return;
    }

    const ctx = layer.ctx;

    const applyDabAt = (dx: number, dy: number) => {
      if (activeTool === 'brush') {
        brushEngine.paintDabs(ctx, dx, dy, brush, pressure, false);
      } else if (activeTool === 'eraser') {
        brushEngine.paintDabs(ctx, dx, dy, brush, pressure, true);
      } else if (activeTool === 'pen') {
        brushEngine.paintDabs(ctx, dx, dy, { ...brush, hardness: 100, size: Math.max(2, brush.size * 0.4) }, pressure, false);
      } else if (activeTool === 'blur') {
        brushEngine.applyBlurAt(ctx, dx, dy, brush);
      } else if (activeTool === 'clone') {
        brushEngine.applyCloneStampAt(ctx, dx, dy, brush);
      } else if (activeTool === 'smudge') {
        brushEngine.applySmudgeAt(ctx, dx, dy, dx, dy, brush);
      } else if (activeTool === 'bucket') {
        FillSuite.applyBucketFill(ctx, brush.color, brush.opacity);
      } else if (activeTool === 'gradient_linear') {
        FillSuite.applyLinearGradient(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, brush.color, '#1a1a1a', brush.opacity);
      } else if (activeTool === 'gradient_radial') {
        FillSuite.applyRadialGradient(ctx, dx, dy, dx + brush.size * 3.5, dy, brush.color, 'transparent', brush.opacity);
      } else if (activeTool === 'eyedropper' && onColorSampled) {
        const p = ctx.getImageData(Math.floor(dx), Math.floor(dy), 1, 1).data;
        const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
        onColorSampled(hex);
      }
    };

    // Primary stroke dab
    applyDabAt(x, y);

    // 2. Real-time Multi-Axis Symmetry Mirror Stroke Dab
    const axes = symmetryConfig?.axes || (isSymmetryX ? { X: true, Y: false, Z: false } : { X: false, Y: false, Z: false });
    const hasAnyAxis = Boolean(axes.X || axes.Y || axes.Z);
    const isMirrorActive = symmetryConfig ? (symmetryConfig.activeRealtimeMirror && hasAnyAxis) : (isSymmetryX && hasAnyAxis);

    if (isMirrorActive) {
      const activeAxes: SymmetryAxis[] = [];
      if (axes.X) activeAxes.push('X');
      if (axes.Y) activeAxes.push('Y');
      if (axes.Z) activeAxes.push('Z');

      const mirroredCoords: { x: number; y: number }[] = [];

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
        mirroredCoords.push(pt);
      });

      // Diagonal cross-mirror if both X and Y are checked
      if (axes.X && axes.Y) {
        const xCfg = { ...symmetryConfig, axis: 'X' as const } as SymmetryConfig;
        const yCfg = { ...symmetryConfig, axis: 'Y' as const } as SymmetryConfig;
        const ptX = SymmetryEngine.getMirroredCoord(x, y, xCfg, layer.canvas.width, layer.canvas.height);
        const ptXY = SymmetryEngine.getMirroredCoord(ptX.x, ptX.y, yCfg, layer.canvas.width, layer.canvas.height);
        mirroredCoords.push(ptXY);
      }

      mirroredCoords.forEach(m => {
        if (!selectionMask || !selectionMask.active || SelectionTool.isPointInSelection(m.x, m.y, selectionMask)) {
          applyDabAt(m.x, m.y);
        }
      });
    }

    updateCompositeTexture();
    onTextureUpdated();
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
          isOrtho={isOrtho}
          touchNavEnabled={touchNavEnabled}
          onToggleTouchNav={onToggleTouchNav}
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
        <span className="text-[#a6e3a1]">{showGizmo ? 'GIZMO: ON' : 'GIZMO: HIDDEN'}</span>
      </div>
    </div>
  );
};
