/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - 2D UV Texture Map Viewport with Touch Navigation & UV Mesh Overlay
 * Created by Victory Ukpong
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
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
import { BUILTIN_MODELS, parseOBJ } from './modelGeometry';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  X, 
  MousePointer, 
  Move, 
  Smartphone, 
  RotateCcw, 
  Maximize2, 
  Grid, 
  Eye, 
  EyeOff,
  Sliders,
  Paintbrush
} from 'lucide-react';

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
  modelKey?: string;
  customOBJText?: string;
  touchNavEnabled?: boolean;
  onToggleTouchNav?: () => void;
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
  modelKey = 'suzanne',
  customOBJText,
  touchNavEnabled = false,
  onToggleTouchNav,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom Navigation State
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // UV Wireframe Mesh Overlay State
  const [showUVOverlay, setShowUVOverlay] = useState<boolean>(true);
  const [uvOverlayOpacity, setUvOverlayOpacity] = useState<number>(0.65);
  const [uvWireColor, setUvWireColor] = useState<string>('#38bdf8'); // Cyan / Blue default

  // Multi-touch Gestures tracking
  const activePointers = useRef<Map<number, { x: number; y: number; pointerType: string }>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(0.75);
  const pinchStartMidpoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Direct 2D Painting Stroke Interpolation State
  const isPaintingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPressureRef = useRef<number>(1.0);
  const [penMenu, setPenMenu] = useState<{ x: number; y: number } | null>(null);
  const penToolRef = useRef(new PenVectorTool());
  const brushEngine = BrushEngine.getInstance();

  const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];

  // Render 2D Texture Composite Layer
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !activeLayer) return;

    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // CS5 / ArmorPaint Dark Neutral Checkerboard Background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 1024, 1024);
    for (let y = 0; y < 1024; y += 32) {
      for (let x = 0; x < 1024; x += 32) {
        if ((x / 32 + y / 32) % 2 === 0) {
          ctx.fillStyle = '#2b2b2b';
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
  }, [layers, activeLayerId, showUVOverlay, uvOverlayOpacity, uvWireColor, modelKey, customOBJText]);

  // Draw overlay (UV wireframe mesh unwrap, selection marching ants, pen vector paths)
  const drawOverlay = useCallback(() => {
    const cvs = overlayCanvasRef.current;
    if (!cvs) return;
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 1024, 1024);

    // 1. RENDER 3D MODEL UV WIREFRAME MESH OVERLAY
    if (showUVOverlay) {
      try {
        let geom: THREE.BufferGeometry;
        if (customOBJText) {
          geom = parseOBJ(customOBJText);
        } else if (BUILTIN_MODELS[modelKey]) {
          geom = BUILTIN_MODELS[modelKey]().geometry;
        } else {
          geom = BUILTIN_MODELS.suzanne().geometry;
        }

        const uvAttr = geom.attributes.uv;
        if (uvAttr && uvAttr.count > 0) {
          ctx.save();
          ctx.strokeStyle = uvWireColor;
          ctx.globalAlpha = uvOverlayOpacity;
          ctx.lineWidth = 0.85;
          ctx.beginPath();

          const index = geom.index;
          if (index) {
            // Indexed triangle mesh
            const idxArr = index.array;
            for (let i = 0; i < idxArr.length; i += 3) {
              const i0 = idxArr[i];
              const i1 = idxArr[i + 1];
              const i2 = idxArr[i + 2];

              const u0 = uvAttr.getX(i0) * 1024;
              const v0 = (1 - uvAttr.getY(i0)) * 1024;
              const u1 = uvAttr.getX(i1) * 1024;
              const v1 = (1 - uvAttr.getY(i1)) * 1024;
              const u2 = uvAttr.getX(i2) * 1024;
              const v2 = (1 - uvAttr.getY(i2)) * 1024;

              ctx.moveTo(u0, v0);
              ctx.lineTo(u1, v1);
              ctx.lineTo(u2, v2);
              ctx.closePath();
            }
          } else {
            // Non-indexed triangle buffer
            for (let i = 0; i < uvAttr.count; i += 3) {
              const u0 = uvAttr.getX(i) * 1024;
              const v0 = (1 - uvAttr.getY(i)) * 1024;
              const u1 = uvAttr.getX(i + 1) * 1024;
              const v1 = (1 - uvAttr.getY(i + 1)) * 1024;
              const u2 = uvAttr.getX(i + 2) * 1024;
              const v2 = (1 - uvAttr.getY(i + 2)) * 1024;

              ctx.moveTo(u0, v0);
              ctx.lineTo(u1, v1);
              ctx.lineTo(u2, v2);
              ctx.closePath();
            }
          }

          ctx.stroke();

          // Outer UV Tile 0..1 Boundary Box
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = Math.min(1.0, uvOverlayOpacity + 0.2);
          ctx.lineWidth = 1.5;
          ctx.strokeRect(0, 0, 1024, 1024);

          ctx.restore();
        }
      } catch (err) {
        console.error('Error rendering UV wireframe overlay:', err);
      }
    }

    // 2. Render Selection Marching Ants
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

    // 3. Render Active Pen Vector Path
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
  }, [showUVOverlay, uvWireColor, uvOverlayOpacity, modelKey, customOBJText, selectionMask]);

  // Convert screen pointer coordinates to 1024x1024 UV canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const cvs = canvasRef.current;
    if (!cvs) return { x: 0, y: 0 };
    const rect = cvs.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 1024;
    const y = ((clientY - rect.top) / rect.height) * 1024;
    return { x, y };
  };

  // POINTER DOWN: Handles touch navigation vs painting
  const handlePointerDown = (e: React.PointerEvent) => {
    // Record pointer
    activePointers.current.set(e.pointerId, { 
      x: e.clientX, 
      y: e.clientY, 
      pointerType: e.pointerType 
    });

    // Capture pointer on target so quick strokes outside canvas don't drop events
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if not supported
    }

    // Right-click for Pen Context Menu
    if (e.button === 2) {
      if (activeTool === 'pen') {
        e.preventDefault();
        setPenMenu({ x: e.clientX, y: e.clientY });
        return;
      }
    }

    // Two-finger multi-touch gesture start
    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      pinchStartDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartZoom.current = zoom;
      pinchStartMidpoint.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      panStartRef.current = { x: pan.x, y: pan.y };
      isPaintingRef.current = false;
      setIsPanning(true);
      return;
    }

    // Hand tool / Middle click / Alt+drag pan
    if (e.altKey || e.button === 1 || activeTool === 'hand') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    // When Touch Navigation is enabled:
    // Single touch finger pans the 2D canvas, digital stylus pen (or mouse) paints!
    if (touchNavEnabled && e.pointerType === 'touch') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    // DIRECT 2D PAINTING / TOOL EXECUTION
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1.0;

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

    // Direct Paint Stroke Execution on active layer
    if (activeLayer && !activeLayer.locked && activeLayer.visible) {
      isPaintingRef.current = true;
      lastPointRef.current = { x, y };
      lastPressureRef.current = pressure;
      brushEngine.beginStroke(x, y, pressure);
      execute2DPaint(x, y, pressure);
    }
  };

  // POINTER MOVE: Multi-touch pinch/pan or continuous stroke painting
  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { 
        x: e.clientX, 
        y: e.clientY, 
        pointerType: e.pointerType 
      });
    }

    // Multi-touch gestures (Pinch-to-zoom & two-finger pan)
    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);

      if (pinchStartDist.current && pinchStartDist.current > 0) {
        const scale = currentDist / pinchStartDist.current;
        const newZoom = Math.max(0.15, Math.min(6.0, pinchStartZoom.current * scale));
        setZoom(newZoom);

        const currentMid = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        };
        const dx = currentMid.x - pinchStartMidpoint.current.x;
        const dy = currentMid.y - pinchStartMidpoint.current.y;
        setPan({
          x: panStartRef.current.x + dx,
          y: panStartRef.current.y + dy,
        });
      }
      return;
    }

    // Single touch / mouse pan
    if (isPanning) {
      setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
      return;
    }

    // Direct 2D Painting / Tool Interaction
    if (!isPaintingRef.current) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 1.0;

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

    if (activeLayer && lastPointRef.current) {
      // Continuous stroke interpolation between consecutive points
      const dist = Math.hypot(x - lastPointRef.current.x, y - lastPointRef.current.y);
      const stepSize = Math.max(2, brush.size * 0.25);
      const steps = Math.max(1, Math.floor(dist / stepSize));

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const ix = lastPointRef.current.x + (x - lastPointRef.current.x) * t;
        const iy = lastPointRef.current.y + (y - lastPointRef.current.y) * t;
        const ip = lastPressureRef.current + (pressure - lastPressureRef.current) * t;
        execute2DPaint(ix, iy, ip);
      }

      lastPointRef.current = { x, y };
      lastPressureRef.current = pressure;
    }
  };

  // POINTER UP: Clean up touches and commit undo state
  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (activePointers.current.size < 2) {
      pinchStartDist.current = null;
    }

    if (activePointers.current.size === 0) {
      setIsPanning(false);
      if (isPaintingRef.current) {
        isPaintingRef.current = false;
        lastPointRef.current = null;
        brushEngine.endStroke();
        undoBuffer.pushState(`${brush.name} 2D UV Paint`, layers);
        onTextureUpdated();
      }
    }
  };

  // Smooth mouse wheel zoom centered at cursor or canvas
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom(z => Math.max(0.15, Math.min(6.0, z * factor)));
  };

  // Direct paint dab applicator on active texture layer
  const execute2DPaint = (x: number, y: number, pressure: number) => {
    if (!activeLayer) return;

    // Physical temporary selector mask: only paint within active selection
    if (selectionMask && selectionMask.active && !SelectionTool.isPointInSelection(x, y, selectionMask)) {
      return;
    }

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
    } else if (activeTool === 'gradient_linear') {
      FillSuite.applyLinearGradient(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, primaryColor, secondaryColor, brush.opacity, selectionMask);
    } else if (activeTool === 'gradient_radial') {
      FillSuite.applyRadialGradient(ctx, x, y, x + brush.size * 3.5, y, primaryColor, secondaryColor, brush.opacity, selectionMask);
    } else if (activeTool === 'eyedropper' && onColorSampled) {
      const p = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
      onColorSampled(hex);
    }

    onTextureUpdated();
  };

  // Navigation Preset Handlers
  const handleResetZoomPan = () => {
    setZoom(0.75);
    setPan({ x: 0, y: 0 });
  };

  const handleFitToView = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth || 600;
    const ch = containerRef.current.clientHeight || 600;
    const fitScale = Math.min((cw - 40) / 1024, (ch - 40) / 1024);
    setZoom(Math.max(0.2, Math.min(2.0, fitScale)));
    setPan({ x: 0, y: 0 });
  };

  // Pen Tool Context Actions
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

  const handleErasePath = () => {
    if (activeLayer) {
      penToolRef.current.erasePath(activeLayer.ctx);
      undoBuffer.pushState('Erase Vector Path Area', layers);
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
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full bg-[#1b1b1b] overflow-hidden select-none flex items-center justify-center touch-none cursor-default"
    >
      {/* Background Dot Grid for Infinite Canvas Feel */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #666 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Top Left: 2D UV Map HUD Controls */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-2 bg-[#2a2a2a]/95 px-2.5 py-1.5 rounded border border-[#444] shadow-md cs5-inset text-xs text-[#ccc]">
        <div className="flex items-center gap-1 font-bold text-[#eee] uppercase text-[10px]">
          <Paintbrush className="w-3.5 h-3.5 text-[#3d7fb8]" />
          <span>2D UV CANVAS</span>
        </div>
        <span className="text-[#666]">·</span>
        <span className="text-[#888] font-mono text-[10px]">1024×1024</span>
        <span className="text-[#666]">·</span>
        <span className="text-[#3d7fb8] font-mono font-bold text-[10px]">{Math.round(zoom * 100)}%</span>

        <div className="h-3.5 w-px bg-[#444] mx-0.5" />

        {/* UV WIREFRAME MESH OVERLAY TOGGLE */}
        <button
          onClick={() => setShowUVOverlay(v => !v)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1.5 transition-colors border ${
            showUVOverlay
              ? 'bg-[#1e3a5f] text-[#38bdf8] border-[#38bdf8] shadow-xs'
              : 'bg-[#333] hover:bg-[#404040] text-[#888] border-[#555]'
          }`}
          title="Toggle 3D Model UV Mesh Wireframe Overlay on 2D Canvas"
        >
          <Grid className="w-3 h-3" />
          <span>UV Overlay: {showUVOverlay ? 'ON' : 'OFF'}</span>
        </button>

        {/* UV Wireframe Opacity Adjuster when active */}
        {showUVOverlay && (
          <div className="flex items-center gap-1 bg-[#222] px-1.5 py-0.5 rounded border border-[#444]">
            <span className="text-[9px] text-[#888]">Opac:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={uvOverlayOpacity}
              onChange={(e) => setUvOverlayOpacity(Number(e.target.value))}
              className="w-12 accent-[#38bdf8] h-1"
              title="UV Wireframe Overlay Opacity"
            />
            <span className="text-[9px] font-mono text-[#38bdf8]">{Math.round(uvOverlayOpacity * 100)}%</span>
          </div>
        )}
      </div>

      {/* Top Right: Touch Navigation & View Reset Tools */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-[#2a2a2a]/95 p-1 rounded border border-[#444] shadow-md cs5-inset">
        {/* Touch Navigation Mode Toggle */}
        {onToggleTouchNav && (
          <button
            onClick={onToggleTouchNav}
            className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 transition-colors border ${
              touchNavEnabled
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db] shadow-xs'
                : 'bg-[#333] hover:bg-[#404040] text-[#aaa] border-[#555]'
            }`}
            title="Toggle Android / Tablet Touch Navigation (Finger Navigates, Pen Paints)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Touch Nav</span>
          </button>
        )}

        <button
          onClick={() => setZoom(z => Math.min(6.0, z * 1.25))}
          className="p-1 hover:bg-[#404040] text-[#ccc] rounded transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(0.15, z * 0.8))}
          className="p-1 hover:bg-[#404040] text-[#ccc] rounded transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetZoomPan}
          className="p-1 hover:bg-[#404040] text-[#ccc] rounded transition-colors"
          title="Reset View 100%"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleFitToView}
          className="p-1 hover:bg-[#404040] text-[#ccc] rounded transition-colors"
          title="Fit Canvas to View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main 2D Canvas Container with Pan & Zoom Transform */}
      <div 
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.04s ease-out',
        }}
        className="relative shadow-2xl border-2 border-[#555] bg-[#222]"
      >
        {/* Layer 1: Paint Texture Canvas */}
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair touch-none"
          style={{ width: '640px', height: '640px' }}
        />

        {/* Layer 2: UV Wireframe Mesh & Pen Vector & Selection Overlay */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '640px', height: '640px' }}
        />
      </div>

      {/* Pen Tool Context Menu */}
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
            2. Fill Curve Area with Color
          </button>
          <button
            onClick={handleErasePath}
            className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white text-[#ddd]"
          >
            3. Erase Curve Area
          </button>
          <button
            onClick={handleConvertPathToSelection}
            className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white text-[#ddd]"
          >
            4. Convert Curve to Selector Mask
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
