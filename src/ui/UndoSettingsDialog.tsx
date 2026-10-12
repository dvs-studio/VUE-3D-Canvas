/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Undo & Redo History Settings Dialog
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { UndoRingBuffer } from '../core/history';
import { History, Check, X, HardDrive, AlertCircle } from 'lucide-react';

interface UndoSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  undoBuffer: UndoRingBuffer;
  layerCount: number;
}

export const UndoSettingsDialog: React.FC<UndoSettingsDialogProps> = ({
  isOpen,
  onClose,
  undoBuffer,
  layerCount,
}) => {
  const [maxStates, setMaxStates] = useState<number>(() => undoBuffer.getMaxStates());

  if (!isOpen) return null;

  // Each 1024x1024 RGBA layer buffer uses ~4MB
  const estimatedMbPerState = (layerCount * 1024 * 1024 * 4) / (1024 * 1024);
  const totalEstimatedMb = (maxStates * estimatedMbPerState).toFixed(1);

  const handleApply = () => {
    undoBuffer.setMaxStates(maxStates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[440px] bg-[#3a3a3a] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Undo &amp; Redo History Preferences
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs text-[#ccc]">
          <div className="flex items-start gap-2.5 bg-[#2d2d2d] p-2.5 rounded border border-[#484848]">
            <AlertCircle className="w-4 h-4 text-[#89b4fa] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#bbb] leading-relaxed">
              Configure maximum in-memory undo/redo history capacity. Note: .xblend file saves will embed the most recent 3 states to preserve strict low-memory portability specs.
            </p>
          </div>

          {/* Slider and number input */}
          <div className="space-y-2.5 bg-[#333] p-3 rounded border border-[#444]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-[#aaa]">Max Runtime Undo States</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="3"
                  max="120"
                  value={maxStates}
                  onChange={(e) => setMaxStates(Math.max(3, Math.min(120, Number(e.target.value))))}
                  className="w-16 bg-[#222] border border-[#555] text-white px-2 py-0.5 rounded text-right font-mono text-[11px] cs5-inset"
                />
                <span className="text-[10px] text-[#888] font-mono">states</span>
              </div>
            </div>

            <input
              type="range"
              min="3"
              max="100"
              value={maxStates}
              onChange={(e) => setMaxStates(Number(e.target.value))}
              className="w-full accent-[#3d7fb8] cursor-pointer"
            />

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[3, 15, 30, 60].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMaxStates(preset)}
                  className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer text-center ${
                    maxStates === preset
                      ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                      : 'bg-[#282828] text-[#aaa] border-[#444] hover:text-white'
                  }`}
                >
                  {preset} States
                </button>
              ))}
            </div>
          </div>

          {/* Memory estimate indicator */}
          <div className="bg-[#2a2a2a] p-2.5 rounded border border-[#444] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#a6e3a1]" />
              <span className="text-[11px] text-[#aaa]">Estimated Buffer RAM:</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#a6e3a1]">
              ~{totalEstimatedMb} MB ({layerCount} layers active)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-end gap-2 border-t border-[#444]">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] rounded border border-[#555] text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
