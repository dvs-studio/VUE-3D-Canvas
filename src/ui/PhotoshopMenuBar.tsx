/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Dark Neutral Gray Menu Bar
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { Box, Camera, Info, Save, FolderOpen, Layers, Undo2, Redo2, Sliders, Eye, Palette, Check, Stamp } from 'lucide-react';
import { ThemeMode } from '../core/types';

interface PhotoshopMenuBarProps {
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onOpenProjectSettings: () => void;
  onExportBlenderSpec: () => void;
  onExportOBJ: () => void;
  onExportBundleZip: () => void;
  onTriggerProjectionScreenshot: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenAbout: () => void;
  onOpenTriplanarDialog: () => void;
  onOpenGaussianBlur?: () => void;
  onOpenStochasticScatter?: () => void;
  onOpenStitchStudio?: () => void;
  onConvertToBump?: () => void;
  onConvertToNormal?: () => void;
  onConvertToClipMask?: () => void;
  onConvertToEmissive?: () => void;
  onOpenUndoSettings?: () => void;
  onOpenHelpPDF?: () => void;
  onOpenTutorialPDF?: () => void;
  onDownloadHelpDocx?: () => void;
  onTogglePanel: (panelName: string) => void;
  activePanels: Record<string, boolean>;
  onNumpadKey: (key: string, ctrl: boolean) => void;
  selectedModelKey?: string;
  onSelectModelKey?: (key: string) => void;
  meshComponentVisibility?: string;
  onSelectMeshComponentVisibility?: (comp: string) => void;
  isolateSelectedGroupOnly?: boolean;
  onToggleIsolateSelectedGroupOnly?: (checked: boolean) => void;
  currentTheme?: ThemeMode;
  onChangeTheme?: (theme: ThemeMode) => void;
  onOpenEdgeWearFilter?: () => void;
  onOpenPatternStampDialog?: () => void;
  onImportBlenderMaterial?: () => void;
  onExportMultiChannelModel?: () => void;
}

