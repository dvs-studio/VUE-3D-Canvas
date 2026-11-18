/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Multi-Mode 3D Orientation Gizmo (Box, Sphere, Mountain)
 * Created by Victory Ukpong
 */

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  RotateCcw, 
  Smartphone,
  Maximize2,
  Minus,
  Box,
  CircleDot,
  Mountain as MountainIcon
} from 'lucide-react';
import { GizmoStyle } from '../core/types';

interface BoxGizmoProps {
  rotation: { x: number; y: number };
  onSnapView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => void;
  onFlipView?: () => void;
  onPanDelta?: (dx: number, dy: number) => void;
  onZoomDelta?: (delta: number) => void;
  onToggleOrtho?: () => void;
  onResetCamera?: () => void;
  onAutoFit?: () => void;
  isOrtho?: boolean;
  touchNavEnabled?: boolean;
  onToggleTouchNav?: () => void;
  invertNav?: boolean;
  onToggleInvertNav?: () => void;
  gizmoStyle?: GizmoStyle;
  zoomPulseTrigger?: number;
}

export const BoxGizmo: React.FC<BoxGizmoProps> = ({
  rotation,
  onSnapView,
  onFlipView,
  onPanDelta,
  onZoomDelta,
  onToggleOrtho,
  onResetCamera,
  onAutoFit,
  isOrtho = false,
  touchNavEnabled = false,
  onToggleTouchNav,
  invertNav = false,
  onToggleInvertNav,
  gizmoStyle = 'box',
  zoomPulseTrigger = 0,
}) => {
  // Correctly aligned 3D angles in degrees for CSS 3D transforms
  const degX = (rotation.x * 180) / Math.PI;
  const degY = (rotation.y * 180) / Math.PI;

  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelSceneRef = useRef<THREE.Scene | null>(null);
  const modelCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelObjectRef = useRef<THREE.Object3D | null>(null);
  const [gizmoModelReady, setGizmoModelReady] = useState(false);

  // A small independent WebGL preview loads the GLB assets supplied in
  // self-host/public/assets/Gizmo. CSS remains the offline/failure fallback.
  useEffect(() => {
    const canvas = modelCanvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setGizmoModelReady(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(88, 88, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    camera.position.set(0, 0, 3.4);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb9d8ff, 0.8);
    fill.position.set(-4, 1, -3);
    scene.add(fill);
    modelRendererRef.current = renderer;
    modelSceneRef.current = scene;
    modelCameraRef.current = camera;
    return () => {
      if (modelObjectRef.current) {
        scene.remove(modelObjectRef.current);
        modelObjectRef.current.traverse(node => {
          const mesh = node as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(material => material.dispose());
          }
        });
        modelObjectRef.current = null;
      }
      renderer.dispose();
      modelRendererRef.current = null;
      modelSceneRef.current = null;
      modelCameraRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = modelSceneRef.current;
    const renderer = modelRendererRef.current;
    const camera = modelCameraRef.current;
    if (!scene || !renderer || !camera) return;
    let disposed = false;
    setGizmoModelReady(false);
    if (modelObjectRef.current) {
      const previous = modelObjectRef.current;
      scene.remove(previous);
      previous.traverse(node => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(material => material.dispose());
        }
      });
      modelObjectRef.current = null;
    }
    const loader = new GLTFLoader();
    const file = gizmoStyle === 'sphere' ? 'sphere.glb' : gizmoStyle === 'mountain' ? 'mountain.glb' : 'box.glb';
    const loadAsset = (filename: string, allowMountainFallback = false) => {
      const url = new URL('assets/Gizmo/' + filename, document.baseURI).href;
      loader.load(url, gltf => {
        if (disposed) return;
        const root = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(root);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z, 0.0001);
        const scale = 1.45 / maxDimension;
        root.scale.setScalar(scale);
        root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        root.rotation.order = 'YXZ';
        scene.add(root);
        modelObjectRef.current = root;
        setGizmoModelReady(true);
        renderer.render(scene, camera);
      }, undefined, () => {
        if (!disposed && allowMountainFallback) loadAsset('mountain_1.glb', false);
        else if (!disposed) setGizmoModelReady(false);
      });
    };
    loadAsset(file, gizmoStyle === 'mountain');
    return () => { disposed = true; };
  }, [gizmoStyle]);

  useEffect(() => {
    const model = modelObjectRef.current;
    const renderer = modelRendererRef.current;
    const scene = modelSceneRef.current;
    const camera = modelCameraRef.current;
    if (!model || !renderer || !scene || !camera) return;
    model.rotation.set(rotation.x, rotation.y, 0, 'YXZ');
    renderer.render(scene, camera);
  }, [rotation.x, rotation.y, gizmoModelReady]);

  // Zoom feedback animation: expands slightly and springs back to original size
  useEffect(() => {
    if (zoomPulseTrigger > 0) {
      setZoomScale(1.18);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        setZoomScale(1.0);
      }, 220);
    }
  }, [zoomPulseTrigger]);

  // Touch Pan Button handler
  const handlePanPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsPanning(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanPointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !onPanDelta) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    onPanDelta(dx, dy);
  };

  const handlePanPointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Touch Zoom Button handler
  const handleZoomPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsZooming(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleZoomPointerMove = (e: React.PointerEvent) => {
    if (!isZooming || !onZoomDelta) return;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    onZoomDelta(-dy * 0.08);
  };

  const handleZoomPointerUp = (e: React.PointerEvent) => {
    setIsZooming(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col items-center select-none pointer-events-auto">
      {/* Gizmo Header Badge */}
      <div className="text-[9px] text-[#9a9a9a] font-mono tracking-wider mb-2 flex items-center gap-1.5 bg-[#252525]/90 px-2 py-0.5 rounded border border-[#444] shadow-md backdrop-blur-xs">
        {gizmoStyle === 'box' && (
          <>
            <Box className="w-3 h-3 text-[#3d7fb8]" />
            <span className="text-[#3d7fb8] font-bold">BOX GIZMO</span>
          </>
        )}
        {gizmoStyle === 'sphere' && (
          <>
            <CircleDot className="w-3 h-3 text-[#a6e3a1]" />
            <span className="text-[#a6e3a1] font-bold">3D SPHERE</span>
          </>
        )}
        {gizmoStyle === 'mountain' && (
          <>
            <MountainIcon className="w-3 h-3 text-[#fab387]" />
            <span className="text-[#fab387] font-bold">MOUNTAIN</span>
          </>
        )}
        <span className="text-[#888]">·</span>
        <span className="text-[#a6e3a1]">WebGL</span>
      </div>

      {/* 3D Interactive Viewport Gizmo Container with Dynamic Zoom Pulse Scale */}
      <div
        className="w-[88px] h-[88px] relative cursor-pointer mb-2 transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoomScale})` }}
      >
        <canvas ref={modelCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-label={`3D ${gizmoStyle} orientation model`} />
        {gizmoModelReady && (
          <div className="absolute inset-0 pointer-events-none text-[8px] font-bold font-mono">
            <button type="button" onClick={() => onSnapView('back')} title="Back direction (-Z)" className="absolute top-0 left-0 pointer-events-auto rounded bg-[#101820]/85 px-1 py-0.5 text-[#89b4fa] shadow">↖ -Z</button>
            <button type="button" onClick={() => onSnapView('top')} title="Top direction (+Y)" className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto rounded bg-[#102014]/85 px-1 py-0.5 text-[#a6e3a1] shadow">↑ +Y</button>
            <button type="button" onClick={() => onSnapView('front')} title="Front direction (+Z)" className="absolute top-0 right-0 pointer-events-auto rounded bg-[#101820]/85 px-1 py-0.5 text-[#89b4fa] shadow">↗ +Z</button>
            <button type="button" onClick={() => onSnapView('left')} title="Left direction (-X)" className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-auto rounded bg-[#201010]/85 px-1 py-0.5 text-[#f38ba8] shadow">← -X</button>
            <button type="button" onClick={() => onSnapView('right')} title="Right direction (+X)" className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-auto rounded bg-[#201010]/85 px-1 py-0.5 text-[#f38ba8] shadow">+X →</button>
            <button type="button" onClick={() => onSnapView('bottom')} title="Bottom direction (-Y)" className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto rounded bg-[#102014]/85 px-1 py-0.5 text-[#a6e3a1] shadow">↓ -Y</button>
          </div>
        )}
        <div className={gizmoModelReady ? 'hidden' : 'contents'}>
        {/* Style 1: 3D Isometric Orientation Box Cube */}
        {gizmoStyle === 'box' && (
          <div
            className="w-full h-full relative transform-style-3d transition-transform duration-75"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${degX}deg) rotateY(${degY}deg)`,
            }}
          >
            {/* Front Face (+Z) */}
            <button
              onClick={() => onSnapView('front')}
              title="Snap to Front View (Numpad 1)"
              className="absolute inset-0 w-full h-full bg-[#303c4f] border border-[#52637a] flex flex-col items-center justify-center text-[10px] font-bold text-[#89b4fa] hover:bg-[#3f4f69] active:bg-[#52688c] transition-colors shadow-inner"
              style={{ transform: 'translateZ(36px)' }}
            >
              <span>FRONT</span>
              <span className="text-[8px] opacity-70 font-mono">+Z</span>
            </button>

            {/* Back Face (-Z) */}
            <button
              onClick={() => onSnapView('back')}
              title="Snap to Back View (Ctrl+Numpad 1)"
              className="absolute inset-0 w-full h-full bg-[#242b38] border border-[#3b4759] flex flex-col items-center justify-center text-[10px] font-bold text-[#89b4fa] hover:bg-[#343e52] active:bg-[#475570] transition-colors shadow-inner"
              style={{ transform: 'rotateY(180deg) translateZ(36px)' }}
            >
              <span>BACK</span>
              <span className="text-[8px] opacity-70 font-mono">-Z</span>
            </button>

            {/* Right Face (+X) */}
            <button
              onClick={() => onSnapView('right')}
              title="Snap to Right View (Numpad 3)"
              className="absolute inset-0 w-full h-full bg-[#4f3030] border border-[#7a5252] flex flex-col items-center justify-center text-[10px] font-bold text-[#f38ba8] hover:bg-[#693f3f] active:bg-[#8c5252] transition-colors shadow-inner"
              style={{ transform: 'rotateY(90deg) translateZ(36px)' }}
            >
              <span>RIGHT</span>
              <span className="text-[8px] opacity-70 font-mono">+X</span>
            </button>

            {/* Left Face (-X) */}
            <button
              onClick={() => onSnapView('left')}
              title="Snap to Left View (Ctrl+Numpad 3)"
              className="absolute inset-0 w-full h-full bg-[#382424] border border-[#593b3b] flex flex-col items-center justify-center text-[10px] font-bold text-[#f38ba8] hover:bg-[#523434] active:bg-[#704747] transition-colors shadow-inner"
              style={{ transform: 'rotateY(-90deg) translateZ(36px)' }}
            >
              <span>LEFT</span>
              <span className="text-[8px] opacity-70 font-mono">-X</span>
            </button>

            {/* Top Face (+Y) */}
            <button
              onClick={() => onSnapView('top')}
              title="Snap to Top View (Numpad 7)"
              className="absolute inset-0 w-full h-full bg-[#304f36] border border-[#527a58] flex flex-col items-center justify-center text-[10px] font-bold text-[#a6e3a1] hover:bg-[#3f6946] active:bg-[#528c5c] transition-colors shadow-inner"
              style={{ transform: 'rotateX(90deg) translateZ(36px)' }}
            >
              <span>TOP</span>
              <span className="text-[8px] opacity-70 font-mono">+Y</span>
            </button>

            {/* Bottom Face (-Y) */}
            <button
              onClick={() => onSnapView('bottom')}
              title="Snap to Bottom View (Ctrl+Numpad 7)"
              className="absolute inset-0 w-full h-full bg-[#243828] border border-[#3b5940] flex flex-col items-center justify-center text-[10px] font-bold text-[#a6e3a1] hover:bg-[#34523a] active:bg-[#47704e] transition-colors shadow-inner"
              style={{ transform: 'rotateX(-90deg) translateZ(36px)' }}
            >
              <span>BOTTOM</span>
              <span className="text-[8px] opacity-70 font-mono">-Y</span>
            </button>
          </div>
        )}

        {/* Style 2: one spherical body with six labels on its surface */}
        {gizmoStyle === 'sphere' && (
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{ transform: `rotateX(${degX}deg) rotateY(${degY}deg)` }}
          >
            <div
              className="relative w-16 h-16 rounded-full border border-[#718096] shadow-lg overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 32% 28%, #9fb4c9 0%, #52677f 28%, #26364c 68%, #101827 100%)',
                boxShadow: 'inset -8px -8px 14px rgba(0,0,0,.55), inset 4px 4px 10px rgba(255,255,255,.22), 0 4px 12px rgba(0,0,0,.45)',
              }}
            >
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 48%, rgba(180,210,235,.22) 49%, rgba(180,210,235,.22) 51%, transparent 52%), linear-gradient(0deg, transparent 48%, rgba(180,210,235,.18) 49%, rgba(180,210,235,.18) 51%, transparent 52%)' }} />
              <button onClick={() => onSnapView('top')} title="Snap to Top View" className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#a6e3a1] drop-shadow">TOP</button>
              <button onClick={() => onSnapView('bottom')} title="Snap to Bottom View" className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#a6e3a1] drop-shadow">BOTTOM</button>
              <button onClick={() => onSnapView('front')} title="Snap to Front View" className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#89b4fa] drop-shadow">FRONT</button>
              <button onClick={() => onSnapView('back')} title="Snap to Back View" className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#89b4fa] drop-shadow">BACK</button>
              <button onClick={() => onSnapView('left')} title="Snap to Left View" className="absolute left-1/2 top-[30%] -translate-x-1/2 text-[8px] font-bold text-[#f38ba8] drop-shadow">LEFT</button>
              <button onClick={() => onSnapView('right')} title="Snap to Right View" className="absolute left-1/2 bottom-[30%] -translate-x-1/2 text-[8px] font-bold text-[#f38ba8] drop-shadow">RIGHT</button>
            </div>
          </div>
        )}

        {/* Style 3: one mountain silhouette with six labels on the same shape */}
        {gizmoStyle === 'mountain' && (
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{ transform: `rotateX(${degX}deg) rotateY(${degY}deg)` }}
          >
            <div
              className="relative w-[68px] h-[64px] border border-[#8b9b9a] shadow-lg"
              style={{
                clipPath: 'polygon(50% 0%, 59% 19%, 69% 34%, 78% 52%, 100% 100%, 0% 100%, 22% 52%, 36% 31%)',
                background: 'linear-gradient(155deg, #f1f5f9 0%, #cbd5e1 19%, #8b7355 37%, #355b49 68%, #18392d 100%)',
                filter: 'drop-shadow(0 4px 5px rgba(0,0,0,.45))',
              }}
            >
              <button onClick={() => onSnapView('top')} title="Snap to Top View" className="absolute top-[8%] left-1/2 -translate-x-1/2 text-[8px] font-black text-[#a6e3a1] drop-shadow">TOP</button>
              <button onClick={() => onSnapView('front')} title="Snap to Front View" className="absolute top-[42%] left-[15%] text-[8px] font-bold text-[#89b4fa] drop-shadow">FRONT</button>
              <button onClick={() => onSnapView('back')} title="Snap to Back View" className="absolute top-[42%] right-[15%] text-[8px] font-bold text-[#89b4fa] drop-shadow">BACK</button>
              <button onClick={() => onSnapView('left')} title="Snap to Left View" className="absolute bottom-[18%] left-[7%] text-[8px] font-bold text-[#f38ba8] drop-shadow">LEFT</button>
              <button onClick={() => onSnapView('right')} title="Snap to Right View" className="absolute bottom-[18%] right-[7%] text-[8px] font-bold text-[#f38ba8] drop-shadow">RIGHT</button>
              <button onClick={() => onSnapView('bottom')} title="Snap to Bottom View" className="absolute bottom-[2%] left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#a6e3a1] drop-shadow">BOTTOM</button>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Axis Selector & Flip View Row */}
      <div className="flex items-center gap-1 mb-1.5 bg-[#252525]/90 px-1.5 py-0.5 rounded border border-[#444] shadow-md backdrop-blur-xs">
        <span className="text-[9px] text-[#777] font-mono mr-0.5">AXIS:</span>
        <button
          onClick={() => onSnapView('right')}
          className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#f38ba8] hover:bg-[#4f3030] rounded transition-colors"
          title="Snap to +X Axis (Right)"
        >
          X
        </button>
        <button
          onClick={() => onSnapView('top')}
          className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#a6e3a1] hover:bg-[#304f36] rounded transition-colors"
          title="Snap to +Y/Top Axis"
        >
          Y
        </button>
        <button
          onClick={() => onSnapView('front')}
          className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#89b4fa] hover:bg-[#303c4f] rounded transition-colors"
          title="Snap to Front Axis (+Z)"
        >
          Z
        </button>

        {/* Flip view button to opposite direction */}
        {onFlipView && (
          <button
            onClick={onFlipView}
            className="ml-1 px-1.5 py-0.5 bg-[#3a3a3a] hover:bg-[#505050] text-[#ff7b72] active:bg-[#ff7b72] active:text-black rounded border border-[#555] text-[10px] font-bold flex items-center gap-0.5 transition-colors shadow-xs"
            title="Flip view to opposite direction (-)"
          >
            <Minus className="w-3 h-3 stroke-[3]" />
            <span className="text-[9px] font-mono">FLIP</span>
          </button>
        )}
      </div>

      {/* Quick Action Touch Buttons below Gizmo */}
      <div className="flex items-center gap-1 bg-[#252525]/90 p-1 rounded border border-[#444] shadow-md backdrop-blur-xs">
        {/* Auto-Fit / Frame Model in Viewport Button */}
        {onAutoFit && (
          <button
            onClick={onAutoFit}
            className="p-1.5 rounded transition-colors bg-[#353535] hover:bg-[#454545] text-[#38bdf8] border border-[#555]"
            title="Auto-Fit / Frame Model in Viewport (Center & Fit)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Touch Pan Button */}
        <button
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          className={`p-1.5 rounded transition-colors ${
            isPanning
              ? 'bg-[#3d7fb8] text-white'
              : 'hover:bg-[#3a3a3a] text-[#ccc]'
          }`}
          title="Drag to Pan Camera"
        >
          <Move className="w-3.5 h-3.5" />
        </button>

        {/* Touch Zoom Button */}
        <button
          onPointerDown={handleZoomPointerDown}
          onPointerMove={handleZoomPointerMove}
          onPointerUp={handleZoomPointerUp}
          className={`p-1.5 rounded transition-colors ${
            isZooming
              ? 'bg-[#3d7fb8] text-white'
              : 'hover:bg-[#3a3a3a] text-[#ccc]'
          }`}
          title="Drag to Zoom Camera"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Orthographic / Perspective */}
        {onToggleOrtho && (
          <button
            onClick={onToggleOrtho}
            className={`px-1 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
              isOrtho
                ? 'bg-[#a6e3a1] text-black'
                : 'hover:bg-[#3a3a3a] text-[#ccc]'
            }`}
            title="Toggle Perspective / Orthographic View (Numpad 5)"
          >
            {isOrtho ? 'ORTH' : 'PERSP'}
          </button>
        )}

        {/* Reset Camera View */}
        {onResetCamera && (
          <button
            onClick={onResetCamera}
            className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors"
            title="Reset Camera View (Numpad 0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Touch Navigation Mode Toggle */}
        {onToggleTouchNav && (
          <button
            onClick={onToggleTouchNav}
            className={`p-1.5 rounded transition-colors ${
              touchNavEnabled
                ? 'bg-[#3d7fb8] text-white'
                : 'hover:bg-[#3a3a3a] text-[#888]'
            }`}
            title="Toggle Android / Tablet Touch Navigation"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Navigation Flip / Invert Axis Quick Button */}
        {onToggleInvertNav && (
          <button
            onClick={onToggleInvertNav}
            className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold transition-colors flex items-center gap-1 shadow-xs ${
              invertNav
                ? 'bg-[#fab387] text-black font-extrabold'
                : 'bg-[#2f2f2f] hover:bg-[#3d3d3d] text-[#ddd] border border-[#555]'
            }`}
            title={`Toggle Orbit & Drone Mouse Navigation Direction (Currently: ${invertNav ? 'Inverted' : 'Standard Natural'})`}
          >
            <span className="text-[11px] leading-none">⇄</span>
            <span>{invertNav ? 'INV' : 'NAT'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
