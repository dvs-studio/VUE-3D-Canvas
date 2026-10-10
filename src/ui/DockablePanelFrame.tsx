/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Autodesk Sketchbook-Style Dockable & Floating Panel Frame
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { Minus, X, Maximize2, Move } from 'lucide-react';

interface DockablePanelFrameProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isFloating?: boolean;
  initialPos?: { x: number; y: number };
  onClose?: () => void;
  onToggleFloat?: () => void;
  width?: number;
  height?: number;
}

export const DockablePanelFrame: React.FC<DockablePanelFrameProps> = ({
  id,
  title,
  icon,
  children,
  isFloating = false,
  initialPos = { x: 100, y: 100 },
  onClose,
  onToggleFloat,
  width = 240,
  height,
}) => {
  const [pos, setPos] = useState(initialPos);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDownHeader = (e: React.PointerEvent) => {
    if (!isFloating) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isFloating) return;
    setPos({
      x: Math.max(0, e.clientX - dragOffset.x),
      y: Math.max(30, e.clientY - dragOffset.y),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const panelStyle = isFloating
    ? {
        position: 'fixed' as const,
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${width}px`,
        height: height && !isMinimized ? `${height}px` : undefined,
        zIndex: 40,
      }
    : {
        width: `${width}px`,
        height: height && !isMinimized ? `${height}px` : undefined,
      };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={panelStyle}
      className={`bg-[#383838] border border-[#555] rounded-xs shadow-xl flex flex-col overflow-hidden cs5-outset select-none ${
        isFloating ? 'ring-1 ring-[#222]' : ''
      }`}
    >
      {/* Photoshop CS5 Panel Title Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        className={`cs5-panel-header px-2.5 py-1.5 flex items-center justify-between text-xs cursor-default ${
          isFloating ? 'cursor-move' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold text-[#e6e6e6] text-[11px] truncate">
          {icon}
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1 text-[#aaa]">
          {onToggleFloat && (
            <button
              onClick={onToggleFloat}
              className="p-0.5 hover:text-white rounded"
              title={isFloating ? 'Dock to Workspace' : 'Float Panel (Tear Off)'}
            >
              <Move className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-0.5 hover:text-white rounded"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            <Minus className="w-3 h-3" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-0.5 hover:text-white rounded"
              title="Close Panel"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
};
