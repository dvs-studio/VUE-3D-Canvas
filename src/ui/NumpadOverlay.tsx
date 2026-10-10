/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Simulated Numpad Viewport Controller
 * Created by Victory Ukpong
 */

import React from 'react';

interface NumpadOverlayProps {
  onNumpadKey: (key: string, ctrl: boolean) => void;
  isOrtho: boolean;
}

export const NumpadOverlay: React.FC<NumpadOverlayProps> = ({ onNumpadKey, isOrtho }) => {
  return (
    <div className="bg-[#383838] border border-[#555] rounded shadow-xl p-2 select-none w-44 cs5-outset">
      <div className="flex items-center justify-between border-b border-[#494949] pb-1 mb-2">
        <span className="text-[10px] font-bold text-[#b0b0b0] tracking-wider uppercase">SIMULATED NUMPAD</span>
        <span className="text-[9px] font-mono text-[#3d7fb8] bg-[#292929] px-1 rounded border border-[#444]">
          {isOrtho ? 'ORTHO' : 'PERSP'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
        {/* Row 1: 7 (Top), 8, 9 */}
        <button
          onClick={() => onNumpadKey('7', false)}
          className="p-1.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#525252] flex flex-col items-center cs5-inset"
          title="Numpad 7: Top View (Ctrl+7 for Bottom)"
        >
          <span className="font-bold">7</span>
          <span className="text-[8px] text-[#aaa]">TOP</span>
        </button>
        <button
          onClick={() => onNumpadKey('8', false)}
          className="p-1.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#aaa] rounded border border-[#4d4d4d] flex flex-col items-center"
          title="Orbit Up"
        >
          <span className="font-bold">8</span>
          <span className="text-[8px] text-[#888]">▲</span>
        </button>
        <button
          onClick={() => onNumpadKey('9', false)}
          className="p-1.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#aaa] rounded border border-[#4d4d4d] flex flex-col items-center"
          title="Opposite View"
        >
          <span className="font-bold">9</span>
          <span className="text-[8px] text-[#888]">FLIP</span>
        </button>

        {/* Row 2: 4, 5 (Persp/Ortho), 6 */}
        <button
          onClick={() => onNumpadKey('4', false)}
          className="p-1.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#aaa] rounded border border-[#4d4d4d] flex flex-col items-center"
          title="Orbit Left"
        >
          <span className="font-bold">4</span>
          <span className="text-[8px] text-[#888]">◄</span>
        </button>
        <button
          onClick={() => onNumpadKey('5', false)}
          className={`p-1.5 rounded border flex flex-col items-center cs5-inset ${
            isOrtho ? 'bg-[#3d7fb8] text-white border-[#5ca2db]' : 'bg-[#444] text-[#eee] border-[#555]'
          }`}
          title="Numpad 5: Toggle Orthographic / Perspective"
        >
          <span className="font-bold">5</span>
          <span className="text-[8px]">{isOrtho ? 'ORTHO' : 'PERSP'}</span>
        </button>
        <button
          onClick={() => onNumpadKey('6', false)}
          className="p-1.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#aaa] rounded border border-[#4d4d4d] flex flex-col items-center"
          title="Orbit Right"
        >
          <span className="font-bold">6</span>
          <span className="text-[8px] text-[#888]">►</span>
        </button>

        {/* Row 3: 1 (Front), 2, 3 (Right) */}
        <button
          onClick={() => onNumpadKey('1', false)}
          className="p-1.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#525252] flex flex-col items-center cs5-inset"
          title="Numpad 1: Front View (Ctrl+1 for Back)"
        >
          <span className="font-bold">1</span>
          <span className="text-[8px] text-[#aaa]">FRONT</span>
        </button>
        <button
          onClick={() => onNumpadKey('2', false)}
          className="p-1.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-[#aaa] rounded border border-[#4d4d4d] flex flex-col items-center"
          title="Orbit Down"
        >
          <span className="font-bold">2</span>
          <span className="text-[8px] text-[#888]">▼</span>
        </button>
        <button
          onClick={() => onNumpadKey('3', false)}
          className="p-1.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#525252] flex flex-col items-center cs5-inset"
          title="Numpad 3: Right View (Ctrl+3 for Left)"
        >
          <span className="font-bold">3</span>
          <span className="text-[8px] text-[#aaa]">RIGHT</span>
        </button>

        {/* Row 4: 0 (Reset Camera), . (Period - Focus / Frame) */}
        <button
          onClick={() => onNumpadKey('0', false)}
          className="col-span-2 p-1.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#525252] flex items-center justify-center gap-1.5 cs5-inset"
          title="Numpad 0: Reset View / Camera Angle"
        >
          <span className="font-bold">0</span>
          <span className="text-[9px] text-[#aaa]">RESET VIEW</span>
        </button>
        <button
          onClick={() => onNumpadKey('.', false)}
          className="p-1.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#525252] flex flex-col items-center cs5-inset"
          title="Numpad . (Period): Frame Selected Mesh"
        >
          <span className="font-bold">.</span>
          <span className="text-[8px] text-[#aaa]">FRAME</span>
        </button>
      </div>

      <div className="mt-2 text-[9px] text-[#888] flex items-center justify-between border-t border-[#484848] pt-1">
        <span>Hold Ctrl for Invert</span>
        <span className="text-[#3d7fb8]">Active</span>
      </div>
    </div>
  );
};
