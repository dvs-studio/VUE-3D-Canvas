/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Autodesk Sketchbook Style Color Wheel
 * Created by Victory Ukpong
 */

import React, { useRef, useState, useEffect } from 'react';

interface ColorWheelPanelProps {
  currentColor: string;
  onChangeColor: (hex: string) => void;
}

export const ColorWheelPanel: React.FC<ColorWheelPanelProps> = ({
  currentColor,
  onChangeColor,
}) => {
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hue, setHue] = useState(210); // 0 - 360
  const [saturation, setSaturation] = useState(80); // 0 - 100
  const [lightness, setLightness] = useState(60); // 0 - 100
  const [hexInput, setHexInput] = useState(currentColor);
  const [pickerMode, setPickerMode] = useState<'palette' | 'hsl'>('palette');

  // Synchronize hex input with external color prop
  useEffect(() => {
    setHexInput(currentColor);
    const parsed = hexToHsl(currentColor);
    if (parsed) {
      setHue(parsed[0]);
      setSaturation(parsed[1]);
      setLightness(parsed[2]);
    }
  }, [currentColor]);

  // Draw circular hue ring
  useEffect(() => {
    const cvs = wheelCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const size = cvs.width;
    const center = size / 2;
    const outerRadius = center - 4;
    const innerRadius = outerRadius - 16;

    ctx.clearRect(0, 0, size, size);

    // Render 360 segments for hue ring
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(center, center, outerRadius, startAngle, endAngle);
      ctx.arc(center, center, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.fill();
    }

    // Render center Saturation/Lightness box
    const boxSize = innerRadius * 1.1;
    const boxLeft = center - boxSize / 2;
    const boxTop = center - boxSize / 2;

    const satGrad = ctx.createLinearGradient(boxLeft, boxTop, boxLeft + boxSize, boxTop);
    satGrad.addColorStop(0, '#ffffff');
    satGrad.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
    ctx.fillStyle = satGrad;
    ctx.fillRect(boxLeft, boxTop, boxSize, boxSize);

    const lightGrad = ctx.createLinearGradient(boxLeft, boxTop, boxLeft, boxTop + boxSize);
    lightGrad.addColorStop(0, 'rgba(0,0,0,0)');
    lightGrad.addColorStop(1, '#000000');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(boxLeft, boxTop, boxSize, boxSize);

    // Border around center box
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxLeft, boxTop, boxSize, boxSize);
  }, [hue]);

  const handleWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = wheelCanvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const x = e.clientX - rect.left - cvs.width / 2;
    const y = e.clientY - rect.top - cvs.height / 2;
    const dist = Math.hypot(x, y);

    const outerRadius = cvs.width / 2 - 4;
    const innerRadius = outerRadius - 16;

    if (dist >= innerRadius && dist <= outerRadius) {
      // Clicked on hue ring
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setHue(Math.round(angle));
      updateColorFromHsl(angle, saturation, lightness);
    } else if (dist < innerRadius) {
      // Clicked in center sat/val square
      const boxSize = innerRadius * 1.1;
      const localX = Math.min(boxSize, Math.max(0, x + boxSize / 2));
      const localY = Math.min(boxSize, Math.max(0, y + boxSize / 2));
      const newSat = Math.round((localX / boxSize) * 100);
      const newLight = Math.round((1.0 - (localY / boxSize) * 0.8) * 60);
      setSaturation(newSat);
      setLightness(newLight);
      updateColorFromHsl(hue, newSat, newLight);
    }
  };

  const updateColorFromHsl = (h: number, s: number, l: number) => {
    const rgb = hslToRgb(h / 360, s / 100, l / 100);
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    setHexInput(hex);
    onChangeColor(hex);
  };

  const swatches = [
    '#ffffff', '#808080', '#1a1a1a', '#e74c3c', '#e67e22',
    '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
  ];

  return (
    <div className="flex flex-col items-center p-2.5 text-xs text-[#c8c8c8] select-none bg-[#383838] gap-2">
      <div className="w-full flex items-center justify-between bg-[#2b2b2b] border border-[#4a4a4a] rounded p-0.5">
        <button type="button" onClick={() => setPickerMode('palette')} className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${pickerMode === 'palette' ? 'bg-[#3d7fb8] text-white' : 'text-[#999] hover:text-white'}`}>Palette</button>
        <button type="button" onClick={() => setPickerMode('hsl')} className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${pickerMode === 'hsl' ? 'bg-[#3d7fb8] text-white' : 'text-[#999] hover:text-white'}`}>HSL Sliders</button>
      </div>
      {pickerMode === 'palette' ? (
        <>
      {/* Interactive Color Wheel Canvas */}
      <div className="relative mb-2">
        <canvas
          ref={wheelCanvasRef}
          width={160}
          height={160}
          onClick={handleWheelClick}
          className="cursor-crosshair rounded-full border border-[#444] shadow-md cs5-inset"
        />
      </div>

        </>
      ) : (
        <div className="w-full space-y-3 py-1">
          <div className="h-12 rounded border border-[#555] shadow-inner" style={{ backgroundColor: currentColor }} />
          <label className="block space-y-1">
            <span className="flex justify-between text-[10px]"><span>Hue</span><strong className="font-mono">{Math.round(hue)}°</strong></span>
            <input aria-label="Hue" type="range" min="0" max="360" step="1" value={hue} onChange={e => { const value = Number(e.target.value); setHue(value); updateColorFromHsl(value, saturation, lightness); }} className="w-full accent-[#3d7fb8]" style={{ background: 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }} />
          </label>
          <label className="block space-y-1">
            <span className="flex justify-between text-[10px]"><span>Saturation</span><strong className="font-mono">{Math.round(saturation)}%</strong></span>
            <input aria-label="Saturation" type="range" min="0" max="100" step="1" value={saturation} onChange={e => { const value = Number(e.target.value); setSaturation(value); updateColorFromHsl(hue, value, lightness); }} className="w-full accent-[#3d7fb8]" style={{ background: `linear-gradient(90deg,hsl(${hue},0%,${lightness}%),hsl(${hue},100%,${lightness}%))` }} />
          </label>
          <label className="block space-y-1">
            <span className="flex justify-between text-[10px]"><span>Lightness</span><strong className="font-mono">{Math.round(lightness)}%</strong></span>
            <input aria-label="Lightness" type="range" min="0" max="100" step="1" value={lightness} onChange={e => { const value = Number(e.target.value); setLightness(value); updateColorFromHsl(hue, saturation, value); }} className="w-full accent-[#3d7fb8]" style={{ background: `linear-gradient(90deg,#000,hsl(${hue},${saturation}%,50%),#fff)` }} />
          </label>
        </div>
      )}

      {/* Hex and RGB Inputs */}
      <div className="w-full flex items-center justify-between gap-2 px-1 mb-2">
        <div className="flex items-center gap-1.5 flex-1">
          <div
            className="w-5 h-5 rounded border border-[#666] cs5-inset"
            style={{ backgroundColor: currentColor }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value);
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                onChangeColor(e.target.value);
              }
            }}
            className="w-20 bg-[#242424] border border-[#555] text-[#eee] rounded px-1.5 py-0.5 text-[11px] font-mono outline-none cs5-inset"
          />
        </div>
        <div className="text-[10px] text-[#888] font-mono">
          H:{Math.round(hue)}°
        </div>
      </div>

      {/* Palette Swatches */}
      {pickerMode === 'palette' && (
        <div className="w-full grid grid-cols-5 gap-1 pt-1.5 border-t border-[#484848]">
          {swatches.map((color) => (
            <button
              key={color}
              onClick={() => {
                setHexInput(color);
                onChangeColor(color);
              }}
              className="h-4 rounded-xs border border-[#555] hover:scale-110 transition-transform cs5-inset"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function hexToHsl(hex: string): [number, number, number] | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
