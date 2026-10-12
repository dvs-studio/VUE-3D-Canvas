/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Triplanar Filter Dialog
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import { TriplanarConfig } from '../tools/fillSuite';
import { Box, Sliders, AlertCircle, Check, X, Eye, Mountain, Compass } from 'lucide-react';

interface TriplanarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: TriplanarConfig) => void;
  defaultColor: string;
}

export const TriplanarDialog: React.FC<TriplanarDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultColor,
}) => {
  const [activeTab, setActiveTab] = useState<'projection' | 'slope' | 'altitude' | 'height'>('projection');

  // Projection Parameters
  const [pattern, setPattern] = useState<TriplanarConfig['pattern']>('checker');
  const [scale, setScale] = useState(8);
  const [blendSharpness, setBlendSharpness] = useState(3.0);
  const [primaryColor, setPrimaryColor] = useState(defaultColor || '#e6e6e6');
  const [secondaryColor, setSecondaryColor] = useState('#222222');
  const [coordinateSpace, setCoordinateSpace] = useState<'object' | 'world'>('object');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Slope Mask Parameters
  const [enableSlopeMask, setEnableSlopeMask] = useState(false);
  const [slopeThreshold, setSlopeThreshold] = useState(0.4);
  const [slopeSmoothing, setSlopeSmoothing] = useState(0.15);
  const [slopeStrength, setSlopeStrength] = useState(1.0);
  const [slopeInvert, setSlopeInvert] = useState(false);
  const [slopeUpAxis, setSlopeUpAxis] = useState<'Y+' | 'Z+' | 'X+'>('Y+');

  // Altitude Mask Parameters
  const [enableAltitudeMask, setEnableAltitudeMask] = useState(false);
  const [altitudeLower, setAltitudeLower] = useState(-0.5);
  const [altitudeUpper, setAltitudeUpper] = useState(0.5);
  const [altitudeSmoothing, setAltitudeSmoothing] = useState(0.15);
  const [altitudeStrength, setAltitudeStrength] = useState(1.0);
  const [altitudeInvert, setAltitudeInvert] = useState(false);

  // Height-aware blending
  const [heightAwareBlending, setHeightAwareBlending] = useState(false);
  const [heightContrast, setHeightContrast] = useState(1.0);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      pattern,
      scale,
      blendSharpness,
      primaryColor,
      secondaryColor,
      coordinateSpace,
      offsetX,
      offsetY,
      enableSlopeMask,
      slopeThreshold,
      slopeSmoothing,
      slopeStrength,
      slopeInvert,
      slopeUpAxis,
      enableAltitudeMask,
      altitudeLower,
      altitudeUpper,
      altitudeSmoothing,
      altitudeStrength,
      altitudeInvert,
      heightAwareBlending,
      heightContrast,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[520px] bg-[#3a3a3a] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Triplanar Box Filter &amp; Masking
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#2d2d2d] border-b border-[#444] px-2 pt-1 gap-1 shrink-0 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('projection')}
            className={`px-3 py-1.5 rounded-t font-medium border-t border-x cursor-pointer transition-colors ${
              activeTab === 'projection'
                ? 'bg-[#3a3a3a] text-white border-[#555]'
                : 'bg-[#262626] text-[#999] border-transparent hover:text-[#ccc]'
            }`}
          >
            XYZ Projection
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slope')}
            className={`px-3 py-1.5 rounded-t font-medium border-t border-x cursor-pointer transition-colors ${
              activeTab === 'slope'
                ? 'bg-[#3a3a3a] text-white border-[#555]'
                : 'bg-[#262626] text-[#999] border-transparent hover:text-[#ccc]'
            }`}
          >
            Slope Mask {enableSlopeMask && '•'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('altitude')}
            className={`px-3 py-1.5 rounded-t font-medium border-t border-x cursor-pointer transition-colors ${
              activeTab === 'altitude'
                ? 'bg-[#3a3a3a] text-white border-[#555]'
                : 'bg-[#262626] text-[#999] border-transparent hover:text-[#ccc]'
            }`}
          >
            Altitude Mask {enableAltitudeMask && '•'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('height')}
            className={`px-3 py-1.5 rounded-t font-medium border-t border-x cursor-pointer transition-colors ${
              activeTab === 'height'
                ? 'bg-[#3a3a3a] text-white border-[#555]'
                : 'bg-[#262626] text-[#999] border-transparent hover:text-[#ccc]'
            }`}
          >
            Height Blend {heightAwareBlending && '•'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 text-xs text-[#ccc] overflow-y-auto flex-1">
          {activeTab === 'projection' && (
            <>
              {/* Pattern Type & Coordinates */}
              <div className="grid grid-cols-2 gap-3 bg-[#333] p-3 rounded border border-[#444]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#aaa]">Projection Pattern</label>
                  <select
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value as any)}
                    className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset"
                  >
                    <option value="checker">Checker Grid</option>
                    <option value="grid">Tech Grid Lines</option>
                    <option value="carbon_fiber">Carbon Fiber Weave</option>
                    <option value="brushed_metal">Brushed Metal Streaks</option>
                    <option value="cellular">Cellular Voronoi</option>
                    <option value="noise">Procedural Simplex Noise</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#aaa]">Coordinate Space</label>
                  <select
                    value={coordinateSpace}
                    onChange={(e) => setCoordinateSpace(e.target.value as any)}
                    className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2 py-1 text-xs outline-none cs5-inset"
                  >
                    <option value="object">Object-Space (UV-less YZ/XZ/XY)</option>
                    <option value="world">World-Space Coordinates</option>
                  </select>
                </div>
              </div>

              {/* Scale & Blend Sharpness */}
              <div className="space-y-2.5 bg-[#333] p-3 rounded border border-[#444]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-[#aaa]">Pattern Frequency (Scale)</label>
                  <span className="text-[10px] text-[#3d7fb8] font-mono">{scale}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="32"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full accent-[#3d7fb8] cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-medium text-[#aaa]">Normal Blend Sharpness</label>
                    <span className="text-[9px] text-[#888]">Adjusts normal exponent power (wx^p, wy^p, wz^p)</span>
                  </div>
                  <span className="text-[10px] text-[#3d7fb8] font-mono">{blendSharpness.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="12.0"
                  step="0.5"
                  value={blendSharpness}
                  onChange={(e) => setBlendSharpness(Number(e.target.value))}
                  className="w-full accent-[#3d7fb8] cursor-pointer"
                />
              </div>

              {/* Colors */}
              <div className="flex items-center justify-between bg-[#333] p-3 rounded border border-[#444]">
                <label className="text-[11px] font-medium text-[#aaa]">Color Balance</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#888]">Primary:</span>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#888]">Secondary:</span>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-[#555] bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'slope' && (
            <div className="space-y-3 bg-[#333] p-3 rounded border border-[#444]">
              <div className="flex items-center justify-between pb-2 border-b border-[#444]">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#eee]">
                  <input
                    type="checkbox"
                    checked={enableSlopeMask}
                    onChange={(e) => setEnableSlopeMask(e.target.checked)}
                    className="accent-[#3d7fb8] rounded"
                  />
                  <span>Enable Slope Angle Mask</span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#888]">Up Axis:</span>
                  <select
                    value={slopeUpAxis}
                    onChange={(e) => setSlopeUpAxis(e.target.value as any)}
                    className="bg-[#242424] border border-[#555] text-white px-1.5 py-0.5 rounded text-[10px] font-mono"
                  >
                    <option value="Y+">Y+ (Vertical)</option>
                    <option value="Z+">Z+ (Forward)</option>
                    <option value="X+">X+ (Lateral)</option>
                  </select>
                </div>
              </div>

              <div className={enableSlopeMask ? 'space-y-2.5 opacity-100' : 'space-y-2.5 opacity-40 pointer-events-none'}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#aaa]">Slope Angle Threshold</span>
                  <span className="text-[10px] font-mono text-[#3d7fb8]">{Math.round(slopeThreshold * 90)}°</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.02"
                  value={slopeThreshold}
                  onChange={(e) => setSlopeThreshold(Number(e.target.value))}
                  className="w-full accent-[#3d7fb8]"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#aaa]">Edge Smoothing</span>
                  <span className="text-[10px] font-mono text-[#3d7fb8]">{slopeSmoothing.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.4"
                  step="0.01"
                  value={slopeSmoothing}
                  onChange={(e) => setSlopeSmoothing(Number(e.target.value))}
                  className="w-full accent-[#3d7fb8]"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-[#bbb]">
                    <input
                      type="checkbox"
                      checked={slopeInvert}
                      onChange={(e) => setSlopeInvert(e.target.checked)}
                      className="accent-[#3d7fb8]"
                    />
                    <span>Invert Slope Mask (Apply on Cliffs / Overhangs)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'altitude' && (
            <div className="space-y-3 bg-[#333] p-3 rounded border border-[#444]">
              <div className="flex items-center justify-between pb-2 border-b border-[#444]">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#eee]">
                  <input
                    type="checkbox"
                    checked={enableAltitudeMask}
                    onChange={(e) => setEnableAltitudeMask(e.target.checked)}
                    className="accent-[#3d7fb8] rounded"
                  />
                  <span>Enable Altitude / Elevation Mask</span>
                </label>
              </div>

              <div className={enableAltitudeMask ? 'space-y-2.5 opacity-100' : 'space-y-2.5 opacity-40 pointer-events-none'}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#aaa]">Lower Elevation Bound</span>
                  <span className="text-[10px] font-mono text-[#3d7fb8]">{altitudeLower.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  value={altitudeLower}
                  onChange={(e) => setAltitudeLower(Number(e.target.value))}
                  className="w-full accent-[#3d7fb8]"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#aaa]">Upper Elevation Bound</span>
                  <span className="text-[10px] font-mono text-[#3d7fb8]">{altitudeUpper.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  value={altitudeUpper}
                  onChange={(e) => setAltitudeUpper(Number(e.target.value))}
                  className="w-full accent-[#3d7fb8]"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-[#bbb]">
                    <input
                      type="checkbox"
                      checked={altitudeInvert}
                      onChange={(e) => setAltitudeInvert(e.target.checked)}
                      className="accent-[#3d7fb8]"
                    />
                    <span>Invert Altitude Mask</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'height' && (
            <div className="space-y-3 bg-[#333] p-3 rounded border border-[#444]">
              <div className="flex items-center justify-between pb-2 border-b border-[#444]">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#eee]">
                  <input
                    type="checkbox"
                    checked={heightAwareBlending}
                    onChange={(e) => setHeightAwareBlending(e.target.checked)}
                    className="accent-[#3d7fb8] rounded"
                  />
                  <span>Height-Aware Projection Blending</span>
                </label>
              </div>

              <p className="text-[10px] text-[#999] leading-relaxed">
                Modulates the X/Y/Z projection boundary weights using the pattern's procedural height profile, creating crisp crevice seams instead of soft linear fades.
              </p>

              <div className={heightAwareBlending ? 'space-y-2 opacity-100' : 'space-y-2 opacity-40 pointer-events-none'}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#aaa]">Height Blend Contrast</span>
                  <span className="text-[10px] font-mono text-[#3d7fb8]">{heightContrast.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={heightContrast}
                  onChange={(e) => setHeightContrast(Number(e.target.value))}
                  className="w-full accent-[#3d7fb8]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-end gap-2 border-t border-[#444] shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-[#ccc] rounded border border-[#555] text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1 bg-[#3d7fb8] hover:bg-[#4d92cf] text-white rounded border border-[#5ba0db] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Triplanar Fill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
