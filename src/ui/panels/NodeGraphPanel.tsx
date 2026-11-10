/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Interactive Blender 2.8+ / ArmorPaint Shader Node Graph Editor
 * Created by Victory Ukpong
 * 
 * Supports:
 * - Double-click / double-tap node to enter in-place parameter edit mode
 * - Dual-sided socket visibility checkboxes (inputs on left, outputs on right)
 * - Protruding external connection plugs on node perimeter
 * - 2-Click sequential connection engine with live dynamic rubber-band wire guide
 * - Shift-click multi-branch wiring with visible glowing branch junction dots
 * - Double-click canvas background or tap Done to escape edit mode
 * - Full Photoshop CS5 dark theme adherence (#333333, #2b2b2b, #3c3c3c, #222222)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GraphNode, NodeConnection, NodeSocket } from '../../core/types';
import { NodeEvaluator } from '../../nodes/nodeEvaluator';
import { createShaderNode } from '../../nodes/blender28Nodes';
import { NodeInspectorPopup } from './NodeInspectorPopup';
import { 
  Plus, 
  Sparkles, 
  Download, 
  Trash2, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Camera, 
  LayoutGrid, 
  X, 
  Check, 
  Edit3, 
  ChevronDown,
  GitBranch,
  Unplug
} from 'lucide-react';

interface NodeGraphPanelProps {
  nodes: GraphNode[];
  connections: NodeConnection[];
  onUpdateNodes: (nodes: GraphNode[]) => void;
  onUpdateConnections: (connections: NodeConnection[]) => void;
  onBakeToLayer: (bakeCanvas: HTMLCanvasElement) => void;
  onExportBlenderSpec: () => void;
}

interface ActiveConnectionSource {
  nodeId: string;
  socketId: string;
  socketType: 'input' | 'output';
  dataType: string;
  isBranching: boolean;
  startX: number;
  startY: number;
}

export const NodeGraphPanel: React.FC<NodeGraphPanelProps> = ({
  nodes,
  connections,
  onUpdateNodes,
  onUpdateConnections,
  onBakeToLayer,
  onExportBlenderSpec,
}) => {
  // Navigation State
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(1.0);
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [touchPanMode, setTouchPanMode] = useState(false);

  // Selection & In-Place Node Edit Mode
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Socket Visibility State (keyed by `${nodeId}_${socketId}`)
  const [socketVisibility, setSocketVisibility] = useState<Record<string, boolean>>({});

  // 2-Click Sequential Connection & Rubber-Band Guide State
  const [connectionSource, setConnectionSource] = useState<ActiveConnectionSource | null>(null);
  const [pointerWorldPos, setPointerWorldPos] = useState<{ x: number; y: number } | null>(null);
  const [isBranchModeActive, setIsBranchModeActive] = useState<boolean>(false);

  // UI Menus
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1.0);
  const lastPanPointer = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<{ time: number; nodeId: string | null }>({ time: 0, nodeId: null });
  const [, setRenderTrigger] = useState(0);

  // Force re-render to update SVG noodle layout after DOM updates
  const refreshWireLayout = useCallback(() => {
    setRenderTrigger(t => t + 1);
  }, []);

  // Update wire layout whenever nodes, connections, or editing state changes
  useEffect(() => {
    const timer = setTimeout(refreshWireLayout, 20);
    return () => clearTimeout(timer);
  }, [nodes, connections, editingNodeId, zoom, pan, refreshWireLayout]);

  // Check if a socket is connected to any other node
  const isSocketConnected = useCallback((nodeId: string, socketId: string, socketType: 'input' | 'output') => {
    if (socketType === 'input') {
      return connections.some(c => c.toNodeId === nodeId && c.toSocketId === socketId);
    }
    return connections.some(c => c.fromNodeId === nodeId && c.fromSocketId === socketId);
  }, [connections]);

  // Check if plug should be visible (connected OR explicitly checked by user)
  const isPlugVisible = useCallback((nodeId: string, socketId: string, socketType: 'input' | 'output') => {
    const key = `${nodeId}_${socketId}`;
    if (socketVisibility[key] !== undefined) {
      return socketVisibility[key];
    }
    // Default visible if connected, or default primary sockets
    return isSocketConnected(nodeId, socketId, socketType);
  }, [socketVisibility, isSocketConnected]);

  // Toggle socket visibility checkbox
  const handleToggleSocketVisibility = (nodeId: string, socketId: string, socketType: 'input' | 'output') => {
    const key = `${nodeId}_${socketId}`;
    const currentlyVisible = isPlugVisible(nodeId, socketId, socketType);
    setSocketVisibility(prev => ({
      ...prev,
      [key]: !currentlyVisible,
    }));
    setTimeout(refreshWireLayout, 10);
  };

  // Get socket color by Blender/ArmorPaint standard
  const getSocketColor = (type: string) => {
    switch (type) {
      case 'color': return '#e5b538'; // Yellow
      case 'vector': return '#6366f1'; // Violet/Blue
      case 'float': return '#a0a0a0'; // Silver
      case 'shader': return '#22c55e'; // Green
      default: return '#e5b538';
    }
  };

  // Calculate live coordinates of a plug element inside world container
  const getPlugCoordinates = useCallback((nodeId: string, socketId: string, socketType: 'input' | 'output'): { x: number; y: number } => {
    if (worldRef.current) {
      const el = worldRef.current.querySelector(`[data-plug="${nodeId}_${socketId}"]`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const worldRect = worldRef.current.getBoundingClientRect();
        return {
          x: (elRect.left + elRect.width / 2 - worldRect.left) / zoom,
          y: (elRect.top + elRect.height / 2 - worldRect.top) / zoom,
        };
      }
    }

    // Mathematical fallback if DOM element not yet mounted
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const isBSDF = node.type === 'principled_bsdf';
    const nw = isBSDF ? 250 : 210;

    if (socketType === 'output') {
      const idx = Math.max(0, node.outputs.findIndex(o => o.id === socketId));
      return {
        x: node.x + nw + 6,
        y: node.y + 42 + idx * 24,
      };
    } else {
      const idx = Math.max(0, node.inputs.findIndex(i => i.id === socketId));
      return {
        x: node.x - 6,
        y: node.y + 42 + idx * 24,
      };
    }
  }, [nodes, zoom]);

  // 2-Click Sequential Connection Engine
  const handlePlugClick = (
    e: React.MouseEvent | React.PointerEvent,
    nodeId: string,
    socketId: string,
    socketType: 'input' | 'output',
    dataType: string
  ) => {
    e.stopPropagation();
    const isShiftPressed = (e as React.MouseEvent).shiftKey || isBranchModeActive;

    // STEP 1: If no plug is currently selected as source, set this plug as active
    if (!connectionSource) {
      const coords = getPlugCoordinates(nodeId, socketId, socketType);
      setConnectionSource({
        nodeId,
        socketId,
        socketType,
        dataType,
        isBranching: isShiftPressed && socketType === 'output',
        startX: coords.x,
        startY: coords.y,
      });
      return;
    }

    // If clicking the same plug again, cancel connection
    if (connectionSource.nodeId === nodeId && connectionSource.socketId === socketId) {
      setConnectionSource(null);
      return;
    }

    // STEP 2: Connecting opposite sides (output <-> input) on different nodes
    if (connectionSource.socketType !== socketType) {
      const fromNodeId = connectionSource.socketType === 'output' ? connectionSource.nodeId : nodeId;
      const fromSocketId = connectionSource.socketType === 'output' ? connectionSource.socketId : socketId;
      const toNodeId = connectionSource.socketType === 'input' ? connectionSource.nodeId : nodeId;
      const toSocketId = connectionSource.socketType === 'input' ? connectionSource.socketId : socketId;

      // Disallow self-loop
      if (fromNodeId === toNodeId) return;

      // Ensure target plug is visible
      setSocketVisibility(prev => ({
        ...prev,
        [`${fromNodeId}_${fromSocketId}`]: true,
        [`${toNodeId}_${toSocketId}`]: true,
      }));

      // Filter out any existing input connection to the same input socket
      const filtered = connections.filter(c => !(c.toNodeId === toNodeId && c.toSocketId === toSocketId));
      const newConnection: NodeConnection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromNodeId,
        fromSocketId,
        toNodeId,
        toSocketId,
      };

      onUpdateConnections([...filtered, newConnection]);

      // If branching was initiated with Shift, keep source output plug active!
      if (connectionSource.isBranching && connectionSource.socketType === 'output') {
        // Keep source active for subsequent clicks
      } else {
        setConnectionSource(null);
      }
      setTimeout(refreshWireLayout, 15);
    } else {
      // Switched source to another plug of same type
      const coords = getPlugCoordinates(nodeId, socketId, socketType);
      setConnectionSource({
        nodeId,
        socketId,
        socketType,
        dataType,
        isBranching: isShiftPressed && socketType === 'output',
        startX: coords.x,
        startY: coords.y,
      });
    }
  };

  // Disconnect a specific socket
  const handleDisconnectSocket = (e: React.MouseEvent, nodeId: string, socketId: string, socketType: 'input' | 'output') => {
    e.stopPropagation();
    if (socketType === 'input') {
      onUpdateConnections(connections.filter(c => !(c.toNodeId === nodeId && c.toSocketId === socketId)));
    } else {
      onUpdateConnections(connections.filter(c => !(c.fromNodeId === nodeId && c.fromSocketId === socketId)));
    }
    setTimeout(refreshWireLayout, 15);
  };

  // Canvas Double-Click to Escape Edit Mode
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === worldRef.current) {
      setEditingNodeId(null);
      setSelectedNodeId(null);
      setConnectionSource(null);
    }
  };

  // Canvas Pointer Handling (Pan, Zoom, Drag, Rubber-Band)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch zoom
    if (activePointers.current.size >= 2) {
      setIsPanningCanvas(false);
      setDraggingNodeId(null);
      const pts = Array.from(activePointers.current.values());
      pinchStartDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartZoom.current = zoom;
      return;
    }

    // Touch tap detection for double-tap canvas background
    const now = Date.now();
    if (e.target === containerRef.current || e.target === worldRef.current) {
      if (now - lastTapRef.current.time < 320 && lastTapRef.current.nodeId === null) {
        setEditingNodeId(null);
        setSelectedNodeId(null);
        setConnectionSource(null);
      }
      lastTapRef.current = { time: now, nodeId: null };
    }

    // Pan canvas if middle click, alt key, touch pan mode, or clicking empty canvas
    if (e.button === 1 || e.altKey || touchPanMode || e.target === containerRef.current || e.target === worldRef.current) {
      setIsPanningCanvas(true);
      lastPanPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Track pointer in world coordinates for rubber-band guide
    if (connectionSource && worldRef.current) {
      const wRect = worldRef.current.getBoundingClientRect();
      setPointerWorldPos({
        x: (e.clientX - wRect.left) / zoom,
        y: (e.clientY - wRect.top) / zoom,
      });
    }

    // Two-finger pinch
    if (activePointers.current.size >= 2) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (pinchStartDist.current && pinchStartDist.current > 0) {
        const factor = currentDist / pinchStartDist.current;
        setZoom(Math.max(0.4, Math.min(2.2, pinchStartZoom.current * factor)));
      }
      return;
    }

    // Canvas pan
    if (isPanningCanvas) {
      const dx = e.clientX - lastPanPointer.current.x;
      const dy = e.clientY - lastPanPointer.current.y;
      lastPanPointer.current = { x: e.clientX, y: e.clientY };
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }

    // Node dragging
    if (draggingNodeId) {
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
      refreshWireLayout();
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
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

  // Node Interaction: Click, Double-Click / Double-Tap to Edit
  const handleNodePointerDown = (e: React.PointerEvent, node: GraphNode) => {
    e.stopPropagation();
    if (touchPanMode) {
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

    // Touch double-tap detection to enter edit mode
    const now = Date.now();
    if (now - lastTapRef.current.time < 320 && lastTapRef.current.nodeId === node.id) {
      setEditingNodeId(node.id);
    }
    lastTapRef.current = { time: now, nodeId: node.id };
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setSelectedNodeId(node.id);
  };

  // Node Property Updates
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

  const updateNodeInputValue = (nodeId: string, socketId: string, value: any) => {
    onUpdateNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          inputs: n.inputs.map(inp => (inp.id === socketId ? { ...inp, value } : inp)),
        };
      }
      return n;
    }));
  };

  const handleAddNode = (type: string) => {
    const id = `node_${Date.now()}`;
    const newNode = createShaderNode(type, id, (-pan.x + 220) / zoom, (-pan.y + 160) / zoom);
    onUpdateNodes([...nodes, newNode]);
    setShowAddMenu(false);
    setSelectedNodeId(id);
    setEditingNodeId(id); // Immediately editable
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    onUpdateNodes(nodes.filter(n => n.id !== selectedNodeId));
    onUpdateConnections(connections.filter(c => c.fromNodeId !== selectedNodeId && c.toNodeId !== selectedNodeId));
    if (editingNodeId === selectedNodeId) setEditingNodeId(null);
    setSelectedNodeId(null);
  };

  const handleAutoArrange = () => {
    if (nodes.length === 0) return;
    const columns: GraphNode[][] = [[], [], [], [], [], []];

    nodes.forEach(n => {
      if (['tex_coord', 'uv_map', 'image_texture', 'rgb', 'value'].includes(n.type)) {
        columns[0].push(n);
      } else if (['mapping', 'vector_transform', 'vector_math'].includes(n.type)) {
        columns[1].push(n);
      } else if (['noise', 'voronoi', 'musgrave', 'wave', 'brick', 'checker', 'math', 'bump', 'normal_map'].includes(n.type)) {
        columns[2].push(n);
      } else if (['color_ramp', 'mix_rgb', 'invert', 'separate_rgb', 'combine_rgb'].includes(n.type)) {
        columns[3].push(n);
      } else if (['principled_bsdf', 'emission'].includes(n.type)) {
        columns[4].push(n);
      } else if (n.type === 'material_output') {
        columns[5].push(n);
      } else {
        columns[2].push(n);
      }
    });

    const rearranged: GraphNode[] = [];
    const startX = 60;
    const colWidth = 290;
    const startY = 80;

    columns.forEach((colList, colIdx) => {
      colList.forEach((node, rowIdx) => {
        rearranged.push({
          ...node,
          x: startX + colIdx * colWidth,
          y: startY + rowIdx * 280,
        });
      });
    });

    onUpdateNodes(rearranged);
    setTimeout(refreshWireLayout, 20);
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

  // Screenshot Export
  const handleExportScreenshot = (format: 'png' | 'jpeg') => {
    setShowScreenshotMenu(false);
    if (!nodes || nodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 250);
      maxY = Math.max(maxY, n.y + 300);
    });

    const padding = 60;
    const graphWidth = Math.max(800, (maxX - minX) + padding * 2);
    const graphHeight = Math.max(600, (maxY - minY) + padding * 2);

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(graphWidth * scale);
    canvas.height = Math.round(graphHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, graphWidth, graphHeight);

    // Title & Metadata
    ctx.fillStyle = '#89b4fa';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('VUE 3D CANVAS · SHADER NODE GRAPH SETUP', padding, 32);

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

  // Group connections by output socket to render shared multi-branch junctions
  const outputConnectionGroups = connections.reduce<Record<string, NodeConnection[]>>((acc, conn) => {
    const key = `${conn.fromNodeId}_${conn.fromSocketId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(conn);
    return acc;
  }, {});

  return (
    <div 
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerCancel={handleCanvasPointerUp}
      onDoubleClick={handleCanvasDoubleClick}
      onWheel={handleWheel}
      className="relative w-full h-full bg-[#1b1b1b] overflow-hidden select-none text-xs text-[#ccc] touch-none cursor-default font-sans"
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

      {/* Top Main Toolbar */}
      <div className="absolute top-2 left-2 z-40 flex items-center gap-2 bg-[#2b2b2b]/95 px-3 py-1.5 rounded border border-[#444] shadow-md cs5-inset">
        <span className="text-[10px] text-[#999] font-mono uppercase tracking-wider flex items-center gap-1 font-bold">
          <Layers className="w-3.5 h-3.5 text-[#3d7fb8]" />
          ARMORPAINT / BLENDER 2.8+ SHADER NODES
        </span>

        {/* Add Node Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-2.5 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded text-[11px] font-medium flex items-center gap-1 border border-[#5ca2db] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Node
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#2a2a2a] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] max-h-80 overflow-y-auto cs5-outset">
              <div className="px-3 py-1 text-[9px] font-mono text-[#89b4fa] font-bold uppercase tracking-wider bg-[#222]">
                VECTOR NODES
              </div>
              <button onClick={() => handleAddNode('mapping')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Vector Mapping
              </button>
              <button onClick={() => handleAddNode('vector_transform')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#89b4fa] cursor-pointer">
                <span>Vector Transform</span>
                <span className="text-[9px] font-mono opacity-80">3D</span>
              </button>
              <button onClick={() => handleAddNode('vector_math')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Vector Math
              </button>
              <button onClick={() => handleAddNode('normal_map')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Normal Map
              </button>
              <button onClick={() => handleAddNode('bump')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Bump
              </button>

              <div className="px-3 py-1 text-[9px] font-mono text-[#a6e3a1] font-bold uppercase tracking-wider bg-[#222]">
                CONVERTER &amp; COLOR
              </div>
              <button onClick={() => handleAddNode('color_ramp')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                ColorRamp (Gradient)
              </button>
              <button onClick={() => handleAddNode('mix_rgb')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Mix RGB (Blend Modes)
              </button>
              <button onClick={() => handleAddNode('math')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Math
              </button>
              <button onClick={() => handleAddNode('invert')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Invert
              </button>

              <div className="px-3 py-1 text-[9px] font-mono text-[#fab387] font-bold uppercase tracking-wider bg-[#222]">
                PROCEDURAL TEXTURES
              </div>
              <button onClick={() => handleAddNode('noise')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Noise Texture
              </button>
              <button onClick={() => handleAddNode('voronoi')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Voronoi Texture
              </button>
              <button onClick={() => handleAddNode('musgrave')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Musgrave Texture
              </button>
              <button onClick={() => handleAddNode('wave')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Wave Texture
              </button>
              <button onClick={() => handleAddNode('brick')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Brick Texture
              </button>

              <div className="px-3 py-1 text-[9px] font-mono text-[#cba6f7] font-bold uppercase tracking-wider bg-[#222]">
                INPUT &amp; SHADER
              </div>
              <button onClick={() => handleAddNode('uv_map')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#89b4fa] cursor-pointer">
                <span>UV Map</span>
                <span className="text-[9px] font-mono opacity-80">UV</span>
              </button>
              <button onClick={() => handleAddNode('emission')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#ffb86c] cursor-pointer">
                <span>Emission</span>
                <span className="text-[9px] font-mono opacity-80">GLOW</span>
              </button>
              <button onClick={() => handleAddNode('tex_coord')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Texture Coordinate
              </button>
              <button onClick={() => handleAddNode('rgb')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                RGB Constant
              </button>
              <button onClick={() => handleAddNode('value')} className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white cursor-pointer">
                Value Constant
              </button>
            </div>
          )}
        </div>

        {/* Auto Arrange */}
        <button
          onClick={handleAutoArrange}
          className="px-2.5 py-1 bg-[#333] hover:bg-[#404040] text-[#a6e3a1] rounded text-[11px] font-medium flex items-center gap-1 border border-[#555] transition-colors cursor-pointer"
          title="Auto-arrange and sort nodes into clean hierarchical columns"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#a6e3a1]" />
          <span>Auto Arrange</span>
        </button>

        {/* Multi-Branch Shift Mode Toggle for Touch / Fast Access */}
        <button
          onClick={() => setIsBranchModeActive(!isBranchModeActive)}
          className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 border transition-colors cursor-pointer ${
            isBranchModeActive
              ? 'bg-[#e5a038] text-black font-bold border-[#ffc107]'
              : 'bg-[#333] hover:bg-[#404040] text-[#ccc] border-[#555]'
          }`}
          title="Toggle Multi-Branch mode: output plug splits to multiple destination plugs with junction dot (or hold Shift while clicking plug)"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Branch Mode {isBranchModeActive ? 'ON' : 'OFF'}</span>
        </button>

        {selectedNodeId && (
          <button
            onClick={handleDeleteSelected}
            className="px-2 py-0.5 bg-[#8b2626] hover:bg-[#a63030] text-white rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Delete Selected Node (Del)"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}

        <button
          onClick={handleBake}
          className="px-2.5 py-0.5 bg-[#2ea043] hover:bg-[#3fb950] text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
          title="Bake this graph onto the active layer. It replaces that layer's pixels. The layer's UV channel is chosen in Layer Settings."
        >
          <Sparkles className="w-3 h-3" />
          Bake to Layer
        </button>

        <button
          onClick={onExportBlenderSpec}
          className="px-2 py-0.5 bg-[#444] hover:bg-[#525252] text-[#ddd] rounded text-[11px] flex items-center gap-1 border border-[#555] cursor-pointer"
          title="Export node setup as Blender .blend specification"
        >
          <Download className="w-3 h-3 text-[#f97316]" />
          .blend Export
        </button>

        {/* Screenshot */}
        <div className="relative">
          <button
            onClick={() => setShowScreenshotMenu(!showScreenshotMenu)}
            className="px-2 py-0.5 bg-[#3a4454] hover:bg-[#48566b] text-[#89b4fa] rounded text-[11px] font-medium flex items-center gap-1 border border-[#50637f] cursor-pointer"
            title="Capture entire node setup and export as image"
          >
            <Camera className="w-3 h-3 text-[#89b4fa]" />
            Screenshot
            <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-80" />
          </button>

          {showScreenshotMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[#2a2a2a] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset">
              <button
                onClick={() => handleExportScreenshot('png')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#ddd] cursor-pointer"
              >
                <span>Export as PNG</span>
                <span className="text-[9px] font-mono text-[#a6e3a1]">.png</span>
              </button>
              <button
                onClick={() => handleExportScreenshot('jpeg')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#ddd] cursor-pointer"
              >
                <span>Export as JPG</span>
                <span className="text-[9px] font-mono text-[#fab387]">.jpg</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Right Navigation Controls */}
      <div className="absolute top-2 right-2 z-40 flex items-center gap-1 bg-[#2b2b2b]/95 px-2 py-1 rounded border border-[#444] shadow-md">
        <button
          onClick={() => setTouchPanMode(!touchPanMode)}
          className={`p-1.5 rounded transition-colors text-[10px] flex items-center gap-1 cursor-pointer ${
            touchPanMode ? 'bg-[#3d7fb8] text-white font-bold' : 'hover:bg-[#3a3a3a] text-[#ccc]'
          }`}
          title="Toggle Touch Pan Mode"
        >
          <Move className="w-3.5 h-3.5" />
          <span>{touchPanMode ? 'PAN ACTIVE' : 'PAN'}</span>
        </button>

        <button
          onClick={() => setZoom(z => Math.min(2.2, z + 0.15))}
          className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => { setZoom(1.0); setPan({ x: 40, y: 40 }); }}
          className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors text-[10px] font-mono cursor-pointer"
          title="Reset View 100%"
        >
          100%
        </button>
      </div>

      {/* Active Edit Mode Status Banner */}
      {editingNodeId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 bg-[#2b2b2b]/95 border-2 border-[#3d7fb8] shadow-2xl px-4 py-1.5 rounded-full flex items-center gap-3 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#eee]">
            <span className="w-2 h-2 rounded-full bg-[#3d7fb8] animate-pulse" />
            <span className="font-bold text-[#89b4fa]">EDITING NODE:</span>
            <span className="font-mono">{nodes.find(n => n.id === editingNodeId)?.title}</span>
          </div>
          <span className="text-[10px] text-[#aaa]">Check sockets to expose outer plugs · Double-click outside to exit</span>
          <button
            onClick={() => setEditingNodeId(null)}
            className="px-2.5 py-0.5 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <Check className="w-3 h-3" />
            <span>Done</span>
          </button>
        </div>
      )}

      {/* Active Connection Guide Banner */}
      {connectionSource && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 bg-[#1e1e1e]/95 border border-[#e5a038] shadow-xl px-4 py-1.5 rounded-full flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#e5a038] animate-ping" />
          <span className="text-xs text-[#eee]">
            Connecting <span className="text-[#e5a038] font-bold">{connectionSource.socketType.toUpperCase()}</span> plug... Click target plug on another node
          </span>
          {connectionSource.isBranching && (
            <span className="bg-[#e5a038]/20 text-[#e5a038] px-2 py-0.5 rounded text-[10px] font-bold">
              Multi-Branch Active
            </span>
          )}
          <button
            onClick={() => setConnectionSource(null)}
            className="text-[#aaa] hover:text-white p-0.5 cursor-pointer"
            title="Cancel Connection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Zoomable & Pannable World Container */}
      <div 
        ref={worldRef}
        className="w-full h-full relative origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Bezier Cables with Multi-Branch Junction Dots */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-10 overflow-visible">
          {/* Render Connections Grouped by Output Socket */}
          {Object.entries(outputConnectionGroups).map(([groupKey, conns]) => {
            const firstConn = conns[0];
            const fromNode = nodes.find(n => n.id === firstConn.fromNodeId);
            if (!fromNode) return null;

            const fromCoords = getPlugCoordinates(firstConn.fromNodeId, firstConn.fromSocketId, 'output');
            const socketDef = fromNode.outputs.find(o => o.id === firstConn.fromSocketId);
            const wireColor = getSocketColor(socketDef?.type || 'color');

            // CASE 1: MULTI-BRANCH SHARED TRUNK WITH VISIBLE JUNCTION DOT
            if (conns.length > 1) {
              const junctionX = fromCoords.x + 36;
              const junctionY = fromCoords.y;

              return (
                <g key={`branch_group_${groupKey}`}>
                  {/* Shared horizontal trunk from output plug to junction point */}
                  <path
                    d={`M ${fromCoords.x} ${fromCoords.y} L ${junctionX} ${junctionY}`}
                    fill="none"
                    stroke={wireColor}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />

                  {/* Branch wires spreading from junction point to each destination input plug */}
                  {conns.map(conn => {
                    const toCoords = getPlugCoordinates(conn.toNodeId, conn.toSocketId, 'input');
                    const deltaX = Math.abs(toCoords.x - junctionX) * 0.55;
                    const pathD = `M ${junctionX} ${junctionY} C ${junctionX + deltaX} ${junctionY}, ${toCoords.x - deltaX} ${toCoords.y}, ${toCoords.x} ${toCoords.y}`;

                    return (
                      <g key={conn.id}>
                        {/* Outer glow shadow */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="rgba(0, 0, 0, 0.45)"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                        />
                        {/* Core branch noodle */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={wireColor}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="opacity-90 hover:opacity-100 transition-opacity"
                        />
                      </g>
                    );
                  })}

                  {/* Visible glowing branch junction dot */}
                  <circle
                    cx={junctionX}
                    cy={junctionY}
                    r="5.5"
                    fill="#e5a038"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="drop-shadow-md"
                  />
                  <circle
                    cx={junctionX}
                    cy={junctionY}
                    r="2.5"
                    fill="#ffffff"
                  />
                </g>
              );
            }

            // CASE 2: SINGLE WIRE SMOOTH BEZIER
            const conn = conns[0];
            const toCoords = getPlugCoordinates(conn.toNodeId, conn.toSocketId, 'input');
            const deltaX = Math.abs(toCoords.x - fromCoords.x) * 0.55;
            const pathD = `M ${fromCoords.x} ${fromCoords.y} C ${fromCoords.x + deltaX} ${fromCoords.y}, ${toCoords.x - deltaX} ${toCoords.y}, ${toCoords.x} ${toCoords.y}`;

            return (
              <g key={conn.id}>
                {/* Outer shadow */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.45)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* Core noodle */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={wireColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="opacity-90"
                />
              </g>
            );
          })}

          {/* Dynamic Live Rubber-Band Guide when user clicked first plug */}
          {connectionSource && pointerWorldPos && (
            <g>
              <line
                x1={connectionSource.startX}
                y1={connectionSource.startY}
                x2={pointerWorldPos.x}
                y2={pointerWorldPos.y}
                stroke={connectionSource.isBranching ? '#e5a038' : '#89b4fa'}
                strokeWidth="2.5"
                strokeDasharray="5,4"
                className="animate-pulse"
              />
              <circle
                cx={pointerWorldPos.x}
                cy={pointerWorldPos.y}
                r="4.5"
                fill={connectionSource.isBranching ? '#e5a038' : '#89b4fa'}
                stroke="#fff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isEditing = editingNodeId === node.id;
          const isPrincipled = node.type === 'principled_bsdf';
          const nodeWidth = isPrincipled ? 250 : 210;

          return (
            <div
              key={node.id}
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
              className={`absolute bg-[#2d2d2d] rounded shadow-2xl z-20 transition-shadow select-none ${
                isEditing
                  ? 'border-2 border-[#3d7fb8] ring-2 ring-[#3d7fb8]/60 shadow-[#3d7fb8]/30 cs5-outset'
                  : isSelected
                  ? 'border border-[#555] ring-1 ring-[#89b4fa] shadow-xl'
                  : 'border border-[#444] shadow-md'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${nodeWidth}px`,
              }}
            >
              {/* Header with Category Color & In-Place Edit Controls */}
              <div className={`px-2.5 py-1.5 text-[11px] font-bold flex items-center justify-between text-white border-b cursor-move ${
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
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">{node.title}</span>
                  {isEditing && (
                    <span className="text-[9px] bg-[#3d7fb8] text-white px-1.5 py-0.2 rounded font-mono font-bold tracking-wider">
                      EDIT
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNodeId(isEditing ? null : node.id);
                      setSelectedNodeId(node.id);
                    }}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      isEditing ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'
                    }`}
                    title={isEditing ? 'Exit Edit Mode' : 'Double-click or click to edit parameters and sockets'}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNodeId(null);
                      }}
                      className="p-1 hover:bg-white/20 text-white rounded cursor-pointer"
                      title="Done editing node"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Node Body with Dual-Sided Sockets and In-Place Parameter Controls */}
              <div className="p-2 space-y-2 text-[10px]">
                {/* 1. SPECIAL IN-PLACE WIDGETS */}
                {/* ColorRamp Widget */}
                {node.type === 'color_ramp' && (
                  <div className="space-y-1.5 bg-[#202020] p-1.5 rounded border border-[#404040]">
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

                {/* Vector Mapping Widget */}
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
                          className="w-11 bg-[#111] border border-[#555] text-white px-1 rounded text-[9px]"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={node.properties.scaleY ?? 1.0}
                          onChange={(e) => updateNodeProperty(node.id, { scaleY: Number(e.target.value) })}
                          className="w-11 bg-[#111] border border-[#555] text-white px-1 rounded text-[9px]"
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

                {/* Mix RGB Blend Mode */}
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

                {/* 2. INPUT SOCKETS (LEFT SIDE WITH CHECKBOX & PROTRUDING OUTER PLUG) */}
                <div className="space-y-1">
                  {node.inputs.map(inp => {
                    const isConnected = isSocketConnected(node.id, inp.id, 'input');
                    const isPlugShown = isPlugVisible(node.id, inp.id, 'input');
                    const isSourceActive = connectionSource?.nodeId === node.id && connectionSource?.socketId === inp.id;

                    return (
                      <div 
                        key={inp.id} 
                        className="relative flex items-center justify-between py-1 min-h-[22px] px-1 rounded hover:bg-[#383838]/40"
                      >
                        {/* Protruding External Connection Plug on Node Outer Perimeter */}
                        {isPlugShown && (
                          <button
                            type="button"
                            data-plug={`${node.id}_${inp.id}`}
                            onClick={(e) => handlePlugClick(e, node.id, inp.id, 'input', inp.type)}
                            className={`absolute -left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all cursor-pointer z-30 flex items-center justify-center ${
                              isSourceActive
                                ? 'border-white scale-125 ring-2 ring-[#e5a038] animate-pulse'
                                : 'border-[#1b1b1b] hover:scale-115 hover:border-white'
                            }`}
                            style={{ backgroundColor: getSocketColor(inp.type) }}
                            title={`Plug: ${inp.name} (${inp.type}). Click to connect.`}
                          >
                            <span className="w-1 h-1 rounded-full bg-black/60" />
                          </button>
                        )}

                        {/* Socket Row Content with Checkbox */}
                        <div className="flex items-center gap-1.5 text-[#bbb]">
                          {/* Visibility Checkbox in Edit Mode */}
                          {isEditing && (
                            <input
                              type="checkbox"
                              checked={isPlugShown}
                              onChange={() => handleToggleSocketVisibility(node.id, inp.id, 'input')}
                              className="w-3 h-3 accent-[#3d7fb8] rounded cursor-pointer"
                              title="Toggle external connection plug on perimeter"
                            />
                          )}

                          <div 
                            className="w-2.5 h-2.5 rounded-full border border-[#222] shrink-0" 
                            style={{ backgroundColor: getSocketColor(inp.type) }}
                          />
                          <span className="truncate max-w-[95px] text-[10px]">{inp.name}</span>
                        </div>

                        {/* Editable Parameter Controls in Edit Mode (when no wire is connected) */}
                        <div className="flex items-center gap-1">
                          {isConnected ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-[#a6e3a1] font-mono">Linked</span>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDisconnectSocket(e, node.id, inp.id, 'input')}
                                  className="text-[#888] hover:text-[#ff6b6b] p-0.5 cursor-pointer"
                                  title="Disconnect wire"
                                >
                                  <Unplug className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ) : isEditing ? (
                            // In Edit Mode, parameter is directly interactive!
                            inp.type === 'color' ? (
                              <input
                                type="color"
                                value={inp.value || '#ffffff'}
                                onChange={(e) => updateNodeInputValue(node.id, inp.id, e.target.value)}
                                className="w-5 h-5 rounded cursor-pointer border border-[#555] bg-transparent"
                              />
                            ) : inp.type === 'float' ? (
                              <input
                                type="number"
                                step="0.05"
                                value={inp.value !== undefined ? inp.value : 0.5}
                                onChange={(e) => updateNodeInputValue(node.id, inp.id, Number(e.target.value))}
                                className="w-12 bg-[#181818] border border-[#555] text-white px-1 py-0.2 rounded text-[9px] text-right font-mono"
                              />
                            ) : null
                          ) : (
                            inp.value !== undefined && typeof inp.value === 'number' && (
                              <span className="text-[9px] text-[#888] font-mono">{inp.value}</span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. OUTPUT SOCKETS (RIGHT SIDE WITH CHECKBOX & PROTRUDING OUTER PLUG) */}
                <div className="border-t border-[#3a3a3a] pt-1 space-y-1">
                  {node.outputs.map(out => {
                    const isConnected = isSocketConnected(node.id, out.id, 'output');
                    const isPlugShown = isPlugVisible(node.id, out.id, 'output');
                    const isSourceActive = connectionSource?.nodeId === node.id && connectionSource?.socketId === out.id;

                    return (
                      <div 
                        key={out.id} 
                        className="relative flex items-center justify-between py-1 min-h-[22px] px-1 rounded hover:bg-[#383838]/40"
                      >
                        {/* Output Label & Disconnect Option */}
                        <div className="flex items-center gap-1">
                          {isConnected && isEditing && (
                            <button
                              type="button"
                              onClick={(e) => handleDisconnectSocket(e, node.id, out.id, 'output')}
                              className="text-[#888] hover:text-[#ff6b6b] p-0.5 cursor-pointer"
                              title="Disconnect outgoing wires"
                            >
                              <Unplug className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <span className="text-[10px] text-[#bbb]">{out.name}</span>
                        </div>

                        {/* Right Socket Indicator & Checkbox */}
                        <div className="flex items-center gap-1.5">
                          <div 
                            className="w-2.5 h-2.5 rounded-full border border-[#222] shrink-0" 
                            style={{ backgroundColor: getSocketColor(out.type) }}
                          />

                          {isEditing && (
                            <input
                              type="checkbox"
                              checked={isPlugShown}
                              onChange={() => handleToggleSocketVisibility(node.id, out.id, 'output')}
                              className="w-3 h-3 accent-[#3d7fb8] rounded cursor-pointer"
                              title="Toggle external connection plug on perimeter"
                            />
                          )}
                        </div>

                        {/* Protruding External Connection Plug on Node Outer Perimeter */}
                        {isPlugShown && (
                          <button
                            type="button"
                            data-plug={`${node.id}_${out.id}`}
                            onClick={(e) => handlePlugClick(e, node.id, out.id, 'output', out.type)}
                            className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all cursor-pointer z-30 flex items-center justify-center ${
                              isSourceActive
                                ? 'border-white scale-125 ring-2 ring-[#e5a038] animate-pulse'
                                : 'border-[#1b1b1b] hover:scale-115 hover:border-white'
                            }`}
                            style={{ backgroundColor: getSocketColor(out.type) }}
                            title={`Output Plug: ${out.name} (${out.type}). Shift-click or turn on Branch Mode to multi-branch.`}
                          >
                            <span className="w-1 h-1 rounded-full bg-black/60" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standalone Independent Floating Node Inspector Pop-up Window */}
      {editingNodeId && (
        <NodeInspectorPopup
          node={nodes.find(n => n.id === editingNodeId) || null}
          isOpen={Boolean(editingNodeId)}
          onClose={() => setEditingNodeId(null)}
          onUpdateNode={(updatedNode) => {
            const updated = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
            onUpdateNodes(updated);
            refreshWireLayout();
          }}
          connections={connections}
          socketVisibility={socketVisibility}
          onToggleSocketVisibility={handleToggleSocketVisibility}
        />
      )}
    </div>
  );
};
