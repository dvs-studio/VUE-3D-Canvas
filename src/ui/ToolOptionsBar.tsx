/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Tool Options Sub-Toolbar
 * Created by Victory Ukpong
 */

import React from 'react';
import { ToolType, BrushPreset, ViewportShadingMode } from '../core/types';
import { Sliders, Box, Layers, SplitSquareVertical, Eye, Camera, Disc, Smartphone, LayoutGrid } from 'lucide-react';

interface ToolOptionsBarProps {
  activeTool: ToolType;
  brush: BrushPreset;
  onUpdateBrush: (patch: Partial<BrushPreset>) => void;
  selectedModelKey?: string;
  onSelectModelKey?: (key: string) => void;
  shadingMode: ViewportShadingMode;
  onSelectShadingMode: (mode: ViewportShadingMode) => void;
  viewMode: '3d' | '2d' | 'split';
  onSelectViewMode: (mode: '3d' | '2d' | 'split') => void;
  onOpenCarousel: () => void;
  onTriggerProjection: () => void;
  isNavLocked: boolean;
  touchNavEnabled: boolean;
  onToggleTouchNav: () => void;
  viewLayout?: 'perspective' | 'quad';
  onSelectViewLayout?: (layout: 'perspective' | 'quad') => void;
  isSymmetryX?: boolean;
  onToggleSymmetryX?: () => void;
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
  touchNavEnabled,
  onToggleTouchNav,
  viewLayout,
  onSelectViewLayout,
  isSymmetryX = false,
  onToggleSymmetryX,
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
          <div className="flex items-center gap-2.5">
            {/* 1. BRUSH TYPE (Stroke Application Method) */}
            <div className="flex items-center gap-1 bg-[#303030] px-1.5 py-0.5 rounded border border-[#4a4a4a]">
              <span className="text-[10px] text-[#f5c2e7] font-semibold uppercase">Type:</span>
              <select
                value={brush.strokeType || 'space'}
                onChange={(e) => onUpdateBrush({ strokeType: e.target.value as any })}
                className="bg-[#242424] border border-[#555] text-white rounded px-1 py-0.5 text-[10px] outline-none font-medium cursor-pointer"
                title="Brush Application Mode: Space, Airbrush, Dot, Dragged-Dot, Curve"
              >
                <option value="space">Space</option>
                <option value="airbrush">Airbrush</option>
                <option value="dot">Dot</option>
                <option value="dragged-dot">Dragged-Dot</option>
                <option value="curve">Curve</option>
              </select>
            </div>

            {/* 2. BRUSH MASK (Stencil Tip) */}
            <div className="flex items-center gap-1 bg-[#303030] px-1.5 py-0.5 rounded border border-[#4a4a4a]">
              <span className="text-[10px] text-[#89b4fa] font-semibold uppercase">Mask:</span>
              <select
                value={brush.maskType || 'none'}
                onChange={(e) => onUpdateBrush({ maskType: e.target.value as any })}
                className="bg-[#242424] border border-[#555] text-white rounded px-1 py-0.5 text-[10px] outline-none font-medium cursor-pointer"
                title="Brush Alpha Mask Stencil"
              >
                <option value="none">None</option>
                <option value="grunge">Grunge</option>
                <option value="splat">Splat</option>
                <option value="scratch">Scratch</option>
                <option value="dots">Dots</option>
                <option value="noise">Noise</option>
                <option value="cracks">Cracks</option>
              </select>
            </div>

            {/* 3. BRUSH PATTERN (Tileable Modulator) */}
            <div className="flex items-center gap-1 bg-[#303030] px-1.5 py-0.5 rounded border border-[#4a4a4a]">
              <span className="text-[10px] text-[#fab387] font-semibold uppercase">Pattern:</span>
              <select
                value={brush.patternType || 'none'}
                onChange={(e) => onUpdateBrush({ patternType: e.target.value as any })}
                className="bg-[#242424] border border-[#555] text-white rounded px-1 py-0.5 text-[10px] outline-none font-medium cursor-pointer"
                title="Tileable Brush Pattern"
              >
                <option value="none">None</option>
                <option value="checker">Checker</option>
                <option value="carbon">Carbon</option>
                <option value="halftone">Halftone</option>
                <option value="leather">Leather</option>
                <option value="wood">Wood</option>
              </select>
            </div>

