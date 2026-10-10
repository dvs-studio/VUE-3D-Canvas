/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Tool Options Sub-Toolbar
 * Created by Victory Ukpong
 */

import React from 'react';
import { ToolType, BrushPreset, ViewportShadingMode } from '../core/types';
import { Sliders, Box, Layers, SplitSquareVertical, Eye, Camera, Disc } from 'lucide-react';

interface ToolOptionsBarProps {
  activeTool: ToolType;
  brush: BrushPreset;
  onUpdateBrush: (patch: Partial<BrushPreset>) => void;
  selectedModelKey: string;
  onSelectModelKey: (key: string) => void;
  shadingMode: ViewportShadingMode;
  onSelectShadingMode: (mode: ViewportShadingMode) => void;
  viewMode: '3d' | '2d' | 'split';
  onSelectViewMode: (mode: '3d' | '2d' | 'split') => void;
  onOpenCarousel: () => void;
  onTriggerProjection: () => void;
  isNavLocked: boolean;
}

export const ToolOptionsBar: React.FC<ToolOptionsBarProps> = ({
  activeTool,
  brush,
  onUpdateBrush,
  selectedModelKey,
  onSelectModelKey,
  shadingMode,
  onSelectShadingMode,
  viewMode,
  onSelectViewMode,
  onOpenCarousel,
  onTriggerProjection,
  isNavLocked,
}) => {
  return (
    <div className="h-8 bg-[#3c3c3c] border-b border-[#242424] px-2 flex items-center justify-between text-xs text-[#c8c8c8] select-none z-40 overflow-x-auto">
      {/* Tool-specific Parameters */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Active Tool Label */}
        <div className="flex items-center gap-1.5 font-bold text-[#eee] uppercase tracking-wider text-[11px] bg-[#303030] px-2 py-0.5 rounded border border-[#484848] cs5-inset">
          <span>{activeTool.replace('_', ' ')}</span>
        </div>

        {/* Brush Parameters if paint tool */}
        {['brush', 'eraser', 'blur', 'clone', 'smudge'].includes(activeTool) && (
          <div className="flex items-center gap-3">
            {/* Size */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#aaa]">Size:</span>
              <input
                type="range"
                min="1"
                max="128"
                value={brush.size}
                onChange={(e) => onUpdateBrush({ size: Number(e.target.value) })}
                className="w-16 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#eee] w-7">{brush.size}px</span>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#aaa]">Opacity:</span>
              <input
                type="range"
                min="1"
                max="100"
                value={brush.opacity}
                onChange={(e) => onUpdateBrush({ opacity: Number(e.target.value) })}
                className="w-16 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#eee] w-7">{brush.opacity}%</span>
            </div>

            {/* Spacing Trigger */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#aaa]">Spacing:</span>
              <input
                type="range"
                min="1"
                max="150"
                value={brush.spacing}
                onChange={(e) => onUpdateBrush({ spacing: Number(e.target.value) })}
                className="w-14 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#3d7fb8] w-7">{brush.spacing}%</span>
            </div>

            {/* Scatter Jitter Trigger */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#aaa]">Scatter:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={brush.scatter}
                onChange={(e) => onUpdateBrush({ scatter: Number(e.target.value) })}
                className="w-14 accent-[#e5a038] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#e5a038] w-7">{brush.scatter}%</span>
            </div>

            {/* Stabilizer (Medibang Lazy Mouse) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#aaa]">Stabilizer:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={brush.stabilizer}
                onChange={(e) => onUpdateBrush({ stabilizer: Number(e.target.value) })}
                className="w-14 accent-[#a6e3a1] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#a6e3a1] w-7">{brush.stabilizer}%</span>
            </div>

            {/* Carousel launcher button */}
            <button
              onClick={onOpenCarousel}
              className="px-2 py-0.5 bg-[#484848] hover:bg-[#555] text-white rounded text-[10px] flex items-center gap-1 border border-[#606060]"
              title="Open Brush Carousel Wheel (V)"
            >
              <Disc className="w-3 h-3 text-[#3d7fb8]" />
              Presets (V)
            </button>
          </div>
        )}
      </div>

      {/* Global Viewport Controls & Shading */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Model Presets */}
        <div className="flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-[#3d7fb8]" />
          <select
            value={selectedModelKey}
            onChange={(e) => onSelectModelKey(e.target.value)}
            className="bg-[#2a2a2a] border border-[#555] text-[#eee] rounded px-1.5 py-0.5 text-[11px] outline-none cs5-inset"
          >
            <option value="suzanne">Suzanne (Blender Monkey)</option>
            <option value="helmet">Cyber Armor Helmet</option>
            <option value="sphere">Showcase Sphere</option>
            <option value="cube">Beveled Box</option>
            <option value="cylinder">Barrel Cylinder</option>
            <option value="torus">Arc Torus</option>
          </select>
        </div>

        {/* Shading Mode */}
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#aaa]" />
          <select
            value={shadingMode}
            onChange={(e) => onSelectShadingMode(e.target.value as ViewportShadingMode)}
            className="bg-[#2a2a2a] border border-[#555] text-[#eee] rounded px-1.5 py-0.5 text-[11px] outline-none cs5-inset"
          >
            <option value="material">PBR Material</option>
            <option value="flat">Flat Color</option>
            <option value="normal">Normals</option>
            <option value="wireframe">Wireframe</option>
            <option value="clay">Studio Clay</option>
            <option value="uv_check">UV Checker</option>
          </select>
        </div>

        {/* View Mode Splitter */}
        <div className="flex items-center bg-[#2d2d2d] rounded p-0.5 border border-[#484848]">
          <button
            onClick={() => onSelectViewMode('3d')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              viewMode === '3d' ? 'bg-[#3d7fb8] text-white font-medium' : 'text-[#aaa] hover:text-white'
            }`}
          >
            3D View
          </button>
          <button
            onClick={() => onSelectViewMode('split')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              viewMode === 'split' ? 'bg-[#3d7fb8] text-white font-medium' : 'text-[#aaa] hover:text-white'
            }`}
          >
            Split 3D+UV
          </button>
          <button
            onClick={() => onSelectViewMode('2d')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              viewMode === '2d' ? 'bg-[#3d7fb8] text-white font-medium' : 'text-[#aaa] hover:text-white'
            }`}
          >
            2D UV Map
          </button>
        </div>
      </div>
    </div>
  );
};
