/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Projection Painting & External Editor Bridge
 * Created by Victory Ukpong
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Lock, Download, Upload, Check, X, RefreshCw, Sliders, Paintbrush } from 'lucide-react';

interface ProjectionModalProps {
  isOpen: boolean;
  screenshotUrl: string | null;
  onApplyReprojection: (editedCanvas: HTMLCanvasElement) => void;
  onCancel: () => void;
}

export const ProjectionModal: React.FC<ProjectionModalProps> = ({
  isOpen,
  screenshotUrl,
  onApplyReprojection,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paintColor, setPaintColor] = useState('#e74c3c');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stampDecal, setStampDecal] = useState<'none' | 'star' | 'caution' | 'cross'>('none');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize retouch canvas when modal opens
  useEffect(() => {
    if (!isOpen || !screenshotUrl) return;

    const img = new Image();
    img.src = screenshotUrl;
    img.onload = () => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      cvs.width = img.width;
      cvs.height = img.height;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
    };
  }, [isOpen, screenshotUrl]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    if (stampDecal !== 'none') {
      drawDecal(ctx, x, y, stampDecal);
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = paintColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = cvs.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const drawDecal = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
    ctx.save();
    ctx.fillStyle = paintColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    if (type === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const ra = a + Math.PI / 5;
        const r1 = brushSize * 1.5;
        const r2 = brushSize * 0.7;
        if (i === 0) ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        else ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        ctx.lineTo(x + Math.cos(ra) * r2, y + Math.sin(ra) * r2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'cross') {
      const s = brushSize * 1.2;
      ctx.fillRect(x - s / 4, y - s, s / 2, s * 2);
      ctx.fillRect(x - s, y - s / 4, s * 2, s / 4);
    } else if (type === 'caution') {
      // Triangle
      const s = brushSize * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x - s, y + s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  const handleDownloadForExternal = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const link = document.createElement('a');
    link.download = `VUE3D_Projection_${Date.now()}.png`;
    link.href = cvs.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
        }
      };
      img.src = res;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (canvasRef.current) {
      onApplyReprojection(canvasRef.current);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none p-4">
      <div className="w-[880px] max-w-full max-h-[92vh] bg-[#333] border-2 border-[#555] rounded shadow-2xl flex flex-col overflow-hidden cs5-outset">
        {/* Navigation Locked Warning Bar */}
        <div className="bg-[#8b2626] text-white px-4 py-2 flex items-center justify-between font-mono text-xs shadow-md">
          <div className="flex items-center gap-2 font-bold tracking-wider">
            <Lock className="w-4 h-4 animate-pulse" />
            <span>STRICT NAVIGATION LOCK ACTIVE: PROJECTION PAINTING MODE</span>
          </div>
          <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded">
            3D Viewport Locked to Current Camera Frustum
          </span>
        </div>

        {/* Header & Sub-toolbar */}
        <div className="cs5-panel-header px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#eee] font-bold">External Editor Bridge</span>
            <div className="h-4 w-[1px] bg-[#555]" />
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#aaa]">Color:</label>
              <input
                type="color"
                value={paintColor}
                onChange={(e) => setPaintColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border border-[#666] bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#aaa]">Size:</label>
              <input
                type="range"
                min="2"
                max="80"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-[#3d7fb8]"
              />
              <span className="text-[10px] text-[#888] font-mono">{brushSize}px</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStampDecal('none')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  stampDecal === 'none' ? 'bg-[#3d7fb8] text-white' : 'bg-[#444] text-[#ccc]'
                }`}
              >
                Brush
              </button>
              <button
                onClick={() => setStampDecal('star')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  stampDecal === 'star' ? 'bg-[#3d7fb8] text-white' : 'bg-[#444] text-[#ccc]'
                }`}
              >
                ★ Decal
              </button>
              <button
                onClick={() => setStampDecal('caution')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  stampDecal === 'caution' ? 'bg-[#3d7fb8] text-white' : 'bg-[#444] text-[#ccc]'
                }`}
              >
                ▲ Caution
              </button>
              <button
                onClick={() => setStampDecal('cross')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  stampDecal === 'cross' ? 'bg-[#3d7fb8] text-white' : 'bg-[#444] text-[#ccc]'
                }`}
              >
                + Cross
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadForExternal}
              className="px-2.5 py-1 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#666] text-[11px] flex items-center gap-1.5 transition-colors"
              title="Save to Photoshop / Krita"
            >
              <Download className="w-3.5 h-3.5" />
              Send to Photoshop / Krita
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#666] text-[11px] flex items-center gap-1.5 transition-colors"
              title="Upload modified PNG from external editor"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Edited PNG
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Viewport Canvas Frame */}
        <div className="flex-1 bg-[#1a1a1a] p-4 flex items-center justify-center overflow-auto min-h-[380px]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="max-h-[500px] border border-[#555] shadow-2xl cursor-crosshair rounded-xs object-contain"
          />
        </div>

        {/* Instructions and Confirmation Footer */}
        <div className="bg-[#2a2a2a] px-4 py-3 flex items-center justify-between border-t border-[#444]">
          <div className="text-[11px] text-[#aaa]">
            <span>Paint decals or edit externally. Click </span>
            <strong className="text-[#eee]">Apply Projection</strong>
            <span> to cast pixels back onto the 3D model and release the navigation lock.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] rounded border border-[#555] text-xs transition-colors"
            >
              Cancel &amp; Unlock
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              Apply Projection to 3D Mesh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
