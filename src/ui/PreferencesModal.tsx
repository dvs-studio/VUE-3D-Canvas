/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Application Preferences & Workspace Configuration
 * Created by Victory Ukpong
 */

import React from 'react';
import { 
  X, 
  Settings, 
  Zap, 
  Tablet, 
  Box, 
  CircleDot, 
  Mountain, 
  Sliders, 
  Check, 
  Monitor, 
  Gauge
} from 'lucide-react';
import { PreferencesState, GizmoStyle } from '../core/types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: PreferencesState;
  onUpdatePreferences: (patch: Partial<PreferencesState>) => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 select-none p-4">
      <div className="w-[580px] max-w-full bg-[#333333] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset text-xs text-[#c8c8c8] flex flex-col">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between border-b border-[#444]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#3d7fb8]" />
            <span className="font-bold text-[#eee] uppercase tracking-wider text-[11px]">
              VUE 3D Canvas Preferences &amp; Workspace Configuration
            </span>
          </div>
          <button onClick={onClose} className="text-[#aaa] hover:text-white p-0.5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preferences Sections */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="bg-[#2a2a2a] p-3 rounded border border-[#444]">
            <span className="font-bold text-[#eee] text-xs">Viewport</span>
            <p className="text-[10px] text-[#999] mt-1 leading-snug">
              This web build always draws. The refresh-rate cap is not used here, because it was freezing the view. A frame cap can come back on the Windows programme later.
            </p>
          </div>

          {/* Section 2: 3D Orientation Gizmo Style */}
          <div className="bg-[#2a2a2a] p-3 rounded border border-[#444] space-y-2.5">
            <span className="font-bold text-[#eee] text-xs flex items-center gap-1.5">
              <Box className="w-4 h-4 text-[#a6e3a1]" />
              3D Orientation Gizmo Style
            </span>

            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: Box Cube */}
              <button
                onClick={() => onUpdatePreferences({ gizmoStyle: 'box' })}
                className={`p-2.5 rounded border flex flex-col items-center gap-1.5 text-center transition-all ${
                  preferences.gizmoStyle === 'box'
                    ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white shadow-xs'
                    : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                }`}
              >
                <Box className="w-5 h-5 text-[#3d7fb8]" />
                <span className="font-bold text-[11px]">Isometric Box</span>
                <span className="text-[9px] text-[#888] leading-tight">Authentic Cube with Viewport Faces</span>
              </button>

              {/* Option 2: 3D Sphere */}
              <button
                onClick={() => onUpdatePreferences({ gizmoStyle: 'sphere' })}
                className={`p-2.5 rounded border flex flex-col items-center gap-1.5 text-center transition-all ${
                  preferences.gizmoStyle === 'sphere'
                    ? 'bg-[#a6e3a1]/25 border-[#a6e3a1] text-white shadow-xs'
                    : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                }`}
              >
                <CircleDot className="w-5 h-5 text-[#a6e3a1]" />
                <span className="font-bold text-[11px]">3D Sphere</span>
                <span className="text-[9px] text-[#888] leading-tight">Spherical Trackball with Orthogonal Rings</span>
              </button>

              {/* Option 3: Mountain */}
              <button
                onClick={() => onUpdatePreferences({ gizmoStyle: 'mountain' })}
                className={`p-2.5 rounded border flex flex-col items-center gap-1.5 text-center transition-all ${
                  preferences.gizmoStyle === 'mountain'
                    ? 'bg-[#fab387]/25 border-[#fab387] text-white shadow-xs'
                    : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                }`}
              >
                <Mountain className="w-5 h-5 text-[#fab387]" />
                <span className="font-bold text-[11px]">3D Mountain</span>
                <span className="text-[9px] text-[#888] leading-tight">Trapezium Peaks with Elevation Colors</span>
              </button>
            </div>
          </div>

          {/* Section 3: Tablet Mode & Brush Parameter Sub-Operator */}
          <div className="bg-[#2a2a2a] p-3 rounded border border-[#444] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#eee] text-xs flex items-center gap-1.5">
                <Tablet className="w-4 h-4 text-[#cba6f7]" />
                Tablet &amp; Stylus Mode
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                preferences.tabletMode 
                  ? 'bg-purple-950/80 text-purple-300 border-purple-600' 
                  : 'bg-zinc-800 text-zinc-400 border-zinc-600'
              }`}>
                {preferences.tabletMode ? 'Tablet Layout Active' : 'Desktop Mode (Default)'}
              </span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer bg-[#323232] p-2.5 rounded border border-[#404040]">
              <input
                type="checkbox"
                checked={preferences.tabletMode}
                onChange={(e) => onUpdatePreferences({ tabletMode: e.target.checked })}
                className="mt-0.5 accent-[#3d7fb8]"
              />
              <div className="text-[11px]">
                <strong className="text-white block">Enable Tablet Mode (Maximized Drawing Space)</strong>
                <span className="text-[#999] text-[10px] leading-snug block mt-0.5">
                  Maximizes the canvas for stylus drawing. The left tools dock transforms into a bottom-left circular carousel; brush dynamics appear in a top-left quick carousel; dockers collapse into an expandable/hideable N-Panel drawer (shortcut: N); and floating filters stay non-blocking.
                </span>
              </div>
            </label>

            {/* Tablet Parameter Sub-Operator Selection */}
            <div className="pt-1 space-y-1.5">
              <label className="text-[11px] font-medium text-[#aaa] block">
                Tablet Brush Parameter Sub-Operator Style:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePreferences({ tabletSubOperator: 'radial' })}
                  className={`p-2 rounded border text-left transition-all ${
                    (preferences.tabletSubOperator || 'radial') === 'radial'
                      ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white'
                      : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                  }`}
                >
                  <strong className="block text-[11px]">Radial Dial Popup</strong>
                  <span className="text-[9px] text-[#888] block">Interactive circular arc around active button</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePreferences({ tabletSubOperator: 'hud' })}
                  className={`p-2 rounded border text-left transition-all ${
                    preferences.tabletSubOperator === 'hud'
                      ? 'bg-[#3d7fb8]/30 border-[#3d7fb8] text-white'
                      : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                  }`}
                >
                  <strong className="block text-[11px]">Floating Circular HUD</strong>
                  <span className="text-[9px] text-[#888] block">Compact circular dial anchored beneath carousel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Options Bar Layout (Overlap Prevention) */}
          <div className="bg-[#2a2a2a] p-3 rounded border border-[#444] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#eee] text-xs flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-[#fbbf24]" />
                Tool Options Bar Layout (Sub-Menu Row)
              </span>
              <span className="text-[10px] font-mono text-[#888]">
                {preferences.optionsBarLayout === 'compact' ? 'Collapsible Groups' : 'Responsive Clusters'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdatePreferences({ optionsBarLayout: 'clusters' })}
                className={`p-2 rounded border text-left transition-all ${
                  (preferences.optionsBarLayout || 'clusters') === 'clusters'
                    ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-white'
                    : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                }`}
              >
                <strong className="block text-[11px]">Grouped Clusters</strong>
                <span className="text-[9px] text-[#888] block">Full Photoshop CS5 sub-bar with semantic clusters</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ optionsBarLayout: 'minimal' })}
                className={`p-2 rounded border text-left transition-all ${
                  preferences.optionsBarLayout === 'minimal'
                    ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-white'
                    : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                }`}
              >
                <strong className="block text-[11px]">Minimal (Clean)</strong>
                <span className="text-[9px] text-[#888] block">Core brush parameters only; secondary tools in Menu Bar</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ optionsBarLayout: 'compact' })}
                className={`p-2 rounded border text-left transition-all ${
                  preferences.optionsBarLayout === 'compact'
                    ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-white'
                    : 'bg-[#262626] border-[#444] text-[#aaa] hover:bg-[#333]'
                }`}
              >
                <strong className="block text-[11px]">Collapsible Groups</strong>
                <span className="text-[9px] text-[#888] block">Condenses secondary tools into compact flyouts</span>
              </button>
            </div>
          </div>

          {/* Section 5: Architectural Mesh Auto-Repair (SweetHome 3D) */}
          <div className="bg-[#2a2a2a] p-3 rounded border border-[#444] space-y-2">
            <span className="font-bold text-[#eee] text-xs flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#e879f9]" />
              Architectural Mesh Auto-Repair (SweetHome 3D &amp; CAD)
            </span>
            <label className="flex items-start gap-2.5 cursor-pointer bg-[#323232] p-2.5 rounded border border-[#404040]">
              <input
                type="checkbox"
                checked={preferences.architecturalRepair === true}
                onChange={(e) => onUpdatePreferences({ architecturalRepair: e.target.checked })}
                className="mt-0.5 accent-[#3d7fb8]"
              />
              <div className="text-[11px]">
                <strong className="text-white block">Weld split vertices on import</strong>
                <span className="text-[#999] text-[10px] leading-snug block mt-0.5">
                  Off by default. Import shows the file normals. Smooth and Flat are the overwrite buttons. Turn this on only when a CAD wall needs the weld, then re-import. Def restores the cached file normals.
                </span>
              </div>
            </label>
          </div>

          {/* Section 6: 3D Camera Navigation Sensitivity */}
          <div className="bg-[#2a2a2a] p-3 rounded border border-[#444] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#eee] text-xs flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#f38ba8]" />
                Navigation Speed &amp; Sensitivity
              </span>
              <span className="font-mono text-[#eee] text-[11px]">
                {preferences.navSensitivity.toFixed(2)}x
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#888]">
                <span>Slower (High Precision)</span>
                <span>Default (1.0x)</span>
                <span>Faster</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="2.5"
                step="0.05"
                value={preferences.navSensitivity}
                onChange={(e) => onUpdatePreferences({ navSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2a2a2a] px-4 py-2.5 flex items-center justify-end gap-2 border-t border-[#444]">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white font-bold rounded border border-[#5497d5] text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
