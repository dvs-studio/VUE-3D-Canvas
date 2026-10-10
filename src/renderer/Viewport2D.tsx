/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - 2D UV Texture Map Viewport
 * Created by Victory Ukpong
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  ToolType, 
  BrushPreset, 
  Layer, 
  SelectionMask, 
  VectorPath 
} from '../core/types';
import { BrushEngine } from '../tools/brushEngine';
import { PenVectorTool } from '../tools/penVectorTool';
import { SelectionTool } from '../tools/selectionTool';
import { FillSuite } from '../tools/fillSuite';
import { UndoRingBuffer } from '../core/history';
import { Layers, ZoomIn, ZoomOut, Check, X, MousePointer } from 'lucide-react';

interface Viewport2DProps {
  layers: Layer[];
  activeLayerId: string;
  activeTool: ToolType;
  brush: BrushPreset;
  primaryColor: string;
  secondaryColor: string;
  selectionMask: SelectionMask | null;
  onUpdateSelectionMask: (mask: SelectionMask | null) => void;
  undoBuffer: UndoRingBuffer;
  onTextureUpdated: () => void;
  onColorSampled?: (hex: string) => void;
}

export const Viewport2D: React.FC<Viewport2DProps> = ({
  layers,
  activeLayerId,
  activeTool,
  brush,
  primaryColor,
  secondaryColor,
  selectionMask,
  onUpdateSelectionMask,
  undoBuffer,
  onTextureUpdated,
  onColorSampled,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [penMenu, setPenMenu] = useState<{ x: number; y: number } | null>(null);
  const penToolRef = useRef(new PenVectorTool());
  const isPaintingRef = useRef(false);
  const brushEngine = BrushEngine.getInstance();

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  // Render 2D UV Viewport
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !activeLayer) return;

    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // Checkerboard UV background
    ctx.fillStyle = '#262626';
    ctx.fillRect(0, 0, 1024, 1024);
    for (let y = 0; y < 1024; y += 32) {
      for (let x = 0; x < 1024; x += 32) {
        if ((x / 32 + y / 32) % 2 === 0) {
          ctx.fillStyle = '#2d2d2d';
          ctx.fillRect(x, y, 32, 32);
        }
      }
    }

    // Draw visible layers in order
    layers.forEach(layer => {
      if (!layer.visible) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    });

    drawOverlay();
  }, [layers, activeLayerId, zoom, pan]);

  // Draw overlay (selection marching ants, pen vector paths)
  const drawOverlay = () => {
    const cvs = overlayCanvasRef.current;
    if (!cvs) return;
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 1024);

    // Render Selection Marching Ants
    if (selectionMask && selectionMask.active) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      if (selectionMask.type === 'rect') {
        ctx.strokeRect(selectionMask.bounds.x, selectionMask.bounds.y, selectionMask.bounds.width, selectionMask.bounds.height);
      } else if (selectionMask.type === 'ellipse') {
        const rx = selectionMask.bounds.width / 2;
        const ry = selectionMask.bounds.height / 2;
        ctx.beginPath();
        ctx.ellipse(selectionMask.bounds.x + rx, selectionMask.bounds.y + ry, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (selectionMask.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(selectionMask.points[0].x, selectionMask.points[0].y);
        for (let i = 1; i < selectionMask.points.length; i++) {
          ctx.lineTo(selectionMask.points[i].x, selectionMask.points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Active Pen Vector Path
    const activePath = penToolRef.current.getActivePath();
    if (activePath && activePath.points.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#3d7fb8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(activePath.points[0].x, activePath.points[0].y);
      for (let i = 1; i < activePath.points.length; i++) {
        ctx.lineTo(activePath.points[i].x, activePath.points[i].y);
      }
      if (activePath.closed) ctx.closePath();
      ctx.stroke();

      // Draw anchor handles
      activePath.points.forEach(p => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        ctx.strokeStyle = '#222';
        ctx.strokeRect(p.x - 3, p.y - 3, 6, 6);
      });
      ctx.restore();
    }
  };

  const getCanvasCoords = (e: React.PointerEvent) => {
    const cvs = canvasRef.current;
    if (!cvs) return { x: 0, y: 0 };
    const rect = cvs.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (rect.width)) * 1024;
    const y = ((e.clientY - rect.top) / (rect.height)) * 1024;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) {
      // Right-click for Pen Context Menu
      if (activeTool === 'pen') {
        e.preventDefault();
        setPenMenu({ x: e.clientX, y: e.clientY });
        return;
      }
    }

    if (e.altKey || e.button === 1 || activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getCanvasCoords(e);

    // Pen Tool Point Addition
    if (activeTool === 'pen') {
      penToolRef.current.addPoint(x, y);
      drawOverlay();
      return;
    }

    // Bucket Fill Tool
    if (activeTool === 'bucket' && activeLayer) {
      FillSuite.applyBucketFill(activeLayer.ctx, primaryColor, brush.opacity, selectionMask);
      undoBuffer.pushState('Paint Bucket Fill', layers);
      onTextureUpdated();
      return;
    }

    // Selection Drag Creation
    if (activeTool === 'marquee_rect') {
      onUpdateSelectionMask({
        active: true,
        type: 'rect',
        points: [],
        bounds: { x, y, width: 1, height: 1 },
        inverted: false,
      });
      isPaintingRef.current = true;
      return;
    }

    // Direct Painting on active layer
    if (activeLayer && !activeLayer.locked && activeLayer.visible) {
      isPaintingRef.current = true;
      brushEngine.beginStroke(x, y, e.pressure || 1.0);
      execute2DPaint(x, y, e.pressure || 1.0);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!isPaintingRef.current) return;
    const { x, y } = getCanvasCoords(e);

    if (activeTool === 'marquee_rect' && selectionMask) {
      const w = x - selectionMask.bounds.x;
      const h = y - selectionMask.bounds.y;
      onUpdateSelectionMask({
        ...selectionMask,
        bounds: {
          x: w < 0 ? x : selectionMask.bounds.x,
          y: h < 0 ? y : selectionMask.bounds.y,
          width: Math.abs(w),
          height: Math.abs(h),
        },
      });
      drawOverlay();
      return;
    }

    if (activeLayer) {
      execute2DPaint(x, y, e.pressure || 1.0);
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      brushEngine.endStroke();
      undoBuffer.pushState(`${brush.name} 2D UV Paint`, layers);
      onTextureUpdated();
    }
  };

  const execute2DPaint = (x: number, y: number, pressure: number) => {
    if (!activeLayer) return;
    const ctx = activeLayer.ctx;

    if (activeTool === 'brush') {
      brushEngine.paintDabs(ctx, x, y, brush, pressure, false);
    } else if (activeTool === 'eraser') {
      brushEngine.paintDabs(ctx, x, y, brush, pressure, true);
    } else if (activeTool === 'blur') {
      brushEngine.applyBlurAt(ctx, x, y, brush);
    } else if (activeTool === 'clone') {
      brushEngine.applyCloneStampAt(ctx, x, y, brush);
    } else if (activeTool === 'smudge') {
      brushEngine.applySmudgeAt(ctx, x, y, x, y, brush);
    } else if (activeTool === 'eyedropper' && onColorSampled) {
      const p = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
      onColorSampled(hex);
    }

    onTextureUpdated();
  };

  // Pen Tool Context Actions (Specified in Master Requirements)
  const handleDistributeBrush = () => {
    if (activeLayer) {
      penToolRef.current.distributeBrushAlongPath(activeLayer.ctx, brush);
      undoBuffer.pushState('Distribute Brush Along Path', layers);
      onTextureUpdated();
    }
    setPenMenu(null);
  };

  const handleFillPath = () => {
    if (activeLayer) {
      penToolRef.current.fillPath(activeLayer.ctx, primaryColor, brush.opacity);
      undoBuffer.pushState('Fill Vector Path', layers);
      onTextureUpdated();
    }
    setPenMenu(null);
  };

  const handleConvertPathToSelection = () => {
    const newMask = penToolRef.current.convertPathToSelection();
    if (newMask) {
      onUpdateSelectionMask(newMask);
      drawOverlay();
    }
    setPenMenu(null);
  };

  return (
    <div 
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full bg-[#1e1e1e] overflow-hidden select-none flex items-center justify-center"
    >
      {/* Zoom / Navigation HUD */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-[#2d2d2d]/90 px-2 py-1 rounded border border-[#444] text-[10px] text-[#aaa]">
        <span>2D UV CANVAS</span>
        <span>·</span>
        <span>1024x1024</span>
        <span>·</span>
        <span className="text-[#3d7fb8] font-mono">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Main Canvas Container with Transform */}
      <div 
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.05s linear',
        }}
        className="relative shadow-2xl border-2 border-[#555]"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="block cursor-crosshair"
          style={{ width: '600px', height: '600px' }}
        />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '600px', height: '600px' }}
        />
      </div>

      {/* Pen Tool Context Menu (Master Spec Section 5) */}
      {penMenu && (
        <div 
          className="fixed z-50 bg-[#333] border border-[#555] rounded shadow-2xl py-1 text-xs w-60 cs5-outset select-none"
          style={{ left: `${penMenu.x}px`, top: `${penMenu.y}px` }}
        >
          <div className="px-3 py-1 text-[10px] font-mono text-[#888] border-b border-[#444] uppercase tracking-wider">
            PEN VECTOR ACTIONS
          </div>
          <button
            onClick={handleDistributeBrush}
            className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white text-[#ddd]"
          >
            1. Distribute Brush Along Path
          </button>
          <button
            onClick={handleFillPath}
            className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white text-[#ddd]"
          >
            2. Fill Path with Color
          </button>
          <button
            onClick={handleConvertPathToSelection}
            className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white text-[#ddd]"
          >
            3. Convert Path to Plain Selection
          </button>
          <div className="border-t border-[#444] my-0.5" />
          <button
            onClick={() => { penToolRef.current.clearPath(); drawOverlay(); setPenMenu(null); }}
            className="w-full text-left px-3 py-1 hover:bg-[#8b2626] hover:text-white text-[#aaa]"
          >
            Clear Vector Path
          </button>
        </div>
      )}
    </div>
  );
};
