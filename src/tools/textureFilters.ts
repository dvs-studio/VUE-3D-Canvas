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
  /** Hatching / hashing feature scale, percent. 100 keeps the historical spacing. */
  featureScale: number;
  /** Independent positional jitter, 0–100. Does not replace displacement randomisation. */
  positionJitter: number;
  /** Independent per-cell rotation jitter in degrees. */
  angleJitter: number;
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
  /** Seeded spatial variation applied independently to band and ring frequencies. */
  woodFrequencyRandomization: number;
  /** Optional dither pattern. */
  ditherPattern: 'hash' | 'bayer';
  /** Powder / noise seed. */
  filterSeed: number;
  woodSources: WoodSource[];
  objectPositionMap?: Float32Array;
  objectMapWidth?: number;
  objectMapHeight?: number;
  /** Optional filter target. "all" leaves the full layer eligible. */
  targetMeshPart?: string;
  useMeshPartMask?: boolean;
  /** Per-texel coverage (0–255) for the selected mesh part. */
  meshPartMask?: Uint8Array;
  meshPartMaskWidth?: number;
  meshPartMaskHeight?: number;
}
export const DEFAULT_TEXTURE_FILTER: TextureFilterConfig = {
  kind: 'wood', source: 'color', color: '#8a5a35', edge: 65, noise: 25, bleed: 18, blur: 1,
  angle: 35, shift: 6, randomization: 20, lineSpacing: 12, mosaicSize: 8, levels: 5, directionSpace: 'uv', axis: 'Z',
  hashSize: 10, hashDensity: 28, hashSeed: 23, hashAlgorithm: 'cell',
  featureScale: 100, positionJitter: 0, angleJitter: 0,
  woodGrainType: 'band+ring', bandFrequency: 40, ringFrequency: 35, ringNoise: 25, woodRoughness: 30, woodSeed: 17, woodFrequencyRandomization: 15,
  ditherPattern: 'hash', filterSeed: 71,
  woodSources: [{id:'wood-1',source:'color',color:'#8a5a35',density:50}],
  targetMeshPart: 'all',
  useMeshPartMask: true,
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

/** Pad opaque island texels into transparent gutters so blur and shifts do not pull empty black. */
export function dilateImageData(image: ImageData, radius: number): void {
  if (radius <= 0) return;
  const w = image.width;
  const h = image.height;
  const src = image.data;
  const output = new Uint8ClampedArray(src);
  const offsets: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let pass = 0; pass < radius; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (src[idx + 3] >= 10) continue;
        let rSum = 0, gSum = 0, bSum = 0, aMax = 0, count = 0;
        for (const [dx, dy] of offsets) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const nIdx = (ny * w + nx) * 4;
          if (src[nIdx + 3] <= 20) continue;
          rSum += src[nIdx]; gSum += src[nIdx + 1]; bSum += src[nIdx + 2];
          if (src[nIdx + 3] > aMax) aMax = src[nIdx + 3];
          count++;
        }
        if (count > 0) {
          output[idx] = Math.round(rSum / count);
          output[idx + 1] = Math.round(gSum / count);
          output[idx + 2] = Math.round(bSum / count);
          output[idx + 3] = aMax;
        }
      }
    }
    src.set(output);
  }
}

export interface MeshSurfaceMap {
  width: number;
  height: number;
  /** Object-space position. */
  position: Float32Array;
  /** Position normalised to mesh bounds. NaN where the texel is not on the mesh or its gutter. */
  position01: Float32Array;
  /** Unit object-space normal. */
  normal: Float32Array;
  covered: Uint8Array;
}

function distPointSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax, aby = by - ay;
  const ab2 = abx * abx + aby * aby || 1e-8;
  let t = ((px - ax) * abx + (py - ay) * aby) / ab2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = ax + abx * t - px, dy = ay + aby * t - py;
  return Math.hypot(dx, dy);
}

/**
 * Rasterise the active UV chart into per-texel object position and normal.
 * Coverage is conservative (sub-texel cracks count) and then dilated into the
 * gutter so filters and fills do not sample the atlas background at island edges.
 */
