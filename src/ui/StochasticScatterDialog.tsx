/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Stochastic Layer Scattering Dialog
 * Created by Victory Ukpong
 */

import React, { useState, useEffect, useRef } from 'react';
import { Layer } from '../core/types';
import { StochasticScatterEngine, StochasticScatterConfig } from '../tools/stochasticScatter';
import { 
  Shuffle, 
  Check, 
  X, 
  Eye, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Sliders, 
  Layers, 
  Paintbrush, 
  CircleDot 
} from 'lucide-react';

interface StochasticScatterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: Layer | undefined;
  defaultColor: string;
  onApply: (config: StochasticScatterConfig) => void;
  onPreviewUpdate: () => void;
}

export const StochasticScatterDialog: React.FC<StochasticScatterDialogProps> = ({
  isOpen,
  onClose,
  activeLayer,
  defaultColor,
  onApply,
  onPreviewUpdate,
}) => {
  const [numberOfRepeats, setNumberOfRepeats] = useState<number>(0); // 0 = stochastic non-repeating
  const [stampDensity, setStampDensity] = useState<number>(45);
  const [edgeBlendContrast, setEdgeBlendContrast] = useState<number>(0.35);
  const [scatterStrength, setScatterStrength] = useState<number>(0.75);
  const [randomSeed, setRandomSeed] = useState<number>(1337);
  const [rotationMin, setRotationMin] = useState<number>(-180);
  const [rotationMax, setRotationMax] = useState<number>(180);
  const [rotationJitter, setRotationJitter] = useState<number>(30); // 0° to 180°
  const [stampSize, setStampSize] = useState<number>(64); // 8 to 512 px
  const [sizeJitter, setSizeJitter] = useState<number>(20); // 0% to 100%
  const [scaleMin, setScaleMin] = useState<number>(0.4);
  const [scaleMax, setScaleMax] = useState<number>(1.2);
  const [blendMode, setBlendMode] = useState<StochasticScatterConfig['blendMode']>('NORMAL');
  const [stampType, setStampType] = useState<StochasticScatterConfig['stampType']>('grunge');
  const [primaryColor, setPrimaryColor] = useState<string>(defaultColor || '#e6e6e6');
  const [opacity, setOpacity] = useState<number>(85);
  const [preview, setPreview] = useState<boolean>(true);

  // Custom Image Texture & Masking State
  const [customImageElement, setCustomImageElement] = useState<HTMLImageElement | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string | null>(null);
  const [usePhysicalFillColor, setUsePhysicalFillColor] = useState<boolean>(false);

  // Alpha Outline State
  const [enableOutline, setEnableOutline] = useState<boolean>(false);
  const [outlineColor, setOutlineColor] = useState<string>('#000000');
  const [outlineSpread, setOutlineSpread] = useState<number>(4);
  const [outlineBlur, setOutlineBlur] = useState<number>(2);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const getConfig = (): StochasticScatterConfig => ({
    numberOfRepeats,
    stampDensity,
    edgeBlendContrast,
    scatterStrength,
    randomSeed,
    rotationMin,
    rotationMax,
    rotationJitter,
    stampSize,
    sizeJitter,
    scaleMin,
    scaleMax,
    blendMode,
    stampType,
    primaryColor,
    opacity,
    customImageElement,
    customImageUrl: customImageUrl || undefined,
    usePhysicalFillColor,
    enableOutline,
    outlineColor,
    outlineSpread,
    outlineBlur,
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

  const applyPreview = (cfg: StochasticScatterConfig) => {
    if (!backupCanvasRef.current || !activeLayer) return;

    activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);

    StochasticScatterEngine.applyScatter(activeLayer.ctx, cfg);
    onPreviewUpdate();
  };

  const updateConfigAndPreview = (patch: Partial<StochasticScatterConfig>) => {
    const nextCfg = { ...getConfig(), ...patch };
    if (preview) {
      applyPreview(nextCfg);
    }
  };

  const handleRollSeed = () => {
    const newSeed = Math.floor(Math.random() * 999999);
    setRandomSeed(newSeed);
    updateConfigAndPreview({ randomSeed: newSeed });
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

  // Image Import Handler
  const handleImageFileChange = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setCustomImageElement(img);
        setCustomImageUrl(url);
        setCustomImageName(file.name);
        setStampType('custom');
        updateConfigAndPreview({
          customImageElement: img,
          customImageUrl: url,
          stampType: 'custom',
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!activeLayer || !backupCanvasRef.current) return;

    const cfg = getConfig();
    activeLayer.ctx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
    activeLayer.ctx.drawImage(backupCanvasRef.current, 0, 0);

    StochasticScatterEngine.applyScatter(activeLayer.ctx, cfg);
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

  // Preset thumbnails picture definitions
  const stampPresets: { id: StochasticScatterConfig['stampType']; label: string; icon: React.ReactNode }[] = [
    {
      id: 'grunge',
      label: 'Grunge',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <circle cx="16" cy="16" r="3.5" fill="#ddd" opacity="0.9" />
          <circle cx="10" cy="12" r="2.5" fill="#ddd" opacity="0.6" />
          <circle cx="22" cy="14" r="2.8" fill="#ddd" opacity="0.75" />
          <circle cx="14" cy="22" r="2.2" fill="#ddd" opacity="0.8" />
          <circle cx="21" cy="21" r="1.8" fill="#ddd" opacity="0.5" />
        </svg>
      ),
    },
    {
      id: 'splat',
      label: 'Splatter',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <circle cx="16" cy="16" r="5" fill="#e5a038" />
          <circle cx="8" cy="16" r="1.5" fill="#e5a038" />
          <circle cx="24" cy="16" r="1.5" fill="#e5a038" />
          <circle cx="16" cy="7" r="1.8" fill="#e5a038" />
          <circle cx="19" cy="25" r="1.2" fill="#e5a038" />
          <circle cx="10" cy="22" r="1.6" fill="#e5a038" />
        </svg>
      ),
    },
    {
      id: 'scratch',
      label: 'Scratch',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <path d="M6 10 L26 14 M8 16 L24 20 M10 22 L22 24" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'dots',
      label: 'Dots',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <circle cx="9" cy="9" r="2" fill="#89b4fa" />
          <circle cx="16" cy="9" r="2" fill="#89b4fa" />
          <circle cx="23" cy="9" r="2" fill="#89b4fa" />
          <circle cx="9" cy="16" r="2" fill="#89b4fa" />
          <circle cx="16" cy="16" r="2" fill="#89b4fa" />
          <circle cx="23" cy="16" r="2" fill="#89b4fa" />
          <circle cx="9" cy="23" r="2" fill="#89b4fa" />
          <circle cx="16" cy="23" r="2" fill="#89b4fa" />
          <circle cx="23" cy="23" r="2" fill="#89b4fa" />
        </svg>
      ),
    },
    {
      id: 'cracks',
      label: 'Cracks',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <path d="M16 6 L14 13 L19 18 L13 22 L17 26" fill="none" stroke="#ddd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'hex',
      label: 'Hex Grid',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <polygon points="16,6 25,11 25,21 16,26 7,21 7,11" fill="none" stroke="#a6e3a1" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'stars',
      label: 'Stars',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <polygon points="16,4 19,12 28,13 21,19 23,28 16,23 9,28 11,19 4,13 13,12" fill="#fab387" />
        </svg>
      ),
    },
    {
      id: 'leaves',
      label: 'Leaves',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <ellipse cx="14" cy="16" rx="9" ry="5" transform="rotate(-30 14 16)" fill="#4ade80" />
          <path d="M7 23 L23 9" stroke="#165632" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'circuit',
      label: 'Circuit',
      icon: (
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <path d="M6 16 L14 16 L18 10 L24 10" fill="none" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="24" cy="10" r="2.5" fill="#38bdf8" />
          <circle cx="6" cy="16" r="2.5" fill="#38bdf8" />
        </svg>
      ),
    },
  ];

  const [position, setPosition] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(20, typeof window !== 'undefined' ? window.innerWidth - 590 : 150),
    y: 60,
  }));
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handlePointerDownHeader = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(40, Math.min(window.innerHeight - 150, e.clientY - dragOffsetRef.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      <div 
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        className="w-[560px] pointer-events-auto bg-[#333333] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[92vh] flex flex-col font-sans absolute top-0 left-0"
      >
        {/* Header (Draggable) */}
        <div 
          onPointerDown={handlePointerDownHeader}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="cs5-panel-header px-3.5 py-2 flex items-center justify-between shrink-0 bg-[#2b2b2b] border-b border-[#444] cursor-move"
          title="Drag to reposition dialog"
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <Sparkles className="w-4 h-4 text-[#e5a038]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase font-mono">
              Stochastic Layer Scattering Engine
            </span>
          </div>
          <button 
            onClick={handleCancel}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-4 text-xs text-[#ccc] overflow-y-auto flex-1">
          {/* Target Layer Info Banner */}
          <div className="bg-[#262626] p-2.5 rounded border border-[#404040] flex items-center justify-between">
            <span className="text-[11px] text-[#aaa]">Target Texture Layer:</span>
            <span className="text-[11px] font-semibold text-[#89b4fa] font-mono">
              {activeLayer?.name || 'Active Layer'}
            </span>
          </div>

          {/* 1. PICTURE-BASED STAMP PATTERNS & CUSTOM TEXTURE UPLOAD */}
          <div className="bg-[#2b2b2b] p-3 rounded border border-[#444] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#eee] uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#3d7fb8]" />
                Stamp Pattern Picture Presets
              </label>
              <span className="text-[10px] text-[#888]">Select picture or import image</span>
            </div>

            {/* Picture Preset Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {stampPresets.map((preset) => {
                const isActive = stampType === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setStampType(preset.id);
                      updateConfigAndPreview({ stampType: preset.id });
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#3d7fb8]/30 border-[#5ca2db] ring-1 ring-[#5ca2db]'
                        : 'bg-[#222222] border-[#444] hover:bg-[#2c2c2c] hover:border-[#666]'
                    }`}
                  >
                    <div className="h-7 flex items-center justify-center mb-1">
                      {preset.icon}
                    </div>
                    <span className={`text-[10px] font-medium truncate w-full text-center ${
                      isActive ? 'text-white font-bold' : 'text-[#bbb]'
                    }`}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}

              {/* Custom Image Card */}
              <button
                type="button"
                onClick={() => {
                  if (customImageElement) {
                    setStampType('custom');
                    updateConfigAndPreview({ stampType: 'custom' });
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`flex flex-col items-center justify-center p-2 rounded border transition-all cursor-pointer ${
                  stampType === 'custom'
                    ? 'bg-[#3d7fb8]/30 border-[#5ca2db] ring-1 ring-[#5ca2db]'
                    : 'bg-[#222222] border-[#444] hover:bg-[#2c2c2c] hover:border-[#666]'
                }`}
                title="Use custom imported texture image"
              >
                <div className="h-7 flex items-center justify-center mb-1">
                  {customImageUrl ? (
                    <img 
                      src={customImageUrl} 
                      alt="Custom" 
                      className="w-6 h-6 object-contain rounded border border-[#555]"
                    />
                  ) : (
                    <Upload className="w-5 h-5 text-[#89b4fa]" />
                  )}
                </div>
                <span className={`text-[10px] font-medium truncate w-full text-center ${
                  stampType === 'custom' ? 'text-white font-bold' : 'text-[#89b4fa]'
                }`}>
                  {customImageName ? 'Custom' : '+ Import'}
                </span>
              </button>
            </div>

            {/* Custom Image Drag & Drop / File Browser Section */}
            <div className="pt-2 border-t border-[#3c3c3c]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleImageFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="bg-[#202020] border border-dashed border-[#555] hover:border-[#89b4fa] rounded p-2.5 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-[#181818] border border-[#444] flex items-center justify-center shrink-0 overflow-hidden">
                    {customImageUrl ? (
                      <img src={customImageUrl} alt="Thumb" className="w-full h-full object-contain" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#888]" />
                    )}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-[11px] font-medium text-[#ddd] truncate">
                      {customImageName || 'Drop custom PNG/JPG/SVG texture here'}
                    </span>
                    <span className="text-[10px] text-[#777]">
                      {customImageElement 
                        ? `${customImageElement.width}×${customImageElement.height} px · Ready for scattering`
                        : 'Supports alpha silhouettes and full-color pictures'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-[#3a3a3a] hover:bg-[#484848] text-white rounded text-[10px] font-medium border border-[#555] cursor-pointer transition-colors"
                  >
                    Browse...
                  </button>
                  {customImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomImageElement(null);
                        setCustomImageUrl(null);
                        setCustomImageName(null);
                        setStampType('grunge');
                        updateConfigAndPreview({
                          customImageElement: null,
                          customImageUrl: undefined,
                          stampType: 'grunge',
                        });
                      }}
                      className="p-1 hover:bg-[#444] text-[#888] hover:text-[#ff6b6b] rounded cursor-pointer"
                      title="Clear custom texture"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Physical Fill Color Option for Custom or Procedural Mask */}
              <div className="mt-2.5 pt-2 border-t border-[#383838] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#ddd]">
                    <input
                      type="checkbox"
                      checked={usePhysicalFillColor}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUsePhysicalFillColor(checked);
                        updateConfigAndPreview({ usePhysicalFillColor: checked });
                      }}
                      className="accent-[#3d7fb8] rounded cursor-pointer"
                    />
                    <span className="font-medium">Use physical fill colour in the image stamp mask</span>
                  </label>
                  <span className="text-[10px] text-[#e5a038] font-mono">
                    {usePhysicalFillColor ? 'Solid Fill Active' : 'Native Colors'}
                  </span>
                </div>
                <p className="text-[10px] text-[#888] pl-5 leading-tight">
                  {usePhysicalFillColor 
                    ? 'Replaces imported picture colors with the primary color chosen below.' 
                    : 'Preserves the authentic original colors of your imported picture or stamp texture.'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. ALPHA OUTLINE EFFECT (BLUR & SPREAD) */}
          <div className="bg-[#2b2b2b] p-3 rounded border border-[#444] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-[#eee] uppercase tracking-wide">
                <input
                  type="checkbox"
                  checked={enableOutline}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEnableOutline(checked);
                    updateConfigAndPreview({ enableOutline: checked });
                  }}
                  className="accent-[#e5a038] rounded"
                />
                <span className="flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5 text-[#e5a038]" />
                  Enable Outline from Mask Alpha
                </span>
              </label>
              <span className="text-[10px] text-[#888]">Dilated silhouette &amp; blur</span>
            </div>

            {enableOutline && (
              <div className="space-y-2.5 pt-2 border-t border-[#3c3c3c] bg-[#222222] p-2.5 rounded border border-[#383838]">
                {/* Outline Color Picker */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#bbb]">Outline Color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={outlineColor}
                      onChange={(e) => {
                        setOutlineColor(e.target.value);
                        updateConfigAndPreview({ outlineColor: e.target.value });
                      }}
                      className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                    />
                    <span className="text-[10px] font-mono text-[#aaa] uppercase">{outlineColor}</span>
                  </div>
                </div>

                {/* Outline Spread (Dilation) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#bbb]">Outline Spread (Dilation)</span>
                    <span className="font-mono text-[#e5a038]">{outlineSpread} px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={outlineSpread}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOutlineSpread(val);
                      updateConfigAndPreview({ outlineSpread: val });
                    }}
                    className="w-full accent-[#e5a038] cursor-pointer"
                  />
                </div>

                {/* Outline Blur */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#bbb]">Outline Blur Effect</span>
                    <span className="font-mono text-[#89b4fa]">{outlineBlur} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={outlineBlur}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOutlineBlur(val);
                      updateConfigAndPreview({ outlineBlur: val });
                    }}
                    className="w-full accent-[#89b4fa] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. BLEND MODE & PRIMARY STAMP COLOR */}
          <div className="grid grid-cols-2 gap-3 bg-[#2b2b2b] p-3 rounded border border-[#444]">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#aaa]">Blend Mode</label>
              <select
                value={blendMode}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setBlendMode(val);
                  updateConfigAndPreview({ blendMode: val });
                }}
                className="w-full bg-[#1e1e1e] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset font-mono"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="MULTIPLY">MULTIPLY</option>
                <option value="OVERLAY">OVERLAY</option>
                <option value="ADD">ADD (LIGHTER)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#aaa]">Physical / Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    updateConfigAndPreview({ primaryColor: e.target.value });
                  }}
                  className="w-7 h-7 rounded cursor-pointer border border-[#555] bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    updateConfigAndPreview({ primaryColor: e.target.value });
                  }}
                  className="w-24 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* 4. REPETITION VS STOCHASTIC MODE */}
          <div className="space-y-2 bg-[#2b2b2b] p-3 rounded border border-[#444]">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-[#aaa]">Number of Repeats</label>
                <span className="text-[10px] text-[#888]">
                  {numberOfRepeats === 0 ? '0: Continuous Stochastic Mode (density driven)' : `${numberOfRepeats} Repeat-Aware Mode`}
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="300"
                value={numberOfRepeats}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(300, Number(e.target.value) || 0));
                  setNumberOfRepeats(val);
                  updateConfigAndPreview({ numberOfRepeats: val });
                }}
                className="w-16 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-right font-mono text-[11px] cs5-inset"
              />
            </div>

            {numberOfRepeats === 0 && (
              <div className="pt-2 border-t border-[#3c3c3c] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#aaa]">Stamp Density</span>
                  <span className="font-mono text-[#e5a038]">{stampDensity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={stampDensity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStampDensity(val);
                    updateConfigAndPreview({ stampDensity: val });
                  }}
                  className="w-full accent-[#e5a038] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 5. SCATTER JITTER & CONTRAST */}
          <div className="space-y-2.5 bg-[#2b2b2b] p-3 rounded border border-[#444]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#aaa]">Scatter Jitter Strength</span>
              <span className="text-[10px] font-mono text-[#3d7fb8]">{Math.round(scatterStrength * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={scatterStrength}
              onChange={(e) => {
                const val = Number(e.target.value);
                setScatterStrength(val);
                updateConfigAndPreview({ scatterStrength: val });
              }}
              className="w-full accent-[#3d7fb8] cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#aaa]">Edge Blend Contrast</span>
              <span className="text-[10px] font-mono text-[#3d7fb8]">{Math.round(edgeBlendContrast * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={edgeBlendContrast}
              onChange={(e) => {
                const val = Number(e.target.value);
                setEdgeBlendContrast(val);
                updateConfigAndPreview({ edgeBlendContrast: val });
              }}
              className="w-full accent-[#3d7fb8] cursor-pointer"
            />
          </div>

          {/* 6. ROTATION & SCALE RANGES */}
          <div className="grid grid-cols-2 gap-3 bg-[#2b2b2b] p-3 rounded border border-[#444]">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#aaa] block">Rotation Range (°)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={rotationMin}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRotationMin(val);
                    updateConfigAndPreview({ rotationMin: val });
                  }}
                  className="w-16 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
                <span className="text-[#888]">to</span>
                <input
                  type="number"
                  value={rotationMax}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRotationMax(val);
                    updateConfigAndPreview({ rotationMax: val });
                  }}
                  className="w-16 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#aaa] block">Scale Range</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={scaleMin}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setScaleMin(val);
                    updateConfigAndPreview({ scaleMin: val });
                  }}
                  className="w-16 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
                <span className="text-[#888]">to</span>
                <input
                  type="number"
                  step="0.1"
                  value={scaleMax}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setScaleMax(val);
                    updateConfigAndPreview({ scaleMax: val });
                  }}
                  className="w-16 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[10px]"
                />
              </div>
            </div>

            {/* Rotation Jitter Slider */}
            <div className="col-span-2 space-y-1 pt-2 border-t border-[#3c3c3c]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#aaa] flex items-center gap-1">
                  <span>Rotation Jitter</span>
                  <span className="text-[10px] text-[#777]">(randomized angle offset)</span>
                </span>
                <span className="font-mono text-[#e5a038]">±{rotationJitter}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={rotationJitter}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRotationJitter(val);
                  updateConfigAndPreview({ rotationJitter: val });
                }}
                className="w-full accent-[#e5a038] cursor-pointer"
              />
            </div>

            {/* Stamp Texture Size (Slider + Number Input) */}
            <div className="col-span-2 space-y-1 pt-2 border-t border-[#3c3c3c]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#aaa] flex items-center gap-1">
                  <span>Stamp Texture Size</span>
                  <span className="text-[10px] text-[#777]">(base resolution px)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="8"
                    max="512"
                    step="4"
                    value={stampSize}
                    onChange={(e) => {
                      const val = Math.max(8, Math.min(512, Number(e.target.value) || 8));
                      setStampSize(val);
                      updateConfigAndPreview({ stampSize: val });
                    }}
                    className="w-16 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[11px] outline-none"
                  />
                  <span className="text-[10px] text-[#888]">px</span>
                </div>
              </div>
              <input
                type="range"
                min="8"
                max="256"
                step="4"
                value={stampSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStampSize(val);
                  updateConfigAndPreview({ stampSize: val });
                }}
                className="w-full accent-[#38bdf8] cursor-pointer"
              />
            </div>

            {/* Size Jitter (Slider + Number Input) */}
            <div className="col-span-2 space-y-1 pt-2 border-t border-[#3c3c3c]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#aaa] flex items-center gap-1">
                  <span>Size Jitter</span>
                  <span className="text-[10px] text-[#777]">(randomized scale variation)</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={sizeJitter}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setSizeJitter(val);
                      updateConfigAndPreview({ sizeJitter: val });
                    }}
                    className="w-14 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-center font-mono text-[11px] outline-none"
                  />
                  <span className="text-[10px] text-[#888]">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={sizeJitter}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSizeJitter(val);
                  updateConfigAndPreview({ sizeJitter: val });
                }}
                className="w-full accent-[#a855f7] cursor-pointer"
              />
            </div>
          </div>

          {/* 7. DETERMINISTIC SEED & RE-ROLL */}
          <div className="flex items-center justify-between bg-[#2b2b2b] p-3 rounded border border-[#444]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#aaa]">Deterministic Seed:</span>
              <span className="text-[11px] font-mono text-[#89b4fa] font-bold">{randomSeed}</span>
            </div>

            <button
              type="button"
              onClick={handleRollSeed}
              className="px-3 py-1 bg-[#404040] hover:bg-[#505050] text-white rounded text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors border border-[#555]"
              title="Roll new deterministic random seed"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#e5a038]" />
              <span>Re-roll Seed</span>
            </button>
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
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#3d7fb8]" />
                Live Preview in Viewport 3D &amp; Canvas
              </span>
            </label>
            <span className="text-[10px] text-[#777] font-mono">Mulberry32 PRNG</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#262626] px-4 py-3 flex items-center justify-end gap-2 border-t border-[#444] shrink-0">
          <button
            onClick={handleCancel}
            className="px-3.5 py-1.5 bg-[#3a3a3a] hover:bg-[#484848] text-[#ccc] rounded border border-[#555] text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Scattering</span>
          </button>
        </div>
      </div>
    </div>
  );
};
