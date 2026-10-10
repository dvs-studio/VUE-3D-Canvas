/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Autodesk Sketchbook / Medibang Style Circular Carousel
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { BrushPreset } from '../core/types';
import { Paintbrush, Eraser, Sparkles, Feather, CircleDot, Shield, Layers, X } from 'lucide-react';

interface CircularCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  brushes: BrushPreset[];
  activeBrush: BrushPreset;
  onSelectBrush: (brush: BrushPreset) => void;
  position?: { x: number; y: number };
}

export const CircularCarousel: React.FC<CircularCarouselProps> = ({
  isOpen,
  onClose,
  brushes,
  activeBrush,
  onSelectBrush,
  position,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Standard');

  if (!isOpen) return null;

  const categories = ['Standard', 'Inking', 'Textures', 'Organic', 'Hard Surface', 'VFX'];
  const filteredBrushes = brushes.filter(b => b.category === selectedCategory);

  const radius = 95;
  const count = filteredBrushes.length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-72 h-72 flex items-center justify-center pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        style={position ? { position: 'absolute', left: `${position.x - 144}px`, top: `${position.y - 144}px` } : {}}
      >
        {/* Background Radial Wheel */}
        <div className="absolute inset-0 rounded-full bg-[#2c2c2c]/95 border-2 border-[#555] shadow-2xl flex items-center justify-center cs5-inset">
          {/* Subtle Outer Guide Rings */}
          <div className="absolute w-[260px] h-[260px] rounded-full border border-[#444]/60 pointer-events-none" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-[#3d7fb8]/30 pointer-events-none" />
        </div>

        {/* Center Hub */}
        <div className="z-20 w-24 h-24 rounded-full bg-[#383838] border-2 border-[#3d7fb8] flex flex-col items-center justify-center text-center p-2 cs5-outset shadow-lg">
          <span className="text-[10px] text-[#888] font-mono tracking-widest uppercase">CAROUSEL</span>
          <span className="text-xs font-bold text-[#eee] truncate max-w-[84px]">{activeBrush.name}</span>
          <span className="text-[10px] text-[#3d7fb8] font-mono">{activeBrush.size}px · {activeBrush.opacity}%</span>
          <button 
            onClick={onClose}
            className="mt-1 text-[#aaa] hover:text-white p-0.5 rounded"
            title="Close Carousel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Radial Brush Wedges */}
        {filteredBrushes.map((brush, idx) => {
          const angle = (idx * (2 * Math.PI) / count) - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSelected = activeBrush.id === brush.id;

          return (
            <button
              key={brush.id}
              onClick={() => {
                onSelectBrush(brush);
                onClose();
              }}
              title={`${brush.name} (${brush.category})`}
              className={`absolute z-30 w-11 h-11 -ml-5.5 -mt-5.5 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform hover:scale-115 ${
                isSelected
                  ? 'bg-[#3d7fb8] text-white border-2 border-white shadow-lg'
                  : 'bg-[#444] text-[#ccc] border border-[#666] hover:bg-[#525252] hover:text-white'
              }`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              <span className="text-[10px] font-bold font-mono leading-none">{brush.size}</span>
              <span className="text-[8px] text-[#aaa] truncate max-w-[36px]">{brush.tipShape || 'rnd'}</span>
            </button>
          );
        })}

        {/* Category Selector Ring Tabs */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#262626] p-1 rounded-md border border-[#444] shadow-md z-40">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#3d7fb8] text-white font-medium'
                  : 'text-[#aaa] hover:text-[#eee] hover:bg-[#333]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
