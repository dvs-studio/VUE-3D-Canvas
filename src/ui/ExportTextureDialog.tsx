/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - CorelDraw-Style Texture & Alpha Mask Export Dialog
 * Created by Victory Ukpong
 */

import React, { useState, useEffect, useRef } from 'react';
import { Layer } from '../core/types';
import { Download, Sliders, Check, X, Image as ImageIcon, Lock, Unlock } from 'lucide-react';

interface ExportTextureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  selectedLayerId: string;
  defaultMode?: 'merged' | 'alpha_mask';
  activeUVChannel?: string;
}

export const ExportTextureDialog: React.FC<ExportTextureDialogProps> = ({
  isOpen,
  onClose,
  layers,
  selectedLayerId,
  defaultMode = 'merged',
  activeUVChannel = 'uv_original',
}) => {
  const [exportMode, setExportMode] = useState<'merged' | 'alpha_mask'>(defaultMode);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [dpi, setDpi] = useState(300);
  const [targetScope, setTargetScope] = useState<'selected' | 'visible'>('selected');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || layers[0];

  useEffect(() => {
    setExportMode(defaultMode);
  }, [defaultMode, isOpen]);

  // Update preview canvas
  useEffect(() => {
    if (!isOpen) return;
    const cvs = previewCanvasRef.current;
    if (!cvs) return;
    cvs.width = 256;
    cvs.height = 256;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 256, 256);

    // Render composite or single layer to preview
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1024;
    tempCanvas.height = 1024;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    if (targetScope === 'selected' && selectedLayer) {
      tempCtx.drawImage(selectedLayer.canvas, 0, 0);
    } else {
      layers.forEach(layer => {
        if (!layer.visible) return;
        tempCtx.save();
        tempCtx.globalAlpha = layer.opacity / 100;
        tempCtx.drawImage(layer.canvas, 0, 0);
        tempCtx.restore();
      });
    }

    if (exportMode === 'alpha_mask') {
      // Convert to pure Alpha Mask (White on Black)
      const imgData = tempCtx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        data[i] = a;     // R
        data[i + 1] = a; // G
        data[i + 2] = a; // B
        data[i + 3] = 255;
      }
      tempCtx.putImageData(imgData, 0, 0);
    }

    ctx.drawImage(tempCanvas, 0, 0, 256, 256);
  }, [isOpen, exportMode, targetScope, selectedLayerId, layers]);

  if (!isOpen) return null;

  const handlePresetScale = (scaleFactor: number) => {
    const newDim = Math.round(1024 * scaleFactor);
    setWidth(newDim);
    setHeight(newDim);
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (maintainAspect) setHeight(val);
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (maintainAspect) setWidth(val);
  };

  const handleExecuteExport = () => {
    // Generate scaled canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Temporary full-res canvas
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = 1024;
    fullCanvas.height = 1024;
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) return;

    if (targetScope === 'selected' && selectedLayer) {
      fullCtx.drawImage(selectedLayer.canvas, 0, 0);
    } else {
      layers.forEach(layer => {
        if (!layer.visible) return;
        fullCtx.save();
        fullCtx.globalAlpha = layer.opacity / 100;
        fullCtx.drawImage(layer.canvas, 0, 0);
        fullCtx.restore();
      });
    }

    if (exportMode === 'alpha_mask') {
      // Pure Alpha Mask
      const imgData = fullCtx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        data[i] = a;
        data[i + 1] = a;
        data[i + 2] = a;
        data[i + 3] = 255;
      }
      fullCtx.putImageData(imgData, 0, 0);
    }

    // Scale to user's desired dimensions
    ctx.drawImage(fullCanvas, 0, 0, width, height);

    // Build filename with active UV channel midfix tag
    const layerCleanName = selectedLayer ? selectedLayer.name.replace(/\s+/g, '_') : 'Layer';
    const uvMidfix = activeUVChannel === 'uv_tightmap' 
      ? 'TightMap' 
      : (activeUVChannel === 'uv_original' ? 'OriginalUV' : activeUVChannel.replace(/^uv_/, ''));
    const filename = exportMode === 'alpha_mask'
      ? `${layerCleanName}_AlphaMask_${uvMidfix}_${width}x${height}.png`
      : `${layerCleanName}_Texture_${uvMidfix}_${width}x${height}.${format === 'image/jpeg' ? 'jpg' : 'png'}`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = exportCanvas.toDataURL(format, 0.95);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4">
      <div className="w-[620px] max-w-full bg-[#343434] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset text-xs text-[#c8c8c8]">
        {/* Header */}
        <div className="cs5-panel-header px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#3d7fb8]" />
            <span className="font-bold text-[#eee] uppercase tracking-wider text-[11px]">
              Export UV Texture &amp; Alpha Mask (CorelDraw Style)
            </span>
          </div>
          <button onClick={onClose} className="text-[#aaa] hover:text-white p-0.5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Split */}
        <div className="p-4 flex gap-4">
          {/* Left Preview on transparency grid */}
          <div className="w-64 flex flex-col items-center">
            <div 
              className="w-64 h-64 border-2 border-[#484848] rounded relative shadow-inner flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: 'repeating-conic-gradient(#222 0% 25%, #2a2a2a 0% 50%)',
                backgroundSize: '16px 16px',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-2 text-[10px] text-[#888] font-mono text-center">
              PREVIEW: {width} × {height} px · {exportMode === 'alpha_mask' ? 'Alpha Mask' : 'Transparent UV'}
            </div>
          </div>

          {/* Right Parameters (CorelDraw / Photoshop Style) */}
          <div className="flex-1 space-y-3">
            {/* Export Mode */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#aaa] font-mono uppercase">Export Type</label>
              <div className="grid grid-cols-2 gap-1 bg-[#282828] p-1 rounded border border-[#444]">
                <button
                  onClick={() => setExportMode('merged')}
                  className={`py-1 text-center rounded text-[11px] font-medium transition-colors ${
                    exportMode === 'merged'
                      ? 'bg-[#3d7fb8] text-white shadow-xs'
                      : 'text-[#aaa] hover:text-white'
                  }`}
                >
                  Merged UV (Transparent)
                </button>
                <button
                  onClick={() => setExportMode('alpha_mask')}
                  className={`py-1 text-center rounded text-[11px] font-medium transition-colors ${
                    exportMode === 'alpha_mask'
                      ? 'bg-[#3d7fb8] text-white shadow-xs'
                      : 'text-[#aaa] hover:text-white'
                  }`}
                >
                  UV Alpha Mask Only
                </button>
              </div>
            </div>

            {/* Target Layers */}
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#aaa]">Source Target</label>
              <select
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value as any)}
                className="bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-0.5 text-xs outline-none cs5-inset"
              >
                <option value="selected">Selected Layer ({selectedLayer?.name})</option>
                <option value="visible">Merged Visible Layers</option>
              </select>
            </div>

            {/* Scale Presets */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#aaa] font-mono uppercase">Resolution Presets</label>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1, 2, 4].map(scale => {
                  const px = 1024 * scale;
                  return (
                    <button
                      key={scale}
                      onClick={() => handlePresetScale(scale)}
                      className={`py-1 rounded text-[10px] font-mono border transition-colors ${
                        width === px
                          ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                          : 'bg-[#2a2a2a] text-[#bbb] border-[#444] hover:bg-[#383838]'
                      }`}
                    >
                      {px}px ({scale}x)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Width & Height Inputs */}
            <div className="bg-[#282828] p-2 rounded border border-[#444] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-[#888] font-mono">W:</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full bg-[#1e1e1e] border border-[#555] rounded px-1.5 py-0.5 text-xs text-[#eee] font-mono text-right outline-none cs5-inset"
                  />
                  <span className="text-[10px] text-[#888]">px</span>
                </div>

                <button
                  onClick={() => setMaintainAspect(!maintainAspect)}
                  className={`p-1 rounded border ${
                    maintainAspect ? 'text-[#3d7fb8] border-[#3d7fb8]' : 'text-[#666] border-[#444]'
                  }`}
                  title={maintainAspect ? 'Maintain Aspect Ratio: Locked' : 'Maintain Aspect Ratio: Unlocked'}
                >
                  {maintainAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>

                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-[#888] font-mono">H:</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full bg-[#1e1e1e] border border-[#555] rounded px-1.5 py-0.5 text-xs text-[#eee] font-mono text-right outline-none cs5-inset"
                  />
                  <span className="text-[10px] text-[#888]">px</span>
                </div>
              </div>

              {/* Format & DPI */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#383838]">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888]">Format:</span>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="bg-[#1e1e1e] border border-[#555] text-[#eee] rounded px-1 py-0.5 text-[10px] outline-none"
                  >
                    <option value="image/png">PNG (32-bit Transparent)</option>
                    <option value="image/jpeg">JPEG (24-bit White)</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888]">DPI:</span>
                  <span className="text-[10px] font-mono text-[#3d7fb8]">{dpi}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#282828] px-4 py-2.5 flex items-center justify-between border-t border-[#444]">
          <div className="text-[10px] text-[#888] font-mono">
            {exportMode === 'alpha_mask' ? 'Alpha Mask: B&W UV Layout' : 'Transparent Alpha Channel Preserved'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] rounded border border-[#555] text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteExport}
              className="px-3.5 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export &amp; Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
