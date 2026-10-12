/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Jenny Stitch Studio Dialog
 * Created by Victory Ukpong
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Layer } from '../core/types';
import { StitchStudioEngine, StitchConfig } from '../tools/stitchStudio';
import { BUILTIN_MODELS, parseOBJ } from '../renderer/modelGeometry';
import { Scissors, Check, X, Eye, Sparkles } from 'lucide-react';

interface StitchStudioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: Layer | undefined;
  modelKey: string;
  customOBJText?: string;
  onApply: (config: StitchConfig) => void;
  onPreviewUpdate: () => void;
}

export const StitchStudioDialog: React.FC<StitchStudioDialogProps> = ({
  isOpen,
  onClose,
  activeLayer,
  modelKey,
  customOBJText,
  onApply,
  onPreviewUpdate,
}) => {
  const [seamPathPreset, setSeamPathPreset] = useState<StitchConfig['seamPathPreset']>('seam_loop');
  const [stitchSpacing, setStitchSpacing] = useState<number>(24);
  const [stitchRotationOffset, setStitchRotationOffset] = useState<number>(0);
  const [displacementDepth, setDisplacementDepth] = useState<number>(0.65);
  const [stitchWidth, setStitchWidth] = useState<number>(4);
  const [stitchScale, setStitchScale] = useState<number>(1.2);
  const [stitchDensity, setStitchDensity] = useState<number>(1.0);
  const [pathSmoothing, setPathSmoothing] = useState<number>(2);
  const [stitchStyle, setStitchStyle] = useState<StitchConfig['stitchStyle']>('single_thread');
  const [threadColor, setThreadColor] = useState<string>('#e6d5b8'); // Natural leather thread ecru
  const [shadowColor, setShadowColor] = useState<string>('#1a1a1a');
  const [preview, setPreview] = useState<boolean>(true);

  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const getGeometry = (): THREE.BufferGeometry => {
    if (customOBJText) return parseOBJ(customOBJText);
    if (BUILTIN_MODELS[modelKey]) return BUILTIN_MODELS[modelKey]().geometry;
    return BUILTIN_MODELS.suzanne().geometry;
  };

  const getConfig = (): StitchConfig => ({
    stitchSpacing,
    stitchRotationOffset,
    displacementDepth,
    stitchWidth,
    stitchScale,
    stitchDensity,
    pathSmoothing,
    stitchStyle,
    threadColor,
    shadowColor,
    seamPathPreset,
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

  const applyPreview = (cfg: StitchConfig) => {
    if (!backupCanvasRef.current || !activeLayer) return;

    activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);

    const geom = getGeometry();
    StitchStudioEngine.renderStitches(activeLayer.ctx, geom, cfg);
    onPreviewUpdate();
  };

  const updateConfigAndPreview = (patch: Partial<StitchConfig>) => {
    const nextCfg = { ...getConfig(), ...patch };
    if (preview) {
      applyPreview(nextCfg);
    }
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

    const geom = getGeometry();
    StitchStudioEngine.renderStitches(activeLayer.ctx, geom, cfg);

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
      <div className="w-[500px] bg-[#3a3a3a] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#a6e3a1]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Jenny Stitch Studio
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
        <div className="p-4 space-y-3.5 text-xs text-[#ccc] overflow-y-auto flex-1">
          {/* Target Layer & Model Info */}
          <div className="bg-[#2c2c2c] p-2 rounded border border-[#444] flex items-center justify-between">
            <span className="text-[11px] text-[#aaa]">Target Mesh &amp; Layer:</span>
            <span className="text-[11px] font-semibold text-[#a6e3a1] font-mono">
              {modelKey.toUpperCase()} · {activeLayer?.name || 'Active Layer'}
            </span>
          </div>

          {/* Seam Path Preset */}
          <div className="space-y-1.5 bg-[#333] p-3 rounded border border-[#444]">
            <label className="text-[11px] font-medium text-[#aaa] block">Topology Seam Path</label>
            <select
              value={seamPathPreset}
              onChange={(e) => {
                const val = e.target.value as any;
                setSeamPathPreset(val);
                updateConfigAndPreview({ seamPathPreset: val });
              }}
              className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset"
            >
              <option value="seam_loop">Loop Seam (Garment / Panel Perimeter)</option>
              <option value="brow_contour">Brow / Crown Seam Arch</option>
              <option value="muzzle_seam">Muzzle / Center Collar Seam</option>
              <option value="diagonal_cross">Diagonal Sport Sneaker Seam</option>
              <option value="custom_curve">Mesh UV Edge Flow Loop</option>
            </select>
          </div>

          {/* Stitch Style & Thread Color */}
          <div className="grid grid-cols-2 gap-3 bg-[#333] p-3 rounded border border-[#444]">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#aaa]">Stitch Pattern Style</label>
              <select
                value={stitchStyle}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setStitchStyle(val);
                  updateConfigAndPreview({ stitchStyle: val });
                }}
                className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset"
              >
                <option value="single_thread">Single Running Stitch</option>
                <option value="double_stitch">Double Parallel Stitch</option>
                <option value="cross_stitch">Cross Stitch (X-Seam)</option>
                <option value="baseball">Baseball / Saddle Stitch</option>
                <option value="zigzag">Zigzag Stretch Stitch</option>
                <option value="rope">Braided Rope Thread</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#aaa]">Thread &amp; Shadow Color</label>
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888]">Thread:</span>
                  <input
                    type="color"
                    value={threadColor}
                    onChange={(e) => {
                      setThreadColor(e.target.value);
                      updateConfigAndPreview({ threadColor: e.target.value });
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888]">Depth:</span>
                  <input
                    type="color"
                    value={shadowColor}
                    onChange={(e) => {
                      setShadowColor(e.target.value);
                      updateConfigAndPreview({ shadowColor: e.target.value });
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spacing, Scale & Width */}
          <div className="space-y-2.5 bg-[#333] p-3 rounded border border-[#444]">
            {/* Spacing */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#aaa]">Stitch Spacing</span>
              <span className="text-[10px] font-mono text-[#a6e3a1]">{stitchSpacing} px</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={stitchSpacing}
              onChange={(e) => {
                const val = Number(e.target.value);
                setStitchSpacing(val);
                updateConfigAndPreview({ stitchSpacing: val });
              }}
              className="w-full accent-[#a6e3a1] cursor-pointer"
            />

            {/* Width */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#aaa]">Thread Thickness (Width)</span>
              <span className="text-[10px] font-mono text-[#a6e3a1]">{stitchWidth} px</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              value={stitchWidth}
              onChange={(e) => {
                const val = Number(e.target.value);
                setStitchWidth(val);
                updateConfigAndPreview({ stitchWidth: val });
              }}
              className="w-full accent-[#a6e3a1] cursor-pointer"
            />

            {/* Displacement Depth */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#aaa]">Displacement &amp; Hole Indentation Depth</span>
              <span className="text-[10px] font-mono text-[#a6e3a1]">{Math.round(displacementDepth * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={displacementDepth}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDisplacementDepth(val);
                updateConfigAndPreview({ displacementDepth: val });
              }}
              className="w-full accent-[#a6e3a1] cursor-pointer"
            />
          </div>

          {/* Rotation Offset & Path Smoothing */}
          <div className="grid grid-cols-2 gap-3 bg-[#333] p-3 rounded border border-[#444]">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[11px] font-medium text-[#aaa]">Rotation Offset</label>
                <span className="font-mono text-[10px] text-[#888]">{stitchRotationOffset}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={stitchRotationOffset}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStitchRotationOffset(val);
                  updateConfigAndPreview({ stitchRotationOffset: val });
                }}
                className="w-full accent-[#3d7fb8] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[11px] font-medium text-[#aaa]">Path Smoothing</label>
                <span className="font-mono text-[10px] text-[#888]">{pathSmoothing}x Spline</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={pathSmoothing}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPathSmoothing(val);
                  updateConfigAndPreview({ pathSmoothing: val });
                }}
                className="w-full accent-[#3d7fb8] cursor-pointer"
              />
            </div>
          </div>

          {/* Live Preview Toggle */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#bbb]">
              <input
                type="checkbox"
                checked={preview}
                onChange={handleTogglePreview}
                className="accent-[#a6e3a1] rounded"
              />
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#a6e3a1]" />
                Live Preview on 3D Surface &amp; Viewports
              </span>
            </label>
            <span className="text-[10px] text-[#777] font-mono">Topology Edge Follower</span>
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
            <span>Apply Stitches</span>
          </button>
        </div>
      </div>
    </div>
  );
};
