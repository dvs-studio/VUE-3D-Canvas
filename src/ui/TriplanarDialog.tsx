/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Triplanar Filter Multi-Texture Mixing Dialog
 * Created by Victory Ukpong
 */

import React, { useState, useRef } from 'react';
import { TriplanarConfig, TriplanarTextureItem } from '../core/types';
import { 
  Box, Sliders, Check, X, Mountain, Compass, Plus, Trash2, 
  Upload, Layers, Sparkles
} from 'lucide-react';

interface TriplanarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: TriplanarConfig) => void;
  defaultColor: string;
}

const BUILTIN_PRESETS: { id: string; name: string; color: string; desc: string }[] = [
  { id: 'sand_fine', name: 'Desert Sand (Fine)', color: '#dabb7d', desc: 'Golden sand with ripples' },
  { id: 'sand_coarse', name: 'River Grit (Coarse)', color: '#a5875f', desc: 'Coarse sand and small pebbles' },
  { id: 'forest_moss', name: 'Forest Moss', color: '#4a6738', desc: 'Organic mossy green foliage' },
  { id: 'granite_rock', name: 'Granite Rock', color: '#888888', desc: 'Flecked mountain stone' },
  { id: 'weathered_wood', name: 'Weathered Wood', color: '#7a5a3a', desc: 'Natural grain plank texture' },
  { id: 'rusty_metal', name: 'Rusty Metal', color: '#9e472a', desc: 'Oxidized rough iron patina' },
];

