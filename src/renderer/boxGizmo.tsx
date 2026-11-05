/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Multi-Mode 3D Orientation Gizmo (Box, Sphere, Mountain)
 * Created by Victory Ukpong
 */

import React, { useState, useRef, useEffect } from 'react';
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
        <span className="text-[#a6e3a1]">DX11/WASM</span>
      </div>

      {/* 3D Interactive Viewport Gizmo Container with Dynamic Zoom Pulse Scale */}
      <div 
        className="w-18 h-18 relative perspective-800 cursor-pointer mb-2 transition-transform duration-200 ease-out"
        style={{ 
          perspective: '360px',
          transform: `scale(${zoomScale})`
        }}
      >
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
              <span className="text-[8px] opacity-70 font-mono">-Y</span>
            </button>

            {/* Back Face (-Z) */}
            <button
              onClick={() => onSnapView('back')}
              title="Snap to Back View (Ctrl+Numpad 1)"
              className="absolute inset-0 w-full h-full bg-[#242b38] border border-[#3b4759] flex flex-col items-center justify-center text-[10px] font-bold text-[#89b4fa] hover:bg-[#343e52] active:bg-[#475570] transition-colors shadow-inner"
              style={{ transform: 'rotateY(180deg) translateZ(36px)' }}
            >
              <span>BACK</span>
              <span className="text-[8px] opacity-70 font-mono">+Y</span>
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
              <span className="text-[8px] opacity-70 font-mono">+Z</span>
            </button>

            {/* Bottom Face (-Y) */}
            <button
              onClick={() => onSnapView('bottom')}
              title="Snap to Bottom View (Ctrl+Numpad 7)"
              className="absolute inset-0 w-full h-full bg-[#243828] border border-[#3b5940] flex flex-col items-center justify-center text-[10px] font-bold text-[#a6e3a1] hover:bg-[#34523a] active:bg-[#47704e] transition-colors shadow-inner"
              style={{ transform: 'rotateX(-90deg) translateZ(36px)' }}
            >
              <span>BOTTOM</span>
              <span className="text-[8px] opacity-70 font-mono">-Z</span>
            </button>
          </div>
        )}

        {/* Style 2: 3D Interactive Orientation Sphere with Axis Nodes */}
        {gizmoStyle === 'sphere' && (
          <div
            className="w-full h-full relative transform-style-3d transition-transform duration-75 flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${degX}deg) rotateY(${degY}deg)`,
            }}
          >
            {/* Sphere core body */}
            <div 
              className="absolute w-14 h-14 rounded-full border border-[#555] shadow-lg"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #4a5568 0%, #1e293b 70%, #0f172a 100%)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.4)',
                transform: 'translateZ(0px)',
              }}
            />
            {/* Equator Ring (XY) */}
            <div 
              className="absolute w-16 h-16 rounded-full border border-sky-400/40 pointer-events-none"
              style={{ transform: 'rotateX(90deg)' }}
            />
            {/* Meridian Ring (YZ) */}
            <div 
              className="absolute w-16 h-16 rounded-full border border-emerald-400/40 pointer-events-none"
              style={{ transform: 'rotateY(90deg)' }}
            />
            {/* Meridian Ring (XZ) */}
            <div 
              className="absolute w-16 h-16 rounded-full border border-rose-400/40 pointer-events-none"
              style={{ transform: 'rotateZ(0deg)' }}
            />

            {/* +Z Pole (Front) */}
            <button
              onClick={() => onSnapView('front')}
              title="Snap to Front (+Z)"
              className="absolute w-6 h-6 -ml-3 -mt-3 top-1/2 left-1/2 bg-sky-600 hover:bg-sky-400 text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-md border border-sky-200 transition-colors"
              style={{ transform: 'translateZ(32px)' }}
            >
              +Z
            </button>
            {/* -Z Pole (Back) */}
            <button
              onClick={() => onSnapView('back')}
              title="Snap to Back (-Z)"
              className="absolute w-6 h-6 -ml-3 -mt-3 top-1/2 left-1/2 bg-sky-900/90 hover:bg-sky-700 text-sky-200 rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-md border border-sky-400/50 transition-colors"
              style={{ transform: 'rotateY(180deg) translateZ(32px)' }}
            >
              -Z
            </button>
            {/* +X Pole (Right) */}
            <button
              onClick={() => onSnapView('right')}
              title="Snap to Right (+X)"
              className="absolute w-6 h-6 -ml-3 -mt-3 top-1/2 left-1/2 bg-rose-600 hover:bg-rose-400 text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-md border border-rose-200 transition-colors"
              style={{ transform: 'rotateY(90deg) translateZ(32px)' }}
            >
              +X
            </button>
            {/* -X Pole (Left) */}
            <button
              onClick={() => onSnapView('left')}
              title="Snap to Left (-X)"
              className="absolute w-6 h-6 -ml-3 -mt-3 top-1/2 left-1/2 bg-rose-900/90 hover:bg-rose-700 text-rose-200 rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-md border border-rose-400/50 transition-colors"
              style={{ transform: 'rotateY(-90deg) translateZ(32px)' }}
            >
              -X
            </button>
            {/* +Y Pole (Top) */}
            <button
              onClick={() => onSnapView('top')}
              title="Snap to Top (+Y)"
              className="absolute w-6 h-6 -ml-3 -mt-3 top-1/2 left-1/2 bg-emerald-600 hover:bg-emerald-400 text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-md border border-emerald-200 transition-colors"
              style={{ transform: 'rotateX(90deg) translateZ(32px)' }}
            >
              +Y
            </button>
            {/* -Y Pole (Bottom) */}
            <button
              onClick={() => onSnapView('bottom')}
              title="Snap to Bottom (-Y)"
              className="absolute w-6 h-6 -ml-3 -mt-3 top-1/2 left-1/2 bg-emerald-900/90 hover:bg-emerald-700 text-emerald-200 rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-md border border-emerald-400/50 transition-colors"
              style={{ transform: 'rotateX(-90deg) translateZ(32px)' }}
            >
              -Y
            </button>
          </div>
        )}

        {/* Style 3: 3D Mountain Peak with Trapezium/Triangle Faces & Elevation Gradient */}
        {gizmoStyle === 'mountain' && (
          <div
            className="w-full h-full relative transform-style-3d transition-transform duration-75 flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${degX}deg) rotateY(${degY}deg)`,
            }}
          >
            {/* Snow Peak / Summit (+Y / Top) */}
            <button
              onClick={() => onSnapView('top')}
              title="Summit / Top View"
              className="absolute w-9 h-9 -ml-4.5 -mt-4.5 top-1/2 left-1/2 bg-gradient-to-b from-white via-sky-100 to-slate-200 text-slate-800 rounded-xs text-[9px] font-black font-mono flex items-center justify-center shadow-md border border-white hover:scale-110 transition-transform"
              style={{
                transform: 'translateY(-22px) rotateX(90deg)',
                boxShadow: '0 0 10px rgba(255,255,255,0.7)',
              }}
            >
              PEAK
            </button>

            {/* Front Slope (South face) */}
            <button
              onClick={() => onSnapView('front')}
              title="South Slope / Front View"
              className="absolute w-12 h-9 -ml-6 -mt-4.5 top-1/2 left-1/2 bg-gradient-to-b from-slate-300 via-amber-800 to-emerald-800 text-white text-[9px] font-bold border border-[#52637a] flex flex-col items-center justify-center hover:brightness-125 transition-all shadow-md"
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: 'rotateX(-35deg) translateZ(24px)',
              }}
            >
              <span className="text-[8px] font-black text-amber-200">FRONT</span>
            </button>

            {/* Back Slope (North face) */}
            <button
              onClick={() => onSnapView('back')}
              title="North Slope / Back View"
              className="absolute w-12 h-9 -ml-6 -mt-4.5 top-1/2 left-1/2 bg-gradient-to-b from-slate-400 via-slate-700 to-emerald-950 text-white text-[9px] font-bold border border-[#3b4759] flex flex-col items-center justify-center hover:brightness-125 transition-all shadow-md"
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: 'rotateY(180deg) rotateX(-35deg) translateZ(24px)',
              }}
            >
              <span className="text-[8px] font-black text-slate-200">BACK</span>
            </button>

            {/* Right Slope (East face) */}
            <button
              onClick={() => onSnapView('right')}
              title="East Slope / Right View"
              className="absolute w-12 h-9 -ml-6 -mt-4.5 top-1/2 left-1/2 bg-gradient-to-b from-slate-300 via-rose-900 to-emerald-800 text-white text-[9px] font-bold border border-[#7a5252] flex flex-col items-center justify-center hover:brightness-125 transition-all shadow-md"
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: 'rotateY(90deg) rotateX(-35deg) translateZ(24px)',
              }}
            >
              <span className="text-[8px] font-black text-rose-200">EAST</span>
            </button>

            {/* Left Slope (West face) */}
            <button
              onClick={() => onSnapView('left')}
              title="West Slope / Left View"
              className="absolute w-12 h-9 -ml-6 -mt-4.5 top-1/2 left-1/2 bg-gradient-to-b from-slate-400 via-stone-800 to-emerald-900 text-white text-[9px] font-bold border border-[#593b3b] flex flex-col items-center justify-center hover:brightness-125 transition-all shadow-md"
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: 'rotateY(-90deg) rotateX(-35deg) translateZ(24px)',
              }}
            >
              <span className="text-[8px] font-black text-stone-200">WEST</span>
            </button>

            {/* Base / Valley Foothills (-Y / Bottom) */}
            <button
              onClick={() => onSnapView('bottom')}
              title="Valley / Bottom View"
              className="absolute w-16 h-16 -ml-8 -mt-8 top-1/2 left-1/2 bg-[#1b4332] border border-[#2d6a4f] text-emerald-300 rounded text-[9px] font-bold flex items-center justify-center hover:bg-[#2d6a4f] transition-colors"
              style={{ transform: 'translateY(24px) rotateX(90deg)' }}
            >
              BASE
            </button>
          </div>
        )}
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
