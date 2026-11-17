/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Per-layer PBR map controls
 * Created by Victory Ukpong
 */

import React, { useEffect, useState } from 'react';
import { Layer, LayerPBRSettings, BumpRampStop } from '../core/types';
import { Sliders, X, Check, Sun, Flame, Shield, Layers, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

interface LayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  layer: Layer | null;
  onSavePBR: (layerId: string, pbrSettings: LayerPBRSettings) => void;
  onOpenNodeEditor?: () => void;
  uvChannels?: { id: string; name: string }[];
  onSetUVChannel?: (layerId: string, channelId: string) => void;
}

const DEFAULT_RAMP: BumpRampStop[] = [
  { position: 0, height: 0 },
  { position: 1, height: 1 },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

function settingsFor(layer: Layer): LayerPBRSettings {
  const saved = layer.pbrSettings || {} as LayerPBRSettings;
  const channel = layer.channel;
  return {
    roughness: saved.roughness ?? 0.5,
    metallic: saved.metallic ?? 0,
    bumpHeight: saved.bumpHeight ?? 1,
    normalStrength: saved.normalStrength ?? 1,
    emissionStrength: saved.emissionStrength ?? 0,
    emissionColor: saved.emissionColor ?? '#ffffff',
    opacity: saved.opacity ?? (layer.opacity ?? 100) / 100,
    enableColor: saved.enableColor ?? true,
    enableBump: saved.enableBump ?? channel === 'height',
    reflectionSource: saved.reflectionSource ?? 'hdri',
    reflectionIntensity: saved.reflectionIntensity ?? 0.8,
    matcapPreset: saved.matcapPreset ?? 'chrome',
    colorOn: saved.colorOn ?? (channel !== 'normal' && channel !== 'height' && channel !== 'emission'),
    colorInfluence: saved.colorInfluence ?? 1,
    reflectionOn: saved.reflectionOn ?? false,
    reflectionInfluence: saved.reflectionInfluence ?? 0,
    emissionOn: saved.emissionOn ?? channel === 'emission',
    emissionInfluence: saved.emissionInfluence ?? (channel === 'emission' ? 1 : 0),
    bumpOn: saved.bumpOn ?? channel === 'height',
    bumpInfluence: saved.bumpInfluence ?? (channel === 'height' ? 1 : 0),
    bumpRamp: (saved.bumpRamp?.length ? saved.bumpRamp : DEFAULT_RAMP).map(stop => ({
      position: clamp01(stop.position),
      height: clamp01(stop.height),
    })).sort((a, b) => a.position - b.position),
    normalLock: saved.normalLock ?? channel === 'normal',
    customNodeTreeActive: false,
  };
}

export const LayerSettingsModal: React.FC<LayerSettingsModalProps> = ({
  isOpen,
  onClose,
  layer,
  onSavePBR,
  uvChannels = [],
  onSetUVChannel,
}) => {
  const [pbr, setPbr] = useState<LayerPBRSettings | null>(null);

  useEffect(() => {
    setPbr(layer ? settingsFor(layer) : null);
  }, [layer?.id, layer?.pbrSettings, layer?.channel, layer?.opacity]);

  if (!isOpen || !layer || !pbr) return null;

  const update = (patch: Partial<LayerPBRSettings>) => {
    setPbr(previous => previous ? { ...previous, ...patch } : previous);
  };

  const updateRamp = (index: number, patch: Partial<BumpRampStop>) => {
    const next = [...(pbr.bumpRamp || DEFAULT_RAMP)];
    next[index] = { ...next[index], ...patch };
    update({ bumpRamp: next.sort((a, b) => a.position - b.position) });
  };

  const addRampStop = () => {
    const stops = [...(pbr.bumpRamp || DEFAULT_RAMP)].sort((a, b) => a.position - b.position);
    let largestGap = 0;
    let insertAt = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const gap = stops[i + 1].position - stops[i].position;
      if (gap > largestGap) {
        largestGap = gap;
        insertAt = i;
      }
    }
    const position = (stops[insertAt].position + stops[insertAt + 1].position) / 2;
    const height = (stops[insertAt].height + stops[insertAt + 1].height) / 2;
    update({ bumpRamp: [...stops, { position, height }].sort((a, b) => a.position - b.position) });
  };

  const toggleRow = (
    title: string,
    description: string,
    checked: boolean,
    onChange: (value: boolean) => void,
    color: string,
    influence: number,
    onInfluence: (value: number) => void,
  ) => (
    <section className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-2">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="flex items-center gap-2 min-w-0">
          {checked ? <Eye className={`w-4 h-4 shrink-0 ${color}`} /> : <EyeOff className="w-4 h-4 shrink-0 text-[#777]" />}
          <span>
            <strong className="block text-[#eee]">{title}</strong>
            <small className="block text-[#888]">{description}</small>
          </span>
        </span>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-[#3d7fb8]" />
      </label>
      <div className={`flex items-center gap-3 ${checked ? '' : 'opacity-40'}`}>
        <span className="text-[10px] text-[#999] w-20">Influence</span>
        <input type="range" min="0" max="1" step="0.01" disabled={!checked} value={influence} onChange={e => onInfluence(Number(e.target.value))} className="flex-1 accent-[#3d7fb8]" />
        <span className="font-mono text-[#ddd] w-10 text-right">{influence.toFixed(2)}</span>
      </div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[560px] max-w-[94vw] bg-[#2d2d2d] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[90vh] flex flex-col font-sans">
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0 bg-[#242424] border-b border-[#404040]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">Layer Properties · {layer.name}</span>
          </div>
          <button onClick={onClose} className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-3 py-2 bg-[#262626] border-b border-[#3e3e3e] flex items-center gap-2 text-[11px]">
          <span className="text-[#aaa] shrink-0">UV channel</span>
          <select value={layer.uvChannel || 'uv_original'} onChange={e => onSetUVChannel?.(layer.id, e.target.value)} className="flex-1 bg-[#1c1c1c] border border-[#555] text-[#eee] rounded px-2 py-1">
            {(uvChannels.length ? uvChannels : [{ id: 'uv_original', name: 'Original Mesh UVs' }]).map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
          </select>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs text-[#ccc]">
          {toggleRow('Colour / Albedo', 'Contributes this layer to the base-colour map.', !!pbr.colorOn, value => update({ colorOn: value }), 'text-[#89b4fa]', pbr.colorInfluence ?? 1, value => update({ colorInfluence: value }))}
          {toggleRow('Reflection', 'Contributes grayscale reflection strength; export converts it to roughness.', !!pbr.reflectionOn, value => update({ reflectionOn: value }), 'text-[#fab387]', pbr.reflectionInfluence ?? 0, value => update({ reflectionInfluence: value }))}
          {toggleRow('Emission', 'Adds this layer to the combined emissive map.', !!pbr.emissionOn, value => update({ emissionOn: value }), 'text-[#ff9900]', pbr.emissionInfluence ?? 0, value => update({ emissionInfluence: value }))}
          {toggleRow('Bump / Height', 'Contributes ramp-mapped luminance to the combined height map.', !!pbr.bumpOn, value => update({ bumpOn: value }), 'text-[#a6e3a1]', pbr.bumpInfluence ?? 0, value => update({ bumpInfluence: value }))}

          <section className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#a6e3a1]" /><strong className="text-[#eee]">Bump colour ramp</strong></div>
              <button type="button" onClick={addRampStop} className="px-2 py-1 rounded bg-[#333] border border-[#555] text-[#ddd] flex items-center gap-1"><Plus className="w-3 h-3" /> Add stop</button>
            </div>
            <div className="h-5 rounded border border-[#555]" style={{ background: `linear-gradient(90deg, ${(pbr.bumpRamp || DEFAULT_RAMP).map(stop => `rgb(${Math.round(stop.height * 255)},${Math.round(stop.height * 255)},${Math.round(stop.height * 255)}) ${Math.round(stop.position * 100)}%`).join(', ')})` }} />
            {(pbr.bumpRamp || DEFAULT_RAMP).map((stop, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <label className="text-[#999]">Position
                  <input type="number" min="0" max="1" step="0.01" value={stop.position} onChange={e => updateRamp(index, { position: clamp01(Number(e.target.value)) })} className="mt-1 w-full bg-[#1b1b1b] border border-[#555] rounded px-2 py-1 text-[#eee]" />
                </label>
                <label className="text-[#999]">Height
                  <input type="number" min="0" max="1" step="0.01" value={stop.height} onChange={e => updateRamp(index, { height: clamp01(Number(e.target.value)) })} className="mt-1 w-full bg-[#1b1b1b] border border-[#555] rounded px-2 py-1 text-[#eee]" />
                </label>
                <button type="button" disabled={(pbr.bumpRamp || DEFAULT_RAMP).length <= 2} onClick={() => update({ bumpRamp: (pbr.bumpRamp || DEFAULT_RAMP).filter((_, i) => i !== index) })} className="p-2 mt-4 text-[#d88] disabled:opacity-25" title="Remove ramp stop"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <p className="text-[10px] text-[#888]">At least two stops are required. Position samples source luminance; height is the resulting normalized height.</p>
          </section>

          <section className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-2">
            <div className="flex items-center gap-2"><Sun className="w-4 h-4 text-[#fab387]" /><strong className="text-[#eee]">Material preview values</strong></div>
            <label className="flex justify-between items-center gap-3">Base roughness <input type="range" min="0" max="1" step="0.01" value={pbr.roughness} onChange={e => update({ roughness: Number(e.target.value) })} className="w-40 accent-[#fab387]" /><span className="font-mono">{pbr.roughness.toFixed(2)}</span></label>
            <label className="flex justify-between items-center gap-3">Metallic <input type="range" min="0" max="1" step="0.01" value={pbr.metallic} onChange={e => update({ metallic: Number(e.target.value) })} className="w-40 accent-[#fab387]" /><span className="font-mono">{pbr.metallic.toFixed(2)}</span></label>
            <label className="flex justify-between items-center gap-3">Emission strength <input type="range" min="0" max="10" step="0.1" value={pbr.emissionStrength} onChange={e => update({ emissionStrength: Number(e.target.value) })} className="w-40 accent-[#ff9900]" /><span className="font-mono">{pbr.emissionStrength.toFixed(1)}</span></label>
            <label className="flex items-center justify-between">Emission tint <input type="color" value={pbr.emissionColor || '#ffffff'} onChange={e => update({ emissionColor: e.target.value })} className="w-8 h-6 bg-transparent border-0" /></label>
          </section>

          {pbr.normalLock && <div className="p-2 bg-[#1a2e22] border border-[#2d5a3d] rounded text-[#a6e3a1] flex items-center gap-2"><Layers className="w-4 h-4" /> This layer is the locked normal source. Other normal maps will not be mixed with it.</div>}
        </div>

        <div className="p-3 bg-[#222] border-t border-[#3e3e3e] flex items-center justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-3 py-1.5 bg-[#333] hover:bg-[#404040] text-[#ccc] rounded text-xs">Cancel</button>
          <button type="button" onClick={() => { onSavePBR(layer.id, { ...pbr, bumpRamp: (pbr.bumpRamp || DEFAULT_RAMP).slice().sort((a, b) => a.position - b.position) }); onClose(); }} className="px-4 py-1.5 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white rounded text-xs font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Apply Layer Properties</button>
        </div>
      </div>
    </div>
  );
};
