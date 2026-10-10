/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Blender-Style 3D Orientation Box Gizmo
 * Created by Victory Ukpong
 */

import React from 'react';

interface BoxGizmoProps {
  rotation: { x: number; y: number };
  onSnapView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => void;
}

export const BoxGizmo: React.FC<BoxGizmoProps> = ({ rotation, onSnapView }) => {
  // Convert spherical angles to 3D CSS transform matrix
  const degX = (rotation.x * 180) / Math.PI;
  const degY = (rotation.y * 180) / Math.PI;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-center select-none pointer-events-auto">
      <div className="text-[10px] text-[#9a9a9a] font-mono tracking-wider mb-1 flex items-center gap-1.5 bg-[#2a2a2a]/80 px-2 py-0.5 rounded border border-[#444]">
        <span>GIZMO</span>
        <span className="text-[#3d7fb8]">DX11</span>
      </div>

      <div 
        className="w-16 h-16 relative perspective-800 cursor-pointer"
        style={{ perspective: '300px' }}
      >
        <div
          className="w-full h-full relative transform-style-3d transition-transform duration-75"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${-degX}deg) rotateY(${degY}deg)`,
          }}
        >
          {/* Front Face (+Z) */}
          <button
            onClick={() => onSnapView('front')}
            title="Snap to Front View (Numpad 1)"
            className="absolute inset-0 w-full h-full bg-[#3a4454] border border-[#52637a] flex items-center justify-center text-[10px] font-bold text-[#89b4fa] hover:bg-[#4b5b75] transition-colors"
            style={{ transform: 'translateZ(32px)' }}
          >
            Y- / FRONT
          </button>

          {/* Back Face (-Z) */}
          <button
            onClick={() => onSnapView('back')}
            title="Snap to Back View (Ctrl+Numpad 1)"
            className="absolute inset-0 w-full h-full bg-[#2a303c] border border-[#444f63] flex items-center justify-center text-[10px] font-bold text-[#89b4fa] hover:bg-[#3b4759] transition-colors"
            style={{ transform: 'rotateY(180deg) translateZ(32px)' }}
          >
            BACK
          </button>

          {/* Right Face (+X) */}
          <button
            onClick={() => onSnapView('right')}
            title="Snap to Right View (Numpad 3)"
            className="absolute inset-0 w-full h-full bg-[#543a3a] border border-[#7a5252] flex items-center justify-center text-[10px] font-bold text-[#f38ba8] hover:bg-[#6e4949] transition-colors"
            style={{ transform: 'rotateY(90deg) translateZ(32px)' }}
          >
            X / RIGHT
          </button>

          {/* Left Face (-X) */}
          <button
            onClick={() => onSnapView('left')}
            title="Snap to Left View (Ctrl+Numpad 3)"
            className="absolute inset-0 w-full h-full bg-[#3c2a2a] border border-[#634444] flex items-center justify-center text-[10px] font-bold text-[#f38ba8] hover:bg-[#523737] transition-colors"
            style={{ transform: 'rotateY(-90deg) translateZ(32px)' }}
          >
            LEFT
          </button>

          {/* Top Face (+Y) */}
          <button
            onClick={() => onSnapView('top')}
            title="Snap to Top View (Numpad 7)"
            className="absolute inset-0 w-full h-full bg-[#3a543e] border border-[#527a58] flex items-center justify-center text-[10px] font-bold text-[#a6e3a1] hover:bg-[#4a6b4f] transition-colors"
            style={{ transform: 'rotateX(90deg) translateZ(32px)' }}
          >
            Z / TOP
          </button>

          {/* Bottom Face (-Y) */}
          <button
            onClick={() => onSnapView('bottom')}
            title="Snap to Bottom View (Ctrl+Numpad 7)"
            className="absolute inset-0 w-full h-full bg-[#2a3c2c] border border-[#446347] flex items-center justify-center text-[10px] font-bold text-[#a6e3a1] hover:bg-[#3b523d] transition-colors"
            style={{ transform: 'rotateX(-90deg) translateZ(32px)' }}
          >
            BOTTOM
          </button>
        </div>
      </div>
    </div>
  );
};
