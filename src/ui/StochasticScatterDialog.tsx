/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Stochastic Layer Scattering Dialog
 * Created by Victory Ukpong
 */

import React, { useState, useEffect, useRef } from 'react';
import { Layer } from '../core/types';
import { StochasticScatterEngine, StochasticScatterConfig } from '../tools/stochasticScatter';
import { Shuffle, Check, X, Eye, Sparkles } from 'lucide-react';

interface StochasticScatterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: Layer | undefined;
  defaultColor: string;
  onApply: (config: StochasticScatterConfig) => void;
  onPreviewUpdate: () => void;
}

export const StochasticScatterDialog: React.FC<StochasticScatterDialogProps> = ({
  isOpen,
  onClose,
  activeLayer,
  defaultColor,
  onApply,
  onPreviewUpdate,
}) => {
  const [numberOfRepeats, setNumberOfRepeats] = useState<number>(0); // 0 = stochastic non-repeating
  const [stampDensity, setStampDensity] = useState<number>(45);
  const [edgeBlendContrast, setEdgeBlendContrast] = useState<number>(0.35);
  const [scatterStrength, setScatterStrength] = useState<number>(0.75);
  const [randomSeed, setRandomSeed] = useState<number>(1337);
  const [rotationMin, setRotationMin] = useState<number>(-180);
  const [rotationMax, setRotationMax] = useState<number>(180);
  const [scaleMin, setScaleMin] = useState<number>(0.4);
  const [scaleMax, setScaleMax] = useState<number>(1.2);
  const [blendMode, setBlendMode] = useState<StochasticScatterConfig['blendMode']>('NORMAL');
  const [stampType, setStampType] = useState<StochasticScatterConfig['stampType']>('grunge');
  const [primaryColor, setPrimaryColor] = useState<string>(defaultColor || '#e6e6e6');
  const [opacity, setOpacity] = useState<number>(85);
  const [preview, setPreview] = useState<boolean>(true);

  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const getConfig = (): StochasticScatterConfig => ({
    numberOfRepeats,
    stampDensity,
    edgeBlendContrast,
    scatterStrength,
    randomSeed,
    rotationMin,
    rotationMax,
    scaleMin,
    scaleMax,
    blendMode,
    stampType,
    primaryColor,
    opacity,
  });

  useEffect(() => {
    if (!isOpen || !activeLayer) return;

    const b = document.createElement('canvas');
    b.width = activeLayer.canvas.width;
    b.height = activeLayer.canvas.height;
    const bctx = b.getContext('2d')!;
    bctx.drawImage(activeLayer.canvas, 0, 0);
    backupCanvasRef.current = b;

    if (preview) {
      applyPreview(getConfig());
    }

    return () => {
      if (backupCanvasRef.current && activeLayer) {
        activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);
        onPreviewUpdate();
      }
      backupCanvasRef.current = null;
    };
  }, [isOpen, activeLayer]);

  const applyPreview = (cfg: StochasticScatterConfig) => {
    if (!backupCanvasRef.current || !activeLayer) return;

    activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);

    StochasticScatterEngine.applyScatter(activeLayer.ctx, cfg);
    onPreviewUpdate();
  };

  const updateConfigAndPreview = (patch: Partial<StochasticScatterConfig>) => {
    const nextCfg = { ...getConfig(), ...patch };
    if (preview) {
      applyPreview(nextCfg);
    }
  };

  const handleRollSeed = () => {
    const newSeed = Math.floor(Math.random() * 999999);
    setRandomSeed(newSeed);
    updateConfigAndPreview({ randomSeed: newSeed });
  };

  const handleTogglePreview = () => {
    const nextPreview = !preview;
    setPreview(nextPreview);
    if (nextPreview) {
      applyPreview(getConfig());
    } else if (backupCanvasRef.current && activeLayer) {
      activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);
      onPreviewUpdate();
    }
  };

  const handleConfirm = () => {
    if (!activeLayer || !backupCanvasRef.current) return;

    const cfg = getConfig();
    activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);

    StochasticScatterEngine.applyScatter(activeLayer.ctx, cfg);
    backupCanvasRef.current = null;
    onApply(cfg);
    onClose();
  };

  const handleCancel = () => {
    if (backupCanvasRef.current && activeLayer) {
      activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);
      onPreviewUpdate();
      backupCanvasRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[490px] bg-[#3a3a3a] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#e5a038]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Stochastic Layer Scattering
            </span>
          </div>
          <button 
            onClick={handleCancel}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-3.5 text-xs text-[#ccc] overflow-y-auto flex-1">
          {/* Target Layer Info */}
          <div className="bg-[#2c2c2c] p-2 rounded border border-[#444] flex items-center justify-between">
            <span className="text-[11px] text-[#aaa]">Scattering onto:</span>
            <span className="text-[11px] font-semibold text-[#89b4fa] font-mono">
              {activeLayer?.name || 'Active Layer'}
            </span>
          </div>

          {/* Stamp Type & Blend Mode */}
          <div className="grid grid-cols-2 gap-3 bg-[#333] p-3 rounded border border-[#444]">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#aaa]">Stamp Pattern</label>
              <select
                value={stampType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setStampType(val);
                  updateConfigAndPreview({ stampType: val });
                }}
                className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset"
              >
                <option value="grunge">Grunge Particles</option>
                <option value="splat">Paint Splatter</option>
                <option value="scratch">Micro Scratches</option>
                <option value="dots">Stochastic Halftone Dots</option>
                <option value="cracks">Cracks &amp; Fractures</option>
                <option value="hex">Cyber Hex Grid</option>
                <option value="stars">Embossed Stars</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#aaa]">Blend Mode</label>
              <select
                value={blendMode}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setBlendMode(val);
                  updateConfigAndPreview({ blendMode: val });
                }}
                className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset font-mono"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="MULTIPLY">MULTIPLY</option>
                <option value="OVERLAY">OVERLAY</option>
                <option value="ADD">ADD (LIGHTER)</option>
              </select>
            </div>
          </div>

          {/* Repetition vs Stochastic Mode */}
          <div className="space-y-2 bg-[#333] p-3 rounded border border-[#444]">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-[#aaa]">Number of Repeats</label>
                <span className="text-[10px] text-[#888]">
                  {numberOfRepeats === 0 ? '0: Continuous Stochastic Mode (density driven)' : `${numberOfRepeats} Repeat-Aware Mode`}
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="250"
                value={numberOfRepeats}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setNumberOfRepeats(val);
                  updateConfigAndPreview({ numberOfRepeats: val });
                }}
                className="w-16 bg-[#222] border border-[#555] text-white px-1.5 py-0.5 rounded text-right font-mono text-[11px] cs5-inset"
              />
            </div>

            {numberOfRepeats === 0 && (
              <div className="pt-2 border-t border-[#444] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#aaa]">Stamp Density</span>
                  <span className="font-mono text-[#e5a038]">{stampDensity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={stampDensity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStampDensity(val);
                    updateConfigAndPreview({ stampDensity: val });
                  }}
                  className="w-full accent-[#e5a038] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Scattering & Contrast Controls */}
          <div className="space-y-2.5 bg-[#333] p-3 rounded border border-[#444]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#aaa]">Scatter Jitter Strength</span>
              <span className="text-[10px] font-mono text-[#3d7fb8]">{Math.round(scatterStrength * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={scatterStrength}
              onChange={(e) => {
                const val = Number(e.target.value);
                setScatterStrength(val);
                updateConfigAndPreview({ scatterStrength: val });
              }}
              className="w-full accent-[#3d7fb8] cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#aaa]">Edge Blend Contrast</span>
              <span className="text-[10px] font-mono text-[#3d7fb8]">{Math.round(edgeBlendContrast * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={edgeBlendContrast}
              onChange={(e) => {
                const val = Number(e.target.value);
                setEdgeBlendContrast(val);
                updateConfigAndPreview({ edgeBlendContrast: val });
              }}
              className="w-full accent-[#3d7fb8] cursor-pointer"
            />
          </div>

          {/* Rotation & Scale Ranges */}
          <div className="grid grid-cols-2 gap-3 bg-[#333] p-3 rounded border border-[#444]">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#aaa] block">Rotation Range (°)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={rotationMin}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRotationMin(val);
                    updateConfigAndPreview({ rotationMin: val });
                  }}
                  className="w-16 bg-[#222] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
                <span className="text-[#888]">to</span>
                <input
                  type="number"
                  value={rotationMax}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRotationMax(val);
                    updateConfigAndPreview({ rotationMax: val });
                  }}
                  className="w-16 bg-[#222] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#aaa] block">Scale Range</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={scaleMin}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setScaleMin(val);
                    updateConfigAndPreview({ scaleMin: val });
                  }}
                  className="w-16 bg-[#222] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
                <span className="text-[#888]">to</span>
                <input
                  type="number"
                  step="0.1"
                  value={scaleMax}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setScaleMax(val);
                    updateConfigAndPreview({ scaleMax: val });
                  }}
                  className="w-16 bg-[#222] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* Color & Seed */}
          <div className="flex items-center justify-between bg-[#333] p-3 rounded border border-[#444]">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-[#aaa]">Stamp Color:</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  updateConfigAndPreview({ primaryColor: e.target.value });
                }}
                className="w-7 h-7 rounded cursor-pointer border border-[#555] bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#aaa]">Seed:</span>
              <span className="text-[11px] font-mono text-[#89b4fa]">{randomSeed}</span>
              <button
                type="button"
                onClick={handleRollSeed}
                className="px-2 py-1 bg-[#444] hover:bg-[#555] text-white rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Roll new deterministic random seed"
              >
                <Shuffle className="w-3 h-3 text-[#e5a038]" />
                <span>Re-roll</span>
              </button>
            </div>
          </div>

          {/* Live Preview Toggle */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#bbb]">
              <input
                type="checkbox"
                checked={preview}
                onChange={handleTogglePreview}
                className="accent-[#3d7fb8] rounded"
              />
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#3d7fb8]" />
                Live Preview in Viewports &amp; Navigator
              </span>
            </label>
            <span className="text-[10px] text-[#777] font-mono">Deterministic PRNG</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-end gap-2 border-t border-[#444] shrink-0">
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] rounded border border-[#555] text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Scattering</span>
          </button>
        </div>
      </div>
    </div>
  );
};
