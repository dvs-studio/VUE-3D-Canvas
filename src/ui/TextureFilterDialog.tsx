import React,{useEffect,useMemo,useRef,useState} from 'react';
import { X, Filter, Upload, RotateCcw } from 'lucide-react';
import { Layer } from '../core/types';
import { DEFAULT_TEXTURE_FILTER, TextureFilterConfig, TextureFilterKind, WoodSource, transformTexturePixels } from '../tools/textureFilters';

interface Props { isOpen:boolean; activeLayer?:Layer; defaultColor:string; onClose:()=>void; onApply:(cfg:TextureFilterConfig)=>void; }
const names:Record<TextureFilterKind,string>={wood:'Wood Grain',hatching:'Hatching', 'cross-hatching':'Cross-Hatching',hashing:'Hashing',powderiser:'Powderiser (Dust)', 'noise-shader':'Noise Shader (Colour Blend)',dither:'Dithering',mosaic:'Mosaic'};
export const TextureFilterDialog:React.FC<Props>=({isOpen,activeLayer,defaultColor,onClose,onApply})=>{
 const [cfg,setCfg]=useState<TextureFilterConfig>({...DEFAULT_TEXTURE_FILTER,color:defaultColor});
 const [sourceImage,setSourceImage]=useState<string|undefined>();const [preview,setPreview]=useState<ImageData|null>(null);const previewCanvas=useRef<HTMLCanvasElement|null>(null);const uploadRef=useRef<HTMLInputElement|null>(null);
 const update=(patch:Partial<TextureFilterConfig>)=>setCfg(c=>({...c,...patch}));
 useEffect(()=>{if(!isOpen)return;setCfg(c=>({...c,color:defaultColor}));},[isOpen,defaultColor]);
 useEffect(()=>{let cancelled=false;const run=async()=>{if(!isOpen||!activeLayer?.canvas)return;try{const copy=document.createElement('canvas');copy.width=320;copy.height=320;const c=copy.getContext('2d');if(!c)return;c.drawImage(activeLayer.canvas,0,0,copy.width,copy.height);const pixels=c.getImageData(0,0,copy.width,copy.height);const result=await transformTexturePixels(pixels,cfg);if(!cancelled)setPreview(result);}catch{if(!cancelled)setPreview(null);}};run();return()=>{cancelled=true};},[isOpen,activeLayer,cfg]);
 useEffect(()=>{const canvas=previewCanvas.current;if(!canvas||!preview)return;canvas.width=preview.width;canvas.height=preview.height;canvas.getContext('2d')?.putImageData(preview,0,0);},[preview]);
 const isWood=cfg.kind==='wood';const isDirectional=['hatching','cross-hatching','hashing'].includes(cfg.kind);
 if(!isOpen)return null;
 return <div className="fixed inset-0 z-[70] bg-black/65 flex items-center justify-center p-2 sm:p-4">
  <div className="w-[min(760px,calc(100vw-16px))] max-h-[calc(100dvh-16px)] bg-[#303030] border-2 border-[#555] rounded shadow-2xl flex flex-col overflow-hidden text-[#ddd]">
   <header className="flex items-center justify-between p-3 bg-[#252525] border-b border-[#444] shrink-0"><div className="flex items-center gap-2 text-sm font-bold"><Filter className="w-4 h-4 text-blue-400"/> Layer Filter — Selected Layer</div><button onClick={onClose} aria-label="Close"><X className="w-4 h-4"/></button></header>
   <div className="flex-1 min-h-0 overflow-auto p-3 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] gap-3">
    <section className="space-y-3 min-w-0">
     <label className="block text-xs">Filter
      <select value={cfg.kind} onChange={e=>update({kind:e.target.value as TextureFilterKind})} className="block mt-1 w-full min-w-0 bg-[#1c1c1c] border border-[#555] rounded p-2">{Object.entries(names).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
     </label>
     {isWood&&<div className="space-y-2 p-2 border border-[#555] rounded min-w-0">
      <div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold">Wood Source Stack</div><button onClick={()=>update({woodSources:[...(cfg.woodSources||[]),{id:`wood-${Date.now()}`,source:'color',color:cfg.color,density:50}]})} className="px-2 py-1 rounded border border-[#666] text-[10px]">+ Add Source</button></div>
      {(cfg.woodSources||[]).map((item,index)=><div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-2 bg-[#222] rounded border border-[#444]">
       <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2"><select value={item.source} onChange={e=>update({woodSources:cfg.woodSources.map((v,i)=>i===index?{...v,source:e.target.value as WoodSource['source']}:v)})} className="min-w-0 flex-1 bg-[#151515] border border-[#555] rounded p-1 text-xs"><option value="color">Colour</option><option value="image">Image</option></select>
        {item.source==='color'?<input type="color" value={item.color} onChange={e=>update({woodSources:cfg.woodSources.map((v,i)=>i===index?{...v,color:e.target.value}:v)})} className="h-7 w-10 bg-transparent"/>:<label className="text-[10px] border border-[#555] rounded px-2 py-1 cursor-pointer">Choose Image<input type="file" accept="image/*" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>update({woodSources:cfg.woodSources.map((v,i)=>i===index?{...v,imageDataUrl:String(reader.result||'')}:v)});reader.readAsDataURL(file);}}/></label>}</div>
        <label className="flex items-center gap-2 text-[10px]">Spreading density <input type="number" min="1" max="100" value={item.density} onChange={e=>update({woodSources:cfg.woodSources.map((v,i)=>i===index?{...v,density:Math.max(1,Math.min(100,Number(e.target.value)||1))}:v)})} className="w-16 bg-[#151515] border border-[#555] rounded px-2 py-1 text-right"/></label>
       </div>
       <div className="flex flex-col gap-1"><button disabled={index===0} onClick={()=>{const arr=[...cfg.woodSources];[arr[index-1],arr[index]]=[arr[index],arr[index-1]];update({woodSources:arr});}} className="px-2 py-1 border border-[#555] rounded disabled:opacity-30">↑</button><button disabled={index===cfg.woodSources.length-1} onClick={()=>{const arr=[...cfg.woodSources];[arr[index+1],arr[index]]=[arr[index],arr[index+1]];update({woodSources:arr});}} className="px-2 py-1 border border-[#555] rounded disabled:opacity-30">↓</button><button onClick={()=>update({woodSources:cfg.woodSources.filter((_,i)=>i!==index)})} className="px-2 py-1 border border-red-900 text-red-300 rounded">×</button></div>
      </div>)}
      <p className="text-[10px] text-[#999]">Each stacked source contributes grain. Density is a numeric per-source influence weight and spatial frequency.</p>
     </div>}
     {isWood&&<><Slider label="Edge Definition" value={cfg.edge} min={0} max={100} onChange={v=>update({edge:v})}/><Slider label="Noise" value={cfg.noise} min={0} max={100} onChange={v=>update({noise:v})}/><Slider label="Bleed / Grain Blend" value={cfg.bleed} min={0} max={100} onChange={v=>update({bleed:v})}/><Slider label="Blur" value={cfg.blur} min={0} max={20} onChange={v=>update({blur:v})}/></>}
     {isDirectional&&<><label className="block text-xs">Direction Constraint<select value={cfg.directionSpace} onChange={e=>update({directionSpace:e.target.value as TextureFilterConfig['directionSpace']})} className="block mt-1 w-full bg-[#1c1c1c] border border-[#555] rounded p-2"><option value="uv">UV / Image</option><option value="object">Object Axis</option><option value="world">World Axis</option></select></label>{cfg.directionSpace!=='uv'&&<label className="block text-xs">Axis<select value={cfg.axis} onChange={e=>update({axis:e.target.value as TextureFilterConfig['axis']})} className="block mt-1 w-full bg-[#1c1c1c] border border-[#555] rounded p-2"><option value="X">X</option><option value="Y">Y</option><option value="Z">Z</option></select></label>}<Slider label={cfg.directionSpace==='uv'?'Direction Angle':'Axis Angle Offset'} value={cfg.angle} min={-180} max={180} onChange={v=>update({angle:v})}/><Slider label="Pixel Shift" value={cfg.shift} min={0} max={40} onChange={v=>update({shift:v})}/><Slider label="Line Spacing" value={cfg.lineSpacing} min={2} max={80} onChange={v=>update({lineSpacing:v})}/><Slider label="Randomization" value={cfg.randomization} min={0} max={100} onChange={v=>update({randomization:v})}/><p className="text-[10px] text-[#aaa]">Displacement is computed in image/UV coordinates. Object/world axis controls currently use a simplified UV angle mapping; a per-model UV/world transform is still needed for exact coordinate-space displacement.</p></>}
     {cfg.kind==='mosaic'&&<Slider label="Block Size" value={cfg.mosaicSize} min={2} max={64} onChange={v=>update({mosaicSize:v})}/>}
     {cfg.kind==='dither'&&<Slider label="Tonal Levels" value={cfg.levels} min={2} max={16} onChange={v=>update({levels:v})}/>}
     {cfg.kind==='powderiser'&&<><Slider label="Dust breakup" value={cfg.noise} min={0} max={100} onChange={v=>update({noise:v})}/><Slider label="Dust drift distance" value={cfg.shift} min={1} max={48} onChange={v=>update({shift:v})}/><Slider label="Drift angle" value={cfg.angle} min={-180} max={180} onChange={v=>update({angle:v})}/></>}
     {cfg.kind==='noise-shader'&&<Slider label="Random darkness blend" value={cfg.noise} min={0} max={100} onChange={v=>update({noise:v})}/>
     <button onClick={()=>setCfg({...DEFAULT_TEXTURE_FILTER,color:defaultColor})} className="w-full border border-[#555] rounded p-1.5 text-xs flex items-center justify-center gap-1"><RotateCcw className="w-3 h-3"/>Reset Settings</button>
    </section>
    <section className="min-w-0 flex flex-col gap-2">
     <div className="text-xs font-semibold">Preview</div><div className="bg-[#1c1c1c] border border-[#555] rounded p-1 min-h-[200px] flex items-center justify-center overflow-hidden"><canvas ref={previewCanvas} className="max-w-full max-h-[340px] object-contain"/></div><div className="text-[10px] text-[#999]">Preview is calculated from the active layer image. Apply replaces the selected layer image pixels.</div>
    </section>
   </div>
   <footer className="border-t border-[#444] p-3 flex justify-end gap-2"><button onClick={onClose} className="px-3 py-1.5 border border-[#555] rounded">Cancel</button><button onClick={()=>onApply(cfg)} disabled={!activeLayer||activeLayer.locked} className="px-4 py-1.5 bg-blue-600 disabled:opacity-40 rounded text-white font-semibold">Apply to Selected Layer</button></footer>
  </div>
 </div>;
};
const Slider:React.FC<{label:string,value:number,min:number,max:number,onChange:(v:number)=>void}> = ({label,value,min,max,onChange}) => (
 <label className="block text-[11px] space-y-1">
  <span className="flex justify-between gap-2"><span>{label}</span><span className="font-mono">{value}</span></span>
  <input className="w-full accent-blue-500" type="range" min={min} max={max} step="1" value={value} onChange={e=>onChange(Number(e.target.value))}/>
 </label>
);
