import * as THREE from 'three';
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
  /** Hashing: cell size in pixels (2–64). */
  hashSize: number;
  /** Hashing: activation density 0–100. */
  hashDensity: number;
  /** Hashing: PRNG seed. */
  hashSeed: number;
  /** Hashing feature distribution. */
  hashAlgorithm: 'sparse' | 'cell' | 'grid-jitter';
  /** Wood: band, ring, or both. */
  woodGrainType: 'band' | 'ring' | 'band+ring';
  bandFrequency: number;
  ringFrequency: number;
  ringNoise: number;
  woodRoughness: number;
  woodSeed: number;
  /** Optional dither pattern. */
  ditherPattern: 'hash' | 'bayer';
  /** Powder / noise seed. */
  filterSeed: number;
  woodSources: WoodSource[];
  objectPositionMap?: Float32Array;
  objectMapWidth?: number;
  objectMapHeight?: number;
}
export const DEFAULT_TEXTURE_FILTER: TextureFilterConfig = {
  kind: 'wood', source: 'color', color: '#8a5a35', edge: 65, noise: 25, bleed: 18, blur: 1,
  angle: 35, shift: 6, randomization: 20, lineSpacing: 12, mosaicSize: 8, levels: 5, directionSpace: 'uv', axis: 'Z',
  hashSize: 10, hashDensity: 28, hashSeed: 23, hashAlgorithm: 'cell',
  woodGrainType: 'band+ring', bandFrequency: 40, ringFrequency: 35, ringNoise: 25, woodRoughness: 30, woodSeed: 17,
  ditherPattern: 'hash', filterSeed: 71,
  woodSources: [{id:'wood-1',source:'color',color:'#8a5a35',density:50}]
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

export function buildObjectSpacePositionMap(geometry: THREE.BufferGeometry, width: number, height: number, uvArray?: Float32Array): Float32Array {
  const position = geometry.getAttribute('position');
  const uv = uvArray || geometry.getAttribute('uv')?.array as Float32Array | undefined;
  if (!position || !uv || uv.length < position.count * 2) throw new Error('The selected mesh needs position and active UV data.');
  const bounds = new THREE.Box3().setFromBufferAttribute(position as THREE.BufferAttribute);
  const size = bounds.getSize(new THREE.Vector3());
  const map = new Float32Array(width * height * 3);
  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  for (let tri = 0; tri + 2 < count; tri += 3) {
    const a = index ? index.getX(tri) : tri;
    const b = index ? index.getX(tri + 1) : tri + 1;
    const c = index ? index.getX(tri + 2) : tri + 2;
    const ax = uv[a * 2] * width, ay = (1 - uv[a * 2 + 1]) * height;
    const bx = uv[b * 2] * width, by = (1 - uv[b * 2 + 1]) * height;
    const cx = uv[c * 2] * width, cy = (1 - uv[c * 2 + 1]) * height;
    const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(denom) < 1e-8) continue;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx))), maxX = Math.min(width - 1, Math.ceil(Math.max(ax, bx, cx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy))), maxY = Math.min(height - 1, Math.ceil(Math.max(ay, by, cy)));
    const pa = new THREE.Vector3().fromBufferAttribute(position as THREE.BufferAttribute, a);
    const pb = new THREE.Vector3().fromBufferAttribute(position as THREE.BufferAttribute, b);
    const pc = new THREE.Vector3().fromBufferAttribute(position as THREE.BufferAttribute, c);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const wa = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denom;
      const wb = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denom;
      const wc = 1 - wa - wb;
      if (wa < -0.002 || wb < -0.002 || wc < -0.002) continue;
      const px = wa * pa.x + wb * pb.x + wc * pc.x;
      const py = wa * pa.y + wb * pb.y + wc * pc.y;
      const pz = wa * pa.z + wb * pb.z + wc * pc.z;
      const at = (y * width + x) * 3;
      map[at] = clamp((px - bounds.min.x) / Math.max(size.x, 1e-8), 0, 1);
      map[at + 1] = clamp((py - bounds.min.y) / Math.max(size.y, 1e-8), 0, 1);
      map[at + 2] = clamp((pz - bounds.min.z) / Math.max(size.z, 1e-8), 0, 1);
    }
  }
  return map;
}

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
       const mapped=cfg.objectPositionMap&&cfg.objectMapWidth===w&&cfg.objectMapHeight===h; const mi=(y*w+x)*3; const ox=mapped?cfg.objectPositionMap![mi]:x/w, oy=mapped?cfg.objectPositionMap![mi+1]:y/h, oz=mapped?cfg.objectPositionMap![mi+2]:0;
       const grainCoord=cfg.axis==='X'?oy*0.72+oz*0.28:cfg.axis==='Y'?ox*0.72+oz*0.28:ox*0.72+oy*0.28;
       const flow=cfg.axis==='X'?ox:cfg.axis==='Y'?oy:oz;
       const grainType=cfg.woodGrainType||'band+ring';
       const bandFreq=0.004+(clamp(cfg.bandFrequency??40,1,100)/100)*0.04;
       const ringFreq=2+(clamp(cfg.ringFrequency??35,1,100)/100)*48;
       const ringN=clamp(cfg.ringNoise??25,0,100)/100;
       const woodSeed=Math.floor(cfg.woodSeed||17);
       const densScale=0.5+density/100;
       // Banding: parallel waves along grain direction
       const bandPhase=(grainCoord*128*dx+flow*12*dy)*bandFreq*densScale;
       const bandWave=Math.sin(bandPhase+Math.sin(flow*14+woodSeed)*1.8)+0.55*Math.sin(bandPhase*0.31);
       // Rings: radial distance in plane perpendicular to axis, warped by ring noise
       const rx=cfg.axis==='X'?oy-0.5:cfg.axis==='Y'?ox-0.5:ox-0.5;
       const ry=cfg.axis==='X'?oz-0.5:cfg.axis==='Y'?oz-0.5:oy-0.5;
       const ringWarp=(hash(x,y,woodSeed+9)-0.5)*ringN*0.55+(hash(x,y,woodSeed+11)-0.5)*ringN*0.25;
       const ringDist=Math.sqrt(rx*rx+ry*ry)+ringWarp;
       const ringWave=Math.sin(ringDist*ringFreq+Math.sin(ringDist*6+woodSeed)*ringN*2.2);
       let wave=0;
       if(grainType==='band')wave=bandWave;
       else if(grainType==='ring')wave=ringWave;
       else wave=bandWave*0.55+ringWave*0.45;
       const n=(hash(x,y,woodSeed+13+stack.indexOf(row)*37)-0.5)*(noise+clamp(cfg.randomization??20,0,100)/100)*55;
       let grain=clamp(0.5+wave*0.24+n/255,0,1);
       // Roughness frays edges by mixing local hash into contrast
       const rough=clamp(cfg.woodRoughness??30,0,100)/100;
       if(rough>0){const rJ=(hash(x,y,woodSeed+41)-0.5)*rough;grain=clamp(grain+rJ*0.35,0,1);}
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
   const seed=Math.floor(cfg.filterSeed??71);
   const bayer4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
   for(let i=0;i<data.length;i+=4){
     const x=(i/4)%w,y=Math.floor(i/4/w);
     const n=cfg.ditherPattern==='bayer'?((bayer4[y&3][x&3]/15)-0.5)*noise*60:(hash(x,y,seed)-0.5)*noise*50;
     for(let k=0;k<3;k++){const v=clamp(data[i+k]+n,0,255);dst[i+k]=Math.round(v/255*(levels-1))*255/(levels-1);}dst[i+3]=data[i+3];
   }
   return out;
 }
 if(cfg.kind==='noise-shader'){
   const seed=Math.floor(cfg.filterSeed??71);
   for(let i=0;i<data.length;i+=4){const x=(i/4)%w,y=Math.floor(i/4/w);const darkness=1-hash(x,y,seed)*(noise*0.78);for(let k=0;k<3;k++)dst[i+k]=clamp(data[i+k]*darkness,0,255);dst[i+3]=data[i+3];}
   return out;
 }
 if(cfg.kind==='powderiser'){
   const strength=clamp(noise/100,0,1),drift=clamp(cfg.shift||12,1,48);
   const seed=Math.floor(cfg.filterSeed??211);
   for(let i=0;i<data.length;i+=4){const x=(i/4)%w,y=Math.floor(i/4/w),r=hash(x,y,seed);
     if(r<strength){const sx=clamp(Math.round(x+dx*drift*(0.25+hash(x,y,seed+19))),0,w-1),sy=clamp(Math.round(y+dy*drift*(0.25+hash(x,y,seed+29))),0,h-1);const j=(sy*w+sx)*4;dst[j]=data[i];dst[j+1]=data[i+1];dst[j+2]=data[i+2];dst[j+3]=Math.max(dst[j+3],Math.round(data[i+3]*(0.25+0.65*(1-strength))));dst[i+3]=Math.round(data[i+3]*(1-strength)*0.22);}
     else {dst[i]=data[i];dst[i+1]=data[i+1];dst[i+2]=data[i+2];dst[i+3]=Math.round(data[i+3]*(1-strength*0.7));}
   }
   return out;
 }
 // Directional displacement: line-mask controlled shifts, not line painting/overlay.
 const maskAt=(x:number,y:number,angleOffset:number,spacing:number)=>{
   const a=angle+angleOffset, nx=-Math.sin(a),ny=Math.cos(a);
   const phase=(x*nx+y*ny)/Math.max(2,spacing);
   const halfWidth=0.12+0.2*(cfg.bleed/100);
   return Math.abs(phase-Math.round(phase))<halfWidth;
 };
 const hashSize=Math.max(2,Math.round(cfg.hashSize||10));
 const hashDensity=clamp((cfg.hashDensity??28)/100,0,1);
 const hashSeed=Math.floor(cfg.hashSeed||23);
 const hashAlgo=cfg.hashAlgorithm||'cell';
 const hashActive=(x:number,y:number)=>{
   if(hashAlgo==='sparse'){
     return hash(x,y,hashSeed)<hashDensity;
   }
   if(hashAlgo==='grid-jitter'){
     const jx=(hash(Math.floor(x/hashSize),Math.floor(y/hashSize),hashSeed+3)-0.5)*hashSize*0.45;
     const jy=(hash(Math.floor(x/hashSize),Math.floor(y/hashSize),hashSeed+7)-0.5)*hashSize*0.45;
     const cx=Math.floor((x+jx)/hashSize), cy=Math.floor((y+jy)/hashSize);
     return hash(cx,cy,hashSeed)<hashDensity;
   }
   // cell: one decision per cell
   const cx=Math.floor(x/hashSize), cy=Math.floor(y/hashSize);
   return hash(cx,cy,hashSeed)<hashDensity;
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   let active=cfg.kind==='hashing'?hashActive(x,y):maskAt(x,y,0,cfg.lineSpacing);
   if(cfg.kind==='cross-hatching')active=maskAt(x,y,0,cfg.lineSpacing)||maskAt(x,y,Math.PI/2,cfg.lineSpacing);
   if(cfg.kind==='hatching')active=maskAt(x,y,0,cfg.lineSpacing);
   const jitter=(hash(x,y,hashSeed+20)-0.5)*cfg.randomization/100*cfg.shift;
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
