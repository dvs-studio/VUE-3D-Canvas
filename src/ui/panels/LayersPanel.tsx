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
  Image as ImageIcon,
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Sliders,
  Contrast,
  Settings,
  Upload,
  RotateCcw,
  Scissors
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onAddMatcapLayer?: () => void;
  onAddMaskLayer?: () => void;
  onAddTearLayer?: () => void;
  onUpdateTearStackDepth?: (layerId: string, depth: number) => void;
  onAddGroup?: () => void;
  onToggleGroupCollapse?: (groupId: string) => void;
  onGroupSelectedLayers?: (layerIds: string[]) => void;
  onDeleteSelectedLayers?: (layerIds: string[]) => void;
  onMergeSelectedLayers?: (layerIds: string[]) => void;
  onMoveSelectedLayersToGroup?: (layerIds: string[], groupId: string) => void;
  groups?: Layer[];
  onRenameGroup?: (groupId: string, name: string) => void;
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
  onConvertToDisplacement?: (layerId: string) => void;
  onConvertToReflection?: (layerId: string) => void;
  onConvertToNormal?: (layerId: string) => void;
  onConvertToClipMask?: (layerId: string) => void;
  onConvertToEmissive?: (layerId: string) => void;
  onInvertLayerColor?: (layerId: string) => void;
  onOpenLayerSettings?: (layerId: string) => void;
  onImportTexture?: () => void;
  onBakeTextureFill?: (layerId: string) => void;
  onOpenBaseLayerSettings?: () => void;
  onResetBaseLayerSettings?: () => void;
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
  onAddMatcapLayer,
  onAddMaskLayer,
  onAddTearLayer,
  onUpdateTearStackDepth,
  onAddGroup,
  onToggleGroupCollapse,
  onGroupSelectedLayers,
  onDeleteSelectedLayers,
  onMergeSelectedLayers,
  onMoveSelectedLayersToGroup,
  groups = [],
  onRenameGroup,
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
  onConvertToDisplacement,
  onConvertToReflection,
  onConvertToNormal,
  onConvertToClipMask,
  onConvertToEmissive,
  onInvertLayerColor,
  onOpenLayerSettings,
  onImportTexture,
  onBakeTextureFill,
  onOpenBaseLayerSettings,
  onResetBaseLayerSettings,
}) => {
  const [checkedLayerIds, setCheckedLayerIds] = useState<string[]>([]);
  const [moveTargetGroupId, setMoveTargetGroupId] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [longPressMenu, setLongPressMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = React.useRef<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    layerId: string;
  } | null>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  const handleContextMenu = (e: React.MouseEvent, layerId: string) => {
    if (layers.some(layer => layer.id === layerId && layer.isBaseLayer)) return;
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
            disabled={!!activeLayer?.isBaseLayer}
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
            disabled={false}
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

          // If layer is inside a collapsed group, hide it from panel
          if (layer.groupId) {
            const parent = layers.find(l => l.id === layer.groupId);
            if (parent && parent.collapsed) return null;
          }

          // Render Group Container Row
          if (layer.isGroup) {
            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors border ${
                  isActive
                    ? 'bg-[#e5a038]/20 border-[#e5a038] text-white shadow-xs'
                    : 'bg-[#292929] border-[#444] text-[#ddd] hover:bg-[#333]'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleGroupCollapse) onToggleGroupCollapse(layer.id);
                  }}
                  className="p-0.5 text-[#aaa] hover:text-white"
                  title={layer.collapsed ? 'Expand Group' : 'Collapse Group'}
                >
                  {layer.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <Folder className="w-4 h-4 text-[#e5a038] shrink-0" />

                <span className="font-semibold text-[11px] flex-1 truncate">{layer.name}</span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className="text-[#999] hover:text-white p-0.5"
                  title={layer.visible ? 'Hide Group' : 'Show Group'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5 text-[#a6e3a1]" /> : <EyeOff className="w-3.5 h-3.5 text-[#666]" />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  className="text-[#666] hover:text-red-400 p-0.5"
                  title="Delete Group"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              onContextMenu={(e) => handleContextMenu(e, layer.id)}
              onPointerDown={(e) => {
                if (checkedLayerIds.length < 2 || !checkedLayerIds.includes(layer.id)) return;
                if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
                longPressTimer.current = window.setTimeout(() => {
                  setLongPressMenu({ x: e.clientX, y: e.clientY });
                }, 480);
              }}
              onPointerUp={() => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current); }}
              onPointerLeave={() => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current); }}
              className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors border relative ${
                layer.groupId ? 'ml-4 border-l-2 border-l-[#e5a038]' : ''
              } ${
                isActive
                  ? 'bg-[#3d7fb8]/35 border-[#3d7fb8] text-white shadow-xs'
                  : 'bg-[#303030] border-[#444] text-[#ccc] hover:bg-[#393939]'
              }`}
            >
              {layer.isBaseLayer ? (
                <button type="button" onClick={(e) => { e.stopPropagation(); onResetBaseLayerSettings?.(); }} className="w-5 h-5 shrink-0 flex items-center justify-center rounded border border-[#765c38] text-[#e5b875] hover:bg-[#4a3925]" title="Reset Base Layer colours and checker opacity to default grey / 100%"><RotateCcw className="w-3 h-3" /></button>
              ) : (
                <input
                  type="checkbox"
                  className="w-3 h-3 accent-blue-500 shrink-0"
                  checked={checkedLayerIds.includes(layer.id)}
                  title="Select layer for group / multi actions"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCheckedLayerIds(prev => e.target.checked ? [...prev, layer.id] : prev.filter(id => id !== layer.id));
                  }}
                />
              )}
              {/* Visibility eye */}
              {layer.isBaseLayer ? (
                <span className="text-[#e5a038] p-0.5" title="Protected base layer — always visible and non-editable"><Lock className="w-3.5 h-3.5" /></span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                  className="text-[#999] hover:text-white p-0.5"
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5 text-[#a6e3a1]" /> : <EyeOff className="w-3.5 h-3.5 text-[#666]" />}
                </button>
              )}

              {/* Layer Thumbnail Preview */}
              <div className="w-7 h-7 bg-[#202020] border border-[#555] rounded-xs flex items-center justify-center overflow-hidden shrink-0 cs5-inset">
                <Layers className="w-3.5 h-3.5 text-[#888]" />
              </div>

              {/* Layer Name & Channel Tag */}
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-[11px] leading-tight">
                  {layer.name}
                  {layer.isBaseLayer && <span className="ml-1 px-1 py-0.5 rounded border border-[#9a7138] text-[#e5a038] text-[8px]">BASE</span>}
                  {layer.layerRole === 'mask' && <span className="ml-1 px-1 py-0.5 rounded border border-[#6c9b70] text-[#a6e3a1] text-[8px]">MASK</span>}
                  {layer.layerRole === 'tear' && <span className="ml-1 px-1 py-0.5 rounded border border-[#a65f8c] text-[#f9a8d4] text-[8px]">TEAR</span>}
                  {layer.layerRole === 'matcap' && <span className="ml-1 px-1 py-0.5 rounded border border-[#8b7bb5] text-[#c4b5fd] text-[8px]">MATCAP</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-[#888] font-mono">
                    {layer.channel.toUpperCase()} · {layer.opacity}%
                  </span>
                  {layer.isTextureFill && (
                    <span className="px-1 py-0.2 bg-amber-500/25 border border-amber-500 text-amber-300 text-[8px] font-bold rounded">
                      FILL
                    </span>
                  )}
                </div>
              </div>

              {/* Bake Texture Fill button */}
              {layer.isTextureFill && onBakeTextureFill && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBakeTextureFill(layer.id);
                  }}
                  className="px-1.5 py-0.5 bg-[#252525] hover:bg-amber-600 hover:text-black text-amber-300 rounded text-[9px] font-bold border border-amber-600/50 transition-colors shadow-xs"
                  title="Bake procedural texture fill into standard pixel layer"
                >
                  Bake
                </button>
              )}

              {/* Lock toggle */}
              {!layer.isBaseLayer && <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                className="text-[#999] hover:text-white p-0.5"
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? <Lock className="w-3 h-3 text-[#e5a038]" /> : <Unlock className="w-3 h-3 text-[#666]" />}
              </button>}

              {/* Base checker properties */}
              {layer.isBaseLayer && onOpenBaseLayerSettings && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpenBaseLayerSettings(); }} className="text-[#e5b875] hover:text-white p-0.5" title="Base Layer Properties"><Settings className="w-3.5 h-3.5" /></button>
              )}

              {/* Layer Settings & PBR Modal button */}
              {onOpenLayerSettings && !layer.isBaseLayer && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLayerSettings(layer.id);
                  }}
                  className="text-[#888] hover:text-[#3d7fb8] p-0.5 transition-colors"
                  title="Layer Material & PBR Settings"
                >
                  <Sliders className="w-3 h-3" />
                </button>
              )}

              {/* Right-click Context Trigger Button */}
              {!layer.isBaseLayer && <button
                onClick={(e) => handleContextMenu(e, layer.id)}
                className="text-[#777] hover:text-white p-0.5"
                title="Layer Context Actions (Right-Click)"
              >
                <MoreVertical className="w-3 h-3" />
              </button>}
            </div>
          );
        })}
      </div>

        {checkedLayerIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 px-2 py-1 bg-[#2a2a2a] border-b border-[#444] text-[10px]">
            <span className="text-[#aaa]">{checkedLayerIds.length} selected</span>
            {onGroupSelectedLayers && (
              <button type="button" className="px-1.5 py-0.5 rounded border border-[#666] hover:bg-[#3a3a3a]"
                onClick={() => { onGroupSelectedLayers(checkedLayerIds); setCheckedLayerIds([]); }}>Group</button>
            )}
            {onMergeSelectedLayers && checkedLayerIds.length >= 2 && (
              <button type="button" className="px-1.5 py-0.5 rounded border border-[#3d7fb8] text-[#9bc9f0] hover:bg-[#3d7fb8]/25"
                onClick={() => { onMergeSelectedLayers(checkedLayerIds); setCheckedLayerIds([]); }}>Merge</button>
            )}
            {onMoveSelectedLayersToGroup && groups.length > 0 && (
              <div className="flex items-center gap-1">
                <select aria-label="Target layer group" value={moveTargetGroupId || groups[0].id}
                  onChange={e => setMoveTargetGroupId(e.target.value)}
                  className="max-w-[110px] bg-[#1f1f1f] border border-[#555] text-[#ddd] px-1 py-0.5 rounded">
                  {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
                <button type="button" className="px-1.5 py-0.5 rounded border border-[#666] hover:bg-[#3a3a3a]"
                  onClick={() => { onMoveSelectedLayersToGroup(checkedLayerIds, moveTargetGroupId || groups[0].id); setCheckedLayerIds([]); }}>Move</button>
              </div>
            )}
            {onDeleteSelectedLayers && (
              <button type="button" className="px-1.5 py-0.5 rounded border border-[#666] hover:bg-[#3a3a3a] text-red-300"
                onClick={() => { onDeleteSelectedLayers(checkedLayerIds); setCheckedLayerIds([]); }}>Delete</button>
            )}
            <button type="button" className="px-1.5 py-0.5 rounded border border-[#555] text-[#888]"
              onClick={() => setCheckedLayerIds([])}>Clear</button>
          </div>
        )}

      {activeLayer?.layerRole === 'tear' && onUpdateTearStackDepth && (
        <div className="px-2 py-1.5 bg-[#303030] border-t border-[#494949] flex items-center gap-2">
          <label className="text-[10px] text-[#aaa] flex-1">Green stack depth</label>
          <input type="range" min="1" max="8" step="1" value={activeLayer.tearStackDepth ?? 2}
            onChange={e => onUpdateTearStackDepth(activeLayer.id, Number(e.target.value))}
            className="w-24 accent-[#3d7fb8]" />
          <span className="text-[10px] font-mono text-[#ddd] w-4 text-right">{activeLayer.tearStackDepth ?? 2}</span>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="p-1.5 bg-[#2d2d2d] border-t border-[#444] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button type="button" onClick={(event) => { event.stopPropagation(); setAddMenuOpen(value => !value); }}
              className="flex items-center gap-1 px-2 py-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#505050] transition-colors"
              title="Add a layer or helper type">
              <Plus className="w-3.5 h-3.5" /><span className="text-[10px]">Add</span>
            </button>
            {addMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 z-[90] min-w-[190px] rounded border border-[#555] bg-[#292929] py-1 shadow-2xl"
                onClick={(event) => event.stopPropagation()}>
                <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-[#888]">New layer</div>
                <button type="button" onClick={() => { onAddLayer(); setAddMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-[#3d7fb8]">Paint Layer</button>
                {onImportTexture && <button type="button" onClick={() => { onImportTexture(); setAddMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-[#3d7fb8] text-sky-300">Material Fill / Import Texture…</button>}
                {onAddMatcapLayer && <button type="button" onClick={() => { onAddMatcapLayer(); setAddMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-[#3d7fb8] text-violet-300">Matcap Layer</button>}
                {onAddMaskLayer && <button type="button" onClick={() => { onAddMaskLayer(activeLayerId); setAddMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-[#3d7fb8] text-green-300">Mask Layer</button>}
                {onAddTearLayer && <button type="button" onClick={() => { onAddTearLayer(); setAddMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-[#3d7fb8] text-pink-300">Tear Layer</button>}
                {onAddGroup && <><div className="my-1 border-t border-[#444]" /><button type="button" onClick={() => { onAddGroup(); setAddMenuOpen(false); }} className="block w-full px-3 py-1.5 text-left hover:bg-[#3d7fb8] text-amber-300">Group</button></>}
              </div>
            )}
          </div>
          <button
            onClick={() => onDuplicateLayer(activeLayerId)}
            disabled={!!activeLayer?.isBaseLayer}
            className="p-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#505050] transition-colors"
            title="Duplicate Layer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveLayer(activeLayerId, 'up')}
            disabled={!!activeLayer?.isBaseLayer}
            className="p-1 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#505050] transition-colors"
            title="Move Layer Up"
          >
            <MoveUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveLayer(activeLayerId, 'down')}
            disabled={!!activeLayer?.isBaseLayer}
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
            disabled={layers.length <= 1 || !!activeLayer?.isBaseLayer}
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
      
      {longPressMenu && checkedLayerIds.length >= 2 && (
        <div className="fixed z-[80] bg-[#2b2b2b] border border-[#555] rounded shadow-xl text-[11px] py-1 min-w-[160px]"
          style={{ left: longPressMenu.x, top: longPressMenu.y }}
          onMouseLeave={() => setLongPressMenu(null)}>
          {onGroupSelectedLayers && (
            <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8]/40"
              onClick={() => { onGroupSelectedLayers(checkedLayerIds); setCheckedLayerIds([]); setLongPressMenu(null); }}>Group selected</button>
          )}
          {onMergeSelectedLayers && checkedLayerIds.length >= 2 && (
            <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8]/40"
              onClick={() => { onMergeSelectedLayers(checkedLayerIds); setCheckedLayerIds([]); setLongPressMenu(null); }}>Merge selected</button>
          )}
          {onMoveSelectedLayersToGroup && groups.length > 0 && (
            <div className="px-3 py-1.5">
              <label className="block text-[#888] mb-1">Move to group</label>
              <select className="w-full bg-[#1d1d1d] border border-[#555] p-1"
                value={moveTargetGroupId || groups[0].id} onChange={e => setMoveTargetGroupId(e.target.value)}>
                {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
              <button type="button" className="mt-1 w-full text-left hover:text-white"
                onClick={() => { onMoveSelectedLayersToGroup(checkedLayerIds, moveTargetGroupId || groups[0].id); setCheckedLayerIds([]); setLongPressMenu(null); }}>Move selected</button>
            </div>
          )}
          {onDeleteSelectedLayers && (
            <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-red-900/40 text-red-200"
              onClick={() => { onDeleteSelectedLayers(checkedLayerIds); setCheckedLayerIds([]); setLongPressMenu(null); }}>Delete selected</button>
          )}
          <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-[#444] text-[#888]"
            onClick={() => setLongPressMenu(null)}>Cancel</button>
        </div>
      )}
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
            LAYER CONVERSIONS
          </div>

          {/* Bake Texture Fill option if layer is texture fill */}
          {layers.find(l => l.id === contextMenu.layerId)?.isTextureFill && onBakeTextureFill && (
            <button
              onClick={() => {
                onBakeTextureFill(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white text-amber-300 font-bold flex items-center justify-between"
            >
              <span>Bake Texture Fill to Pixel Layer</span>
              <span className="text-[9px] font-mono text-amber-400">RASTERIZE</span>
            </button>
          )}

          {layers.find(l => l.id === contextMenu.layerId)?.isTextureFill && (
            <div className="px-3 py-0.5 text-[9px] text-amber-300/80 italic leading-snug">
              Bake layer first to enable bump/normal map conversions.
            </div>
          )}

          {onConvertToBump && !layers.find(l => l.id === contextMenu.layerId)?.isTextureFill && (
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

          {onConvertToDisplacement && !layers.find(l => l.id === contextMenu.layerId)?.isTextureFill && (
            <button
              onClick={() => {
                onConvertToDisplacement(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
            >
              Convert to Displacement
            </button>
          )}

          {onConvertToReflection && !layers.find(l => l.id === contextMenu.layerId)?.isTextureFill && (
            <button
              onClick={() => {
                onConvertToReflection(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
            >
              Convert to Reflection
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

          {onConvertToEmissive && (
            <button
              onClick={() => {
                onConvertToEmissive(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#ffb86c] flex items-center justify-between"
            >
              <span>Convert to Emissive (Glow)</span>
              <span className="text-[9px] font-mono text-[#ffb86c]/80">BLOOM</span>
            </button>
          )}

          {/* Invert Layer Color */}
          {onInvertLayerColor && (
            <button
              onClick={() => {
                onInvertLayerColor(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee] flex items-center gap-2"
            >
              <Contrast className="w-3.5 h-3.5 text-[#a6e3a1]" />
              <span>Invert Layer Color</span>
            </button>
          )}

          {/* Layer Material & PBR Settings */}
          {onOpenLayerSettings && (
            <button
              onClick={() => {
                onOpenLayerSettings(contextMenu.layerId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#fab387] flex items-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5 text-[#fab387]" />
              <span>Layer Material &amp; PBR Settings...</span>
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
