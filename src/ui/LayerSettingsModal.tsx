/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Per-Layer PBR Node Setup & Material Settings Modal
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { Layer, LayerPBRSettings } from '../core/types';
import { 
  Sliders, X, Check, Sparkles, Sun, Eye, EyeOff, 
  Workflow, Disc, Flame, Shield, Layers
} from 'lucide-react';

interface LayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  layer: Layer | null;
  onSavePBR: (layerId: string, pbrSettings: LayerPBRSettings) => void;
  onOpenNodeEditor?: () => void;
}

export const LayerSettingsModal: React.FC<LayerSettingsModalProps> = ({
  isOpen,
  onClose,
  layer,
  onSavePBR,
  onOpenNodeEditor,
}) => {
  if (!isOpen || !layer) return null;

  const currentPbr: LayerPBRSettings = layer.pbrSettings || {
    roughness: 0.5,
    metallic: 0.0,
    bumpHeight: 1.0,
    normalStrength: 1.0,
    emissionStrength: 0.0,
    emissionColor: '#ffffff',
    opacity: (layer.opacity ?? 100) / 100,
    enableColor: true,
    enableBump: true,
    reflectionSource: 'hdri',
    reflectionIntensity: 0.8,
    matcapPreset: 'chrome',
  };

  const [pbr, setPbr] = useState<LayerPBRSettings>({ ...currentPbr });
  const [activeTab, setActiveTab] = useState<'pbr' | 'reflections' | 'channels'>('pbr');

  const update = (patch: Partial<LayerPBRSettings>) => {
    setPbr(prev => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    onSavePBR(layer.id, pbr);
    onClose();
  };

  const handleOpenNodes = () => {
    update({ customNodeTreeActive: true });
    onSavePBR(layer.id, { ...pbr, customNodeTreeActive: true });
    onClose();
    if (onOpenNodeEditor) {
      onOpenNodeEditor();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[540px] bg-[#2d2d2d] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[90vh] flex flex-col font-sans">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0 bg-[#242424] border-b border-[#404040]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Layer Material Settings &bull; {layer.name}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#3e3e3e] bg-[#222] px-2 pt-1 gap-1 shrink-0 text-[11px]">
          <button
            onClick={() => setActiveTab('pbr')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'pbr'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#3d7fb8]" />
            <span>PBR Channels</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'channels'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#a6e3a1]" />
            <span>Bump &amp; Color Toggle</span>
          </button>

          <button
            onClick={() => setActiveTab('reflections')}
            className={`px-3 py-1.5 font-medium rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'reflections'
                ? 'bg-[#2d2d2d] border-[#555] text-white border-b-transparent'
                : 'bg-[#1e1e1e] border-transparent text-[#999] hover:text-[#ccc]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-[#fab387]" />
            <span>Reflections (HDRI / Matcap)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-[#ccc]">
          {/* TAB 1: PBR PROPERTIES */}
          {activeTab === 'pbr' && (
            <div className="space-y-3.5">
              {/* Roughness */}
              <div className="p-2.5 bg-[#242424] border border-[#3e3e3e] rounded space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#ddd]">Roughness (Microfacet Scatter)</span>
                  <span className="font-mono text-white text-[11px]">{pbr.roughness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={pbr.roughness}
                  onChange={(e) => update({ roughness: parseFloat(e.target.value) })}
                  className="w-full accent-[#3d7fb8]"
                />
                <div className="flex justify-between text-[10px] text-[#666]">
                  <span>0.0 (Mirror Gloss)</span>
                  <span>1.0 (Diffuse Matte)</span>
                </div>
              </div>

              {/* Metallic */}
              <div className="p-2.5 bg-[#242424] border border-[#3e3e3e] rounded space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#ddd]">Metallic (Conductor Value)</span>
                  <span className="font-mono text-white text-[11px]">{pbr.metallic.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={pbr.metallic}
                  onChange={(e) => update({ metallic: parseFloat(e.target.value) })}
                  className="w-full accent-[#fab387]"
                />
                <div className="flex justify-between text-[10px] text-[#666]">
                  <span>0.0 (Dielectric / Plastic / Wood)</span>
                  <span>1.0 (Pure Metal / Chrome)</span>
                </div>
              </div>

              {/* Bump / Height Depth */}
              <div className="p-2.5 bg-[#242424] border border-[#3e3e3e] rounded space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#ddd]">Bump Height Depth</span>
                  <span className="font-mono text-white text-[11px]">{pbr.bumpHeight.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={pbr.bumpHeight}
                  onChange={(e) => update({ bumpHeight: parseFloat(e.target.value) })}
                  className="w-full accent-[#a6e3a1]"
                />
              </div>

              {/* Normal Strength */}
              <div className="p-2.5 bg-[#242424] border border-[#3e3e3e] rounded space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#ddd]">Normal Map Tangent Scale</span>
                  <span className="font-mono text-white text-[11px]">{pbr.normalStrength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={pbr.normalStrength}
                  onChange={(e) => update({ normalStrength: parseFloat(e.target.value) })}
                  className="w-full accent-[#89b4fa]"
                />
              </div>

              {/* Emission Strength & Color */}
              <div className="p-2.5 bg-[#242424] border border-[#3e3e3e] rounded space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#ff9900]" />
                    <span className="font-medium text-[#ddd]">Emission / Glow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={pbr.emissionColor || '#ffffff'}
                      onChange={(e) => update({ emissionColor: e.target.value })}
                      className="w-6 h-5 bg-transparent border-0 cursor-pointer rounded"
                    />
                    <span className="font-mono text-white text-[11px]">{pbr.emissionStrength.toFixed(1)}x</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.2"
                  value={pbr.emissionStrength}
                  onChange={(e) => update({ emissionStrength: parseFloat(e.target.value) })}
                  className="w-full accent-[#ff9900]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BUMP & COLOR TOGGLE */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-3">
                <h4 className="font-semibold text-white text-[13px] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#a6e3a1]" />
                  <span>Channel Routing &amp; Isolation</span>
                </h4>
                <p className="text-[11px] text-[#999] leading-relaxed">
                  Allow <strong>Bump</strong> to remain fully enabled while <strong>Color</strong> is disabled. 
                  This empowers you to texture paint pure height, emboss, and normal micro-details onto the 3D surface without altering existing diffuse color paint!
                </p>

                <div className="space-y-2.5 pt-2 border-t border-[#333]">
                  {/* Enable Color Toggle */}
                  <label className="flex items-center justify-between p-2.5 bg-[#1e1e1e] border border-[#383838] rounded cursor-pointer hover:border-[#555] transition-colors">
                    <div className="flex items-center gap-2.5">
                      {pbr.enableColor ? <Eye className="w-4 h-4 text-[#3d7fb8]" /> : <EyeOff className="w-4 h-4 text-[#777]" />}
                      <div>
                        <span className="text-white font-medium block">Color Channel (Albedo / Diffuse)</span>
                        <span className="text-[10px] text-[#888]">Paint diffuse RGB data to canvas</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={pbr.enableColor}
                      onChange={(e) => update({ enableColor: e.target.checked })}
                      className="w-4 h-4 rounded bg-[#2a2a2a] border-[#444] text-[#3d7fb8] focus:ring-0"
                    />
                  </label>

                  {/* Enable Bump Toggle */}
                  <label className="flex items-center justify-between p-2.5 bg-[#1e1e1e] border border-[#383838] rounded cursor-pointer hover:border-[#555] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Shield className={`w-4 h-4 ${pbr.enableBump ? 'text-[#a6e3a1]' : 'text-[#777]'}`} />
                      <div>
                        <span className="text-white font-medium block">Bump &amp; Height Channel</span>
                        <span className="text-[10px] text-[#888]">Contribute to surface displacement / Sobel normal perturbation</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={pbr.enableBump}
                      onChange={(e) => update({ enableBump: e.target.checked })}
                      className="w-4 h-4 rounded bg-[#2a2a2a] border-[#444] text-[#a6e3a1] focus:ring-0"
                    />
                  </label>
                </div>

                {!pbr.enableColor && pbr.enableBump && (
                  <div className="p-2.5 bg-[#1a2e22] border border-[#2d5a3d] rounded text-[11px] text-[#a6e3a1] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Pure Bump Detail Mode Active: Strokes and triplanar fills on this layer will sculpt height and normal relief while preserving underlying colors.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REFLECTIONS */}
          {activeTab === 'reflections' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white text-[12px]">Reflection Driver Source</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => update({ reflectionSource: 'hdri' })}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        pbr.reflectionSource === 'hdri'
                          ? 'bg-[#3d7fb8] text-white font-bold'
                          : 'bg-[#1a1a1a] text-[#888] hover:text-[#ccc]'
                      }`}
                    >
                      HDRI Panorama
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ reflectionSource: 'matcap' })}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        pbr.reflectionSource === 'matcap'
                          ? 'bg-[#fab387] text-[#1e1e1e] font-bold'
                          : 'bg-[#1a1a1a] text-[#888] hover:text-[#ccc]'
                      }`}
                    >
                      Matcap Texture
                    </button>
                  </div>
                </div>

                {/* Reflection Intensity Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[#bbb]">Reflection Intensity</span>
                    <span className="font-mono text-white text-[11px]">{pbr.reflectionIntensity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={pbr.reflectionIntensity}
                    onChange={(e) => update({ reflectionIntensity: parseFloat(e.target.value) })}
                    className="w-full accent-[#fab387]"
                  />
                  <p className="text-[10px] text-[#777]">Controls specular Fresnel intensity and reflection highlights in the viewport.</p>
                </div>

                {/* Matcap Preset Picker */}
                {pbr.reflectionSource === 'matcap' && (
                  <div className="space-y-2 pt-2 border-t border-[#333]">
                    <span className="text-[11px] text-[#aaa] font-medium block">Matcap Preset Sphere</span>
                    <div className="grid grid-cols-5 gap-2">
                      {(['chrome', 'ceramic', 'clay', 'pearl', 'gold'] as const).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => update({ matcapPreset: preset })}
                          className={`p-2 rounded border flex flex-col items-center gap-1.5 transition-colors ${
                            pbr.matcapPreset === preset
                              ? 'bg-[#fab387]/20 border-[#fab387] text-white font-bold'
                              : 'bg-[#1a1a1a] border-[#383838] text-[#888] hover:text-[#ccc]'
                          }`}
                        >
                          <Disc className={`w-5 h-5 ${pbr.matcapPreset === preset ? 'text-[#fab387]' : 'text-[#777]'}`} />
                          <span className="capitalize text-[10px]">{preset}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Advanced Node Switch */}
        <div className="p-3 bg-[#222] border-t border-[#3e3e3e] flex items-center justify-between shrink-0">
          {/* Advanced Material Node Switch Button */}
          <button
            type="button"
            onClick={handleOpenNodes}
            className="px-2.5 py-1.5 bg-[#1f2937] hover:bg-[#374151] border border-[#4b5563] text-[#cba6f7] hover:text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="Switch into custom material node setup for advanced users"
          >
            <Workflow className="w-3.5 h-3.5 text-[#cba6f7]" />
            <span>Open in Node Graph</span>
          </button>

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
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Material Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