export function rasterizeMeshSurface(
  geometry: THREE.BufferGeometry,
  width: number,
  height: number,
  uvArray?: Float32Array,
  gutter = 4,
): MeshSurfaceMap {
  const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  const normalAttr = geometry.getAttribute('normal') as THREE.BufferAttribute | undefined;
  const uv = uvArray || (geometry.getAttribute('uv')?.array as Float32Array | undefined);
  if (!positionAttr || !uv || uv.length < positionAttr.count * 2) {
    throw new Error('The selected mesh needs position and active UV data.');
  }
  const bounds = new THREE.Box3().setFromBufferAttribute(positionAttr);
  const size = bounds.getSize(new THREE.Vector3());
  const position = new Float32Array(width * height * 3);
  const position01 = new Float32Array(width * height * 3);
  position01.fill(NaN);
  const normal = new Float32Array(width * height * 3);
  const covered = new Uint8Array(width * height);
  const score = new Float32Array(width * height);
  score.fill(-1);
  const index = geometry.getIndex();
  const count = index ? index.count : positionAttr.count;
  const pad = 0.85;
  for (let tri = 0; tri + 2 < count; tri += 3) {
    const a = index ? index.getX(tri) : tri;
    const b = index ? index.getX(tri + 1) : tri + 1;
    const c = index ? index.getX(tri + 2) : tri + 2;
    const ax = uv[a * 2] * width, ay = (1 - uv[a * 2 + 1]) * height;
    const bx = uv[b * 2] * width, by = (1 - uv[b * 2 + 1]) * height;
    const cx = uv[c * 2] * width, cy = (1 - uv[c * 2 + 1]) * height;
    const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(denom) < 1e-8) continue;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx) - pad));
    const maxX = Math.min(width - 1, Math.ceil(Math.max(ax, bx, cx) + pad));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy) - pad));
    const maxY = Math.min(height - 1, Math.ceil(Math.max(ay, by, cy) + pad));
    const pax = positionAttr.getX(a), pay = positionAttr.getY(a), paz = positionAttr.getZ(a);
    const pbx = positionAttr.getX(b), pby = positionAttr.getY(b), pbz = positionAttr.getZ(b);
    const pcx = positionAttr.getX(c), pcy = positionAttr.getY(c), pcz = positionAttr.getZ(c);
    let nax: number, nay: number, naz: number, nbx: number, nby: number, nbz: number, ncx: number, ncy: number, ncz: number;
    if (normalAttr) {
      nax = normalAttr.getX(a); nay = normalAttr.getY(a); naz = normalAttr.getZ(a);
      nbx = normalAttr.getX(b); nby = normalAttr.getY(b); nbz = normalAttr.getZ(b);
      ncx = normalAttr.getX(c); ncy = normalAttr.getY(c); ncz = normalAttr.getZ(c);
    } else {
      const e1x = pbx - pax, e1y = pby - pay, e1z = pbz - paz;
      const e2x = pcx - pax, e2y = pcy - pay, e2z = pcz - paz;
      let fnx = e1y * e2z - e1z * e2y, fny = e1z * e2x - e1x * e2z, fnz = e1x * e2y - e1y * e2x;
      const fl = Math.hypot(fnx, fny, fnz) || 1;
      fnx /= fl; fny /= fl; fnz /= fl;
      nax = nbx = ncx = fnx; nay = nby = ncy = fny; naz = nbz = ncz = fnz;
    }
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        let wa = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / denom;
        let wb = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / denom;
        let wc = 1 - wa - wb;
        const inside = wa >= -1e-4 && wb >= -1e-4 && wc >= -1e-4;
        if (!inside) {
          const dist = Math.min(
            distPointSeg(px, py, ax, ay, bx, by),
            distPointSeg(px, py, bx, by, cx, cy),
            distPointSeg(px, py, cx, cy, ax, ay),
          );
          if (dist > pad) continue;
        }
        wa = Math.max(0, wa); wb = Math.max(0, wb); wc = Math.max(0, wc);
        const ws = wa + wb + wc || 1;
        wa /= ws; wb /= ws; wc /= ws;
        const interior = Math.min(wa, wb, wc);
        const at = y * width + x;
        if (interior < score[at]) continue;
        score[at] = interior;
        covered[at] = 1;
        const ox = wa * pax + wb * pbx + wc * pcx;
        const oy = wa * pay + wb * pby + wc * pcy;
        const oz = wa * paz + wb * pbz + wc * pcz;
        const o = at * 3;
        position[o] = ox; position[o + 1] = oy; position[o + 2] = oz;
        position01[o] = clamp((ox - bounds.min.x) / Math.max(size.x, 1e-8), 0, 1);
        position01[o + 1] = clamp((oy - bounds.min.y) / Math.max(size.y, 1e-8), 0, 1);
        position01[o + 2] = clamp((oz - bounds.min.z) / Math.max(size.z, 1e-8), 0, 1);
        let nx = wa * nax + wb * nbx + wc * ncx;
        let ny = wa * nay + wb * nby + wc * ncy;
        let nz = wa * naz + wb * nbz + wc * ncz;
        const nl = Math.hypot(nx, ny, nz) || 1;
        normal[o] = nx / nl; normal[o + 1] = ny / nl; normal[o + 2] = nz / nl;
      }
    }
  }
  const offsets: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let pass = 0; pass < gutter; pass++) {
    const nextCovered = covered.slice();
    const nextPos = position.slice();
    const next01 = position01.slice();
    const nextN = normal.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const at = y * width + x;
        if (covered[at]) continue;
        for (const [dx, dy] of offsets) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const from = ny * width + nx;
          if (!covered[from]) continue;
          nextCovered[at] = 1;
          nextPos.set(position.subarray(from * 3, from * 3 + 3), at * 3);
          next01.set(position01.subarray(from * 3, from * 3 + 3), at * 3);
          nextN.set(normal.subarray(from * 3, from * 3 + 3), at * 3);
          break;
        }
      }
    }
    covered.set(nextCovered);
    position.set(nextPos);
    position01.set(next01);
    normal.set(nextN);
  }
  return { width, height, position, position01, normal, covered };
}

