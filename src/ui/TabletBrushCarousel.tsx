/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Tablet Mode Top-Left Brush Parameter Carousel
 * Created by Victory Ukpong
 */

import React, { useState, useRef } from 'react';
import { BrushPreset, TabletSubOperator } from '../core/types';
import { Sliders, Circle, Sparkles, Feather, ShieldCheck, ChevronUp, ChevronDown, Activity } from 'lucide-react';

interface TabletBrushCarouselProps {
  brush: BrushPreset;
  onUpdateBrush: (patch: Partial<BrushPreset>) => void;
  subOperatorStyle?: TabletSubOperator;
}

type ActiveParam = 'size' | 'opacity' | 'mode' | 'spacing' | 'scatter' | 'hardness' | 'stabilizer' | null;

export const TabletBrushCarousel: React.FC<TabletBrushCarouselProps> = ({
  brush,
  onUpdateBrush,
  subOperatorStyle = 'radial',
}) => {
  const [activeParam, setActiveParam] = useState<ActiveParam>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const dialRef = useRef<HTMLDivElement | null>(null);

  const strokeModes = [
    { id: 'space', label: 'Space', short: 'SPC' },
    { id: 'airbrush', label: 'Airbrush', short: 'AIR' },
    { id: 'dot', label: 'Dot', short: 'DOT' },
    { id: 'dragged-dot', label: 'Drag', short: 'DRG' },
    { id: 'curve', label: 'Curve', short: 'CRV' },
  ];

  const params: { id: ActiveParam; label: string; icon: React.ReactNode; value: string | number; unit: string; min: number; max: number; color: string }[] = [
    { id: 'size', label: 'Size', icon: <Circle className="w-3.5 h-3.5" />, value: brush.size, unit: 'px', min: 1, max: 256, color: '#3d7fb8' },
    { id: 'opacity', label: 'Opac', icon: <Feather className="w-3.5 h-3.5" />, value: brush.opacity, unit: '%', min: 1, max: 100, color: '#38bdf8' },
    { id: 'mode', label: 'Mode', icon: <Activity className="w-3.5 h-3.5" />, value: (brush.strokeType || 'space').slice(0, 3).toUpperCase(), unit: '', min: 0, max: 4, color: '#fab387' },
    { id: 'spacing', label: 'Space', icon: <Sliders className="w-3.5 h-3.5" />, value: brush.spacing, unit: '%', min: 1, max: 150, color: '#a6e3a1' },
    { id: 'scatter', label: 'Scat', icon: <Sparkles className="w-3.5 h-3.5" />, value: brush.scatter, unit: '%', min: 0, max: 100, color: '#f59e0b' },
    { id: 'hardness', label: 'Hard', icon: <Circle className="w-3.5 h-3.5 stroke-[3]" />, value: brush.hardness, unit: '%', min: 0, max: 100, color: '#cba6f7' },
    { id: 'stabilizer', label: 'Stab', icon: <ShieldCheck className="w-3.5 h-3.5" />, value: brush.stabilizer, unit: '%', min: 0, max: 100, color: '#f38ba8' },
  ];

  const currentParamDef = params.find(p => p.id === activeParam);

  // Radial dial drag interaction
  const handleDialPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!currentParamDef || !dialRef.current || currentParamDef.id === 'mode') return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const updateFromPointer = (clientX: number, clientY: number) => {
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // 0 at top
      if (angle < 0) angle += 360;

      // Map 0 - 360 deg to min - max
      const ratio = Math.max(0, Math.min(1, angle / 360));
      const val = Math.round(currentParamDef.min + ratio * (currentParamDef.max - currentParamDef.min));
      if (currentParamDef.id) {
        onUpdateBrush({ [currentParamDef.id]: val });
      }
    };

    updateFromPointer(e.clientX, e.clientY);

    const onPointerMove = (ev: PointerEvent) => {
      updateFromPointer(ev.clientX, ev.clientY);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="fixed top-11 left-3 z-40 flex flex-col items-start gap-1 select-none pointer-events-auto">
      {/* Header bar / Minimize toggle */}
      <div className="flex items-center gap-1 bg-[#252525]/95 backdrop-blur-none border border-[#444] rounded px-2 py-0.5 shadow-xl cs5-outset">
        <span className="text-[10px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1 font-bold">
          <Sliders className="w-3 h-3 text-[#3d7fb8]" />
          Tablet Brush Dynamics
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer"
          title={collapsed ? 'Expand Carousel' : 'Collapse Carousel'}
        >
          {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-1.5 items-start mt-0.5">
          {/* Circular/Cluster Carousel Bar */}
          <div className="flex items-center gap-1 bg-[#2c2c2c]/95 border border-[#444] rounded-full p-1 shadow-2xl cs5-outset">
            {params.map((p) => {
              const isActive = activeParam === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveParam(isActive ? null : p.id)}
                  style={{ borderColor: isActive ? p.color : undefined }}
                  className={`w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#383838] shadow-lg scale-105'
                      : 'bg-[#202020] border-[#404040] text-[#aaa] hover:text-white hover:bg-[#282828]'
                  }`}
                  title={`${p.label}: ${p.value}${p.unit} (Tap to adjust)`}
                >
                  <div style={{ color: isActive ? p.color : '#888' }}>
                    {p.icon}
                  </div>
                  <span className="text-[8px] font-mono font-bold leading-none mt-0.5" style={{ color: isActive ? '#fff' : '#aaa' }}>
                    {p.value}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-Operator Popups */}
          {activeParam && currentParamDef && (
            <div className="animate-in fade-in zoom-in-95 duration-150">
              {currentParamDef.id === 'mode' ? (
                /* Specialized Sub-Operator for Stroke Application Mode */
                <div className="w-56 bg-[#252525] border border-[#555] rounded-xl p-2.5 shadow-2xl cs5-outset flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#3e3e3e]">
                    <span className="font-bold text-white flex items-center gap-1">
                      <span className="text-[#fab387]">●</span>
                      Stroke Mode
                    </span>
                    <span className="font-mono text-[#fab387] font-bold capitalize">
                      {brush.strokeType || 'space'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1">
                    {strokeModes.map((st) => {
                      const isSelected = (brush.strokeType || 'space') === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => {
                            onUpdateBrush({ strokeType: st.id as any });
                            setActiveParam(null);
                          }}
                          className={`p-1 rounded text-center transition-all cursor-pointer border flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-[#fab387]/30 border-[#fab387] text-white shadow-xs'
                              : 'bg-[#1e1e1e] border-[#383838] text-[#aaa] hover:bg-[#2e2e2e] hover:text-white'
                          }`}
                          title={st.label}
                        >
                          <span className="text-[10px] font-mono font-bold">{st.short}</span>
                          <span className="text-[7.5px] truncate">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : subOperatorStyle === 'radial' ? (
                /* Mode 1: Radial Dial Arc Popup */
                <div 
                  ref={dialRef}
                  onPointerDown={handleDialPointerDown}
                  className="w-28 h-28 rounded-full bg-[#1e1e1e] border-2 border-[#555] shadow-2xl flex flex-col items-center justify-center relative cs5-outset cursor-pointer select-none"
                  style={{ borderColor: currentParamDef.color }}
                >
                  {/* Gauge Arc Ring Indicator */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      fill="none"
                      stroke="#333"
                      strokeWidth="6"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      fill="none"
                      stroke={currentParamDef.color}
                      strokeWidth="6"
                      strokeDasharray={289}
                      strokeDashoffset={
                        typeof currentParamDef.value === 'number'
                          ? 289 - (289 * (currentParamDef.value - currentParamDef.min)) / (currentParamDef.max - currentParamDef.min)
                          : 0
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-[9px] font-mono text-[#888] uppercase tracking-wider">
                    {currentParamDef.label}
                  </span>
                  <span className="text-base font-bold font-mono text-white leading-tight">
                    {currentParamDef.value}{currentParamDef.unit}
                  </span>
                  <span className="text-[8px] text-[#666] font-mono">
                    Drag Circular Dial
                  </span>
                </div>
              ) : (
                /* Mode 2: Compact Floating Circular HUD */
                <div className="w-48 bg-[#252525] border border-[#555] rounded-xl p-2.5 shadow-2xl cs5-outset flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white flex items-center gap-1">
                      <span style={{ color: currentParamDef.color }}>●</span>
                      {currentParamDef.label}
                    </span>
                    <span className="font-mono text-[#38bdf8] font-bold">
                      {currentParamDef.value}{currentParamDef.unit}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={currentParamDef.min}
                    max={currentParamDef.max}
                    value={typeof currentParamDef.value === 'number' ? currentParamDef.value : 0}
                    onChange={(e) => onUpdateBrush({ [currentParamDef.id as string]: Number(e.target.value) })}
                    className="w-full accent-[#3d7fb8] h-2 cursor-pointer"
                  />

                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <button
                      onClick={() => onUpdateBrush({ [currentParamDef.id as string]: Math.max(currentParamDef.min, Number(currentParamDef.value) - 5) })}
                      className="px-2 py-0.5 bg-[#333] hover:bg-[#444] text-[#ccc] rounded text-[10px] font-mono border border-[#484848]"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => onUpdateBrush({ [currentParamDef.id as string]: Math.max(currentParamDef.min, Number(currentParamDef.value) - 1) })}
                      className="px-2 py-0.5 bg-[#333] hover:bg-[#444] text-[#ccc] rounded text-[10px] font-mono border border-[#484848]"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => onUpdateBrush({ [currentParamDef.id as string]: Math.min(currentParamDef.max, Number(currentParamDef.value) + 1) })}
                      className="px-2 py-0.5 bg-[#333] hover:bg-[#444] text-[#ccc] rounded text-[10px] font-mono border border-[#484848]"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => onUpdateBrush({ [currentParamDef.id as string]: Math.min(currentParamDef.max, Number(currentParamDef.value) + 5) })}
                      className="px-2 py-0.5 bg-[#333] hover:bg-[#444] text-[#ccc] rounded text-[10px] font-mono border border-[#484848]"
                    >
                      +5
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
