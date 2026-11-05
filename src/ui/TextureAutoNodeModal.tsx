/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Import Texture & Auto-Node Setup Modal
 * Created by Victory Ukpong
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Sliders, 
  Layers, 
  Network, 
  Maximize2,
  Sparkles,
  Info,
  Box,
  Image as ImageIcon
} from 'lucide-react';
import { TextureFillConfig } from '../core/types';

export type TextureImportRole = 
  | 'texture_fill' 
  | 'color' 
  | 'height' 
  | 'emission' 
  | 'roughness' 
  | 'normal';

interface TextureAutoNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string;
  imageFileName: string;
  onApply: (result: {
    role: TextureImportRole;
    isTextureFill: boolean;
    fillConfig?: TextureFillConfig;
    createNodeSetup: boolean;
    layerName: string;
  }) => void;
}

export const TextureAutoNodeModal: React.FC<TextureAutoNodeModalProps> = ({
  isOpen,
  onClose,
  imageDataUrl,
  imageFileName,
  onApply,
}) => {
  const [role, setRole] = useState<TextureImportRole>('texture_fill');
  const [layerName, setLayerName] = useState(() => {
    return imageFileName.replace(/\.[^/.]+$/, '');
  });
  const [createNodeSetup, setCreateNodeSetup] = useState(true);

  // Material Texture Fill Config
  const [projection, setProjection] = useState<'triplanar' | 'box'>('triplanar');
  const [scale, setScale] = useState(1.0);
  const [repeat, setRepeat] = useState(2);
  const [rotation, setRotation] = useState(0);
  const [randomize, setRandomize] = useState(true);

  // Interactive Auto-Zoom Preview Viewport
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1.0);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Update layer name when imageFileName changes
  useEffect(() => {
    if (imageFileName) {
      setLayerName(imageFileName.replace(/\.[^/.]+$/, ''));
    }
  }, [imageFileName]);

  // Render Image onto Preview Canvas with Auto-Zoom
  useEffect(() => {
    if (!isOpen || !imageDataUrl) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = canvas.clientWidth || 360;
      canvas.height = canvas.clientHeight || 300;

      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle checkerboard background
      const checkSize = 12;
      for (let y = 0; y < canvas.height; y += checkSize) {
        for (let x = 0; x < canvas.width; x += checkSize) {
          if (((x / checkSize) + (y / checkSize)) % 2 === 0) {
            ctx.fillStyle = '#262626';
            ctx.fillRect(x, y, checkSize, checkSize);
          }
        }
      }

      // Auto-fit and center image
      const aspectImg = img.width / img.height;
      const aspectCanvas = canvas.width / canvas.height;
      let drawW: number;
      let drawH: number;

      if (aspectImg > aspectCanvas) {
        drawW = canvas.width * 0.85 * previewZoom;
        drawH = drawW / aspectImg;
      } else {
        drawH = canvas.height * 0.85 * previewZoom;
        drawW = drawH * aspectImg;
      }

      const drawX = (canvas.width - drawW) / 2 + previewPan.x;
      const drawY = (canvas.height - drawH) / 2 + previewPan.y;

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    };
    img.src = imageDataUrl;
  }, [isOpen, imageDataUrl, previewZoom, previewPan]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - previewPan.x, y: e.clientY - previewPan.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPreviewPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleResetPreview = () => {
    setPreviewZoom(1.0);
    setPreviewPan({ x: 0, y: 0 });
  };

  const handleConfirmApply = () => {
    const isTextureFill = role === 'texture_fill';
    let fillConfig: TextureFillConfig | undefined;

    if (isTextureFill) {
      fillConfig = {
        dataUrl: imageDataUrl,
        name: imageFileName,
        scale,
        repeat,
        rotation,
        randomize,
        projection,
      };
    }

    onApply({
      role,
      isTextureFill,
      fillConfig,
      createNodeSetup,
      layerName: layerName.trim() || 'Imported Texture',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs select-none p-4">
      <div className="w-[740px] max-w-full bg-[#333333] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset text-xs text-[#c8c8c8] flex flex-col">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between border-b border-[#444]">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#3d7fb8]" />
            <span className="font-bold text-[#eee] uppercase tracking-wider text-[11px]">
              Import Texture &amp; Auto-Node Setup Confirmation
            </span>
          </div>
          <button onClick={onClose} className="text-[#aaa] hover:text-white p-0.5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Split View (Interactive Preview on Left, Config on Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Left: Auto-Zoomed Interactive Texture Preview */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#aaa]">
              <span className="font-medium flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-[#3d7fb8]" />
                Auto-Zoom Focus Preview
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewZoom(z => Math.max(0.2, z - 0.25))}
                  className="p-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ccc] rounded border border-[#444]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] w-10 text-center">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  onClick={() => setPreviewZoom(z => Math.min(5.0, z + 0.25))}
                  className="p-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ccc] rounded border border-[#444]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  onClick={handleResetPreview}
                  className="p-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#aaa] hover:text-white rounded border border-[#444] text-[10px]"
                  title="Reset Preview Zoom & Pan"
                >
                  Reset
                </button>
              </div>
            </div>

            <div 
              className="relative w-full h-64 bg-[#1e1e1e] border border-[#555] rounded overflow-hidden cs5-inset cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full block"
              />
              <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-[#888] bg-[#141414]/80 px-1.5 py-0.5 rounded border border-[#333]">
                Drag to pan · File: {imageFileName}
              </div>
            </div>

            {/* Target Layer Name Input */}
            <div className="space-y-1 pt-1">
              <label className="text-[10px] text-[#aaa] font-medium uppercase font-mono">Layer Name</label>
              <input
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2.5 py-1 text-xs outline-none focus:border-[#3d7fb8] cs5-inset"
                placeholder="Texture Layer Name"
              />
            </div>
          </div>

          {/* Right: Channel Role & Node Setup Configuration */}
          <div className="flex flex-col space-y-3">
            {/* Target Role Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#aaa] font-medium uppercase font-mono flex items-center justify-between">
                <span>Material Target Channel</span>
                <span className="text-[#3d7fb8] font-mono font-bold">NODE INTEGRATED</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as TextureImportRole)}
                className="w-full bg-[#242424] border border-[#555] text-white rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#3d7fb8] cs5-inset font-medium cursor-pointer"
              >
                <option value="texture_fill">★ Material Texture Fill (Triplanar / Box Projection)</option>
                <option value="color">Colour (Albedo / Diffuse BSDF)</option>
                <option value="height">Displacement (Height / Bump Map)</option>
                <option value="emission">Emission (Surface Glow Shader)</option>
                <option value="roughness">Reflection Mask (Metallic / Roughness)</option>
                <option value="normal">Normal Map (RGB Tangent Seam)</option>
              </select>
            </div>

            {/* Mode 1: Material Texture Fill Settings */}
            {role === 'texture_fill' && (
              <div className="bg-[#2a2a2a] p-2.5 rounded border border-[#444] space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                  <span className="flex items-center gap-1">
                    <Box className="w-3.5 h-3.5" />
                    Texture Fill Material Parameters
                  </span>
                  <span className="text-[9px] font-mono text-[#888]">Procedural Layer</span>
                </div>

                {/* Projection Selector */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setProjection('triplanar')}
                    className={`py-1 text-[10px] font-semibold rounded border transition-colors ${
                      projection === 'triplanar'
                        ? 'bg-[#3d7fb8] border-[#3d7fb8] text-white'
                        : 'bg-[#333] border-[#555] text-[#ccc] hover:bg-[#3c3c3c]'
                    }`}
                  >
                    Triplanar (XYZ Blend)
                  </button>
                  <button
                    onClick={() => setProjection('box')}
                    className={`py-1 text-[10px] font-semibold rounded border transition-colors ${
                      projection === 'box'
                        ? 'bg-[#3d7fb8] border-[#3d7fb8] text-white'
                        : 'bg-[#333] border-[#555] text-[#ccc] hover:bg-[#3c3c3c]'
                    }`}
                  >
                    Box Mapping
                  </button>
                </div>

                {/* Scale Slider + Numeric Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Scale:</span>
                    <input
                      type="number"
                      min="0.1"
                      max="10.0"
                      step="0.1"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value) || 1.0)}
                      className="w-14 bg-[#1f1f1f] border border-[#555] text-white px-1 py-0.5 rounded text-right font-mono text-[10px]"
                    />
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
                  />
                </div>

                {/* Repeat Slider + Numeric Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Repeat UV Tiles:</span>
                    <input
                      type="number"
                      min="1"
                      max="16"
                      step="1"
                      value={repeat}
                      onChange={(e) => setRepeat(parseInt(e.target.value, 10) || 1)}
                      className="w-14 bg-[#1f1f1f] border border-[#555] text-white px-1 py-0.5 rounded text-right font-mono text-[10px]"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={repeat}
                    onChange={(e) => setRepeat(parseInt(e.target.value, 10))}
                    className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
                  />
                </div>

                {/* Rotation Slider + Numeric Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#aaa]">Rotation Angle:</span>
                    <span className="font-mono text-amber-300">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 h-1.5 cursor-pointer"
                  />
                </div>

                {/* Randomize toggle */}
                <label className="flex items-center gap-2 text-[11px] text-[#eee] cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={randomize}
                    onChange={(e) => setRandomize(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>Stochastic Randomization (Hide seams &amp; repetitions)</span>
                </label>

                {/* Architectural Mutual Exclusivity Notice */}
                <div className="p-2 bg-[#222] border border-amber-900/60 rounded text-[10px] text-amber-200/90 leading-snug flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Material Texture Fill:</strong> Once loaded, this layer renders procedurally. To convert into Bump, Normal, or Clip Mask, click <strong>"Bake to Layer"</strong> in the Layers panel to rasterize the projection first.
                  </span>
                </div>
              </div>
            )}

            {/* Mode 2: Standard PBR Channels */}
            {role !== 'texture_fill' && (
              <div className="bg-[#2a2a2a] p-2.5 rounded border border-[#444] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#89b4fa]">
                  <span className="flex items-center gap-1">
                    <Network className="w-3.5 h-3.5" />
                    Blender Node Setup Circuit
                  </span>
                  <span className="text-[9px] font-mono text-[#a6e3a1]">Auto-Configured</span>
                </div>

                <label className="flex items-start gap-2 cursor-pointer bg-[#323232] p-2 rounded border border-[#404040]">
                  <input
                    type="checkbox"
                    checked={createNodeSetup}
                    onChange={(e) => setCreateNodeSetup(e.target.checked)}
                    className="mt-0.5 accent-[#3d7fb8]"
                  />
                  <div className="text-[11px]">
                    <strong className="text-white block">Auto-wire into Node Editor Graph</strong>
                    <span className="text-[#999] text-[10px] leading-snug block mt-0.5">
                      {role === 'color' && 'Wires texture to Principled BSDF [Base Color] socket.'}
                      {role === 'height' && 'Creates Bump Node (Normal = Bump(Height)), wired to BSDF [Normal].'}
                      {role === 'emission' && 'Creates ShaderNodeEmission, wired to Material Output [Surface].'}
                      {role === 'roughness' && 'Wires texture map to Principled BSDF [Roughness] & [Metallic] sockets.'}
                      {role === 'normal' && 'Creates Normal Map node, wired to Principled BSDF [Normal] socket.'}
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#2a2a2a] px-4 py-2.5 flex items-center justify-end gap-2 border-t border-[#444]">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-white rounded border border-[#555] text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmApply}
            className="px-4 py-1 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white font-bold rounded border border-[#5497d5] text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Apply &amp; Set Up Layer
          </button>
        </div>
      </div>
    </div>
  );
};
