/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Navigator Panel
 * Created by Victory Ukpong
 */

import React from 'react';
import { Compass, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface NavigatorPanelProps {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  isOrtho: boolean;
  onToggleOrtho: () => void;
}

export const NavigatorPanel: React.FC<NavigatorPanelProps> = ({
  zoomLevel,
  onZoomChange,
  onResetView,
  isOrtho,
  onToggleOrtho,
}) => {
  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838]">
      {/* Mini Radar / Viewport Frame */}
      <div className="p-3 bg-[#242424] flex items-center justify-center border-b border-[#494949]">
        <div className="w-36 h-28 bg-[#1e1e1e] border border-[#555] rounded relative flex items-center justify-center overflow-hidden cs5-inset">
          {/* Crosshair & Radar Rings */}
          <div className="w-20 h-20 rounded-full border border-[#444]/60 pointer-events-none" />
          <div className="w-10 h-10 rounded-full border border-[#3d7fb8]/40 pointer-events-none" />
          <div className="w-full h-[1px] bg-[#444]/40 absolute pointer-events-none" />
          <div className="h-full w-[1px] bg-[#444]/40 absolute pointer-events-none" />

          {/* Model indicator dot */}
          <div className="w-3 h-3 rounded-full bg-[#3d7fb8] shadow-md z-10 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>

          <div className="absolute bottom-1 right-1 text-[9px] font-mono text-[#888]">
            {isOrtho ? 'ORTHO' : 'PERSP'}
          </div>
        </div>
      </div>

      {/* Zoom Slider and Controls */}
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#aaa] flex items-center gap-1">
            <ZoomIn className="w-3 h-3 text-[#3d7fb8]" /> Zoom Factor
          </span>
          <span className="text-[#eee] font-mono font-bold">{Math.round(zoomLevel * 100)}%</span>
        </div>

        <input
          type="range"
          min="0.4"
          max="3.0"
          step="0.05"
          value={zoomLevel}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-full accent-[#3d7fb8] h-1.5"
        />

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onToggleOrtho}
            className={`px-2 py-1 rounded text-[10px] border transition-colors ${
              isOrtho ? 'bg-[#3d7fb8] text-white border-[#555]' : 'bg-[#444] text-[#ccc] border-[#555] hover:bg-[#505050]'
            }`}
          >
            {isOrtho ? 'Switch to Perspective' : 'Switch to Orthographic'}
          </button>

          <button
            onClick={onResetView}
            className="px-2 py-1 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#555] text-[10px] flex items-center gap-1 transition-colors"
            title="Reset Camera Framing"
          >
            <RotateCcw className="w-3 h-3" />
            Center
          </button>
        </div>
      </div>
    </div>
  );
};
