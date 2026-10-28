/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - FBX & glTF Intelligent Multi-Channel Model Export Dialog
 * Created by Victory Ukpong
 */

import React, { useState } from 'react';
import * as THREE from 'three';
import { Layer } from '../core/types';
import { ModelExporterEngine, ModelExportOptions } from '../core/modelExporters';
import { 
  Download, Box, Check, X, Layers, Sparkles, Image, Flame, Shield 
} from 'lucide-react';

interface ExportModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  currentMesh: THREE.Mesh | null;
  activeModelName?: string;
  activeUVChannel?: string;
}

export const ExportModelDialog: React.FC<ExportModelDialogProps> = ({
  isOpen,
  onClose,
  layers,
  currentMesh,
  activeModelName = 'Suzanne',
  activeUVChannel = 'uv_original',
}) => {
  const [format, setFormat] = useState<'gltf' | 'glb' | 'fbx'>('gltf');
  const [modelName, setModelName] = useState<string>(activeModelName);
  const [resolution, setResolution] = useState<number>(2048);
  const [embedTextures, setEmbedTextures] = useState<boolean>(true);

  const [channels, setChannels] = useState({
    albedo: true,
    emission: true,
    displacement: true,
    normal: true,
    roughness: true,
    metallic: true,
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleChannel = (key: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    setIsExporting(true);
    setExportComplete(false);

    setTimeout(() => {
      // 1. Separate channels automatically
      const separated = ModelExporterEngine.separateChannels(layers, resolution);

      const options: ModelExportOptions = {
        format,
        modelName,
        textureResolution: resolution,
        embedTextures,
        exportChannels: channels,
      };

      // Mock mesh if none provided
      const meshToExport = currentMesh || new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial());

      if (format === 'gltf' || format === 'glb') {
        const gltfJson = ModelExporterEngine.exportGLTF(meshToExport, separated, options);
        ModelExporterEngine.triggerDownload(`${modelName}.gltf`, gltfJson, 'application/json');
      } else {
        const fbxAscii = ModelExporterEngine.exportFBX(meshToExport, separated, options);
        ModelExporterEngine.triggerDownload(`${modelName}.fbx`, fbxAscii, 'text/plain');
      }

      // Also trigger individual channel texture downloads with active UV midfix
      const uvTag = activeUVChannel === 'uv_tightmap' 
        ? 'TightMap' 
        : (activeUVChannel === 'uv_original' ? 'OriginalUV' : activeUVChannel.replace(/^uv_/, ''));

      if (channels.albedo) ModelExporterEngine.triggerImageDownload(`${modelName}_albedo_${uvTag}.png`, separated.albedo);
      if (channels.normal) ModelExporterEngine.triggerImageDownload(`${modelName}_normal_${uvTag}.png`, separated.normal);
      if (channels.emission) ModelExporterEngine.triggerImageDownload(`${modelName}_emission_${uvTag}.png`, separated.emission);
      if (channels.displacement) ModelExporterEngine.triggerImageDownload(`${modelName}_displacement_${uvTag}.png`, separated.displacement);
      if (channels.roughness) ModelExporterEngine.triggerImageDownload(`${modelName}_roughness_${uvTag}.png`, separated.roughness);
      if (channels.metallic) ModelExporterEngine.triggerImageDownload(`${modelName}_metallic_${uvTag}.png`, separated.metallic);

      setIsExporting(false);
      setExportComplete(true);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-[560px] bg-[#2d2d2d] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between shrink-0 bg-[#252525] border-b border-[#404040]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#3d7fb8]" />
            <span className="text-xs font-bold text-[#eee] tracking-wider uppercase">
              Intelligent Model &amp; Multi-Channel Exporter (FBX &bull; glTF)
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#aaa] hover:text-white p-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-[#ccc]">
          {/* Format Selection */}
          <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-2">
            <span className="font-semibold text-white text-[12px] block">Target Model Format:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('gltf')}
                className={`p-2.5 rounded border text-center font-medium transition-all ${
                  format === 'gltf'
                    ? 'bg-[#3d7fb8]/20 border-[#3d7fb8] text-white font-bold'
                    : 'bg-[#1e1e1e] border-[#383838] text-[#888] hover:text-white'
                }`}
              >
                <span className="block text-sm">glTF 2.0</span>
                <span className="text-[9px] text-[#777] font-mono">.gltf + PBR Maps</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('glb')}
                className={`p-2.5 rounded border text-center font-medium transition-all ${
                  format === 'glb'
                    ? 'bg-[#3d7fb8]/20 border-[#3d7fb8] text-white font-bold'
                    : 'bg-[#1e1e1e] border-[#383838] text-[#888] hover:text-white'
                }`}
              >
                <span className="block text-sm">GLB Binary</span>
                <span className="text-[9px] text-[#777] font-mono">Self-contained</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('fbx')}
                className={`p-2.5 rounded border text-center font-medium transition-all ${
                  format === 'fbx'
                    ? 'bg-[#fab387]/20 border-[#fab387] text-white font-bold'
                    : 'bg-[#1e1e1e] border-[#383838] text-[#888] hover:text-white'
                }`}
              >
                <span className="block text-sm">Autodesk FBX</span>
                <span className="text-[9px] text-[#777] font-mono">Game Engine Ready</span>
              </button>
            </div>
          </div>

          {/* Model Name & Resolution */}
          <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md grid grid-cols-2 gap-3">
            <div>
              <span className="text-[#aaa] text-[11px] block mb-1">Model Name:</span>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#444] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3d7fb8]"
              />
            </div>

            <div>
              <span className="text-[#aaa] text-[11px] block mb-1">Texture Bake Resolution:</span>
              <select
                value={resolution}
                onChange={(e) => setResolution(parseInt(e.target.value))}
                className="w-full bg-[#1c1c1c] border border-[#444] rounded px-2 py-1 text-xs text-white"
              >
                <option value={1024}>1024 x 1024 (Fast / Low Memory)</option>
                <option value={2048}>2048 x 2048 (Production Standard)</option>
                <option value={4096}>4096 x 4096 (Ultra 4K Crisp)</option>
              </select>
            </div>
          </div>

          {/* Automated Channel Separation Toggles */}
          <div className="p-3 bg-[#242424] border border-[#3e3e3e] rounded-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-[12px] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#a6e3a1]" />
                <span>Automated Texture Channel Separation</span>
              </span>
              <span className="text-[10px] text-[#888] font-mono">PBR MULTI-MAP</span>
            </div>
            <p className="text-[11px] text-[#888]">
              Intelligent algorithm isolates painted diffuse colors, emissive light maps, displacement height, and tangent Sobel normal vectors into separated textures formatted for {format.toUpperCase()}.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#333]">
              {/* Albedo */}
              <label className="flex items-center gap-2 p-1.5 bg-[#1e1e1e] rounded border border-[#383838] cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.albedo}
                  onChange={() => toggleChannel('albedo')}
                  className="rounded bg-[#2a2a2a] text-[#3d7fb8]"
                />
                <Image className="w-3.5 h-3.5 text-[#3d7fb8]" />
                <span className="text-[11px] text-[#eee]">Albedo / Diffuse</span>
              </label>

              {/* Emission */}
              <label className="flex items-center gap-2 p-1.5 bg-[#1e1e1e] rounded border border-[#383838] cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.emission}
                  onChange={() => toggleChannel('emission')}
                  className="rounded bg-[#2a2a2a] text-[#ff9900]"
                />
                <Flame className="w-3.5 h-3.5 text-[#ff9900]" />
                <span className="text-[11px] text-[#eee]">Light Emission (Glow)</span>
              </label>

              {/* Normal */}
              <label className="flex items-center gap-2 p-1.5 bg-[#1e1e1e] rounded border border-[#383838] cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.normal}
                  onChange={() => toggleChannel('normal')}
                  className="rounded bg-[#2a2a2a] text-[#89b4fa]"
                />
                <Shield className="w-3.5 h-3.5 text-[#89b4fa]" />
                <span className="text-[11px] text-[#eee]">Normal Map (Sobel RGB)</span>
              </label>

              {/* Displacement */}
              <label className="flex items-center gap-2 p-1.5 bg-[#1e1e1e] rounded border border-[#383838] cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.displacement}
                  onChange={() => toggleChannel('displacement')}
                  className="rounded bg-[#2a2a2a] text-[#a6e3a1]"
                />
                <Box className="w-3.5 h-3.5 text-[#a6e3a1]" />
                <span className="text-[11px] text-[#eee]">Displacement / Bump</span>
              </label>

              {/* Roughness */}
              <label className="flex items-center gap-2 p-1.5 bg-[#1e1e1e] rounded border border-[#383838] cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.roughness}
                  onChange={() => toggleChannel('roughness')}
                  className="rounded bg-[#2a2a2a] text-[#fab387]"
                />
                <Sparkles className="w-3.5 h-3.5 text-[#fab387]" />
                <span className="text-[11px] text-[#eee]">Roughness Map</span>
              </label>

              {/* Metallic */}
              <label className="flex items-center gap-2 p-1.5 bg-[#1e1e1e] rounded border border-[#383838] cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.metallic}
                  onChange={() => toggleChannel('metallic')}
                  className="rounded bg-[#2a2a2a] text-[#cba6f7]"
                />
                <Sparkles className="w-3.5 h-3.5 text-[#cba6f7]" />
                <span className="text-[11px] text-[#eee]">Metallic Map</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#222] border-t border-[#3e3e3e] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#888]">
            {exportComplete ? (
              <span className="text-[#a6e3a1] font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Export Complete! Files downloaded.
              </span>
            ) : (
              <span>Ready to separate channels &amp; export {format.toUpperCase()}</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#333] hover:bg-[#404040] text-[#ccc] rounded text-xs font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-1.5 bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white font-bold rounded text-xs cursor-pointer transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Baking & Packaging...' : `Export ${format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
