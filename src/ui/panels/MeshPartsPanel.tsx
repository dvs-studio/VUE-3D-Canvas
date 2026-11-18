/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Dynamic Mesh Parts Inventory
 * Created by Victory Ukpong
 */
import React from 'react';
import { Eye, EyeOff, Focus, Layers, RotateCcw } from 'lucide-react';

export interface MeshPartOption {
  id: string;
  name: string;
}

interface MeshPartsPanelProps {
  parts: MeshPartOption[];
  selectedPart: string;
  hiddenParts: string[];
  isolateSelected: boolean;
  onSelectPart: (id: string) => void;
  onTogglePartVisibility: (id: string, visible: boolean) => void;
  onToggleIsolate: (checked: boolean) => void;
  onShowAll: () => void;
  onFrameSelected: (id?: string) => void;
}

export const MeshPartsPanel: React.FC<MeshPartsPanelProps> = ({
  parts,
  selectedPart,
  hiddenParts,
  isolateSelected,
  onSelectPart,
  onTogglePartVisibility,
  onToggleIsolate,
  onShowAll,
  onFrameSelected,
}) => (
  <div className="p-2.5 bg-[#292929] text-[#ccc] text-[11px] space-y-2">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 font-semibold text-[#eee]">
        <Layers className="w-3.5 h-3.5 text-[#3d7fb8]" /> Mesh Parts
        <span className="text-[9px] font-mono text-[#777]">({parts.length})</span>
      </span>
      <button type="button" onClick={onShowAll} className="px-2 py-1 rounded border border-[#555] bg-[#333] hover:bg-[#444] flex items-center gap-1 text-[10px]" title="Show every part and clear isolation">
        <RotateCcw className="w-3 h-3" /> Show All
      </button>
    </div>
    {parts.length === 0 ? (
      <div className="p-3 text-center text-[10px] text-[#888] border border-dashed border-[#4a4a4a] rounded">
        No separate mesh objects or named groups were found in this model.
      </div>
    ) : (
      <>
        <div className="max-h-52 overflow-y-auto border border-[#444] rounded divide-y divide-[#3c3c3c]">
          {parts.map((part, index) => {
            const visible = !hiddenParts.includes(part.id);
            const selected = selectedPart === part.id;
            return (
              <div key={part.id} className={`flex items-center gap-1.5 px-2 py-1.5 ${selected ? 'bg-[#3d7fb8]/20' : 'bg-[#242424]'}`}>
                <button type="button" onClick={() => onSelectPart(part.id)} className="flex-1 min-w-0 flex items-center gap-2 text-left hover:text-white" title={`Select ${part.name}`}>
                  <span className="text-[9px] text-[#777] font-mono w-4">{index + 1}</span>
                  <span className="truncate">{part.name}</span>
                  {selected && <span className="text-[8px] text-[#89b4fa] font-mono">SELECTED</span>}
                </button>
                <button type="button" onClick={() => onTogglePartVisibility(part.id, !visible)} className={`p-1 rounded ${visible ? 'text-[#a6e3a1] hover:bg-[#344b36]' : 'text-[#f38ba8] hover:bg-[#4a3035]'}`} title={visible ? 'Hide this part' : 'Show this part'}>
                  {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button type="button" onClick={() => { onSelectPart(part.id); onToggleIsolate(true); onFrameSelected(part.id); }} className="p-1 rounded text-[#89b4fa] hover:bg-[#303c4f]" title="Isolate and frame this part">
                  <Focus className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-[10px] text-[#bbb]">
          <input type="checkbox" checked={isolateSelected} onChange={e => onToggleIsolate(e.target.checked)} className="accent-[#3d7fb8]" />
          Isolate selected part only
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onFrameSelected} disabled={selectedPart === 'all'} className="flex-1 px-2 py-1.5 rounded border border-[#555] bg-[#333] hover:bg-[#444] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
            <Focus className="w-3 h-3" /> Frame Selected
          </button>
          <span className="px-2 py-1.5 text-[9px] text-[#777] self-center">{parts.length - hiddenParts.length} visible</span>
        </div>
      </>
    )}
    <p className="text-[9px] leading-relaxed text-[#777] border-t border-[#414141] pt-2">
      Visibility and isolation affect the viewport and paint hit-testing. The source mesh remains intact for project saves and exports.
    </p>
  </div>
);
