/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Dark Dockable UV N-Panel
 * Author / Creator: Victory Ukpong
 */

import React, { useState } from 'react';
import * as THREE from 'three';
import { 
  Wand2, 
  Layers, 
  FlipHorizontal2, 
  Paintbrush, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Minimize2,
  Maximize2,
  Sliders
} from 'lucide-react';
import { UVSculptMode, UVChannelInfo, SymmetrizeUVConfig } from '../core/types';
import { SmartUVOptions, SmartUVUnwrapEngine } from '../tools/smartUVUnwrap';
import { UVChannelManager } from '../tools/uvChannelManager';
import { SymmetrizeUVEngine } from '../tools/symmetrizeUV';

interface UVNPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  geometry: THREE.BufferGeometry;
  onGeometryUpdated: () => void;
  activeUVChannel: string;
  onSelectUVChannel: (channelId: string) => void;
  // Re-bake trigger
  onRebakeTexture: (fromChannel: string, toChannel: string, resolution: number) => void;
  // Sculpt Brush state
  isSculptModeActive: boolean;
  onToggleSculptMode: (active: boolean) => void;
  sculptBrushMode: UVSculptMode;
  onSelectSculptMode: (mode: UVSculptMode) => void;
  sculptRadius: number;
  onChangeSculptRadius: (r: number) => void;
  sculptStrength: number;
  onChangeSculptStrength: (s: number) => void;
  // 3D X-Ray vertex selection count
  xrayVertexCount?: number;
  selectedVertexIndices?: Set<number> | null;
}

