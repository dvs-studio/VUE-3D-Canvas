/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Multi-Mode 3D Orientation Gizmo (Box, Sphere, Mountain)
 * Created by Victory Ukpong
 */

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  RotateCcw, 
  Smartphone,
  Maximize2,
  Minus,
  Box,
  CircleDot,
  Mountain as MountainIcon
} from 'lucide-react';
import { GizmoStyle } from '../core/types';

interface BoxGizmoProps {
  rotation: { x: number; y: number };
  onSnapView: (view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom') => void;
  onFlipView?: () => void;
  onPanDelta?: (dx: number, dy: number) => void;
  onZoomDelta?: (delta: number) => void;
  onToggleOrtho?: () => void;
  onResetCamera?: () => void;
  onAutoFit?: () => void;
  isOrtho?: boolean;
  touchNavEnabled?: boolean;
  onToggleTouchNav?: () => void;
  invertNav?: boolean;
  onToggleInvertNav?: () => void;
  gizmoStyle?: GizmoStyle;
  zoomPulseTrigger?: number;
}

export const BoxGizmo: React.FC<BoxGizmoProps> = ({
  rotation,
  onSnapView,
  onFlipView,
  onPanDelta,
  onZoomDelta,
  onToggleOrtho,
  onResetCamera,
  onAutoFit,
  isOrtho = false,
  touchNavEnabled = false,
  onToggleTouchNav,
  invertNav = false,
  onToggleInvertNav,
  gizmoStyle = 'box',
  zoomPulseTrigger = 0,
}) => {
  // Correctly aligned 3D angles for the CSS fallback and projected 2D arrows.
  const degX = (rotation.x * 180) / Math.PI;
  const degY = (rotation.y * 180) / Math.PI;
  const gizmoEuler = new THREE.Euler(rotation.x, rotation.y, 0, 'YXZ');
  const projectAxis = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyEuler(gizmoEuler);
  const arrowFor = (x: number, y: number) => {
    const arrows = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
    const angle = Math.atan2(y, x);
    return arrows[(Math.round(angle / (Math.PI / 4)) + 8) % 8];
  };
  const gizmoLabelPrefs = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('vue3d_preferences') || '{}');
      return { margin: Math.max(18, Math.min(44, Number(stored.gizmoLabelMargin ?? 31))), fontSize: Math.max(6, Math.min(13, Number(stored.gizmoLabelFontSize ?? 8))) };
    } catch { return { margin: 31, fontSize: 8 }; }
  })();
  const axisIndicators = [
    { label: '+X', view: 'right' as const, color: '#ff5b73', point: projectAxis(1, 0, 0), positive: true },
    { label: '-X', view: 'left' as const, color: '#873747', point: projectAxis(-1, 0, 0), positive: false },
    { label: '+Y', view: 'top' as const, color: '#63e18b', point: projectAxis(0, 1, 0), positive: true },
    { label: '-Y', view: 'bottom' as const, color: '#346b45', point: projectAxis(0, -1, 0), positive: false },
    { label: '+Z', view: 'front' as const, color: '#5ba7ff', point: projectAxis(0, 0, 1), positive: true },
    { label: '-Z', view: 'back' as const, color: '#315d91', point: projectAxis(0, 0, -1), positive: false },
  ];

  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelSceneRef = useRef<THREE.Scene | null>(null);
  const modelCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelObjectRef = useRef<THREE.Object3D | null>(null);
  const [gizmoModelReady, setGizmoModelReady] = useState(false);
  const [mountainGlbData, setMountainGlbData] = useState<ArrayBuffer | null>(null);
  const [mountainInfluence, setMountainInfluence] = useState(65);
  const mountainInputRef = useRef<HTMLInputElement | null>(null);
  const saveMountainModel = async (data: ArrayBuffer) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('vue3d-user-assets', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('models');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { const db=request.result; const tx=db.transaction('models','readwrite'); tx.objectStore('models').put(data,'mountain-gizmo'); tx.oncomplete=()=>{db.close();resolve();}; tx.onerror=()=>{db.close();reject(tx.error);}; };
    });
  };
  useEffect(() => {
    let cancelled=false;
    const request=indexedDB.open('vue3d-user-assets',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('models');
    request.onsuccess=()=>{const db=request.result;const tx=db.transaction('models','readonly');const get=tx.objectStore('models').get('mountain-gizmo');get.onsuccess=()=>{if(!cancelled&&get.result instanceof ArrayBuffer)setMountainGlbData(get.result);};tx.oncomplete=()=>db.close();};
    return()=>{cancelled=true;};
  }, []);
  const handleMountainUpload=(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    if(!file.name.toLowerCase().endsWith('.glb')){window.alert('Please choose a binary GLB model (.glb).');event.target.value='';return;}
    file.arrayBuffer().then(async data=>{await saveMountainModel(data);setMountainGlbData(data);}).catch(()=>window.alert('The model could not be saved in this browser storage. Try a smaller GLB or clear unused site storage.'));
    event.target.value='';
  };

  // A small independent WebGL preview loads the GLB assets supplied in
  // self-host/public/assets/Gizmo. CSS remains the offline/failure fallback.
  useEffect(() => {
    const canvas = modelCanvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setGizmoModelReady(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(88, 88, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    camera.position.set(0, 0, 3.4);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb9d8ff, 0.8);
    fill.position.set(-4, 1, -3);
    scene.add(fill);
    modelRendererRef.current = renderer;
    modelSceneRef.current = scene;
    modelCameraRef.current = camera;
    return () => {
      if (modelObjectRef.current) {
        scene.remove(modelObjectRef.current);
        modelObjectRef.current.traverse(node => {
          const mesh = node as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(material => material.dispose());
          }
        });
        modelObjectRef.current = null;
      }
      renderer.dispose();
      modelRendererRef.current = null;
      modelSceneRef.current = null;
      modelCameraRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene=modelSceneRef.current, renderer=modelRendererRef.current, camera=modelCameraRef.current;
    if(!scene||!renderer||!camera)return;
    let disposed=false;
    setGizmoModelReady(false);
    if(modelObjectRef.current){
      const old=modelObjectRef.current;scene.remove(old);
      old.traverse(node=>{const mesh=node as THREE.Mesh;if(mesh.isMesh){mesh.geometry.dispose();const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];mats.forEach(m=>m.dispose());}});
      modelObjectRef.current=null;
    }
    const axisSpecs=[
      {color:0xff5b73,direction:new THREE.Vector3(1,0,0),sign:1},
      {color:0x873747,direction:new THREE.Vector3(-1,0,0),sign:-1},
      {color:0x63e18b,direction:new THREE.Vector3(0,1,0),sign:1},
      {color:0x346b45,direction:new THREE.Vector3(0,-1,0),sign:-1},
      {color:0x5ba7ff,direction:new THREE.Vector3(0,0,1),sign:1},
      {color:0x315d91,direction:new THREE.Vector3(0,0,-1),sign:-1},
    ];
    const applyMountainVertexColors=(root:THREE.Object3D)=>{
      root.traverse(node=>{
        const mesh=node as THREE.Mesh;if(!mesh.isMesh)return;
        const geometry=mesh.geometry.clone();const position=geometry.getAttribute('position');
        const box=new THREE.Box3().setFromBufferAttribute(position as THREE.BufferAttribute);
        const size=box.getSize(new THREE.Vector3());const influence=mountainInfluence/100;
        const colors:number[]=[];
        for(let i=0;i<position.count;i++){
          const x=(position.getX(i)-box.min.x)/Math.max(size.x,1e-5);
          const y=(position.getY(i)-box.min.y)/Math.max(size.y,1e-5);
          const z=(position.getZ(i)-box.min.z)/Math.max(size.z,1e-5);
          const wx=Math.pow(Math.abs(x-.5)*2,1.4),wy=Math.pow(Math.abs(y-.5)*2,1.4),wz=Math.pow(z,1.4);
          const total=Math.max(1e-5,wx+wy+wz);const base=[0.95,0.34,0.42],green=[0.34,0.9,0.48],blue=[0.32,0.58,1];
          const r=(wx*base[0]+wy*green[0]+wz*blue[0])/total;
          const g=(wx*base[1]+wy*green[1]+wz*blue[1])/total;
          const b=(wx*base[2]+wy*green[2]+wz*blue[2])/total;
          const neutral=0.72;colors.push(neutral+(r-neutral)*influence,neutral+(g-neutral)*influence,neutral+(b-neutral)*influence);
        }
        geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
        const old=Array.isArray(mesh.material)?mesh.material:[mesh.material];old.forEach(m=>m.dispose());
        mesh.geometry=geometry;mesh.material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.72,metalness:.05});
      });
    };
    const finish=(root:THREE.Object3D, style:'box'|'sphere'|'mountain')=>{
      if(disposed)return;
      root.traverse(node=>{
        const mesh=node as THREE.Mesh;if(!mesh.isMesh)return;
        if(style==='mountain')return;
        const geometry=mesh.geometry.clone();const pos=geometry.getAttribute('position');
        if(style==='sphere'){
          const colors:number[]=[];
          for(let i=0;i<pos.count;i++){
            const v=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i)).normalize();
            const weights=[Math.pow(Math.abs(v.x),3),Math.pow(Math.abs(v.y),3),Math.pow(Math.abs(v.z),3)];
            const sum=Math.max(1e-5,weights[0]+weights[1]+weights[2]);
            const rgb=[(weights[0]*1+weights[1]*.38+weights[2]*.34)/sum,(weights[0]*.34+weights[1]*1+weights[2]*.55)/sum,(weights[0]*.45+weights[1]*.38+weights[2]*1)/sum];
            colors.push(...rgb);
          }
          geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
          mesh.geometry=geometry;mesh.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.08});
        }else{
          const materials=[0x873747,0xff5b73,0x346b45,0x63e18b,0x315d91,0x5ba7ff].map(color=>new THREE.MeshStandardMaterial({color,roughness:.58,metalness:.08}));
          mesh.geometry=geometry;mesh.material=materials;
        }
      });
      const bounds=new THREE.Box3().setFromObject(root);const center=bounds.getCenter(new THREE.Vector3());const size=bounds.getSize(new THREE.Vector3());
      const scale=1.45/Math.max(size.x,size.y,size.z,.0001);root.scale.setScalar(scale);root.position.set(-center.x*scale,-center.y*scale,-center.z*scale);root.rotation.order='YXZ';
      const normalizedCenter=new THREE.Vector3(0,0,0);
      const helpers:THREE.ArrowHelper[]=[];
      axisSpecs.forEach(spec=>{
        const arrow=new THREE.ArrowHelper(spec.direction,normalizedCenter,0.72,spec.color,.22,.14);
        arrow.userData.axisDirection=spec.direction.clone();arrow.userData.baseOpacity=spec.sign>0?.95:.65;
        arrow.traverse(child=>{const material=(child as THREE.Mesh|THREE.Line).material as THREE.Material|THREE.Material[]|undefined;if(!material)return;(Array.isArray(material)?material:[material]).forEach(m=>{const mat=m as THREE.Material&{opacity?:number;transparent?:boolean};mat.transparent=true;mat.opacity=arrow.userData.baseOpacity;mat.depthWrite=false;});});
        helpers.push(arrow);root.add(arrow);
      });
      root.userData.axisArrowHelpers=helpers;scene.add(root);modelObjectRef.current=root;setGizmoModelReady(true);renderer.render(scene,camera);
    };
    const createBuiltin=()=>{
      if(gizmoStyle==='box'){
        const geometry=new THREE.BoxGeometry(1.15,1.15,1.15);
        const materials=[0x315d91,0x5ba7ff,0x346b45,0x63e18b,0x873747,0xff5b73].map(color=>new THREE.MeshStandardMaterial({color,roughness:.62,metalness:.05}));
        const mesh=new THREE.Mesh(geometry,materials);finish(mesh,'box');return;
      }
      if(gizmoStyle==='sphere'){
        const mesh=new THREE.Mesh(new THREE.SphereGeometry(.72,40,28),new THREE.MeshStandardMaterial({vertexColors:true}));finish(mesh,'sphere');return;
      }
      const geometry=new THREE.PlaneGeometry(1.25,1.25,48,48);geometry.rotateX(-Math.PI/2);
      const pos=geometry.getAttribute('position');
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);const peak1=Math.exp(-((x+.22)**2+(z-.08)**2)*18)*.72;const peak2=Math.exp(-((x-.3)**2+(z+.2)**2)*25)*.48;pos.setY(i,peak1+peak2+.06*Math.sin(x*12)*Math.cos(z*9));}
      geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide}));applyMountainVertexColors(mesh);finish(mesh,'mountain');
    };
    if(gizmoStyle!=='mountain'){createBuiltin();return()=>{disposed=true;};}
    if(mountainGlbData){
      new GLTFLoader().parse(mountainGlbData.slice(0),'',gltf=>{if(disposed)return;const root=gltf.scene;applyMountainVertexColors(root);finish(root,'mountain');},()=>{if(!disposed)createBuiltin();});
    }else createBuiltin();
    return()=>{disposed=true;};
  }, [gizmoStyle,mountainGlbData,mountainInfluence]);

  useEffect(() => {
    const model = modelObjectRef.current;
    const renderer = modelRendererRef.current;
    const scene = modelSceneRef.current;
    const camera = modelCameraRef.current;
    if (!model || !renderer || !scene || !camera) return;
    model.rotation.set(rotation.x, rotation.y, 0, 'YXZ');
    const helpers = (model.userData.axisArrowHelpers || []) as THREE.ArrowHelper[];
    helpers.forEach(helper => {
      const direction = (helper.userData.axisDirection as THREE.Vector3).clone().applyEuler(model.rotation);
      const front = direction.z >= 0;
      const opacity = front ? (helper.userData.baseOpacity as number) : (helper.userData.baseOpacity as number) * 0.35;
      helper.traverse(child => {
        const object = child as THREE.Mesh | THREE.Line;
        const material = (object as any).material as THREE.Material | THREE.Material[] | undefined;
        if (!material) return;
        (Array.isArray(material) ? material : [material]).forEach(m => {
          const mat = m as THREE.Material & { opacity?: number; transparent?: boolean };
          mat.transparent = true; mat.opacity = opacity;
        });
      });
    });
    renderer.render(scene, camera);
  }, [rotation.x, rotation.y, gizmoModelReady]);

  // Zoom feedback animation: expands slightly and springs back to original size
  useEffect(() => {
    if (zoomPulseTrigger > 0) {
      setZoomScale(1.18);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        setZoomScale(1.0);
      }, 220);
    }
  }, [zoomPulseTrigger]);

  // Touch Pan Button handler
  const handlePanPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsPanning(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanPointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !onPanDelta) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    onPanDelta(dx, dy);
  };

  const handlePanPointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Touch Zoom Button handler
  const handleZoomPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsZooming(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleZoomPointerMove = (e: React.PointerEvent) => {
    if (!isZooming || !onZoomDelta) return;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    onZoomDelta(-dy * 0.08);
  };

  const handleZoomPointerUp = (e: React.PointerEvent) => {
    setIsZooming(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col items-center select-none pointer-events-auto">
      {/* Gizmo Header Badge */}
      {gizmoStyle==='mountain'&&<div className="mb-1 flex flex-col gap-1 w-36 rounded border border-[#555] bg-[#252525]/95 p-1.5 text-[9px] text-[#ccc]">
        <div className="flex items-center justify-between"><span>Axis colour influence</span><strong>{mountainInfluence}%</strong></div>
        <input aria-label="Mountain axis colour influence" type="range" min="0" max="100" value={mountainInfluence} onChange={e=>setMountainInfluence(Number(e.target.value))} className="w-full accent-blue-500"/>
        <button type="button" onClick={()=>mountainInputRef.current?.click()} className="rounded border border-[#666] px-2 py-1 hover:bg-[#3a3a3a]">{mountainGlbData?'Replace Mountain GLB':'Use Your Mountain GLB'}</button>
        <input ref={mountainInputRef} type="file" accept=".glb,model/gltf-binary" className="hidden" onChange={handleMountainUpload}/>
        <span className="text-[8px] text-[#888]">Stored in this browser on this device</span>
      </div>}
      <div className="text-[9px] text-[#9a9a9a] font-mono tracking-wider mb-2 flex items-center gap-1.5 bg-[#252525]/90 px-2 py-0.5 rounded border border-[#444] shadow-md backdrop-blur-xs">
        {gizmoStyle === 'box' && (
          <>
            <Box className="w-3 h-3 text-[#3d7fb8]" />
            <span className="text-[#3d7fb8] font-bold">BOX GIZMO</span>
          </>
        )}
        {gizmoStyle === 'sphere' && (
          <>
            <CircleDot className="w-3 h-3 text-[#a6e3a1]" />
            <span className="text-[#a6e3a1] font-bold">3D SPHERE</span>
          </>
        )}
        {gizmoStyle === 'mountain' && (
          <>
            <MountainIcon className="w-3 h-3 text-[#fab387]" />
            <span className="text-[#fab387] font-bold">MOUNTAIN</span>
          </>
        )}
        <span className="text-[#888]">·</span>
        <span className="text-[#a6e3a1]">WebGL</span>
      </div>

      {/* 3D Interactive Viewport Gizmo Container with Dynamic Zoom Pulse Scale */}
      <div
        className="w-[88px] h-[88px] relative cursor-pointer mb-2 transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoomScale})` }}
      >
        <canvas ref={modelCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-label={`3D ${gizmoStyle} orientation model`} />
        {gizmoModelReady && (
          <div className="absolute inset-0 pointer-events-none text-[8px] font-bold font-mono">
            {axisIndicators.map(axis => (
              <button
                key={axis.label}
                type="button"
                onClick={() => onSnapView(axis.view)}
                title={`Snap to ${axis.label} direction`}
                className="absolute pointer-events-auto rounded bg-[#171717]/85 border border-[#555]/70 px-1 py-0.5 shadow whitespace-nowrap" style={{fontSize: `${gizmoLabelPrefs.fontSize}px`}}
                style={{ left: `calc(50% + ${axis.point.x * gizmoLabelPrefs.margin}px)`, top: `calc(50% - ${axis.point.y * gizmoLabelPrefs.margin}px)`, transform: 'translate(-50%, -50%)', color: axis.color, opacity: axis.positive ? (axis.point.z > 0 ? 1 : 0.72) : (axis.point.z > 0 ? 0.72 : 0.35), borderColor: axis.color, backgroundColor: axis.positive ? 'rgba(20,20,20,.9)' : 'rgba(20,20,20,.45)' }}
              >
                {arrowFor(axis.point.x, axis.point.y)} {axis.label.replace(/[+-]/, '')}
              </button>
            ))}
          </div>
        )}
        <div className={gizmoModelReady ? 'hidden' : 'contents'}>
        {/* Style 1: 3D Isometric Orientation Box Cube */}
        {gizmoStyle === 'box' && (
          <div
            className="w-full h-full relative transform-style-3d transition-transform duration-75"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${degX}deg) rotateY(${degY}deg)`,
            }}
          >
            {/* Front Face (+Z) */}
            <button
              onClick={() => onSnapView('front')}
              title="Snap to Front View (Numpad 1)"
              className="absolute inset-0 w-full h-full bg-[#303c4f] border border-[#52637a] flex flex-col items-center justify-center text-[10px] font-bold text-[#89b4fa] hover:bg-[#3f4f69] active:bg-[#52688c] transition-colors shadow-inner"
              style={{ transform: 'translateZ(36px)' }}
            >
              <span>FRONT</span>
              <span className="text-[8px] opacity-70 font-mono">+Z</span>
            </button>

            {/* Back Face (-Z) */}
            <button
              onClick={() => onSnapView('back')}
              title="Snap to Back View (Ctrl+Numpad 1)"
              className="absolute inset-0 w-full h-full bg-[#242b38] border border-[#3b4759] flex flex-col items-center justify-center text-[10px] font-bold text-[#89b4fa] hover:bg-[#343e52] active:bg-[#475570] transition-colors shadow-inner"
              style={{ transform: 'rotateY(180deg) translateZ(36px)' }}
            >
              <span>BACK</span>
              <span className="text-[8px] opacity-70 font-mono">-Z</span>
            </button>

            {/* Right Face (+X) */}
            <button
              onClick={() => onSnapView('right')}
              title="Snap to Right View (Numpad 3)"
              className="absolute inset-0 w-full h-full bg-[#4f3030] border border-[#7a5252] flex flex-col items-center justify-center text-[10px] font-bold text-[#f38ba8] hover:bg-[#693f3f] active:bg-[#8c5252] transition-colors shadow-inner"
              style={{ transform: 'rotateY(90deg) translateZ(36px)' }}
            >
              <span>RIGHT</span>
              <span className="text-[8px] opacity-70 font-mono">+X</span>
            </button>

            {/* Left Face (-X) */}
            <button
              onClick={() => onSnapView('left')}
              title="Snap to Left View (Ctrl+Numpad 3)"
              className="absolute inset-0 w-full h-full bg-[#382424] border border-[#593b3b] flex flex-col items-center justify-center text-[10px] font-bold text-[#f38ba8] hover:bg-[#523434] active:bg-[#704747] transition-colors shadow-inner"
              style={{ transform: 'rotateY(-90deg) translateZ(36px)' }}
            >
              <span>LEFT</span>
              <span className="text-[8px] opacity-70 font-mono">-X</span>
            </button>

            {/* Top Face (+Y) */}
            <button
              onClick={() => onSnapView('top')}
              title="Snap to Top View (Numpad 7)"
              className="absolute inset-0 w-full h-full bg-[#304f36] border border-[#527a58] flex flex-col items-center justify-center text-[10px] font-bold text-[#a6e3a1] hover:bg-[#3f6946] active:bg-[#528c5c] transition-colors shadow-inner"
              style={{ transform: 'rotateX(90deg) translateZ(36px)' }}
            >
              <span>TOP</span>
              <span className="text-[8px] opacity-70 font-mono">+Y</span>
            </button>

            {/* Bottom Face (-Y) */}
            <button
              onClick={() => onSnapView('bottom')}
              title="Snap to Bottom View (Ctrl+Numpad 7)"
              className="absolute inset-0 w-full h-full bg-[#243828] border border-[#3b5940] flex flex-col items-center justify-center text-[10px] font-bold text-[#a6e3a1] hover:bg-[#34523a] active:bg-[#47704e] transition-colors shadow-inner"
              style={{ transform: 'rotateX(-90deg) translateZ(36px)' }}
            >
              <span>BOTTOM</span>
              <span className="text-[8px] opacity-70 font-mono">-Y</span>
            </button>
          </div>
        )}

        {/* Style 2: one spherical body with six labels on its surface */}
        {gizmoStyle === 'sphere' && (
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{ transform: `rotateX(${degX}deg) rotateY(${degY}deg)` }}
          >
            <div
              className="relative w-16 h-16 rounded-full border border-[#718096] shadow-lg overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 32% 28%, #9fb4c9 0%, #52677f 28%, #26364c 68%, #101827 100%)',
                boxShadow: 'inset -8px -8px 14px rgba(0,0,0,.55), inset 4px 4px 10px rgba(255,255,255,.22), 0 4px 12px rgba(0,0,0,.45)',
              }}
            >
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 48%, rgba(180,210,235,.22) 49%, rgba(180,210,235,.22) 51%, transparent 52%), linear-gradient(0deg, transparent 48%, rgba(180,210,235,.18) 49%, rgba(180,210,235,.18) 51%, transparent 52%)' }} />
              <button onClick={() => onSnapView('top')} title="Snap to Top View" className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#a6e3a1] drop-shadow">TOP</button>
              <button onClick={() => onSnapView('bottom')} title="Snap to Bottom View" className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#a6e3a1] drop-shadow">BOTTOM</button>
              <button onClick={() => onSnapView('front')} title="Snap to Front View" className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#89b4fa] drop-shadow">FRONT</button>
              <button onClick={() => onSnapView('back')} title="Snap to Back View" className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#89b4fa] drop-shadow">BACK</button>
              <button onClick={() => onSnapView('left')} title="Snap to Left View" className="absolute left-1/2 top-[30%] -translate-x-1/2 text-[8px] font-bold text-[#f38ba8] drop-shadow">LEFT</button>
              <button onClick={() => onSnapView('right')} title="Snap to Right View" className="absolute left-1/2 bottom-[30%] -translate-x-1/2 text-[8px] font-bold text-[#f38ba8] drop-shadow">RIGHT</button>
            </div>
          </div>
        )}

        {/* Style 3: one mountain silhouette with six labels on the same shape */}
        {gizmoStyle === 'mountain' && (
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{ transform: `rotateX(${degX}deg) rotateY(${degY}deg)` }}
          >
            <div
              className="relative w-[68px] h-[64px] border border-[#8b9b9a] shadow-lg"
              style={{
                clipPath: 'polygon(50% 0%, 59% 19%, 69% 34%, 78% 52%, 100% 100%, 0% 100%, 22% 52%, 36% 31%)',
                background: 'linear-gradient(155deg, #f1f5f9 0%, #cbd5e1 19%, #8b7355 37%, #355b49 68%, #18392d 100%)',
                filter: 'drop-shadow(0 4px 5px rgba(0,0,0,.45))',
              }}
            >
              <button onClick={() => onSnapView('top')} title="Snap to Top View" className="absolute top-[8%] left-1/2 -translate-x-1/2 text-[8px] font-black text-[#a6e3a1] drop-shadow">TOP</button>
              <button onClick={() => onSnapView('front')} title="Snap to Front View" className="absolute top-[42%] left-[15%] text-[8px] font-bold text-[#89b4fa] drop-shadow">FRONT</button>
              <button onClick={() => onSnapView('back')} title="Snap to Back View" className="absolute top-[42%] right-[15%] text-[8px] font-bold text-[#89b4fa] drop-shadow">BACK</button>
              <button onClick={() => onSnapView('left')} title="Snap to Left View" className="absolute bottom-[18%] left-[7%] text-[8px] font-bold text-[#f38ba8] drop-shadow">LEFT</button>
              <button onClick={() => onSnapView('right')} title="Snap to Right View" className="absolute bottom-[18%] right-[7%] text-[8px] font-bold text-[#f38ba8] drop-shadow">RIGHT</button>
              <button onClick={() => onSnapView('bottom')} title="Snap to Bottom View" className="absolute bottom-[2%] left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#a6e3a1] drop-shadow">BOTTOM</button>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Axis Selector & Flip View Row */}
      <div className="flex items-center gap-1 mb-1.5 bg-[#252525]/90 px-1.5 py-0.5 rounded border border-[#444] shadow-md backdrop-blur-xs">
        <span className="text-[9px] text-[#777] font-mono mr-0.5">AXIS:</span>
        <button
          onClick={() => onSnapView('right')}
          className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#f38ba8] hover:bg-[#4f3030] rounded transition-colors"
          title="Snap to +X Axis (Right)"
        >
          X
        </button>
        <button
          onClick={() => onSnapView('top')}
          className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#a6e3a1] hover:bg-[#304f36] rounded transition-colors"
          title="Snap to +Y/Top Axis"
        >
          Y
        </button>
        <button
          onClick={() => onSnapView('front')}
          className="px-1 py-0.5 text-[9px] font-mono font-bold text-[#89b4fa] hover:bg-[#303c4f] rounded transition-colors"
          title="Snap to Front Axis (+Z)"
        >
          Z
        </button>

        {/* Flip view button to opposite direction */}
        {onFlipView && (
          <button
            onClick={onFlipView}
            className="ml-1 px-1.5 py-0.5 bg-[#3a3a3a] hover:bg-[#505050] text-[#ff7b72] active:bg-[#ff7b72] active:text-black rounded border border-[#555] text-[10px] font-bold flex items-center gap-0.5 transition-colors shadow-xs"
            title="Flip view to opposite direction (-)"
          >
            <Minus className="w-3 h-3 stroke-[3]" />
            <span className="text-[9px] font-mono">FLIP</span>
          </button>
        )}
      </div>

      {/* Quick Action Touch Buttons below Gizmo */}
      <div className="flex items-center gap-1 bg-[#252525]/90 p-1 rounded border border-[#444] shadow-md backdrop-blur-xs">
        {/* Auto-Fit / Frame Model in Viewport Button */}
        {onAutoFit && (
          <button
            onClick={onAutoFit}
            className="p-1.5 rounded transition-colors bg-[#353535] hover:bg-[#454545] text-[#38bdf8] border border-[#555]"
            title="Auto-Fit / Frame Model in Viewport (Center & Fit)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Touch Pan Button */}
        <button
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          className={`p-1.5 rounded transition-colors ${
            isPanning
              ? 'bg-[#3d7fb8] text-white'
              : 'hover:bg-[#3a3a3a] text-[#ccc]'
          }`}
          title="Drag to Pan Camera"
        >
          <Move className="w-3.5 h-3.5" />
        </button>

        {/* Touch Zoom Button */}
        <button
          onPointerDown={handleZoomPointerDown}
          onPointerMove={handleZoomPointerMove}
          onPointerUp={handleZoomPointerUp}
          className={`p-1.5 rounded transition-colors ${
            isZooming
              ? 'bg-[#3d7fb8] text-white'
              : 'hover:bg-[#3a3a3a] text-[#ccc]'
          }`}
          title="Drag to Zoom Camera"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Orthographic / Perspective */}
        {onToggleOrtho && (
          <button
            onClick={onToggleOrtho}
            className={`px-1 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
              isOrtho
                ? 'bg-[#a6e3a1] text-black'
                : 'hover:bg-[#3a3a3a] text-[#ccc]'
            }`}
            title="Toggle Perspective / Orthographic View (Numpad 5)"
          >
            {isOrtho ? 'ORTH' : 'PERSP'}
          </button>
        )}

        {/* Reset Camera View */}
        {onResetCamera && (
          <button
            onClick={onResetCamera}
            className="p-1.5 hover:bg-[#3a3a3a] text-[#ccc] rounded transition-colors"
            title="Reset Camera View (Numpad 0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Touch Navigation Mode Toggle */}
        {onToggleTouchNav && (
          <button
            onClick={onToggleTouchNav}
            className={`p-1.5 rounded transition-colors ${
              touchNavEnabled
                ? 'bg-[#3d7fb8] text-white'
                : 'hover:bg-[#3a3a3a] text-[#888]'
            }`}
            title="Toggle Android / Tablet Touch Navigation"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Navigation Flip / Invert Axis Quick Button */}
        {onToggleInvertNav && (
          <button
            onClick={onToggleInvertNav}
            className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold transition-colors flex items-center gap-1 shadow-xs ${
              invertNav
                ? 'bg-[#fab387] text-black font-extrabold'
                : 'bg-[#2f2f2f] hover:bg-[#3d3d3d] text-[#ddd] border border-[#555]'
            }`}
            title={`Toggle Orbit & Drone Mouse Navigation Direction (Currently: ${invertNav ? 'Inverted' : 'Standard Natural'})`}
          >
            <span className="text-[11px] leading-none">⇄</span>
            <span>{invertNav ? 'INV' : 'NAT'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
