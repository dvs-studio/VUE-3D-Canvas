/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Pattern Stamp Configuration Dialog
 * Created by Victory Ukpong
 */

import React, { useState, useEffect, useRef } from 'react';
import { PatternStampConfig, BlendMode } from '../core/types';
import { PatternStampEngine } from '../tools/patternStampTool';
import { 
  Stamp, X, Check, Upload, Sliders, Sparkles, RefreshCw, 
  Layers, ShieldAlert, Eye, Move
} from 'lucide-react';

interface PatternStampDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: PatternStampConfig;
  onChangeConfig: (newConfig: PatternStampConfig) => void;
  onStampAtCenter?: () => void;
}

export const PatternStampDialog: React.FC<PatternStampDialogProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onStampAtCenter,
}) => {
  const [activeTab, setActiveTab] = useState<'decal' | 'imperfections' | 'grunge'>('decal');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update preview whenever config changes
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background checkerboard
    const s = 10;
    for (let y = 0; y < canvas.height; y += s) {
      for (let x = 0; x < canvas.width; x += s) {
        ctx.fillStyle = ((x / s + y / s) % 2 === 0) ? '#282828' : '#333333';
        ctx.fillRect(x, y, s, s);
      }
    }

    const stamp = PatternStampEngine.generateStampCanvas(config, canvas.width);
    ctx.drawImage(stamp, 0, 0);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const update = (patch: Partial<PatternStampConfig>) => {
    onChangeConfig({ ...config, ...patch });
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        update({
          stampDataUrl: dataUrl,
          stampName: file.name.replace(/\.[^/.]+$/, ''),
          stampId: 'custom_' + Date.now()
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomUpload}
        className="hidden"
      />

      <div className="w-[560px] bg-[#2d2d2d] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0 bg-[#252525] border-b border-[#404040]">
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-[#e5a038]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Pattern Stamp Tool &bull; Decal Configuration
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Preview & Core Controls Banner */}
        <div className="p-3 bg-[#222] border-b border-[#3e3e3e] flex items-center gap-4">
          <div className="w-24 h-24 rounded border border-[#555] overflow-hidden shrink-0 shadow-md relative bg-[#1c1c1c]">
            <canvas ref={previewCanvasRef} width={96} height={96} className="w-full h-full block" />
            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-mono text-center text-[#aaa] py-0.5">
              PREVIEW
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs truncate">{config.stampName}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 bg-[#3a3a3a] hover:bg-[#484848] text-white rounded text-[10px] font-medium flex items-center gap-1 border border-[#555]"
              >
                <Upload className="w-3 h-3 text-[#e5a038]" />
                <span>Upload Custom Image</span>
              </button>
            </div>

            {/* Size Slider */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#aaa]">Stamp Radius:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="16"
                  max="384"
                  step="4"
                  value={config.size}
                  onChange={(e) => update({ size: Number(e.target.value) })}
                  className="w-28 accent-[#e5a038]"
                />
                <span className="font-mono text-[#eee] w-8 text-right">{config.size}px</span>
              </div>
            </div>

            {/* Rotation Slider */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#aaa]">Angle Rotation:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={config.rotation}
                  onChange={(e) => update({ rotation: Number(e.target.value) })}
                  className="w-28 accent-[#e5a038]"
                />
                <span className="font-mono text-[#eee] w-8 text-right">{config.rotation}&deg;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3e3e3e] bg-[#222] px-2 pt-1 gap-1 shrink-0 text-[11px]">
          <button
            onClick={() => setActiveTab('decal')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'decal'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Stamp className="w-3.5 h-3.5 text-[#e5a038]" />
            <span>Decal Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('imperfections')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'imperfections'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#f38ba8]" />
            <span>Sharpness &amp; Imperfections</span>
          </button>

          <button
            onClick={() => setActiveTab('grunge')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'grunge'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fab387]" />
            <span>Grunge Overlay</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-[#ccc]">
          {/* TAB 1: PRESETS */}
          {activeTab === 'decal' && (
            <div className="space-y-3">
              <span className="text-[11px] text-[#aaa] font-medium block">Select Built-In Decal:</span>
              <div className="grid grid-cols-3 gap-2">
                {PatternStampEngine.BUILTIN_STAMPS.map((stamp) => (
                  <button
                    key={stamp.id}
                    type="button"
                    onClick={() => update({ stampId: stamp.id, stampName: stamp.name, stampDataUrl: '' })}
                    className={`p-2.5 rounded border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                      config.stampId === stamp.id && !config.stampDataUrl
                        ? 'bg-[#e5a038]/20 border-[#e5a038] text-white font-bold'
                        : 'bg-[#222] border-[#404040] text-[#aaa] hover:bg-[#2c2c2c] hover:text-white'
                    }`}
                  >
                    <span className="text-xs">{stamp.name}</span>
                    <span className="text-[9px] text-[#777] font-mono">{stamp.category}</span>
                  </button>
                ))}
              </div>

              {/* Opacity slider */}
              <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded space-y-1 mt-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#ccc]">Stamp Opacity</span>
                  <span className="font-mono text-white">{config.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={config.opacity}
                  onChange={(e) => update({ opacity: Number(e.target.value) })}
                  className="w-full accent-[#e5a038]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: IMPERFECTIONS */}
          {activeTab === 'imperfections' && (
            <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-3.5">
              <h4 className="font-semibold text-white text-[12px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#f38ba8]" />
                <span>Edge Wear &amp; Damage Masks</span>
              </h4>
              <p className="text-[11px] text-[#888]">
                Prevent overly clean stamps. Artificially tear, chip, and peel borders to replicate weathered field decals.
              </p>

              {/* Sharpness */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#aaa]">Edge Sharpness</span>
                  <span className="font-mono text-white text-[11px]">{config.sharpness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.sharpness}
                  onChange={(e) => update({ sharpness: parseFloat(e.target.value) })}
                  className="w-full accent-[#3d7fb8]"
                />
              </div>

              {/* Missing Edge / Torn Fragment Mask */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#aaa]">Missing Edge (Torn / Chipped Decal Mask)</span>
                  <span className="font-mono text-white text-[11px]">{(config.missingEdgeAmount * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={config.missingEdgeAmount}
                  onChange={(e) => update({ missingEdgeAmount: parseFloat(e.target.value) })}
                  className="w-full accent-[#f38ba8]"
                />
                <p className="text-[10px] text-[#777]">Eats away outer fragments of the sticker with organic noise.</p>
              </div>

              {/* Edge Jitter */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#aaa]">Edge Jitter &amp; Fraying</span>
                  <span className="font-mono text-white text-[11px]">{(config.edgeJitter * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={config.edgeJitter}
                  onChange={(e) => update({ edgeJitter: parseFloat(e.target.value) })}
                  className="w-full accent-[#fab387]"
                />
              </div>
            </div>
          )}

          {/* TAB 3: GRUNGE OVERLAY */}
          {activeTab === 'grunge' && (
            <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableGrungeOverlay}
                    onChange={(e) => update({ enableGrungeOverlay: e.target.checked })}
                    className="rounded bg-[#1a1a1a] border-[#444] text-[#fab387] focus:ring-0"
                  />
                  <span className="font-semibold text-white">Enable Grunge Overlay</span>
                </label>
              </div>

              <div className={`space-y-3 ${!config.enableGrungeOverlay ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-3">
                  {/* Preset */}
                  <div>
                    <span className="text-[10px] text-[#aaa] block mb-1">Grunge Pattern:</span>
                    <select
                      value={config.grungePreset}
                      onChange={(e) => update({ grungePreset: e.target.value as any })}
                      className="w-full bg-[#1c1c1c] border border-[#444] rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="scratched">Scratched Metal</option>
                      <option value="dirty_spots">Grease &amp; Dirty Spots</option>
                      <option value="cracked_paint">Cracked Peeling Paint</option>
                      <option value="worn_patina">Worn Weathered Patina</option>
                    </select>
                  </div>

                  {/* Blend Mode */}
                  <div>
                    <span className="text-[10px] text-[#aaa] block mb-1">Blend Mode:</span>
                    <select
                      value={config.grungeBlendMode}
                      onChange={(e) => update({ grungeBlendMode: e.target.value as any })}
                      className="w-full bg-[#1c1c1c] border border-[#444] rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="multiply">Multiply (Darken)</option>
                      <option value="overlay">Overlay (Balanced)</option>
                      <option value="hard_light">Hard Light</option>
                      <option value="screen">Screen (Lighten)</option>
                    </select>
                  </div>
                </div>

                {/* Grunge Opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Grunge Overlay Opacity</span>
                    <span className="font-mono text-white text-[11px]">{config.grungeOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={config.grungeOpacity}
                    onChange={(e) => update({ grungeOpacity: Number(e.target.value) })}
                    className="w-full accent-[#fab387]"
                  />
                </div>

                {/* Grunge Scale */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Grunge Grain Scale</span>
                    <span className="font-mono text-white text-[11px]">{config.grungeScale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={config.grungeScale}
                    onChange={(e) => update({ grungeScale: parseFloat(e.target.value) })}
                    className="w-full accent-[#fab387]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#222] border-t border-[#3e3e3e] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#888]">
            Click anywhere on 3D model surface to stamp decal
          </div>

          <div className="flex gap-2">
            {onStampAtCenter && (
              <button
                type="button"
                onClick={onStampAtCenter}
                className="px-3 py-1.5 bg-[#444] hover:bg-[#555] text-white rounded text-xs font-medium cursor-pointer transition-colors"
                title="Stamp directly at current center view"
              >
                Stamp Center
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#e5a038] hover:bg-[#f39c12] text-black font-bold rounded text-xs cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done (Ready to Stamp)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
