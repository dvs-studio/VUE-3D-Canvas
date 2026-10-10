/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - About Documentation & Author Attribution Dialog
 * Created by Victory Ukpong
 */

import React from 'react';
import { Box, Cpu, FileCode2, HardDrive, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none p-4">
      <div className="w-[560px] max-w-full bg-[#333333] border-2 border-[#555555] rounded shadow-2xl overflow-hidden cs5-outset text-xs text-[#c8c8c8]">
        {/* Title Bar */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-[#3d7fb8]" />
            <span className="font-bold text-[#eeeeee] uppercase tracking-wider text-[11px]">
              About VUE 3D Canvas
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Hero Branding */}
          <div className="text-center pb-2 border-b border-[#444]">
            <h2 className="text-xl font-bold text-white tracking-tight">
              VUE 3D Canvas
            </h2>
            <p className="text-[11px] text-[#3d7fb8] font-mono mt-0.5">
              High-Performance Lightweight 3D Texturing &amp; Painting Engine
            </p>
            <p className="text-[11px] text-[#999] mt-1">
              Version 1.2.0-LTS · Rust Core / WASM-First / Native Windows
            </p>
          </div>

          {/* Creator Attribution & Embedded Signature */}
          <div className="bg-[#2a2a2a] p-3.5 rounded border border-[#444] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#888] font-mono uppercase tracking-wider">CREATOR &amp; ARCHITECT</span>
              <span className="text-[10px] text-[#22c55e] flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> OPEN SOURCE
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              Victory Ukpong
            </div>
            
            {/* Embedded Signature Asset */}
            <div className="pt-1 pb-1 flex justify-center bg-[#222222] rounded p-2 border border-[#383838]">
              <img
                src="/signature.svg"
                alt="Victory Ukpong - Author Signature"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  // Fallback to inline SVG if public path differs
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Architecture Philosophy */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-[#e0e0e0] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#3d7fb8]" /> Architectural Philosophy
            </h4>
            <p className="text-[11px] text-[#aaa] leading-relaxed">
              Engineered specifically to run smoothly on legacy or resource-constrained hardware as a lightweight alternative to ArmorPaint. Targets strict <strong className="text-[#eee]">DirectX 11</strong> and <strong className="text-[#eee]">OpenGL 2.0 / WebGL</strong> API feature limits, intentionally bypassing heavy D3D12 and ray-tracing overhead.
            </p>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-[#2b2b2b] p-2 rounded border border-[#404040]">
              <div className="text-[#888] text-[9px]">PROJECT FORMAT</div>
              <div className="text-[#eee] font-bold">.xblend</div>
              <div className="text-[#aaa] text-[9px] mt-0.5">Linked 3D assets by default + packed toggle</div>
            </div>
            <div className="bg-[#2b2b2b] p-2 rounded border border-[#404040]">
              <div className="text-[#888] text-[9px]">UNDO MEMORY BUDGET</div>
              <div className="text-[#eee] font-bold">Normalized Stack</div>
              <div className="text-[#aaa] text-[9px] mt-0.5">Full in-session undo/redo; 3 states saved to .xblend</div>
            </div>
            <div className="bg-[#2b2b2b] p-2 rounded border border-[#404040]">
              <div className="text-[#888] text-[9px]">PAINT ENGINE</div>
              <div className="text-[#eee] font-bold">Medibang-Inspired</div>
              <div className="text-[#aaa] text-[9px] mt-0.5">Stroke stabilizer, spacing, scatter jitter</div>
            </div>
            <div className="bg-[#2b2b2b] p-2 rounded border border-[#404040]">
              <div className="text-[#888] text-[9px]">BLENDER INTEROP</div>
              <div className="text-[#eee] font-bold">2.79 / 2.83 LTS</div>
              <div className="text-[#aaa] text-[9px] mt-0.5">Procedural node tree import/export</div>
            </div>
          </div>

          {/* AI Assistance and License */}
          <div className="text-[10px] text-[#777] border-t border-[#404040] pt-2 flex items-center justify-between">
            <span>AI Assistance: Google AI Studio &amp; Grok</span>
            <span>Apache 2.0 / MIT Open Source</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2a2a2a] px-4 py-2.5 flex justify-end border-t border-[#444]">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#444] hover:bg-[#505050] text-white rounded border border-[#666] text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
