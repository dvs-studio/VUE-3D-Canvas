/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Brushes, Stencils, Patterns & Stylus Wintab Dynamics Panel
 * Created by Victory Ukpong
 */

import React, { useState, useRef } from 'react';
import { 
  BrushPreset, 
  BrushStrokeType, 
  BrushMaskType, 
  BrushPatternType, 
  StencilApplicationMode 
} from '../../core/types';
import { 
  Sliders, 
  Disc, 
  Sparkles, 
  Feather, 
  CircleDot, 
  Layers, 
  Grid, 
  Flame, 
  Wand2, 
  Droplet, 
  Compass,
  Check,
  Search,
  Plus,
  Image,
  RotateCw,
  Shuffle,
  Tablet,
  SlidersHorizontal
} from 'lucide-react';

interface BrushLibraryPanelProps {
  brushes: BrushPreset[];
  activeBrush: BrushPreset;
  onSelectBrush: (brush: BrushPreset) => void;
  onUpdateBrush: (patch: Partial<BrushPreset>) => void;
  onOpenCarousel: () => void;
}

export const BrushLibraryPanel: React.FC<BrushLibraryPanelProps> = ({
  brushes,
  activeBrush,
  onSelectBrush,
  onUpdateBrush,
  onOpenCarousel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'brushes' | 'stencils' | 'settings'>('brushes');
  const [searchQuery, setSearchQuery] = useState('');

  const [customStencils, setCustomStencils] = useState<{ id: string; name: string; url?: string }[]>([]);
  const [customPatterns, setCustomPatterns] = useState<{ id: string; name: string; url?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('vue3d_custom_textures');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const stencilFileInputRef = useRef<HTMLInputElement | null>(null);
  const patternFileInputRef = useRef<HTMLInputElement | null>(null);

  const categories = ['All', 'Standard', 'Inking', 'Textures', 'Organic', 'Hard Surface', 'VFX'];

  const filteredBrushes = brushes.filter(b => {
    const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesQuery = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Stencil items with thumbnail descriptions
  const builtinStencils: { id: BrushMaskType; label: string; desc: string; preview: string }[] = [
    { id: 'none', label: 'None', desc: 'Solid Tip', preview: '○' },
    { id: 'grunge', label: 'Grunge', desc: 'Weathered Stain', preview: '░▒▓' },
    { id: 'splat', label: 'Splat', desc: 'Ink Drops', preview: '✦' },
    { id: 'scratch', label: 'Scratch', desc: 'Scraped Metal', preview: '///' },
    { id: 'dots', label: 'Dots', desc: 'Halftone Matrix', preview: ':::' },
    { id: 'noise', label: 'Noise', desc: 'Perlin Grain', preview: '≋' },
    { id: 'canvas', label: 'Canvas', desc: 'Woven Texture', preview: '▤' },
    { id: 'cracks', label: 'Cracks', desc: 'Dry Earth / Glass', preview: '⚡' },
    { id: 'hex_grid', label: 'Hex Grid', desc: 'Sci-Fi Hive', preview: '⬡' },
    { id: 'camo', label: 'Camo', desc: 'Organic Blots', preview: '☁' },
    { id: 'veins', label: 'Veins', desc: 'Marble Tendrils', preview: '〰' },
  ];

  // Pattern items with thumbnail descriptions
  const builtinPatterns: { id: BrushPatternType; label: string; desc: string; preview: string }[] = [
    { id: 'none', label: 'None', desc: 'Flat Pigment', preview: '—' },
    { id: 'checker', label: 'Checker', desc: 'Chess Tiles', preview: '⚀⚁' },
    { id: 'carbon', label: 'Carbon', desc: 'Composite Weave', preview: '▦' },
    { id: 'halftone', label: 'Halftone', desc: 'Print Dots', preview: '⁖' },
    { id: 'diagonal', label: 'Diagonal', desc: 'Hatched Stripes', preview: '///' },
    { id: 'leather', label: 'Leather', desc: 'Skin Creases', preview: '≈' },
    { id: 'wood', label: 'Wood', desc: 'Annual Rings', preview: '◎' },
    { id: 'weave', label: 'Weave', desc: 'Fabric Basket', preview: '▥' },
    { id: 'hex_mesh', label: 'Hex Mesh', desc: 'Honeycomb Metal', preview: '⬢' },
    { id: 'marble', label: 'Marble', desc: 'Swirling Stone', preview: '☯' },
  ];

  const handleUploadStencil = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      const newId = `custom_stencil_${Date.now()}`;
      setCustomStencils(prev => [...prev, { id: newId, name: file.name.slice(0, 10), url }]);
      onUpdateBrush({ maskType: newId, maskScale: 1.0 });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPattern = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target?.result as string;
      const newId = `custom_texture_${Date.now()}`;
      const newItem = { id: newId, name: file.name.slice(0, 10), url };
      setCustomPatterns(prev => {
        const next = [...prev, newItem];
        try {
          localStorage.setItem('vue3d_custom_textures', JSON.stringify(next));
        } catch {}
        return next;
      });
      onUpdateBrush({ patternType: newId, patternScale: 1.0 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838]">
      {/* Top Mode Navigation Tabs: Renamed "Gallery examples" to "Brushes" */}
      <div className="flex items-center bg-[#282828] border-b border-[#444] px-1 pt-1 gap-1">
        <button
          onClick={() => setActiveTab('brushes')}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-t border-t border-x transition-colors ${
            activeTab === 'brushes'
              ? 'bg-[#383838] border-[#555] text-white shadow-xs'
              : 'bg-[#282828] border-transparent text-[#999] hover:text-[#ccc]'
          }`}
        >
          Brushes
        </button>
        <button
          onClick={() => setActiveTab('stencils')}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-t border-t border-x transition-colors ${
            activeTab === 'stencils'
              ? 'bg-[#383838] border-[#555] text-white shadow-xs'
              : 'bg-[#282828] border-transparent text-[#999] hover:text-[#ccc]'
          }`}
        >
          Stencils &amp; Patterns
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-t border-t border-x transition-colors ${
            activeTab === 'settings'
              ? 'bg-[#383838] border-[#555] text-white shadow-xs'
              : 'bg-[#282828] border-transparent text-[#999] hover:text-[#ccc]'
          }`}
        >
          Brush Settings
        </button>

        <button
          onClick={onOpenCarousel}
          className="ml-auto p-1 text-[#aaa] hover:text-white rounded"
          title="Open Radial Carousel (V)"
        >
          <Disc className="w-3.5 h-3.5 text-[#3d7fb8]" />
        </button>
      </div>

      {/* 1. BRUSHES GALLERY TAB (formerly Gallery Examples) */}
      {activeTab === 'brushes' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Category Filter Pills & Search */}
          <div className="p-2 border-b border-[#444] bg-[#333] space-y-1.5 shrink-0">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-[#777]" />
              <input
                type="text"
                placeholder="Search brushes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#242424] border border-[#555] rounded pl-7 pr-2 py-0.5 text-[11px] text-[#eee] outline-none cs5-inset"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#3d7fb8] text-white font-medium'
                      : 'bg-[#292929] hover:bg-[#383838] text-[#aaa]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Gallery Grid */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredBrushes.map((b) => {
              const isSelected = activeBrush.id === b.id;

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBrush(b)}
                  className={`p-2 rounded border cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#2b3d4f] border-[#4ea8de] text-white shadow-xs'
                      : 'bg-[#2c2c2c] hover:bg-[#353535] border-[#444] text-[#ccc]'
                  }`}
                >
                  {/* Visual Swatch Preview */}
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-9 h-9 rounded bg-[#1e1e1e] border border-[#555] flex items-center justify-center shrink-0 relative overflow-hidden"
                      style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}
                    >
                      <div
                        className="rounded-full transition-transform"
                        style={{
                          width: `${Math.min(26, Math.max(6, b.size * 0.45))}px`,
                          height: `${Math.min(26, Math.max(6, b.size * 0.45))}px`,
                          backgroundColor: b.color || '#fff',
                          opacity: b.opacity / 100,
                          filter: b.hardness < 50 ? 'blur(2px)' : 'none',
                        }}
                      />
                      {b.maskType && b.maskType !== 'none' && (
                        <span className="absolute bottom-0 right-0 text-[8px] bg-[#89b4fa] text-black px-0.5 font-mono font-bold leading-none">
                          M
                        </span>
                      )}
                      {b.patternType && b.patternType !== 'none' && (
                        <span className="absolute top-0 right-0 text-[8px] bg-[#fab387] text-black px-0.5 font-mono font-bold leading-none">
                          P
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-medium text-[11px] truncate max-w-[130px]">{b.name}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-[#999] font-mono">
                        <span className="text-[#3d7fb8]">{b.category}</span>
                        <span>·</span>
                        <span className="capitalize">{b.strokeType || 'space'}</span>
                        <span>·</span>
                        <span>{b.size}px</span>
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="px-1.5 py-0.5 rounded bg-[#3d7fb8] text-white text-[9px] font-mono">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#666] font-mono">
                      {b.spacing}% sp
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. STENCILS & PATTERNS GALLERY TAB */}
      {activeTab === 'stencils' && (
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {/* A. STENCIL MASK GALLERY SECTION */}
          <div className="bg-[#303030] p-2.5 rounded border border-[#484848] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#89b4fa] font-bold uppercase tracking-wider flex items-center gap-1">
                <Feather className="w-3 h-3 text-[#89b4fa]" />
                BRUSH MASK STENCILS (GALLERY)
              </span>
              <button
                onClick={() => stencilFileInputRef.current?.click()}
                className="px-2 py-0.5 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded text-[10px] font-medium flex items-center gap-1 shadow-xs transition-colors"
                title="Add custom stencil image (PNG/JPG/SVG)"
              >
                <Plus className="w-3 h-3" />
                Add Stencil
              </button>
              <input
                ref={stencilFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadStencil}
                className="hidden"
              />
            </div>

            {/* Visual Stencil Cards Gallery Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {[...builtinStencils, ...customStencils.map(c => ({ id: c.id, label: c.name, desc: 'Custom', preview: '★' }))].map((st) => {
                const isSelected = (activeBrush.maskType || 'none') === st.id;

                return (
                  <div
                    key={st.id}
                    onClick={() => onUpdateBrush({ maskType: st.id })}
                    className={`p-1.5 rounded border cursor-pointer flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#2e4057] border-[#89b4fa] text-white shadow-xs'
                        : 'bg-[#262626] hover:bg-[#333] border-[#404040] text-[#aaa]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-[#1c1c1c] border border-[#555] flex items-center justify-center text-sm font-mono text-[#89b4fa] mb-1">
                      {st.preview}
                    </div>
                    <span className="font-medium text-[10px] truncate max-w-full">{st.label}</span>
                    <span className="text-[8px] text-[#777] font-mono">{st.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* SUB-SETTINGS PANEL FOR STENCIL (Spacing, Grid/Seamless, Random, Triplanar) */}
            {activeBrush.maskType && activeBrush.maskType !== 'none' && (
              <div className="mt-2.5 p-2 bg-[#262626] rounded border border-[#555] space-y-2 animate-fadeIn">
                <div className="text-[9px] font-mono text-[#89b4fa] font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#3e3e3e] pb-1">
                  <span>STENCIL SUB-SETTINGS</span>
                  <span className="text-[#a6e3a1]">ACTIVE</span>
                </div>

                {/* Stencil Application Mode Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] text-[#aaa]">Application Mode:</span>
                  <div className="grid grid-cols-2 gap-1">
                    {(['spacing', 'grid', 'random', 'triplanar'] as StencilApplicationMode[]).map((mode) => {
                      const isModeActive = (activeBrush.stencilMode || 'spacing') === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => onUpdateBrush({ stencilMode: mode })}
                          className={`px-1.5 py-1 rounded text-[10px] font-medium border capitalize flex items-center justify-between ${
                            isModeActive
                              ? 'bg-[#3d7fb8] border-[#5ca2db] text-white font-bold'
                              : 'bg-[#303030] border-[#444] text-[#aaa] hover:bg-[#3a3a3a]'
                          }`}
                        >
                          <span>{mode === 'grid' ? 'Grid (Seamless)' : mode}</span>
                          {isModeActive && <Check className="w-2.5 h-2.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scale Slider */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Scale &amp; Frequency</span>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={activeBrush.maskScale || 1.0}
                    onChange={(e) => onUpdateBrush({ maskScale: Number(e.target.value) })}
                    className="w-24 accent-[#89b4fa] h-1.5"
                  />
                  <span className="font-mono text-[#89b4fa]">{(activeBrush.maskScale || 1.0).toFixed(1)}x</span>
                </div>

                {/* Angle & Angle Jitter */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Angle Rotation</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={activeBrush.stencilAngle || 0}
                    onChange={(e) => onUpdateBrush({ stencilAngle: Number(e.target.value) })}
                    className="w-24 accent-[#89b4fa] h-1.5"
                  />
                  <span className="font-mono text-[#89b4fa]">{activeBrush.stencilAngle || 0}°</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Angle Jitter</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeBrush.stencilAngleJitter || 0}
                    onChange={(e) => onUpdateBrush({ stencilAngleJitter: Number(e.target.value) })}
                    className="w-24 accent-[#89b4fa] h-1.5"
                  />
                  <span className="font-mono text-[#89b4fa]">{activeBrush.stencilAngleJitter || 0}%</span>
                </div>

                {/* Contrast Threshold & Invert Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-[#3e3e3e]">
                  <label className="flex items-center gap-1.5 text-[10px] text-[#ccc] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeBrush.stencilInvert || false}
                      onChange={(e) => onUpdateBrush({ stencilInvert: e.target.checked })}
                      className="accent-[#89b4fa] rounded-xs"
                    />
                    <span>Invert Stencil</span>
                  </label>
                  <span className="text-[9px] text-[#777] font-mono">D3D11 EVAL</span>
                </div>
              </div>
            )}
          </div>

          {/* B. BRUSH TEXTURE GALLERY SECTION */}
          <div className="bg-[#303030] p-2.5 rounded border border-[#484848] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#fab387] font-bold uppercase tracking-wider flex items-center gap-1">
                <Grid className="w-3 h-3 text-[#fab387]" />
                BRUSH TEXTURES (SURFACE PATTERN TILING)
              </span>
              <button
                onClick={() => patternFileInputRef.current?.click()}
                className="px-2 py-0.5 bg-[#e5a038] hover:bg-[#f0b555] text-black rounded text-[10px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
                title="Add custom texture image (PNG/JPG)"
              >
                <Plus className="w-3 h-3" />
                Add Texture
              </button>
              <input
                ref={patternFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadPattern}
                className="hidden"
              />
            </div>
            <p className="text-[9px] text-[#888]">
              The Texture setting acts as the continuous surface pattern painted inside brush strokes.
            </p>

            {/* Visual Pattern Cards Gallery Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {[...builtinPatterns, ...customPatterns.map(c => ({ id: c.id, label: c.name, desc: 'Custom', preview: '★' }))].map((pat) => {
                const isSelected = (activeBrush.patternType || 'none') === pat.id;

                return (
                  <div
                    key={pat.id}
                    onClick={() => onUpdateBrush({ patternType: pat.id })}
                    className={`p-1.5 rounded border cursor-pointer flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#403328] border-[#fab387] text-white shadow-xs'
                        : 'bg-[#262626] hover:bg-[#333] border-[#404040] text-[#aaa]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-[#1c1c1c] border border-[#555] flex items-center justify-center text-sm font-mono text-[#fab387] mb-1">
                      {pat.preview}
                    </div>
                    <span className="font-medium text-[10px] truncate max-w-full">{pat.label}</span>
                    <span className="text-[8px] text-[#777] font-mono">{pat.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* SUB-SETTINGS PANEL FOR TEXTURE (Scale, Blend, Rotation, Offset Jitter, Bump Depth) */}
            {activeBrush.patternType && activeBrush.patternType !== 'none' && (
              <div className="mt-2.5 p-2 bg-[#262626] rounded border border-[#555] space-y-2 animate-fadeIn">
                <div className="text-[9px] font-mono text-[#fab387] font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#3e3e3e] pb-1">
                  <span>TEXTURE SUB-SETTINGS</span>
                  <span className="text-[#a6e3a1]">MODULATOR ACTIVE</span>
                </div>

                {/* Blend Mode Selector */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Blend Modulation:</span>
                  <select
                    value={activeBrush.patternBlend || 'multiply'}
                    onChange={(e) => onUpdateBrush({ patternBlend: e.target.value as any })}
                    className="bg-[#303030] text-[#eee] border border-[#555] rounded px-1.5 py-0.5 text-[10px] outline-none"
                  >
                    <option value="multiply">Multiply</option>
                    <option value="overlay">Overlay</option>
                    <option value="hard_light">Hard Light</option>
                    <option value="screen">Screen</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>

                {/* Scale Slider */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Tiling Scale</span>
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.1"
                    value={activeBrush.patternScale || 1.0}
                    onChange={(e) => onUpdateBrush({ patternScale: Number(e.target.value) })}
                    className="w-24 accent-[#fab387] h-1.5"
                  />
                  <span className="font-mono text-[#fab387]">{(activeBrush.patternScale || 1.0).toFixed(1)}x</span>
                </div>

                {/* Tile Rotation Angle */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Tile Rotation</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={activeBrush.patternAngle || 0}
                    onChange={(e) => onUpdateBrush({ patternAngle: Number(e.target.value) })}
                    className="w-24 accent-[#fab387] h-1.5"
                  />
                  <span className="font-mono text-[#fab387]">{activeBrush.patternAngle || 0}°</span>
                </div>

                {/* Offset Jitter */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Offset Jitter</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeBrush.patternOffsetJitter || 0}
                    onChange={(e) => onUpdateBrush({ patternOffsetJitter: Number(e.target.value) })}
                    className="w-24 accent-[#fab387] h-1.5"
                  />
                  <span className="font-mono text-[#fab387]">{activeBrush.patternOffsetJitter || 0}%</span>
                </div>

                {/* Depth / Bump Influence */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#aaa]">Depth / Bump Influence</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeBrush.patternDepth || 50}
                    onChange={(e) => onUpdateBrush({ patternDepth: Number(e.target.value) })}
                    className="w-24 accent-[#fab387] h-1.5"
                  />
                  <span className="font-mono text-[#fab387]">{activeBrush.patternDepth || 50}%</span>
                </div>

                {/* Pattern Invert */}
                <div className="flex items-center justify-between pt-1 border-t border-[#3e3e3e]">
                  <label className="flex items-center gap-1.5 text-[10px] text-[#ccc] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeBrush.patternInvert || false}
                      onChange={(e) => onUpdateBrush({ patternInvert: e.target.checked })}
                      className="accent-[#fab387] rounded-xs"
                    />
                    <span>Invert Pattern</span>
                  </label>
                  <span className="text-[9px] text-[#777] font-mono">SEAMLESS GL</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. BRUSH & STYLUS SETTINGS TAB (Wintab / Windows Ink Tablet Dynamics) */}
      {activeTab === 'settings' && (
        <div className="p-3 space-y-3.5 overflow-y-auto flex-1">
          {/* Section: Standard Dynamics */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-[#aaa] uppercase tracking-wider border-b border-[#444] pb-1 flex items-center justify-between">
              <span>CORE BRUSH PARAMETERS</span>
              <span className="text-[#3d7fb8]">STANDARD</span>
            </div>

            {/* Size */}
            <div className="space-y-1 bg-[#303030] p-2 rounded border border-[#444]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Size Diameter</span>
                <span className="text-[#3d7fb8] font-mono">{activeBrush.size}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="128"
                value={activeBrush.size}
                onChange={(e) => onUpdateBrush({ size: Number(e.target.value) })}
                className="w-full accent-[#3d7fb8] h-1.5"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1 bg-[#303030] p-2 rounded border border-[#444]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Opacity</span>
                <span className="text-[#3d7fb8] font-mono">{activeBrush.opacity}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={activeBrush.opacity}
                onChange={(e) => onUpdateBrush({ opacity: Number(e.target.value) })}
                className="w-full accent-[#3d7fb8] h-1.5"
              />
            </div>

            {/* Hardness */}
            <div className="space-y-1 bg-[#303030] p-2 rounded border border-[#444]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Hardness Falloff</span>
                <span className="text-[#3d7fb8] font-mono">{activeBrush.hardness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeBrush.hardness}
                onChange={(e) => onUpdateBrush({ hardness: Number(e.target.value) })}
                className="w-full accent-[#3d7fb8] h-1.5"
              />
            </div>

            {/* Spacing */}
            <div className="space-y-1 bg-[#303030] p-2 rounded border border-[#444]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Spacing Distance</span>
                <span className="text-[#3d7fb8] font-mono">{activeBrush.spacing}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="150"
                value={activeBrush.spacing}
                onChange={(e) => onUpdateBrush({ spacing: Number(e.target.value) })}
                className="w-full accent-[#3d7fb8] h-1.5"
              />
            </div>

            {/* Scatter */}
            <div className="space-y-1 bg-[#303030] p-2 rounded border border-[#444]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Scattering Jitter</span>
                <span className="text-[#e5a038] font-mono">{activeBrush.scatter}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeBrush.scatter}
                onChange={(e) => onUpdateBrush({ scatter: Number(e.target.value) })}
                className="w-full accent-[#e5a038] h-1.5"
              />
            </div>

            {/* Stabilizer (Lazy Mouse) */}
            <div className="space-y-1 bg-[#303030] p-2 rounded border border-[#444]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Stroke Stabilizer (Lazy-Mouse)</span>
                <span className="text-[#a6e3a1] font-mono">{activeBrush.stabilizer}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeBrush.stabilizer}
                onChange={(e) => onUpdateBrush({ stabilizer: Number(e.target.value) })}
                className="w-full accent-[#a6e3a1] h-1.5"
              />
            </div>
          </div>

          {/* Section: DIGITAL STYLUS & PEN TABLET (Wintab / Windows Ink / Digitizer) */}
          <div className="bg-[#2a2a2a] p-2.5 rounded border border-[#555] space-y-2.5">
            <div className="text-[10px] font-mono text-[#a6e3a1] font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#3e3e3e] pb-1">
              <span className="flex items-center gap-1">
                <Tablet className="w-3.5 h-3.5 text-[#a6e3a1]" />
                STYLUS &amp; WINTAB TABLET DYNAMICS
              </span>
              <span className="text-[9px] text-[#888] font-mono">WIN32 / INK</span>
            </div>

            {/* Pressure Size Dynamics */}
            <div className="space-y-1.5 bg-[#333] p-2 rounded border border-[#444]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] text-[#eee] cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={activeBrush.pressureSize ?? true}
                    onChange={(e) => onUpdateBrush({ pressureSize: e.target.checked })}
                    className="accent-[#a6e3a1]"
                  />
                  <span>Pressure Size Dynamics</span>
                </label>
                <span className="text-[9px] font-mono text-[#a6e3a1]">{activeBrush.minSizePercent ?? 20}% MIN</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-[#aaa]">
                <span>Min Size:</span>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={activeBrush.minSizePercent ?? 20}
                  onChange={(e) => onUpdateBrush({ minSizePercent: Number(e.target.value) })}
                  className="w-28 accent-[#a6e3a1] h-1.5"
                />
              </div>
            </div>

            {/* Pressure Opacity Dynamics */}
            <div className="space-y-1.5 bg-[#333] p-2 rounded border border-[#444]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] text-[#eee] cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={activeBrush.pressureOpacity ?? true}
                    onChange={(e) => onUpdateBrush({ pressureOpacity: e.target.checked })}
                    className="accent-[#a6e3a1]"
                  />
                  <span>Pressure Opacity Dynamics</span>
                </label>
                <span className="text-[9px] font-mono text-[#a6e3a1]">{activeBrush.minOpacityPercent ?? 15}% MIN</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-[#aaa]">
                <span>Min Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={activeBrush.minOpacityPercent ?? 15}
                  onChange={(e) => onUpdateBrush({ minOpacityPercent: Number(e.target.value) })}
                  className="w-28 accent-[#a6e3a1] h-1.5"
                />
              </div>
            </div>

            {/* Stylus Tilt & Twist Rotation Dynamics */}
            <div className="grid grid-cols-2 gap-1.5">
              <label className="flex items-center gap-1.5 bg-[#333] p-1.5 rounded border border-[#444] text-[10px] text-[#ccc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeBrush.tiltDynamics ?? true}
                  onChange={(e) => onUpdateBrush({ tiltDynamics: e.target.checked })}
                  className="accent-[#a6e3a1]"
                />
                <span>Pen Tilt Angle</span>
              </label>

              <label className="flex items-center gap-1.5 bg-[#333] p-1.5 rounded border border-[#444] text-[10px] text-[#ccc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeBrush.twistDynamics ?? false}
                  onChange={(e) => onUpdateBrush({ twistDynamics: e.target.checked })}
                  className="accent-[#a6e3a1]"
                />
                <span>Barrel Twist</span>
              </label>
            </div>

            {/* Stroke Start & End Tip Taper Influences */}
            <div className="space-y-1.5 bg-[#333] p-2 rounded border border-[#444]">
              <span className="text-[10px] font-medium text-[#eee]">Stroke Taper Dynamics (% Influence):</span>
              
              <div className="flex items-center justify-between text-[9px] text-[#aaa]">
                <span>Start Tip Taper (Fade In):</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={activeBrush.startTaperPercent ?? 10}
                  onChange={(e) => onUpdateBrush({ startTaperPercent: Number(e.target.value) })}
                  className="w-24 accent-[#89b4fa] h-1.5"
                />
                <span className="font-mono text-[#89b4fa]">{activeBrush.startTaperPercent ?? 10}%</span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-[#aaa]">
                <span>End Tip Taper (Fade Out):</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={activeBrush.endTaperPercent ?? 15}
                  onChange={(e) => onUpdateBrush({ endTaperPercent: Number(e.target.value) })}
                  className="w-24 accent-[#f38ba8] h-1.5"
                />
                <span className="font-mono text-[#f38ba8]">{activeBrush.endTaperPercent ?? 15}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
