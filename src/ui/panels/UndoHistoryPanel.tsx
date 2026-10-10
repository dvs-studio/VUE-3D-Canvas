/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - 3-State Ring Buffer History Panel
 * Created by Victory Ukpong
 */

import React, { useEffect, useState } from 'react';
import { UndoRingBuffer } from '../../core/history';
import { WasmMemoryEngine } from '../../core/wasmMemoryEngine';
import { Undo2, Redo2, RotateCcw, Cpu, Database, CheckCircle2 } from 'lucide-react';

interface UndoHistoryPanelProps {
  undoBuffer: UndoRingBuffer;
  onUndo: () => void;
  onRedo: () => void;
}

export const UndoHistoryPanel: React.FC<UndoHistoryPanelProps> = ({
  undoBuffer,
  onUndo,
  onRedo,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return undoBuffer.subscribe(() => {
      setTick(t => t + 1);
    });
  }, [undoBuffer]);

  const slots = undoBuffer.getRingSlots();
  const memoryStats = WasmMemoryEngine.getInstance().getMemoryStats();

  return (
    <div className="flex flex-col h-full text-xs text-[#c8c8c8] select-none bg-[#383838]">
      {/* Header with Undo / Redo Buttons */}
      <div className="p-2 border-b border-[#494949] bg-[#333] flex items-center justify-between">
        <span className="text-[10px] text-[#999] font-mono uppercase tracking-wider">
          RING BUFFER (MAX 3)
        </span>
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

      {/* 3 Circular Ring Buffer Slots */}
      <div className="p-2 space-y-2 flex-1 overflow-y-auto">
        <div className="text-[10px] text-[#aaa] leading-snug">
          Strict 3-slot circular ring buffer. Overwrites oldest state on 4th stroke to prevent RAM bloating on constrained hardware.
        </div>

        <div className="space-y-1.5">
          {slots.map((slot) => (
            <div
              key={slot.slotIndex}
              className={`p-2 rounded border transition-all ${
                slot.isActive
                  ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white'
                  : slot.isFilled
                  ? 'bg-[#2f2f2f] border-[#444] text-[#ccc]'
                  : 'bg-[#262626] border-[#383838] text-[#666]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-bold flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${slot.isActive ? 'bg-[#3d7fb8]' : slot.isFilled ? 'bg-[#22c55e]' : 'bg-[#555]'}`} />
                  SLOT #{slot.slotIndex + 1}
                </span>
                <span>{slot.isActive ? 'ACTIVE HEAD' : slot.isFilled ? 'COMMITTED' : 'VACANT'}</span>
              </div>
              <div className="text-[11px] font-medium mt-1 truncate">
                {slot.description}
              </div>
              {slot.timestamp && (
                <div className="text-[9px] text-[#888] font-mono mt-0.5">
                  {new Date(slot.timestamp).toLocaleTimeString()}
                </div>
              )}
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
            <span>PIXEL BUFFERS</span>
            <span className="text-[#a6e3a1]">{memoryStats.activeBuffers} active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
