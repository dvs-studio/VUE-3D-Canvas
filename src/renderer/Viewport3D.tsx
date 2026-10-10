/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Main 3D Viewport & Surface Raycast Painting Engine
 * Created by Victory Ukpong
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  ToolType, 
  BrushPreset, 
  Layer, 
  ViewportShadingMode, 
  MeshModelAsset 
} from '../core/types';
import { BrushEngine } from '../tools/brushEngine';
import { UndoRingBuffer } from '../core/history';
import { BoxGizmo } from './boxGizmo';
import { BUILTIN_MODELS, parseOBJ } from './modelGeometry';
import { Lock } from 'lucide-react';

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
  isNavLocked: boolean;
  onColorSampled?: (hex: string) => void;
  isOrtho: boolean;
  onToggleOrtho: () => void;
  zoomFactor: number;
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
  isNavLocked,
  onColorSampled,
  isOrtho,
  onToggleOrtho,
  zoomFactor,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tetherCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraPerspRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraOrthoRef = useRef<THREE.OrthographicCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const dynamicTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera Orbit State
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

    // Base background
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);

    // Composite visible layers
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
    onTextureUpdated();
  }, [layers, onTextureUpdated]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#242424');
    sceneRef.current = scene;

    // Cameras
    const aspect = width / height;
    const perspCam = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    const orthoCam = new THREE.OrthographicCamera(-3 * aspect, 3 * aspect, 3, -3, 0.1, 1000);
    cameraPerspRef.current = perspCam;
    cameraOrthoRef.current = orthoCam;

    // Renderer (DirectX 11 / OpenGL 2.0 WebGL limit simulation)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current || undefined,
      antialias: true,
      powerPreference: 'default', // Resource-efficient
      preserveDrawingBuffer: true, // Needed for screenshot projection
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Memory friendly cap
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    // 3-Point Studio Lighting (Key, Fill, Rim)
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

    // Initial Composite Texture
    const compCanvas = document.createElement('canvas');
    compCanvas.width = 1024;
    compCanvas.height = 1024;
    compositeCanvasRef.current = compCanvas;
    const tex = new THREE.CanvasTexture(compCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    dynamicTextureRef.current = tex;

    // Initial Model Geometry
    const modelPreset = BUILTIN_MODELS[modelKey] ? BUILTIN_MODELS[modelKey]() : BUILTIN_MODELS.suzanne();
    const material = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: materialProps.roughness,
      metalness: materialProps.metallic,
    });
    const mesh = new THREE.Mesh(modelPreset.geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      updateCameraPosition();
      const activeCam = isOrtho ? orthoCam : perspCam;
      renderer.render(scene, activeCam);
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

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Geometry when modelKey or customOBJText changes
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

  // Update Material Shading Mode
  useEffect(() => {
    if (!meshRef.current || !dynamicTextureRef.current) return;

    if (shadingMode === 'wireframe') {
      meshRef.current.material = new THREE.MeshBasicMaterial({
        color: '#3d7fb8',
        wireframe: true,
      });
    } else if (shadingMode === 'normal') {
      meshRef.current.material = new THREE.MeshNormalMaterial();
    } else if (shadingMode === 'flat') {
      meshRef.current.material = new THREE.MeshBasicMaterial({
        map: dynamicTextureRef.current,
      });
    } else if (shadingMode === 'clay') {
      meshRef.current.material = new THREE.MeshStandardMaterial({
        color: '#b0a89f',
        roughness: 0.6,
        metalness: 0.05,
      });
    } else {
      // PBR Material
      meshRef.current.material = new THREE.MeshStandardMaterial({
        map: dynamicTextureRef.current,
        roughness: materialProps.roughness,
        metalness: materialProps.metallic,
      });
    }
  }, [shadingMode, materialProps]);

  // Update composite texture when layers change
  useEffect(() => {
    updateCompositeTexture();
  }, [layers, updateCompositeTexture]);

  // Synchronize Camera Position
  const updateCameraPosition = () => {
    const { radius, theta, phi, target } = orbitState.current;
    const r = radius / zoomFactor;

    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);

    if (cameraPerspRef.current) {
      cameraPerspRef.current.position.set(x + target.x, y + target.y, z + target.z);
      cameraPerspRef.current.lookAt(target);
    }
    if (cameraOrthoRef.current) {
      cameraOrthoRef.current.position.set(x + target.x, y + target.y, z + target.z);
      cameraOrthoRef.current.lookAt(target);
    }

    setBoxRotation({ x: phi - Math.PI / 2, y: -theta });
  };

  // Viewport Snap from Box Gizmo or Numpad
  const snapToView = (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => {
    if (isNavLocked) return;

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
      orbitState.current.phi = 0.01;
    } else if (view === 'bottom') {
      orbitState.current.phi = Math.PI - 0.01;
    }
    updateCameraPosition();
  };

  // Interactive 3D Surface Raycast Painting
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isNavLocked) return;

    const isOrbitModifier = e.altKey || e.button === 1 || e.button === 2 || activeTool === 'hand';

    if (isOrbitModifier) {
      if (e.shiftKey) {
        orbitState.current.isPanning = true;
      } else {
        orbitState.current.isOrbiting = true;
      }
      orbitState.current.lastMouseX = e.clientX;
      orbitState.current.lastMouseY = e.clientY;
      return;
    }

    // Direct 3D Surface Painting
    const targetLayer = layers.find(l => l.id === activeLayerId);
    if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

    const uv = raycastUV(e);
    if (uv) {
      isPaintingRef.current = true;
      const pixelX = uv.x * targetLayer.canvas.width;
      const pixelY = (1 - uv.y) * targetLayer.canvas.height;
      brushEngine.beginStroke(pixelX, pixelY, e.pressure || 1.0);
      executePaintTool(targetLayer, pixelX, pixelY, e.pressure || 1.0);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Navigation Orbiting or Panning
    if (orbitState.current.isOrbiting) {
      const dx = e.clientX - orbitState.current.lastMouseX;
      const dy = e.clientY - orbitState.current.lastMouseY;
      orbitState.current.theta += dx * 0.008;
      orbitState.current.phi = Math.max(0.01, Math.min(Math.PI - 0.01, orbitState.current.phi - dy * 0.008));
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

    // Active Painting
    if (isPaintingRef.current) {
      const targetLayer = layers.find(l => l.id === activeLayerId);
      if (!targetLayer) return;

      const uv = raycastUV(e);
      if (uv) {
        const targetX = uv.x * targetLayer.canvas.width;
        const targetY = (1 - uv.y) * targetLayer.canvas.height;

        // Apply stabilizer interpolation
        const stabilized = brushEngine.updateStabilizer(targetX, targetY, brush.stabilizer);
        executePaintTool(targetLayer, stabilized.x, stabilized.y, e.pressure || 1.0);

        // Render visual stabilizer tether guide line on top canvas
        drawStabilizerTether(e, stabilized, targetLayer);
      }
    }
  };

  const handlePointerUp = () => {
    orbitState.current.isOrbiting = false;
    orbitState.current.isPanning = false;

    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      brushEngine.endStroke();
      clearStabilizerTether();
      // Record state into strict 3-state ring buffer
      undoBuffer.pushState(`${brush.name} 3D Paint`, layers);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isNavLocked) return;
    orbitState.current.radius = Math.max(1.5, Math.min(15.0, orbitState.current.radius + e.deltaY * 0.005));
    updateCameraPosition();
  };

  const raycastUV = (e: React.PointerEvent<HTMLCanvasElement>): THREE.Vector2 | null => {
    const canvas = canvasRef.current;
    if (!canvas || !meshRef.current || !cameraPerspRef.current) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const cam = isOrtho ? cameraOrthoRef.current! : cameraPerspRef.current!;
    raycaster.current.setFromCamera(new THREE.Vector2(x, y), cam);

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
    } else if (activeTool === 'blur') {
      brushEngine.applyBlurAt(ctx, x, y, brush);
    } else if (activeTool === 'clone') {
      brushEngine.applyCloneStampAt(ctx, x, y, brush);
    } else if (activeTool === 'smudge') {
      brushEngine.applySmudgeAt(ctx, x, y, x, y, brush);
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

    ctx.strokeStyle = 'rgba(61, 127, 184, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cursorX, cursorY);
    ctx.lineTo(cursorX - 10, cursorY - 10);
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
      className="relative w-full h-full bg-[#202020] overflow-hidden select-none"
    >
      {/* Strict Navigation Lock Status Overlay */}
      {isNavLocked && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#8b2626] text-white px-3 py-1 rounded shadow-lg flex items-center gap-2 text-xs font-mono border border-red-400">
          <Lock className="w-3.5 h-3.5 animate-pulse" />
          <span>NAVIGATION LOCKED: PROJECTION MODE ACTIVE</span>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Overlay Canvas for Stabilizer Tether & Guides */}
      <canvas
        ref={tetherCanvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
      />

      {/* Blender-Style 3D Box Gizmo */}
      <BoxGizmo
        rotation={boxRotation}
        onSnapView={snapToView}
      />

      {/* Bottom Viewport Info Bar */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 text-[10px] text-[#888] font-mono bg-[#282828]/80 px-2.5 py-1 rounded border border-[#404040] pointer-events-none">
        <span>MODEL: {modelKey.toUpperCase()}</span>
        <span>·</span>
        <span>SHADING: {shadingMode.toUpperCase()}</span>
        <span>·</span>
        <span className="text-[#3d7fb8]">DX11 / WebGL 2.0</span>
      </div>
    </div>
  );
};
