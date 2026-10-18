/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Edge Wear & Ambient Occlusion Filter Dialog
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { Layer, EdgeWearConfig, BlendMode } from '../core/types';
import { EdgeWearEngine } from '../tools/edgeWearFilter';
import { Mountain, Sliders, Check, X, Sparkles, Shield, Droplets } from 'lucide-react';

interface EdgeWearDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: Layer | undefined;
  onApply: (config: EdgeWearConfig) => void;
  onPreviewUpdate?: () => void;
}

export const EdgeWearDialog: React.FC<EdgeWearDialogProps> = ({
  isOpen,
  onClose,
  activeLayer,
  onApply,
  onPreviewUpdate,
}) => {
  const [wearAmount, setWearAmount] = useState<number>(0.5);
  const [contrast, setContrast] = useState<number>(1.5);
  const [edgeNoise, setEdgeNoise] = useState<number>(0.35);
  const [cavityDarkening, setCavityDarkening] = useState<number>(0.6);
  const [curvatureRadius, setCurvatureRadius] = useState<number>(2);
  const [wearColor, setWearColor] = useState<string>('#c0c0c0');
  const [blendMode, setBlendMode] = useState<BlendMode>('normal');
  const [applyToRidges, setApplyToRidges] = useState<boolean>(true);
  const [applyToCavity, setApplyToCavity] = useState<boolean>(true);

  if (!isOpen || !activeLayer) return null;

  const handleConfirm = () => {
    const config: EdgeWearConfig = {
      wearAmount,
      contrast,
      edgeNoise,
      cavityDarkening,
      curvatureRadius,
      wearColor,
      blendMode,
      applyToRidges,
      applyToCavity,
    };

    EdgeWearEngine.applyEdgeWear(activeLayer, config);
    onApply(config);
    if (onPreviewUpdate) onPreviewUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs select-none">
      <div className="w-[500px] bg-[#2d2d2d] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[90vh] flex flex-col font-sans">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0 bg-[#252525] border-b border-[#404040]">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-[#a6e3a1]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Edge Wear &amp; Cavity Ambient Occlusion Filter
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-[#ccc]">
          <div className="p-2.5 bg-[#222] border border-[#3e3e3e] rounded text-[11px] text-[#aaa]">
            Target Layer: <strong className="text-white">{activeLayer.name}</strong>
            <p className="mt-1 text-[10px] text-[#777]">
              Procedurally weathers sharp polygon ridges (peeling paint, exposed primer/metal) and darkens inner crevices with ambient occlusion dirt.
            </p>
          </div>

          {/* Sliders */}
          <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-3.5">
            {/* Wear Amount */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#aaa]">Edge Wear Amount (Peeling Severity)</span>
                <span className="font-mono text-white text-[11px]">{(wearAmount * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={wearAmount}
                onChange={(e) => setWearAmount(parseFloat(e.target.value))}
                className="w-full accent-[#a6e3a1]"
              />
            </div>

            {/* Cavity Ambient Occlusion Darkening */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#aaa]">Cavity Ambient Occlusion (Crevice Dirt)</span>
                <span className="font-mono text-white text-[11px]">{(cavityDarkening * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={cavityDarkening}
                onChange={(e) => setCavityDarkening(parseFloat(e.target.value))}
                className="w-full accent-[#fab387]"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#aaa]">Curvature Gradient Contrast</span>
                <span className="font-mono text-white text-[11px]">{contrast.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                className="w-full accent-[#3d7fb8]"
              />
            </div>

            {/* Edge Noise / Jitter */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#aaa]">Chipping Jitter (Micro-Noise Roughness)</span>
                <span className="font-mono text-white text-[11px]">{(edgeNoise * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={edgeNoise}
                onChange={(e) => setEdgeNoise(parseFloat(e.target.value))}
                className="w-full accent-[#f38ba8]"
              />
            </div>

            {/* Curvature Radius & Wear Color */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333]">
              <div>
                <span className="text-[10px] text-[#aaa] block mb-1">Analysis Radius:</span>
                <select
                  value={curvatureRadius}
                  onChange={(e) => setCurvatureRadius(parseInt(e.target.value))}
                  className="w-full bg-[#1c1c1c] border border-[#444] rounded px-2 py-1 text-xs text-white"
                >
                  <option value={1}>1px (Micro Razor Edge)</option>
                  <option value={2}>2px (Standard Edge)</option>
                  <option value={4}>4px (Broad Bevel)</option>
                  <option value={6}>6px (Heavy Weathered)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-[#aaa] block mb-1">Exposed Wear Color:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={wearColor}
                    onChange={(e) => setWearColor(e.target.value)}
                    className="w-8 h-6 bg-transparent border-0 cursor-pointer rounded"
                  />
                  <span className="font-mono text-[11px] text-white">{wearColor}</span>
                </div>
              </div>
            </div>

            {/* Toggle checkboxes */}
            <div className="flex items-center justify-between pt-2 border-t border-[#333] text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToRidges}
                  onChange={(e) => setApplyToRidges(e.target.checked)}
                  className="rounded bg-[#1c1c1c] border-[#444] text-[#a6e3a1]"
                />
                <span className="text-[#eee]">Apply to Ridge Edges</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToCavity}
                  onChange={(e) => setApplyToCavity(e.target.checked)}
                  className="rounded bg-[#1c1c1c] border-[#444] text-[#fab387]"
                />
                <span className="text-[#eee]">Apply to Cavity Crevices</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#222] border-t border-[#3e3e3e] flex items-center justify-between shrink-0">
          <div className="text-[10px] text-[#777]">
            Non-destructive: commits state to Undo History
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#333] hover:bg-[#404040] text-[#ccc] rounded text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white font-bold rounded text-xs cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Edge Wear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
