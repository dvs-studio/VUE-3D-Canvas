/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Authentic Square 3D Orientation Box Gizmo
 * Created by Victory Ukpong
 */

import React, { useState, useRef } from 'react';
import { 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  RotateCcw, 
  Smartphone,
  Maximize2,
  Minus
} from 'lucide-react';

interface BoxGizmoProps {
  rotation: { x: number; y: number };
  onSnapView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => void;
  onFlipView?: () => void;
  onPanDelta?: (dx: number, dy: number) => void;
  onZoomDelta?: (delta: number) => void;
  onToggleOrtho?: () => void;
  onResetCamera?: () => void;
  isOrtho?: boolean;
  touchNavEnabled?: boolean;
  onToggleTouchNav?: () => void;
}

export const BoxGizmo: React.FC<BoxGizmoProps> = ({
  rotation,
  onSnapView,
  onFlipView,
  onPanDelta,
  onZoomDelta,
  onToggleOrtho,
  onResetCamera,
  isOrtho = false,
  touchNavEnabled = false,
  onToggleTouchNav,
}) => {
  // Convert spherical angles to 3D CSS transform matrix
  const degX = (rotation.x * 180) / Math.PI;
  const degY = (rotation.y * 180) / Math.PI;

  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

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
        <span className="text-[#3d7fb8] font-bold">■ SQUARE GIZMO</span>
        <span className="text-[#888]">·</span>
        <span className="text-[#a6e3a1]">DX11/WASM</span>
      </div>

      {/* 3D Isometric Square Cube */}
      <div 
        className="w-18 h-18 relative perspective-800 cursor-pointer mb-2"
        style={{ perspective: '350px' }}
      >
        <div
          className="w-full h-full relative transform-style-3d transition-transform duration-75"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${-degX}deg) rotateY(${degY}deg)`,
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
          title="Snap to +Z/Top Axis"
        >
          Y
        </button>
        <button
          onClick={() => onSnapView('front')}
          className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#89b4fa] hover:bg-[#303c4f] rounded transition-colors"
          title="Snap to Front Axis"
        >
          Z
        </button>

        {/* Requested little minus button for flipping view to opposite direction */}
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

      {/* Quick Action Touch Buttons below Square Gizmo */}
      <div className="flex items-center gap-1 bg-[#252525]/90 p-1 rounded border border-[#444] shadow-md backdrop-blur-xs">
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
      </div>
    </div>
  );
};
