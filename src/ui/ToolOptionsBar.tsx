/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Tool Options Sub-Toolbar
 * Created by Victory Ukpong
 */

import React, { useState, useRef } from 'react';
import { ToolType, BrushPreset, ViewportShadingMode, SurfaceShadingMode } from '../core/types';
import { DEFAULT_BRUSH_PRESETS } from '../tools/brushPresets';
import { 
  Sliders, Box, Layers, SplitSquareVertical, Eye, Camera, 
  Disc, Smartphone, LayoutGrid, Plus, Image as ImageIcon, ChevronDown, Stamp, Activity 
} from 'lucide-react';

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
  onOpenSymmetryPanel?: () => void;
  onOpenPatternStampDialog?: () => void;
  optionsBarLayout?: 'clusters' | 'compact' | 'minimal';
  surfaceMode?: SurfaceShadingMode;
  onSelectSurfaceMode?: (mode: SurfaceShadingMode) => void;
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
  onOpenSymmetryPanel,
  onOpenPatternStampDialog,
  optionsBarLayout = 'clusters',
  surfaceMode = 'default',
  onSelectSurfaceMode,
}) => {
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showMaskMenu, setShowMaskMenu] = useState(false);
  const [showPatternMenu, setShowPatternMenu] = useState(false);
  const [showCompactMore, setShowCompactMore] = useState(false);
  const [showStrokeMenu, setShowStrokeMenu] = useState(false);

  const [customMasks, setCustomMasks] = useState<{ id: string; name: string; url?: string }[]>([]);
  const [customPatterns, setCustomPatterns] = useState<{ id: string; name: string; url?: string }[]>([]);

  const maskFileRef = useRef<HTMLInputElement>(null);
  const patternFileRef = useRef<HTMLInputElement>(null);

  const maskPresets = [
    { id: 'none', label: 'None', preview: '○' },
    { id: 'grunge', label: 'Grunge', preview: '░▒' },
    { id: 'splat', label: 'Splat', preview: '✦' },
    { id: 'scratch', label: 'Scratch', preview: '///' },
    { id: 'dots', label: 'Dots', preview: ':::' },
    { id: 'noise', label: 'Noise', preview: '≋' },
    { id: 'cracks', label: 'Cracks', preview: '⚡' },
  ];

  const patternPresets = [
    { id: 'none', label: 'None', preview: '—' },
    { id: 'checker', label: 'Checker', preview: '▦' },
    { id: 'carbon', label: 'Carbon', preview: '▩' },
    { id: 'halftone', label: 'Halftone', preview: '⁖' },
    { id: 'leather', label: 'Leather', preview: '≈' },
    { id: 'wood', label: 'Wood', preview: '◎' },
    { id: 'weave', label: 'Weave', preview: '▥' },
  ];

  const handleUploadMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const id = 'mask_' + Date.now();
      setCustomMasks(prev => [...prev, { id, name: file.name.slice(0, 10), url }]);
      onUpdateBrush({ maskType: id as any, stencilUrl: url });
      setShowMaskMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPattern = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const id = 'pat_' + Date.now();
      setCustomPatterns(prev => [...prev, { id, name: file.name.slice(0, 10), url }]);
      onUpdateBrush({ patternType: id as any, patternScale: 1.0 });
      setShowPatternMenu(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`min-h-8 ${optionsBarLayout === 'clusters' ? 'h-auto py-1 flex-wrap' : 'h-8 overflow-x-auto'} bg-[#3c3c3c] border-b border-[#242424] px-2 flex items-center justify-between text-xs text-[#c8c8c8] select-none z-40 gap-y-1.5 gap-x-2 relative`}>
      <input ref={maskFileRef} type="file" accept="image/*" onChange={handleUploadMask} className="hidden" />
      <input ref={patternFileRef} type="file" accept="image/*" onChange={handleUploadPattern} className="hidden" />

      {/* Tool-specific Parameters Cluster */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Active Tool Label */}
        <div className="flex items-center gap-1.5 font-bold text-[#eee] uppercase tracking-wider text-[11px] bg-[#303030] px-2 py-0.5 rounded border border-[#484848] cs5-inset">
          <span>{activeTool.replace('_', ' ')}</span>
        </div>

        {/* Universal Brush Presets Dropdown */}
        {['brush', 'eraser', 'blur', 'clone', 'smudge', 'mask_brush'].includes(activeTool) && (
          <div className="relative">
            <button
              onClick={() => { setShowPresetMenu(!showPresetMenu); setShowMaskMenu(false); setShowPatternMenu(false); }}
              className="flex items-center gap-1.5 bg-[#2a2a2a] hover:bg-[#343434] px-2 py-0.5 rounded border border-[#505050] text-[#eee] transition-colors cursor-pointer"
              title="Universal Brush Presets"
            >
              <span className="w-4 h-4 rounded-full bg-[#181818] border border-[#666] flex items-center justify-center text-[10px] text-[#a6e3a1] font-bold overflow-hidden shadow-inner">
                {brush.name ? brush.name.slice(0, 1) : 'B'}
              </span>
              <span className="text-[11px] font-semibold truncate max-w-[85px]">
                {brush.name || 'Custom'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#888]" />
            </button>

            {/* Presets Popover with Visual Thumbnails */}
            {showPresetMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-[#252525] border border-[#555] rounded shadow-2xl p-2 w-64 cs5-outset max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#3c3c3c]">
                  <span className="text-[10px] font-mono text-[#a6e3a1] font-bold uppercase tracking-wider">
                    Universal Presets ({DEFAULT_BRUSH_PRESETS.length})
                  </span>
                  <span className="text-[9px] text-[#888]">All Tools</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEFAULT_BRUSH_PRESETS.map((p) => {
                    const isSelected = brush.name === p.name || brush.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onUpdateBrush({
                            name: p.name,
                            size: p.size,
                            opacity: p.opacity,
                            flow: p.flow,
                            hardness: p.hardness,
                            spacing: p.spacing,
                            scatter: p.scatter,
                            stabilizer: p.stabilizer,
                            tipShape: p.tipShape,
                            strokeType: p.strokeType,
                            maskType: p.maskType,
                            patternType: p.patternType,
                          });
                          setShowPresetMenu(false);
                        }}
                        className={`flex items-center gap-1.5 p-1 rounded border text-left transition-all ${
                          isSelected
                            ? 'bg-[#3d7fb8]/35 border-[#3d7fb8] text-white'
                            : 'bg-[#1e1e1e] border-[#383838] text-[#ccc] hover:bg-[#2c2c2c] hover:border-[#666]'
                        }`}
                        title={`${p.name} - ${p.category} (Size ${p.size}px)`}
                      >
                        <div className="w-5 h-5 rounded bg-[#111] border border-[#444] flex items-center justify-center shrink-0 overflow-hidden">
                          <div 
                            className="rounded-full bg-white"
                            style={{
                              width: `${Math.max(3, Math.min(14, p.size * 0.35))}px`,
                              height: `${Math.max(3, Math.min(14, p.size * 0.35))}px`,
                              opacity: p.opacity / 100,
                              filter: p.hardness < 50 ? `blur(${Math.max(1, (100 - p.hardness) * 0.03)}px)` : 'none'
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-medium truncate text-white leading-tight">{p.name}</div>
                          <div className="text-[8px] text-[#888]">{p.size}px</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Brush Parameters if paint tool */}
        {['brush', 'eraser', 'blur', 'clone', 'smudge', 'mask_brush'].includes(activeTool) && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Core Sliders: Size & Opacity */}
            <div className="flex items-center gap-1 bg-[#303030] px-1.5 py-0.5 rounded border border-[#484848]">
              <span className="text-[10px] text-[#aaa]">Size:</span>
              <input
                type="range"
                min="1"
                max="128"
                value={brush.size}
                onChange={(e) => onUpdateBrush({ size: Number(e.target.value) })}
                className="w-12 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#eee] w-6">{brush.size}</span>
            </div>

            <div className="flex items-center gap-1 bg-[#303030] px-1.5 py-0.5 rounded border border-[#484848]">
              <span className="text-[10px] text-[#aaa]">Opac:</span>
              <input
                type="range"
                min="1"
                max="100"
                value={brush.opacity}
                onChange={(e) => onUpdateBrush({ opacity: Number(e.target.value) })}
                className="w-12 accent-[#3d7fb8] h-1.5"
              />
              <span className="text-[10px] font-mono text-[#eee] w-6">{brush.opacity}%</span>
            </div>

            {/* Dedicated Stroke & Dynamics Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStrokeMenu(!showStrokeMenu)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
                  showStrokeMenu || brush.strokeType !== 'space'
                    ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                    : 'bg-[#2b2b2b] hover:bg-[#343434] text-[#fab387] border-[#555]'
                }`}
                title="Brush Stroke Mode & Dynamics: Space, Airbrush, Dot, Dragged-Dot, Curve"
              >
                <Sliders className="w-2.5 h-2.5" />
                <span className="capitalize">{brush.strokeType || 'space'}</span>
                <span className="font-mono text-[9px] text-[#eee] border-l border-white/20 pl-1">{brush.spacing}%</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-70" />
              </button>

              {showStrokeMenu && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-[#252525] border border-[#555] rounded shadow-2xl p-2.5 w-68 cs5-outset space-y-2 text-[#ccc]">
                  <div className="flex items-center justify-between pb-1 border-b border-[#3c3c3c]">
                    <span className="text-[10px] font-mono text-[#89b4fa] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-[#3d7fb8]" />
                      Stroke &amp; Dynamics Control
                    </span>
                    <button 
                      onClick={() => setShowStrokeMenu(false)}
                      className="text-[#888] hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Stroke Application Mode Selector */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-[#888] uppercase">Application Mode:</span>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { id: 'space', label: 'Space' },
                        { id: 'airbrush', label: 'Airbrush' },
                        { id: 'dot', label: 'Dot' },
                        { id: 'dragged-dot', label: 'Drag' },
                        { id: 'curve', label: 'Curve' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => onUpdateBrush({ strokeType: st.id as any })}
                          className={`px-1 py-1 rounded text-[9.5px] font-medium border text-center transition-colors cursor-pointer ${
                            (brush.strokeType || 'space') === st.id
                              ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
                              : 'bg-[#1e1e1e] border-[#383838] text-[#aaa] hover:bg-[#2e2e2e] hover:text-white'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spacing Slider */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Spacing:</span>
                    <input
                      type="range"
                      min="1"
                      max="150"
                      value={brush.spacing}
                      onChange={(e) => onUpdateBrush({ spacing: Number(e.target.value) })}
                      className="w-28 accent-[#3d7fb8] h-1.5"
                    />
                    <span className="font-mono text-[#3d7fb8] w-8 text-right">{brush.spacing}%</span>
                  </div>

                  {/* Flow Slider */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Flow:</span>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={brush.flow ?? 100}
                      onChange={(e) => onUpdateBrush({ flow: Number(e.target.value) })}
                      className="w-28 accent-[#38bdf8] h-1.5"
                    />
                    <span className="font-mono text-[#38bdf8] w-8 text-right">{brush.flow ?? 100}%</span>
                  </div>

                  {/* Scatter Slider */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Scatter:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={brush.scatter}
                      onChange={(e) => onUpdateBrush({ scatter: Number(e.target.value) })}
                      className="w-28 accent-[#e5a038] h-1.5"
                    />
                    <span className="font-mono text-[#e5a038] w-8 text-right">{brush.scatter}%</span>
                  </div>

                  {/* Stabilizer (Lazy Mouse) */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Lazy Mouse:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={brush.stabilizer}
                      onChange={(e) => onUpdateBrush({ stabilizer: Number(e.target.value) })}
                      className="w-28 accent-[#a6e3a1] h-1.5"
                    />
                    <span className="font-mono text-[#a6e3a1] w-8 text-right">{brush.stabilizer}%</span>
                  </div>

                  {/* Hardness */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Hardness:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={brush.hardness}
                      onChange={(e) => onUpdateBrush({ hardness: Number(e.target.value) })}
                      className="w-28 accent-[#cba6f7] h-1.5"
                    />
                    <span className="font-mono text-[#cba6f7] w-8 text-right">{brush.hardness}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* In clusters mode, render Tip Mask and Pattern selectors */}
            {optionsBarLayout === 'clusters' && (
              <>
                {/* 2. BRUSH MASK (Tip Shape Texture) */}
                <div className="relative">
                  <div 
                    onClick={() => { setShowMaskMenu(!showMaskMenu); setShowPatternMenu(false); }}
                    className="flex items-center gap-1 bg-[#303030] hover:bg-[#383838] px-1.5 py-0.5 rounded border border-[#4a4a4a] cursor-pointer transition-colors"
                    title="Brush Tip Mask Texture"
                  >
                    <span className="text-[10px] text-[#89b4fa] font-semibold uppercase">Mask:</span>
                    <span className="text-[10px] text-white font-medium capitalize max-w-[45px] truncate">
                      {brush.maskType || 'none'}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#888]" />
                  </div>

                  {showMaskMenu && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-[#2b2b2b] border border-[#555] rounded shadow-2xl p-2 w-56 cs5-outset">
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#404040]">
                        <span className="text-[10px] font-mono text-[#89b4fa] font-bold uppercase">Brush Tip Mask</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); maskFileRef.current?.click(); }}
                          className="px-1.5 py-0.5 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white rounded text-[9px] font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[...maskPresets, ...customMasks.map(c => ({ id: c.id, label: c.name, preview: '★' }))].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { onUpdateBrush({ maskType: m.id as any }); setShowMaskMenu(false); }}
                            className={`p-1 rounded border flex flex-col items-center justify-center transition-all ${
                              brush.maskType === m.id
                                ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white'
                                : 'bg-[#202020] border-[#383838] text-[#aaa] hover:border-[#666]'
                            }`}
                            title={m.label}
                          >
                            <span className="text-xs font-mono">{m.preview}</span>
                            <span className="text-[8px] truncate max-w-full">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. BRUSH PATTERN */}
                <div className="relative">
                  <div 
                    onClick={() => { setShowPatternMenu(!showPatternMenu); setShowMaskMenu(false); }}
                    className="flex items-center gap-1 bg-[#303030] hover:bg-[#383838] px-1.5 py-0.5 rounded border border-[#4a4a4a] cursor-pointer transition-colors"
                    title="Brush Texture Pattern"
                  >
                    <span className="text-[10px] text-[#fab387] font-semibold uppercase">Pat:</span>
                    <span className="text-[10px] text-white font-medium capitalize max-w-[45px] truncate">
                      {brush.patternType || 'none'}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#888]" />
                  </div>

                  {showPatternMenu && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-[#2b2b2b] border border-[#555] rounded shadow-2xl p-2 w-56 cs5-outset">
                      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#404040]">
                        <span className="text-[10px] font-mono text-[#fab387] font-bold uppercase">Texture Pattern</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); patternFileRef.current?.click(); }}
                          className="px-1.5 py-0.5 bg-[#e5a038] hover:bg-[#f0b555] text-black rounded text-[9px] font-bold flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[...patternPresets, ...customPatterns.map(c => ({ id: c.id, label: c.name, preview: '★' }))].map(p => (
                          <button
                            key={p.id}
                            onClick={() => { onUpdateBrush({ patternType: p.id as any }); setShowPatternMenu(false); }}
                            className={`p-1 rounded border flex flex-col items-center justify-center transition-all ${
                              brush.patternType === p.id
                                ? 'bg-[#fab387]/30 border-[#fab387] text-white'
                                : 'bg-[#202020] border-[#383838] text-[#aaa] hover:border-[#666]'
                            }`}
                            title={p.label}
                          >
                            <span className="text-xs font-mono">{p.preview}</span>
                            <span className="text-[8px] truncate max-w-full">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Carousel launcher button */}
            <button
              onClick={onOpenCarousel}
              className="px-2 py-0.5 bg-[#484848] hover:bg-[#555] text-white rounded text-[10px] flex items-center gap-1 border border-[#606060] shrink-0"
              title="Open Brush Carousel Wheel (V)"
            >
              <Disc className="w-3 h-3 text-[#3d7fb8]" />
              <span>(V)</span>
            </button>
          </div>
        )}
      </div>

      {/* When in minimal mode, secondary clusters are accessible from Menu Bar dropdowns */}
      {optionsBarLayout !== 'minimal' && (
        <>
          {/* Center Empty Space Quick Launcher: Decal & Pattern Stamp Filter */}
          {onOpenPatternStampDialog && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenPatternStampDialog}
                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold flex items-center gap-1.5 transition-all border ${
                  activeTool === 'clone' || activeTool === 'pattern_stamp'
                    ? 'bg-[#e5a038] hover:bg-[#f0b555] text-black border-[#d18e2c] shadow-xs'
                    : 'bg-[#2a2a2a] hover:bg-[#383838] text-[#fab387] border-[#555]'
                }`}
                title="Open Pattern Stamp / Surface Decal Configuration Dialog"
              >
                <Stamp className="w-3 h-3" />
                <span>Decal / Stamp Filter...</span>
              </button>
            </div>
          )}

          {/* Global Viewport Controls & Shading */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Symmetry Toggle Button */}
            {onToggleSymmetryX && (
              <button
                onClick={onToggleSymmetryX}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (onOpenSymmetryPanel) onOpenSymmetryPanel();
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1.5 transition-colors border ${
                  isSymmetryX
                    ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
                    : 'bg-[#2a2a2a] hover:bg-[#383838] text-[#aaa] border-[#555]'
                }`}
                title="Symmetry Mirroring: Left-click toggles real-time painting (ON/OFF). Right-click opens Symmetrize & Axis Locator panel."
              >
                <SplitSquareVertical className={`w-3.5 h-3.5 ${isSymmetryX ? 'text-white' : 'text-[#888]'}`} />
                <span>Symmetry: {isSymmetryX ? 'ON' : 'OFF'}</span>
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

            {/* Surface Normal Triggers: Def, Smooth, Flat */}
            {onSelectSurfaceMode && (
              <div className="flex items-center bg-[#282828] p-0.5 rounded border border-[#4a4a4a]" title="Surface Normals: Default (Original file normals), Smooth (Angle-interpolated), Flat (Hard faceted surface)">
                <button
                  type="button"
                  onClick={() => onSelectSurfaceMode('default')}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-colors ${
                    surfaceMode === 'default'
                      ? 'bg-[#3d7fb8] text-white font-bold'
                      : 'text-[#888] hover:text-[#eee]'
                  }`}
                >
                  Def
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSurfaceMode('smooth')}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-colors ${
                    surfaceMode === 'smooth'
                      ? 'bg-[#3d7fb8] text-white font-bold'
                      : 'text-[#888] hover:text-[#eee]'
                  }`}
                >
                  Smooth
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSurfaceMode('flat')}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-colors ${
                    surfaceMode === 'flat'
                      ? 'bg-[#3d7fb8] text-white font-bold'
                      : 'text-[#888] hover:text-[#eee]'
                  }`}
                >
                  Flat
                </button>
              </div>
            )}

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
        </>
      )}
    </div>
  );
};
