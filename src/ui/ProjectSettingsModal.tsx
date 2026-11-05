/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - .xblend Project & Asset Linking Settings
 * Created by Victory Ukpong
 */

import React, { useRef, useState } from 'react';
import { MeshModelAsset } from '../core/types';
import { Save, FolderOpen, Link2, Package, Check, X, FileText, Download, Upload, FileCode, Images, RefreshCw, Wrench } from 'lucide-react';

export interface MatchedTextureMap {
  fileName: string;
  dataUrl: string;
  role: 'color' | 'normal' | 'height' | 'roughness' | 'emission';
  layerName: string;
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  setProjectName: (name: string) => void;
  embed3DAssets: boolean;
  setEmbed3DAssets: (embed: boolean) => void;
  currentModel: MeshModelAsset;
  onSaveXBlend: () => void;
  onLoadXBlend: (jsonString: string) => void;
  onExportBlenderMaterial: () => void;
  onExportOBJ: () => void;
  onImportCustomModel: (fileName: string, content: string, mtlContent?: string) => void;
  onExportBundleZip: () => void;
  onAutoTextureModel?: (textureMaps: MatchedTextureMap[]) => void;
  onReimportUVs?: () => void;
  onRepairMesh?: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  projectName,
  setProjectName,
  embed3DAssets,
  setEmbed3DAssets,
  currentModel,
  onSaveXBlend,
  onLoadXBlend,
  onExportBlenderMaterial,
  onExportOBJ,
  onImportCustomModel,
  onExportBundleZip,
  onAutoTextureModel,
  onReimportUVs,
  onRepairMesh,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modelInputRef = useRef<HTMLInputElement | null>(null);
  const mtlInputRef = useRef<HTMLInputElement | null>(null);
  const texturesFolderInputRef = useRef<HTMLInputElement | null>(null);

  const [stagedObj, setStagedObj] = useState<{ name: string; content: string } | null>(null);
  const [stagedMtl, setStagedMtl] = useState<{ name: string; content: string } | null>(null);
  const [stagedTextures, setStagedTextures] = useState<MatchedTextureMap[]>([]);
  const [autoTextureApplied, setAutoTextureApplied] = useState(false);

  if (!isOpen) return null;

