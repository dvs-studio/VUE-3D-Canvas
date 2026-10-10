/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Triplanar Box Mapping Confirmation Dialog
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { TriplanarConfig } from '../tools/fillSuite';
import { Box, Layers, AlertCircle, Check, X } from 'lucide-react';

interface TriplanarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: TriplanarConfig) => void;
  defaultColor: string;
}

export const TriplanarDialog: React.FC<TriplanarDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultColor,
}) => {
  const [pattern, setPattern] = useState<TriplanarConfig['pattern']>('checker');
  const [scale, setScale] = useState(12);
  const [blendSharpness, setBlendSharpness] = useState(2.0);
  const [primaryColor, setPrimaryColor] = useState(defaultColor || '#e6e6e6');
  const [secondaryColor, setSecondaryColor] = useState('#2a2a2a');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      pattern,
      scale,
      blendSharpness,
      primaryColor,
      secondaryColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[460px] bg-[#3a3a3a] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Triplanar Box Mapping Fill
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 text-xs text-[#ccc]">
          <div className="flex items-start gap-2.5 bg-[#2d2d2d] p-2.5 rounded border border-[#484848]">
            <AlertCircle className="w-4 h-4 text-[#e5a038] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#bbb] leading-relaxed">
              This operation will project seamless procedural texture across all three XYZ bounding planes of the active 3D model, blending edge intersections according to normal sharpness.
            </p>
          </div>

          <div className="space-y-3 bg-[#333] p-3 rounded border border-[#444]">
            {/* Pattern Type */}
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-[#aaa]">Projection Pattern</label>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value as any)}
                className="bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset"
              >
                <option value="checker">Checker Grid</option>
                <option value="grid">Tech Grid Lines</option>
                <option value="carbon_fiber">Carbon Fiber Weave</option>
                <option value="noise">Procedural Perlin Noise</option>
              </select>
            </div>

            {/* Scale */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-[#aaa]">Pattern Scale</label>
                <span className="text-[10px] text-[#888] font-mono">{scale}x</span>
              </div>
              <input
                type="range"
                min="4"
                max="36"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-48 accent-[#3d7fb8]"
              />
            </div>

            {/* Blend Sharpness */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-[#aaa]">Triplanar Sharpness</label>
                <span className="text-[10px] text-[#888] font-mono">{blendSharpness.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={blendSharpness}
                onChange={(e) => setBlendSharpness(Number(e.target.value))}
                className="w-48 accent-[#3d7fb8]"
              />
            </div>

            {/* Color Pair */}
            <div className="flex items-center justify-between pt-1 border-t border-[#404040]">
              <label className="text-[11px] font-medium text-[#aaa]">Color Balance</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888]">Pri:</span>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888]">Sec:</span>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-end gap-2 border-t border-[#444]">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] rounded border border-[#555] text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-3.5 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Project Across 3D Bounds
          </button>
        </div>
      </div>
    </div>
  );
};
