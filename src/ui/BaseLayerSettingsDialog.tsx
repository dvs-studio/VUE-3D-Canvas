import React from 'react';
import { RotateCcw, X, Save } from 'lucide-react';
import type { BaseLayerSettings } from '../core/types';

interface BaseLayerSettingsDialogProps {
  isOpen: boolean;
  settings: BaseLayerSettings;
  onChange: (patch: Partial<BaseLayerSettings>) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const DEFAULT_BASE_LAYER_SETTINGS: BaseLayerSettings = {
  colorA: '#9c9c9c',
  colorB: '#9c9c9c',
  colorAOpacity: 100,
  colorBOpacity: 100,
  layerOpacity: 100,
};

export const BaseLayerSettingsDialog: React.FC<BaseLayerSettingsDialogProps> = ({
  isOpen, settings, onChange, onSave, onReset, onClose,
}) => {
  if (!isOpen) return null;

  const colourControl = (label: string, key: 'colorA' | 'colorB', opacityKey: 'colorAOpacity' | 'colorBOpacity') => (
    <section className="p-3 rounded border border-[#484848] bg-[#242424] space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-[#ddd]">{label}</label>
        <input aria-label={label} type="color" value={settings[key]} onChange={e => onChange({ [key]: e.target.value })} className="w-12 h-8 bg-transparent border-0 cursor-pointer" />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-[11px] text-[#aaa] w-24">Colour opacity</label>
        <input aria-label={label + ' opacity'} type="range" min="0" max="100" value={settings[opacityKey]} onChange={e => onChange({ [opacityKey]: Number(e.target.value) })} className="flex-1 accent-[#3d7fb8]" />
        <span className="w-10 text-right text-[11px] font-mono text-[#ddd]">{settings[opacityKey]}%</span>
      </div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3">
      <div role="dialog" aria-modal="true" aria-label="Base Layer Properties" className="w-[440px] max-w-[96vw] max-h-[90vh] flex flex-col overflow-hidden rounded border-2 border-[#555] bg-[#303030] shadow-2xl">
        <header className="flex items-center justify-between px-3 py-2 bg-[#222] border-b border-[#484848]">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[#eee]">Base Layer Properties</div>
            <div className="text-[10px] text-[#999] mt-0.5">World-space procedural checker background</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-[#aaa] hover:text-white"><X className="w-4 h-4" /></button>
        </header>
        <div className="p-3 space-y-3 overflow-y-auto text-xs text-[#ccc]">
          <p className="text-[11px] text-[#999]">The checker is generated in world space and sits behind painted colour. Each colour has independent opacity; these opacity values are session-only.</p>
          {colourControl('Checker colour A', 'colorA', 'colorAOpacity')}
          {colourControl('Checker colour B', 'colorB', 'colorBOpacity')}
          <div className="p-2 rounded border border-[#484848] bg-[#242424] flex items-center justify-between">
            <span className="text-[11px] text-[#aaa]">Overall Base Layer opacity</span>
            <span className="font-mono text-[#ddd]">{settings.layerOpacity}%</span>
          </div>
          <div className="h-8 rounded border border-[#555]" style={{ background: `linear-gradient(90deg, ${settings.colorA}, ${settings.colorA} 50%, ${settings.colorB} 50%, ${settings.colorB})`, opacity: Math.max(settings.colorAOpacity, settings.colorBOpacity) / 100 }} />
        </div>
        <footer className="p-3 bg-[#222] border-t border-[#484848] flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onReset} className="px-2.5 py-1.5 rounded border border-[#765c38] text-[#e5b875] hover:bg-[#4a3925] text-xs flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border border-[#555] text-[#ccc] hover:bg-[#3b3b3b] text-xs">Close</button>
            <button type="button" onClick={onSave} className="px-3 py-1.5 rounded bg-[#3d7fb8] text-white hover:bg-[#4a8ec9] text-xs font-semibold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
          </div>
        </footer>
      </div>
    </div>
  );
};
