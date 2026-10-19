/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Pattern Stamp Configuration Dialog (Movable & Non-Blocking)
 * Created by Victory Ukpong
 */

import React, { useState, useEffect, useRef } from 'react';
import { PatternStampConfig, BlendMode } from '../core/types';
import { PatternStampEngine } from '../tools/patternStampTool';
import { 
  Stamp, X, Upload, Sliders, RefreshCw, 
  Layers, ShieldAlert, Move, Image as ImageIcon, Sparkles, Dices
} from 'lucide-react';

interface PatternStampDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: PatternStampConfig;
  onChangeConfig: (newConfig: PatternStampConfig) => void;
  onStampAtCenter?: () => void;
}

export const PatternStampDialog: React.FC<PatternStampDialogProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onStampAtCenter,
}) => {
  const [activeTab, setActiveTab] = useState<'decal' | 'torn_edge' | 'grunge'>('decal');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const grungeFileInputRef = useRef<HTMLInputElement | null>(null);
  const tornMaskFileInputRef = useRef<HTMLInputElement | null>(null);

  // Movable window position state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 80, y: 70 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 80,
    startY: 70,
  });

  // Handle window dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click and not on buttons
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 450, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 350, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Update preview whenever config changes
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background checkerboard
    const s = 10;
    for (let y = 0; y < canvas.height; y += s) {
      for (let x = 0; x < canvas.width; x += s) {
        ctx.fillStyle = ((x / s + y / s) % 2 === 0) ? '#282828' : '#333333';
        ctx.fillRect(x, y, s, s);
      }
    }

    const stamp = PatternStampEngine.generateStampCanvas(config, canvas.width);
    ctx.drawImage(stamp, 0, 0);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const update = (patch: Partial<PatternStampConfig>) => {
    onChangeConfig({ ...config, ...patch });
  };

  const handleCustomDecalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        update({
          stampDataUrl: dataUrl,
          stampName: file.name.replace(/\.[^/.]+$/, ''),
          stampId: 'custom_' + Date.now()
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomGrungeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        update({
          customGrungeUrl: dataUrl,
          grungePreset: 'custom',
          enableGrungeOverlay: true,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomTornMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        update({
          tornMaskTextureUrl: dataUrl,
          enableTornEdgeMask: true,
          tornInfluenceAlphaOnly: true,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    // Non-blocking container without backdrop blur - pointer events pass through to 3D canvas
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomDecalUpload}
        className="hidden"
      />
      <input
        ref={grungeFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomGrungeUpload}
        className="hidden"
      />
      <input
        ref={tornMaskFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomTornMaskUpload}
        className="hidden"
      />

      {/* Draggable Dialog Window with pointer-events-auto */}
      <div 
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="absolute w-[530px] bg-[#2d2d2d] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[92vh] flex flex-col font-sans pointer-events-auto"
      >
        {/* Header - Draggable Grab Bar */}
        <div 
          onMouseDown={handleMouseDown}
          className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0 bg-[#252525] border-b border-[#404040] cursor-move active:bg-[#1f1f1f]"
          title="Click and drag to move window anywhere on screen"
        >
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-[#888]" />
            <Stamp className="w-4 h-4 text-[#e5a038]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Pattern Stamp Tool &bull; Decal Studio
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPosition({ x: 80, y: 70 })}
              className="text-[#888] hover:text-[#bbb] p-0.5 text-[9px] font-mono px-1.5 rounded bg-[#333] border border-[#444]"
              title="Reset window position"
            >
              Reset Pos
            </button>
            <button 
              onClick={onClose}
              className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
              title="Close Dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Preview & Quick Status Banner */}
        <div className="p-2.5 bg-[#222] border-b border-[#3e3e3e] flex items-center gap-3">
          <div className="w-20 h-20 rounded border border-[#555] overflow-hidden shrink-0 shadow-md relative bg-[#1c1c1c]">
            <canvas ref={previewCanvasRef} width={80} height={80} className="w-full h-full block" />
            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[7.5px] font-mono text-center text-[#aaa] py-0.5">
              LIVE PREVIEW
            </span>
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs truncate max-w-[220px]">{config.stampName}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-0.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#eee] rounded border border-[#666] text-[10px] font-medium flex items-center gap-1"
                title="Import custom PNG, JPEG or SVG image"
              >
                <Upload className="w-3 h-3 text-[#e5a038]" />
                <span>Upload Decal</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-[#aaa] font-mono bg-[#1a1a1a] p-1.5 rounded border border-[#333]">
              <div>Size: <span className="text-white font-bold">{config.size}px</span></div>
              <div>&bull;</div>
              <div>
                Rotation:{' '}
                {config.rotation === 0 ? (
                  <span className="text-[#a6e3a1] font-bold bg-[#1b4332] px-1 py-0.2 rounded border border-[#2d6a4f]">Random</span>
                ) : (
                  <span className="text-[#89b4fa] font-bold">{config.rotation}&deg;</span>
                )}
              </div>
              <div>&bull;</div>
              <div>Opacity: <span className="text-white font-bold">{config.opacity}%</span></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#404040] bg-[#292929] px-2 pt-1 gap-1">
          <button
            onClick={() => setActiveTab('decal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'decal'
                ? 'bg-[#2d2d2d] text-white border-[#555] border-b-transparent shadow-xs'
                : 'bg-transparent text-[#999] hover:text-[#ccc] border-transparent'
            }`}
          >
            <Stamp className="w-3.5 h-3.5 text-[#e5a038]" />
            <span>Decal & Rotation</span>
          </button>

          <button
            onClick={() => setActiveTab('torn_edge')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'torn_edge'
                ? 'bg-[#2d2d2d] text-white border-[#555] border-b-transparent shadow-xs'
                : 'bg-transparent text-[#999] hover:text-[#ccc] border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#ff79c6]" />
            <span>Mask & Torn Edge</span>
          </button>

          <button
            onClick={() => setActiveTab('grunge')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'grunge'
                ? 'bg-[#2d2d2d] text-white border-[#555] border-b-transparent shadow-xs'
                : 'bg-transparent text-[#999] hover:text-[#ccc] border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fab387]" />
            <span>Grunge Texture Overlay</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-3 overflow-y-auto space-y-3.5 text-xs text-[#ccc] max-h-[52vh]">
          {/* TAB 1: DECAL PRESETS & ROTATION */}
          {activeTab === 'decal' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-[#aaa] uppercase tracking-wider mb-1.5">
                  Preset Decal Badges & Insignias
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PatternStampEngine.BUILTIN_STAMPS.map(stamp => {
                    const isSelected = config.stampId === stamp.id && (!config.stampDataUrl || !config.stampDataUrl.startsWith('data:'));
                    return (
                      <button
                        key={stamp.id}
                        onClick={() => update({ stampId: stamp.id, stampName: stamp.name, stampDataUrl: '' })}
                        className={`p-2 rounded border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white font-bold'
                            : 'bg-[#252525] border-[#404040] hover:border-[#666] text-[#ccc]'
                        }`}
                      >
                        <span className="text-[11px] truncate">{stamp.name}</span>
                        <span className="text-[9px] font-mono text-[#888]">{stamp.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">Decal Size (Radius)</span>
                  <span className="font-mono text-[#89b4fa] font-bold">{config.size}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={512}
                  step={4}
                  value={config.size}
                  onChange={(e) => update({ size: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#3d7fb8] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                />
              </div>

              {/* Rotation Slider with 0 = 'Random' */}
              <div className="bg-[#242424] p-2.5 rounded border border-[#3e3e3e] space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Dices className="w-3.5 h-3.5 text-[#a6e3a1]" />
                    <span className="text-white font-medium">Rotation Angle (0 = Random)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {config.rotation === 0 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1b4332] text-[#a6e3a1] border border-[#2d6a4f]">
                        Random (0)
                      </span>
                    ) : (
                      <span className="font-mono text-[#89b4fa] font-bold text-[11px]">
                        {config.rotation}&deg;
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => update({ rotation: 0 })}
                      className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[#333] hover:bg-[#444] text-[#ccc] border border-[#555]"
                      title="Set rotation to 0 (Random angle per stamp)"
                    >
                      Set Random
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={config.rotation}
                  onChange={(e) => update({ rotation: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#a6e3a1] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                />
                <p className="text-[10px] text-[#888]">
                  Setting 0 randomizes the angle each time you stamp. Values 1&ndash;360&deg; lock a fixed angle.
                </p>

                {/* Randomization + Scattering Toggle */}
                <div className="pt-2 border-t border-[#333] flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium text-[11px]">Randomize & Scatter Jitter</span>
                    <p className="text-[9.5px] text-[#888]">Random scatter angle variance per tip stroke</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableRandomScattering ?? false}
                      onChange={(e) => update({ enableRandomScattering: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-[#444] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-[#3d7fb8]"></div>
                  </label>
                </div>

                {config.enableRandomScattering && (
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] text-[#aaa]">Scatter Jitter Range</span>
                      <span className="font-mono text-[10px] text-[#a6e3a1] font-bold">
                        &plusmn;{config.scatterAngleVariance ?? 45}&deg;
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={180}
                      step={5}
                      value={config.scatterAngleVariance ?? 45}
                      onChange={(e) => update({ scatterAngleVariance: parseInt(e.target.value, 10) })}
                      className="w-full accent-[#3d7fb8] h-1 bg-[#1a1a1a] rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">Decal Opacity</span>
                  <span className="font-mono text-[#89b4fa] font-bold">{config.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={config.opacity}
                  onChange={(e) => update({ opacity: parseInt(e.target.value, 10) })}
                  className="w-full accent-[#3d7fb8] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: MASK & TORN EDGE (ALPHA AWARE) */}
          {activeTab === 'torn_edge' && (
            <div className="space-y-3">
              <div className="bg-[#242424] p-2.5 rounded border border-[#3e3e3e] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-[11px]">Centered Mask Image Texture</span>
                  <button
                    type="button"
                    onClick={() => tornMaskFileInputRef.current?.click()}
                    className="px-2 py-0.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#eee] rounded border border-[#666] text-[10px] font-medium flex items-center gap-1"
                    title="Import custom B/W or transparent mask image texture"
                  >
                    <Upload className="w-3 h-3 text-[#ff79c6]" />
                    <span>Import Mask Image</span>
                  </button>
                </div>

                {config.tornMaskTextureUrl ? (
                  <div className="flex items-center justify-between bg-[#1e1e1e] p-2 rounded border border-[#444]">
                    <div className="flex items-center gap-2">
                      <img 
                        src={config.tornMaskTextureUrl} 
                        alt="Mask" 
                        className="w-8 h-8 rounded border border-[#555] object-cover bg-black"
                      />
                      <div>
                        <div className="text-[10px] font-bold text-white">Custom Mask Loaded</div>
                        <div className="text-[9px] text-[#888]">Centered &bull; B/W &amp; Alpha Aware</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => update({ tornMaskTextureUrl: undefined })}
                      className="text-[#f38ba8] hover:text-white text-[10px] px-1.5 py-0.5 rounded bg-[#333] border border-[#555]"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#888]">
                    No external mask loaded. Procedural tearing and chipped edge equations will be used.
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-[#333]">
                  <div>
                    <span className="text-[11px] text-white font-medium">Affect Alpha Channel Only</span>
                    <p className="text-[9px] text-[#888]">Masking image texture strictly modulates alpha boundary</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.tornInfluenceAlphaOnly ?? true}
                    onChange={(e) => update({ tornInfluenceAlphaOnly: e.target.checked })}
                    className="accent-[#3d7fb8] rounded"
                  />
                </div>
              </div>

              {/* Torn Edge / Missing Amount Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">Torn Edges & Missing Fragments</span>
                  <span className="font-mono text-[#ff79c6] font-bold">
                    {Math.round(config.missingEdgeAmount * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={config.missingEdgeAmount}
                  onChange={(e) => update({ missingEdgeAmount: parseFloat(e.target.value) })}
                  className="w-full accent-[#ff79c6] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                />
                <p className="text-[9.5px] text-[#888] mt-0.5">
                  Procedurally erodes and chips the boundary around the alpha channel.
                </p>
              </div>

              {/* Edge Jitter Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">Edge Jitter Roughness</span>
                  <span className="font-mono text-[#ff79c6] font-bold">
                    {Math.round(config.edgeJitter * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={config.edgeJitter}
                  onChange={(e) => update({ edgeJitter: parseFloat(e.target.value) })}
                  className="w-full accent-[#ff79c6] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                />
              </div>

              {/* Sharpness Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">Decal Contour Sharpness</span>
                  <span className="font-mono text-[#89b4fa] font-bold">
                    {Math.round(config.sharpness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.02}
                  value={config.sharpness}
                  onChange={(e) => update({ sharpness: parseFloat(e.target.value) })}
                  className="w-full accent-[#3d7fb8] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: GRUNGE TEXTURE OVERLAY (STRICTLY ALPHA AWARE) */}
          {activeTab === 'grunge' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#242424] p-2.5 rounded border border-[#3e3e3e]">
                <div>
                  <span className="text-white font-bold text-[11px]">Enable Grunge Texture Overlay</span>
                  <p className="text-[9px] text-[#a6e3a1]">
                    Strictly alpha-aware: Never bleeds outside decal boundary!
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableGrungeOverlay}
                    onChange={(e) => update({ enableGrungeOverlay: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#444] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e5a038]"></div>
                </label>
              </div>

              {config.enableGrungeOverlay && (
                <>
                  {/* Preset Selector */}
                  <div>
                    <label className="block text-[10px] font-mono text-[#aaa] uppercase tracking-wider mb-1.5">
                      Embedded Grunge Image Textures
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'scratched', name: 'Scratched Metal', desc: 'Linear scrapes' },
                        { id: 'dirty_spots', name: 'Grease & Dirt Spots', desc: 'Organic splatter' },
                        { id: 'cracked_paint', name: 'Cracked Surface', desc: 'Voronoi fractures' },
                        { id: 'worn_patina', name: 'Worn Patina', desc: 'Fine oxidized grain' },
                        { id: 'concrete_weather', name: 'Concrete Weathering', desc: 'Porous erosion' },
                        { id: 'peeling_paint', name: 'Peeling Paint Flakes', desc: 'Curled lifted coats' },
                      ].map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => update({ grungePreset: preset.id as any, customGrungeUrl: undefined })}
                          className={`p-2 rounded border text-left transition-all ${
                            config.grungePreset === preset.id && !config.customGrungeUrl
                              ? 'bg-[#e5a038]/25 border-[#e5a038] text-white font-bold'
                              : 'bg-[#252525] border-[#404040] hover:border-[#666] text-[#ccc]'
                          }`}
                        >
                          <div className="text-[11px]">{preset.name}</div>
                          <div className="text-[9px] text-[#888]">{preset.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Grunge Image Upload */}
                  <div className="flex items-center justify-between bg-[#1e1e1e] p-2 rounded border border-[#3e3e3e]">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#e5a038]" />
                      <div>
                        <div className="text-[11px] font-bold text-white">Custom Grunge Overlay</div>
                        <div className="text-[9px] text-[#888]">
                          {config.customGrungeUrl ? 'Custom Image Active' : 'Import your own texture'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => grungeFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#eee] rounded border border-[#666] text-[10px] font-medium flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3 text-[#e5a038]" />
                      <span>{config.customGrungeUrl ? 'Replace' : 'Import Image'}</span>
                    </button>
                  </div>

                  {/* Blend Mode */}
                  <div>
                    <label className="block text-white font-medium mb-1">Grunge Blend Mode</label>
                    <select
                      value={config.grungeBlendMode}
                      onChange={(e) => update({ grungeBlendMode: e.target.value as BlendMode })}
                      className="w-full bg-[#1e1e1e] border border-[#555] rounded px-2 py-1 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="multiply">Multiply (Darkens crevices & scratches)</option>
                      <option value="overlay">Overlay (Rich contrast weathering)</option>
                      <option value="darken">Darken (Surface dirt)</option>
                      <option value="screen">Screen (Dust & light powder)</option>
                      <option value="soft_light">Soft Light (Subtle patina)</option>
                      <option value="hard_light">Hard Light (Strong paint peel)</option>
                      <option value="difference">Difference (Inverted corrosion)</option>
                    </select>
                  </div>

                  {/* Opacity & Scale */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium">Grunge Opacity</span>
                        <span className="font-mono text-[#89b4fa] font-bold">{config.grungeOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        value={config.grungeOpacity}
                        onChange={(e) => update({ grungeOpacity: parseInt(e.target.value, 10) })}
                        className="w-full accent-[#3d7fb8] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium">Grunge Scale</span>
                        <span className="font-mono text-[#89b4fa] font-bold">{config.grungeScale.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.2}
                        max={4.0}
                        step={0.1}
                        value={config.grungeScale}
                        onChange={(e) => update({ grungeScale: parseFloat(e.target.value) })}
                        className="w-full accent-[#3d7fb8] h-1.5 bg-[#1a1a1a] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-[#252525] border-t border-[#404040] flex items-center justify-between shrink-0">
          <div className="text-[10px] text-[#888] font-mono">
            {activeTab === 'decal' ? 'Click 3D surface to stamp' : 'Effects clamped inside decal alpha'}
          </div>

          <div className="flex items-center gap-2">
            {onStampAtCenter && (
              <button
                type="button"
                onClick={onStampAtCenter}
                className="px-2.5 py-1 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#eee] rounded border border-[#666] text-xs font-medium cursor-pointer"
                title="Stamp decal in the center of active texture"
              >
                Stamp in Center
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-[#3d7fb8] hover:bg-[#4a8ec7] text-white rounded font-medium text-xs shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
