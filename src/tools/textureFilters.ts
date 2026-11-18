/**
 * Image-layer filter algorithms. These are destructive image operations, not brush tools.
 * The selected layer's pixel buffer is transformed and written back by the caller.
 */
export type TextureFilterKind = 'wood' | 'hatching' | 'cross-hatching' | 'hashing' | 'powderiser' | 'dither' | 'mosaic';
export type TextureFilterSource = 'image' | 'color';
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
}
export const DEFAULT_TEXTURE_FILTER: TextureFilterConfig = {
  kind: 'wood', source: 'color', color: '#8a5a35', edge: 65, noise: 25, bleed: 18, blur: 1,
  angle: 35, shift: 6, randomization: 20, lineSpacing: 12, mosaicSize: 8, levels: 5
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
 const color=parseColor(cfg.color);
 const angle=cfg.angle*Math.PI/180, dx=Math.cos(angle),dy=Math.sin(angle);
 const edge=cfg.edge/100, noise=cfg.noise/100, bleed=cfg.bleed/100;
 if(cfg.kind==='wood'){
   // Grain field uses anisotropic waves + seeded noise; source image or chosen colour controls palette.
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4;
     const wave=Math.sin((x*dx+y*dy)*0.035+Math.sin(y*0.018)*2.3)+Math.sin((x*dx+y*dy)*0.009)*0.7;
     const n=(hash(x,y,13)-0.5)*noise*70;
     const grain=clamp(0.5+wave*0.22+n/255,0,1);
     const base=srcImg?sample(srcImg,x,y):color;
     const contrast=clamp((grain-0.5)*(1+edge*3)+0.5,0,1);
     const bleedMix=clamp(bleed*0.45,0,0.45);
     const tint=0.55+contrast*0.9;
     for(let k=0;k<3;k++)dst[i+k]=clamp(base[k]*(tint*(1-bleedMix))+color[k]*bleedMix,0,255);
     dst[i+3]=srcImg?base[3]:data[i+3];
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
 if(cfg.kind==='dither'||cfg.kind==='powderiser'){
   const levels=cfg.kind==='dither'?Math.max(2,Math.round(cfg.levels)):0;
   for(let i=0;i<data.length;i+=4){const n=(hash((i/4)%w,Math.floor(i/4/w),71)-0.5)*noise*50;for(let k=0;k<3;k++){const v=clamp(data[i+k]+n,0,255);dst[i+k]=cfg.kind==='dither'?Math.round(v/255*(levels-1))*255/(levels-1):clamp(v+(hash(i,k,99)-0.5)*noise*80,0,255);}dst[i+3]=data[i+3];}
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
