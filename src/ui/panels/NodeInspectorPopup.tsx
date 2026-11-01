/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Independent Floating Node Inspector Pop-up Window
 * Created by Victory Ukpong
 * 
 * Standalone floating window decoupled from the node graph canvas:
 * - Draggable Photoshop CS5 header, minimize & close controls
 * - Live dynamic parameter editor for all shader node properties
 * - Dual-column socket exposure manager (input sockets left, output sockets right)
 * - Checkboxes to expose / hide protruding connection plugs on node perimeter
 * - Real-time 2-way node graph updates & 3D texture synchronization
 * - Escape key & outside double-click to exit edit mode
 */

import React, { useState, useEffect, useRef } from 'react';
import { GraphNode, NodeConnection } from '../../core/types';
import { 
  Sliders, 
  X, 
  Minus, 
  Check, 
  Move, 
  Layers, 
  Sparkles, 
  CheckSquare, 
  Square,
  CircleDot,
  Radio,
  Unplug,
  Info
} from 'lucide-react';

interface NodeInspectorPopupProps {
  node: GraphNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (node: GraphNode) => void;
  connections: NodeConnection[];
  socketVisibility: Record<string, boolean>;
  onToggleSocketVisibility: (nodeId: string, socketId: string, socketType: 'input' | 'output') => void;
}

