/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - WebGL diagnostics
 * Created by Victory Ukpong
 */
import React from 'react';
import { Cpu, X, CheckCircle, ShieldCheck, Terminal } from 'lucide-react';

interface GpuDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GpuDiagnosticsModal: React.FC<GpuDiagnosticsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getGpuInfo = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      const gl = gl2 || canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (!gl) return { version: 'Unavailable', vendor: 'Unavailable', renderer: 'WebGL context unavailable', maxTextureSize: 0, maxRenderbufferSize: 0, viewport: 'Unavailable' };
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as any;
      const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
      return {
        version: gl2 ? 'WebGL 2.0' : 'WebGL 1.0',
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
        viewport: viewport ? `${viewport[0]} × ${viewport[1]}` : 'Unavailable',
      };
    } catch (error) {
      return { version: 'Unavailable', vendor: 'Unavailable', renderer: String(error), maxTextureSize: 0, maxRenderbufferSize: 0, viewport: 'Unavailable' };
    }
  };

  const gpu = getGpuInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#2d2d2d] border border-[#555] rounded shadow-2xl w-[480px] max-w-[94vw] cs5-outset overflow-hidden text-xs text-[#ddd]">
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between border-b border-[#444]">
          <div className="flex items-center gap-2 font-bold text-white text-[11px]">
            <Cpu className="w-4 h-4 text-[#3d7fb8]" />
            <span>WebGL Renderer Diagnostics</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:text-[#ff6b6b] rounded cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="p-4 space-y-3 font-sans">
          <div className="bg-[#222] p-3 rounded border border-[#3c3c3c] flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#888] font-mono uppercase tracking-wider block">Active graphics API</span>
              <span className="text-sm font-bold text-[#89b4fa] font-mono">{gpu.version}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#16a34a]/20 border border-[#16a34a]/50 rounded text-[#4ade80] text-[10px] font-bold">
              <CheckCircle className="w-3.5 h-3.5" /><span>{gpu.version === 'Unavailable' ? 'UNAVAILABLE' : 'DETECTED'}</span>
            </div>
          </div>

          <div className="space-y-2 bg-[#222] p-3 rounded border border-[#3c3c3c]">
            <span className="text-[10px] text-[#888] font-mono uppercase tracking-wider block border-b border-[#333] pb-1">Browser-reported renderer</span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <span className="text-[#888]">GPU / Renderer:</span>
              <span className="col-span-2 text-white font-mono break-words">{gpu.renderer || 'Not exposed by browser'}</span>
              <span className="text-[#888]">Vendor:</span>
              <span className="col-span-2 text-[#ccc] font-mono break-words">{gpu.vendor || 'Not exposed by browser'}</span>
              <span className="text-[#888]">Max texture:</span>
              <span className="col-span-2 text-[#e5a038] font-mono">{gpu.maxTextureSize || 'Unavailable'} px</span>
              <span className="text-[#888]">Max renderbuffer:</span>
              <span className="col-span-2 text-[#e5a038] font-mono">{gpu.maxRenderbufferSize || 'Unavailable'} px</span>
              <span className="text-[#888]">Max viewport:</span>
              <span className="col-span-2 text-[#ccc] font-mono">{gpu.viewport}</span>
              <span className="text-[#888]">External service:</span>
              <span className="col-span-2 text-[#4ade80] font-mono flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Not required</span>
            </div>
          </div>

          <div className="bg-[#181818] p-2.5 rounded border border-[#333] font-mono text-[10px] text-[#aaa] space-y-1">
            <div className="flex items-center gap-1 text-[#3d7fb8] font-bold border-b border-[#282828] pb-0.5"><Terminal className="w-3 h-3" /><span>DIAGNOSTIC NOTES</span></div>
            <div>[V3D-API] Renderer uses browser-managed WebGL.</div>
            <div>[V3D-GPU] Vendor and renderer strings may be masked by browser privacy settings.</div>
            <div>[V3D-EXPORT] Preview subdivision is transient and does not alter source mesh data.</div>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-[#252525] border-t border-[#3c3c3c] flex items-center justify-between">
          <span className="text-[10px] text-[#777] font-mono">VUE 3D Canvas · Victory Ukpong</span>
          <button type="button" onClick={onClose} className="px-3 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded text-[11px] font-semibold cursor-pointer border border-[#5ca2db]">Close</button>
        </div>
      </div>
    </div>
  );
};
