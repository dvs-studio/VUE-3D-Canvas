/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Style Gaussian Blur Dialog
 * Created by Victory Ukpong
 */

import React, { useState, useEffect, useRef } from 'react';
import { Layer } from '../core/types';
import { GaussianBlurEngine, BlurQualityPreset, GaussianBlurOptions } from '../tools/gaussianBlur';
import { Sliders, Check, X, Eye, Sparkles } from 'lucide-react';

interface GaussianBlurDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: Layer | undefined;
  onApply: (options: GaussianBlurOptions) => void;
  onPreviewUpdate: () => void;
}

export const GaussianBlurDialog: React.FC<GaussianBlurDialogProps> = ({
  isOpen,
  onClose,
  activeLayer,
  onApply,
  onPreviewUpdate,
}) => {
  const [radius, setRadius] = useState<number>(5.0);
  const [quality, setQuality] = useState<BlurQualityPreset>('MEDIUM_15x15');
  const [preview, setPreview] = useState<boolean>(true);

  // Backup canvas preserving the original unblurred state until Apply
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // When dialog opens, create a backup snapshot of the selected layer
  useEffect(() => {
    if (!isOpen || !activeLayer) return;

    const b = document.createElement('canvas');
    b.width = activeLayer.canvas.width;
    b.height = activeLayer.canvas.height;
    const bctx = b.getContext('2d')!;
    bctx.drawImage(activeLayer.canvas, 0, 0);
    backupCanvasRef.current = b;

    if (preview) {
      applyPreview(radius, quality);
    }

    return () => {
      // If dialog closes without applying, restore original
      if (backupCanvasRef.current && activeLayer) {
        activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);
        onPreviewUpdate();
      }
      backupCanvasRef.current = null;
    };
  }, [isOpen, activeLayer]);

  const applyPreview = (r: number, q: BlurQualityPreset) => {
    if (!backupCanvasRef.current || !activeLayer) return;

    // Reset layer to original
    activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);

    // Apply blur if radius > 0
    if (r > 0.05) {
      GaussianBlurEngine.applyGaussianBlur(activeLayer.ctx, { radius: r, quality: q });
    }
    onPreviewUpdate();
  };

  const handleRadiusChange = (newRadius: number) => {
    const val = Math.max(0.1, Math.min(250.0, newRadius));
    setRadius(val);
    if (preview) {
      applyPreview(val, quality);
    }
  };

  const handleQualityChange = (newQuality: BlurQualityPreset) => {
    setQuality(newQuality);
    if (preview) {
      applyPreview(radius, newQuality);
    }
  };

  const handleTogglePreview = () => {
    const nextPreview = !preview;
    setPreview(nextPreview);
    if (nextPreview) {
      applyPreview(radius, quality);
    } else if (backupCanvasRef.current && activeLayer) {
      activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
      activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);
      onPreviewUpdate();
    }
  };

  const handleConfirm = () => {
    if (!activeLayer || !backupCanvasRef.current) return;

    // Reapply onto original cleanly and commit
    activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);

    if (radius > 0.05) {
      GaussianBlurEngine.applyGaussianBlur(activeLayer.ctx, { radius, quality });
    }

    backupCanvasRef.current = null; // Mark as committed so cleanup doesn't revert
    onApply({ radius, quality });
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
      <div className="w-[420px] bg-[#3a3a3a] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Gaussian Blur (Selected Layer)
            </span>
          </div>
          <button 
            onClick={handleCancel}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs text-[#ccc]">
          <div className="bg-[#2c2c2c] p-2.5 rounded border border-[#444] flex items-center justify-between">
            <span className="text-[11px] text-[#aaa]">Target Layer:</span>
            <span className="text-[11px] font-semibold text-[#89b4fa] font-mono">
              {activeLayer?.name || 'Active Layer'}
            </span>
          </div>

          {/* Radius Control */}
          <div className="space-y-2 bg-[#333] p-3 rounded border border-[#444]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-[#aaa]">Blur Radius</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0.1"
                  max="250.0"
                  step="0.5"
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="w-16 bg-[#222] border border-[#555] text-white px-1.5 py-0.5 rounded text-right font-mono text-[11px] cs5-inset"
                />
                <span className="text-[10px] text-[#888] font-mono">px</span>
              </div>
            </div>

            <input
              type="range"
              min="0.1"
              max="100.0"
              step="0.1"
              value={Math.min(100.0, radius)}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="w-full accent-[#3d7fb8] cursor-pointer"
            />

            <div className="flex justify-between text-[9px] text-[#777] font-mono px-0.5">
              <span>0.1 px</span>
              <span>25 px</span>
              <span>50 px</span>
              <span>100 px</span>
              <span>250 px (custom)</span>
            </div>
          </div>

          {/* Quality Presets */}
          <div className="space-y-1.5 bg-[#333] p-3 rounded border border-[#444]">
            <label className="text-[11px] font-medium text-[#aaa] block">Quality Convolution Preset</label>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {(['LOW_7x7', 'MEDIUM_15x15', 'HIGH_31x31'] as BlurQualityPreset[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQualityChange(q)}
                  className={`px-2 py-1.5 rounded text-[10px] font-mono border transition-colors cursor-pointer text-center ${
                    quality === q
                      ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
                      : 'bg-[#262626] text-[#aaa] border-[#444] hover:bg-[#303030] hover:text-white'
                  }`}
                >
                  {q.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-[#888] pt-1">
              {quality === 'LOW_7x7' && 'Fastest performance, 7x7 separable filter taps.'}
              {quality === 'MEDIUM_15x15' && 'Standard Photoshop balance, 15x15 separable filter taps.'}
              {quality === 'HIGH_31x31' && 'Studio ultra-smooth gradients, 31x31 full kernel depth.'}
            </p>
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
            <span className="text-[10px] text-[#777] font-mono">Separable 2-Pass</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-end gap-2 border-t border-[#444]">
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
            <span>Apply Blur</span>
          </button>
        </div>
      </div>
    </div>
  );
};