export const PhotoshopMenuBar: React.FC<PhotoshopMenuBarProps> = ({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onOpenProjectSettings,
  onExportBlenderSpec,
  onExportOBJ,
  onExportBundleZip,
  onTriggerProjectionScreenshot,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenAbout,
  onOpenTriplanarDialog,
  onOpenGaussianBlur,
  onOpenStochasticScatter,
  onOpenStitchStudio,
  onConvertToBump,
  onConvertToNormal,
  onConvertToClipMask,
  onConvertToEmissive,
  onOpenUndoSettings,
  onOpenHelpPDF,
  onOpenTutorialPDF,
  onDownloadHelpDocx,
  onTogglePanel,
  activePanels,
  onNumpadKey,
  selectedModelKey = 'suzanne',
  onSelectModelKey,
  meshComponentVisibility = 'all',
  onSelectMeshComponentVisibility,
  isolateSelectedGroupOnly = false,
  onToggleIsolateSelectedGroupOnly,
  currentTheme = 'cs5',
  onChangeTheme,
  onOpenEdgeWearFilter,
  onOpenPatternStampDialog,
  onImportBlenderMaterial,
  onExportMultiChannelModel,
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
              <button
                onClick={() => { onExportBundleZip(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#89b4fa]"
              >
                <span>Export .xblend + ZIP Bundle</span>
                <span className="text-[#89b4fa] font-mono text-[10px]">ZIP</span>
              </button>
              <div className="my-1 border-t border-[#444]" />
              <button
                onClick={() => { onOpenProjectSettings(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Import 3D Model (.obj / .blend)...</span>
                <span className="text-[#a6e3a1] font-mono text-[10px]">OBJ</span>
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
              {onImportBlenderMaterial && (
                <button
                  onClick={() => { onImportBlenderMaterial(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#cba6f7]"
                >
                  <span>Import Blender Material (.json / dict)...</span>
                  <span className="text-[#cba6f7] font-mono text-[10px]">PBR</span>
                </button>
              )}
              {onExportMultiChannelModel && (
                <button
                  onClick={() => { onExportMultiChannelModel(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#3d7fb8] font-semibold"
                >
                  <span>Export Model (glTF / FBX + PBR Maps)...</span>
                  <span className="text-[#3d7fb8] font-mono text-[10px]">3D</span>
                </button>
              )}
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
              <button
                onClick={() => { if (onOpenUndoSettings) onOpenUndoSettings(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#89b4fa]"
              >
                <span>Undo &amp; Redo Settings...</span>
                <span className="font-mono text-[10px]">Ctrl+K</span>
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
              className="absolute top-full left-0 mt-0.5 w-60 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <button
                onClick={() => { onOpenTriplanarDialog(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Triplanar Box Filter &amp; Masking...</span>
                <span className="text-[#888] font-mono text-[10px]">Shift+T</span>
              </button>

              {onOpenGaussianBlur && (
                <button
                  onClick={() => { onOpenGaussianBlur(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#eee]"
                >
                  <span>Gaussian Blur (Selected Layer)...</span>
                  <span className="text-[#888] font-mono text-[10px]">Ctrl+F</span>
                </button>
              )}

              {onOpenStochasticScatter && (
                <button
                  onClick={() => { onOpenStochasticScatter(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#eee]"
                >
                  <span>Stochastic Layer Scattering...</span>
                  <span className="text-[#888] font-mono text-[10px]">Alt+S</span>
                </button>
              )}

              {onOpenStitchStudio && (
                <button
                  onClick={() => { onOpenStitchStudio(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#a6e3a1]"
                >
                  <span>Jenny Stitch Studio (Path Stitches)...</span>
                  <span className="text-[#a6e3a1] font-mono text-[10px]">Mesh</span>
                </button>
              )}

              {onOpenEdgeWearFilter && (
                <button
                  onClick={() => { onOpenEdgeWearFilter(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#a6e3a1]"
                >
                  <span>Edge Wear &amp; Cavity AO Filter...</span>
                  <span className="text-[#a6e3a1] font-mono text-[10px]">Curv</span>
                </button>
              )}

              {onOpenPatternStampDialog && (
                <button
                  onClick={() => { onOpenPatternStampDialog(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#fab387]"
                >
                  <span>Pattern Stamp Decal Setup...</span>
                  <span className="text-[#fab387] font-mono text-[10px]">Decal</span>
                </button>
              )}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider">
                LAYER CONVERSIONS
              </div>

              {onConvertToBump && (
                <button
                  onClick={() => { onConvertToBump(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
                >
                  Convert to Bump Map (Height)
                </button>
              )}

              {onConvertToNormal && (
                <button
                  onClick={() => { onConvertToNormal(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
                >
                  Convert to Normal Map (Sobel RGB)
                </button>
              )}

              {onConvertToClipMask && (
                <button
                  onClick={() => { onConvertToClipMask(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#eee]"
                >
                  Convert to Alpha Clip Mask
                </button>
              )}

              {onConvertToEmissive && (
                <button
                  onClick={() => { onConvertToEmissive(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white text-[#ffb86c] flex items-center justify-between"
                >
                  <span>Convert to Emissive (Glow)</span>
                  <span className="text-[9px] font-mono text-[#ffb86c]/80">BLOOM</span>
                </button>
              )}
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
              className="absolute top-full left-0 mt-0.5 w-56 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              {[
                { id: 'layers', label: 'Texture Layers Manager' },
                { id: 'colorWheel', label: 'Color Palette & Wheel' },
                { id: 'brushes', label: 'Brush Engine & Presets' },
                { id: 'navigator', label: 'Viewport Navigator' },
                { id: 'symmetry', label: 'Symmetry & Cloning Studio' },
                { id: 'masking', label: 'Masking & Selection Studio' },
                { id: 'nodeGraph', label: 'Node Editor (Blender 2.8+)' },
                { id: 'history', label: 'Undo History Ring Buffer' },
              ].map((panel) => (
                <button
                  key={panel.id}
                  onClick={() => { onTogglePanel(panel.id); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between"
                >
                  <span>{panel.label}</span>
                  {activePanels[panel.id] && <span className="text-[#a6e3a1]">✓</span>}
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
              className="absolute top-full left-0 mt-0.5 w-60 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <button
                onClick={() => { if (onOpenHelpPDF) onOpenHelpPDF(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Help Documentation (help.pdf)</span>
                <span className="text-[#a6e3a1] font-mono text-[10px]">PDF</span>
              </button>
              <button
                onClick={() => { if (onOpenTutorialPDF) onOpenTutorialPDF(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between"
              >
                <span>Tutorial Guide (tutorial.pdf)</span>
                <span className="text-[#89b4fa] font-mono text-[10px]">PDF</span>
              </button>
              <div className="my-1 border-t border-[#444]" />
              <button
                onClick={() => { onOpenAbout(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white"
              >
                About VUE 3D Canvas...
              </button>

              {/* Themes Integration inside Help Menu */}
              {onChangeTheme && (
                <>
                  <div className="my-1 border-t border-[#444]" />
                  <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                    <Palette className="w-3 h-3 text-[#e5a038]" />
                    SELECT UI THEME
                  </div>
                  {[
                    { id: 'cs5', label: 'Photoshop CS5 Dark' },
                    { id: 'bw78', label: '78% Black & White Minimal' },
                    { id: 'modern', label: 'Modern Studio Slate' },
                    { id: 'ps2022', label: 'Photoshop 2022 Flat' },
                  ].map((th) => (
                    <button
                      key={th.id}
                      onClick={() => { onChangeTheme(th.id as ThemeMode); close(); }}
                      className={`w-full text-left px-3 py-1 flex items-center justify-between text-[11px] ${
                        currentTheme === th.id
                          ? 'bg-[#3d7fb8] text-white font-medium'
                          : 'hover:bg-[#444] text-[#eee]'
                      }`}
                    >
                      <span>{th.label}</span>
                      {currentTheme === th.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </>
              )}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-1 text-[10px] text-[#888]">
                Author: Victory Ukpong
              </div>
            </div>
          )}
        </div>

        {/* 3D Model Selection Mesh Dropdown beside Help menu */}
        {onSelectModelKey && (
          <div className="flex items-center gap-1.5 bg-[#262626] px-2 py-0.5 rounded border border-[#484848] ml-2 cs5-inset">
            <Box className="w-3.5 h-3.5 text-[#3d7fb8]" />
            <span className="text-[10px] text-[#aaa] font-medium">Mesh:</span>
            <select
              value={selectedModelKey}
              onChange={(e) => onSelectModelKey(e.target.value)}
              className="bg-[#2e2e2e] border border-[#555] text-[#eee] rounded px-1.5 py-0.5 text-[10px] outline-none font-medium cursor-pointer"
              title="Switch 3D Geometry Model Mesh"
            >
              <option value="suzanne">Suzanne (Blender Monkey)</option>
              <option value="helmet">Cyber Armor Helmet</option>
              <option value="sphere">Showcase Sphere</option>
              <option value="cube">Beveled Box</option>
              <option value="cylinder">Barrel Cylinder</option>
              <option value="torus">Arc Torus</option>
            </select>
          </div>
        )}

        {/* Mesh Component Visibility Dropdown with Name IDs & Checkbox */}
        <div className="flex items-center gap-2 bg-[#262626] px-2 py-0.5 rounded border border-[#484848] ml-1 cs5-inset">
          <Eye className="w-3.5 h-3.5 text-[#a6e3a1]" />
          <span className="text-[10px] text-[#aaa] font-medium">Parts:</span>
          <select
            value={meshComponentVisibility}
            onChange={(e) => onSelectMeshComponentVisibility && onSelectMeshComponentVisibility(e.target.value)}
            className="bg-[#2e2e2e] border border-[#555] text-[#eee] rounded px-1.5 py-0.5 text-[10px] outline-none font-medium cursor-pointer"
            title="Dynamically show all mesh components or isolate individual components by Name ID"
          >
            <option value="all">Show All (All Components Included)</option>
            {selectedModelKey === 'suzanne' ? (
              <optgroup label="Components by Name ID">
                <option value="head">[ID: head] Main Head</option>
                <option value="eyes">[ID: eyes] Eyes</option>
                <option value="ears">[ID: ears] Ears</option>
                <option value="muzzle">[ID: muzzle] Muzzle</option>
              </optgroup>
            ) : selectedModelKey === 'helmet' ? (
              <optgroup label="Components by Name ID">
                <option value="dome">[ID: dome] Dome Shell</option>
                <option value="visor">[ID: visor] Visor Plate</option>
                <option value="chin">[ID: chin] Chin Guard</option>
                <option value="sides">[ID: sides] Side Mounts</option>
              </optgroup>
            ) : (
              <optgroup label="Components by Name ID">
                <option value="body">[ID: body] Main Body</option>
                <option value="caps">[ID: caps] End Caps</option>
              </optgroup>
            )}
          </select>

          {/* Checkbox: Show only selected group */}
          <label 
            className="flex items-center gap-1 cursor-pointer select-none text-[9.5px] text-[#ccc] hover:text-white pl-1.5 border-l border-[#444]"
            title="When checked, isolates and displays only the currently selected component/group in the 3D viewport"
          >
            <input
              type="checkbox"
              checked={isolateSelectedGroupOnly}
              onChange={(e) => onToggleIsolateSelectedGroupOnly && onToggleIsolateSelectedGroupOnly(e.target.checked)}
              className="w-3 h-3 accent-[#3d7fb8] rounded cursor-pointer"
            />
            <span className={isolateSelectedGroupOnly ? "text-[#a6e3a1] font-semibold" : "text-[#aaa]"}>
              Show only selected group
            </span>
          </label>
        </div>
      </div>

      {/* Right Quick Controls & Empty Space Launchers */}
      <div className="flex items-center gap-2">
        {/* Decal & Pattern Stamp Studio Button in Empty Space */}
        {onOpenPatternStampDialog && (
          <button
            onClick={onOpenPatternStampDialog}
            className="px-2 py-0.5 bg-[#e5a038] hover:bg-[#f0b555] text-black font-semibold rounded text-[10px] flex items-center gap-1 shadow-xs border border-[#c48528] cursor-pointer"
            title="Open Pattern Stamp / Surface Decal Studio Dialog"
          >
            <Stamp className="w-3 h-3" />
            <span>Decal Stamp Studio</span>
          </button>
        )}

        <button
          onClick={onTriggerProjectionScreenshot}
          className="px-2 py-0.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#555] text-[10px] flex items-center gap-1.5 transition-colors"
          title="Projection Screenshot (F8)"
        >
          <Camera className="w-3 h-3 text-[#3d7fb8]" />
          <span>Projection [F8]</span>
        </button>

        {/* Theme Selector Dropdown selectable in a drop down after projection [F8] button */}
        {onChangeTheme && (
          <div className="flex items-center gap-1 bg-[#262626] px-2 py-0.5 rounded border border-[#484848] cs5-inset">
            <Palette className="w-3 h-3 text-[#e5a038]" />
            <span className="text-[10px] text-[#aaa] font-medium">Theme:</span>
            <select
              value={currentTheme}
              onChange={(e) => onChangeTheme(e.target.value as ThemeMode)}
              className="bg-[#2e2e2e] border border-[#555] text-[#eee] rounded px-1.5 py-0.5 text-[10px] outline-none font-medium cursor-pointer"
              title="Switch Visual Theme Skin"
            >
              <option value="cs5">Photoshop CS5 Dark</option>
              <option value="bw78">78% Black &amp; White Minimal</option>
              <option value="modern">Modern Studio</option>
              <option value="ps2022">Photoshop 2022</option>
            </select>
          </div>
        )}

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
