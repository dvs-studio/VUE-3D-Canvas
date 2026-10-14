/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Mask Painting & Selection Window Docker
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { SelectionMask, ToolType, Layer } from '../../core/types';
import { MaskEngine } from '../../tools/maskEngine';
import { UndoRingBuffer } from '../../core/history';
import { 
  Square, 
  Lasso, 
  PenTool, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Trash2, 
  Sliders, 
  Layers, 
  Eye, 
  Check, 
  Sparkles,
  RefreshCw,
  Scissors,
  Paintbrush
} from 'lucide-react';

interface MaskPanelProps {
  selectionMask: SelectionMask | null;
  onUpdateSelectionMask: (mask: SelectionMask | null) => void;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  layers: Layer[];
  activeLayerId: string;
  undoBuffer: UndoRingBuffer;
  onTextureUpdated: () => void;
  primaryColor?: string;
}

export const MaskPanel: React.FC<MaskPanelProps> = ({
  selectionMask,
  onUpdateSelectionMask,
  activeTool,
  onSelectTool,
  layers,
  activeLayerId,
  undoBuffer,
  onTextureUpdated,
  primaryColor = '#3d7fb8',
}) => {
  const [blurRadius, setBlurRadius] = useState(8);
  const [expandRadius, setExpandRadius] = useState(6);
  const [shrinkRadius, setShrinkRadius] = useState(6);
  const [overlayOpacity, setOverlayOpacity] = useState(45);
  const [maskBrushMode, setMaskBrushMode] = useState<'paint' | 'erase'>('paint');
  const [maskBrushSize, setMaskBrushSize] = useState<number>(32);
  const [maskBrushHardness, setMaskBrushHardness] = useState<number>(50);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Quick Select Entire Canvas (1024x1024)
  const handleSelectAll = () => {
    const fullMask: SelectionMask = {
      active: true,
      type: 'rect',
      points: [],
      bounds: { x: 0, y: 0, width: 1024, height: 1024 },
      inverted: false,
    };
    onUpdateSelectionMask(fullMask);
  };

  // Clear / Deselect
  const handleClearMask = () => {
    onUpdateSelectionMask(null);
  };

  // Invert Mask
  const handleInvertMask = () => {
    if (!selectionMask) {
      // If no selection, inverting makes full canvas inverted
      handleSelectAll();
      return;
    }
    onUpdateSelectionMask({
      ...selectionMask,
      inverted: !selectionMask.inverted,
    });
  };

  // Expand / Dilate Mask
  const handleExpandMask = () => {
    if (!selectionMask || !selectionMask.active) return;
    const expanded = MaskEngine.expandMask(selectionMask, expandRadius);
    onUpdateSelectionMask(expanded);
  };

  // Shrink / Erode Mask
  const handleShrinkMask = () => {
    if (!selectionMask || !selectionMask.active) return;
    const shrunk = MaskEngine.shrinkMask(selectionMask, shrinkRadius);
    onUpdateSelectionMask(shrunk);
  };

  // Feather / Blur Mask
  const handleBlurMask = () => {
    if (!selectionMask || !selectionMask.active) return;
    // Expands bounds slightly and flags as softened
    const expanded = MaskEngine.expandMask(selectionMask, Math.round(blurRadius * 0.5));
    onUpdateSelectionMask(expanded);
  };

  // Fill Selection Mask on Active Layer
  const handleFillMask = () => {
    if (!activeLayer || !selectionMask || !selectionMask.active) return;
    const ctx = activeLayer.ctx;
    ctx.save();
    ctx.fillStyle = primaryColor;
    if (selectionMask.type === 'rect') {
      ctx.fillRect(
        selectionMask.bounds.x,
        selectionMask.bounds.y,
        selectionMask.bounds.width,
        selectionMask.bounds.height
      );
    } else if (selectionMask.type === 'ellipse') {
      const rx = selectionMask.bounds.width / 2;
      const ry = selectionMask.bounds.height / 2;
      ctx.beginPath();
      ctx.ellipse(
        selectionMask.bounds.x + rx,
        selectionMask.bounds.y + ry,
        Math.max(1, rx),
        Math.max(1, ry),
        0, 0, Math.PI * 2
      );
      ctx.fill();
    } else if (selectionMask.points.length > 2) {
      ctx.beginPath();
      ctx.moveTo(selectionMask.points[0].x, selectionMask.points[0].y);
      for (let i = 1; i < selectionMask.points.length; i++) {
        ctx.lineTo(selectionMask.points[i].x, selectionMask.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    undoBuffer.pushState('Fill Selection Mask', layers);
    onTextureUpdated();
  };

  // Erase Selection Area from Active Layer
  const handleEraseMask = () => {
    if (!activeLayer || !selectionMask || !selectionMask.active) return;
    const ctx = activeLayer.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    if (selectionMask.type === 'rect') {
      ctx.fillRect(
        selectionMask.bounds.x,
        selectionMask.bounds.y,
        selectionMask.bounds.width,
        selectionMask.bounds.height
      );
    } else if (selectionMask.type === 'ellipse') {
      const rx = selectionMask.bounds.width / 2;
      const ry = selectionMask.bounds.height / 2;
      ctx.beginPath();
      ctx.ellipse(
        selectionMask.bounds.x + rx,
        selectionMask.bounds.y + ry,
        Math.max(1, rx),
        Math.max(1, ry),
        0, 0, Math.PI * 2
      );
      ctx.fill();
    } else if (selectionMask.points.length > 2) {
      ctx.beginPath();
      ctx.moveTo(selectionMask.points[0].x, selectionMask.points[0].y);
      for (let i = 1; i < selectionMask.points.length; i++) {
        ctx.lineTo(selectionMask.points[i].x, selectionMask.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    undoBuffer.pushState('Erase Selection Area', layers);
    onTextureUpdated();
  };

  // Convert Active Layer Non-Zero Alpha into Mask
  const handleLayerToMask = () => {
    if (!activeLayer) return;
    const ctx = activeLayer.ctx;
    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const d = imgData.data;
    let minX = ctx.canvas.width, minY = ctx.canvas.height, maxX = 0, maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < ctx.canvas.height; y += 4) {
      for (let x = 0; x < ctx.canvas.width; x += 4) {
        const alpha = d[(y * ctx.canvas.width + x) * 4 + 3];
        if (alpha > 20) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (hasPixels) {
      onUpdateSelectionMask({
        active: true,
        type: 'rect',
        points: [],
        bounds: {
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
        },
        inverted: false,
      });
    }
  };

  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838] p-3 space-y-3 overflow-y-auto">
      {/* 1. Active Mask Status */}
      <div className="bg-[#2c2c2c] p-2.5 rounded border border-[#444] space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#888]">Active Mask:</span>
          {selectionMask && selectionMask.active ? (
            <span className="font-semibold text-[#a6e3a1] font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#a6e3a1] animate-pulse" />
              {selectionMask.type.toUpperCase()} ({Math.round(selectionMask.bounds.width)}×{Math.round(selectionMask.bounds.height)})
            </span>
          ) : (
            <span className="text-[#777] font-mono">None (Canvas Editable)</span>
          )}
        </div>
        {selectionMask && selectionMask.inverted && (
          <div className="text-[10px] text-[#e5a038] font-mono">
            ● INVERTED: Painting outside original boundary
          </div>
        )}
      </div>

      {/* Physical Shading Feature Guide */}
      <div className="bg-[#262626] p-2.5 rounded border border-[#444] space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#aaa] uppercase tracking-wider">
          <span>Physical Shading Feature</span>
          <span className="text-[#89b4fa] font-mono text-[9px]">ACTIVE IN 2D &amp; 3D</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-1.5 rounded bg-[#1e2d24] border border-[#3e6b48] flex flex-col items-center text-center">
            <span className="font-bold text-[#a6e3a1]">SHADED LIGHT</span>
            <span className="text-[9px] text-[#ccc]">Editable Area</span>
            <span className="text-[8px] text-[#a6e3a1]/80 font-mono mt-0.5">Unlocked / Can Paint</span>
          </div>
          <div className="p-1.5 rounded bg-[#1f1722] border border-[#6b3848] flex flex-col items-center text-center">
            <span className="font-bold text-[#f38ba8]">SHADED DARK</span>
            <span className="text-[9px] text-[#ccc]">Protected Area</span>
            <span className="text-[8px] text-[#f38ba8]/80 font-mono mt-0.5">Shielded / Cannot Edit</span>
          </div>
        </div>
      </div>

      {/* 2. Masking Brush Tool */}
      <div className="space-y-2 bg-[#333] p-2.5 rounded border border-[#444]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-[#aaa] block uppercase tracking-wider">
            Masking Brush
          </label>
          <button
            type="button"
            onClick={() => onSelectTool(activeTool === 'mask_brush' ? 'brush' : 'mask_brush')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTool === 'mask_brush'
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
                : 'bg-[#262626] text-[#bbb] border-[#444] hover:text-white'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>{activeTool === 'mask_brush' ? 'BRUSH ACTIVE' : 'ACTIVATE BRUSH'}</span>
          </button>
        </div>

        {activeTool === 'mask_brush' && (
          <div className="space-y-2 pt-1 border-t border-[#444]">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMaskBrushMode('paint')}
                className={`py-1 rounded text-[10px] font-bold border text-center transition-colors cursor-pointer ${
                  maskBrushMode === 'paint'
                    ? 'bg-[#2e5d38] text-white border-[#488e57]'
                    : 'bg-[#262626] text-[#aaa] border-[#444]'
                }`}
              >
                + Paint on Mask
              </button>
              <button
                type="button"
                onClick={() => setMaskBrushMode('erase')}
                className={`py-1 rounded text-[10px] font-bold border text-center transition-colors cursor-pointer ${
                  maskBrushMode === 'erase'
                    ? 'bg-[#8b2626] text-white border-[#b33a3a]'
                    : 'bg-[#262626] text-[#aaa] border-[#444]'
                }`}
              >
                - Erase from Mask
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#bbb]">Brush Size:</span>
                <span className="font-mono text-[#89b4fa]">{maskBrushSize}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="128"
                value={maskBrushSize}
                onChange={(e) => setMaskBrushSize(Number(e.target.value))}
                className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#bbb]">Hardness (Feather):</span>
                <span className="font-mono text-[#e5a038]">{maskBrushHardness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={maskBrushHardness}
                onChange={(e) => setMaskBrushHardness(Number(e.target.value))}
                className="w-full accent-[#e5a038] h-1.5 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Selection Physical Tools in Viewport 2D/3D */}
      <div className="space-y-1.5 bg-[#333] p-2.5 rounded border border-[#444]">
        <label className="text-[10px] font-bold text-[#aaa] block uppercase tracking-wider">
          Viewport Physical Selectors
        </label>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => onSelectTool('marquee_rect')}
            className={`py-1.5 rounded text-[10px] font-medium border flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTool === 'marquee_rect'
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#262626] text-[#bbb] border-[#444] hover:text-white'
            }`}
            title="Rectangular Marquee Selector"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Rect</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('lasso')}
            className={`py-1.5 rounded text-[10px] font-medium border flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTool === 'lasso'
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#262626] text-[#bbb] border-[#444] hover:text-white'
            }`}
            title="Freehand Lasso Selector"
          >
            <Lasso className="w-3.5 h-3.5" />
            <span>Lasso</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('polygon_lasso')}
            className={`py-1.5 rounded text-[10px] font-medium border flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTool === 'polygon_lasso'
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#262626] text-[#bbb] border-[#444] hover:text-white'
            }`}
            title="Polygon Lasso Selector"
          >
            <Square className="w-3.5 h-3.5 rotate-45 transform" />
            <span>Poly</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('pen')}
            className={`py-1.5 rounded text-[10px] font-medium border flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#262626] text-[#bbb] border-[#444] hover:text-white'
            }`}
            title="Pen Curve Vector Selector"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Pen</span>
          </button>
        </div>
      </div>

      {/* 3. Mask Quick Actions */}
      <div className="space-y-1.5 bg-[#333] p-2.5 rounded border border-[#444]">
        <label className="text-[10px] font-bold text-[#aaa] block uppercase tracking-wider">
          Mask Operations
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={handleInvertMask}
            className="py-1 px-1 bg-[#262626] hover:bg-[#303030] text-[#ccc] border border-[#444] rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
            title="Invert Selection Mask"
          >
            <RefreshCw className="w-3 h-3 text-[#3d7fb8]" />
            <span>Invert</span>
          </button>

          <button
            type="button"
            onClick={handleSelectAll}
            className="py-1 px-1 bg-[#262626] hover:bg-[#303030] text-[#ccc] border border-[#444] rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
            title="Select All Canvas"
          >
            <Maximize2 className="w-3 h-3 text-[#a6e3a1]" />
            <span>Select All</span>
          </button>

          <button
            type="button"
            onClick={handleClearMask}
            className="py-1 px-1 bg-[#262626] hover:bg-[#303030] text-[#f38ba8] border border-[#444] rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
            title="Clear Mask (Deselect)"
          >
            <Trash2 className="w-3 h-3 text-[#f38ba8]" />
            <span>Deselect</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleFillMask}
            disabled={!selectionMask?.active}
            className="py-1 px-1.5 bg-[#262626] hover:bg-[#303030] disabled:opacity-40 text-[#bbb] border border-[#444] rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Fill Selection</span>
          </button>

          <button
            type="button"
            onClick={handleEraseMask}
            disabled={!selectionMask?.active}
            className="py-1 px-1.5 bg-[#262626] hover:bg-[#303030] disabled:opacity-40 text-[#bbb] border border-[#444] rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Erase Area</span>
          </button>
        </div>
      </div>

      {/* 4. Morphological Filter Operations (Blur, Expand, Shrink) */}
      <div className="space-y-2.5 bg-[#333] p-2.5 rounded border border-[#444]">
        <label className="text-[10px] font-bold text-[#aaa] block uppercase tracking-wider">
          Mask Morphology &amp; Feathering
        </label>

        {/* Mask Expand (Dilate) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#bbb]">Expand (Dilate):</span>
            <span className="font-mono text-[#89b4fa]">{expandRadius}px</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="24"
              value={expandRadius}
              onChange={(e) => setExpandRadius(Number(e.target.value))}
              className="flex-1 accent-[#3d7fb8] h-1.5"
            />
            <button
              type="button"
              onClick={handleExpandMask}
              disabled={!selectionMask?.active}
              className="px-2 py-0.5 bg-[#3d7fb8] hover:bg-[#4d92cf] disabled:opacity-40 text-white rounded text-[10px] font-medium border border-[#5ca2db] cursor-pointer"
            >
              Expand
            </button>
          </div>
        </div>

        {/* Mask Shrink (Erode) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#bbb]">Shrink (Erode):</span>
            <span className="font-mono text-[#e5a038]">{shrinkRadius}px</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="24"
              value={shrinkRadius}
              onChange={(e) => setShrinkRadius(Number(e.target.value))}
              className="flex-1 accent-[#e5a038] h-1.5"
            />
            <button
              type="button"
              onClick={handleShrinkMask}
              disabled={!selectionMask?.active}
              className="px-2 py-0.5 bg-[#e5a038] hover:bg-[#f5b048] disabled:opacity-40 text-black rounded text-[10px] font-bold border border-[#ffd175] cursor-pointer"
            >
              Shrink
            </button>
          </div>
        </div>

        {/* Mask Blur (Feather) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#bbb]">Blur / Feather Edge:</span>
            <span className="font-mono text-[#a6e3a1]">{blurRadius}px</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="32"
              value={blurRadius}
              onChange={(e) => setBlurRadius(Number(e.target.value))}
              className="flex-1 accent-[#a6e3a1] h-1.5"
            />
            <button
              type="button"
              onClick={handleBlurMask}
              disabled={!selectionMask?.active}
              className="px-2 py-0.5 bg-[#2e5d38] hover:bg-[#3d7a4a] disabled:opacity-40 text-white rounded text-[10px] font-medium border border-[#488e57] cursor-pointer"
            >
              Feather
            </button>
          </div>
        </div>
      </div>

      {/* 5. Mask to Layer & Layer to Mask */}
      <div className="space-y-1.5 bg-[#2d2d2d] p-2.5 rounded border border-[#444]">
        <label className="text-[10px] font-bold text-[#aaa] block uppercase tracking-wider">
          Layer &amp; Channel Conversion
        </label>
        <button
          type="button"
          onClick={handleLayerToMask}
          className="w-full py-1.5 bg-[#262626] hover:bg-[#333] text-[#bbb] border border-[#444] rounded text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3 h-3 text-[#3d7fb8]" />
          <span>Active Layer Alpha → Selection Mask</span>
        </button>
      </div>
    </div>
  );
};