export function buildObjectSpacePositionMap(geometry: THREE.BufferGeometry, width: number, height: number, uvArray?: Float32Array): Float32Array {
  return rasterizeMeshSurface(geometry, width, height, uvArray, 4).position01;
}

/**
 * Rasterises only the triangles belonging to one named mesh component (or geometry group)
 * into a byte coverage mask aligned to the active UV channel.
 */
export function buildMeshPartPixelMask(
  geometry: THREE.BufferGeometry,
  width: number,
  height: number,
  targetMeshPart: string,
  uvArray?: Float32Array,
): Uint8Array | null {
  if (!geometry || !targetMeshPart || targetMeshPart === 'all' || width <= 0 || height <= 0) return null;
  const position = geometry.getAttribute('position') as THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined;
  const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined;
  const useUVOverride = !!uvArray && !!position && uvArray.length >= position.count * 2;
  if (!position || (!useUVOverride && (!uvAttribute || uvAttribute.count < position.count))) return null;

  const componentIndices = geometry.userData?.componentIndices as Record<string, ArrayLike<number>> | undefined;
  const component = componentIndices?.[targetMeshPart];
  const allowed = component ? new Set<number>(Array.from(component, value => Number(value))) : null;
  const groupIndex = Number(targetMeshPart);
  const group = !allowed && Number.isInteger(groupIndex) ? geometry.groups[groupIndex] : undefined;
  if (!allowed && !group) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  const index = geometry.getIndex();
  const elementCount = index ? index.count : position.count;
  const uvAt = (vertex: number) => useUVOverride
    ? { u: uvArray![vertex * 2], v: uvArray![vertex * 2 + 1] }
    : { u: uvAttribute!.getX(vertex), v: uvAttribute!.getY(vertex) };

  for (let offset = 0; offset + 2 < elementCount; offset += 3) {
    if (group && (offset < group.start || offset + 2 >= group.start + group.count)) continue;
    const a = index ? index.getX(offset) : offset;
    const b = index ? index.getX(offset + 1) : offset + 1;
    const c = index ? index.getX(offset + 2) : offset + 2;
    if ([a, b, c].some(vertex => !Number.isInteger(vertex) || vertex < 0 || vertex >= position.count)) continue;
    if (allowed && (!allowed.has(a) || !allowed.has(b) || !allowed.has(c))) continue;

    const ua = uvAt(a), ub = uvAt(b), uc = uvAt(c);
    const ax = ua.u * width, ay = (1 - ua.v) * height;
    const bx = ub.u * width, by = (1 - ub.v) * height;
    const cx = uc.u * width, cy = (1 - uc.v) * height;
    if (![ax, ay, bx, by, cx, cy].every(Number.isFinite)) continue;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
  }

  try {
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const mask = new Uint8Array(width * height);
    for (let pixel = 0; pixel < mask.length; pixel++) mask[pixel] = pixels[pixel * 4 + 3];
    return mask;
  } catch {
    return null;
  }
}

