/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Dockable Window Group (Docker System)
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { X, Minus, Move, Layers, Plus } from 'lucide-react';

export interface DockerTabItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface DockerGroupProps {
  id: string;
  tabs: DockerTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab?: (tabId: string) => void;
  onFloatTab?: (tabId: string) => void;
  onAddTabToGroup?: (groupId: string, panelId: string) => void;
  availablePanelsToAdd?: { id: string; title: string }[];
  isFloating?: boolean;
  initialPos?: { x: number; y: number };
  width?: number;
  height?: number;
}

export const DockerGroup: React.FC<DockerGroupProps> = ({
  id,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onFloatTab,
  onAddTabToGroup,
  availablePanelsToAdd = [],
  isFloating = false,
  initialPos = { x: 80, y: 80 },
  width = 260,
  height,
}) => {
  const [pos, setPos] = useState(initialPos);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAddMenu, setShowAddMenu] = useState(false);

  if (tabs.length === 0) return null;

  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];

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
      {/* Docker Tab Strip Header */}
      <div
        onPointerDown={handlePointerDownHeader}
        className={`bg-[#303030] border-b border-[#242424] px-1 pt-1 flex items-center justify-between text-xs cursor-default overflow-x-auto ${
          isFloating ? 'cursor-move' : ''
        }`}
      >
        {/* Tab Headers */}
        <div className="flex items-center gap-0.5 overflow-x-auto max-w-[85%]">
          {tabs.map((tab) => {
            const isActive = tab.id === currentTab.id;

            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t-xs cursor-pointer border-t border-x text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#383838] border-[#555] text-white shadow-xs'
                    : 'bg-[#282828] border-transparent text-[#999] hover:text-[#ccc] hover:bg-[#303030]'
                }`}
              >
                {tab.icon}
                <span className="truncate max-w-[90px]">{tab.title}</span>

                {onCloseTab && tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="text-[#777] hover:text-white ml-0.5 p-0.5"
                    title="Close Tab from Docker"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Panel to this Docker Button */}
          {availablePanelsToAdd.length > 0 && onAddTabToGroup && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="p-1 hover:text-white text-[#777] rounded"
                title="Group another window into this Docker"
              >
                <Plus className="w-3 h-3" />
              </button>

              {showAddMenu && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-[#2a2a2a] border border-[#555] rounded shadow-xl py-1 z-50 text-[10px]">
                  {availablePanelsToAdd.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onAddTabToGroup(id, p.id);
                        setShowAddMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-[#3d7fb8] hover:text-white truncate"
                    >
                      + {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 text-[#aaa] pr-1 pb-1">
          {onFloatTab && (
            <button
              onClick={() => onFloatTab(currentTab.id)}
              className="p-0.5 hover:text-white rounded"
              title={isFloating ? 'Dock Window Group' : 'Float Window Group'}
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
        </div>
      </div>

      {/* Active Tab Content */}
      {!isMinimized && currentTab && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentTab.content}
        </div>
      )}
    </div>
  );
};