export const TriplanarDialog: React.FC<TriplanarDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultColor,
}) => {
  const [activeTab, setActiveTab] = useState<'textures' | 'mixing' | 'projection' | 'slope' | 'altitude'>('textures');

  // Textures Stack
  const [textures, setTextures] = useState<TriplanarTextureItem[]>([
    {
      id: 'sand_fine',
      name: 'Desert Sand (Fine)',
      isTransparentBlank: false,
      opacity: 100,
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      tintColor: defaultColor || '#dabb7d'
    },
    {
      id: 'sand_coarse',
      name: 'River Grit (Coarse)',
      isTransparentBlank: false,
      opacity: 100,
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      tintColor: '#a5875f'
    }
  ]);

  // Mixer Operator Parameters
  const [mixerPattern, setMixerPattern] = useState<TriplanarConfig['mixerPattern']>('clouds');
  const [mixerScale, setMixerScale] = useState<number>(4.0);
  const [mixingValue, setMixingValue] = useState<number>(0.5);
  const [bleedingValue, setBleedingValue] = useState<number>(0.25);
  const [edgeNoiseValue, setEdgeNoiseValue] = useState<number>(0.3);
  const [tilingRandomization, setTilingRandomization] = useState<number>(0.4);

  // Projection Parameters
  const [scale, setScale] = useState(6);
  const [blendSharpness, setBlendSharpness] = useState(3.0);
  const [coordinateSpace, setCoordinateSpace] = useState<'object' | 'world'>('world');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [offsetZ, setOffsetZ] = useState(0);

  // Slope Mask Parameters
  const [enableSlopeMask, setEnableSlopeMask] = useState(false);
  const [slopeThreshold, setSlopeThreshold] = useState(0.4);
  const [slopeSmoothing, setSlopeSmoothing] = useState(0.15);
  const [slopeStrength, setSlopeStrength] = useState(1.0);
  const [slopeInvert, setSlopeInvert] = useState(false);
  const [slopeUpAxis, setSlopeUpAxis] = useState<'Y+' | 'Z+' | 'X+'>('Y+');

  // Altitude Mask Parameters
  const [enableAltitudeMask, setEnableAltitudeMask] = useState(false);
  const [altitudeLower, setAltitudeLower] = useState(-0.5);
  const [altitudeUpper, setAltitudeUpper] = useState(0.5);
  const [altitudeSmoothing, setAltitudeSmoothing] = useState(0.15);
  const [altitudeStrength, setAltitudeStrength] = useState(1.0);
  const [altitudeInvert, setAltitudeInvert] = useState(false);

  // Height-aware blending
  const [heightAwareBlending, setHeightAwareBlending] = useState(false);
  const [heightContrast, setHeightContrast] = useState(1.0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIdx, setUploadTargetIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddTexture = () => {
    const newIdx = textures.length;
    const preset = BUILTIN_PRESETS[newIdx % BUILTIN_PRESETS.length];
    setTextures(prev => [
      ...prev,
      {
        id: preset.id + '_' + Date.now(),
        name: preset.name,
        isTransparentBlank: false,
        opacity: 100,
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        tintColor: preset.color
      }
    ]);
  };

  const handleRemoveTexture = (index: number) => {
    if (textures.length <= 1) return;
    setTextures(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextureChange = (index: number, patch: Partial<TriplanarTextureItem>) => {
    setTextures(prev => prev.map((t, i) => i === index ? { ...t, ...patch } : t));
  };

  const triggerUpload = (index: number) => {
    setUploadTargetIdx(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetIdx === null) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleTextureChange(uploadTargetIdx, {
          dataUrl,
          name: file.name.replace(/\.[^/.]+$/, ''),
          isTransparentBlank: false
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    onConfirm({
      textures,
      mixerPattern,
      mixerScale,
      mixingValue,
      bleedingValue,
      edgeNoiseValue,
      tilingRandomization,
      scale,
      blendSharpness,
      coordinateSpace,
      offsetX,
      offsetY,
      offsetZ,
      primaryColor: textures[0]?.tintColor || defaultColor || '#dabb7d',
      secondaryColor: textures[1]?.tintColor || '#a5875f',
      enableSlopeMask,
      slopeThreshold,
      slopeSmoothing,
      slopeStrength,
      slopeInvert,
      slopeUpAxis,
      enableAltitudeMask,
      altitudeLower,
      altitudeUpper,
      altitudeSmoothing,
      altitudeStrength,
      altitudeInvert,
      heightAwareBlending,
      heightContrast,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="w-[620px] bg-[#2d2d2d] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0 bg-[#252525] border-b border-[#404040]">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Triplanar Box Filter &bull; Multi-Texture Mixer
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3e3e3e] bg-[#222] px-2 pt-1 gap-1 shrink-0 overflow-x-auto text-[11px]">
          <button
            onClick={() => setActiveTab('textures')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'textures'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#3d7fb8]" />
            <span>Textures ({textures.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mixing')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'mixing'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a6e3a1]" />
            <span>Mixer Operator</span>
          </button>

          <button
            onClick={() => setActiveTab('projection')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'projection'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#fab387]" />
            <span>Box Projection</span>
          </button>

          <button
            onClick={() => setActiveTab('slope')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'slope'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#89b4fa]" />
            <span>Slope</span>
          </button>

          <button
            onClick={() => setActiveTab('altitude')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'altitude'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 text-[#cba6f7]" />
            <span>Altitude</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-[#ccc]">
          {/* TAB 1: TEXTURES */}
          {activeTab === 'textures' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-[13px]">Image Textures Stack</h4>
                  <p className="text-[11px] text-[#888]">
                    Operates directly on photographic textures. Mixes textures seamlessly without UV stretching.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTexture}
                  className="px-2.5 py-1 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Texture</span>
                </button>
              </div>

              <div className="space-y-3">
                {textures.map((tex, idx) => (
                  <div 
                    key={tex.id}
                    className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#333] text-[#aaa] flex items-center justify-center font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={tex.name}
                          onChange={(e) => handleTextureChange(idx, { name: e.target.value })}
                          className="bg-[#1a1a1a] border border-[#444] rounded px-2 py-0.5 text-xs text-white font-medium focus:outline-none focus:border-[#3d7fb8] w-48"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerUpload(idx)}
                          className="px-2 py-1 bg-[#333] hover:bg-[#444] text-[#ddd] rounded text-[10px] font-medium flex items-center gap-1 border border-[#444]"
                          title="Upload custom image texture"
                        >
                          <Upload className="w-3 h-3 text-[#3d7fb8]" />
                          <span>Custom Image</span>
                        </button>
                        {textures.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTexture(idx)}
                            className="p-1 text-[#e06c75] hover:bg-[#332222] rounded transition-colors"
                            title="Remove texture from stack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Presets and Blank Alpha Row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[#888] font-mono">PRESET:</span>
                      {BUILTIN_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleTextureChange(idx, { 
                            id: p.id, 
                            name: p.name, 
                            isTransparentBlank: false,
                            dataUrl: undefined,
                            tintColor: p.color
                          })}
                          className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 transition-colors ${
                            !tex.isTransparentBlank && tex.id.startsWith(p.id)
                              ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white font-bold'
                              : 'bg-[#1f1f1f] border-[#383838] text-[#aaa] hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span>{p.name.split(' ')[0]}</span>
                        </button>
                      ))}

                      {/* Blank Alpha Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTextureChange(idx, { isTransparentBlank: !tex.isTransparentBlank })}
                        className={`ml-auto px-2.5 py-0.5 rounded text-[10px] border flex items-center gap-1 transition-colors ${
                          tex.isTransparentBlank
                            ? 'bg-[#fab387]/30 border-[#fab387] text-[#fab387] font-bold'
                            : 'bg-[#1f1f1f] border-[#444] text-[#888] hover:text-white'
                        }`}
                        title="Leverage existing alpha to blend nothing into place so it merges cleanly with original surface paint"
                      >
                        <span>Blank Alpha (Underlying Merge)</span>
                        {tex.isTransparentBlank && <Check className="w-3 h-3 text-[#fab387]" />}
                      </button>
                    </div>

                    {/* Scale and Tint controls */}
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#333] text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#999]">Texture Tile Scale:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0.2"
                            max="5.0"
                            step="0.1"
                            value={tex.scale || 1.0}
                            onChange={(e) => handleTextureChange(idx, { scale: parseFloat(e.target.value) })}
                            className="w-24 accent-[#3d7fb8]"
                          />
                          <span className="font-mono text-[10px] text-white w-8 text-right">
                            {(tex.scale || 1.0).toFixed(1)}x
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#999]">Color Tint:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tex.tintColor || '#ffffff'}
                            onChange={(e) => handleTextureChange(idx, { tintColor: e.target.value })}
                            className="w-6 h-5 bg-transparent border-0 cursor-pointer rounded"
                          />
                          <span className="font-mono text-[10px] text-[#aaa]">
                            {tex.tintColor || '#ffffff'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MIXER OPERATOR */}
          {activeTab === 'mixing' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white text-[12px]">Mixer Procedural Pattern</span>
                  <select
                    value={mixerPattern}
                    onChange={(e) => setMixerPattern(e.target.value as any)}
                    className="bg-[#1a1a1a] border border-[#444] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3d7fb8]"
                  >
                    <option value="clouds">Clouds (Smooth Fractal)</option>
                    <option value="fractal_noise">Fractal Noise (Turbulent)</option>
                    <option value="cellular">Cellular (Voronoi Patches)</option>
                    <option value="checker">Checkerboard Mixer</option>
                    <option value="grid">Grid Pattern</option>
                    <option value="carbon_fiber">Carbon Fiber</option>
                    <option value="brushed_metal">Brushed Metal</option>
                  </select>
                </div>

                {/* Mixing Value */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Mixing Value (Blend Threshold)</span>
                    <span className="font-mono text-white text-[11px]">{(mixingValue * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mixingValue}
                    onChange={(e) => setMixingValue(parseFloat(e.target.value))}
                    className="w-full accent-[#a6e3a1]"
                  />
                  <p className="text-[10px] text-[#777]">Controls the dominant distribution ratio between texture 1 and texture 2.</p>
                </div>

                {/* Bleeding Value */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Bleeding Value (Transition Softness)</span>
                    <span className="font-mono text-white text-[11px]">{bleedingValue.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={bleedingValue}
                    onChange={(e) => setBleedingValue(parseFloat(e.target.value))}
                    className="w-full accent-[#a6e3a1]"
                  />
                  <p className="text-[10px] text-[#777]">Determines how soft or wide the patch edges bleed into each other.</p>
                </div>

                {/* Edge Noise Value */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Edge Noise (Edge Roughness &amp; Decay)</span>
                    <span className="font-mono text-white text-[11px]">{edgeNoiseValue.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={edgeNoiseValue}
                    onChange={(e) => setEdgeNoiseValue(parseFloat(e.target.value))}
                    className="w-full accent-[#a6e3a1]"
                  />
                  <p className="text-[10px] text-[#777]">Distorts transition boundaries to prevent straight, artificial borders.</p>
                </div>

                {/* Tiling Randomization */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Tiling Randomization (Anti-Repeat Jitter)</span>
                    <span className="font-mono text-white text-[11px]">{(tilingRandomization * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={tilingRandomization}
                    onChange={(e) => setTilingRandomization(parseFloat(e.target.value))}
                    className="w-full accent-[#fab387]"
                  />
                  <p className="text-[10px] text-[#777]">Per-cell coordinate offset breaking up visible grid repetitions.</p>
                </div>

                {/* Mixer Frequency Scale */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Mixer Pattern Frequency Scale</span>
                    <span className="font-mono text-white text-[11px]">{mixerScale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="16.0"
                    step="0.5"
                    value={mixerScale}
                    onChange={(e) => setMixerScale(parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECTION */}
          {activeTab === 'projection' && (
            <div className="space-y-3 p-3 bg-[#242424] border border-[#3e3e3e] rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-[#aaa]">Coordinate Space</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCoordinateSpace('world')}
                    className={`px-3 py-1 rounded text-xs ${
                      coordinateSpace === 'world' ? 'bg-[#3d7fb8] text-white font-bold' : 'bg-[#1a1a1a] text-[#888]'
                    }`}
                  >
                    World Space
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoordinateSpace('object')}
                    className={`px-3 py-1 rounded text-xs ${
                      coordinateSpace === 'object' ? 'bg-[#3d7fb8] text-white font-bold' : 'bg-[#1a1a1a] text-[#888]'
                    }`}
                  >
                    Object Space
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#aaa]">Global Triplanar Scale</span>
                  <span className="font-mono text-white">{scale}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="32"
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-full accent-[#3d7fb8]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#aaa]">Blend Sharpness (Normal Power)</span>
                  <span className="font-mono text-white">{blendSharpness.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.1"
                  value={blendSharpness}
                  onChange={(e) => setBlendSharpness(parseFloat(e.target.value))}
                  className="w-full accent-[#3d7fb8]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#333]">
                <div>
                  <span className="text-[10px] text-[#888]">Offset X</span>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={offsetX}
                    onChange={(e) => setOffsetX(parseFloat(e.target.value))}
                    className="w-full accent-[#888]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#888]">Offset Y</span>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={offsetY}
                    onChange={(e) => setOffsetY(parseFloat(e.target.value))}
                    className="w-full accent-[#888]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#888]">Offset Z</span>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.05"
                    value={offsetZ}
                    onChange={(e) => setOffsetZ(parseFloat(e.target.value))}
                    className="w-full accent-[#888]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SLOPE MASK */}
          {activeTab === 'slope' && (
            <div className="space-y-3 p-3 bg-[#242424] border border-[#3e3e3e] rounded-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSlopeMask}
                    onChange={(e) => setEnableSlopeMask(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#444] text-[#3d7fb8] focus:ring-0"
                  />
                  <span className="font-medium text-white">Enable Slope Masking</span>
                </label>
                <select
                  value={slopeUpAxis}
                  onChange={(e) => setSlopeUpAxis(e.target.value as any)}
                  disabled={!enableSlopeMask}
                  className="bg-[#1a1a1a] border border-[#444] rounded px-2 py-0.5 text-xs text-white"
                >
                  <option value="Y+">Up: Y+ (Standard)</option>
                  <option value="Z+">Up: Z+ (Blender)</option>
                  <option value="X+">Up: X+</option>
                </select>
              </div>

              <div className={`space-y-3 ${!enableSlopeMask ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Slope Angle Threshold</span>
                    <span className="font-mono text-white">{(slopeThreshold * 90).toFixed(0)}&deg;</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={slopeThreshold}
                    onChange={(e) => setSlopeThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#89b4fa]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#aaa]">Slope Transition Smoothing</span>
                    <span className="font-mono text-white">{slopeSmoothing.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={slopeSmoothing}
                    onChange={(e) => setSlopeSmoothing(parseFloat(e.target.value))}
                    className="w-full accent-[#89b4fa]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slopeInvert}
                      onChange={(e) => setSlopeInvert(e.target.checked)}
                      className="rounded bg-[#1a1a1a] border-[#444]"
                    />
                    <span className="text-[#ccc]">Invert Mask (Cliff Faces Only)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ALTITUDE MASK */}
          {activeTab === 'altitude' && (
            <div className="space-y-3 p-3 bg-[#242424] border border-[#3e3e3e] rounded-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAltitudeMask}
                    onChange={(e) => setEnableAltitudeMask(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#444] text-[#3d7fb8] focus:ring-0"
                  />
                  <span className="font-medium text-white">Enable Altitude Masking</span>
                </label>
              </div>

              <div className={`space-y-3 ${!enableAltitudeMask ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#aaa]">Lower Height Bound</span>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={altitudeLower}
                      onChange={(e) => setAltitudeLower(parseFloat(e.target.value))}
                      className="w-full accent-[#cba6f7]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#aaa]">Upper Height Bound</span>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={altitudeUpper}
                      onChange={(e) => setAltitudeUpper(parseFloat(e.target.value))}
                      className="w-full accent-[#cba6f7]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={altitudeInvert}
                      onChange={(e) => setAltitudeInvert(e.target.checked)}
                      className="rounded bg-[#1a1a1a] border-[#444]"
                    />
                    <span className="text-[#ccc]">Invert Altitude Mask</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#222] border-t border-[#3e3e3e] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#888] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#a6e3a1]" />
            <span>Multi-Texture Box Projection Active</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#333] hover:bg-[#404040] text-[#ccc] rounded text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Triplanar Fill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