export const NodeInspectorPopup: React.FC<NodeInspectorPopupProps> = ({
  node,
  isOpen,
  onClose,
  onUpdateNode,
  connections,
  socketVisibility,
  onToggleSocketVisibility,
}) => {
  const [pos, setPos] = useState({ x: 220, y: 140 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Reposition near center-right if initial
  useEffect(() => {
    if (isOpen && node) {
      setPos({
        x: Math.min(window.innerWidth - 440, Math.max(80, window.innerWidth - 480)),
        y: Math.min(window.innerHeight - 500, Math.max(100, 140)),
      });
    }
  }, [isOpen, node?.id]);

  // Escape key listener to close inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !node) return null;

  // Header Drag Handling
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 360, e.clientX - dragOffset.x)),
      y: Math.max(28, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y)),
    });
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Helper to get socket color
  const getSocketColor = (type: string) => {
    switch (type) {
      case 'color': return '#e5b538'; // Yellow
      case 'vector': return '#6366f1'; // Violet/Blue
      case 'float': return '#a0a0a0'; // Silver
      case 'shader': return '#22c55e'; // Green
      default: return '#e5b538';
    }
  };

  // Check if a socket is currently wired to another node
  const isSocketConnected = (socketId: string, socketType: 'input' | 'output') => {
    if (socketType === 'input') {
      return connections.some(c => c.toNodeId === node.id && c.toSocketId === socketId);
    }
    return connections.some(c => c.fromNodeId === node.id && c.fromSocketId === socketId);
  };

  // Check if socket plug is exposed on node perimeter
  const isSocketExposed = (socketId: string, socketType: 'input' | 'output') => {
    const key = `${node.id}_${socketId}`;
    if (socketVisibility[key] !== undefined) {
      return socketVisibility[key];
    }
    return isSocketConnected(socketId, socketType);
  };

  // Update a single property value on the node
  const handleValueChange = (key: string, val: any) => {
    const updatedProps = { ...(node.properties || {}), [key]: val };
    onUpdateNode({
      ...node,
      properties: updatedProps,
    });
  };

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: '420px',
        zIndex: 60,
      }}
      className="bg-[#2e2e2e] border-2 border-[#3d7fb8] rounded shadow-2xl flex flex-col cs5-outset select-none ring-2 ring-[#3d7fb8]/40"
    >
      {/* Photoshop CS5 Dark Draggable Title Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        onPointerCancel={handlePointerUpHeader}
        className="cs5-panel-header px-3 py-1.5 flex items-center justify-between text-xs cursor-move active:cursor-grabbing bg-[#333333] border-b border-[#444]"
      >
        <div className="flex items-center gap-2 font-bold text-white text-[11px] truncate">
          <Sliders className="w-3.5 h-3.5 text-[#3d7fb8]" />
          <span className="truncate">Node Properties: {node.title}</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#3d7fb8]/30 text-[#89b4fa] border border-[#3d7fb8]/60">
            {node.type.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#aaa]">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-white rounded hover:bg-[#444] cursor-pointer"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:text-[#ff6b6b] rounded hover:bg-[#444] cursor-pointer"
            title="Close Inspector (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      {!isMinimized && (
        <div className="p-3 space-y-3 max-h-[72vh] overflow-y-auto text-xs text-[#ddd] font-sans">
          {/* Section 1: Dynamic Node Parameter Controls */}
          <div className="bg-[#242424] p-2.5 rounded border border-[#3c3c3c] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#89b4fa] uppercase tracking-wider border-b border-[#383838] pb-1">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-[#3d7fb8]" />
                Parameter Values
              </span>
              <span className="text-[10px] text-[#777] font-normal normal-case font-mono">
                Live 2-Way Sync
              </span>
            </div>

            {/* Render controls based on node.type */}
            {node.type === 'principled_bsdf' && (
              <div className="space-y-2">
                {/* Base Color */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#bbb]">Base Color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={node.properties?.baseColor || '#cccccc'}
                      onChange={(e) => handleValueChange('baseColor', e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                    />
                    <input
                      type="text"
                      value={node.properties?.baseColor || '#cccccc'}
                      onChange={(e) => handleValueChange('baseColor', e.target.value)}
                      className="w-20 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded font-mono text-[10px]"
                    />
                  </div>
                </div>

                {/* Metallic */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Metallic</span>
                    <span className="font-mono text-[#89b4fa]">{(node.properties?.metallic ?? 0).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={node.properties?.metallic ?? 0}
                    onChange={(e) => handleValueChange('metallic', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>

                {/* Roughness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Roughness</span>
                    <span className="font-mono text-[#89b4fa]">{(node.properties?.roughness ?? 0.5).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={node.properties?.roughness ?? 0.5}
                    onChange={(e) => handleValueChange('roughness', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>

                {/* IOR */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">IOR (Index of Refraction)</span>
                    <span className="font-mono text-[#89b4fa]">{(node.properties?.ior ?? 1.45).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.01"
                    value={node.properties?.ior ?? 1.45}
                    onChange={(e) => handleValueChange('ior', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Noise Texture Controls */}
            {node.type === 'noise' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Scale</span>
                    <span className="font-mono text-[#89b4fa]">{node.properties?.scale ?? 5.0}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={node.properties?.scale ?? 5.0}
                    onChange={(e) => handleValueChange('scale', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Detail</span>
                    <span className="font-mono text-[#89b4fa]">{node.properties?.detail ?? 2.0}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={node.properties?.detail ?? 2.0}
                    onChange={(e) => handleValueChange('detail', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Roughness</span>
                    <span className="font-mono text-[#89b4fa]">{(node.properties?.roughness ?? 0.5).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={node.properties?.roughness ?? 0.5}
                    onChange={(e) => handleValueChange('roughness', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Voronoi Texture Controls */}
            {node.type === 'voronoi' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Scale</span>
                    <span className="font-mono text-[#89b4fa]">{node.properties?.scale ?? 5.0}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    step="0.5"
                    value={node.properties?.scale ?? 5.0}
                    onChange={(e) => handleValueChange('scale', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Randomness</span>
                    <span className="font-mono text-[#89b4fa]">{(node.properties?.randomness ?? 1.0).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={node.properties?.randomness ?? 1.0}
                    onChange={(e) => handleValueChange('randomness', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Mix RGB Controls */}
            {node.type === 'mix_rgb' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#bbb]">Blend Mode:</span>
                  <select
                    value={node.properties?.blendMode || 'Mix'}
                    onChange={(e) => handleValueChange('blendMode', e.target.value)}
                    className="bg-[#1e1e1e] border border-[#555] text-white px-2 py-0.5 rounded text-[11px]"
                  >
                    <option value="Mix">Mix</option>
                    <option value="Multiply">Multiply</option>
                    <option value="Screen">Screen</option>
                    <option value="Overlay">Overlay</option>
                    <option value="Add">Add</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#bbb]">Factor</span>
                    <span className="font-mono text-[#89b4fa]">{(node.properties?.fac ?? 0.5).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={node.properties?.fac ?? 0.5}
                    onChange={(e) => handleValueChange('fac', parseFloat(e.target.value))}
                    className="w-full accent-[#3d7fb8] cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Math Controls */}
            {node.type === 'math' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#bbb]">Operation:</span>
                  <select
                    value={node.properties?.operation || 'Add'}
                    onChange={(e) => handleValueChange('operation', e.target.value)}
                    className="bg-[#1e1e1e] border border-[#555] text-white px-2 py-0.5 rounded text-[11px]"
                  >
                    <option value="Add">Add</option>
                    <option value="Subtract">Subtract</option>
                    <option value="Multiply">Multiply</option>
                    <option value="Divide">Divide</option>
                    <option value="Power">Power</option>
                    <option value="Greater Than">Greater Than</option>
                    <option value="Less Than">Less Than</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#aaa]">Value 1</span>
                    <input
                      type="number"
                      step="0.1"
                      value={node.properties?.value1 ?? 0.5}
                      onChange={(e) => handleValueChange('value1', parseFloat(e.target.value))}
                      className="w-full bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-right font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#aaa]">Value 2</span>
                    <input
                      type="number"
                      step="0.1"
                      value={node.properties?.value2 ?? 0.5}
                      onChange={(e) => handleValueChange('value2', parseFloat(e.target.value))}
                      className="w-full bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-right font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generic Fallback for Other Keys */}
            {!['principled_bsdf', 'noise', 'voronoi', 'mix_rgb', 'math'].includes(node.type) && (
              <div className="space-y-1.5">
                {Object.keys(node.properties || {}).length === 0 ? (
                  <div className="text-[11px] text-[#888] italic py-1 text-center">
                    No adjustable scalar parameters for this node type.
                  </div>
                ) : (
                  Object.entries(node.properties || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-[11px] text-[#bbb] capitalize">{k}:</span>
                      {typeof v === 'number' ? (
                        <input
                          type="number"
                          step="0.1"
                          value={v}
                          onChange={(e) => handleValueChange(k, parseFloat(e.target.value))}
                          className="w-24 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-right font-mono text-[11px]"
                        />
                      ) : typeof v === 'string' && v.startsWith('#') ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={v}
                            onChange={(e) => handleValueChange(k, e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                          />
                          <input
                            type="text"
                            value={v}
                            onChange={(e) => handleValueChange(k, e.target.value)}
                            className="w-20 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded font-mono text-[10px]"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={String(v)}
                          onChange={(e) => handleValueChange(k, e.target.value)}
                          className="w-28 bg-[#1e1e1e] border border-[#555] text-white px-1.5 py-0.5 rounded text-[11px]"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Section 2: Sockets Exposure Manager (Dual-Column Checkboxes) */}
          <div className="bg-[#242424] p-2.5 rounded border border-[#3c3c3c] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#e5a038] uppercase tracking-wider border-b border-[#383838] pb-1">
              <span className="flex items-center gap-1.5">
                <CircleDot className="w-3 h-3 text-[#e5a038]" />
                Perimeter Plugs Exposure
              </span>
              <span className="text-[10px] text-[#777] font-normal normal-case">
                Select to show outer plugs
              </span>
            </div>

            <p className="text-[10px] text-[#aaa] leading-tight">
              Check socket boxes below to make connection plugs protrude outside the node in the Node Editor graph.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Left Column: Input Sockets */}
              <div className="bg-[#1c1c1c] p-2 rounded border border-[#383838] space-y-1.5">
                <div className="text-[10px] font-mono text-[#89b4fa] font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#333] pb-1">
                  <span>INPUTS (LEFT)</span>
                  <span className="text-[#666]">{node.inputs.length}</span>
                </div>

                {node.inputs.length === 0 ? (
                  <span className="text-[10px] text-[#666] italic block py-1">No inputs</span>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {node.inputs.map((socket) => {
                      const exposed = isSocketExposed(socket.id, 'input');
                      const connected = isSocketConnected(socket.id, 'input');
                      const col = getSocketColor(socket.type);

                      return (
                        <label
                          key={socket.id}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2a2a2a] cursor-pointer transition-colors text-[11px]"
                        >
                          <input
                            type="checkbox"
                            checked={exposed}
                            onChange={() => onToggleSocketVisibility(node.id, socket.id, 'input')}
                            className="accent-[#3d7fb8] rounded cursor-pointer"
                          />
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: col }}
                            title={`Type: ${socket.type}`}
                          />
                          <span className={`truncate ${exposed ? 'text-white font-medium' : 'text-[#888]'}`}>
                            {socket.name || socket.id}
                          </span>
                          {connected && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" title="Connected" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Output Sockets */}
              <div className="bg-[#1c1c1c] p-2 rounded border border-[#383838] space-y-1.5">
                <div className="text-[10px] font-mono text-[#e5a038] font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#333] pb-1">
                  <span>OUTPUTS (RIGHT)</span>
                  <span className="text-[#666]">{node.outputs.length}</span>
                </div>

                {node.outputs.length === 0 ? (
                  <span className="text-[10px] text-[#666] italic block py-1">No outputs</span>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {node.outputs.map((socket) => {
                      const exposed = isSocketExposed(socket.id, 'output');
                      const connected = isSocketConnected(socket.id, 'output');
                      const col = getSocketColor(socket.type);

                      return (
                        <label
                          key={socket.id}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2a2a2a] cursor-pointer transition-colors text-[11px]"
                        >
                          <input
                            type="checkbox"
                            checked={exposed}
                            onChange={() => onToggleSocketVisibility(node.id, socket.id, 'output')}
                            className="accent-[#e5a038] rounded cursor-pointer"
                          />
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: col }}
                            title={`Type: ${socket.type}`}
                          />
                          <span className={`truncate ${exposed ? 'text-white font-medium' : 'text-[#888]'}`}>
                            {socket.name || socket.id}
                          </span>
                          {connected && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" title="Connected" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#777] font-mono">
              Press Esc or click Done to close
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-[#5ca2db]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
