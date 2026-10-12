/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Supervisor 3D Viewport Clone
 * Created by Victory Ukpong
 * 
 * Live 3D inspection clone of the main viewport. Supports touch and mouse navigation
 * for 360-degree supervision without affecting or painting the actual 3D model texture.
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { BUILTIN_MODELS, parseOBJ } from '../../renderer/modelGeometry';
import { RotateCw, RefreshCw, ZoomIn, ZoomOut, Compass, Smartphone, Box } from 'lucide-react';

interface NavigatorPanelProps {
  modelKey: string;
  customOBJText?: string;
  compositeCanvas: HTMLCanvasElement | null;
  textureVersion: number;
  materialProps: { metallic: number; roughness: number; normalStrength: number };
  showGizmo?: boolean;
  onToggleGizmo?: () => void;
}

export const NavigatorPanel: React.FC<NavigatorPanelProps> = ({
  modelKey,
  customOBJText,
  compositeCanvas,
  textureVersion,
  materialProps,
  showGizmo = true,
  onToggleGizmo,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const autoRotateRef = useRef<boolean>(false);
  autoRotateRef.current = autoRotate;

  const [touchNavActive, setTouchNavActive] = useState<boolean>(true);

  const orbitState = useRef({
    radius: 4.8,
    theta: 0.8,
    phi: 1.2,
    target: new THREE.Vector3(0, 0, 0),
    isOrbiting: false,
    isPanning: false,
    lastX: 0,
    lastY: 0,
  });

  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartRadius = useRef<number>(4.8);

  // Initialize Three.js WebGL Supervisor Clone
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 240;
    const height = 180;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1c1c1c');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current || undefined,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);
    const dirKey = new THREE.DirectionalLight(0xfff5ea, 1.4);
    dirKey.position.set(3, 5, 4);
    scene.add(dirKey);
    const dirRim = new THREE.DirectionalLight(0xaad4f5, 0.8);
    dirRim.position.set(-4, 2, -4);
    scene.add(dirRim);

    // Initial Texture
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 512;
    fallbackCanvas.height = 512;
    const fctx = fallbackCanvas.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#666';
      fctx.fillRect(0, 0, 512, 512);
    }

    const tex = new THREE.CanvasTexture(compositeCanvas || fallbackCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = tex;

    // Initial Mesh
    const preset = BUILTIN_MODELS[modelKey] ? BUILTIN_MODELS[modelKey]() : BUILTIN_MODELS.suzanne();
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: materialProps.roughness,
      metalness: materialProps.metallic,
    });
    const mesh = new THREE.Mesh(preset.geometry, mat);
    scene.add(mesh);
    meshRef.current = mesh;

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotateRef.current) {
        orbitState.current.theta += 0.015;
      }
      updateCamera();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = 180;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
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

  // Update Texture from main painting canvas
  useEffect(() => {
    if (!meshRef.current) return;
    if (compositeCanvas) {
      if (!textureRef.current || textureRef.current.image !== compositeCanvas) {
        const tex = new THREE.CanvasTexture(compositeCanvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        textureRef.current = tex;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.map = tex;
          mat.needsUpdate = true;
        }
      } else {
        textureRef.current.needsUpdate = true;
      }
    }
  }, [compositeCanvas, textureVersion]);

  // Update Material
  useEffect(() => {
    if (!meshRef.current) return;
    const m = meshRef.current.material as THREE.MeshStandardMaterial;
    if (m) {
      m.roughness = materialProps.roughness;
      m.metalness = materialProps.metallic;
      m.needsUpdate = true;
    }
  }, [materialProps]);

  const updateCamera = () => {
    const { radius, theta, phi, target } = orbitState.current;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const x = radius * sinPhi * Math.sin(theta);
    const y = radius * cosPhi;
    const z = radius * sinPhi * Math.cos(theta);

    if (cameraRef.current) {
      // Dynamic non-singular up-vector so looking at top or bottom in supervisor never locks
      cameraRef.current.up.set(-cosPhi * Math.sin(theta), sinPhi, -cosPhi * Math.cos(theta));
      cameraRef.current.position.set(x + target.x, y + target.y, z + target.z);
      cameraRef.current.lookAt(target);
    }
  };

  // Supervisor Touch & Mouse Input Handlers (NEVER paints on model)
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      pinchStartDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRadius.current = orbitState.current.radius;
      return;
    }

    if (e.shiftKey || e.button === 1) {
      orbitState.current.isPanning = true;
    } else {
      orbitState.current.isOrbiting = true;
    }
    orbitState.current.lastX = e.clientX;
    orbitState.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (pinchStartDist.current && pinchStartDist.current > 0) {
        orbitState.current.radius = Math.max(0.001, Math.min(1000.0, pinchStartRadius.current * (pinchStartDist.current / dist)));
      }
      return;
    }

    if (orbitState.current.isOrbiting) {
      const dx = e.clientX - orbitState.current.lastX;
      const dy = e.clientY - orbitState.current.lastY;
      orbitState.current.theta += dx * 0.015;
      // Allow unrestricted pitch orbit without locking at top or bottom
      orbitState.current.phi = Math.max(0.0001, Math.min(Math.PI - 0.0001, orbitState.current.phi - dy * 0.015));
      orbitState.current.lastX = e.clientX;
      orbitState.current.lastY = e.clientY;
    } else if (orbitState.current.isPanning) {
      const dx = e.clientX - orbitState.current.lastX;
      const dy = e.clientY - orbitState.current.lastY;
      orbitState.current.target.x -= dx * 0.005;
      orbitState.current.target.y += dy * 0.005;
      orbitState.current.lastX = e.clientX;
      orbitState.current.lastY = e.clientY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
      pinchStartDist.current = null;
    }
    if (activePointers.current.size === 0) {
      orbitState.current.isOrbiting = false;
      orbitState.current.isPanning = false;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const factor = Math.exp(e.deltaY * 0.002);
    orbitState.current.radius = Math.max(0.001, Math.min(1000.0, orbitState.current.radius * factor));
  };

  const handleReset = () => {
    orbitState.current.radius = 4.8;
    orbitState.current.theta = 0.8;
    orbitState.current.phi = 1.2;
    orbitState.current.target.set(0, 0, 0);
  };

  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838]">
      {/* Supervisor 3D Viewport Canvas */}
      <div 
        ref={mountRef}
        className="w-full h-[180px] bg-[#1c1c1c] relative overflow-hidden border-b border-[#444] touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* 3D Viewport Badge */}
        <div className="absolute top-1.5 left-1.5 bg-[#222]/80 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-mono text-[#89b4fa] border border-[#444] pointer-events-none">
          3D VIEWPORT
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="p-2 space-y-1.5 bg-[#333]">
        <div className="flex items-center justify-between text-[10px] text-[#aaa]">
          <span>Touch &amp; Mouse Orbit</span>
          <span className="text-[#a6e3a1]">Non-Destructive</span>
        </div>

        <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#444]">
          <button
            onClick={() => setAutoRotate(r => !r)}
            className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 border transition-colors ${
              autoRotate
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] border-[#555]'
            }`}
            title="Auto-rotate model for supervision"
          >
            <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            Turntable
          </button>

          {/* Requested tiny button in supervisor to toggle the gizmo */}
          {onToggleGizmo && (
            <button
              onClick={onToggleGizmo}
              className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 border transition-colors ${
                showGizmo
                  ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                  : 'bg-[#404040] hover:bg-[#4d4d4d] text-[#888] border-[#555]'
              }`}
              title="Toggle Square Gizmo in 3D Viewport"
            >
              <Box className="w-3 h-3 text-[#f9e2af]" />
              Gizmo
            </button>
          )}

          <button
            onClick={handleReset}
            className="px-2 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] rounded border border-[#555] text-[10px] flex items-center gap-1 transition-colors"
            title="Reset supervisor view"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
