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
  ViewportShadingMode 
} from '../core/types';
import { BrushEngine } from '../tools/brushEngine';
import { UndoRingBuffer } from '../core/history';
import { BoxGizmo } from './boxGizmo';
import { FillSuite } from '../tools/fillSuite';
import { BUILTIN_MODELS, parseOBJ } from './modelGeometry';
import { LayoutGrid } from 'lucide-react';

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
  onCompositeCanvasReady?: (canvas: HTMLCanvasElement) => void;
  showGizmo?: boolean;
  viewLayout?: 'perspective' | 'quad';
  onSelectViewLayout?: (layout: 'perspective' | 'quad') => void;
  surfaceMode?: 'smooth' | 'hard' | 'default';
  isSymmetryX?: boolean;
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
  onCompositeCanvasReady,
  showGizmo = true,
  viewLayout: controlledViewLayout,
  onSelectViewLayout,
  surfaceMode = 'default',
  isSymmetryX = false,
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

  // Composite texture generator
  const updateCompositeTexture = useCallback(() => {
    let compCanvas = compositeCanvasRef.current;
    if (!compCanvas) {
      compCanvas = document.createElement('canvas');
      compCanvas.width = 1024;
      compCanvas.height = 1024;
      compositeCanvasRef.current = compCanvas;
    }

    const ctx = compCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

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
    });

    if (dynamicTextureRef.current) {
      dynamicTextureRef.current.needsUpdate = true;
    }
    if (onCompositeCanvasReady) {
      onCompositeCanvasReady(compCanvas);
    }
    onTextureUpdated();
  }, [layers, onTextureUpdated, onCompositeCanvasReady]);

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

    const keyLight = new THREE.DirectionalLight(0xfff8eb, 1.6);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.8);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    const compCanvas = document.createElement('canvas');
    compCanvas.width = 1024;
    compCanvas.height = 1024;
    compositeCanvasRef.current = compCanvas;
    const tex = new THREE.CanvasTexture(compCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    dynamicTextureRef.current = tex;

    const modelPreset = BUILTIN_MODELS[modelKey] ? BUILTIN_MODELS[modelKey]() : BUILTIN_MODELS.suzanne();
    const material = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: materialProps.roughness,
      metalness: materialProps.metallic,
    });
    const mesh = new THREE.Mesh(modelPreset.geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

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
        r.render(scene, activeCam);
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
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Geometry
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

    meshRef.current.geometry.dispose();
    meshRef.current.geometry = newGeom;
  }, [modelKey, customOBJText]);

  // Update Shading
  useEffect(() => {
    if (!meshRef.current || !dynamicTextureRef.current) return;

    if (shadingMode === 'wireframe') {
      meshRef.current.material = new THREE.MeshBasicMaterial({
        color: '#3d7fb8',
        wireframe: true,
      });
    } else if (shadingMode === 'normal') {
      meshRef.current.material = new THREE.MeshNormalMaterial({
        flatShading: surfaceMode === 'hard',
      });
    } else if (shadingMode === 'flat') {
      meshRef.current.material = new THREE.MeshBasicMaterial({
        map: dynamicTextureRef.current,
      });
    } else if (shadingMode === 'clay') {
      meshRef.current.material = new THREE.MeshStandardMaterial({
        color: '#b0a89f',
        roughness: 0.6,
        metalness: 0.05,
        flatShading: surfaceMode === 'hard',
      });
    } else {
      meshRef.current.material = new THREE.MeshStandardMaterial({
        map: dynamicTextureRef.current,
        roughness: materialProps.roughness,
        metalness: materialProps.metallic,
        flatShading: surfaceMode === 'hard',
      });
    }
  }, [shadingMode, materialProps, surfaceMode]);

  useEffect(() => {
    updateCompositeTexture();
  }, [layers, updateCompositeTexture]);

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
      brushEngine.beginStroke(pixelX, pixelY, e.pressure || 1.0);
      executePaintTool(targetLayer, pixelX, pixelY, e.pressure || 1.0);
      if (isSymmetryX) {
        const mirrorX = targetLayer.canvas.width - pixelX;
        executePaintTool(targetLayer, mirrorX, pixelY, e.pressure || 1.0);
      }
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

        const stabilized = brushEngine.updateStabilizer(targetX, targetY, brush.stabilizer);
        executePaintTool(targetLayer, stabilized.x, stabilized.y, e.pressure || 1.0);
        if (isSymmetryX) {
          const mirrorX = targetLayer.canvas.width - stabilized.x;
          executePaintTool(targetLayer, mirrorX, stabilized.y, e.pressure || 1.0);
        }
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
    const ctx = layer.ctx;
    if (activeTool === 'brush') {
      brushEngine.paintDabs(ctx, x, y, brush, pressure, false);
    } else if (activeTool === 'eraser') {
      brushEngine.paintDabs(ctx, x, y, brush, pressure, true);
    } else if (activeTool === 'pen') {
      brushEngine.paintDabs(ctx, x, y, { ...brush, hardness: 100, size: Math.max(2, brush.size * 0.4) }, pressure, false);
    } else if (activeTool === 'blur') {
      brushEngine.applyBlurAt(ctx, x, y, brush);
    } else if (activeTool === 'clone') {
      brushEngine.applyCloneStampAt(ctx, x, y, brush);
    } else if (activeTool === 'smudge') {
      brushEngine.applySmudgeAt(ctx, x, y, x, y, brush);
    } else if (activeTool === 'bucket') {
      FillSuite.applyBucketFill(ctx, brush.color, brush.opacity);
    } else if (activeTool === 'gradient_linear') {
      FillSuite.applyLinearGradient(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, brush.color, '#1a1a1a', brush.opacity);
    } else if (activeTool === 'gradient_radial') {
      FillSuite.applyRadialGradient(ctx, x, y, x + brush.size * 3.5, y, brush.color, 'transparent', brush.opacity);
    } else if (activeTool === 'eyedropper' && onColorSampled) {
      const p = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
      onColorSampled(hex);
    }

    updateCompositeTexture();
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

      {/* Viewport Camera & Layout Selector (Perspective vs Quad View) */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-[#252525]/90 px-2 py-1 rounded border border-[#444] shadow-md backdrop-blur-xs select-none">
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