export const UVNPanel: React.FC<UVNPanelProps> = ({
  isOpen,
  onToggleOpen,
  geometry,
  onGeometryUpdated,
  activeUVChannel,
  onSelectUVChannel,
  onRebakeTexture,
  isSculptModeActive,
  onToggleSculptMode,
  sculptBrushMode,
  onSelectSculptMode,
  sculptRadius,
  onChangeSculptRadius,
  sculptStrength,
  onChangeSculptStrength,
  xrayVertexCount = 0,
  selectedVertexIndices = null,
}) => {
  const [activeTab, setActiveTab] = useState<'unwrap' | 'channels' | 'symmetrize' | 'sculpt'>('unwrap');

  // Smart Unwrap local state
  const [angleLimit, setAngleLimit] = useState(60);
  const [margin, setMargin] = useState(0.02);
  const [bleedPx, setBleedPx] = useState(4);
  const [seed, setSeed] = useState(1337);
  const [selectedSubmesh, setSelectedSubmesh] = useState('all');
  const [preserveOthers, setPreserveOthers] = useState(true);
  const [unwrapMessage, setUnwrapMessage] = useState<string | null>(null);

  // Re-bake local state
  const [rebakeFrom, setRebakeFrom] = useState('uv_tightmap');
  const [rebakeTo, setRebakeTo] = useState('uv_original');
  const [rebakeRes, setRebakeRes] = useState(1024);
  const [rebakeStatus, setRebakeStatus] = useState<string | null>(null);

  // Symmetrize local state
  const [symAxis, setSymAxis] = useState<'X' | 'Y' | 'Z'>('X');
  const [symDirection, setSymDirection] = useState<'+ to -' | '- to +' | 'overlap_mirrored' | 'side_by_side'>('overlap_mirrored');
  const [midpointThreshold, setMidpointThreshold] = useState(0.02);
  const [protectEars, setProtectEars] = useState(true);
  const [symStatus, setSymStatus] = useState<string | null>(null);

  const availableSubmeshes = SmartUVUnwrapEngine.getAvailableSubmeshes(geometry);
  const uvChannels = UVChannelManager.getChannels(geometry);

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 900000) + 10000);
  };

  const handleExecuteUnwrap = () => {
    const opts: SmartUVOptions = {
      angleLimitDegrees: angleLimit,
      islandMargin: margin,
      islandBleedPixels: bleedPx,
      seed,
      submeshId: selectedSubmesh,
      preserveOthers,
    };

    const result = SmartUVUnwrapEngine.unwrapGeometry(geometry, opts);
    UVChannelManager.setActiveChannel(geometry, 'uv_tightmap');
    onSelectUVChannel('uv_tightmap');
    onGeometryUpdated();

    setUnwrapMessage(`Packed ${result.islandCount} islands with seed #${result.seedUsed}!`);
    setTimeout(() => setUnwrapMessage(null), 3500);
  };

  const handleAddChannel = () => {
    const newId = UVChannelManager.addChannel(geometry);
    UVChannelManager.setActiveChannel(geometry, newId);
    onSelectUVChannel(newId);
    onGeometryUpdated();
  };

  const handleDeleteChannel = (id: string) => {
    if (UVChannelManager.deleteChannel(geometry, id)) {
      onSelectUVChannel('uv_original');
      onGeometryUpdated();
    }
  };

  const handleExecuteRebake = () => {
    setRebakeStatus('Re-baking texture...');
    setTimeout(() => {
      onRebakeTexture(rebakeFrom, rebakeTo, rebakeRes);
      setRebakeStatus(`Re-baked successfully onto ${rebakeTo}!`);
      setTimeout(() => setRebakeStatus(null), 3500);
    }, 100);
  };

  const handleExecuteSymmetrize = () => {
    const config: SymmetrizeUVConfig = {
      axis: symAxis,
      direction: symDirection,
      midpointThreshold,
      protectAsymmetricFeatures: protectEars,
      useVertexSelectionGroup: xrayVertexCount > 0,
    };

    const res = SymmetrizeUVEngine.symmetrizeGeometry(geometry, config, selectedVertexIndices);
    onGeometryUpdated();

    setSymStatus(`Mirrored ${res.verticesMirrored} vertices (${res.midlinePinned} midline pinned, ${res.asymmetricProtected} ears protected)`);
    setTimeout(() => setSymStatus(null), 4000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#eee] border-l border-y border-[#555] px-1 py-4 rounded-l shadow-xl flex flex-col items-center gap-1 cursor-pointer transition-colors"
        title="Toggle UV N-Panel (Key: N)"
      >
        <ChevronLeft className="w-4 h-4 text-[#38bdf8]" />
        <span className="text-[10px] font-bold tracking-wider vertical-text font-mono text-[#aaa]">N-PANEL</span>
      </button>
    );
  }

  return (
    <aside 
      aria-label="UV Tools Panel"
      className="absolute right-0 top-0 bottom-0 z-40 w-72 bg-[#262626] border-l border-[#444] shadow-2xl flex flex-col cs5-outset select-none text-xs text-[#ccc] font-sans"
    >
      {/* N-Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#222] border-b border-[#3e3e3e]">
        <div className="flex items-center gap-1.5 font-bold text-[#eee] uppercase text-[10px] tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>UV SUITE (N-PANEL)</span>
        </div>
        <button
          onClick={onToggleOpen}
          className="p-1 hover:bg-[#383838] text-[#aaa] hover:text-white rounded"
          title="Close N-Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3a3a3a] bg-[#1f1f1f] text-[10px] font-bold">
        <button
          onClick={() => setActiveTab('unwrap')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1 ${
            activeTab === 'unwrap'
              ? 'border-[#22c55e] text-[#a6e3a1] bg-[#2a2a2a]'
              : 'border-transparent text-[#888] hover:text-[#bbb] hover:bg-[#252525]'
          }`}
          title="Smart UV Unwrap with Seeded Variety"
        >
          <Wand2 className="w-3 h-3" />
          <span>Unwrap</span>
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1 ${
            activeTab === 'channels'
              ? 'border-[#38bdf8] text-[#38bdf8] bg-[#2a2a2a]'
              : 'border-transparent text-[#888] hover:text-[#bbb] hover:bg-[#252525]'
          }`}
          title="Multi-UV Channels & Dynamic Re-baker"
        >
          <Layers className="w-3 h-3" />
          <span>Channels</span>
        </button>
        <button
          onClick={() => setActiveTab('symmetrize')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1 ${
            activeTab === 'symmetrize'
              ? 'border-[#eab308] text-[#facc15] bg-[#2a2a2a]'
              : 'border-transparent text-[#888] hover:text-[#bbb] hover:bg-[#252525]'
          }`}
          title="Symmetrize UV with Midpoint & Ear Protection"
        >
          <FlipHorizontal2 className="w-3 h-3" />
          <span>Mirror</span>
        </button>
        <button
          onClick={() => setActiveTab('sculpt')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1 ${
            activeTab === 'sculpt'
              ? 'border-[#ec4899] text-[#f472b6] bg-[#2a2a2a]'
              : 'border-transparent text-[#888] hover:text-[#bbb] hover:bg-[#252525]'
          }`}
          title="2D UV Interactive Sculpt Brushes"
        >
          <Paintbrush className="w-3 h-3" />
          <span>Sculpt</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* TAB 1: SMART UNWRAP */}
        {activeTab === 'unwrap' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#aaa] leading-relaxed">
              Generates non-repetitive conformal UV islands with seeded stochastic packing, island bleeding, and submesh isolation.
            </div>

            {unwrapMessage && (
              <div className="p-2 bg-[#1b4332] text-[#a6e3a1] rounded text-[11px] border border-[#2d6a4f] font-mono">
                {unwrapMessage}
              </div>
            )}

            {/* Submesh component isolation */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e] space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#aaa] tracking-wider">Submesh Isolation</span>
              <select
                value={selectedSubmesh}
                onChange={(e) => setSelectedSubmesh(e.target.value)}
                className="w-full bg-[#181818] border border-[#555] text-white px-2 py-1 rounded text-xs outline-none"
              >
                {availableSubmeshes.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub === 'all' ? 'All Mesh Components (Unified)' : `Isolate Submesh [${sub}]`}
                  </option>
                ))}
              </select>

              {selectedSubmesh !== 'all' && (
                <label className="flex items-center gap-1.5 text-[10px] text-[#aaa] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={preserveOthers}
                    onChange={(e) => setPreserveOthers(e.target.checked)}
                    className="accent-[#22c55e]"
                  />
                  <span>Preserve Unselected Submesh UVs</span>
                </label>
              )}
            </div>

            {/* Seed Variation (Eliminates repetitive layouts) */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#aaa]">
                <span>Layout Seed</span>
                <span className="font-mono text-[#a6e3a1]">#{seed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
                  className="flex-1 bg-[#181818] border border-[#555] text-white px-2 py-1 rounded font-mono text-xs outline-none"
                />
                <button
                  onClick={handleRandomizeSeed}
                  className="px-2 py-1 bg-[#333] hover:bg-[#444] text-[#eee] rounded border border-[#555] flex items-center gap-1 text-[10px]"
                  title="Generate new layout variation"
                >
                  <RefreshCw className="w-3 h-3 text-[#38bdf8]" />
                  <span>Jitter</span>
                </button>
              </div>
            </div>

            {/* Angle Limit */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e] space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Angle Limit:</span>
                <span className="font-mono text-[#38bdf8] font-bold">{angleLimit}°</span>
              </div>
              <input
                type="range"
                min="20"
                max="85"
                step="1"
                value={angleLimit}
                onChange={(e) => setAngleLimit(Number(e.target.value))}
                className="w-full accent-[#38bdf8] h-1"
              />
            </div>

            {/* Island Margin & Bleed Pixels */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e] space-y-2">
              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Island Margin:</span>
                  <span className="font-mono text-[#a6e3a1] font-bold">{(margin * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.06"
                  step="0.005"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-[#22c55e] h-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Island Bleed (Anti-Glitch):</span>
                  <span className="font-mono text-[#facc15] font-bold">{bleedPx} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={bleedPx}
                  onChange={(e) => setBleedPx(Number(e.target.value))}
                  className="w-full accent-[#facc15] h-1"
                />
              </div>
            </div>

            <button
              onClick={handleExecuteUnwrap}
              className="w-full py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Conformal Unwrap</span>
            </button>
          </div>
        )}

        {/* TAB 2: UV CHANNELS & RE-BAKE */}
        {activeTab === 'channels' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#aaa] tracking-wider">Active Channels</span>
              <button
                onClick={handleAddChannel}
                className="px-2 py-0.5 bg-[#333] hover:bg-[#404040] text-[#38bdf8] rounded border border-[#555] flex items-center gap-1 text-[10px]"
              >
                <Plus className="w-3 h-3" />
                <span>New Channel</span>
              </button>
            </div>

            {/* Channels List */}
            <div className="space-y-1.5">
              {uvChannels.map((ch) => {
                const isActive = ch.id === activeUVChannel;
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      UVChannelManager.setActiveChannel(geometry, ch.id);
                      onSelectUVChannel(ch.id);
                      onGeometryUpdated();
                    }}
                    className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#1e293b] border-[#38bdf8] text-[#38bdf8]'
                        : 'bg-[#202020] border-[#3a3a3a] text-[#aaa] hover:bg-[#282828]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#38bdf8]' : 'bg-[#555]'}`} />
                      <div>
                        <div className="font-bold text-xs text-white">{ch.name}</div>
                        <div className="text-[9px] font-mono text-[#888]">
                          ID: {ch.id} {ch.isDefault && '(Original Material Slot)'}
                        </div>
                      </div>
                    </div>

                    {!ch.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChannel(ch.id);
                        }}
                        className="p-1 hover:bg-[#8b2626] text-[#888] hover:text-white rounded"
                        title="Delete Channel"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Texture Re-baker */}
            <div className="bg-[#202020] p-3 rounded border border-[#3e3e3e] space-y-2 pt-2">
              <div className="text-[10px] uppercase font-bold text-[#facc15] tracking-wider flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                <span>Inverse Texture Re-Baker</span>
              </div>
              <div className="text-[10px] text-[#aaa]">
                Bakes texture seamlessly from TightMap back to Original UVs (or custom slot) using inverse barycentric triangle mapping.
              </div>

              {rebakeStatus && (
                <div className="p-1.5 bg-[#1b4332] text-[#a6e3a1] rounded text-[10px] border border-[#2d6a4f] font-mono">
                  {rebakeStatus}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#888]">From UV:</span>
                  <select
                    value={rebakeFrom}
                    onChange={(e) => setRebakeFrom(e.target.value)}
                    className="bg-[#181818] border border-[#555] text-white px-1.5 py-0.5 rounded text-[10px] font-mono outline-none"
                  >
                    {uvChannels.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#888]">To UV:</span>
                  <select
                    value={rebakeTo}
                    onChange={(e) => setRebakeTo(e.target.value)}
                    className="bg-[#181818] border border-[#555] text-white px-1.5 py-0.5 rounded text-[10px] font-mono outline-none"
                  >
                    {uvChannels.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#888]">Resolution:</span>
                  <select
                    value={rebakeRes}
                    onChange={(e) => setRebakeRes(Number(e.target.value))}
                    className="bg-[#181818] border border-[#555] text-white px-1.5 py-0.5 rounded text-[10px] font-mono outline-none"
                  >
                    <option value={512}>512 × 512</option>
                    <option value={1024}>1024 × 1024</option>
                    <option value={2048}>2048 × 2048</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleExecuteRebake}
                className="w-full py-1.5 bg-[#3d7fb8] hover:bg-[#4d8fc8] text-white text-xs font-bold rounded flex items-center justify-center gap-1 shadow-sm transition-colors mt-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Re-Bake to Selected UV</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SYMMETRIZE UV */}
        {activeTab === 'symmetrize' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#aaa] leading-relaxed">
              Bilateral symmetry mirroring with centerline protection and asymmetric feature guard (preventing ear collision).
            </div>

            {symStatus && (
              <div className="p-2 bg-[#2d4a22] text-[#a6e3a1] rounded text-[11px] border border-[#3e6b2f] font-mono">
                {symStatus}
              </div>
            )}

            {/* 3D X-Ray Selection Status Badge */}
            <div className="bg-[#1a2333] p-2.5 rounded border border-[#2e4c7e] space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#89b4fa]">
                <span>3D X-Ray Selection</span>
                <span className="font-mono">{xrayVertexCount} Verts</span>
              </div>
              <div className="text-[10px] text-[#94a3b8]">
                {xrayVertexCount > 0 
                  ? `Symmetrize will target the active ${xrayVertexCount} painted vertices in 3D.`
                  : 'No X-Ray selection active; Symmetrize will process entire bilateral mesh.'}
              </div>
            </div>

            {/* Axis & Direction */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e] space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#aaa]">Symmetry Axis:</span>
                <div className="flex gap-1">
                  {(['X', 'Y', 'Z'] as const).map((ax) => (
                    <button
                      key={ax}
                      onClick={() => setSymAxis(ax)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        symAxis === ax ? 'bg-[#eab308] text-black' : 'bg-[#333] text-[#aaa]'
                      }`}
                    >
                      {ax}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#aaa]">Layout Mode:</span>
                <select
                  value={symDirection}
                  onChange={(e) => setSymDirection(e.target.value as any)}
                  className="bg-[#181818] border border-[#555] text-white px-1.5 py-0.5 rounded text-[10px] font-mono outline-none"
                >
                  <option value="overlap_mirrored">Overlap Mirrored (Stacked)</option>
                  <option value="side_by_side">Side-by-Side (Bilateral Tile)</option>
                  <option value="+ to -">+ to - Axis Mirror</option>
                  <option value="- to +">- to + Axis Mirror</option>
                </select>
              </div>
            </div>

            {/* Midpoint Weld Threshold */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e] space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#aaa]">Midpoint Weld Seam:</span>
                <span className="font-mono text-[#facc15] font-bold">{midpointThreshold.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.08"
                step="0.005"
                value={midpointThreshold}
                onChange={(e) => setMidpointThreshold(Number(e.target.value))}
                className="w-full accent-[#eab308] h-1"
              />
            </div>

            {/* Protect Asymmetric Features / Ears */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e]">
              <label className="flex items-center gap-2 text-[10.5px] text-[#eee] cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectEars}
                  onChange={(e) => setProtectEars(e.target.checked)}
                  className="accent-[#eab308]"
                />
                <span className="font-bold">Protect Asymmetric Details &amp; Ears</span>
              </label>
              <p className="text-[9.5px] text-[#888] pt-1 pl-5">
                Ensures ears and off-center features retain independent non-overlapping islands.
              </p>
            </div>

            <button
              onClick={handleExecuteSymmetrize}
              className="w-full py-2 bg-[#ca8a04] hover:bg-[#eab308] text-black text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
              <span>Execute Symmetrize UV</span>
            </button>
          </div>
        )}

        {/* TAB 4: UV SCULPT BRUSHES */}
        {activeTab === 'sculpt' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#aaa] leading-relaxed">
              Sculpt UV vertices interactively in 2D to relax stretch, straighten edge loops, or pinch detail areas.
            </div>

            {/* Sculpt Tool Active Toggle */}
            <button
              onClick={() => onToggleSculptMode(!isSculptModeActive)}
              className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                isSculptModeActive
                  ? 'bg-[#be185d] border-[#f472b6] text-white shadow-md'
                  : 'bg-[#333] hover:bg-[#404040] text-[#aaa] border-[#555]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>{isSculptModeActive ? 'UV SCULPT TOOL ACTIVE (ON)' : 'ACTIVATE UV SCULPT TOOL'}</span>
            </button>

            {/* Brush Mode Picker */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#aaa] tracking-wider">Sculpt Brush Mode</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'straighten', label: 'Straighten', desc: 'Aligns cardinal edges' },
                    { id: 'smooth', label: 'Smooth / Relax', desc: 'Reduces stretch' },
                    { id: 'pinch', label: 'Pinch', desc: 'Pulls toward cursor' },
                    { id: 'expand', label: 'Expand', desc: 'Pushes outward' },
                    { id: 'crease', label: 'Crease', desc: 'Sharpens UV seam' },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSelectSculptMode(b.id);
                      if (!isSculptModeActive) onToggleSculptMode(true);
                    }}
                    className={`p-1.5 rounded border text-left transition-colors ${
                      sculptBrushMode === b.id && isSculptModeActive
                        ? 'bg-[#831843] border-[#f472b6] text-white font-bold'
                        : 'bg-[#202020] border-[#3a3a3a] text-[#aaa] hover:bg-[#282828]'
                    }`}
                  >
                    <div className="text-[11px] text-[#eee]">{b.label}</div>
                    <div className="text-[9px] text-[#777]">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Brush Radius & Strength */}
            <div className="bg-[#202020] p-2.5 rounded border border-[#3e3e3e] space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Brush Radius:</span>
                  <span className="font-mono text-[#f472b6] font-bold">{Math.round(sculptRadius * 640)} px</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.35"
                  step="0.01"
                  value={sculptRadius}
                  onChange={(e) => onChangeSculptRadius(Number(e.target.value))}
                  className="w-full accent-[#ec4899] h-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Brush Strength:</span>
                  <span className="font-mono text-[#f472b6] font-bold">{Math.round(sculptStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={sculptStrength}
                  onChange={(e) => onChangeSculptStrength(Number(e.target.value))}
                  className="w-full accent-[#ec4899] h-1"
                />
              </div>
            </div>

            <div className="p-2 bg-[#1f1f1f] border border-[#333] rounded text-[10px] text-[#888] leading-tight">
              Tip: Drag directly on the 2D canvas with mouse or stylus to sculpt UV vertex positions live.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