export async function transformTexturePixels(source:ImageData,cfg:TextureFilterConfig):Promise<ImageData>{
 const w=source.width,h=source.height, out=new ImageData(w,h), data=source.data, dst=out.data;
 const srcImg=cfg.kind==='wood'&&cfg.source==='image'?await imageSource(cfg.sourceImageDataUrl,w,h):null;
 const woodStack=cfg.kind==='wood'?await Promise.all((cfg.woodSources?.length?cfg.woodSources:[{id:'fallback',source:cfg.source,color:cfg.color,imageDataUrl:cfg.sourceImageDataUrl,density:50}]).map(async item=>({item,image:item.source==='image'?await imageSource(item.imageDataUrl,w,h):null,color:parseColor(item.color)}))):[];
 const color=parseColor(cfg.color);
 const axisAngle=cfg.directionSpace==='uv'?0:(cfg.axis==='X'?0:cfg.axis==='Y'?90:45);
 const angle=(axisAngle+cfg.angle)*Math.PI/180, dx=Math.cos(angle),dy=Math.sin(angle);
 const edge=cfg.edge/100, noise=cfg.noise/100, bleed=cfg.bleed/100;
 const meshMask = cfg.useMeshPartMask !== false ? cfg.meshPartMask : undefined;
 const hasMeshMask = !!meshMask &&
   cfg.meshPartMaskWidth === w &&
   cfg.meshPartMaskHeight === h &&
   meshMask.length >= w * h;
 const applyMeshMask = (result: ImageData): ImageData => {
   if (!hasMeshMask) return result;
   const resultData = result.data;
   for (let pixel = 0; pixel < w * h; pixel++) {
     const coverage = meshMask![pixel] / 255;
     if (coverage >= 0.999) continue;
     const i = pixel * 4;
     const outside = 1 - coverage;
     for (let channel = 0; channel < 4; channel++) {
       resultData[i + channel] = Math.round(data[i + channel] * outside + resultData[i + channel] * coverage);
     }
   }
   return result;
 };
 if(cfg.kind==='wood'){
   // Each stacked colour/image contributes a grain band; density controls its spatial frequency and blend weight.
   const stack=woodStack.length?woodStack:[{item:{id:'fallback',source:'color' as const,color:cfg.color,density:50},image:null,color}];
   const totalWeight=stack.reduce((sum,row)=>sum+Math.max(1,row.item.density),0);
   // Resolve the seed before the pixel loop: frequency jitter uses it below.
   const woodSeed=Math.floor(cfg.woodSeed||17);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4;
     const mapped=!!(cfg.objectPositionMap&&cfg.objectMapWidth===w&&cfg.objectMapHeight===h);
     const mi=(y*w+x)*3;
     if(mapped && !Number.isFinite(cfg.objectPositionMap![mi])){
       dst[i]=data[i];dst[i+1]=data[i+1];dst[i+2]=data[i+2];dst[i+3]=data[i+3];
       continue;
     }
     let rr=0,gg=0,bb=0,aa=0;
     for(const row of stack){
       const density=clamp(Number(row.item.density)||1,1,100);
       const ox=mapped?cfg.objectPositionMap![mi]:x/w, oy=mapped?cfg.objectPositionMap![mi+1]:y/h, oz=mapped?cfg.objectPositionMap![mi+2]:0;
       const grainCoord=cfg.axis==='X'?oy*0.72+oz*0.28:cfg.axis==='Y'?ox*0.72+oz*0.28:ox*0.72+oy*0.28;
       const flow=cfg.axis==='X'?ox:cfg.axis==='Y'?oy:oz;
       const grainType=cfg.woodGrainType||'band+ring';
       const frequencyRandomization=clamp(cfg.woodFrequencyRandomization??15,0,100)/100;
       const frequencyCellX=Math.floor(x/48),frequencyCellY=Math.floor(y/48);
       const bandFrequencyScale=1+(hash(frequencyCellX,frequencyCellY,woodSeed+73)-0.5)*2*frequencyRandomization;
       const ringFrequencyScale=1+(hash(frequencyCellX,frequencyCellY,woodSeed+79)-0.5)*2*frequencyRandomization;
       const bandFreq=(0.004+(clamp(cfg.bandFrequency??40,1,100)/100)*0.04)*bandFrequencyScale;
       const ringFreq=(2+(clamp(cfg.ringFrequency??35,1,100)/100)*48)*ringFrequencyScale;
       const ringN=clamp(cfg.ringNoise??25,0,100)/100;
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
     dilateImageData(out, Math.ceil(clamp(cfg.blur,0,20))+3);
     const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d')!.putImageData(out,0,0);
     const blurred=document.createElement('canvas');blurred.width=w;blurred.height=h;const ctx=blurred.getContext('2d')!;
     ctx.filter=`blur(${clamp(cfg.blur,0,20)}px)`;ctx.drawImage(tmp,0,0);return applyMeshMask(ctx.getImageData(0,0,w,h));
   }
   return applyMeshMask(out);
 }
 if(cfg.kind==='mosaic'){
   const size=Math.max(2,Math.round(cfg.mosaicSize));for(let y=0;y<h;y+=size)for(let x=0;x<w;x+=size){
     let r=0,g=0,b=0,a=0,count=0;for(let yy=y;yy<Math.min(h,y+size);yy++)for(let xx=x;xx<Math.min(w,x+size);xx++){let i=(yy*w+xx)*4;r+=data[i];g+=data[i+1];b+=data[i+2];a+=data[i+3];count++;}
     r/=count;g/=count;b/=count;a/=count;for(let yy=y;yy<Math.min(h,y+size);yy++)for(let xx=x;xx<Math.min(w,x+size);xx++){let i=(yy*w+xx)*4;dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=a;}
   }return applyMeshMask(out);
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
   return applyMeshMask(out);
 }
 if(cfg.kind==='noise-shader'){
   const seed=Math.floor(cfg.filterSeed??71);
   for(let i=0;i<data.length;i+=4){const x=(i/4)%w,y=Math.floor(i/4/w);const darkness=1-hash(x,y,seed)*(noise*0.78);for(let k=0;k<3;k++)dst[i+k]=clamp(data[i+k]*darkness,0,255);dst[i+3]=data[i+3];}
   return applyMeshMask(out);
 }
 if(cfg.kind==='powderiser'){
   const strength=clamp(noise,0,1),drift=clamp(cfg.shift||12,1,48);
   const seed=Math.floor(cfg.filterSeed??211);
   dst.set(data);
   if(strength<=0)return applyMeshMask(out);
   const selected=new Uint8Array(w*h);
   // Pass one only changes source coverage. Keep scatter writes out of this pass so
   // later source pixels cannot overwrite fragments emitted by earlier pixels.
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const pixel=y*w+x,i=pixel*4;
     if(data[i+3]===0)continue;
     const r=hash(x,y,seed);
     if(r<strength){
       selected[pixel]=1;
       dst[i+3]=Math.round(data[i+3]*(1-strength)*0.22);
     }else{
       dst[i+3]=Math.round(data[i+3]*(1-strength*0.7));
     }
   }
   // Pass two composites deterministic, fading dust fragments over the completed
   // source image. Multiple fragments landing on one texel accumulate correctly.
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const pixel=y*w+x;
     if(!selected[pixel])continue;
     const i=pixel*4;
     const sx=clamp(Math.round(x+dx*drift*(0.25+hash(x,y,seed+19))),0,w-1);
     const sy=clamp(Math.round(y+dy*drift*(0.25+hash(x,y,seed+29))),0,h-1);
     const j=(sy*w+sx)*4;
     const sourceAlpha=(data[i+3]/255)*(0.25+0.65*(1-strength));
     if(sourceAlpha<=0)continue;
     const destAlpha=dst[j+3]/255;
     const combinedAlpha=sourceAlpha+destAlpha*(1-sourceAlpha);
     if(combinedAlpha<=0)continue;
     for(let channel=0;channel<3;channel++){
       dst[j+channel]=Math.round((data[i+channel]*sourceAlpha+dst[j+channel]*destAlpha*(1-sourceAlpha))/combinedAlpha);
     }
     dst[j+3]=Math.round(combinedAlpha*255);
   }
   return applyMeshMask(out);
 }
 // Directional displacement: line-mask controlled shifts, not line painting/overlay.
 const featureScale=clamp(cfg.featureScale??100,25,400)/100;
 const lineSpacing=Math.max(2,(cfg.lineSpacing||12)*featureScale);
 const hashSize=Math.max(2,Math.round((cfg.hashSize||10)*featureScale));
 const hashDensity=clamp((cfg.hashDensity??28)/100,0,1);
 const hashSeed=Math.floor(cfg.hashSeed||23);
 const hashAlgo=cfg.hashAlgorithm||'cell';
 const posJ=clamp(cfg.positionJitter??0,0,100)/100;
 const angJ=clamp(cfg.angleJitter??0,0,180)*Math.PI/180;
 const maskAt=(x:number,y:number,angleOffset:number,spacing:number)=>{
   const cx=Math.floor(x/spacing), cy=Math.floor(y/spacing);
   const jx=(hash(cx,cy,hashSeed+3)-0.5)*spacing*posJ;
   const jy=(hash(cx,cy,hashSeed+7)-0.5)*spacing*posJ;
   const a=angle+angleOffset+(hash(cx,cy,hashSeed+11)-0.5)*2*angJ;
   const nx=-Math.sin(a),ny=Math.cos(a);
   const phase=((x+jx)*nx+(y+jy)*ny)/Math.max(2,spacing);
   const halfWidth=0.12+0.2*(cfg.bleed/100);
   return Math.abs(phase-Math.round(phase))<halfWidth;
 };
 const hashActive=(x:number,y:number)=>{
   const cx0=Math.floor(x/hashSize), cy0=Math.floor(y/hashSize);
   const a=(hash(cx0,cy0,hashSeed+11)-0.5)*2*angJ;
   const cos=Math.cos(a), sin=Math.sin(a);
   const xr=x*cos-y*sin, yr=x*sin+y*cos;
   const jx=(hash(cx0,cy0,hashSeed+3)-0.5)*hashSize*posJ;
   const jy=(hash(cx0,cy0,hashSeed+7)-0.5)*hashSize*posJ;
   const sx=xr+jx, sy=yr+jy;
   if(hashAlgo==='sparse') return hash(Math.round(sx),Math.round(sy),hashSeed)<hashDensity;
   if(hashAlgo==='grid-jitter'){
     const jx2=(hash(Math.floor(sx/hashSize),Math.floor(sy/hashSize),hashSeed+3)-0.5)*hashSize*0.45;
     const jy2=(hash(Math.floor(sx/hashSize),Math.floor(sy/hashSize),hashSeed+7)-0.5)*hashSize*0.45;
     const cx=Math.floor((sx+jx2)/hashSize), cy=Math.floor((sy+jy2)/hashSize);
     return hash(cx,cy,hashSeed)<hashDensity;
   }
   const cx=Math.floor(sx/hashSize), cy=Math.floor(sy/hashSize);
   return hash(cx,cy,hashSeed)<hashDensity;
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   let active=cfg.kind==='hashing'?hashActive(x,y):maskAt(x,y,0,lineSpacing);
   if(cfg.kind==='cross-hatching')active=maskAt(x,y,0,lineSpacing)||maskAt(x,y,Math.PI/2,lineSpacing);
   if(cfg.kind==='hatching')active=maskAt(x,y,0,lineSpacing);
   const jitter=(hash(x,y,hashSeed+20)-0.5)*cfg.randomization/100*cfg.shift;
   const shift=active?cfg.shift+jitter:0;
   const sx=x-dx*shift,sy=y-dy*shift;
   const p=sample(source,sx,sy);const i=(y*w+x)*4;
   dst[i]=p[0];dst[i+1]=p[1];dst[i+2]=p[2];dst[i+3]=p[3];
 }
 return applyMeshMask(out);
}
export async function applyTextureFilterToCanvas(canvas:HTMLCanvasElement,cfg:TextureFilterConfig):Promise<void>{
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Selected layer canvas is unavailable');
 const probe=ctx.getImageData(0,0,canvas.width,canvas.height);
 let transparent=0, opaque=0;
 for(let i=3;i<probe.data.length;i+=4){ if(probe.data[i]<10) transparent++; else opaque++; }
 // Neighbourhood filters sample across UV gutters. Pad first for whole-layer work;
 // a selected-part mask must preserve every texel outside its target unchanged.
 const hasPartMask = cfg.useMeshPartMask !== false && !!cfg.meshPartMask &&
   cfg.meshPartMaskWidth === canvas.width && cfg.meshPartMaskHeight === canvas.height &&
   cfg.meshPartMask.length >= canvas.width * canvas.height;
 if(opaque>0 && transparent>0 && !hasPartMask) dilateImageData(probe, 8);
 const result=await transformTexturePixels(probe,cfg);
 ctx.putImageData(result,0,0);
 if(opaque>0 && transparent>0 && !hasPartMask) dilateImageData(result, 8), ctx.putImageData(result,0,0);
}
