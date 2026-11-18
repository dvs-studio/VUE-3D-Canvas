/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Subdivision Preview Dock
 * Created by Victory Ukpong
 */
import React from 'react';
import { Layers3, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { SubdivisionPreviewOptions } from '../../renderer/subdivisionPreview';

interface SubdivisionPanelProps {
  settings: SubdivisionPreviewOptions;
  onChange: (patch: Partial<SubdivisionPreviewOptions>) => void;
}

export const SubdivisionPanel: React.FC<SubdivisionPanelProps> = ({ settings, onChange }) => (
  <div className="p-3 bg-[#292929] text-[#ccc] text-[11px] space-y-3">
    <div className="flex items-center gap-2 text-[#eee] font-semibold">
      <Layers3 className="w-4 h-4 text-[#3d7fb8]" />
      Subdivision Preview
    </div>
    <label className="flex items-center justify-between gap-3">
      <span>Preview enabled</span>
      <input type="checkbox" checked={settings.enabled} onChange={e => onChange({ enabled: e.target.checked })} className="accent-[#3d7fb8]" />
    </label>
    <div className={settings.enabled ? 'space-y-3' : 'space-y-3 opacity-40 pointer-events-none'}>
      <label className="block space-y-1">
        <span className="text-[#999]">Algorithm</span>
        <select value={settings.algorithm} onChange={e => onChange({ algorithm: e.target.value as SubdivisionPreviewOptions['algorithm'] })} className="w-full bg-[#1d1d1d] border border-[#4b4b4b] rounded px-2 py-1 text-[#eee]">
          <option value="catmull-clark">Catmull-Clark</option>
          <option value="simple">Simple (linear split)</option>
        </select>
      </label>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[#999]">Preview levels</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Decrease subdivision level" onClick={() => onChange({ levels: Math.max(0, settings.levels - 1) as 0 | 1 | 2 })} disabled={settings.levels <= 0} className="p-1 rounded border border-[#555] disabled:opacity-30"><ChevronDown className="w-4 h-4"/></button>
          <strong className="min-w-5 text-center text-[#eee]">{settings.levels}</strong>
          <button type="button" aria-label="Increase subdivision level" onClick={() => onChange({ levels: Math.min(2, settings.levels + 1) as 0 | 1 | 2 })} disabled={settings.levels >= 2} className="p-1 rounded border border-[#555] disabled:opacity-30"><ChevronUp className="w-4 h-4"/></button>
        </div>
      </div>
      <label className="block space-y-1">
        <span className="flex justify-between"><span className="text-[#999]">Sharp angle</span><strong>{Math.round(settings.sharpAngle)}°</strong></span>
        <input type="range" min="0" max="180" step="1" value={settings.sharpAngle} onChange={e => onChange({ sharpAngle: Number(e.target.value) })} className="w-full accent-[#3d7fb8]" />
      </label>
      <label className="block space-y-1">
        <span className="flex justify-between"><span className="text-[#999]">Crease preservation</span><strong>{Math.round(settings.crease * 100)}%</strong></span>
        <input type="range" min="0" max="1" step="0.01" value={settings.crease} onChange={e => onChange({ crease: Number(e.target.value) })} className="w-full accent-[#3d7fb8]" />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>Preserve open boundaries</span>
        <input type="checkbox" checked={settings.boundary} onChange={e => onChange({ boundary: e.target.checked })} className="accent-[#3d7fb8]" />
      </label>
      <label className="block space-y-1">
        <span className="flex justify-between"><span className="text-[#999]">Height displacement</span><strong>{settings.displacement.toFixed(2)}</strong></span>
        <input type="range" min="0" max="0.5" step="0.005" value={settings.displacement} onChange={e => onChange({ displacement: Number(e.target.value) })} className="w-full accent-[#3d7fb8]" />
      </label>
    </div>
    <div className="border-t border-[#414141] pt-2 text-[10px] text-[#888] leading-relaxed">
      Preview only. The original cage, UV coordinates and exported mesh are never modified. Levels are limited to 0–2 to keep the preview responsive.
    </div>
    <button onClick={() => onChange({ enabled: false, levels: 0, displacement: 0 })} className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#333] border border-[#555] rounded text-[#ccc] hover:text-white">
      <RefreshCw className="w-3 h-3" /> Reset preview
    </button>
  </div>
);