  const handleXBlendFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      onLoadXBlend(content);
      onClose();
    };
    reader.readAsText(file);
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setStagedObj({ name: file.name, content });
      onImportCustomModel(file.name, content, stagedMtl?.content);
    };
    reader.readAsText(file);
  };

  const handleMtlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setStagedMtl({ name: file.name, content });
      if (stagedObj) {
        onImportCustomModel(stagedObj.name, stagedObj.content, content);
      }
    };
    reader.readAsText(file);
  };

  const handleFolderTexturesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const matchedList: MatchedTextureMap[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });

      const lowerName = file.name.toLowerCase();
      let role: MatchedTextureMap['role'] = 'color';
      let layerName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      if (lowerName.includes('norm') || lowerName.includes('nrm')) {
        role = 'normal';
        layerName = `[Normal] ${layerName}`;
      } else if (lowerName.includes('bump') || lowerName.includes('disp') || lowerName.includes('height')) {
        role = 'height';
        layerName = `[Bump] ${layerName}`;
      } else if (lowerName.includes('rough') || lowerName.includes('spec') || lowerName.includes('gloss')) {
        role = 'roughness';
        layerName = `[Roughness] ${layerName}`;
      } else if (lowerName.includes('emit') || lowerName.includes('emiss') || lowerName.includes('glow')) {
        role = 'emission';
        layerName = `[Emission] ${layerName}`;
      } else {
        role = 'color';
        layerName = `[Albedo] ${layerName}`;
      }

      matchedList.push({
        fileName: file.name,
        dataUrl,
        role,
        layerName,
      });
    }

    setStagedTextures(matchedList);
    setAutoTextureApplied(false);
  };

  const handleApplyAutoTexture = () => {
    if (stagedTextures.length > 0 && onAutoTextureModel) {
      onAutoTextureModel(stagedTextures);
      setAutoTextureApplied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 select-none p-4">
      <div className="w-[560px] max-w-full bg-[#333] border-2 border-[#555] rounded shadow-2xl overflow-hidden cs5-outset text-xs text-[#c8c8c8]">
        {/* Header */}
        <div className="cs5-panel-header px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#3d7fb8]" />
            <span className="font-bold text-[#eee] uppercase tracking-wider text-[11px]">
              .xblend Project, UVs &amp; Material Auto-Texturing
            </span>
          </div>
          <button onClick={onClose} className="text-[#aaa] hover:text-white p-0.5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Project Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#aaa]">Project Title</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-[#242424] border border-[#555] text-[#eee] rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#3d7fb8] cs5-inset"
              placeholder="e.g. CyberArmor_PBR"
            />
          </div>

          {/* Asset Linking vs Embedding Specification */}
          <div className="bg-[#2a2a2a] p-3 rounded border border-[#444] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#eee] text-xs flex items-center gap-1.5">
                {embed3DAssets ? <Package className="w-4 h-4 text-[#e5a038]" /> : <Link2 className="w-4 h-4 text-[#3d7fb8]" />}
                3D Asset Storage Strategy
              </span>
              <span className="text-[10px] font-mono text-[#888]">
                {embed3DAssets ? 'Embedded Packed Mesh' : 'Linked Reference (Default)'}
              </span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer bg-[#323232] p-2 rounded border border-[#404040]">
              <input
                type="checkbox"
                checked={embed3DAssets}
                onChange={(e) => setEmbed3DAssets(e.target.checked)}
                className="mt-0.5 accent-[#3d7fb8]"
              />
              <div className="text-[11px]">
                <strong className="text-white block">[ ] Embed 3D Assets</strong>
                <span className="text-[#999] text-[10px] leading-snug block mt-0.5">
                  By default, meshes are linked to minimize .xblend file size (~14 KB). Check this box to force-pack all geometry vertex buffers into the .xblend project file.
                </span>
              </div>
            </label>

            {/* Model details */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-[#222] p-2 rounded border border-[#383838]">
              <div>
                <span className="text-[#777]">ACTIVE MODEL:</span>{' '}
                <span className="text-[#ccc]">{currentModel.name}</span>
              </div>
              <div>
                <span className="text-[#777]">VERTICES:</span>{' '}
                <span className="text-[#ccc]">{currentModel.vertexCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#777]">FILE SIZE EST:</span>{' '}
                <span className="text-[#3d7fb8] font-bold">
                  {embed3DAssets ? '2.45 MB (Packed)' : '14.2 KB (Linked)'}
                </span>
              </div>
              <div>
                <span className="text-[#777]">UNDO BUDGET:</span>{' '}
                <span className="text-[#22c55e]">Strict 3-States</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={onSaveXBlend}
              className="p-2 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#555] flex items-center justify-center gap-1.5 transition-colors font-medium text-xs cs5-outset"
            >
              <Save className="w-3.5 h-3.5 text-[#3d7fb8]" />
              Save .xblend
            </button>

            <button
              onClick={onExportBundleZip}
              className="p-2 bg-[#3a4454] hover:bg-[#47576d] text-white rounded border border-[#52637a] flex items-center justify-center gap-1.5 transition-colors font-medium text-xs shadow-xs"
              title="Export .xblend + all texture maps + alpha masks + node mapping in a single ZIP"
            >
              <Package className="w-3.5 h-3.5 text-[#89b4fa]" />
              Export ZIP Bundle
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-[#3a3a3a] hover:bg-[#484848] text-[#eee] rounded border border-[#555] flex items-center justify-center gap-1.5 transition-colors font-medium text-xs cs5-outset"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#e5a038]" />
              Open .xblend
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xblend,.json"
              onChange={handleXBlendFile}
              className="hidden"
            />
          </div>

          {/* Interop Export Buttons */}
          <div className="border-t border-[#444] pt-3 space-y-2">
            <div className="text-[10px] font-mono text-[#888] uppercase tracking-wider">
              INTEROP &amp; ASSET CONVERSION
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onExportBlenderMaterial}
                className="p-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-[#ccc] rounded border border-[#444] text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                title="Export Blender .blend material setup"
              >
                <FileText className="w-3 h-3 text-[#f97316]" />
                Blender .blend Spec
              </button>
              <button
                onClick={onExportOBJ}
                className="p-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-[#ccc] rounded border border-[#444] text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                title="Export textured .OBJ model"
              >
                <Download className="w-3 h-3 text-[#38bdf8]" />
                Export .OBJ Mesh
              </button>
              <button
                onClick={() => modelInputRef.current?.click()}
                className="p-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-[#ccc] rounded border border-[#444] text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                title="Import .OBJ or .GLTF custom 3D model"
              >
                <Upload className="w-3 h-3 text-[#a855f7]" />
                Import .OBJ Mesh
              </button>
              <button
                onClick={() => mtlInputRef.current?.click()}
                className="p-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-[#ccc] rounded border border-[#444] text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                title="Import Companion .MTL Material & UV File"
              >
                <FileCode className="w-3 h-3 text-[#38bdf8]" />
                Import .MTL File
              </button>
              <button
                onClick={() => texturesFolderInputRef.current?.click()}
                className="p-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-[#ccc] rounded border border-[#444] text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                title="Select all image textures from material folder"
              >
                <Images className="w-3 h-3 text-[#f59e0b]" />
                Material Textures...
              </button>
              <button
                onClick={onReimportUVs}
                className="p-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-[#ccc] rounded border border-[#444] text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                title="Re-import and re-map UV coordinates from model file"
              >
                <RefreshCw className="w-3 h-3 text-[#4ade80]" />
                Re-import UVs
              </button>
              <button
                onClick={onRepairMesh}
                className="p-1.5 bg-[#2c2c2c] hover:bg-[#383838] text-[#ccc] rounded border border-[#444] text-[10px] flex items-center justify-center gap-1.5 transition-colors"
                title="Repair architectural mesh: weld coincident vertices & snap coplanar normals"
              >
                <Wrench className="w-3 h-3 text-[#e879f9]" />
                Auto-Repair Mesh
              </button>
              <input
                type="file"
                ref={modelInputRef}
                accept=".obj,.gltf,.glb"
                onChange={handleModelUpload}
                className="hidden"
              />
              <input
                type="file"
                ref={mtlInputRef}
                accept=".mtl"
                onChange={handleMtlUpload}
                className="hidden"
              />
              <input
                type="file"
                ref={texturesFolderInputRef}
                multiple
                accept="image/*"
                onChange={handleFolderTexturesUpload}
                className="hidden"
              />
            </div>

            {/* Staged Textures & Auto-Texture Action */}
            {stagedTextures.length > 0 && (
              <div className="bg-[#222] p-2.5 rounded border border-[#444] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5 text-[#f59e0b]" />
                    Detected Material Textures ({stagedTextures.length})
                  </span>
                  <button
                    onClick={handleApplyAutoTexture}
                    className="px-2.5 py-1 bg-[#3d7fb8] hover:bg-[#4d93d1] text-white rounded font-medium text-[10px] transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    {autoTextureApplied ? (
                      <>
                        <Check className="w-3 h-3 text-[#a6e3a1]" />
                        <span>Layers Applied &amp; Textured</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        <span>Auto-Texture Model &amp; Replace Layers</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {stagedTextures.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#2a2a2a] px-2 py-1 rounded text-[10px] font-mono border border-[#383838]">
                      <span className="text-[#ccc] truncate max-w-[280px]">{t.fileName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                        t.role === 'normal' ? 'bg-[#3b82f6]/30 text-[#93c5fd]' :
                        t.role === 'height' ? 'bg-[#8b5cf6]/30 text-[#c4b5fd]' :
                        t.role === 'roughness' ? 'bg-[#f59e0b]/30 text-[#fde68a]' :
                        t.role === 'emission' ? 'bg-[#ec4899]/30 text-[#fbcfe8]' :
                        'bg-[#10b981]/30 text-[#a7f3d0]'
                      }`}>
                        {t.role.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staged Model & MTL status display */}
            {(stagedObj || stagedMtl) && (
              <div className="bg-[#202020] p-2 rounded border border-[#3c3c3c] flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  {stagedObj && (
                    <span className="text-[#a6e3a1] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      OBJ: {stagedObj.name}
                    </span>
                  )}
                  {stagedMtl && (
                    <span className="text-[#38bdf8] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      MTL: {stagedMtl.name}
                    </span>
                  )}
                </div>
                <span className="text-[#888]">UVs Linked</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2a2a2a] px-4 py-2.5 flex justify-end border-t border-[#444]">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#404040] hover:bg-[#4d4d4d] text-white rounded border border-[#555] text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
