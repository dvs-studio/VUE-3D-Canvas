/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Autodesk Sketchbook-Style Dockable & Floating Panel Frame
 * with Gboard-Style Perimeter Resize Handles
 * Created by Victory Ukpong
 */

import React, { useState, useRef, useEffect } from 'react';
import { Minus, X, Maximize2, Move } from 'lucide-react';

export type ResizeZone = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

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
  minWidth?: number;
  minHeight?: number;
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
  minWidth = 360,
  minHeight = 240,
}) => {
  const [pos, setPos] = useState(initialPos);
  const [size, setSize] = useState({
    width: width || 440,
    height: height || 340,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Perimeter Resizing State
  const [activeResizeZone, setActiveResizeZone] = useState<ResizeZone | null>(null);
  const resizeStartRef = useRef<{
    clientX: number;
    clientY: number;
    width: number;
    height: number;
    posX: number;
    posY: number;
  }>({ clientX: 0, clientY: 0, width: 0, height: 0, posX: 0, posY: 0 });

  // Sync size when props change and not actively user-resized
  useEffect(() => {
    if (width && height) {
      setSize(prev => ({
        width: Math.max(minWidth, prev.width || width),
        height: Math.max(minHeight, prev.height || height),
      }));
    }
  }, [width, height, minWidth, minHeight]);

  // Window Header Dragging
  const handlePointerDownHeader = (e: React.PointerEvent) => {
    if (!isFloating) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!isDragging || !isFloating) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 80, e.clientX - dragOffset.x)),
      y: Math.max(28, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y)),
    });
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // 8-Zone Perimeter Resizing
  const handleStartResize = (e: React.PointerEvent, zone: ResizeZone) => {
    if (!isFloating || isMinimized) return;
    e.stopPropagation();
    e.preventDefault();

    setActiveResizeZone(zone);
    resizeStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      width: size.width,
      height: size.height,
      posX: pos.x,
      posY: pos.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePerimeterPointerMove = (e: React.PointerEvent) => {
    if (!activeResizeZone || !isFloating) return;

    const start = resizeStartRef.current;
    const dx = e.clientX - start.clientX;
    const dy = e.clientY - start.clientY;

    let newWidth = start.width;
    let newHeight = start.height;
    let newPosX = start.posX;
    let newPosY = start.posY;

    // Horizontal calculations
    if (activeResizeZone.includes('e')) {
      newWidth = Math.max(minWidth, start.width + dx);
    } else if (activeResizeZone.includes('w')) {
      const possibleWidth = start.width - dx;
      if (possibleWidth >= minWidth) {
        newWidth = possibleWidth;
        newPosX = start.posX + dx;
      } else {
        newWidth = minWidth;
        newPosX = start.posX + (start.width - minWidth);
      }
    }

    // Vertical calculations
    if (activeResizeZone.includes('s')) {
      newHeight = Math.max(minHeight, start.height + dy);
    } else if (activeResizeZone.includes('n')) {
      const possibleHeight = start.height - dy;
      if (possibleHeight >= minHeight) {
        newHeight = possibleHeight;
        newPosY = start.posY + dy;
      } else {
        newHeight = minHeight;
        newPosY = start.posY + (start.height - minHeight);
      }
    }

    // Screen bounds clamping
    newPosX = Math.max(0, newPosX);
    newPosY = Math.max(28, newPosY);

    setSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
    setPos({ x: Math.round(newPosX), y: Math.round(newPosY) });
  };

  const handleStopResize = (e: React.PointerEvent) => {
    if (activeResizeZone) {
      setActiveResizeZone(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const panelStyle = isFloating
    ? {
        position: 'fixed' as const,
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${size.width}px`,
        height: !isMinimized ? `${size.height}px` : undefined,
        zIndex: activeResizeZone || isDragging ? 55 : 40,
      }
    : {
        width: `${width}px`,
        height: height && !isMinimized ? `${height}px` : undefined,
      };

  return (
    <div
      style={panelStyle}
      className={`group/panel bg-[#383838] border border-[#555] rounded-xs shadow-2xl flex flex-col cs5-outset select-none ${
        isFloating ? 'ring-1 ring-[#222]' : ''
      } ${activeResizeZone ? 'ring-2 ring-[#3d7fb8] shadow-[#3d7fb8]/30' : ''}`}
    >
      {/* Photoshop CS5 Panel Title Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        onPointerCancel={handlePointerUpHeader}
        className={`cs5-panel-header px-2.5 py-1.5 flex items-center justify-between text-xs cursor-default shrink-0 ${
          isFloating ? 'cursor-move active:cursor-grabbing' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold text-[#e6e6e6] text-[11px] truncate">
          {icon}
          <span className="truncate">{title}</span>
          {isFloating && (
            <span className="text-[9px] font-mono text-[#888] font-normal ml-1">
              ({size.width}×{size.height})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[#aaa]">
          {onToggleFloat && (
            <button
              onClick={onToggleFloat}
              className="p-0.5 hover:text-white rounded cursor-pointer"
              title={isFloating ? 'Dock to Workspace' : 'Float Panel (Tear Off)'}
            >
              <Move className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-0.5 hover:text-white rounded cursor-pointer"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            <Minus className="w-3 h-3" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-0.5 hover:text-white rounded cursor-pointer"
              title="Close Panel"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          {children}
        </div>
      )}

      {/* GBOARD-STYLE PERIMETER RESIZE HANDLES & GLOWING ACCENT PILLS (FLOATING MODE ONLY) */}
      {isFloating && !isMinimized && (
        <>
          {/* Top Edge Handle + Gboard Pill */}
          <div
            onPointerDown={(e) => handleStartResize(e, 'n')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute -top-1.5 left-3 right-3 h-3 cursor-ns-resize z-50 flex items-center justify-center group/n"
            title="Drag to resize height"
          >
            <div className="w-10 h-1 bg-[#555] group-hover/n:bg-[#3d7fb8] rounded-full transition-colors opacity-0 group-hover/panel:opacity-100 shadow-xs" />
          </div>

          {/* Bottom Edge Handle + Gboard Pill */}
          <div
            onPointerDown={(e) => handleStartResize(e, 's')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute -bottom-1.5 left-3 right-3 h-3 cursor-ns-resize z-50 flex items-center justify-center group/s"
            title="Drag to resize height"
          >
            <div className="w-10 h-1 bg-[#555] group-hover/s:bg-[#3d7fb8] rounded-full transition-colors opacity-0 group-hover/panel:opacity-100 shadow-xs" />
          </div>

          {/* Left Edge Handle + Gboard Pill */}
          <div
            onPointerDown={(e) => handleStartResize(e, 'w')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute top-3 bottom-3 -left-1.5 w-3 cursor-ew-resize z-50 flex items-center justify-center group/w"
            title="Drag to resize width"
          >
            <div className="h-10 w-1 bg-[#555] group-hover/w:bg-[#3d7fb8] rounded-full transition-colors opacity-0 group-hover/panel:opacity-100 shadow-xs" />
          </div>

          {/* Right Edge Handle + Gboard Pill */}
          <div
            onPointerDown={(e) => handleStartResize(e, 'e')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute top-3 bottom-3 -right-1.5 w-3 cursor-ew-resize z-50 flex items-center justify-center group/e"
            title="Drag to resize width"
          >
            <div className="h-10 w-1 bg-[#555] group-hover/e:bg-[#3d7fb8] rounded-full transition-colors opacity-0 group-hover/panel:opacity-100 shadow-xs" />
          </div>

          {/* Top-Left Corner Handle */}
          <div
            onPointerDown={(e) => handleStartResize(e, 'nw')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute -top-2 -left-2 w-4 h-4 cursor-nwse-resize z-50 flex items-center justify-center group/nw"
            title="Drag to resize corner"
          >
            <div className="w-2.5 h-2.5 border-t-2 border-l-2 border-[#666] group-hover/nw:border-[#3d7fb8] transition-colors opacity-0 group-hover/panel:opacity-100" />
          </div>

          {/* Top-Right Corner Handle */}
          <div
            onPointerDown={(e) => handleStartResize(e, 'ne')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute -top-2 -right-2 w-4 h-4 cursor-nesw-resize z-50 flex items-center justify-center group/ne"
            title="Drag to resize corner"
          >
            <div className="w-2.5 h-2.5 border-t-2 border-r-2 border-[#666] group-hover/ne:border-[#3d7fb8] transition-colors opacity-0 group-hover/panel:opacity-100" />
          </div>

          {/* Bottom-Left Corner Handle */}
          <div
            onPointerDown={(e) => handleStartResize(e, 'sw')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute -bottom-2 -left-2 w-4 h-4 cursor-nesw-resize z-50 flex items-center justify-center group/sw"
            title="Drag to resize corner"
          >
            <div className="w-2.5 h-2.5 border-b-2 border-l-2 border-[#666] group-hover/sw:border-[#3d7fb8] transition-colors opacity-0 group-hover/panel:opacity-100" />
          </div>

          {/* Bottom-Right Corner Handle */}
          <div
            onPointerDown={(e) => handleStartResize(e, 'se')}
            onPointerMove={handlePerimeterPointerMove}
            onPointerUp={handleStopResize}
            onPointerCancel={handleStopResize}
            className="absolute -bottom-2 -right-2 w-4 h-4 cursor-nwse-resize z-50 flex items-center justify-center group/se"
            title="Drag to resize corner"
          >
            <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-[#666] group-hover/se:border-[#3d7fb8] transition-colors opacity-0 group-hover/panel:opacity-100" />
          </div>
        </>
      )}
    </div>
  );
};

