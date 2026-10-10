/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Tool Palette Strip
 * Created by Victory Ukpong
 */

import React from 'react';
import { ToolType } from '../core/types';
import { 
  Paintbrush, 
  Eraser, 
  Sparkles, 
  Stamp, 
  Fingerprint, 
  PenTool, 
  Square, 
  Lasso, 
  PaintBucket, 
  Pipette, 
  Hand, 
  ZoomIn, 
  Repeat 
} from 'lucide-react';

interface ToolBoxProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  primaryColor: string;
  secondaryColor: string;
  onSwapColors: () => void;
  onResetColors: () => void;
  onChangePrimaryColor: (color: string) => void;
  onChangeSecondaryColor: (color: string) => void;
  surfaceMode?: 'smooth' | 'hard' | 'default';
  onSelectSurfaceMode?: (mode: 'smooth' | 'hard' | 'default') => void;
}

export const ToolBox: React.FC<ToolBoxProps> = ({
  activeTool,
  onSelectTool,
  primaryColor,
  secondaryColor,
  onSwapColors,
  onResetColors,
  onChangePrimaryColor,
  onChangeSecondaryColor,
  surfaceMode = 'default',
  onSelectSurfaceMode,
}) => {
  const handleCycleSurfaceMode = () => {
    if (!onSelectSurfaceMode) return;
    const next = surfaceMode === 'default' ? 'smooth' : surfaceMode === 'smooth' ? 'hard' : 'default';
    onSelectSurfaceMode(next);
  };
  const tools: { id: ToolType; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { id: 'brush', label: 'Brush Tool', shortcut: 'B', icon: <Paintbrush className="w-4 h-4" /> },
    { id: 'eraser', label: 'Eraser Tool', shortcut: 'E', icon: <Eraser className="w-4 h-4" /> },
    { id: 'blur', label: 'Blur Tool (Seam Smoothing)', shortcut: 'R', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'clone', label: 'Clone Stamp Tool (Alt+Click Source)', shortcut: 'S', icon: <Stamp className="w-4 h-4" /> },
    { id: 'smudge', label: 'Smudge Tool (Pixel Push)', shortcut: 'U', icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'pen', label: 'Pen Tool (Vector Path)', shortcut: 'P', icon: <PenTool className="w-4 h-4" /> },
    { id: 'marquee_rect', label: 'Rectangular Marquee', shortcut: 'M', icon: <Square className="w-4 h-4" /> },
    { id: 'lasso', label: 'Lasso Selection', shortcut: 'L', icon: <Lasso className="w-4 h-4" /> },
    { id: 'polygon_lasso', label: 'Polygon Lasso', shortcut: 'Alt+L', icon: <Square className="w-4 h-4 transform rotate-45" /> },
    { id: 'bucket', label: 'Paint Bucket Fill', shortcut: 'G', icon: <PaintBucket className="w-4 h-4" /> },
    { id: 'eyedropper', label: 'Eyedropper Tool', shortcut: 'I', icon: <Pipette className="w-4 h-4" /> },
    { id: 'hand', label: 'Hand Tool (Pan Viewport)', shortcut: 'H / Space', icon: <Hand className="w-4 h-4" /> },
    { id: 'zoom', label: 'Zoom Tool', shortcut: 'Z', icon: <ZoomIn className="w-4 h-4" /> },
  ];

  return (
    <div className="w-9 bg-[#383838] border-r border-[#242424] flex flex-col items-center py-2 text-[#ccc] select-none z-30 cs5-outset">
      {/* Tool Buttons Stack */}
      <div className="flex flex-col gap-1 items-center w-full px-1">
        {tools.map((t) => {
          const isActive = activeTool === t.id;

          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              title={`${t.label} (${t.shortcut})`}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors border ${
                isActive
                  ? 'bg-[#2b2b2b] text-[#3d7fb8] border-[#222] cs5-inset shadow-inner'
                  : 'bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#bbb] border-[#4a4a4a]'
              }`}
            >
              {t.icon}
            </button>
          );
        })}

        {/* Surface Mode Button directly under Zoom: switches between smooth, hard, default */}
        <div className="w-full pt-1.5 border-t border-[#484848] flex flex-col items-center">
          <button
            onClick={handleCycleSurfaceMode}
            title={`Surface Mesh Mode: ${surfaceMode.toUpperCase()} (Click to switch between Smooth, Hard, Default)`}
            className={`w-7 h-7 rounded flex flex-col items-center justify-center transition-colors border text-[8px] font-mono font-bold ${
              surfaceMode === 'smooth'
                ? 'bg-[#2b3a4a] text-[#89b4fa] border-[#3d7fb8]'
                : surfaceMode === 'hard'
                ? 'bg-[#3d2b2b] text-[#f38ba8] border-[#a64040]'
                : 'bg-[#282828] text-[#a6e3a1] border-[#444] hover:bg-[#333]'
            }`}
          >
            <span>{surfaceMode === 'smooth' ? 'SMO' : surfaceMode === 'hard' ? 'HRD' : 'DEF'}</span>
            <span className="text-[6.5px] opacity-70 leading-none">SURF</span>
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Foreground & Background Color Chips */}
      <div className="relative w-7 h-8 my-2">
        {/* Secondary (Background) Color Chip */}
        <div 
          className="absolute right-0 bottom-0 w-4.5 h-4.5 rounded-xs border border-[#222] shadow-sm cs5-inset cursor-pointer"
          style={{ backgroundColor: secondaryColor }}
          title="Background Color"
        >
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => onChangeSecondaryColor(e.target.value)}
            className="opacity-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Primary (Foreground) Color Chip */}
        <div 
          className="absolute left-0 top-0 w-4.5 h-4.5 rounded-xs border border-[#222] shadow-sm cs5-outset z-10 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
          title="Foreground Color"
        >
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => onChangePrimaryColor(e.target.value)}
            className="opacity-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Swap Colors Icon */}
        <button
          onClick={onSwapColors}
          className="absolute -top-1 -right-1 text-[#aaa] hover:text-white z-20"
          title="Swap Colors (X)"
        >
          <Repeat className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Reset Colors Icon */}
      <button
        onClick={onResetColors}
        className="text-[9px] text-[#888] hover:text-[#eee] font-mono mb-1"
        title="Reset Default Black/White (D)"
      >
        [D]
      </button>
    </div>
  );
};
