/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Autodesk Sketchbook Pro & Maya Lagoon Radial Interface
 * Created by Victory Ukpong
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ToolType, BrushPreset, Layer, BlendMode 
} from '../core/types';
import { 
  Paintbrush, Eraser, Sparkles, Fingerprint, Stamp, PenTool, 
  PaintBucket, Pipette, Sliders, Layers, Palette, Eye, 
  Save, Download, Undo2, Redo2, Camera, Box, ChevronRight,
  Maximize2, RotateCcw, X, Circle, Activity
} from 'lucide-react';

interface LagoonMenuProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  brush: BrushPreset;
  onUpdateBrush: (patch: Partial<BrushPreset>) => void;
  primaryColor: string;
  secondaryColor: string;
  onSelectPrimaryColor: (color: string) => void;
  onSwapColors: () => void;
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onToggleLayerVisibility: (id: string) => void;
  onNumpadKey: (key: string, ctrl: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveProject: () => void;
  onExportOBJ: () => void;
  onTriggerProjection: () => void;
  onCloseLagoon?: () => void;
}

type LagoonWing = 'tools' | 'brush' | 'colors' | 'layers' | 'views' | 'project' | null;

export const LagoonMenu: React.FC<LagoonMenuProps> = ({
  activeTool,
  onSelectTool,
  brush,
  onUpdateBrush,
  primaryColor,
  secondaryColor,
  onSelectPrimaryColor,
  onSwapColors,
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onToggleLayerVisibility,
  onNumpadKey,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveProject,
  onExportOBJ,
  onTriggerProjection,
  onCloseLagoon,
}) => {
  const [activeWing, setActiveWing] = useState<LagoonWing>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 38, y: 38 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number }>({
    startX: 0,
    startY: 0,
    origX: 38,
    origY: 38,
  });

  // Color palette swatches for quick color wing
  const quickPalette = [
    '#ffffff', '#000000', '#7f7f7f', '#c0c0c0',
    '#e11d48', '#ea580c', '#eab308', '#16a34a',
    '#0284c7', '#2563eb', '#9333ea', '#db2777',
    '#fbcfe8', '#fed7aa', '#fde047', '#bbf7d0',
    '#bae6fd', '#c7d2fe', '#e9d5ff', '#3b2314'
  ];

  const strokeModes = [
    { id: 'space', label: 'Space' },
    { id: 'airbrush', label: 'Airbrush' },
    { id: 'dot', label: 'Dot' },
    { id: 'dragged-dot', label: 'Drag' },
    { id: 'curve', label: 'Curve' },
  ];

  // Drag handling for floating lagoon puck
  const handlePointerDownPuck = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag when clicking center icon or drag handle
    if ((e.target as HTMLElement).closest('.lagoon-wing-btn')) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMovePuck = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    // Position relative to bottom-left corner
    setPosition({
      x: Math.max(20, Math.min(window.innerWidth - 180, dragStartRef.current.origX + dx)),
      y: Math.max(20, Math.min(window.innerHeight - 180, dragStartRef.current.origY - dy)),
    });
  };

  const handlePointerUpPuck = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const wingsConfig: {
    id: LagoonWing;
    label: string;
    icon: React.ReactNode;
    color: string;
    angle: number; // in degrees from bottom-center
  }[] = [
    { id: 'tools', label: 'Tools', icon: <Paintbrush className="w-4 h-4" />, color: '#3d7fb8', angle: 10 },
    { id: 'brush', label: 'Brush', icon: <Sliders className="w-4 h-4" />, color: '#38bdf8', angle: 42 },
    { id: 'colors', label: 'Colors', icon: <Palette className="w-4 h-4" />, color: '#fab387', angle: 74 },
    { id: 'layers', label: 'Layers', icon: <Layers className="w-4 h-4" />, color: '#a6e3a1', angle: 106 },
    { id: 'views', label: 'Views', icon: <Eye className="w-4 h-4" />, color: '#cba6f7', angle: 138 },
    { id: 'project', label: 'Project', icon: <Save className="w-4 h-4" />, color: '#f38ba8', angle: 170 },
  ];

  return (
    <div 
      className="fixed z-40 select-none pointer-events-auto"
      style={{ left: `${position.x}px`, bottom: `${position.y}px` }}
    >
      {/* Central Sketchbook Lagoon Puck */}
      <div 
        onPointerDown={handlePointerDownPuck}
        onPointerMove={handlePointerMovePuck}
        onPointerUp={handlePointerUpPuck}
        className="relative w-28 h-28 rounded-full bg-[#202020]/95 border-2 border-[#555] shadow-2xl flex items-center justify-center cs5-outset cursor-grab active:cursor-grabbing backdrop-blur-md transition-transform hover:scale-102"
      >
        {/* Decorative Circular Arc Gauge */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none -rotate-90">
          <circle cx="56" cy="56" r="48" fill="none" stroke="#2e2e2e" strokeWidth="6" />
          <circle 
            cx="56" cy="56" r="48" fill="none" 
            stroke="#3d7fb8" strokeWidth="6" 
            strokeDasharray={301} 
            strokeDashoffset={120} 
            strokeLinecap="round" 
          />
        </svg>

        {/* Central Core Status Button */}
        <button
          onClick={() => setActiveWing(w => w ? null : 'tools')}
          className="w-14 h-14 rounded-full bg-[#2b2b2b] hover:bg-[#383838] border border-[#555] flex flex-col items-center justify-center text-white shadow-inner transition-colors z-10 cursor-pointer"
          title="Lagoon Radial Menu (Click to toggle wings)"
        >
          <div className="text-[10px] font-mono font-bold text-[#38bdf8] flex items-center gap-0.5">
            <span>LAGOON</span>
          </div>
          <span className="text-[8px] font-mono text-[#aaa] capitalize">
            {activeWing || activeTool}
          </span>
        </button>

        {/* Radial Wings / Petals Fan */}
        {wingsConfig.map((wing) => {
          // Compute circular arc coordinate for petal button
          const rad = (wing.angle * Math.PI) / 180;
          const dist = 58; // radius from center
          const petalX = Math.cos(rad) * dist;
          const petalY = -Math.sin(rad) * dist;
          const isSelected = activeWing === wing.id;

          return (
            <button
              key={wing.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveWing(activeWing === wing.id ? null : wing.id);
              }}
              style={{
                transform: `translate(${petalX}px, ${petalY}px)`,
                borderColor: isSelected ? wing.color : undefined,
              }}
              className={`lagoon-wing-btn absolute w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-lg ${
                isSelected
                  ? 'bg-[#3c3c3c] scale-115 text-white shadow-xl ring-2'
                  : 'bg-[#282828] border-[#444] text-[#bbb] hover:text-white hover:bg-[#343434] hover:scale-108'
              }`}
              title={`${wing.label} Radial Wing`}
            >
              <span style={{ color: isSelected ? wing.color : undefined }}>
                {wing.icon}
              </span>
            </button>
          );
        })}
      </div>

      {/* Radial Sub-Flyout Panel (Opened when a wing is tapped) */}
      {activeWing && (
        <div 
          className="absolute left-32 bottom-2 bg-[#252525]/95 border border-[#555] rounded-2xl p-3 shadow-2xl cs5-outset backdrop-blur-md w-72 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 z-50 text-xs"
        >
          {/* Header of Active Wing */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#404040]">
            <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              {wingsConfig.find(w => w.id === activeWing)?.icon}
              <span>{activeWing} Lagoon Wing</span>
            </span>
            <button 
              onClick={() => setActiveWing(null)} 
              className="text-[#888] hover:text-white text-xs p-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* 1. TOOLS WING */}
          {activeWing === 'tools' && (
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'brush', label: 'Brush (B)', icon: <Paintbrush className="w-3.5 h-3.5 text-[#3d7fb8]" /> },
                { id: 'eraser', label: 'Eraser (E)', icon: <Eraser className="w-3.5 h-3.5 text-[#f38ba8]" /> },
                { id: 'blur', label: 'Blur (R)', icon: <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" /> },
                { id: 'smudge', label: 'Smudge (U)', icon: <Fingerprint className="w-3.5 h-3.5 text-[#cba6f7]" /> },
                { id: 'clone', label: 'Clone (S)', icon: <Stamp className="w-3.5 h-3.5 text-[#e5a038]" /> },
                { id: 'pen', label: 'Pen Path (P)', icon: <PenTool className="w-3.5 h-3.5 text-[#a6e3a1]" /> },
                { id: 'bucket', label: 'Fill (G)', icon: <PaintBucket className="w-3.5 h-3.5 text-[#fab387]" /> },
                { id: 'eyedropper', label: 'Sample (I)', icon: <Pipette className="w-3.5 h-3.5 text-[#fab387]" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onSelectTool(t.id as ToolType); setActiveWing(null); }}
                  className={`p-1.5 rounded border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTool === t.id
                      ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white font-bold'
                      : 'bg-[#202020] border-[#383838] text-[#aaa] hover:bg-[#2c2c2c] hover:text-white'
                  }`}
                  title={t.label}
                >
                  {t.icon}
                  <span className="text-[9px] truncate max-w-full">{t.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}

          {/* 2. BRUSH DYNAMICS WING */}
          {activeWing === 'brush' && (
            <div className="space-y-2">
              {/* Size */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Diameter Size</span>
                  <span className="font-mono text-[#38bdf8] font-bold">{brush.size}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="128"
                  value={brush.size}
                  onChange={(e) => onUpdateBrush({ size: Number(e.target.value) })}
                  className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
                />
              </div>

              {/* Opacity */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Brush Opacity</span>
                  <span className="font-mono text-[#a6e3a1] font-bold">{brush.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={brush.opacity}
                  onChange={(e) => onUpdateBrush({ opacity: Number(e.target.value) })}
                  className="w-full accent-[#a6e3a1] h-1.5 cursor-pointer"
                />
              </div>

              {/* Mode */}
              <div className="space-y-1 pt-1 border-t border-[#3e3e3e]">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Stroke Mode</span>
                  <span className="font-mono text-[#fab387] capitalize font-bold">{brush.strokeType || 'space'}</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {strokeModes.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => onUpdateBrush({ strokeType: st.id as any })}
                      className={`p-1 rounded text-[9px] font-mono border text-center transition-all cursor-pointer ${
                        (brush.strokeType || 'space') === st.id
                          ? 'bg-[#fab387]/30 border-[#fab387] text-white font-bold'
                          : 'bg-[#202020] border-[#383838] text-[#888] hover:text-white'
                      }`}
                    >
                      {st.label.slice(0, 4)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing & Stabilizer */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#3e3e3e]">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-[#aaa]">
                    <span>Space</span>
                    <span className="font-mono text-[#38bdf8]">{brush.spacing}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    value={brush.spacing}
                    onChange={(e) => onUpdateBrush({ spacing: Number(e.target.value) })}
                    className="w-full accent-[#3d7fb8] h-1.5"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-[#aaa]">
                    <span>Lazy Mouse</span>
                    <span className="font-mono text-[#a6e3a1]">{brush.stabilizer}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={brush.stabilizer}
                    onChange={(e) => onUpdateBrush({ stabilizer: Number(e.target.value) })}
                    className="w-full accent-[#a6e3a1] h-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. COLORS WING */}
          {activeWing === 'colors' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#202020] p-1.5 rounded border border-[#444]">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-white shadow-xs cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                    title="Active Primary Color"
                  />
                  <div 
                    className="w-5 h-5 rounded border border-[#666] cursor-pointer"
                    style={{ backgroundColor: secondaryColor }}
                    title="Secondary Color"
                  />
                  <span className="font-mono text-[10px] text-[#eee]">{primaryColor}</span>
                </div>
                <button
                  onClick={onSwapColors}
                  className="px-2 py-0.5 bg-[#333] hover:bg-[#444] text-[#ccc] rounded text-[10px] border border-[#555] font-mono cursor-pointer"
                  title="Swap Colors (X)"
                >
                  Swap (X)
                </button>
              </div>

              {/* Quick Color Swatches Grid */}
              <div className="grid grid-cols-5 gap-1.5 pt-1 border-t border-[#3e3e3e]">
                {quickPalette.map((col) => (
                  <button
                    key={col}
                    onClick={() => { onSelectPrimaryColor(col); }}
                    style={{ backgroundColor: col }}
                    className={`w-7 h-7 rounded-sm border transition-transform hover:scale-110 cursor-pointer ${
                      primaryColor.toLowerCase() === col.toLowerCase()
                        ? 'ring-2 ring-[#38bdf8] border-white scale-105'
                        : 'border-[#444]'
                    }`}
                    title={col}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4. LAYERS WING */}
          {activeWing === 'layers' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#3e3e3e]">
                <span className="text-[10px] font-mono text-[#888]">LAYERS ({layers.length})</span>
                <button
                  onClick={onAddLayer}
                  className="px-2 py-0.5 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  + Add Layer
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {layers.slice().reverse().map((layer) => {
                  const isActive = layer.id === activeLayerId;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => onSelectLayer(layer.id)}
                      className={`flex items-center justify-between p-1.5 rounded border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white font-medium'
                          : 'bg-[#202020] border-[#383838] text-[#aaa] hover:bg-[#2c2c2c]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleLayerVisibility(layer.id); }}
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                            layer.visible ? 'text-[#a6e3a1]' : 'text-[#666]'
                          }`}
                        >
                          {layer.visible ? '👁' : '—'}
                        </button>
                        <span className="truncate text-[10px]">{layer.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#888]">{layer.opacity}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. VIEWS WING (Camera Viewpoints) */}
          {activeWing === 'views' && (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { onNumpadKey('1', false); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Front View</span>
                  <span className="font-mono text-[#888]">Num 1</span>
                </button>
                <button
                  onClick={() => { onNumpadKey('1', true); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Back View</span>
                  <span className="font-mono text-[#888]">Ctrl+1</span>
                </button>
                <button
                  onClick={() => { onNumpadKey('3', false); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Right View</span>
                  <span className="font-mono text-[#888]">Num 3</span>
                </button>
                <button
                  onClick={() => { onNumpadKey('3', true); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Left View</span>
                  <span className="font-mono text-[#888]">Ctrl+3</span>
                </button>
                <button
                  onClick={() => { onNumpadKey('7', false); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Top View</span>
                  <span className="font-mono text-[#888]">Num 7</span>
                </button>
                <button
                  onClick={() => { onNumpadKey('7', true); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Bottom View</span>
                  <span className="font-mono text-[#888]">Ctrl+7</span>
                </button>
                <button
                  onClick={() => { onNumpadKey('5', false); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Ortho / Persp</span>
                  <span className="font-mono text-[#888]">Num 5</span>
                </button>
                <button
                  onClick={() => { onNumpadKey('0', false); }}
                  className="p-1.5 bg-[#202020] hover:bg-[#343434] text-[#eee] rounded border border-[#444] text-left text-[10px] flex justify-between cursor-pointer"
                >
                  <span>Reset Zoom</span>
                  <span className="font-mono text-[#888]">Num 0</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. PROJECT WING */}
          {activeWing === 'project' && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onSaveProject}
                className="p-2 bg-[#202020] hover:bg-[#343434] text-[#a6e3a1] rounded border border-[#444] text-left text-[10px] flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Project</span>
              </button>
              <button
                onClick={onExportOBJ}
                className="p-2 bg-[#202020] hover:bg-[#343434] text-[#38bdf8] rounded border border-[#444] text-left text-[10px] flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export OBJ</span>
              </button>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2 bg-[#202020] hover:bg-[#343434] disabled:opacity-40 text-[#eee] rounded border border-[#444] text-left text-[10px] flex items-center gap-1.5 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5 text-[#e5a038]" />
                <span>Undo (Ctrl+Z)</span>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2 bg-[#202020] hover:bg-[#343434] disabled:opacity-40 text-[#eee] rounded border border-[#444] text-left text-[10px] flex items-center gap-1.5 cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5 text-[#e5a038]" />
                <span>Redo (Ctrl+Y)</span>
              </button>
              <button
                onClick={onTriggerProjection}
                className="col-span-2 p-2 bg-[#333] hover:bg-[#444] text-[#eee] rounded border border-[#555] text-center text-[10px] flex items-center justify-center gap-1.5 cursor-pointer font-bold"
              >
                <Camera className="w-3.5 h-3.5 text-[#3d7fb8]" />
                <span>Projection Screenshot (F8)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
