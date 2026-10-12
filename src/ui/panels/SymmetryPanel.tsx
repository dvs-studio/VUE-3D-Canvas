/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Symmetry Tool Window Docker
 * Created by Victory Ukpong
 */

import React from 'react';
import { 
  SymmetryConfig, 
  SymmetryAxis, 
  SymmetryDirection, 
  SymmetryOriginMode 
} from '../../tools/symmetryEngine';
import { 
  SplitSquareVertical, 
  Crosshair, 
  Copy, 
  Check, 
  Layers, 
  Sliders, 
  Compass, 
  RotateCw,
  Eye
} from 'lucide-react';

interface SymmetryPanelProps {
  config: SymmetryConfig;
  onChangeConfig: (patch: Partial<SymmetryConfig>) => void;
  onSymmetrize: (allLayers?: boolean) => void;
  activeLayerName: string;
}

export const SymmetryPanel: React.FC<SymmetryPanelProps> = ({
  config,
  onChangeConfig,
  onSymmetrize,
  activeLayerName,
}) => {
  const [applyToAll, setApplyToAll] = React.useState(false);

  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838] p-3 space-y-3.5 overflow-y-auto">
      {/* Target Info */}
      <div className="bg-[#2c2c2c] p-2 rounded border border-[#444] flex items-center justify-between text-[11px]">
        <span className="text-[#888]">Active Layer:</span>
        <span className="font-semibold text-[#89b4fa] font-mono truncate max-w-[140px]">
          {activeLayerName}
        </span>
      </div>

      {/* Axis Selection (X, Y, Z) */}
      <div className="space-y-1.5 bg-[#333] p-2.5 rounded border border-[#444]">
        <label className="text-[11px] font-medium text-[#aaa] block uppercase tracking-wider text-[10px]">
          Symmetry Axis
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['X', 'Y', 'Z'] as SymmetryAxis[]).map((ax) => (
            <button
              key={ax}
              type="button"
              onClick={() => onChangeConfig({ axis: ax })}
              className={`py-1.5 rounded text-xs font-bold border transition-colors cursor-pointer text-center ${
                config.axis === ax
                  ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
                  : 'bg-[#262626] text-[#aaa] border-[#444] hover:bg-[#303030] hover:text-white'
              }`}
            >
              {ax}-Axis
            </button>
          ))}
        </div>
      </div>

      {/* Cloning Direction Selector (+ to - vs - to +) */}
      <div className="space-y-1.5 bg-[#333] p-2.5 rounded border border-[#444]">
        <label className="text-[11px] font-medium text-[#aaa] block uppercase tracking-wider text-[10px]">
          Clone Direction (Side to Overwrite)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['+ to -', '- to +'] as SymmetryDirection[]).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => onChangeConfig({ direction: dir })}
              className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer text-center ${
                config.direction === dir
                  ? 'bg-[#e5a038] text-black border-[#ffd175] shadow-xs'
                  : 'bg-[#262626] text-[#aaa] border-[#444] hover:bg-[#303030] hover:text-white'
              }`}
            >
              {dir === '+ to -' ? '+ → - (Right to Left)' : '- → + (Left to Right)'}
            </button>
          ))}
        </div>
      </div>

      {/* Origin Point Determination: Option 1 vs Option 2 */}
      <div className="space-y-2 bg-[#333] p-2.5 rounded border border-[#444]">
        <label className="text-[11px] font-medium text-[#aaa] block uppercase tracking-wider text-[10px]">
          Symmetry Origin Determination
        </label>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeConfig({ originMode: 'mesh_origin', locatorValue: 0 })}
            className={`p-1.5 rounded text-[10px] border transition-colors cursor-pointer text-center flex flex-col items-center gap-1 ${
              config.originMode === 'mesh_origin'
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#262626] text-[#aaa] border-[#444] hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Option 1: Mesh Origin</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeConfig({ originMode: 'virtual_cursor' })}
            className={`p-1.5 rounded text-[10px] border transition-colors cursor-pointer text-center flex flex-col items-center gap-1 ${
              config.originMode === 'virtual_cursor'
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#262626] text-[#aaa] border-[#444] hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Option 2: 3D Cursor Locator</span>
          </button>
        </div>

        {/* Axis Locator Coordinate Slider & Number Feature */}
        {config.originMode === 'virtual_cursor' && (
          <div className="pt-2 border-t border-[#444] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#bbb]">Axis Locator Position:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  min="-1.5"
                  max="1.5"
                  value={config.locatorValue}
                  onChange={(e) => onChangeConfig({ locatorValue: Number(e.target.value) })}
                  className="w-16 bg-[#202020] border border-[#555] text-white px-1.5 py-0.5 rounded text-right font-mono text-[11px] cs5-inset"
                />
              </div>
            </div>

            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.02"
              value={config.locatorValue}
              onChange={(e) => onChangeConfig({ locatorValue: Number(e.target.value) })}
              className="w-full accent-[#3d7fb8] cursor-pointer"
            />

            <div className="flex justify-between text-[9px] text-[#777] font-mono">
              <span>-1.0</span>
              <span>0.0 (Center)</span>
              <span>+1.0</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Toggles */}
      <div className="space-y-2 bg-[#2d2d2d] p-2.5 rounded border border-[#444]">
        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#eee]">
          <input
            type="checkbox"
            checked={config.activeRealtimeMirror}
            onChange={(e) => onChangeConfig({ activeRealtimeMirror: e.target.checked })}
            className="accent-[#3d7fb8] rounded"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <SplitSquareVertical className="w-3.5 h-3.5 text-[#3d7fb8]" />
            Real-Time Mirror Painting
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#eee]">
          <input
            type="checkbox"
            checked={config.showVirtualCursorPlane}
            onChange={(e) => onChangeConfig({ showVirtualCursorPlane: e.target.checked })}
            className="accent-[#e5a038] rounded"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="w-3.5 h-3.5 text-[#e5a038]" />
            Show 3D Virtual Cursor Plane
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#bbb] pt-1 border-t border-[#444]">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="accent-[#a6e3a1] rounded"
          />
          <span>Clone across all visible layers</span>
        </label>
      </div>

      {/* Symmetrize Action Button */}
      <button
        type="button"
        onClick={() => onSymmetrize(applyToAll)}
        className="w-full py-2 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
        title="Execute side-to-side symmetry cloning onto opposite side"
      >
        <Copy className="w-4 h-4" />
        <span>SYMMETRIZE ({config.axis}-AXIS: {config.direction})</span>
      </button>
    </div>
  );
};
