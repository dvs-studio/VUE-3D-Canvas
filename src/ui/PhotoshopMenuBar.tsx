/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Dark Neutral Gray Menu Bar
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { Box, Camera, Info, Save, FolderOpen, Layers, Undo2, Redo2, Sliders, Eye } from 'lucide-react';

interface PhotoshopMenuBarProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onOpenProjectSettings: () => void;
  onExportBlenderSpec: () => void;
  onExportOBJ: () => void;
  onTriggerProjectionScreenshot: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenAbout: () => void;
  onOpenTriplanarDialog: () => void;
  onTogglePanel: (panelName: string) => void;
  activePanels: Record<string, boolean>;
  onNumpadKey: (key: string, ctrl: boolean) => void;
}

export const PhotoshopMenuBar: React.FC<PhotoshopMenuBarProps> = ({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onOpenProjectSettings,
  onExportBlenderSpec,
  onExportOBJ,
  onTriggerProjectionScreenshot,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenAbout,
  onOpenTriplanarDialog,
  onTogglePanel,
  activePanels,
  onNumpadKey,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggle = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const close = () => setOpenMenu(null);

  return (
    <div className="h-7 bg-[#333333] border-b border-[#242424] flex items-center justify-between px-2 text-xs text-[#c8c8c8] select-none z-50">
      {/* Brand Icon and Top Menus */}
      <div className="flex items-center gap-1">
        {/* Brand Lockup */}
        <div 
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer hover:bg-[#444] transition-colors mr-2"
          title="About VUE 3D Canvas (Victory Ukpong)"
        >
          <div className="w-4 h-4 bg-[#3d7fb8] rounded-xs flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
            V
          </div>
          <span className="font-bold text-[#eee] tracking-tight text-[11px]">VUE 3D Canvas</span>
          <span className="text-[9px] text-[#3d7fb8] font-mono font-medium">Rust/WASM</span>
        </div>

        {/* FILE MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('file')}
            className={`px-2 py-0.5 rounded hover:bg-[#444] hover:text-white transition-colors ${
              openMenu === 'file' ? 'bg-[#2b2b2b] text-white' : ''
            }`}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div 
              className="absolute top-full left-0 mt-0.5 w-52 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <button
                onClick={() => { onNewProject(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>New Project (.xblend)</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+N</span>
              </button>
              <button
                onClick={() => { onOpenProject(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Open Project...</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+O</span>
              </button>
              <button
                onClick={() => { onSaveProject(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Save Project (.xblend)</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+S</span>
              </button>
              <div className="my-1 border-t border-[#444]" />
              <button
                onClick={() => { onOpenProjectSettings(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white"
              >
                Link / Embed 3D Asset Settings...
              </button>
              <div className="my-1 border-t border-[#444]" />
              <button
                onClick={() => { onExportOBJ(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white"
              >
                Export 3D Mesh (.obj)
              </button>
              <button
                onClick={() => { onExportBlenderSpec(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white"
              >
                Export Blender .blend Material
              </button>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('edit')}
            className={`px-2 py-0.5 rounded hover:bg-[#444] hover:text-white transition-colors ${
              openMenu === 'edit' ? 'bg-[#2b2b2b] text-white' : ''
            }`}
          >
            Edit
          </button>
          {openMenu === 'edit' && (
            <div 
              className="absolute top-full left-0 mt-0.5 w-56 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <button
                onClick={() => { onUndo(); close(); }}
                disabled={!canUndo}
                className={`w-full text-left px-3 py-1 flex justify-between ${
                  canUndo ? 'hover:bg-[#3d7fb8] hover:text-white' : 'text-[#666] cursor-not-allowed'
                }`}
              >
                <span>Undo (3-State Ring)</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+Z</span>
              </button>
              <button
                onClick={() => { onRedo(); close(); }}
                disabled={!canRedo}
                className={`w-full text-left px-3 py-1 flex justify-between ${
                  canRedo ? 'hover:bg-[#3d7fb8] hover:text-white' : 'text-[#666] cursor-not-allowed'
                }`}
              >
                <span>Redo</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+Y</span>
              </button>
              <div className="my-1 border-t border-[#444]" />
              <button
                onClick={() => { onTriggerProjectionScreenshot(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#89b4fa]"
              >
                <span>Projection Screenshot</span>
                <span className="font-mono text-[10px]">F8</span>
              </button>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('view')}
            className={`px-2 py-0.5 rounded hover:bg-[#444] hover:text-white transition-colors ${
              openMenu === 'view' ? 'bg-[#2b2b2b] text-white' : ''
            }`}
          >
            View
          </button>
          {openMenu === 'view' && (
            <div 
              className="absolute top-full left-0 mt-0.5 w-56 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <button
                onClick={() => { onNumpadKey('1', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Front View</span>
                <span className="text-[#888] font-mono text-[10px]">Numpad 1</span>
              </button>
              <button
                onClick={() => { onNumpadKey('1', true); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Back View</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+1</span>
              </button>
              <button
                onClick={() => { onNumpadKey('3', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Right View</span>
                <span className="text-[#888] font-mono text-[10px]">Numpad 3</span>
              </button>
              <button
                onClick={() => { onNumpadKey('3', true); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Left View</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+3</span>
              </button>
              <button
                onClick={() => { onNumpadKey('7', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Top View</span>
                <span className="text-[#888] font-mono text-[10px]">Numpad 7</span>
              </button>
              <button
                onClick={() => { onNumpadKey('7', true); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Bottom View</span>
                <span className="text-[#888] font-mono text-[10px]">Ctrl+7</span>
              </button>
              <div className="my-1 border-t border-[#444]" />
              <button
                onClick={() => { onNumpadKey('5', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Toggle Ortho / Persp</span>
                <span className="text-[#888] font-mono text-[10px]">Numpad 5</span>
              </button>
              <button
                onClick={() => { onNumpadKey('0', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Reset Camera View</span>
                <span className="text-[#888] font-mono text-[10px]">Numpad 0</span>
              </button>
              <button
                onClick={() => { onNumpadKey('.', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Frame Selected Mesh</span>
                <span className="text-[#888] font-mono text-[10px]">Numpad .</span>
              </button>
            </div>
          )}
        </div>

        {/* FILTER MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('filter')}
            className={`px-2 py-0.5 rounded hover:bg-[#444] hover:text-white transition-colors ${
              openMenu === 'filter' ? 'bg-[#2b2b2b] text-white' : ''
            }`}
          >
            Filter
          </button>
          {openMenu === 'filter' && (
            <div 
              className="absolute top-full left-0 mt-0.5 w-52 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <button
                onClick={() => { onOpenTriplanarDialog(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Triplanar Box Mapping Fill...</span>
                <span className="text-[#888] font-mono text-[10px]">Shift+T</span>
              </button>
            </div>
          )}
        </div>

        {/* WINDOW MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('window')}
            className={`px-2 py-0.5 rounded hover:bg-[#444] hover:text-white transition-colors ${
              openMenu === 'window' ? 'bg-[#2b2b2b] text-white' : ''
            }`}
          >
            Window
          </button>
          {openMenu === 'window' && (
            <div 
              className="absolute top-full left-0 mt-0.5 w-48 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              {['layers', 'colorWheel', 'brushes', 'navigator', 'nodeGraph', 'history', 'numpad'].map((panel) => (
                <button
                  key={panel}
                  onClick={() => { onTogglePanel(panel); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between"
                >
                  <span className="capitalize">{panel.replace(/([A-Z])/g, ' $1')}</span>
                  {activePanels[panel] && <span className="text-[#a6e3a1]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* HELP MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('help')}
            className={`px-2 py-0.5 rounded hover:bg-[#444] hover:text-white transition-colors ${
              openMenu === 'help' ? 'bg-[#2b2b2b] text-white' : ''
            }`}
          >
            Help
          </button>
          {openMenu === 'help' && (
            <div 
              className="absolute top-full left-0 mt-0.5 w-56 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <button
                onClick={() => { onOpenAbout(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white"
              >
                About VUE 3D Canvas...
              </button>
              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-1 text-[10px] text-[#888]">
                Author: Victory Ukpong
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTriggerProjectionScreenshot}
          className="px-2 py-0.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#555] text-[10px] flex items-center gap-1.5 transition-colors"
          title="Projection Screenshot (F8)"
        >
          <Camera className="w-3 h-3 text-[#3d7fb8]" />
          <span>Projection [F8]</span>
        </button>

        <button
          onClick={onOpenAbout}
          className="text-[#aaa] hover:text-white p-0.5"
          title="About VUE 3D Canvas"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
