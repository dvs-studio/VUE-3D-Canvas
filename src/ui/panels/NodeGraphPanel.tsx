/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Blender 2.79 / 2.83 LTS Style Node Graph Editor
 * Created by Victory Ukpong
 */

import React, { useState, useRef } from 'react';
import { GraphNode, NodeConnection } from '../../core/types';
import { NodeEvaluator } from '../../nodes/nodeEvaluator';
import { Plus, Play, Download, Sparkles, Sliders } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handlePointerDownNode = (e: React.PointerEvent, node: GraphNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingNodeId) return;
    const updated = nodes.map(n => {
      if (n.id === draggingNodeId) {
        return {
          ...n,
          x: Math.max(10, e.clientX - dragOffset.x),
          y: Math.max(10, e.clientY - dragOffset.y),
        };
      }
      return n;
    });
    onUpdateNodes(updated);
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
  };

  const handleAddNode = (type: GraphNode['type']) => {
    const id = `node_${Date.now()}`;
    let title = 'Node';
    let inputs: any[] = [];
    let outputs: any[] = [];
    let properties: any = {};

    if (type === 'voronoi') {
      title = 'Voronoi Texture';
      inputs = [
        { id: 'vector', name: 'Vector', type: 'vector' },
        { id: 'scale', name: 'Scale', type: 'float', value: 6.0 },
      ];
      outputs = [
        { id: 'distance', name: 'Distance', type: 'float' },
        { id: 'color', name: 'Color', type: 'color' },
      ];
      properties = { scale: 6.0 };
    } else if (type === 'brick') {
      title = 'Brick Texture';
      inputs = [
        { id: 'vector', name: 'Vector', type: 'vector' },
        { id: 'scale', name: 'Scale', type: 'float', value: 10.0 },
      ];
      outputs = [
        { id: 'color', name: 'Color', type: 'color' },
        { id: 'fac', name: 'Fac', type: 'float' },
      ];
      properties = { scale: 10.0 };
    } else if (type === 'checker') {
      title = 'Checker Texture';
      inputs = [
        { id: 'vector', name: 'Vector', type: 'vector' },
        { id: 'scale', name: 'Scale', type: 'float', value: 8.0 },
      ];
      outputs = [
        { id: 'color', name: 'Color', type: 'color' },
        { id: 'fac', name: 'Fac', type: 'float' },
      ];
      properties = { scale: 8.0 };
    }

    const newNode: GraphNode = {
      id,
      type,
      title,
      x: 180 + Math.random() * 80,
      y: 120 + Math.random() * 80,
      inputs,
      outputs,
      properties,
    };

    onUpdateNodes([...nodes, newNode]);
    setShowAddMenu(false);
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

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-full bg-[#202020] overflow-hidden select-none text-xs text-[#ccc]"
    >
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, #555 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Toolbar */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-[#2d2d2d]/90 px-3 py-1.5 rounded border border-[#444] shadow-md cs5-inset">
        <span className="text-[10px] text-[#999] font-mono uppercase tracking-wider">
          BLENDER 2.83 LTS SHADER TREE
        </span>

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-2 py-0.5 bg-[#404040] hover:bg-[#4d4d4d] text-white rounded text-[11px] flex items-center gap-1 border border-[#555]"
          >
            <Plus className="w-3 h-3 text-[#3d7fb8]" />
            Add Node
          </button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-[#2a2a2a] border border-[#555] rounded shadow-xl py-1 z-30">
              <button
                onClick={() => handleAddNode('voronoi')}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[11px]"
              >
                Voronoi Texture
              </button>
              <button
                onClick={() => handleAddNode('brick')}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[11px]"
              >
                Brick Texture
              </button>
              <button
                onClick={() => handleAddNode('checker')}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[11px]"
              >
                Checker Texture
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleBake}
          className="px-2.5 py-0.5 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-sm transition-colors"
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
      </div>

      {/* SVG Connecting Noodles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {connections.map((c) => {
          const fromNode = nodes.find(n => n.id === c.fromNodeId);
          const toNode = nodes.find(n => n.id === c.toNodeId);
          if (!fromNode || !toNode) return null;

          const startX = fromNode.x + 160;
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
              stroke="#e5a038"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-sm opacity-85"
            />
          );
        })}
      </svg>

      {/* Interactive Graph Node Blocks */}
      {nodes.map((node) => {
        const isSelected = selectedNodeId === node.id;

        return (
          <div
            key={node.id}
            onPointerDown={(e) => handlePointerDownNode(e, node)}
            className={`absolute w-44 bg-[#323232] border rounded shadow-lg overflow-hidden cursor-move z-10 ${
              isSelected ? 'border-[#3d7fb8] ring-1 ring-[#3d7fb8]' : 'border-[#4a4a4a]'
            }`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
            }}
          >
            {/* Node Header */}
            <div className={`px-2 py-1 text-[11px] font-bold flex items-center justify-between text-white border-b ${
              node.type.includes('texture') || ['noise', 'voronoi', 'brick', 'checker'].includes(node.type)
                ? 'bg-[#a35232] border-[#7d3b22]'
                : node.type === 'color_ramp'
                ? 'bg-[#3b5266] border-[#293d4f]'
                : node.type === 'principled_bsdf'
                ? 'bg-[#2f664a] border-[#224f38]'
                : 'bg-[#404040] border-[#2f2f2f]'
            }`}>
              <span className="truncate">{node.title}</span>
              <span className="text-[9px] text-[#eee]/70 font-mono">DX11</span>
            </div>

            {/* Sockets Body */}
            <div className="p-2 space-y-1.5 text-[10px]">
              {/* Inputs */}
              {node.inputs.map(inp => (
                <div key={inp.id} className="flex items-center gap-1.5 text-[#bbb]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e5a038] border border-[#222]" />
                  <span>{inp.name}</span>
                </div>
              ))}

              {/* Node Properties */}
              {node.properties.scale !== undefined && (
                <div className="pt-1 flex items-center justify-between text-[10px] border-t border-[#404040]">
                  <span className="text-[#888]">Scale</span>
                  <input
                    type="number"
                    value={node.properties.scale}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1;
                      const updated = nodes.map(n => n.id === node.id ? {
                        ...n,
                        properties: { ...n.properties, scale: val }
                      } : n);
                      onUpdateNodes(updated);
                    }}
                    className="w-12 bg-[#222] border border-[#555] rounded px-1 text-right text-[#eee]"
                  />
                </div>
              )}

              {/* Outputs */}
              {node.outputs.map(out => (
                <div key={out.id} className="flex items-center justify-end gap-1.5 text-[#bbb]">
                  <span>{out.name}</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3d7fb8] border border-[#222]" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
