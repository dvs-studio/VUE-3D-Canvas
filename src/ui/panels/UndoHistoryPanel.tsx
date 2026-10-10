/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Normalized Undo & Redo History Panel
 * Created by Victory Ukpong
 */

import React, { useEffect, useState } from 'react';
import { UndoRingBuffer } from '../../core/history';
import { WasmMemoryEngine } from '../../core/wasmMemoryEngine';
import { Undo2, Redo2, Cpu, Database, Save, CheckCircle2 } from 'lucide-react';
import { Layer } from '../../core/types';

interface UndoHistoryPanelProps {
  undoBuffer: UndoRingBuffer;
  layers: Layer[];
  onUndo: () => void;
  onRedo: () => void;
  onJumpToState?: (index: number) => void;
}

export const UndoHistoryPanel: React.FC<UndoHistoryPanelProps> = ({
  undoBuffer,
  layers,
  onUndo,
  onRedo,
  onJumpToState,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return undoBuffer.subscribe(() => {
      setTick(t => t + 1);
    });
  }, [undoBuffer]);

  const historyList = undoBuffer.getHistoryList();
  const memoryStats = WasmMemoryEngine.getInstance().getMemoryStats();

  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838]">
      {/* Header with Undo / Redo Buttons */}
      <div className="p-2 border-b border-[#494949] bg-[#333] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#999] font-mono uppercase tracking-wider">
            HISTORY ({historyList.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!undoBuffer.canUndo()}
            className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors ${
              undoBuffer.canUndo()
                ? 'bg-[#404040] hover:bg-[#4d4d4d] text-white border-[#555]'
                : 'bg-[#292929] text-[#666] border-[#383838] cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!undoBuffer.canRedo()}
            className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors ${
              undoBuffer.canRedo()
                ? 'bg-[#404040] hover:bg-[#4d4d4d] text-white border-[#555]'
                : 'bg-[#292929] text-[#666] border-[#383838] cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3 h-3" />
            Redo
          </button>
        </div>
      </div>

      {/* Normalized History Stack List */}
      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
        <div className="text-[10px] text-[#aaa] leading-snug bg-[#2c2c2c] p-1.5 rounded border border-[#444] mb-2 flex items-start gap-1.5">
          <Save className="w-3.5 h-3.5 text-[#3d7fb8] shrink-0 mt-0.5" />
          <span>
            Normalized undo/redo active. For compact file size, strictly the <strong>last 3 states</strong> are preserved when saving to <strong>.xblend</strong>.
          </span>
        </div>

        <div className="space-y-1">
          {historyList.map((item) => (
            <div
              key={item.id}
              onClick={() => onJumpToState && onJumpToState(item.index)}
              className={`p-1.5 rounded border transition-all cursor-pointer ${
                item.isActive
                  ? 'bg-[#3d7fb8]/35 border-[#3d7fb8] text-white shadow-xs'
                  : 'bg-[#2f2f2f] border-[#444] text-[#ccc] hover:bg-[#383838]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-bold flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-[#3d7fb8]' : 'bg-[#666]'}`} />
                  #{item.index + 1} {item.description}
                </span>
                {item.isCommittedToXBlend && (
                  <span className="text-[9px] text-[#a6e3a1] bg-[#223326] px-1 rounded border border-[#38553e]">
                    .xblend
                  </span>
                )}
              </div>
              <div className="text-[9px] text-[#888] font-mono mt-0.5 flex justify-between">
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                {item.isActive && <span className="text-[#3d7fb8] font-bold">CURRENT</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Live Memory Footprint Telemetry */}
        <div className="mt-3 bg-[#282828] p-2 rounded border border-[#404040] space-y-1 text-[10px] font-mono">
          <div className="flex items-center justify-between text-[#888]">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#3d7fb8]" /> RUST/WASM RAM
            </span>
            <span className="text-[#eee]">{memoryStats.allocatedMB} MB</span>
          </div>
          <div className="flex items-center justify-between text-[#888]">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-[#e5a038]" /> PEAK ALLOC
            </span>
            <span className="text-[#eee]">{memoryStats.peakMB} MB</span>
          </div>
          <div className="flex items-center justify-between text-[#888]">
            <span>SAVE RING BUDGET</span>
            <span className="text-[#a6e3a1]">3-state .xblend</span>
          </div>
        </div>
      </div>
    </div>
  );
};
