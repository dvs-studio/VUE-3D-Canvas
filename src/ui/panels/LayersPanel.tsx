/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Layers Panel with Right-Click UV & Alpha Mask Export
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { Layer, BlendMode } from '../../core/types';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Copy, 
  Layers, 
  MoveUp, 
  MoveDown,
  Download,
  MoreVertical,
  Image as ImageIcon
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onUpdateBlendMode: (id: string, mode: BlendMode) => void;
  onMoveLayer: (id: string, dir: 'up' | 'down') => void;
  onOpenExportDialog: (layerId: string, mode: 'merged' | 'alpha_mask') => void;
  onExportAlphaMaskDirect: (layerId: string) => void;
  onOpenGaussianBlur?: (layerId: string) => void;
  onOpenStochasticScatter?: (layerId: string) => void;
  onOpenStitchStudio?: (layerId: string) => void;
  onConvertToBump?: (layerId: string) => void;
  onConvertToNormal?: (layerId: string) => void;
  onConvertToClipMask?: (layerId: string) => void;
}

const BLEND_MODES: BlendMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'hard_light',
  'soft_light',
  'difference',
];

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleVisibility,
  onToggleLock,
  onUpdateOpacity,
  onUpdateBlendMode,
  onMoveLayer,
  onOpenExportDialog,
  onExportAlphaMaskDirect,
  onOpenGaussianBlur,
  onOpenStochasticScatter,
  onOpenStitchStudio,
  onConvertToBump,
  onConvertToNormal,
  onConvertToClipMask,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    layerId: string;
  } | null>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  const handleContextMenu = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      layerId,
    });
  };

  return (
    <div 
      className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838]"
      onClick={() => setContextMenu(null)}
    >
      {/* Top Toolbar: Blend Mode & Opacity */}
      <div className="p-2 border-b border-[#494949] bg-[#333] space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <label className="text-[10px] text-[#999] uppercase font-mono">Blend</label>
          <select
            value={activeLayer?.blendMode || 'normal'}
            onChange={(e) => activeLayer && onUpdateBlendMode(activeLayer.id, e.target.value as BlendMode)}
            className="bg-[#242424] border border-[#555] text-[#eee] rounded px-1.5 py-0.5 text-[11px] outline-none flex-1 cs5-inset"
          >
            {BLEND_MODES.map(mode => (
              <option key={mode} value={mode}>
                {mode.charAt(0).toUpperCase() + mode.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#999] uppercase font-mono">Opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={activeLayer?.opacity ?? 100}
            onChange={(e) => activeLayer && onUpdateOpacity(activeLayer.id, Number(e.target.value))}
            className="flex-1 accent-[#3d7fb8] h-1.5"
          />
          <span className="text-[10px] font-mono text-[#eee] w-7 text-right">
            {activeLayer?.opacity ?? 100}%
          </span>
        </div>
      </div>

      {/* Layer List Stack */}
      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {layers.slice().reverse().map((layer) => {
          const isActive = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              onContextMenu={(e) => handleContextMenu(e, layer.id)}
              className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors border relative ${
                isActive
                  ? 'bg-[#3d7fb8]/35 border-[#3d7fb8] text-white shadow-xs'
                  : 'bg-[#303030] border-[#444] text-[#ccc] hover:bg-[#393939]'
              }`}
            >
              {/* Visibility eye */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="text-[#999] hover:text-white p-0.5"
                title={layer.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {layer.visible ? <Eye className="w-3.5 h-3.5 text-[#a6e3a1]" /> : <EyeOff className="w-3.5 h-3.5 text-[#666]" />}
              </button>

              {/* Layer Thumbnail Preview */}
              <div className="w-7 h-7 bg-[#202020] border border-[#555] rounded-xs flex items-center justify-center overflow-hidden shrink-0 cs5-inset">
                <Layers className="w-3.5 h-3.5 text-[#888]" />
              </div>

              {/* Layer Name & Channel Tag */}
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-[11px] leading-tight">
                  {layer.name}
                </div>
                <div className="text-[9px] text-[#888] font-mono">
                  {layer.channel.toUpperCase()} · {layer.opacity}%
                </div>
              </div>

              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className="text-[#999] hover:text-white p-0.5"
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? <Lock className="w-3 h-3 text-[#e5a038]" /> : <Unlock className="w-3 h-3 text-[#666]" />}
              </button>

              {/* Right-click Context Trigger Button */}
              <button
                onClick={(e) => handleContextMenu(e, layer.id)}
                className="text-[#777] hover:text-white p-0.5"
                title="Layer Context Actions (Right-Click)"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-1.5 bg-[#2d2d2d] border-t border-[#444] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onAddLayer}
            className="p-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#505050] transition-colors"
            title="Create New Texture Layer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicateLayer(activeLayerId)}
            className="p-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#505050] transition-colors"
            title="Duplicate Layer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveLayer(activeLayerId, 'up')}
            className="p-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#505050] transition-colors"
            title="Move Layer Up"
          >
            <MoveUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveLayer(activeLayerId, 'down')}
            className="p-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#505050] transition-colors"
            title="Move Layer Down"
          >
            <MoveDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenExportDialog(activeLayerId, 'merged')}
            className="p-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#3d7fb8] rounded border border-[#505050] transition-colors"
            title="Export Merged UV Texture (CorelDraw Style Scale)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDeleteLayer(activeLayerId)}
            disabled={layers.length <= 1}
            className={`p-1 rounded border transition-colors ${
              layers.length > 1
                ? 'bg-[#3a3a3a] hover:bg-[#8b2626] text-[#eee] border-[#505050]'
                : 'bg-[#292929] text-[#666] border-[#3a3a3a] cursor-not-allowed'
            }`}
            title="Delete Active Layer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#303030] border border-[#555] rounded shadow-2xl py-1 text-xs w-64 cs5-outset"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-mono text-[#888] border-b border-[#444] uppercase tracking-wider">
            LAYER EXPORT &amp; UTILITIES
          </div>

          {/* CorelDraw style custom scaling export */}
          <button
            onClick={() => {
              onOpenExportDialog(contextMenu.layerId, 'merged');
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white flex items-center gap-2 text-[#eee]"
          >
            <Download className="w-3.5 h-3.5 text-[#3d7fb8]" />
            <span>Export Merged UV Texture (Scale Menu)...</span>
          </button>

          {/* Alpha mask only export using layer name */}
          <button
            onClick={() => {
              onExportAlphaMaskDirect(contextMenu.layerId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white flex items-center gap-2 text-[#eee]"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#e5a038]" />
            <span>Export UV Alpha Mask Only (Named PNG)</span>
          </button>

          <div className="border-t border-[#444] my-1" />
          <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider">
            FILTERS &amp; TOOLS
          </div>

          {onOpenGaussianBlur && (
            <button
              onClick={() => {
                onOpenGaussianBlur(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee] flex items-center justify-between"
            >
              <span>Gaussian Blur...</span>
              <span className="text-[10px] text-[#888] font-mono">Radius</span>
            </button>
          )}

          {onOpenStochasticScatter && (
            <button
              onClick={() => {
                onOpenStochasticScatter(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee] flex items-center justify-between"
            >
              <span>Stochastic Scattering...</span>
              <span className="text-[10px] text-[#888] font-mono">Stamps</span>
            </button>
          )}

          {onOpenStitchStudio && (
            <button
              onClick={() => {
                onOpenStitchStudio(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee] flex items-center justify-between"
            >
              <span>Jenny Stitch Studio...</span>
              <span className="text-[10px] text-[#a6e3a1] font-mono">Mesh</span>
            </button>
          )}

          <div className="border-t border-[#444] my-1" />
          <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider">
            LAYER CONVERSIONS
          </div>

          {onConvertToBump && (
            <button
              onClick={() => {
                onConvertToBump(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
            >
              Convert to Bump Map (Height)
            </button>
          )}

          {onConvertToNormal && (
            <button
              onClick={() => {
                onConvertToNormal(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
            >
              Convert to Normal Map (Sobel RGB)
            </button>
          )}

          {onConvertToClipMask && (
            <button
              onClick={() => {
                onConvertToClipMask(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
            >
              Convert to Alpha Clip Mask
            </button>
          )}

          <div className="border-t border-[#444] my-1" />

          <button
            onClick={() => {
              onDuplicateLayer(contextMenu.layerId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1 hover:bg-[#444] text-[#ccc]"
          >
            Duplicate Layer
          </button>

          <button
            onClick={() => {
              onDeleteLayer(contextMenu.layerId);
              setContextMenu(null);
            }}
            disabled={layers.length <= 1}
            className={`w-full text-left px-3 py-1 ${
              layers.length > 1 ? 'hover:bg-[#8b2626] hover:text-white text-[#bbb]' : 'text-[#666] cursor-not-allowed'
            }`}
          >
            Delete Layer
          </button>
        </div>
      )}
    </div>
  );
};
