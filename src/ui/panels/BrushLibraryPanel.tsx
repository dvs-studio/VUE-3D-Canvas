/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Brush Library & Dynamics Panel
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { BrushPreset } from '../../core/types';
import { Sliders, Disc, Shield, Sparkles, Feather, CircleDot, ChevronDown, ChevronRight } from 'lucide-react';

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
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categories = ['Standard', 'Inking', 'Textures', 'Organic', 'Hard Surface', 'VFX'];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838]">
      {/* Dynamic Controls Header: Spacing, Scatter, Stabilizer */}
      <div className="p-2.5 border-b border-[#494949] bg-[#333] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#999] font-mono uppercase tracking-wider">BRUSH DYNAMICS</span>
          <button
            onClick={onOpenCarousel}
            className="px-2 py-0.5 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded text-[10px] flex items-center gap-1 transition-colors font-medium"
            title="Open Radial Carousel Menu (V)"
          >
            <Disc className="w-3 h-3" />
            Carousel (V)
          </button>
        </div>

        {/* Spacing Distance Trigger */}
        <div className="space-y-0.5">
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

        {/* Scattering Effect Jitter */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-[#aaa]">Scattering Effect</span>
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

        {/* Stroke Stabilizer (Medibang Lazy Mouse) */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-[#aaa]">Stroke Stabilizer</span>
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

      {/* Categorized Brush Library Folders */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-2">
        {categories.map((cat) => {
          const isCollapsed = !!collapsedCategories[cat];
          const catBrushes = brushes.filter(b => b.category === cat);

          return (
            <div key={cat} className="border border-[#484848] rounded bg-[#2e2e2e] overflow-hidden">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full px-2 py-1 bg-[#363636] hover:bg-[#404040] flex items-center justify-between text-[11px] font-bold text-[#ddd] border-b border-[#444]"
              >
                <div className="flex items-center gap-1.5">
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-[#888]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#888]" />}
                  <span>{cat}</span>
                </div>
                <span className="text-[9px] font-mono text-[#888]">{catBrushes.length}</span>
              </button>

              {!isCollapsed && (
                <div className="p-1 space-y-0.5">
                  {catBrushes.map((brush) => {
                    const isSelected = activeBrush.id === brush.id;
                    return (
                      <div
                        key={brush.id}
                        onClick={() => onSelectBrush(brush)}
                        className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#3d7fb8] text-white font-medium'
                            : 'hover:bg-[#383838] text-[#ccc]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CircleDot className="w-3 h-3 text-[#aaa] shrink-0" />
                          <span className="truncate text-[11px]">{brush.name}</span>
                        </div>
                        <span className="text-[9px] font-mono opacity-80 shrink-0">
                          {brush.size}px
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