            <div className="h-4 w-px bg-[#555]" />

            {/* 4. BRUSH SETTINGS */}
            {/* Size */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#aaa]">Size:</span>
              <input
                type="range"
                min="1"
                max="128"
                value={brush.size}
                onChange={(e) => onUpdateBrush({ size: Number(e.target.value) })}
                className="w-14 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#eee] w-7">{brush.size}px</span>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#aaa]">Opac:</span>
              <input
                type="range"
                min="1"
                max="100"
                value={brush.opacity}
                onChange={(e) => onUpdateBrush({ opacity: Number(e.target.value) })}
                className="w-12 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#eee] w-7">{brush.opacity}%</span>
            </div>

            {/* Spacing */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#aaa]">Spacing:</span>
              <input
                type="range"
                min="1"
                max="150"
                value={brush.spacing}
                onChange={(e) => onUpdateBrush({ spacing: Number(e.target.value) })}
                className="w-12 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#3d7fb8] w-6">{brush.spacing}%</span>
            </div>

            {/* Scatter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#aaa]">Scatter:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={brush.scatter}
                onChange={(e) => onUpdateBrush({ scatter: Number(e.target.value) })}
                className="w-12 accent-[#e5a038] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#e5a038] w-6">{brush.scatter}%</span>
            </div>

            {/* Stabilizer */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#aaa]">Stab:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={brush.stabilizer}
                onChange={(e) => onUpdateBrush({ stabilizer: Number(e.target.value) })}
                className="w-12 accent-[#a6e3a1] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#a6e3a1] w-6">{brush.stabilizer}%</span>
            </div>

            {/* Carousel launcher button */}
            <button
              onClick={onOpenCarousel}
              className="px-2 py-0.5 bg-[#484848] hover:bg-[#555] text-white rounded text-[10px] flex items-center gap-1 border border-[#606060] shrink-0"
              title="Open Brush Carousel Wheel (V)"
            >
              <Disc className="w-3 h-3 text-[#3d7fb8]" />
              Carousel (V)
            </button>
          </div>
        )}
      </div>

      {/* Global Viewport Controls & Shading */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Symmetry Toggle Button */}
        {onToggleSymmetryX && (
          <button
            onClick={onToggleSymmetryX}
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1.5 transition-colors border ${
              isSymmetryX
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
                : 'bg-[#2a2a2a] hover:bg-[#383838] text-[#aaa] border-[#555]'
            }`}
            title="Toggle Bilateral Symmetry Painting (X-Axis Mirror)"
          >
            <SplitSquareVertical className={`w-3.5 h-3.5 ${isSymmetryX ? 'text-white' : 'text-[#888]'}`} />
            <span>Symmetry [X]: {isSymmetryX ? 'ON' : 'OFF'}</span>
          </button>
        )}

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

        {/* Android / Tablet Touch Input Navigation Toggle */}
        <button
          onClick={onToggleTouchNav}
          className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1.5 transition-colors border ${
            touchNavEnabled
              ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
              : 'bg-[#2a2a2a] hover:bg-[#383838] text-[#aaa] border-[#555]'
          }`}
          title="Toggle Android / Tablet Touch Navigation. When ON: Finger navigates, Stylus draws."
        >
          <Smartphone className={`w-3 h-3 ${touchNavEnabled ? 'text-white' : 'text-[#888]'}`} />
          <span>Touch Nav: {touchNavEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Dropdown to choose between Perspective and Quad View */}
        {onSelectViewLayout && (
          <div className="flex items-center gap-1 bg-[#2a2a2a] px-1.5 py-0.5 rounded border border-[#555] cs5-inset">
            <LayoutGrid className="w-3.5 h-3.5 text-[#3d7fb8]" />
            <select
              value={viewLayout || 'perspective'}
              onChange={(e) => onSelectViewLayout(e.target.value as any)}
              className="bg-transparent text-[#eee] text-[11px] outline-none font-medium cursor-pointer"
              title="Camera Viewport Layout: Perspective View vs Quad View (Blender 4-way)"
            >
              <option value="perspective" className="bg-[#2a2a2a] text-[#eee]">Perspective View</option>
              <option value="quad" className="bg-[#2a2a2a] text-[#eee]">Quad View (4-Way)</option>
            </select>
          </div>
        )}

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
