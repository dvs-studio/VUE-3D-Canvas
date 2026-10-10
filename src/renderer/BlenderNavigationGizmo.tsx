/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Exact Blender 2.8+ Viewport Navigation Gizmo & Touch Controls
 * Created by Victory Ukpong
 */

import React, { useRef } from 'react';
import { ZoomIn, Hand, Camera, Grid3X3, Smartphone } from 'lucide-react';

interface BlenderNavigationGizmoProps {
  rotation: { x: number; y: number };
  onSnapView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => void;
  onPanDelta: (dx: number, dy: number) => void;
  onZoomDelta: (delta: number) => void;
  onToggleOrtho: () => void;
  onResetCamera: () => void;
  isOrtho: boolean;
  touchNavEnabled: boolean;
  onToggleTouchNav: () => void;
}

export const BlenderNavigationGizmo: React.FC<BlenderNavigationGizmoProps> = ({
  rotation,
  onSnapView,
  onPanDelta,
  onZoomDelta,
  onToggleOrtho,
  onResetCamera,
  isOrtho,
  touchNavEnabled,
  onToggleTouchNav,
}) => {
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoomStartRef = useRef<{ y: number } | null>(null);

  // Convert spherical angles to 3D rotation transform
  const degX = (rotation.x * 180) / Math.PI;
  const degY = (rotation.y * 180) / Math.PI;

  // Zoom button drag handler (touch & mouse)
  const handleZoomPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    zoomStartRef.current = { y: e.clientY };
  };

  const handleZoomPointerMove = (e: React.PointerEvent) => {
    if (!zoomStartRef.current) return;
    const dy = e.clientY - zoomStartRef.current.y;
    zoomStartRef.current.y = e.clientY;
    onZoomDelta(-dy * 0.015);
  };

  const handleZoomPointerUp = (e: React.PointerEvent) => {
    zoomStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Pan button drag handler (touch & mouse)
  const handlePanPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePanPointerMove = (e: React.PointerEvent) => {
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    onPanDelta(dx, dy);
  };

  const handlePanPointerUp = (e: React.PointerEvent) => {
    panStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* 1. Blender 2.8 3D Orientation Axes Knob */}
      <div 
        className="w-18 h-18 relative rounded-full bg-[#1e1e1e]/80 backdrop-blur-xs border border-[#444] shadow-xl flex items-center justify-center p-1 cursor-grab"
        style={{ perspective: '350px' }}
      >
        <div
          className="w-14 h-14 relative transform-style-3d transition-transform duration-75 flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${-degX}deg) rotateY(${degY}deg)`,
          }}
        >
          {/* Central core */}
          <div className="w-5 h-5 rounded-full bg-[#3a3a3a] border border-[#666] absolute shadow-inner" />

          {/* +X Axis Red Disc */}
          <button
            onClick={() => onSnapView('right')}
            title="Snap Right (+X)"
            className="absolute w-5 h-5 -mr-12 rounded-full bg-[#e05656] hover:bg-[#ff6b6b] text-[9px] font-bold text-white flex items-center justify-center border border-white/40 shadow-md cursor-pointer"
            style={{ transform: 'translateX(24px)' }}
          >
            X
          </button>

          {/* -X Axis Gray Disc */}
          <button
            onClick={() => onSnapView('left')}
            title="Snap Left (-X)"
            className="absolute w-4 h-4 rounded-full bg-[#444] hover:bg-[#666] text-[8px] text-[#aaa] flex items-center justify-center border border-white/20 cursor-pointer"
            style={{ transform: 'translateX(-24px)' }}
          >
            -X
          </button>

          {/* +Y Axis Green Disc (Top / Back in Blender coordinates) */}
          <button
            onClick={() => onSnapView('top')}
            title="Snap Top (+Z)"
            className="absolute w-5 h-5 rounded-full bg-[#56ba56] hover:bg-[#6edc6e] text-[9px] font-bold text-white flex items-center justify-center border border-white/40 shadow-md cursor-pointer"
            style={{ transform: 'translateY(-24px)' }}
          >
            Z
          </button>

          {/* -Y Axis Gray Disc */}
          <button
            onClick={() => onSnapView('bottom')}
            title="Snap Bottom (-Z)"
            className="absolute w-4 h-4 rounded-full bg-[#444] hover:bg-[#666] text-[8px] text-[#aaa] flex items-center justify-center border border-white/20 cursor-pointer"
            style={{ transform: 'translateY(24px)' }}
          >
            -Z
          </button>

          {/* +Z Axis Blue Disc (Front in Blender coordinates) */}
          <button
            onClick={() => onSnapView('front')}
            title="Snap Front (-Y)"
            className="absolute w-5 h-5 rounded-full bg-[#4ea8de] hover:bg-[#64b5f6] text-[9px] font-bold text-white flex items-center justify-center border border-white/40 shadow-md cursor-pointer"
            style={{ transform: 'translateZ(24px)' }}
          >
            Y
          </button>

          {/* -Z Axis Gray Disc */}
          <button
            onClick={() => onSnapView('back')}
            title="Snap Back (+Y)"
            className="absolute w-4 h-4 rounded-full bg-[#444] hover:bg-[#666] text-[8px] text-[#aaa] flex items-center justify-center border border-white/20 cursor-pointer"
            style={{ transform: 'translateZ(-24px)' }}
          >
            -Y
          </button>
        </div>
      </div>

      {/* 2. Blender 2.8 Viewport Navigation Icon Strip */}
      <div className="flex flex-col gap-1 bg-[#222222]/90 backdrop-blur-xs p-1 rounded-full border border-[#444] shadow-lg">
        {/* Zoom Button: Drag up/down with 1 finger/mouse */}
        <button
          onPointerDown={handleZoomPointerDown}
          onPointerMove={handleZoomPointerMove}
          onPointerUp={handleZoomPointerUp}
          className="w-7 h-7 rounded-full bg-[#333] hover:bg-[#444] active:bg-[#3d7fb8] text-[#ccc] hover:text-white flex items-center justify-center cursor-ns-resize transition-colors border border-[#4a4a4a]"
          title="Zoom View (Drag Up/Down with Touch or Mouse)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Move / Pan Button: Drag with 1 finger/mouse */}
        <button
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          className="w-7 h-7 rounded-full bg-[#333] hover:bg-[#444] active:bg-[#3d7fb8] text-[#ccc] hover:text-white flex items-center justify-center cursor-move transition-colors border border-[#4a4a4a]"
          title="Move View / Pan (Drag with Touch or Mouse)"
        >
          <Hand className="w-3.5 h-3.5" />
        </button>

        {/* Camera Reset View Toggle */}
        <button
          onClick={onResetCamera}
          className="w-7 h-7 rounded-full bg-[#333] hover:bg-[#444] text-[#ccc] hover:text-white flex items-center justify-center transition-colors border border-[#4a4a4a]"
          title="Reset Camera Framing (Numpad 0)"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>

        {/* Orthographic / Perspective Toggle */}
        <button
          onClick={onToggleOrtho}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors border ${
            isOrtho
              ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
              : 'bg-[#333] hover:bg-[#444] text-[#ccc] border-[#4a4a4a]'
          }`}
          title="Toggle Perspective / Orthographic View (Numpad 5)"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
        </button>

        {/* Blender Touch Navigation Toggle */}
        <button
          onClick={onToggleTouchNav}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors border ${
            touchNavEnabled
              ? 'bg-[#3d7fb8] text-white border-[#5ca2db] ring-1 ring-blue-400'
              : 'bg-[#333] hover:bg-[#444] text-[#aaa] border-[#4a4a4a]'
          }`}
          title="Toggle Touch Navigation (Blender Touch Style: 1-finger orbit, 2-finger pan/zoom)"
        >
          <Smartphone className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
