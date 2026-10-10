/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Exact Blender 2.8+ / ArmorPaint Shader Node Graph Editor
 * Created by Victory Ukpong
 */

import React, { useState, useRef } from 'react';
import { GraphNode, NodeConnection } from '../../core/types';
import { NodeEvaluator } from '../../nodes/nodeEvaluator';
import { createShaderNode } from '../../nodes/blender28Nodes';
import { 
  Plus, 
  Sparkles, 
  Download, 
  Trash2, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw,
  Sliders,
  ChevronDown,
  Layers,
  Smartphone,
  Camera
} from 'lucide-react';

interface NodeGraphPanelProps {
  nodes: GraphNode[];
  connections: NodeConnection[];
  onUpdateNodes: (nodes: GraphNode[]) => void;
  onUpdateConnections: (connections: NodeConnection[]) => void;
  onBakeToLayer: (bakeCanvas: HTMLCanvasElement) => void;
  onExportBlenderSpec: () => void;
}

export const NodeGraphPanel: React.FC<NodeGraphPanelProps> = ({
  nodes,
  connections,
  onUpdateNodes,
  onUpdateConnections,
  onBakeToLayer,
  onExportBlenderSpec,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);

  // Capture Entire Node Setup Screenshot (PNG / JPG)
  const handleExportScreenshot = (format: 'png' | 'jpeg') => {
    setShowScreenshotMenu(false);
    if (!nodes || nodes.length === 0) return;

    // 1. Calculate bounding box of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 220);
      maxY = Math.max(maxY, n.y + 260);
    });

    const padding = 60;
    const graphWidth = Math.max(800, (maxX - minX) + padding * 2);
    const graphHeight = Math.max(600, (maxY - minY) + padding * 2);

    const scale = 2; // High-DPI crisp screenshot
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(graphWidth * scale);
    canvas.height = Math.round(graphHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    // 2. Background Dark Theme Canvas
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, graphWidth, graphHeight);

    // Fine grid
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 1;
    for (let x = 0; x < graphWidth; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, graphHeight);
      ctx.stroke();
    }
    for (let y = 0; y < graphHeight; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(graphWidth, y);
      ctx.stroke();
    }

    // Major grid
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 1.2;
    for (let x = 0; x < graphWidth; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, graphHeight);
      ctx.stroke();
    }
    for (let y = 0; y < graphHeight; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(graphWidth, y);
      ctx.stroke();
    }

    // Title & Metadata
    ctx.fillStyle = '#89b4fa';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('VUE 3D CANVAS · BLENDER 2.8+ SHADER GRAPH SETUP', padding, 32);

    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.fillText(`TOTAL NODES: ${nodes.length}  |  CONNECTIONS: ${connections.length}  |  D3D11 / WASM READY`, padding, 46);

    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    const getSocketColor = (type?: string) => {
      switch (type) {
        case 'color': return '#e5b538';
        case 'vector': return '#6366f1';
        case 'float': return '#a0a0a0';
        case 'shader': return '#4ade80';
        default: return '#e5b538';
      }
    };

    // 3. Draw Bezier Links
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.fromNodeId);
      const toNode = nodes.find(n => n.id === conn.toNodeId);
      if (!fromNode || !toNode) return;

      const fromOutIdx = Math.max(0, fromNode.outputs.findIndex(o => o.id === conn.fromSocketId));
      const toInIdx = Math.max(0, toNode.inputs.findIndex(i => i.id === conn.toSocketId));

      const outSocket = fromNode.outputs[fromOutIdx];
      const wireColor = getSocketColor(outSocket?.type);

      const x1 = fromNode.x + offsetX + 190;
      const y1 = fromNode.y + offsetY + 42 + fromOutIdx * 20;
      const x2 = toNode.x + offsetX;
      const y2 = toNode.y + offsetY + 42 + toInIdx * 20;

      const dist = Math.abs(x2 - x1) * 0.55;

      // Outer glow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + dist, y1, x2 - dist, y2, x2, y2);
      ctx.stroke();

      // Core wire
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + dist, y1, x2 - dist, y2, x2, y2);
      ctx.stroke();
    });

    // 4. Draw Nodes
    nodes.forEach(node => {
      const nx = node.x + offsetX;
      const ny = node.y + offsetY;
      const nw = 190;
      const nh = 38 + Math.max(node.inputs.length, node.outputs.length, 1) * 22 + (node.properties ? 30 : 0);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(nx + 3, ny + 3, nw, nh);

      // Body
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(nx, ny, nw, nh);

      // Border
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      ctx.strokeRect(nx, ny, nw, nh);

      // Header
      let headerBg = '#383838';
      if (node.type === 'principled_bsdf' || node.type === 'material_output') headerBg = '#2b4432';
      else if (node.type.startsWith('tex_') || node.type === 'noise' || node.type === 'voronoi') headerBg = '#4a3b2b';
      else if (node.type === 'mapping' || node.type === 'vector_math') headerBg = '#2b344a';
      else if (node.type === 'color_ramp' || node.type === 'mix_rgb') headerBg = '#442b3b';

      ctx.fillStyle = headerBg;
      ctx.fillRect(nx, ny, nw, 24);
      ctx.strokeStyle = '#555555';
      ctx.strokeRect(nx, ny, nw, 24);

      // Header Title
      ctx.fillStyle = '#f0f0f0';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(node.title, nx + 10, ny + 16);

      // Input Sockets
      node.inputs.forEach((inp, idx) => {
        const sy = ny + 42 + idx * 20;
        ctx.fillStyle = getSocketColor(inp.type);
        ctx.beginPath();
        ctx.arc(nx, sy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#cccccc';
        ctx.font = '10px sans-serif';
        ctx.fillText(inp.name, nx + 9, sy + 3.5);
      });

      // Output Sockets
      node.outputs.forEach((out, idx) => {
        const sy = ny + 42 + idx * 20;
        ctx.fillStyle = getSocketColor(out.type);
        ctx.beginPath();
        ctx.arc(nx + nw, sy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#cccccc';
        ctx.font = '10px sans-serif';
        const tw = ctx.measureText(out.name).width;
        ctx.fillText(out.name, nx + nw - tw - 9, sy + 3.5);
      });
    });

    // 5. Trigger download
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    const dataUrl = canvas.toDataURL(mime, 0.95);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `vue3d_node_setup_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Touch & Mouse Canvas Navigation (Panning & Zooming)
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [zoom, setZoom] = useState(1.0);
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [touchPanMode, setTouchPanMode] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1.0);
  const lastPanPointer = useRef({ x: 0, y: 0 });

  // Canvas pointer down for touch/mouse navigation
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch-to-zoom
    if (activePointers.current.size >= 2) {
      setIsPanningCanvas(false);
      setDraggingNodeId(null);
      const pts = Array.from(activePointers.current.values());
      pinchStartDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartZoom.current = zoom;
      return;
    }

    // Single touch or middle-click / spacebar / touchPanMode = Pan
    if (e.button === 1 || e.altKey || touchPanMode || (e.target === containerRef.current)) {
      setIsPanningCanvas(true);
      lastPanPointer.current = { x: e.clientX, y: e.clientY };
      setSelectedNodeId(null);
    }
  };

  const handlePointerDownNode = (e: React.PointerEvent, node: GraphNode) => {
    e.stopPropagation();
    if (touchPanMode) {
      // In touch pan mode, clicking on a node doesn't drag it, allows scrolling canvas
      setIsPanningCanvas(true);
      lastPanPointer.current = { x: e.clientX, y: e.clientY };
      return;
    }
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX / zoom - node.x,
      y: e.clientY / zoom - node.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Two-finger pinch zoom
    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (pinchStartDist.current && pinchStartDist.current > 0) {
        const factor = currentDist / pinchStartDist.current;
        setZoom(Math.max(0.4, Math.min(2.2, pinchStartZoom.current * factor)));
      }
      return;
    }

    // Canvas panning
    if (isPanningCanvas) {
      const dx = e.clientX - lastPanPointer.current.x;
      const dy = e.clientY - lastPanPointer.current.y;
      lastPanPointer.current = { x: e.clientX, y: e.clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }

    // Dragging individual node
    if (!draggingNodeId) return;
    const updated = nodes.map(n => {
      if (n.id === draggingNodeId) {
        return {
          ...n,
          x: Math.max(0, e.clientX / zoom - dragOffset.x),
          y: Math.max(0, e.clientY / zoom - dragOffset.y),
        };
      }
      return n;
    });
    onUpdateNodes(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
      pinchStartDist.current = null;
    }
    if (activePointers.current.size === 0) {
      setIsPanningCanvas(false);
      setDraggingNodeId(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(z => Math.max(0.4, Math.min(2.2, z + zoomDelta)));
  };

  const handleAddNode = (type: string) => {
    const id = `node_${Date.now()}`;
    const newNode = createShaderNode(type, id, (-pan.x + 200) / zoom, (-pan.y + 150) / zoom);
    onUpdateNodes([...nodes, newNode]);
    setShowAddMenu(false);
    setSelectedNodeId(id);
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    onUpdateNodes(nodes.filter(n => n.id !== selectedNodeId));
    onUpdateConnections(connections.filter(c => c.fromNodeId !== selectedNodeId && c.toNodeId !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleBake = () => {
    const cvs = document.createElement('canvas');
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d');
    if (ctx) {
      NodeEvaluator.bakeToCanvas(nodes, connections, ctx);
      onBakeToLayer(cvs);
    }
  };

  const updateNodeProperty = (nodeId: string, patch: any) => {
    onUpdateNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          properties: { ...n.properties, ...patch },
        };
      }
      return n;
    }));
  };

  const getSocketColor = (type: string) => {
    if (type === 'color') return '#e5b538'; // Yellow
    if (type === 'float') return '#a0a0a0'; // Gray
    if (type === 'vector') return '#6366f1'; // Blue / Violet
    return '#22c55e'; // Green for Shader / BSDF
  };

  return (
    <div 
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full h-full bg-[#1b1b1b] overflow-hidden select-none text-xs text-[#ccc] touch-none cursor-default"
    >
      {/* Background Dot Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, #777 1px, transparent 1px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Top Toolbar */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-2 bg-[#2d2d2d]/95 px-3 py-1.5 rounded border border-[#444] shadow-md cs5-inset">
        <span className="text-[10px] text-[#999] font-mono uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#3d7fb8]" />
          ARMORPAINT / BLENDER 2.8+ SHADER NODES
        </span>

        {/* Add Node Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-2.5 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded text-[11px] font-medium flex items-center gap-1 border border-[#5ca2db]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Node
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#2a2a2a] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] max-h-80 overflow-y-auto cs5-outset">
              {/* Category: Vector */}
              <div className="px-3 py-1 text-[9px] font-mono text-[#89b4fa] font-bold uppercase tracking-wider bg-[#222]">
                VECTOR NODES
              </div>
              <button onClick={() => handleAddNode('mapping')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Vector Mapping
              </button>
              <button onClick={() => handleAddNode('vector_math')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Vector Math
              </button>
              <button onClick={() => handleAddNode('normal_map')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Normal Map
              </button>
              <button onClick={() => handleAddNode('bump')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Bump
              </button>

              {/* Category: Converter */}
              <div className="px-3 py-1 text-[9px] font-mono text-[#a6e3a1] font-bold uppercase tracking-wider bg-[#222]">
                CONVERTER &amp; COLOR
              </div>
              <button onClick={() => handleAddNode('color_ramp')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                ColorRamp (Gradient)
              </button>
              <button onClick={() => handleAddNode('mix_rgb')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Mix RGB (Blend Modes)
              </button>
              <button onClick={() => handleAddNode('math')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Math
              </button>
              <button onClick={() => handleAddNode('invert')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Invert
              </button>
              <button onClick={() => handleAddNode('separate_rgb')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Separate RGB
              </button>
              <button onClick={() => handleAddNode('combine_rgb')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Combine RGB
              </button>

              {/* Category: Texture Generators */}
              <div className="px-3 py-1 text-[9px] font-mono text-[#fab387] font-bold uppercase tracking-wider bg-[#222]">
                PROCEDURAL TEXTURES
              </div>
              <button onClick={() => handleAddNode('noise')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Noise Texture
              </button>
              <button onClick={() => handleAddNode('voronoi')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Voronoi Texture
              </button>
              <button onClick={() => handleAddNode('musgrave')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Musgrave Texture
              </button>
              <button onClick={() => handleAddNode('wave')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Wave Texture
              </button>
              <button onClick={() => handleAddNode('checker')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Checker Texture
              </button>
              <button onClick={() => handleAddNode('brick')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Brick Texture
              </button>

              {/* Category: Input */}
              <div className="px-3 py-1 text-[9px] font-mono text-[#cba6f7] font-bold uppercase tracking-wider bg-[#222]">
                INPUT &amp; SHADER
              </div>
              <button onClick={() => handleAddNode('tex_coord')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Texture Coordinate
              </button>
              <button onClick={() => handleAddNode('image_texture')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Image Texture
              </button>
              <button onClick={() => handleAddNode('rgb')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                RGB Constant
              </button>
              <button onClick={() => handleAddNode('value')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white">
                Value Constant
              </button>
            </div>
          )}
        </div>

        {selectedNodeId && (
          <button
            onClick={handleDeleteSelected}
            className="px-2 py-0.5 bg-[#8b2626] hover:bg-[#a63030] text-white rounded text-[11px] flex items-center gap-1 transition-colors"
            title="Delete Selected Node (Del)"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}

        <button
          onClick={handleBake}
          className="px-2.5 py-0.5 bg-[#2ea043] hover:bg-[#3fb950] text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-sm transition-colors"
          title="Bake procedural texture tree into active texture layer"
        >
          <Sparkles className="w-3 h-3" />
          Bake to Layer
        </button>

        <button
          onClick={onExportBlenderSpec}
          className="px-2 py-0.5 bg-[#444] hover:bg-[#525252] text-[#ddd] rounded text-[11px] flex items-center gap-1 border border-[#555]"
          title="Export node setup as Blender .blend specification"
        >
          <Download className="w-3 h-3 text-[#f97316]" />
          .blend Export
        </button>

        {/* Screenshot Feature (Export entire node setup as PNG or JPG) */}
        <div className="relative">
          <button
            onClick={() => setShowScreenshotMenu(!showScreenshotMenu)}
            className="px-2 py-0.5 bg-[#3a4454] hover:bg-[#48566b] text-[#89b4fa] rounded text-[11px] font-medium flex items-center gap-1 border border-[#50637f] shadow-xs"
            title="Capture entire node setup and export as image"
          >
            <Camera className="w-3 h-3 text-[#89b4fa]" />
            Screenshot
            <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-80" />
          </button>

          {showScreenshotMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[#2a2a2a] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset">
              <div className="px-3 py-1 text-[9px] font-mono text-[#aaa] font-bold uppercase tracking-wider border-b border-[#444] mb-1">
                EXPORT CANVAS
              </div>
              <button
                onClick={() => handleExportScreenshot('png')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#ddd]"
              >
                <span>Export as PNG</span>
                <span className="text-[9px] font-mono text-[#a6e3a1]">.png</span>
              </button>
              <button
                onClick={() => handleExportScreenshot('jpeg')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#ddd]"
              >
                <span>Export as JPG</span>
                <span className="text-[9px] font-mono text-[#fab387]">.jpg</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Touch Navigation On-Screen Toolbar for Mobile / Tablet / WASM */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-[#252525]/90 px-2 py-1 rounded border border-[#444] shadow-md backdrop-blur-xs">
        {/* Touch Pan Mode Toggle */}
        <button
          onClick={() => setTouchPanMode(!touchPanMode)}
          className={`p-1.5 rounded transition-colors text-[10px] flex items-center gap-1 ${
            touchPanMode
              ? 'bg-[#3d7fb8] text-white font-bold'
              : 'hover:bg-[#3a3a3a] text-[#ccc]'
          }`}
          title="Toggle Touch Pan Mode (Drag anywhere to scroll canvas)"
        >
          <Move className="w-3.5 h-3.5" />
          <span>{touchPanMode ? 'PAN ACTIVE' : 'PAN'}</span>
        </button>

        <button
          onClick={() => setZoom(z => Math.min(2.2, z + 0.15))}
          className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => { setZoom(1.0); setPan({ x: 20, y: 20 }); }}
          className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors text-[10px] font-mono"
          title="Reset View 100%"
        >
          100%
        </button>
      </div>

      {/* Zoomable & Pannable World Container */}
      <div 
        className="w-full h-full relative origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Connecting Bezier Noodles */}
        <svg className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none z-10 overflow-visible">
          {connections.map((c) => {
            const fromNode = nodes.find(n => n.id === c.fromNodeId);
            const toNode = nodes.find(n => n.id === c.toNodeId);
            if (!fromNode || !toNode) return null;

            const isBSDF = fromNode.type === 'principled_bsdf';
            const startX = fromNode.x + (isBSDF ? 250 : 200);
            const startY = fromNode.y + 40;
            const endX = toNode.x;
            const endY = toNode.y + 40;
            const deltaX = Math.abs(endX - startX) * 0.5;

            const pathD = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;

            return (
              <path
                key={c.id}
                d={pathD}
                fill="none"
                stroke="#e5b538"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-sm opacity-85"
              />
            );
          })}
        </svg>

        {/* Interactive Shader Node Blocks */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isPrincipled = node.type === 'principled_bsdf';
          const nodeWidth = isPrincipled ? 250 : 200;

          return (
            <div
              key={node.id}
              onPointerDown={(e) => handlePointerDownNode(e, node)}
              className={`absolute bg-[#2d2d2d] border rounded shadow-2xl overflow-hidden cursor-move z-20 ${
                isSelected ? 'border-[#3d7fb8] ring-2 ring-[#3d7fb8]/60 shadow-[#3d7fb8]/20' : 'border-[#444]'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${nodeWidth}px`,
              }}
            >
              {/* Header Color by Node Category */}
              <div className={`px-2.5 py-1 text-[11px] font-bold flex items-center justify-between text-white border-b ${
                isPrincipled
                  ? 'bg-[#1b6b3e] border-[#165632]'
                  : node.type === 'material_output'
                  ? 'bg-[#822a2a] border-[#662020]'
                  : ['noise', 'voronoi', 'musgrave', 'wave', 'brick', 'checker', 'image_texture'].includes(node.type)
                  ? 'bg-[#9c4c23] border-[#7d3b1b]'
                  : node.type === 'color_ramp'
                  ? 'bg-[#2b5375] border-[#1d3d57]'
                  : node.type === 'mapping'
                  ? 'bg-[#4338ca] border-[#3730a3]'
                  : 'bg-[#384353] border-[#2a3442]'
              }`}>
                <span className="truncate">{node.title}</span>
                <span className="text-[9px] text-[#eee]/70 font-mono">DX11</span>
              </div>

              {/* Node Body & Custom Interactive Controls */}
              <div className="p-2 space-y-2 text-[10px]">
                {/* 1. COLORRAMP SPECIAL WIDGET */}
                {node.type === 'color_ramp' && (
                  <div className="space-y-1.5 bg-[#202020] p-1.5 rounded border border-[#404040]">
                    {/* Live Gradient Preview Bar */}
                    <div 
                      className="w-full h-4 rounded border border-[#555] shadow-inner"
                      style={{
                        background: `linear-gradient(to right, ${node.properties.stops?.[0]?.color || '#000'}, ${node.properties.stops?.[1]?.color || '#fff'})`,
                      }}
                    />

                    <div className="flex items-center justify-between gap-1 text-[9px]">
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={node.properties.stops?.[0]?.color || '#000000'}
                          onChange={(e) => {
                            const stops = [...(node.properties.stops || [{ pos: 0, color: '#000' }, { pos: 1, color: '#fff' }])];
                            stops[0] = { ...stops[0], color: e.target.value };
                            updateNodeProperty(node.id, { stops });
                          }}
                          className="w-5 h-5 rounded cursor-pointer border border-[#555] bg-transparent"
                        />
                        <span>Stop 0</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span>Stop 1</span>
                        <input
                          type="color"
                          value={node.properties.stops?.[1]?.color || '#ffffff'}
                          onChange={(e) => {
                            const stops = [...(node.properties.stops || [{ pos: 0, color: '#000' }, { pos: 1, color: '#fff' }])];
                            stops[1] = { ...stops[1], color: e.target.value };
                            updateNodeProperty(node.id, { stops });
                          }}
                          className="w-5 h-5 rounded cursor-pointer border border-[#555] bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. VECTOR MAPPING SPECIAL WIDGET */}
                {node.type === 'mapping' && (
                  <div className="space-y-1 bg-[#202020] p-1.5 rounded border border-[#404040] text-[9px] font-mono">
                    <div className="flex items-center justify-between text-[#89b4fa]">
                      <span>Scale X/Y:</span>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={node.properties.scaleX ?? 1.0}
                          onChange={(e) => updateNodeProperty(node.id, { scaleX: Number(e.target.value) })}
                          className="w-10 bg-[#111] border border-[#555] text-white px-1 rounded text-[9px]"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={node.properties.scaleY ?? 1.0}
                          onChange={(e) => updateNodeProperty(node.id, { scaleY: Number(e.target.value) })}
                          className="w-10 bg-[#111] border border-[#555] text-white px-1 rounded text-[9px]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[#a6e3a1]">
                      <span>Location:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={node.properties.locX ?? 0.0}
                        onChange={(e) => updateNodeProperty(node.id, { locX: Number(e.target.value) })}
                        className="w-14 bg-[#111] border border-[#555] text-white px-1 rounded text-[9px]"
                      />
                    </div>
                  </div>
                )}

                {/* 3. MIX RGB SPECIAL WIDGET */}
                {node.type === 'mix_rgb' && (
                  <div className="space-y-1 bg-[#202020] p-1.5 rounded border border-[#404040]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#aaa]">Blend:</span>
                      <select
                        value={node.properties.blend_mode || 'Mix'}
                        onChange={(e) => updateNodeProperty(node.id, { blend_mode: e.target.value })}
                        className="bg-[#111] border border-[#555] text-white px-1 py-0.5 rounded text-[10px]"
                      >
                        <option value="Mix">Mix</option>
                        <option value="Multiply">Multiply</option>
                        <option value="Screen">Screen</option>
                        <option value="Overlay">Overlay</option>
                        <option value="Add">Add</option>
                        <option value="Subtract">Subtract</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Sockets: Inputs */}
                <div className="space-y-1">
                  {node.inputs.map(inp => (
                    <div key={inp.id} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-1.5 text-[#bbb]">
                        <div 
                          className="w-2.5 h-2.5 rounded-full border border-[#222]" 
                          style={{ backgroundColor: getSocketColor(inp.type) }}
                        />
                        <span className="truncate max-w-[120px]">{inp.name}</span>
                      </div>

                      {inp.value !== undefined && typeof inp.value === 'number' && (
                        <span className="text-[9px] text-[#888] font-mono">{inp.value}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Sockets: Outputs */}
                <div className="border-t border-[#3a3a3a] pt-1 space-y-1">
                  {node.outputs.map(out => (
                    <div key={out.id} className="flex items-center justify-end gap-1.5 py-0.5 text-[#bbb]">
                      <span>{out.name}</span>
                      <div 
                        className="w-2.5 h-2.5 rounded-full border border-[#222]" 
                        style={{ backgroundColor: getSocketColor(out.type) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
