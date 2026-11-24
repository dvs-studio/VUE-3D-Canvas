import React,{useEffect,useRef,useState} from 'react';
import {X,Sliders} from 'lucide-react';
import {Layer, HeightLevels, LayerPBRSettings} from '../core/types';
import { applyHeightLevels, DEFAULT_HEIGHT_LEVELS } from '../tools/heightLevels';
export type BumpLevels = HeightLevels & { bumpInfluence:number; };
export const DEFAULT_BUMP_LEVELS:BumpLevels={...DEFAULT_HEIGHT_LEVELS,bumpInfluence:100};
interface Props {isOpen:boolean; layer?:Layer; mode?:'bump'|'displacement'; onClose:()=>void; onApply:(levels:BumpLevels)=>void;}
function levelsPixels(image:ImageData,levels:BumpLevels){const out=new ImageData(image.width,image.height);const d=image.data,o=out.data;for(let i=0;i<d.length;i+=4){const lum=(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2])/255;const v=applyHeightLevels(lum,levels)*255;o[i]=o[i+1]=o[i+2]=v;o[i+3]=d[i+3];}return out;}
export const BumpLevelsDialog:React.FC<Props>=({isOpen,layer,mode='bump',onClose,onApply})=>{
 const [values,setValues]=useState<BumpLevels>(DEFAULT_BUMP_LEVELS);const previewRef=useRef<HTMLCanvasElement|null>(null);
 const [windowOffset,setWindowOffset]=useState({x:0,y:0});const dragRef=useRef<{x:number;y:number;left:number;top:number}|null>(null);const lastTapRef=useRef(0);
 const handleHeaderDown=(e:React.PointerEvent<HTMLDivElement>)=>{if(e.pointerType==='touch'){const now=Date.now();if(now-lastTapRef.current>360){lastTapRef.current=now;return;}lastTapRef.current=0;e.preventDefault();}else if(e.button!==0)return;dragRef.current={x:e.clientX,y:e.clientY,left:windowOffset.x,top:windowOffset.y};e.currentTarget.setPointerCapture(e.pointerId);};
 const handleHeaderMove=(e:React.PointerEvent<HTMLDivElement>)=>{const d=dragRef.current;if(!d)return;setWindowOffset({x:Math.max(-window.innerWidth/2,Math.min(window.innerWidth/2,d.left+e.clientX-d.x)),y:Math.max(-window.innerHeight/2,Math.min(window.innerHeight/2,d.top+e.clientY-d.y))});};
 const handleHeaderUp=()=>{dragRef.current=null;};
 useEffect(()=>{if(!isOpen)return;setValues({...DEFAULT_BUMP_LEVELS,...(layer?.pbrSettings?.heightLevels||{}),bumpInfluence:Math.round((layer?.pbrSettings?.bumpInfluence??1)*100)});},[isOpen,layer?.id]);
 useEffect(()=>{const canvas=previewRef.current;if(!canvas||!layer?.canvas||!isOpen)return;canvas.width=layer.canvas.width;canvas.height=layer.canvas.height;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.drawImage(layer.canvas,0,0);const image=ctx.getImageData(0,0,canvas.width,canvas.height);ctx.putImageData(levelsPixels(image,values),0,0);},[isOpen,layer,values]);
 if(!isOpen)return null;
 const range=(label:keyof BumpLevels,min:number,max:number,step:number)=> <label className="block space-y-1 text-[11px]"><span className="flex justify-between"><span>{label}</span><b className="font-mono">{values[label]}</b></span><input type="range" min={min} max={max} step={step} value={values[label]} onChange={e=>setValues(v=>({...v,[label]:Number(e.target.value)}))} className="w-full accent-blue-500"/></label>;
 return <div className="fixed inset-0 z-[72] bg-black/65 flex items-center justify-center p-2"><div style={{transform:`translate(${windowOffset.x}px, ${windowOffset.y}px)`}} className="w-[min(680px,calc(100vw-16px))] max-h-[calc(100dvh-16px)] bg-[#303030] border-2 border-[#555] rounded shadow-2xl flex flex-col overflow-hidden text-[#ddd]">
 <header onPointerDown={handleHeaderDown} onPointerMove={handleHeaderMove} onPointerUp={handleHeaderUp} onPointerCancel={handleHeaderUp} style={{touchAction:"none"}} className="flex items-center justify-between p-3 bg-[#252525] border-b border-[#444] cursor-move select-none"><div className="flex items-center gap-2 font-bold text-sm"><Sliders className="w-4 h-4"/>Convert Image Layer to {mode === 'bump' ? 'Bump' : 'Displacement'} — Levels</div><button onClick={onClose}><X className="w-4 h-4"/></button></header>
 <div className="flex-1 overflow-auto min-h-0 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="space-y-3"><div className="text-xs font-semibold">Input Levels (Photoshop-style)</div>{range('blackInput',0,254,1)}{range('whiteInput',1,255,1)}{range('gamma',0.2,3,0.05)}<div className="text-xs font-semibold pt-2">Output Levels</div>{range('blackOutput',0,255,1)}{range('whiteOutput',0,255,1)}<div className="text-xs font-semibold pt-2">Bump Influence</div>{range('bumpInfluence',0,100,1)}<button onClick={()=>setValues(DEFAULT_BUMP_LEVELS)} className="w-full border border-[#555] rounded p-1.5 text-xs">Reset Levels</button></div><div className="min-w-0"><div className="text-xs font-semibold mb-1">Grayscale Preview</div><canvas ref={previewRef} className="w-full max-h-[320px] object-contain border border-[#555] bg-[#191919]"/></div></div>
 <footer className="border-t border-[#444] p-3 flex justify-end gap-2"><button onClick={onClose} className="px-3 py-1.5 border border-[#555] rounded">Cancel</button><button onClick={()=>onApply(values)} disabled={!layer||layer.locked} className="px-4 py-1.5 bg-blue-600 rounded text-white font-semibold disabled:opacity-40">Apply Levels &amp; Convert</button></footer>
 </div></div>;
};
export function applyBumpLevelsToLayer(layer:Layer,levels:BumpLevels){
 const previous=layer.pbrSettings;
 const isHeightLayer=layer.channel==='height';
 const defaults:LayerPBRSettings={
  roughness:0.5,metallic:0,bumpHeight:1,normalStrength:1,emissionStrength:0,emissionColor:'#ffffff',
  opacity:(layer.opacity??100)/100,enableColor:!isHeightLayer,enableBump:true,reflectionSource:'hdri',reflectionIntensity:0.8,
  colorOn:!isHeightLayer,colorInfluence:isHeightLayer?0:1,reflectionOn:false,reflectionInfluence:0,
  emissionOn:false,emissionInfluence:0,bumpOn:true,bumpInfluence:1,
  bumpRamp:[{position:0,height:0},{position:1,height:1}],normalLock:false,
 };
 layer.pbrSettings={
  ...defaults,
  ...(previous||{}),
  heightLevels:{
   blackInput:levels.blackInput,whiteInput:levels.whiteInput,gamma:levels.gamma,
   blackOutput:levels.blackOutput,whiteOutput:levels.whiteOutput,
  },
  bumpOn:true,
  bumpInfluence:Math.max(0,Math.min(1,levels.bumpInfluence/100)),
  enableBump:true,
 };
}
