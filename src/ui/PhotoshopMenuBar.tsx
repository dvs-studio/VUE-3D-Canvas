/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Photoshop CS5 Dark Neutral Gray Menu Bar
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { Box, Camera, Info, Save, FolderOpen, Layers, Undo2, Redo2, Sliders, Eye, Palette, Check, Stamp, Cpu, Settings, SplitSquareVertical, LayoutGrid, Activity, Compass } from 'lucide-react';
import { ThemeMode, ViewportShadingMode, SurfaceShadingMode } from '../core/types';

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
  onOpenPreferences?: () => void;
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
  gpuBackend?: 'dx11' | 'opengl' | 'modern';
  onChangeGpuBackend?: (backend: 'dx11' | 'opengl' | 'modern') => void;
  onOpenGpuDiagnostics?: () => void;
  shadingMode?: ViewportShadingMode;
  onSelectShadingMode?: (mode: ViewportShadingMode) => void;
  surfaceMode?: SurfaceShadingMode;
  onSelectSurfaceMode?: (mode: SurfaceShadingMode) => void;
  viewMode?: '3d' | '2d' | 'split';
  onSelectViewMode?: (mode: '3d' | '2d' | 'split') => void;
  viewLayout?: 'perspective' | 'quad';
  onSelectViewLayout?: (layout: 'perspective' | 'quad') => void;
  isSymmetryX?: boolean;
  onToggleSymmetryX?: () => void;
  isLagoonActive?: boolean;
  onToggleLagoon?: () => void;
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
  onOpenPreferences,
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
  gpuBackend = 'dx11',
  onChangeGpuBackend,
  onOpenGpuDiagnostics,
  shadingMode = 'material',
  onSelectShadingMode,
  surfaceMode = 'default',
  onSelectSurfaceMode,
  viewMode = '3d',
  onSelectViewMode,
  viewLayout = 'perspective',
  onSelectViewLayout,
  isSymmetryX = false,
  onToggleSymmetryX,
  isLagoonActive = false,
  onToggleLagoon,
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
              {onOpenPreferences && (
                <button
                  onClick={() => { onOpenPreferences(); close(); }}
                  className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex justify-between text-[#a6e3a1]"
                >
                  <span>Preferences...</span>
                  <span className="font-mono text-[10px]">Ctrl+,</span>
                </button>
              )}
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
              className="absolute top-full left-0 mt-0.5 w-64 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#3d7fb8]" />
                VIEWPORT SHADING
              </div>
              {[
                { id: 'material', label: 'PBR Material (Shaded & Textured)' },
                { id: 'flat', label: 'Flat Color (Unlit Albedo)' },
                { id: 'normal', label: 'Surface Normals (RGB Vectors)' },
                { id: 'wireframe', label: 'Wireframe Topology' },
                { id: 'clay', label: 'Studio Clay (MatCap)' },
                { id: 'uv_check', label: 'UV Checkerboard Pattern' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => { if (onSelectShadingMode) onSelectShadingMode(s.id as any); close(); }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    shadingMode === s.id ? 'bg-[#3d7fb8] text-white font-medium' : 'hover:bg-[#444] text-[#eee]'
                  }`}
                >
                  <span>{s.label}</span>
                  {shadingMode === s.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#a6e3a1]" />
                SURFACE NORMALS
              </div>
              {[
                { id: 'default', label: 'Default (Original File Normals)', desc: 'Restores model geometry' },
                { id: 'smooth', label: 'Smooth (Angle-Interpolated)', desc: 'Smooth curvature blending' },
                { id: 'flat', label: 'Flat (Hard Surface / Faceted)', desc: 'Sharp polygon boundaries' },
              ].map((sm) => (
                <button
                  key={sm.id}
                  onClick={() => { if (onSelectSurfaceMode) onSelectSurfaceMode(sm.id as any); close(); }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    surfaceMode === sm.id ? 'bg-[#3d7fb8] text-white font-medium' : 'hover:bg-[#444] text-[#eee]'
                  }`}
                  title={sm.desc}
                >
                  <span>{sm.label}</span>
                  {surfaceMode === sm.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                <LayoutGrid className="w-3 h-3 text-[#e5a038]" />
                VIEWPORT LAYOUT
              </div>
              {[
                { id: 'perspective', label: 'Perspective Single View' },
                { id: 'quad', label: 'Quad 4-Way View (Blender Ortho)' },
              ].map((vl) => (
                <button
                  key={vl.id}
                  onClick={() => { if (onSelectViewLayout) onSelectViewLayout(vl.id as any); close(); }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    (viewLayout || 'perspective') === vl.id ? 'bg-[#3d7fb8] text-white font-medium' : 'hover:bg-[#444] text-[#eee]'
                  }`}
                >
                  <span>{vl.label}</span>
                  {(viewLayout || 'perspective') === vl.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#38bdf8]" />
                CANVAS VIEW MODE
              </div>
              {[
                { id: '3d', label: '3D Viewport Only' },
                { id: 'split', label: 'Split (3D + 2D UV Texture)' },
                { id: '2d', label: '2D UV Map Only' },
              ].map((vm) => (
                <button
                  key={vm.id}
                  onClick={() => { if (onSelectViewMode) onSelectViewMode(vm.id as any); close(); }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    viewMode === vm.id ? 'bg-[#3d7fb8] text-white font-medium' : 'hover:bg-[#444] text-[#eee]'
                  }`}
                >
                  <span>{vm.label}</span>
                  {viewMode === vm.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}

              {onToggleSymmetryX && (
                <>
                  <div className="my-1 border-t border-[#444]" />
                  <button
                    onClick={() => { onToggleSymmetryX(); close(); }}
                    className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
                  >
                    <span className="flex items-center gap-1.5">
                      <SplitSquareVertical className="w-3.5 h-3.5 text-[#3d7fb8]" />
                      Symmetry Mirroring
                    </span>
                    <span className={`font-mono text-[10px] ${isSymmetryX ? 'text-[#a6e3a1] font-bold' : 'text-[#888]'}`}>
                      {isSymmetryX ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </>
              )}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                <Box className="w-3 h-3 text-[#3d7fb8]" />
                CAMERA VIEWPOINTS
              </div>
              <button
                onClick={() => { onNumpadKey('1', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Front View</span>
                <span className="font-mono text-[9px] text-[#888]">Num 1</span>
              </button>
              <button
                onClick={() => { onNumpadKey('1', true); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Back View</span>
                <span className="font-mono text-[9px] text-[#888]">Ctrl+Num 1</span>
              </button>
              <button
                onClick={() => { onNumpadKey('3', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Right View</span>
                <span className="font-mono text-[9px] text-[#888]">Num 3</span>
              </button>
              <button
                onClick={() => { onNumpadKey('3', true); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Left View</span>
                <span className="font-mono text-[9px] text-[#888]">Ctrl+Num 3</span>
              </button>
              <button
                onClick={() => { onNumpadKey('7', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Top View</span>
                <span className="font-mono text-[9px] text-[#888]">Num 7</span>
              </button>
              <button
                onClick={() => { onNumpadKey('7', true); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Bottom View</span>
                <span className="font-mono text-[9px] text-[#888]">Ctrl+Num 7</span>
              </button>
              <button
                onClick={() => { onNumpadKey('5', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Perspective / Ortho</span>
                <span className="font-mono text-[9px] text-[#888]">Num 5</span>
              </button>
              <button
                onClick={() => { onNumpadKey('0', false); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span>Reset View Zoom</span>
                <span className="font-mono text-[9px] text-[#888]">Num 0</span>
              </button>
            </div>
          )}
        </div>

        {/* OPTIONS MENU */}
        <div className="relative">
          <button
            onClick={() => toggle('options')}
            className={`px-2 py-0.5 rounded hover:bg-[#444] hover:text-white transition-colors ${
              openMenu === 'options' ? 'bg-[#2b2b2b] text-white' : ''
            }`}
          >
            Options
          </button>
          {openMenu === 'options' && (
            <div 
              className="absolute top-full left-0 mt-0.5 w-68 bg-[#333333] border border-[#555] rounded shadow-2xl py-1 z-50 text-[11px] cs5-outset"
              onMouseLeave={close}
            >
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                <Box className="w-3 h-3 text-[#3d7fb8]" />
                3D MESH GEOMETRY
              </div>
              {[
                { id: 'suzanne', label: 'Suzanne (Blender Monkey)' },
                { id: 'helmet', label: 'Cyber Armor Helmet' },
                { id: 'pavilion', label: 'Classical Architectural Colonnade' },
                { id: 'sphere', label: 'Showcase Sphere' },
                { id: 'cube', label: 'Beveled Box' },
                { id: 'cylinder', label: 'Barrel Cylinder' },
                { id: 'torus', label: 'Arc Torus' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => { if (onSelectModelKey) onSelectModelKey(m.id); close(); }}
                  className={`w-full text-left px-3 py-1 flex items-center justify-between ${
                    selectedModelKey === m.id ? 'bg-[#3d7fb8] text-white font-medium' : 'hover:bg-[#444] text-[#eee]'
                  }`}
                >
                  <span>{m.label}</span>
                  {selectedModelKey === m.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#a6e3a1]" />
                PARTS VISIBILITY &amp; ISOLATION
              </div>
              <div className="px-3 py-1 flex flex-col gap-1">
                <select
                  value={meshComponentVisibility}
                  onChange={(e) => {
                    if (onSelectMeshComponentVisibility) onSelectMeshComponentVisibility(e.target.value);
                  }}
                  className="w-full bg-[#242424] border border-[#555] text-white rounded px-1.5 py-1 text-[10px] outline-none font-medium cursor-pointer"
                >
                  <option value="all">Show All Components</option>
                  {selectedModelKey === 'suzanne' ? (
                    <optgroup label="Suzanne Parts">
                      <option value="head">[ID: head] Main Head</option>
                      <option value="eyes">[ID: eyes] Eyes</option>
                      <option value="ears">[ID: ears] Ears</option>
                      <option value="muzzle">[ID: muzzle] Muzzle</option>
                    </optgroup>
                  ) : selectedModelKey === 'helmet' ? (
                    <optgroup label="Helmet Parts">
                      <option value="dome">[ID: dome] Dome Shell</option>
                      <option value="visor">[ID: visor] Visor Plate</option>
                      <option value="chin">[ID: chin] Chin Guard</option>
                      <option value="sides">[ID: sides] Side Mounts</option>
                    </optgroup>
                  ) : (
                    <optgroup label="Model Parts">
                      <option value="body">[ID: body] Main Body</option>
                      <option value="caps">[ID: caps] End Caps</option>
                    </optgroup>
                  )}
                </select>

                <label className="flex items-center gap-1.5 text-[10px] text-[#ccc] hover:text-white cursor-pointer select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={isolateSelectedGroupOnly}
                    onChange={(e) => {
                      if (onToggleIsolateSelectedGroupOnly) onToggleIsolateSelectedGroupOnly(e.target.checked);
                    }}
                    className="w-3 h-3 accent-[#3d7fb8] rounded"
                  />
                  <span>Isolate selected part only</span>
                </label>
              </div>

              {onOpenPatternStampDialog && (
                <>
                  <div className="my-1 border-t border-[#444]" />
                  <button
                    onClick={() => { onOpenPatternStampDialog(); close(); }}
                    className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#fab387]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Stamp className="w-3.5 h-3.5" />
                      Decal &amp; Stamp Studio...
                    </span>
                    <span className="font-mono text-[9px]">DECAL</span>
                  </button>
                </>
              )}

              <button
                onClick={() => { onTriggerProjectionScreenshot(); close(); }}
                className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#eee]"
              >
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#3d7fb8]" />
                  Projection Screenshot
                </span>
                <span className="font-mono text-[9px] text-[#888]">F8</span>
              </button>

              {onChangeTheme && (
                <>
                  <div className="my-1 border-t border-[#444]" />
                  <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                    <Palette className="w-3 h-3 text-[#e5a038]" />
                    UI THEME SKIN
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
                        currentTheme === th.id ? 'bg-[#3d7fb8] text-white font-medium' : 'hover:bg-[#444] text-[#eee]'
                      }`}
                    >
                      <span>{th.label}</span>
                      {currentTheme === th.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </>
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

              {/* Graphics Hardware Backend Switcher */}
              {onChangeGpuBackend && (
                <>
                  <div className="my-1 border-t border-[#444]" />
                  <div className="px-3 py-0.5 text-[9px] font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#3d7fb8]" />
                    GRAPHICS HARDWARE BACKEND
                  </div>
                  {[
                    { id: 'dx11', label: 'DirectX 11 (D3D11 - Priority)' },
                    { id: 'opengl', label: 'OpenGL 2.0+ / Desktop GL' },
                    { id: 'modern', label: 'Modern Auto-Detect (DX12/VK)' },
                  ].map((backend) => (
                    <button
                      key={backend.id}
                      onClick={() => { onChangeGpuBackend(backend.id as any); close(); }}
                      className={`w-full text-left px-3 py-1 flex items-center justify-between text-[11px] ${
                        gpuBackend === backend.id
                          ? 'bg-[#3d7fb8] text-white font-medium'
                          : 'hover:bg-[#444] text-[#eee]'
                      }`}
                      title={backend.id === 'dx11' ? 'DirectX 11 Compatibility Priority Mode' : backend.label}
                    >
                      <span>{backend.label}</span>
                      {gpuBackend === backend.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                  {onOpenGpuDiagnostics && (
                    <button
                      onClick={() => { onOpenGpuDiagnostics(); close(); }}
                      className="w-full text-left px-3 py-1 hover:bg-[#3d7fb8] hover:text-white flex items-center justify-between text-[#89b4fa] mt-0.5"
                    >
                      <span>GPU Hardware Diagnostics...</span>
                      <span className="text-[9px] font-mono bg-[#3d7fb8]/30 px-1 rounded">INFO</span>
                    </button>
                  )}
                </>
              )}

              <div className="my-1 border-t border-[#444]" />
              <div className="px-3 py-1 text-[10px] text-[#888]">
                Author: Victory Ukpong
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Quick Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleLagoon && (
          <button
            onClick={onToggleLagoon}
            className={`px-2 py-0.5 rounded border text-[10px] flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
              isLagoonActive
                ? 'bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white border-[#5ca2db] shadow-sm'
                : 'bg-[#2a2a2a] hover:bg-[#383838] text-[#a6e3a1] border-[#555]'
            }`}
            title="Toggle Autodesk Sketchbook / Maya Lagoon Radial Interface (Tab)"
          >
            <Compass className={`w-3.5 h-3.5 ${isLagoonActive ? 'text-white' : 'text-[#a6e3a1]'}`} />
            <span>Lagoon {isLagoonActive ? 'ON' : 'OFF'}</span>
          </button>
        )}

        <button
          onClick={onTriggerProjectionScreenshot}
          className="px-2 py-0.5 bg-[#444] hover:bg-[#505050] text-[#eee] rounded border border-[#555] text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Projection Screenshot (F8)"
        >
          <Camera className="w-3 h-3 text-[#3d7fb8]" />
          <span>Projection [F8]</span>
        </button>

        {onOpenPreferences && (
          <button
            onClick={onOpenPreferences}
            className="p-1 text-[#aaa] hover:text-[#38bdf8] hover:bg-[#444] rounded transition-colors cursor-pointer"
            title="Preferences & Tablet Mode..."
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onOpenAbout}
          className="text-[#aaa] hover:text-white p-1 hover:bg-[#444] rounded transition-colors cursor-pointer"
          title="About VUE 3D Canvas"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
