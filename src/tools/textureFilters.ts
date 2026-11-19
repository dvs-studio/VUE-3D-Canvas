/**
 * Image-layer filter algorithms. These are destructive image operations, not brush tools.
 * The selected layer's pixel buffer is transformed and written back by the caller.
 */
export type TextureFilterKind = 'wood' | 'hatching' | 'cross-hatching' | 'hashing' | 'powderiser' | 'noise-shader' | 'dither' | 'mosaic';
export type TextureFilterSource = 'image' | 'color';
export interface WoodSource { id:string; source:'color'|'image'; color:string; imageDataUrl?:string; density:number; }
export interface TextureFilterConfig {
  kind: TextureFilterKind;
  source: TextureFilterSource;
  color: string;
  sourceImageDataUrl?: string;
  edge: number;       // 0..100
  noise: number;      // 0..100
  bleed: number;      // 0..100
  blur: number;       // 0..20
  angle: number;      // degrees
  shift: number;      // pixel displacement
  randomization: number; // 0..100
  lineSpacing: number;
  mosaicSize: number;
  levels: number;
  directionSpace: 'uv' | 'object' | 'world';
  axis: 'X' | 'Y' | 'Z';
  woodSources: WoodSource[];
}
export const DEFAULT_TEXTURE_FILTER: TextureFilterConfig = {
  kind: 'wood', source: 'color', color: '#8a5a35', edge: 65, noise: 25, bleed: 18, blur: 1,
  angle: 35, shift: 6, randomization: 20, lineSpacing: 12, mosaicSize: 8, levels: 5, directionSpace: 'uv', axis: 'Z', woodSources: [{id:'wood-1',source:'color',color:'#8a5a35',density:50}]
};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const hash=(x:number,y:number,seed:number)=>{const n=Math.sin(x*127.1+y*311.7+seed*74.7)*43758.5453;return n-Math.floor(n);};
const parseColor=(hex:string)=>{const c=document.createElement('canvas').getContext('2d')!;c.fillStyle=hex;const normalized=c.fillStyle;const m=/^#([0-9a-f]{6})$/i.exec(normalized);if(!m)return [128,128,128];const v=parseInt(m[1],16);return [(v>>16)&255,(v>>8)&255,v&255];};
async function imageSource(dataUrl?:string,width=256,height=256):Promise<ImageData|null>{
 if(!dataUrl)return null; const img=new Image(); img.src=dataUrl; try{await img.decode();}catch{return null;}
 const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');if(!ctx)return null;
 ctx.drawImage(img,0,0,width,height);return ctx.getImageData(0,0,width,height);
}
function sample(src:ImageData,x:number,y:number){x=clamp(Math.round(x),0,src.width-1);y=clamp(Math.round(y),0,src.height-1);const i=(y*src.width+x)*4;return [src.data[i],src.data[i+1],src.data[i+2],src.data[i+3]];}
export async function transformTexturePixels(source:ImageData,cfg:TextureFilterConfig):Promise<ImageData>{
 const w=source.width,h=source.height, out=new ImageData(w,h), data=source.data, dst=out.data;
 const srcImg=cfg.kind==='wood'&&cfg.source==='image'?await imageSource(cfg.sourceImageDataUrl,w,h):null;
 const woodStack=cfg.kind==='wood'?await Promise.all((cfg.woodSources?.length?cfg.woodSources:[{id:'fallback',source:cfg.source,color:cfg.color,imageDataUrl:cfg.sourceImageDataUrl,density:50}]).map(async item=>({item,image:item.source==='image'?await imageSource(item.imageDataUrl,w,h):null,color:parseColor(item.color)}))):[];
 const color=parseColor(cfg.color);
 const axisAngle=cfg.directionSpace==='uv'?0:(cfg.axis==='X'?0:cfg.axis==='Y'?90:45);
 const angle=(axisAngle+cfg.angle)*Math.PI/180, dx=Math.cos(angle),dy=Math.sin(angle);
 const edge=cfg.edge/100, noise=cfg.noise/100, bleed=cfg.bleed/100;
 if(cfg.kind==='wood'){
   // Each stacked colour/image contributes a grain band; density controls its spatial frequency and blend weight.
   const stack=woodStack.length?woodStack:[{item:{density:50},image:null,color}];
   const totalWeight=stack.reduce((sum,row)=>sum+Math.max(1,row.item.density),0);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4;let rr=0,gg=0,bb=0,aa=0;
     for(const row of stack){
       const density=clamp(Number(row.item.density)||1,1,100);
       const wave=Math.sin((x*dx+y*dy)*(0.008+density*0.0007)+Math.sin(y*0.018)*2.3)+Math.sin((x*dx+y*dy)*(0.002+density*0.00018))*0.7;
       const n=(hash(x,y,13+stack.indexOf(row)*37)-0.5)*noise*70;
       const grain=clamp(0.5+wave*0.22+n/255,0,1);
       const base=row.image?sample(row.image,x,y):row.color;
       const contrast=clamp((grain-0.5)*(1+edge*3)+0.5,0,1);
       const tint=0.55+contrast*0.9;
       const weight=density/totalWeight;
       rr+=base[0]*tint*weight;gg+=base[1]*tint*weight;bb+=base[2]*tint*weight;aa+=(row.image?base[3]:data[i+3])*weight;
     }
     const bleedMix=clamp(bleed*0.45,0,0.45);
     dst[i]=clamp(rr*(1-bleedMix)+color[0]*bleedMix,0,255);
     dst[i+1]=clamp(gg*(1-bleedMix)+color[1]*bleedMix,0,255);
     dst[i+2]=clamp(bb*(1-bleedMix)+color[2]*bleedMix,0,255);dst[i+3]=255; // Wood Grain is a generated surface layer and does not require pre-existing layer pixels.
   }
   if(cfg.blur>0){
     const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d')!.putImageData(out,0,0);
     const blurred=document.createElement('canvas');blurred.width=w;blurred.height=h;const ctx=blurred.getContext('2d')!;
     ctx.filter=`blur(${clamp(cfg.blur,0,20)}px)`;ctx.drawImage(tmp,0,0);return ctx.getImageData(0,0,w,h);
   }
   return out;
 }
 if(cfg.kind==='mosaic'){
   const size=Math.max(2,Math.round(cfg.mosaicSize));for(let y=0;y<h;y+=size)for(let x=0;x<w;x+=size){
     let r=0,g=0,b=0,a=0,count=0;for(let yy=y;yy<Math.min(h,y+size);yy++)for(let xx=x;xx<Math.min(w,x+size);xx++){let i=(yy*w+xx)*4;r+=data[i];g+=data[i+1];b+=data[i+2];a+=data[i+3];count++;}
     r/=count;g/=count;b/=count;a/=count;for(let yy=y;yy<Math.min(h,y+size);yy++)for(let xx=x;xx<Math.min(w,x+size);xx++){let i=(yy*w+xx)*4;dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=a;}
   }return out;
 }
 if(cfg.kind==='dither'){
   const levels=Math.max(2,Math.round(cfg.levels));
   for(let i=0;i<data.length;i+=4){const n=(hash((i/4)%w,Math.floor(i/4/w),71)-0.5)*noise*50;for(let k=0;k<3;k++){const v=clamp(data[i+k]+n,0,255);dst[i+k]=Math.round(v/255*(levels-1))*255/(levels-1);}dst[i+3]=data[i+3];}
   return out;
 }
 if(cfg.kind==='noise-shader'){
   // Random darkness is blended into existing pixel colour; no geometric/pixel displacement.
   for(let i=0;i<data.length;i+=4){const x=(i/4)%w,y=Math.floor(i/4/w);const darkness=1-hash(x,y,71)*(noise*0.78);for(let k=0;k<3;k++)dst[i+k]=clamp(data[i+k]*darkness,0,255);dst[i+3]=data[i+3];}
   return out;
 }
 if(cfg.kind==='powderiser'){
   // Break the layer into small dust fragments, scatter them along the chosen drift, and fade the source.
   const strength=clamp(noise/100,0,1),drift=clamp(cfg.shift||12,1,48);
   for(let i=0;i<data.length;i+=4){const x=(i/4)%w,y=Math.floor(i/4/w),r=hash(x,y,211);
     if(r<strength){const sx=clamp(Math.round(x+dx*drift*(0.25+hash(x,y,19))),0,w-1),sy=clamp(Math.round(y+dy*drift*(0.25+hash(x,y,29))),0,h-1);const j=(sy*w+sx)*4;dst[j]=data[i];dst[j+1]=data[i+1];dst[j+2]=data[i+2];dst[j+3]=Math.max(dst[j+3],Math.round(data[i+3]*(0.25+0.65*(1-strength))));dst[i+3]=Math.round(data[i+3]*(1-strength)*0.22);}
     else {dst[i]=data[i];dst[i+1]=data[i+1];dst[i+2]=data[i+2];dst[i+3]=Math.round(data[i+3]*(1-strength*0.7));}
   }
   return out;
 }
 // Directional displacement: line-mask controlled shifts, not line painting/overlay.
 const maskAt=(x:number,y:number,angleOffset:number,spacing:number)=>{
   const a=angle+angleOffset, nx=-Math.sin(a),ny=Math.cos(a);
   const phase=(x*nx+y*ny)/Math.max(2,spacing);
   return Math.abs(phase-Math.round(phase))<0.22;
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   let active=cfg.kind==='hashing'?hash(x,y,23)<0.28:maskAt(x,y,0,cfg.lineSpacing);
   if(cfg.kind==='cross-hatching')active=maskAt(x,y,0,cfg.lineSpacing)||maskAt(x,y,Math.PI/2,cfg.lineSpacing);
   const jitter=(hash(x,y,43)-0.5)*cfg.randomization/100*cfg.shift;
   const shift=active?cfg.shift+jitter:0;
   const sx=x-dx*shift,sy=y-dy*shift;
   const p=sample(source,sx,sy);const i=(y*w+x)*4;
   dst[i]=p[0];dst[i+1]=p[1];dst[i+2]=p[2];dst[i+3]=p[3];
 }
 return out;
}
export async function applyTextureFilterToCanvas(canvas:HTMLCanvasElement,cfg:TextureFilterConfig):Promise<void>{
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Selected layer canvas is unavailable');
 const source=ctx.getImageData(0,0,canvas.width,canvas.height);
 const result=await transformTexturePixels(source,cfg);
 ctx.putImageData(result,0,0);
}
