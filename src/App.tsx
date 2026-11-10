/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * VUE 3D Canvas - Main Application Entry
 * Author / Creator: Victory Ukpong
 * 
 * High-performance, lightweight, non-raytraced 3D texturing and painting application
 * targeting DirectX 11 / OpenGL 2.0 WebGL limits, .xblend project format with 3-state ring buffer.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ToolType, 
  BrushPreset, 
  Layer, 
  BlendMode, 
  ViewportShadingMode, 
  SelectionMask, 
  GraphNode, 
  NodeConnection, 
  MeshModelAsset,
  BloomSettings,
  SurfaceShadingMode,
  PatternStampConfig,
  EdgeWearConfig,
  LayerPBRSettings,
  ThemeMode,
  PreferencesState,
  TextureFillConfig,
  GizmoStyle,
} from './core/types';
import { DEFAULT_BRUSH_PRESETS } from './tools/brushPresets';
import { UndoRingBuffer } from './core/history';
import { WasmMemoryEngine } from './core/wasmMemoryEngine';
import { XBlendManager } from './core/xblendFormat';
import { FillSuite, TriplanarConfig } from './tools/fillSuite';
import * as THREE from 'three';
import { BUILTIN_MODELS, parseOBJ, repairArchitecturalMesh, reimportUVsFromOBJ } from './renderer/modelGeometry';
import { UVChannelManager } from './tools/uvChannelManager';
import { INITIAL_NODES, INITIAL_CONNECTIONS } from './nodes/defaultNodes';

import { PhotoshopMenuBar } from './ui/PhotoshopMenuBar';
import { ToolOptionsBar } from './ui/ToolOptionsBar';
import { TabletBrushCarousel } from './ui/TabletBrushCarousel';
import { ToolBox } from './ui/ToolBox';
import { DockablePanelFrame } from './ui/DockablePanelFrame';
import { LayersPanel } from './ui/panels/LayersPanel';
import { ColorWheelPanel } from './ui/panels/ColorWheelPanel';
import { BrushLibraryPanel } from './ui/panels/BrushLibraryPanel';
import { NavigatorPanel } from './ui/panels/NavigatorPanel';
import { NodeGraphPanel } from './ui/panels/NodeGraphPanel';
import { UndoHistoryPanel } from './ui/panels/UndoHistoryPanel';
import { CircularCarousel } from './ui/CircularCarousel';
import { NumpadOverlay } from './ui/NumpadOverlay';
import { TriplanarDialog } from './ui/TriplanarDialog';
import { GaussianBlurDialog } from './ui/GaussianBlurDialog';
import { StochasticScatterDialog } from './ui/StochasticScatterDialog';
import { StitchStudioDialog } from './ui/StitchStudioDialog';
import { LayerSettingsModal } from './ui/LayerSettingsModal';
import { PatternStampDialog } from './ui/PatternStampDialog';
import { EdgeWearDialog } from './ui/EdgeWearDialog';
import { ExportModelDialog } from './ui/ExportModelDialog';
import { PreferencesModal } from './ui/PreferencesModal';
import { TextureAutoNodeModal } from './ui/TextureAutoNodeModal';
import { PatternStampEngine } from './tools/patternStampTool';
import { EdgeWearEngine } from './tools/edgeWearFilter';
import { BlenderMaterialImporter } from './nodes/blenderMaterialImporter';
import { LayerConversions } from './tools/layerConversions';
import { GaussianBlurOptions } from './tools/gaussianBlur';
import { StochasticScatterConfig } from './tools/stochasticScatter';
import { StitchConfig } from './tools/stitchStudio';
import { ProjectionModal } from './ui/ProjectionModal';
import { AboutModal } from './ui/AboutModal';
import { ProjectSettingsModal, MatchedTextureMap } from './ui/ProjectSettingsModal';
import { ExportTextureDialog } from './ui/ExportTextureDialog';
import { DockerGroup, DockerTabItem } from './ui/DockerGroup';
import { SymmetryPanel } from './ui/panels/SymmetryPanel';
import { MaskPanel } from './ui/panels/MaskPanel';
import { UndoSettingsDialog } from './ui/UndoSettingsDialog';
import { SymmetryConfig, SymmetryEngine } from './tools/symmetryEngine';
import { GpuDiagnosticsModal } from './ui/GpuDiagnosticsModal';
import { LagoonMenu } from './ui/LagoonMenu';

import { Viewport3D } from './renderer/Viewport3D';
import { Viewport2D } from './renderer/Viewport2D';
import { 
  Layers as LayersIcon, 
  Palette, 
  Paintbrush, 
  Compass, 
  Share2, 
  History, 
  Hash, 
  HardDrive,
  SplitSquareVertical,
  Square as SquareIcon,
  Eraser,
  Sparkles,
  Stamp,
  Fingerprint,
  PenTool,
  PaintBucket,
  Pipette,
  Hand,
  ZoomIn,
  Sliders,
  Settings,
  Tablet
} from 'lucide-react';

export default function App() {
  // Initialize layers with base offscreen canvases
  const [layers, setLayers] = useState<Layer[]>(() => {
    const memory = WasmMemoryEngine.getInstance();
    const createLayer = (id: string, name: string, channel: any = 'color'): Layer => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 1024;
      const ctx = cvs.getContext('2d')!;
      memory.registerBuffer(1024 * 1024 * 4);
      return {
        id,
        name,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        locked: false,
        canvas: cvs,
        ctx,
        channel,
      };
    };

    const baseLayer = createLayer('layer_base', 'Base Color Layer');
    // Pre-fill base coat with neutral studio primer
    baseLayer.ctx.fillStyle = '#9c9c9c';
    baseLayer.ctx.fillRect(0, 0, 1024, 1024);

    const decalLayer = createLayer('layer_details', 'Paint & Details Layer');

    return [baseLayer, decalLayer];
  });

  const [activeLayerId, setActiveLayerId] = useState<string>('layer_details');
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushes, setBrushes] = useState<BrushPreset[]>(DEFAULT_BRUSH_PRESETS);
  const [activeBrush, setActiveBrush] = useState<BrushPreset>(DEFAULT_BRUSH_PRESETS[0]);
  const [primaryColor, setPrimaryColor] = useState<string>('#e6e6e6');
  const [secondaryColor, setSecondaryColor] = useState<string>('#1a1a1a');

  // Application Preferences & Workspace Settings
  const [preferences, setPreferences] = useState<PreferencesState>(() => {
    const defaults: PreferencesState = {
      constantRefresh: false,
      refreshRateMode: 'on_demand',
      customRefreshRate: 60,
      gizmoStyle: 'box',
      tabletMode: false,
      navSensitivity: 1.0,
      optionsBarLayout: 'clusters',
      tabletSubOperator: 'radial',
      architecturalRepair: false,
    };
    try {
      const saved = localStorage.getItem('vue3d_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fileNormalsOnImport !== true) {
          parsed.architecturalRepair = false;
          parsed.fileNormalsOnImport = true;
          localStorage.setItem('vue3d_preferences', JSON.stringify({ ...defaults, ...parsed }));
        }
        return { ...defaults, ...parsed };
      }
    } catch {}
    return defaults;
  });

  const handleUpdatePreferences = useCallback((patch: Partial<PreferencesState>) => {
    setPreferences(prev => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('vue3d_preferences', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // 3D Viewport State
  const [modelKey, setModelKey] = useState<string>('suzanne');
  const [customOBJText, setCustomOBJText] = useState<string | undefined>(undefined);
  const [activeGeometry, setActiveGeometry] = useState<THREE.BufferGeometry>(() => {
    const geom = BUILTIN_MODELS.suzanne().geometry;
    UVChannelManager.ensureBaseChannels(geom);
    return geom;
  });
  const [activeUVChannel, setActiveUVChannel] = useState<string>('uv_original');
  const [isXRayBrushActive, setIsXRayBrushActive] = useState<boolean>(false);
  const [xrayVertexSelection, setXrayVertexSelection] = useState<Set<number>>(new Set());

  // Keep activeGeometry synchronized when model or OBJ changes
  useEffect(() => {
    let geom: THREE.BufferGeometry;
    if (customOBJText) {
      geom = parseOBJ(customOBJText);
    } else if (BUILTIN_MODELS[modelKey]) {
      geom = BUILTIN_MODELS[modelKey]().geometry;
    } else {
      geom = BUILTIN_MODELS.suzanne().geometry;
    }
    if (customOBJText && preferences.architecturalRepair === true) {
      repairArchitecturalMesh(geom);
    }
    UVChannelManager.ensureBaseChannels(geom);
    setActiveGeometry(geom);
    setActiveUVChannel('uv_original');
    setXrayVertexSelection(new Set());
  }, [modelKey, customOBJText, preferences.architecturalRepair]);

  const [shadingMode, setShadingMode] = useState<ViewportShadingMode>('material');
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');
  const [isOrtho, setIsOrtho] = useState<boolean>(false);
  const [zoomFactor, setZoomFactor] = useState<number>(1.0);
  const [selectionMask, setSelectionMask] = useState<SelectionMask | null>(null);

  // Live undo is a normal stack (default 30). Only the .xblend file stores 3 states.
  const [undoBuffer] = useState<UndoRingBuffer>(() => new UndoRingBuffer());

  // Procedural Node Graph
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<NodeConnection[]>(INITIAL_CONNECTIONS);
  const [materialProps, setMaterialProps] = useState({
    metallic: 0.15,
    roughness: 0.35,
    normalStrength: 1.0,
    clearcoat: 0.1,
    ior: 1.45,
  });

  // Project Settings & File Management (.xblend)
  const [projectName, setProjectName] = useState<string>('VUE3D_Model_Project');
  const [embed3DAssets, setEmbed3DAssets] = useState<boolean>(false); // Linked by default

  // Screenshot Projection & Strict Navigation Lock
  const [isNavLocked, setIsNavLocked] = useState<boolean>(false);
  const [projectionScreenshotUrl, setProjectionScreenshotUrl] = useState<string | null>(null);
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState<boolean>(false);

  // Android / Tablet Touch Input Navigation Toggle
  const [touchNavEnabled, setTouchNavEnabled] = useState<boolean>(false);

  // Square Gizmo & Viewport Layout (Perspective vs Quad View)
  const [showGizmo, setShowGizmo] = useState<boolean>(true);
  const [viewLayout, setViewLayout] = useState<'perspective' | 'quad'>('perspective');

  // Live Canonical Composite Canvas for 3D Viewport & Navigator Clone
  const [compositeCanvas] = useState<HTMLCanvasElement>(() => {
    const cvs = document.createElement('canvas');
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d')!;
    ctx.fillStyle = '#9c9c9c';
    ctx.fillRect(0, 0, 1024, 1024);
    return cvs;
  });

  // CorelDraw-style Texture & Alpha Mask Export Dialog State
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [exportDialogLayerId, setExportDialogLayerId] = useState<string>('layer_details');
  const [exportDialogMode, setExportDialogMode] = useState<'merged' | 'alpha_mask'>('merged');

  // Docker Tabs grouping state
  const [useDockerTabs, setUseDockerTabs] = useState<boolean>(true);
  const [dockerGroup1Tab, setDockerGroup1Tab] = useState<string>('layers');
  const [dockerGroup2Tab, setDockerGroup2Tab] = useState<string>('navigator');

  const handleOpenExportDialog = (layerId: string, mode: 'merged' | 'alpha_mask') => {
    setExportDialogLayerId(layerId);
    setExportDialogMode(mode);
    setExportDialogOpen(true);
  };

  // UI Dialogs
  const [isCarouselOpen, setIsCarouselOpen] = useState<boolean>(false);
  const [isTriplanarOpen, setIsTriplanarOpen] = useState<boolean>(false);
  const [isGaussianBlurOpen, setIsGaussianBlurOpen] = useState<boolean>(false);
  const [isStochasticScatterOpen, setIsStochasticScatterOpen] = useState<boolean>(false);
  const [isStitchStudioOpen, setIsStitchStudioOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState<boolean>(false);
  const [isUndoSettingsOpen, setIsUndoSettingsOpen] = useState<boolean>(false);
  const [surfaceMode, setSurfaceMode] = useState<SurfaceShadingMode>('default');

  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [isLagoonActive, setIsLagoonActive] = useState<boolean>(false);

  // Tablet Mode Workspace Drawer & Carousel States
  const [tabletDrawerOpen, setTabletDrawerOpen] = useState<boolean>(false);
  const [isTabletToolsOpen, setIsTabletToolsOpen] = useState<boolean>(false);
  const [isTabletOptionsOpen, setIsTabletOptionsOpen] = useState<boolean>(false);

  // Texture Import & Auto-Node Setup Dialog State
  const [isTextureAutoNodeOpen, setIsTextureAutoNodeOpen] = useState<boolean>(false);
  const [stagedTextureUrl, setStagedTextureUrl] = useState<string>('');
  const [stagedTextureName, setStagedTextureName] = useState<string>('');
  const textureFileInputRef = useRef<HTMLInputElement | null>(null);

  // Graphics Hardware Backend Selection (DirectX 11 Priority Default)
  const [gpuBackend, setGpuBackend] = useState<'dx11' | 'opengl' | 'modern'>(() => {
    try {
      const fromWindow = (window as Window & { __VUE_GPU_BACKEND__?: string }).__VUE_GPU_BACKEND__;
      if (fromWindow === 'dx11' || fromWindow === 'opengl' || fromWindow === 'modern') {
        return fromWindow;
      }
      return (localStorage.getItem('vue3d_gpu_backend') as 'dx11' | 'opengl' | 'modern' | null) || 'dx11';
    } catch (_) {
      return 'dx11';
    }
  });
  const [isGpuDiagnosticsOpen, setIsGpuDiagnosticsOpen] = useState<boolean>(false);

  const handleSetGpuBackend = (backend: 'dx11' | 'opengl' | 'modern') => {
    setGpuBackend(backend);
    try {
      localStorage.setItem('vue3d_gpu_backend', backend);
    } catch (_) {}
    const desktop = window as Window & { ipc?: { postMessage: (message: string) => void } };
    desktop.ipc?.postMessage(`gpu:${backend}`);
  };

  // Layer Material & PBR Settings Modal
  const [isLayerSettingsOpen, setIsLayerSettingsOpen] = useState<boolean>(false);
  const [layerSettingsTargetId, setLayerSettingsTargetId] = useState<string | null>(null);

  // Pattern Stamp Tool Config & Dialog
  const [isPatternStampDialogOpen, setIsPatternStampDialogOpen] = useState<boolean>(false);
  const [patternStampConfig, setPatternStampConfig] = useState<PatternStampConfig>({
    stampId: 'hazard_stripes',
    stampName: 'Hazard Caution',
    stampDataUrl: '',
    size: 80,
    rotation: 0,
    opacity: 100,
    sharpness: 0.9,
    missingEdgeAmount: 0.15,
    edgeJitter: 0.1,
    enableGrungeOverlay: false,
    grungePreset: 'scratched',
    grungeBlendMode: 'multiply',
    grungeOpacity: 60,
    grungeScale: 1.5,
  });

  // Edge Wear & AO Curvature Filter Dialog
  const [isEdgeWearDialogOpen, setIsEdgeWearDialogOpen] = useState<boolean>(false);

  // Theme & Mesh Component Visibility State
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('cs5');
  const [meshComponentVisibility, setMeshComponentVisibility] = useState<string>('all');
  const [isolateSelectedGroupOnly, setIsolateSelectedGroupOnly] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.className = `theme-${currentTheme}`;
    document.body.setAttribute('data-theme', currentTheme);
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  // Model & Multi-Channel Exporter Dialog
  const [isExportModelDialogOpen, setIsExportModelDialogOpen] = useState<boolean>(false);
  const importBlenderFileInputRef = useRef<HTMLInputElement>(null);

  // Symmetry Tool Configuration
  const [symmetryConfig, setSymmetryConfig] = useState<SymmetryConfig>({
    axis: 'X',
    direction: '+ to -',
    originMode: 'mesh_origin',
    locatorValue: 0,
    activeRealtimeMirror: false,
    showVirtualCursorPlane: false,
    axes: {
      X: true,
      Y: false,
      Z: false,
    },
  });

  // Floating & Docked Panels Visibility
  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({
    layers: true,
    brushes: true,
    colorWheel: true,
    navigator: true,
    symmetry: true,
    masking: false,
    nodeGraph: false,
    history: true,
  });

  const [panelFloating, setPanelFloating] = useState<Record<string, boolean>>({
    layers: false,
    brushes: false,
    colorWheel: false,
    navigator: false,
    symmetry: false,
    masking: false,
    nodeGraph: true,
    history: false,
  });

  // 3D Viewport UnrealBloomPass Post-Processing Settings
  const [bloomSettings, setBloomSettings] = useState<BloomSettings>({
    enabled: true,
    strength: 1.4,
    radius: 0.45,
    threshold: 0.15,
  });

  const [textureVersion, setTextureVersion] = useState(0);

  // Synchronously composites all visible layers into canonical compositeCanvas
  const syncCompositeCanvas = useCallback(() => {
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(0, 0, 1024, 1024);

    layers.forEach(layer => {
      if (!layer.visible || layer.isGroup) return;
      if (layer.groupId) {
        const parent = layers.find(l => l.id === layer.groupId);
        if (parent && !parent.visible) return;
      }
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      let gco: GlobalCompositeOperation = 'source-over';
      switch (layer.blendMode) {
        case 'multiply': gco = 'multiply'; break;
        case 'screen': gco = 'screen'; break;
        case 'overlay': gco = 'overlay'; break;
        case 'darken': gco = 'darken'; break;
        case 'lighten': gco = 'lighten'; break;
        case 'hard_light': gco = 'hard-light'; break;
        case 'soft_light': gco = 'soft-light'; break;
        case 'difference': gco = 'difference'; break;
        default: gco = 'source-over'; break;
      }
      ctx.globalCompositeOperation = gco;
      ctx.drawImage(layer.canvas, 0, 0, 1024, 1024);
      ctx.restore();
    });
  }, [layers, compositeCanvas]);

  const notifyTextureUpdated = useCallback(() => {
    syncCompositeCanvas();
    setTextureVersion(v => v + 1);
  }, [syncCompositeCanvas]);

  const handleRebakeTexture = useCallback((fromChannel: string, toChannel: string, resolution: number) => {
    if (!activeGeometry) return;
    const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];
    const bakedCanvas = UVChannelManager.rebakeTexture(activeGeometry, activeLayer.canvas, fromChannel, toChannel, resolution);
    activeLayer.canvas.width = resolution;
    activeLayer.canvas.height = resolution;
    activeLayer.ctx.clearRect(0, 0, resolution, resolution);
    activeLayer.ctx.drawImage(bakedCanvas, 0, 0);

    UVChannelManager.setActiveChannel(activeGeometry, toChannel);
    setActiveUVChannel(toChannel);

    undoBuffer.pushState(`Re-Bake Texture [${fromChannel} -> ${toChannel}]`, layers);
    syncCompositeCanvas();
    setTextureVersion(v => v + 1);
  }, [activeGeometry, layers, activeLayerId, undoBuffer, syncCompositeCanvas]);

  const handleSymmetrize = useCallback((allLayers = false) => {
    if (allLayers) {
      layers.forEach(l => {
        if (l.visible && !l.locked) {
          SymmetryEngine.symmetrizeLayer(l, symmetryConfig);
        }
      });
      undoBuffer.pushState(`Symmetrize All Layers (${symmetryConfig.axis}: ${symmetryConfig.direction})`, layers);
    } else {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (activeLayer && !activeLayer.locked) {
        SymmetryEngine.symmetrizeLayer(activeLayer, symmetryConfig);
        undoBuffer.pushState(`Symmetrize ${activeLayer.name} (${symmetryConfig.axis}: ${symmetryConfig.direction})`, layers);
      }
    }
    notifyTextureUpdated();
  }, [layers, activeLayerId, symmetryConfig, undoBuffer, notifyTextureUpdated]);

  const handleOpenHelpPDF = useCallback(() => {
    window.open('/help.pdf', '_blank');
  }, []);

  const handleOpenTutorialPDF = useCallback(() => {
    window.open('/tutorial.pdf', '_blank');
  }, []);

  const handleDownloadHelpDocx = useCallback(() => {
    const a = document.createElement('a');
    a.href = '/help.docx';
    a.download = 'VUE_3D_Canvas_Help_Documentation.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Initial Composite Sync
  useEffect(() => {
    syncCompositeCanvas();
  }, [syncCompositeCanvas]);

  // Record initial state in undo buffer
  useEffect(() => {
    undoBuffer.pushState('Initial Setup', layers);
  }, []);

  // Sync brush color with primaryColor
  useEffect(() => {
    setActiveBrush(b => ({ ...b, color: primaryColor }));
  }, [primaryColor]);

  // Global Keyboard Shortcuts (Numpad, Undo, Tools, Carousel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Undo / Redo (Strictly 1 state per press, preventing key-repeat cascades)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.repeat) return;
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          if (e.repeat) return;
          handleRedo();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleSaveXBlend();
          return;
        }
      }

      // F8: Projection Screenshot
      if (e.key === 'F8') {
        e.preventDefault();
        triggerProjectionScreenshot();
        return;
      }

      // Tab: Toggle Autodesk Sketchbook / Maya Lagoon Mode
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsLagoonActive(lagoon => !lagoon);
        return;
      }

      // V: Circular Carousel
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setIsCarouselOpen(open => !open);
        return;
      }

      // Numpad Controls
      if (e.key === '1') handleNumpadKey('1', e.ctrlKey);
      else if (e.key === '3') handleNumpadKey('3', e.ctrlKey);
      else if (e.key === '7') handleNumpadKey('7', e.ctrlKey);
      else if (e.key === '5') handleNumpadKey('5', false);
      else if (e.key === '0') handleNumpadKey('0', false);
      else if (e.key === '.') handleNumpadKey('.', false);

      // Single-Key Tools
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'b' || e.key === 'B') setActiveTool('brush');
        else if (e.key === 'e' || e.key === 'E') setActiveTool('eraser');
        else if (e.key === 'r' || e.key === 'R') setActiveTool('blur');
        else if (e.key === 's' || e.key === 'S') setActiveTool('clone');
        else if (e.key === 'u' || e.key === 'U') setActiveTool('smudge');
        else if (e.key === 'p' || e.key === 'P') setActiveTool('pen');
        else if (e.key === 'm' || e.key === 'M') setActiveTool('marquee_rect');
        else if (e.key === 'l' || e.key === 'L') setActiveTool('lasso');
        else if (e.key === 'g' || e.key === 'G') setActiveTool('bucket');
        else if (e.key === 'i' || e.key === 'I') setActiveTool('eyedropper');
        else if (e.key === 'h' || e.key === 'H') setActiveTool('hand');
        else if (e.key === 'n' || e.key === 'N') setTabletDrawerOpen(open => !open);
        else if (e.key === 'x' || e.key === 'X') swapColors();
        else if (e.key === 'd' || e.key === 'D') resetColors();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layers, undoBuffer]);

  // Color actions
  const swapColors = () => {
    setPrimaryColor(secondaryColor);
    setSecondaryColor(primaryColor);
  };

  const resetColors = () => {
    setPrimaryColor('#ffffff');
    setSecondaryColor('#000000');
  };

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (undoBuffer.undo(layers)) {
      notifyTextureUpdated();
    }
  };

  const handleRedo = () => {
    if (undoBuffer.redo(layers)) {
      notifyTextureUpdated();
    }
  };

  // Layer Management
  const handleAddLayer = () => {
    const memory = WasmMemoryEngine.getInstance();
    const cvs = document.createElement('canvas');
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d')!;
    memory.registerBuffer(1024 * 1024 * 4);

    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      locked: false,
      canvas: cvs,
      ctx,
      channel: 'color',
    };

    const updated = [...layers, newLayer];
    setLayers(updated);
    setActiveLayerId(newLayer.id);
    undoBuffer.pushState('Add Layer', updated);
    notifyTextureUpdated();
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const updated = layers.filter(l => l.id !== id);
    setLayers(updated);
    if (activeLayerId === id) {
      setActiveLayerId(updated[updated.length - 1].id);
    }
    undoBuffer.pushState('Delete Layer', updated);
    notifyTextureUpdated();
  };

  const handleDuplicateLayer = (id: string) => {
    const src = layers.find(l => l.id === id);
    if (!src) return;

    const memory = WasmMemoryEngine.getInstance();
    const cvs = document.createElement('canvas');
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d')!;
    ctx.drawImage(src.canvas, 0, 0);
    memory.registerBuffer(1024 * 1024 * 4);

    const dup: Layer = {
      id: `layer_${Date.now()}`,
      name: `${src.name} Copy`,
      visible: true,
      opacity: src.opacity,
      blendMode: src.blendMode,
      locked: false,
      canvas: cvs,
      ctx,
      channel: src.channel,
    };

    const updated = [...layers, dup];
    setLayers(updated);
    setActiveLayerId(dup.id);
    undoBuffer.pushState('Duplicate Layer', updated);
    notifyTextureUpdated();
  };

  const handleToggleVisibility = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    notifyTextureUpdated();
  };

  const handleToggleLock = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const handleUpdateOpacity = (id: string, opacity: number) => {
    setLayers(layers.map(l => l.id === id ? { ...l, opacity } : l));
    notifyTextureUpdated();
  };

  const handleUpdateBlendMode = (id: string, blendMode: BlendMode) => {
    setLayers(layers.map(l => l.id === id ? { ...l, blendMode } : l));
    notifyTextureUpdated();
  };

  const handleMoveLayer = (id: string, dir: 'up' | 'down') => {
    const idx = layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    const copy = [...layers];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setLayers(copy);
    notifyTextureUpdated();
  };

  // 3D Camera View Snap Trigger
  const [viewSnapTrigger, setViewSnapTrigger] = useState<{ view: 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom'; timestamp: number } | null>(null);

  // Numpad Key Action
  const handleNumpadKey = (key: string, ctrl: boolean) => {
    if (key === '1') {
      setViewSnapTrigger({ view: ctrl ? 'back' : 'front', timestamp: Date.now() });
    } else if (key === '3') {
      setViewSnapTrigger({ view: ctrl ? 'left' : 'right', timestamp: Date.now() });
    } else if (key === '7') {
      setViewSnapTrigger({ view: ctrl ? 'bottom' : 'top', timestamp: Date.now() });
    } else if (key === '5') {
      setIsOrtho(o => !o);
    } else if (key === '0') {
      setZoomFactor(1.0);
    }
  };

  // Screenshot Projection Workflow (Master Spec Section 6)
  const triggerProjectionScreenshot = () => {
    // 1. Lock 3D navigation
    setIsNavLocked(true);

    // 2. Capture screenshot from WebGL canvas
    const canvas3D = document.querySelector('canvas.cursor-crosshair') as HTMLCanvasElement;
    if (canvas3D) {
      const dataUrl = canvas3D.toDataURL('image/png');
      setProjectionScreenshotUrl(dataUrl);
      setIsProjectionModalOpen(true);
    }
  };

  const handleApplyReprojection = (editedCanvas: HTMLCanvasElement) => {
    const targetLayer = layers.find(l => l.id === activeLayerId);
    if (targetLayer) {
      // Reproject edited canvas pixels back onto 3D UV texture
      targetLayer.ctx.save();
      targetLayer.ctx.globalAlpha = 0.95;
      targetLayer.ctx.drawImage(editedCanvas, 0, 0, targetLayer.canvas.width, targetLayer.canvas.height);
      targetLayer.ctx.restore();

      undoBuffer.pushState('Apply Projection Reprojection', layers);
      notifyTextureUpdated();
    }

    // Unlock 3D navigation
    setIsNavLocked(false);
    setIsProjectionModalOpen(false);
  };

  const handleCancelProjection = () => {
    setIsNavLocked(false);
    setIsProjectionModalOpen(false);
  };

  // Triplanar Box Mapping Fill Execution
  const handleConfirmTriplanar = (config: TriplanarConfig) => {
    const targetLayer = layers.find(l => l.id === activeLayerId);
    if (targetLayer) {
      FillSuite.applyTriplanarBoxFill(targetLayer.ctx, config, activeBrush.opacity);
      undoBuffer.pushState('Triplanar Box Mapping Fill', layers);
      notifyTextureUpdated();
    }
  };

  // Gaussian Blur Execution
  const handleApplyGaussianBlur = (opts: GaussianBlurOptions) => {
    undoBuffer.pushState(`Gaussian Blur (${opts.radius}px)`, layers);
    notifyTextureUpdated();
  };

  // Stochastic Layer Scattering Execution
  const handleApplyStochasticScatter = (cfg: StochasticScatterConfig) => {
    undoBuffer.pushState(`Scatter ${cfg.stampType}`, layers);
    notifyTextureUpdated();
  };

  // Jenny Stitch Studio Execution
  const handleApplyStitchStudio = (cfg: StitchConfig) => {
    undoBuffer.pushState(`Stitch Studio (${cfg.stitchStyle})`, layers);
    notifyTextureUpdated();
  };

  // Layer Conversion Handlers
  const handleConvertToBump = (layerId: string) => {
    const target = layers.find(l => l.id === layerId);
    if (target) {
      LayerConversions.convertToBumpMap(target);
      undoBuffer.pushState('Convert Layer to Bump Map', layers);
      notifyTextureUpdated();
    }
  };

  const handleConvertToNormal = (layerId: string) => {
    const target = layers.find(l => l.id === layerId);
    if (target) {
      LayerConversions.convertToNormalMap(target);
      undoBuffer.pushState('Convert Layer to Normal Map', layers);
      notifyTextureUpdated();
    }
  };

  const handleConvertToClipMask = (layerId: string) => {
    const target = layers.find(l => l.id === layerId);
    if (target) {
      LayerConversions.convertToAlphaClipMask(target);
      undoBuffer.pushState('Convert Layer to Alpha Clip Mask', layers);
      notifyTextureUpdated();
    }
  };

  const handleAddGroup = () => {
    const groupId = `group_${Date.now()}`;
    const groupCount = layers.filter(l => l.isGroup).length + 1;
    const newGroup: Layer = {
      id: groupId,
      name: `Group ${groupCount}`,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      locked: false,
      canvas: document.createElement('canvas'),
      ctx: document.createElement('canvas').getContext('2d')!,
      channel: 'color',
      isGroup: true,
      collapsed: false,
    };
    newGroup.canvas.width = 1024;
    newGroup.canvas.height = 1024;
    const updated = [...layers, newGroup];
    setLayers(updated);
    setActiveLayerId(groupId);
    undoBuffer.pushState('Create Layer Group', updated);
  };

  const handleToggleGroupCollapse = (groupId: string) => {
    setLayers(prev => prev.map(l => l.id === groupId ? { ...l, collapsed: !l.collapsed } : l));
  };

  const handleConvertToEmissive = (layerId: string) => {
    const target = layers.find(l => l.id === layerId);
    if (target) {
      LayerConversions.convertToEmissive(target);

      // Sample color of target layer to drive lighting
      const ctx = target.ctx;
      let emissiveColor = '#ffffff';
      try {
        const p = ctx.getImageData(512, 512, 1, 1).data;
        if (p[3] > 10) {
          emissiveColor = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
        } else {
          const img = ctx.getImageData(0, 0, 1024, 1024).data;
          for (let i = 0; i < img.length; i += 4 * 64) {
            if (img[i + 3] > 30) {
              emissiveColor = `#${((1 << 24) + (img[i] << 16) + (img[i + 1] << 8) + img[i + 2]).toString(16).slice(1)}`;
              break;
            }
          }
        }
      } catch {
        emissiveColor = '#ffffff';
      }

      // Emission Conversion: Replace every input with an emission node exclusively,
      // using the colour value directly to drive the lighting of that layer.
      const emissionNodeId = `node_emission_${Date.now()}`;
      const outputNode = nodes.find(n => n.type === 'material_output') || {
        id: 'node_output',
        type: 'material_output' as const,
        title: 'Material Output',
        x: 600,
        y: 200,
        inputs: [{ id: 'surface', name: 'Surface', type: 'shader' }],
        outputs: [],
        properties: {},
      };

      const newEmissionNode: GraphNode = {
        id: emissionNodeId,
        type: 'emission',
        title: 'Emission (ShaderNodeEmission)',
        x: 320,
        y: 200,
        inputs: [
          { id: 'color', name: 'Color', type: 'color', value: emissiveColor },
          { id: 'strength', name: 'Strength', type: 'float', value: 2.5 },
        ],
        outputs: [
          { id: 'emission', name: 'Emission', type: 'color' },
        ],
        properties: {
          color: emissiveColor,
          strength: 2.5,
        },
      };

      setNodes([newEmissionNode, outputNode]);
      setConnections([
        {
          id: `conn_emission_${Date.now()}`,
          fromNodeId: emissionNodeId,
          fromSocketId: 'emission',
          toNodeId: outputNode.id,
          toSocketId: 'surface',
        },
      ]);

      undoBuffer.pushState('Convert Layer to Emissive (Glow)', layers);
      notifyTextureUpdated();
    }
  };

  const handleSelectLayer = (id: string) => {
    setActiveLayerId(id);
    const layer = layers.find(l => l.id === id);
    if (layer?.uvChannel && activeGeometry) {
      if (UVChannelManager.setActiveChannel(activeGeometry, layer.uvChannel)) {
        setActiveUVChannel(layer.uvChannel);
      }
    }
  };

  const handleSetLayerUV = (layerId: string, channelId: string) => {
    setLayers(prev => prev.map(l => (l.id === layerId ? { ...l, uvChannel: channelId } : l)));
    if (activeGeometry && UVChannelManager.setActiveChannel(activeGeometry, channelId)) {
      setActiveUVChannel(channelId);
    }
  };

  // Bake procedural node tree to active layer
  const handleBakeNodeTree = (bakeCanvas: HTMLCanvasElement) => {
    const targetLayer = layers.find(l => l.id === activeLayerId);
    if (targetLayer) {
      targetLayer.ctx.clearRect(0, 0, targetLayer.canvas.width, targetLayer.canvas.height);
      targetLayer.ctx.drawImage(bakeCanvas, 0, 0, targetLayer.canvas.width, targetLayer.canvas.height);
      undoBuffer.pushState('Bake Node Tree to Layer', layers);
      notifyTextureUpdated();
    }
  };

  // Invert Layer Color
  const handleInvertLayerColor = (layerId: string) => {
    const target = layers.find(l => l.id === layerId);
    if (target) {
      LayerConversions.invertLayerColor(target);
      undoBuffer.pushState('Invert Layer Color', layers);
      notifyTextureUpdated();
    }
  };

  // Layer PBR Settings Save
  const handleSaveLayerPBR = (layerId: string, pbr: LayerPBRSettings) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        return {
          ...l,
          pbrSettings: pbr,
          opacity: Math.round(pbr.opacity * 100),
        };
      }
      return l;
    }));
    undoBuffer.pushState('Update Layer Material & PBR', layers);
    notifyTextureUpdated();
  };

  // Edge Wear & Cavity Ambient Occlusion Filter
  const handleApplyEdgeWear = (config: EdgeWearConfig) => {
    const target = layers.find(l => l.id === activeLayerId);
    if (target) {
      EdgeWearEngine.applyEdgeWear(target, config);
      undoBuffer.pushState('Edge Wear & Cavity AO Filter', layers);
      notifyTextureUpdated();
    }
  };

  // Pattern Stamp Decal at Center
  const handleStampDecalAtCenter = () => {
    const target = layers.find(l => l.id === activeLayerId);
    if (target) {
      PatternStampEngine.stampOnCanvas(target.ctx, 0.5, 0.5, patternStampConfig);
      undoBuffer.pushState('Stamp Decal on Surface', layers);
      notifyTextureUpdated();
    }
  };

  // Blender Material Import
  const handleImportBlenderMaterialFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const converted = BlenderMaterialImporter.parseAndConvert(content);

        // Update active layer with converted PBR properties
        setLayers(prev => prev.map(l => {
          if (l.id === activeLayerId) {
            return {
              ...l,
              name: converted.materialName,
              pbrSettings: converted.pbrSettings,
              channel: converted.hasEmission ? 'emission' : l.channel
            };
          }
          return l;
        }));

        // Set node graph to converted nodes
        if (converted.nodes && converted.nodes.length > 0) {
          setNodes(converted.nodes);
        }

        undoBuffer.pushState(`Import Blender Material: ${converted.materialName}`, layers);
        notifyTextureUpdated();
      } catch (err) {
        console.error('Failed to import Blender material:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save / Load .xblend Project
  const handleSaveXBlend = async () => {
    const modelAsset: MeshModelAsset = {
      id: modelKey,
      name: modelKey.toUpperCase(),
      source: customOBJText ? 'file' : 'primitive',
      linked: !embed3DAssets,
      filePath: `/models/${modelKey}.obj`,
      fileSizeEstimate: embed3DAssets ? '2.45 MB' : '14.2 KB',
      vertexCount: 1240,
      triangleCount: 2480,
      embeddedGeometryData: embed3DAssets ? (customOBJText || 'embedded_geometry') : undefined,
    };

    const xblendJson = await XBlendManager.exportProject(
      projectName,
      embed3DAssets,
      modelAsset,
      layers,
      { nodes, connections },
      undoBuffer,
      materialProps
    );

    XBlendManager.downloadFile(xblendJson, `${projectName}.xblend`, 'application/json');
  };

  const handleLoadXBlend = (jsonString: string) => {
    try {
      const project = XBlendManager.parseProject(jsonString);
      setProjectName(project.projectName);
      setEmbed3DAssets(project.embed3DAssets);

      // Reconstruct layers
      const loadedLayers: Layer[] = project.layers.map(l => {
        const cvs = document.createElement('canvas');
        cvs.width = 1024;
        cvs.height = 1024;
        const ctx = cvs.getContext('2d')!;
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          notifyTextureUpdated();
        };
        img.src = l.dataUrl;

        return {
          id: l.id,
          name: l.name,
          visible: l.visible,
          opacity: l.opacity,
          blendMode: l.blendMode,
          locked: l.locked,
          canvas: cvs,
          ctx,
          channel: l.channel as any,
        };
      });

      setLayers(loadedLayers);
      if (loadedLayers.length > 0) setActiveLayerId(loadedLayers[0].id);

      if (project.nodeGraph) {
        setNodes(project.nodeGraph.nodes);
        setConnections(project.nodeGraph.connections);
      }

      if (project.materialProperties) {
        setMaterialProps(project.materialProperties);
      }

      notifyTextureUpdated();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Export Blender .blend Material
  const handleExportBlenderMaterial = () => {
    const blenderJson = XBlendManager.exportBlenderMaterialSetup(
      `${projectName}_Material`,
      nodes,
      connections,
      materialProps
    );
    XBlendManager.downloadFile(blenderJson, `${projectName}_material.blend.json`);
  };

  // Export .OBJ
  const handleExportOBJ = () => {
    const objData = `# VUE 3D Canvas OBJ Export\n# Author: Victory Ukpong\n# Project: ${projectName}\no ${projectName}\nv -1.0 -1.0 1.0\nv 1.0 -1.0 1.0\nv -1.0 1.0 1.0\nv 1.0 1.0 1.0\nvt 0.0 0.0\nvt 1.0 0.0\nvt 0.0 1.0\nvt 1.0 1.0\nvn 0.0 0.0 1.0\nf 1/1/1 2/2/1 4/4/1\nf 1/1/1 4/4/1 3/3/1\n`;
    XBlendManager.downloadFile(objData, `${projectName}.obj`, 'text/plain');
  };

  // Export .xblend + ZIP Bundle (Master Spec Requirements)
  const handleExportBundleZip = async () => {
    const modelAsset: MeshModelAsset = {
      id: modelKey,
      name: modelKey.toUpperCase(),
      source: customOBJText ? 'file' : 'primitive',
      linked: !embed3DAssets,
      filePath: `/models/${modelKey}.obj`,
      fileSizeEstimate: embed3DAssets ? '2.45 MB' : '14.2 KB',
      vertexCount: 1240,
      triangleCount: 2480,
      embeddedGeometryData: embed3DAssets ? (customOBJText || 'embedded_geometry') : undefined,
    };

    await XBlendManager.exportProjectBundleZip(
      projectName,
      embed3DAssets,
      modelAsset,
      layers,
      { nodes, connections },
      undoBuffer,
      materialProps
    );
  };

  // Direct Alpha Mask Export for a layer
  const handleExportAlphaMaskDirect = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = layer.canvas.width;
    alphaCanvas.height = layer.canvas.height;
    const actx = alphaCanvas.getContext('2d')!;
    actx.drawImage(layer.canvas, 0, 0);

    const imgData = actx.getImageData(0, 0, alphaCanvas.width, alphaCanvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      data[i] = a;     // R
      data[i + 1] = a; // G
      data[i + 2] = a; // B
      data[i + 3] = 255;
    }
    actx.putImageData(imgData, 0, 0);

    const cleanName = layer.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.download = `${cleanName}_AlphaMask.png`;
    link.href = alphaCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCustomModel = (fileName: string, content: string, mtlContent?: string) => {
    setCustomOBJText(content);
    setModelKey('custom_obj');
  };

  const handleAutoTextureModel = async (textureMaps: MatchedTextureMap[]) => {
    if (!textureMaps || textureMaps.length === 0) return;
    const memory = WasmMemoryEngine.getInstance();

    const loadedLayers: Layer[] = [];
    for (let i = 0; i < textureMaps.length; i++) {
      const map = textureMaps[i];
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 1024;
      const ctx = cvs.getContext('2d')!;
      memory.registerBuffer(1024 * 1024 * 4);

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1024, 1024);
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = map.dataUrl;
      });

      const newLayer: Layer = {
        id: `layer_${Date.now()}_${i}`,
        name: map.layerName,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        locked: false,
        canvas: cvs,
        ctx,
        channel: map.role,
      };
      loadedLayers.push(newLayer);
    }

    if (loadedLayers.length > 0) {
      setLayers(loadedLayers);
      setActiveLayerId(loadedLayers[0].id);
      undoBuffer.pushState(`Auto-Texture from Folder (${loadedLayers.length} maps)`, loadedLayers);
      notifyTextureUpdated();
    }
  };

  const handleReimportUVs = useCallback(() => {
    if (!activeGeometry) return;
    if (customOBJText) {
      reimportUVsFromOBJ(activeGeometry, customOBJText);
    } else {
      UVChannelManager.ensureBaseChannels(activeGeometry);
    }
    setActiveUVChannel('uv_original');
    notifyTextureUpdated();
  }, [activeGeometry, customOBJText, notifyTextureUpdated]);

  const handleRepairArchitecturalMesh = useCallback(() => {
    if (!activeGeometry) return;
    repairArchitecturalMesh(activeGeometry);
    notifyTextureUpdated();
  }, [activeGeometry, notifyTextureUpdated]);

  const handleTextureFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setStagedTextureUrl(dataUrl);
        setStagedTextureName(file.name);
        setIsTextureAutoNodeOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyTextureAutoNode = async (result: {
    role: string;
    isTextureFill: boolean;
    fillConfig?: TextureFillConfig;
    createNodeSetup: boolean;
    layerName: string;
  }) => {
    const cvs = document.createElement('canvas');
    cvs.width = 1024;
    cvs.height = 1024;
    const ctx = cvs.getContext('2d')!;

    const newLayerId = `layer_${Date.now()}`;
    const newLayer: Layer = {
      id: newLayerId,
      name: result.layerName,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      locked: false,
      canvas: cvs,
      ctx,
      channel: (result.role === 'texture_fill' ? 'color' : result.role) as any,
      isTextureFill: result.isTextureFill,
      textureFillConfig: result.fillConfig,
    };

    if (result.isTextureFill && result.fillConfig) {
      await FillSuite.applyMaterialTextureFill(ctx, result.fillConfig, 100);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1024, 1024);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = stagedTextureUrl;
      });
    }

    if (result.createNodeSetup) {
      const texNodeId = `node_tex_${Date.now()}`;
      const texNode: GraphNode = {
        id: texNodeId,
        type: 'image_texture',
        title: `${result.layerName} (Texture)`,
        x: 100,
        y: result.role === 'color' ? 120 : result.role === 'height' ? 280 : 200,
        inputs: [],
        outputs: [
          { id: 'color', name: 'Color', type: 'color' },
          { id: 'alpha', name: 'Alpha', type: 'float' },
        ],
        properties: {
          imageName: stagedTextureName,
          channel: result.role,
        },
      };

      const bsdfNode = nodes.find(n => n.type === 'principled_bsdf') || {
        id: 'node_bsdf',
        type: 'principled_bsdf' as const,
        title: 'Principled BSDF',
        x: 380,
        y: 150,
        inputs: [
          { id: 'base_color', name: 'Base Color', type: 'color', value: '#ffffff' },
          { id: 'metallic', name: 'Metallic', type: 'float', value: 0.1 },
          { id: 'roughness', name: 'Roughness', type: 'float', value: 0.4 },
          { id: 'normal', name: 'Normal', type: 'vector' },
        ],
        outputs: [{ id: 'bsdf', name: 'BSDF', type: 'shader' }],
        properties: {},
      };

      const newNodes = [...nodes.filter(n => n.id !== bsdfNode.id), texNode, bsdfNode];
      const newConns = [...connections];

      if (result.role === 'color' || result.role === 'texture_fill') {
        newConns.push({
          id: `conn_${Date.now()}_color`,
          fromNodeId: texNodeId,
          fromSocketId: 'color',
          toNodeId: bsdfNode.id,
          toSocketId: 'base_color',
        });
      } else if (result.role === 'height') {
        const bumpNodeId = `node_bump_${Date.now()}`;
        const bumpNode: GraphNode = {
          id: bumpNodeId,
          type: 'math',
          title: 'Bump (Height -> Normal)',
          x: 240,
          y: 300,
          inputs: [
            { id: 'a', name: 'Height', type: 'float' },
            { id: 'b', name: 'Strength', type: 'float', value: 1.0 },
          ],
          outputs: [{ id: 'result', name: 'Normal', type: 'vector' }],
          properties: { operation: 'bump' },
        };
        newNodes.push(bumpNode);
        newConns.push(
          {
            id: `conn_${Date.now()}_h`,
            fromNodeId: texNodeId,
            fromSocketId: 'color',
            toNodeId: bumpNodeId,
            toSocketId: 'a',
          },
          {
            id: `conn_${Date.now()}_norm`,
            fromNodeId: bumpNodeId,
            fromSocketId: 'result',
            toNodeId: bsdfNode.id,
            toSocketId: 'normal',
          }
        );
      } else if (result.role === 'emission') {
        const emNodeId = `node_em_${Date.now()}`;
        const emNode: GraphNode = {
          id: emNodeId,
          type: 'emission',
          title: 'Emission Shader',
          x: 280,
          y: 220,
          inputs: [
            { id: 'color', name: 'Color', type: 'color', value: '#ffffff' },
            { id: 'strength', name: 'Strength', type: 'float', value: 2.5 },
          ],
          outputs: [{ id: 'emission', name: 'Emission', type: 'color' }],
          properties: {},
        };
        newNodes.push(emNode);
        newConns.push({
          id: `conn_${Date.now()}_em`,
          fromNodeId: texNodeId,
          fromSocketId: 'color',
          toNodeId: emNodeId,
          toSocketId: 'color',
        });
      }

      setNodes(newNodes);
      setConnections(newConns);
    }

    const updatedLayers = [...layers, newLayer];
    setLayers(updatedLayers);
    setActiveLayerId(newLayer.id);
    undoBuffer.pushState(`Import Texture (${result.layerName})`, updatedLayers);
    notifyTextureUpdated();
  };

  const handleBakeTextureFill = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.isTextureFill || !layer.textureFillConfig) return;

    await FillSuite.applyMaterialTextureFill(layer.ctx, layer.textureFillConfig, layer.opacity);
    layer.isTextureFill = false;
    layer.textureFillConfig = undefined;

    setLayers([...layers]);
    undoBuffer.pushState(`Bake Texture Fill (${layer.name})`, layers);
    notifyTextureUpdated();
  };

  const togglePanel = (panelName: string) => {
    setActivePanels(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  };

  const togglePanelFloat = (panelName: string) => {
    setPanelFloating(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  };

  return (
    <div 
      className={`h-screen w-screen flex flex-col bg-[#333333] text-[#c8c8c8] overflow-hidden select-none font-sans theme-container theme-${currentTheme} ${currentTheme === 'bw78' ? 'theme-bw78-viewport-shadow' : ''}`}
      data-theme={currentTheme}
    >
      {/* 1. Authentic Photoshop CS5 Top Menu Bar */}
      <PhotoshopMenuBar
        onNewProject={() => {
          setLayers(l => l.map(layer => {
            layer.ctx.clearRect(0, 0, 1024, 1024);
            if (layer.id === 'layer_base') {
              layer.ctx.fillStyle = '#9c9c9c';
              layer.ctx.fillRect(0, 0, 1024, 1024);
            }
            return layer;
          }));
          notifyTextureUpdated();
        }}
        onOpenProject={() => setIsProjectSettingsOpen(true)}
        onSaveProject={handleSaveXBlend}
        onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
        onExportBlenderSpec={handleExportBlenderMaterial}
        onExportOBJ={handleExportOBJ}
        onExportBundleZip={handleExportBundleZip}
        onTriggerProjectionScreenshot={triggerProjectionScreenshot}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoBuffer.canUndo()}
        canRedo={undoBuffer.canRedo()}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenTriplanarDialog={() => setIsTriplanarOpen(true)}
        onOpenGaussianBlur={() => setIsGaussianBlurOpen(true)}
        onOpenStochasticScatter={() => setIsStochasticScatterOpen(true)}
        onOpenStitchStudio={() => setIsStitchStudioOpen(true)}
        onConvertToBump={() => handleConvertToBump(activeLayerId)}
        onConvertToNormal={() => handleConvertToNormal(activeLayerId)}
        onConvertToClipMask={() => handleConvertToClipMask(activeLayerId)}
        onConvertToEmissive={() => handleConvertToEmissive(activeLayerId)}
        onOpenUndoSettings={() => setIsUndoSettingsOpen(true)}
        onOpenHelpPDF={handleOpenHelpPDF}
        onOpenTutorialPDF={handleOpenTutorialPDF}
        onDownloadHelpDocx={handleDownloadHelpDocx}
        onTogglePanel={togglePanel}
        activePanels={activePanels}
        onNumpadKey={handleNumpadKey}
        onOpenEdgeWearFilter={() => setIsEdgeWearDialogOpen(true)}
        onOpenPatternStampDialog={() => {
          setActiveTool('pattern_stamp');
          setIsPatternStampDialogOpen(true);
        }}
        onImportBlenderMaterial={() => importBlenderFileInputRef.current?.click()}
        onExportMultiChannelModel={() => setIsExportModelDialogOpen(true)}
        selectedModelKey={modelKey}
        onSelectModelKey={setModelKey}
        meshComponentVisibility={meshComponentVisibility}
        onSelectMeshComponentVisibility={setMeshComponentVisibility}
        isolateSelectedGroupOnly={isolateSelectedGroupOnly}
        onToggleIsolateSelectedGroupOnly={(checked) => setIsolateSelectedGroupOnly(checked)}
        currentTheme={currentTheme}
        onChangeTheme={setCurrentTheme}
        gpuBackend={gpuBackend}
        onChangeGpuBackend={handleSetGpuBackend}
        onOpenGpuDiagnostics={() => setIsGpuDiagnosticsOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        shadingMode={shadingMode}
        onSelectShadingMode={setShadingMode}
        surfaceMode={surfaceMode}
        onSelectSurfaceMode={setSurfaceMode}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        viewLayout={viewLayout}
        onSelectViewLayout={setViewLayout}
        isSymmetryX={symmetryConfig.activeRealtimeMirror}
        onToggleSymmetryX={() => setSymmetryConfig(c => ({ ...c, activeRealtimeMirror: !c.activeRealtimeMirror }))}
        isLagoonActive={isLagoonActive}
        onToggleLagoon={() => setIsLagoonActive(v => !v)}
      />

      {/* 2. Tool Options Sub-Toolbar (Standard or Tablet Carousel) - Collapsed in Lagoon Mode */}
      {!isLagoonActive && (!preferences.tabletMode ? (
        <ToolOptionsBar
          activeTool={activeTool}
          brush={activeBrush}
          onUpdateBrush={(patch) => setActiveBrush(b => ({ ...b, ...patch }))}
          optionsBarLayout={preferences.optionsBarLayout}
          selectedModelKey={modelKey}
          onSelectModelKey={setModelKey}
          shadingMode={shadingMode}
          onSelectShadingMode={setShadingMode}
          surfaceMode={surfaceMode}
          onSelectSurfaceMode={setSurfaceMode}
          viewMode={viewMode}
          onSelectViewMode={setViewMode}
          onOpenCarousel={() => setIsCarouselOpen(true)}
          onTriggerProjection={triggerProjectionScreenshot}
          isNavLocked={isNavLocked}
          touchNavEnabled={touchNavEnabled}
          onToggleTouchNav={() => setTouchNavEnabled(t => !t)}
          viewLayout={viewLayout}
          onSelectViewLayout={setViewLayout}
          isSymmetryX={symmetryConfig.activeRealtimeMirror}
          onToggleSymmetryX={() => setSymmetryConfig(c => ({ ...c, activeRealtimeMirror: !c.activeRealtimeMirror }))}
          onOpenSymmetryPanel={() => {
            setDockerGroup2Tab('symmetry');
            setActivePanels(p => ({ ...p, symmetry: true }));
          }}
          onOpenPatternStampDialog={() => {
            setActiveTool('pattern_stamp');
            setIsPatternStampDialogOpen(true);
          }}
        />
      ) : (
        /* Tablet Mode: Top-Left Quick Parameter Radial/HUD Carousel + Top-Right Collapsible Options */
        <>
          <div className="absolute top-9 left-4 z-40">
            <TabletBrushCarousel
              brush={activeBrush}
              onUpdateBrush={(patch) => setActiveBrush(b => ({ ...b, ...patch }))}
              subOperatorStyle={preferences.tabletSubOperator}
            />
          </div>

          <div className="absolute top-9 right-4 z-40">
            <button
              onClick={() => setIsTabletOptionsOpen(o => !o)}
              className="px-3 py-1 bg-[#252525]/95 hover:bg-[#333] text-[#eee] rounded-full border border-[#555] shadow-xl backdrop-blur-md text-[11px] font-mono flex items-center gap-2 cursor-pointer cs5-outset"
              title="Expand Brush Controls Carousel"
            >
            <Sliders className="w-3.5 h-3.5 text-[#3d7fb8]" />
            <span className="text-[#38bdf8] font-bold">{activeBrush.size}px</span>
            <span className="text-[#666]">·</span>
            <span className="text-[#a6e3a1]">{activeBrush.opacity}%</span>
          </button>

          {isTabletOptionsOpen && (
            <div className="absolute top-10 right-0 w-64 bg-[#2b2b2b]/95 border-2 border-[#555] rounded-xl p-3 shadow-2xl backdrop-blur-md cs5-outset space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-[#444] font-bold text-[#eee]">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#3d7fb8]" />
                  Brush Options
                </span>
                <button onClick={() => setIsTabletOptionsOpen(false)} className="text-[#888] hover:text-white">✕</button>
              </div>

              {/* Size Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Size:</span>
                  <span className="font-mono text-[#38bdf8] font-bold">{activeBrush.size}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={activeBrush.size}
                  onChange={(e) => setActiveBrush(b => ({ ...b, size: Number(e.target.value) }))}
                  className="w-full accent-[#3d7fb8] h-1.5 cursor-pointer"
                />
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Opacity:</span>
                  <span className="font-mono text-[#a6e3a1] font-bold">{activeBrush.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={activeBrush.opacity}
                  onChange={(e) => setActiveBrush(b => ({ ...b, opacity: Number(e.target.value) }))}
                  className="w-full accent-[#a6e3a1] h-1.5 cursor-pointer"
                />
              </div>

              {/* Hardness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#aaa]">Hardness:</span>
                  <span className="font-mono text-[#f38ba8] font-bold">{activeBrush.hardness ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeBrush.hardness ?? 50}
                  onChange={(e) => setActiveBrush(b => ({ ...b, hardness: Number(e.target.value) }))}
                  className="w-full accent-[#f38ba8] h-1.5 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </>
    ))}

      {/* 3. Main Workspace Area: Left ToolBox + Center Viewport(s) + Right Dockable Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Tool Palette: Desktop Column vs Tablet Bottom-Left Circular Carousel (Hidden in Lagoon Mode) */}
        {!isLagoonActive && (!preferences.tabletMode ? (
          <ToolBox
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onSwapColors={swapColors}
            onResetColors={resetColors}
            onChangePrimaryColor={setPrimaryColor}
            onChangeSecondaryColor={setSecondaryColor}
            surfaceMode={surfaceMode}
            onSelectSurfaceMode={setSurfaceMode}
            onOpenPatternStampDialog={() => {
              setActiveTool('pattern_stamp');
              setIsPatternStampDialogOpen(true);
            }}
          />
        ) : (
          /* Tablet Mode: Bottom-Left Circular Carousel Hub */
          <div className="absolute bottom-5 left-5 z-40">
            {isTabletToolsOpen && (
              <div className="absolute bottom-16 left-0 bg-[#2b2b2b]/95 border-2 border-[#555] rounded-2xl p-3 shadow-2xl backdrop-blur-md cs5-outset w-72 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-[#444] text-[11px] font-bold text-[#89b4fa]">
                  <span className="flex items-center gap-1.5">
                    <Tablet className="w-3.5 h-3.5" />
                    Tablet Tool Palette
                  </span>
                  <button onClick={() => setIsTabletToolsOpen(false)} className="text-[#888] hover:text-white">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'brush', label: 'Brush (B)', icon: <Paintbrush className="w-3.5 h-3.5" /> },
                    { id: 'eraser', label: 'Eraser (E)', icon: <Eraser className="w-3.5 h-3.5" /> },
                    { id: 'blur', label: 'Blur (R)', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { id: 'smudge', label: 'Smudge (U)', icon: <Fingerprint className="w-3.5 h-3.5" /> },
                    { id: 'clone', label: 'Clone (S)', icon: <Stamp className="w-3.5 h-3.5" /> },
                    { id: 'pen', label: 'Pen (P)', icon: <PenTool className="w-3.5 h-3.5" /> },
                    { id: 'bucket', label: 'Bucket (G)', icon: <PaintBucket className="w-3.5 h-3.5" /> },
                    { id: 'eyedropper', label: 'Eyedropper (I)', icon: <Pipette className="w-3.5 h-3.5" /> },
                    { id: 'hand', label: 'Hand (H)', icon: <Hand className="w-3.5 h-3.5" /> },
                    { id: 'zoom', label: 'Zoom (Z)', icon: <ZoomIn className="w-3.5 h-3.5" /> },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setActiveTool(t.id as any); setIsTabletToolsOpen(false); }}
                      className={`p-2 rounded flex items-center gap-2 text-[10px] font-medium border transition-colors ${
                        activeTool === t.id
                          ? 'bg-[#3d7fb8] text-white border-[#5ea1da] shadow-xs'
                          : 'bg-[#353535] hover:bg-[#454545] text-[#ccc] border-[#4a4a4a]'
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#444] flex items-center justify-between">
                  <span className="text-[10px] text-[#aaa]">Color:</span>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-[#555] cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setIsTabletToolsOpen(o => !o)}
              className="w-13 h-13 rounded-full bg-[#3d7fb8] hover:bg-[#4a8ec9] text-white border-2 border-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Open Tablet Tools Carousel Palette"
            >
              <Paintbrush className="w-6 h-6" />
            </button>
          </div>
        ))}

        {/* Center Viewport Area (3D, 2D, or Split) */}
        <div className="flex-1 flex overflow-hidden relative bg-[#242424]">
          {/* 3D Viewport */}
          {(viewMode === '3d' || viewMode === 'split') && (
            <div className={`relative ${viewMode === 'split' ? 'w-1/2 border-r border-[#444]' : 'w-full'} h-full`}>
              <Viewport3D
                layers={layers}
                activeLayerId={activeLayerId}
                activeTool={activeTool}
                brush={activeBrush}
                modelKey={modelKey}
                customOBJText={customOBJText}
                shadingMode={shadingMode}
                materialProps={materialProps}
                undoBuffer={undoBuffer}
                onTextureUpdated={notifyTextureUpdated}
                onColorSampled={setPrimaryColor}
                isOrtho={isOrtho}
                onToggleOrtho={() => setIsOrtho(!isOrtho)}
                zoomFactor={zoomFactor}
                touchNavEnabled={touchNavEnabled}
                onToggleTouchNav={() => setTouchNavEnabled(t => !t)}
                compositeCanvas={compositeCanvas}
                textureVersion={textureVersion}
                showGizmo={showGizmo}
                viewLayout={viewLayout}
                onSelectViewLayout={setViewLayout}
                surfaceMode={surfaceMode}
                isSymmetryX={symmetryConfig.activeRealtimeMirror}
                selectionMask={selectionMask}
                symmetryConfig={symmetryConfig}
                bloomSettings={bloomSettings}
                onUpdateBloomSettings={(patch) => setBloomSettings(b => ({ ...b, ...patch }))}
                patternStampConfig={patternStampConfig}
                meshComponentVisibility={isolateSelectedGroupOnly && meshComponentVisibility !== 'all' ? meshComponentVisibility : 'all'}
                geometry={activeGeometry}
                onGeometryUpdated={notifyTextureUpdated}
                activeUVChannel={activeUVChannel}
                isXRayBrushActive={isXRayBrushActive}
                onToggleXRayBrush={() => setIsXRayBrushActive(v => !v)}
                selectedVertices={xrayVertexSelection}
                onUpdateSelectedVertices={setXrayVertexSelection}
                gizmoStyle={preferences.gizmoStyle}
                constantRefresh={preferences.constantRefresh}
                refreshRateMode={preferences.refreshRateMode}
                customRefreshRate={preferences.customRefreshRate}
                navSensitivity={preferences.navSensitivity}
                viewSnapTrigger={viewSnapTrigger}
              />
            </div>
          )}

          {/* 2D UV Texture Map Viewport */}
          {(viewMode === '2d' || viewMode === 'split') && (
            <div className={`relative ${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full`}>
              <Viewport2D
                layers={layers}
                activeLayerId={activeLayerId}
                activeTool={activeTool}
                brush={activeBrush}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                selectionMask={selectionMask}
                onUpdateSelectionMask={setSelectionMask}
                undoBuffer={undoBuffer}
                onTextureUpdated={notifyTextureUpdated}
                onColorSampled={setPrimaryColor}
                modelKey={modelKey}
                customOBJText={customOBJText}
                touchNavEnabled={touchNavEnabled}
                onToggleTouchNav={() => setTouchNavEnabled(t => !t)}
                patternStampConfig={patternStampConfig}
                geometry={activeGeometry}
                onGeometryUpdated={notifyTextureUpdated}
                activeUVChannel={activeUVChannel}
                onSelectUVChannel={setActiveUVChannel}
                selectedVertices={xrayVertexSelection}
                onRebakeTexture={handleRebakeTexture}
              />
            </div>
          )}

          {/* Autodesk Sketchbook Pro & Maya Lagoon Radial Interface */}
          {isLagoonActive && (
            <LagoonMenu
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              brush={activeBrush}
              onUpdateBrush={(patch) => setActiveBrush(b => ({ ...b, ...patch }))}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              onSelectPrimaryColor={setPrimaryColor}
              onSwapColors={swapColors}
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={handleSelectLayer}
              onAddLayer={handleAddLayer}
              onToggleLayerVisibility={handleToggleVisibility}
              onNumpadKey={handleNumpadKey}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={undoBuffer.canUndo()}
              canRedo={undoBuffer.canRedo()}
              onSaveProject={handleSaveXBlend}
              onExportOBJ={handleExportOBJ}
              onTriggerProjection={triggerProjectionScreenshot}
              onCloseLagoon={() => setIsLagoonActive(false)}
            />
          )}
        </div>

        {/* Tablet Mode Edge Trigger Button */}
        {preferences.tabletMode && !tabletDrawerOpen && (
          <button
            onClick={() => setTabletDrawerOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#2b2b2b] text-[#e0e0e0] border border-r-0 border-[#555] rounded-l px-1.5 py-4 shadow-xl flex flex-col items-center gap-1 hover:bg-[#383838] cursor-pointer text-[10px] font-mono tracking-widest transition-transform hover:-translate-x-0.5"
            title="Open N-Panel Dockers (Press N)"
          >
            <span className="text-[#3d7fb8] font-bold text-xs">◀</span>
            <span>P</span>
            <span>A</span>
            <span>N</span>
            <span>E</span>
            <span>L</span>
            <span>S</span>
          </button>
        )}

        {/* Right Dockable Workspace Panels (Autodesk Sketchbook / CS5 Fusion / Docker System) */}
        <div
          className={
            preferences.tabletMode
              ? `fixed right-0 top-9 bottom-6 w-80 bg-[#383838] border-l border-[#242424] flex flex-col overflow-y-auto z-50 shadow-2xl cs5-outset transition-transform duration-200 ${
                  tabletDrawerOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
                }`
              : 'w-72 bg-[#383838] border-l border-[#242424] flex flex-col overflow-y-auto shrink-0 z-30 cs5-outset'
          }
        >
          {preferences.tabletMode && (
            <div className="p-1.5 bg-[#252525] border-b border-[#444] flex items-center justify-between text-xs shrink-0">
              <span className="font-mono text-[#888] uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <LayersIcon className="w-3.5 h-3.5 text-[#3d7fb8]" />
                <strong className="text-white">N-Panel Dockers</strong>
              </span>
              <button
                onClick={() => setTabletDrawerOpen(false)}
                className="px-2 py-0.5 bg-[#444] hover:bg-[#555] text-white rounded text-[10px] font-mono cursor-pointer flex items-center gap-1"
                title="Close N-Panel (N)"
              >
                <span>Close</span>
                <span className="text-[#aaa]">(N) ▶</span>
              </button>
            </div>
          )}

          {/* Docker Header Switcher: Grouped Dockers (Tabs) vs Expanded Panels (Stack) */}
          <div className="p-1.5 bg-[#2c2c2c] border-b border-[#444] flex items-center justify-between text-[10px]">
            <span className="font-mono text-[#888] uppercase tracking-wider flex items-center gap-1">
              <LayersIcon className="w-3 h-3 text-[#3d7fb8]" />
              Docker System
            </span>
            <button
              onClick={() => setUseDockerTabs(!useDockerTabs)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                useDockerTabs
                  ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                  : 'bg-[#3a3a3a] text-[#bbb] border-[#555] hover:text-white'
              }`}
              title="Toggle Grouped Docker Tabs vs Expanded Stack"
            >
              {useDockerTabs ? 'Grouped Dockers (Tabs)' : 'Expanded Stack'}
            </button>
          </div>

          {useDockerTabs ? (
            <div className="flex flex-col gap-2 p-1">
              {/* Docker Group 1: Layers / Color / History */}
              <div className="border border-[#444] rounded overflow-hidden">
                <DockerGroup
                  id="docker_group_1"
                  tabs={[
                    {
                      id: 'layers',
                      title: 'Layers',
                      icon: <LayersIcon className="w-3 h-3 text-[#3d7fb8]" />,
                      content: (
                        <div className="h-64">
                          <LayersPanel
                            layers={layers}
                            activeLayerId={activeLayerId}
                            onSelectLayer={handleSelectLayer}
                            onAddLayer={handleAddLayer}
                            onAddGroup={handleAddGroup}
                            onToggleGroupCollapse={handleToggleGroupCollapse}
                            onDeleteLayer={handleDeleteLayer}
                            onDuplicateLayer={handleDuplicateLayer}
                            onToggleVisibility={handleToggleVisibility}
                            onToggleLock={handleToggleLock}
                            onUpdateOpacity={handleUpdateOpacity}
                            onUpdateBlendMode={handleUpdateBlendMode}
                            onMoveLayer={handleMoveLayer}
                            onOpenExportDialog={handleOpenExportDialog}
                            onExportAlphaMaskDirect={handleExportAlphaMaskDirect}
                            onOpenGaussianBlur={() => setIsGaussianBlurOpen(true)}
                            onOpenStochasticScatter={() => setIsStochasticScatterOpen(true)}
                            onOpenStitchStudio={() => setIsStitchStudioOpen(true)}
                            onConvertToBump={handleConvertToBump}
                            onConvertToNormal={handleConvertToNormal}
                            onConvertToClipMask={handleConvertToClipMask}
                            onConvertToEmissive={handleConvertToEmissive}
                            onInvertLayerColor={handleInvertLayerColor}
                            onImportTexture={() => textureFileInputRef.current?.click()}
                            onBakeTextureFill={handleBakeTextureFill}
                            onOpenLayerSettings={(id) => {
                              setLayerSettingsTargetId(id);
                              setIsLayerSettingsOpen(true);
                            }}
                          />
                        </div>
                      ),
                    },
                    {
                      id: 'colorWheel',
                      title: 'Color',
                      icon: <Palette className="w-3 h-3 text-[#e5a038]" />,
                      content: (
                        <ColorWheelPanel
                          currentColor={primaryColor}
                          onChangeColor={setPrimaryColor}
                        />
                      ),
                    },
                    {
                      id: 'history',
                      title: 'History',
                      icon: <History className="w-3 h-3 text-[#3d7fb8]" />,
                      content: (
                        <div className="h-56">
                          <UndoHistoryPanel
                            undoBuffer={undoBuffer}
                            layers={layers}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            onJumpToState={(idx) => {
                              if (undoBuffer.jumpToState(idx, layers)) {
                                notifyTextureUpdated();
                              }
                            }}
                          />
                        </div>
                      ),
                    },
                  ]}
                  activeTabId={dockerGroup1Tab}
                  onSelectTab={setDockerGroup1Tab}
                  width={280}
                />
              </div>

              {/* Docker Group 2: Supervisor 3D Viewport Clone / Brushes / Numpad */}
              <div className="border border-[#444] rounded overflow-hidden">
                <DockerGroup
                  id="docker_group_2"
                  tabs={[
                    {
                      id: 'navigator',
                      title: '3D Viewport',
                      icon: <Compass className="w-3 h-3 text-[#f38ba8]" />,
                      content: (
                        <NavigatorPanel
                          modelKey={modelKey}
                          customOBJText={customOBJText}
                          compositeCanvas={compositeCanvas}
                          textureVersion={textureVersion}
                          materialProps={materialProps}
                          showGizmo={showGizmo}
                          onToggleGizmo={() => setShowGizmo(g => !g)}
                          surfaceMode={surfaceMode}
                          shadingMode={shadingMode}
                        />
                      ),
                    },
                    {
                      id: 'brushes',
                      title: 'Brushes',
                      icon: <Paintbrush className="w-3 h-3 text-[#a6e3a1]" />,
                      content: (
                        <div className="h-72">
                          <BrushLibraryPanel
                            brushes={brushes}
                            activeBrush={activeBrush}
                            onSelectBrush={setActiveBrush}
                            onUpdateBrush={(patch) => setActiveBrush(b => ({ ...b, ...patch }))}
                            onOpenCarousel={() => setIsCarouselOpen(true)}
                          />
                        </div>
                      ),
                    },
                    {
                      id: 'symmetry',
                      title: 'Symmetry',
                      icon: <SplitSquareVertical className="w-3 h-3 text-[#3d7fb8]" />,
                      content: (
                        <div className="h-72">
                          <SymmetryPanel
                            config={symmetryConfig}
                            onChangeConfig={(patch) => setSymmetryConfig(c => ({ ...c, ...patch }))}
                            onSymmetrize={handleSymmetrize}
                            activeLayerName={layers.find(l => l.id === activeLayerId)?.name || 'Active Layer'}
                          />
                        </div>
                      ),
                    },
                    {
                      id: 'masking',
                      title: 'Mask',
                      icon: <SquareIcon className="w-3 h-3 text-[#f97316]" />,
                      content: (
                        <div className="h-72">
                          <MaskPanel
                            selectionMask={selectionMask}
                            onUpdateSelectionMask={setSelectionMask}
                            activeTool={activeTool}
                            onSelectTool={setActiveTool}
                            layers={layers}
                            activeLayerId={activeLayerId}
                            undoBuffer={undoBuffer}
                            onTextureUpdated={notifyTextureUpdated}
                            primaryColor={primaryColor}
                          />
                        </div>
                      ),
                    },
                  ]}
                  activeTabId={dockerGroup2Tab}
                  onSelectTab={setDockerGroup2Tab}
                  width={280}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Layers Panel */}
              {activePanels.layers && !panelFloating.layers && (
                <div className="border-b border-[#444] h-64 shrink-0">
                  <DockablePanelFrame
                    id="layers"
                    title="Layers"
                    icon={<LayersIcon className="w-3.5 h-3.5 text-[#3d7fb8]" />}
                    onClose={() => togglePanel('layers')}
                    onToggleFloat={() => togglePanelFloat('layers')}
                  >
                    <LayersPanel
                      layers={layers}
                      activeLayerId={activeLayerId}
                      onSelectLayer={handleSelectLayer}
                      onAddLayer={handleAddLayer}
                      onAddGroup={handleAddGroup}
                      onToggleGroupCollapse={handleToggleGroupCollapse}
                      onDeleteLayer={handleDeleteLayer}
                      onDuplicateLayer={handleDuplicateLayer}
                      onToggleVisibility={handleToggleVisibility}
                      onToggleLock={handleToggleLock}
                      onUpdateOpacity={handleUpdateOpacity}
                      onUpdateBlendMode={handleUpdateBlendMode}
                      onMoveLayer={handleMoveLayer}
                      onOpenExportDialog={handleOpenExportDialog}
                      onExportAlphaMaskDirect={handleExportAlphaMaskDirect}
                      onOpenGaussianBlur={() => setIsGaussianBlurOpen(true)}
                      onOpenStochasticScatter={() => setIsStochasticScatterOpen(true)}
                      onOpenStitchStudio={() => setIsStitchStudioOpen(true)}
                      onConvertToBump={handleConvertToBump}
                      onConvertToNormal={handleConvertToNormal}
                      onConvertToClipMask={handleConvertToClipMask}
                      onConvertToEmissive={handleConvertToEmissive}
                      onImportTexture={() => textureFileInputRef.current?.click()}
                      onBakeTextureFill={handleBakeTextureFill}
                    />
                  </DockablePanelFrame>
                </div>
              )}

              {/* Color Wheel Panel */}
              {activePanels.colorWheel && !panelFloating.colorWheel && (
                <div className="border-b border-[#444] shrink-0">
                  <DockablePanelFrame
                    id="colorWheel"
                    title="Color Wheel"
                    icon={<Palette className="w-3.5 h-3.5 text-[#e5a038]" />}
                    onClose={() => togglePanel('colorWheel')}
                    onToggleFloat={() => togglePanelFloat('colorWheel')}
                  >
                    <ColorWheelPanel
                      currentColor={primaryColor}
                      onChangeColor={setPrimaryColor}
                    />
                  </DockablePanelFrame>
                </div>
              )}

              {/* Brush Library & Dynamics */}
              {activePanels.brushes && !panelFloating.brushes && (
                <div className="border-b border-[#444] h-72 shrink-0">
                  <DockablePanelFrame
                    id="brushes"
                    title="Brushes &amp; Dynamics"
                    icon={<Paintbrush className="w-3.5 h-3.5 text-[#a6e3a1]" />}
                    onClose={() => togglePanel('brushes')}
                    onToggleFloat={() => togglePanelFloat('brushes')}
                  >
                    <BrushLibraryPanel
                      brushes={brushes}
                      activeBrush={activeBrush}
                      onSelectBrush={setActiveBrush}
                      onUpdateBrush={(patch) => setActiveBrush(b => ({ ...b, ...patch }))}
                      onOpenCarousel={() => setIsCarouselOpen(true)}
                    />
                  </DockablePanelFrame>
                </div>
              )}

              {/* Undo History (Normalized) */}
              {activePanels.history && !panelFloating.history && (
                <div className="border-b border-[#444] h-52 shrink-0">
                  <DockablePanelFrame
                    id="history"
                    title="Undo History (Normalized)"
                    icon={<History className="w-3.5 h-3.5 text-[#3d7fb8]" />}
                    onClose={() => togglePanel('history')}
                    onToggleFloat={() => togglePanelFloat('history')}
                  >
                    <UndoHistoryPanel
                      undoBuffer={undoBuffer}
                      layers={layers}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      onJumpToState={(idx) => {
                        if (undoBuffer.jumpToState(idx, layers)) {
                          notifyTextureUpdated();
                        }
                      }}
                    />
                  </DockablePanelFrame>
                </div>
              )}

              {/* Supervisor 3D Viewport Clone Navigator */}
              {activePanels.navigator && !panelFloating.navigator && (
                <div className="border-b border-[#444] shrink-0">
                  <DockablePanelFrame
                    id="navigator"
                    title="3D Viewport"
                    icon={<Compass className="w-3.5 h-3.5 text-[#f38ba8]" />}
                    onClose={() => togglePanel('navigator')}
                    onToggleFloat={() => togglePanelFloat('navigator')}
                  >
                    <NavigatorPanel
                      modelKey={modelKey}
                      customOBJText={customOBJText}
                      compositeCanvas={compositeCanvas}
                      textureVersion={textureVersion}
                      materialProps={materialProps}
                      showGizmo={showGizmo}
                      onToggleGizmo={() => setShowGizmo(g => !g)}
                    />
                  </DockablePanelFrame>
                </div>
              )}

              {/* Symmetry & Symmetrize Panel */}
              {activePanels.symmetry && !panelFloating.symmetry && (
                <div className="border-b border-[#444] h-72 shrink-0">
                  <DockablePanelFrame
                    id="symmetry"
                    title="Symmetry &amp; Symmetrize Docker"
                    icon={<SplitSquareVertical className="w-3.5 h-3.5 text-[#3d7fb8]" />}
                    onClose={() => togglePanel('symmetry')}
                    onToggleFloat={() => togglePanelFloat('symmetry')}
                  >
                    <SymmetryPanel
                      config={symmetryConfig}
                      onChangeConfig={(patch) => setSymmetryConfig(c => ({ ...c, ...patch }))}
                      onSymmetrize={handleSymmetrize}
                      activeLayerName={layers.find(l => l.id === activeLayerId)?.name || 'Active Layer'}
                    />
                  </DockablePanelFrame>
                </div>
              )}

              {/* Mask Painting Panel */}
              {activePanels.masking && !panelFloating.masking && (
                <div className="border-b border-[#444] h-72 shrink-0">
                  <DockablePanelFrame
                    id="masking"
                    title="Mask Painting Docker"
                    icon={<SquareIcon className="w-3.5 h-3.5 text-[#f97316]" />}
                    onClose={() => togglePanel('masking')}
                    onToggleFloat={() => togglePanelFloat('masking')}
                  >
                    <MaskPanel
                      selectionMask={selectionMask}
                      onUpdateSelectionMask={setSelectionMask}
                      activeTool={activeTool}
                      onSelectTool={setActiveTool}
                      layers={layers}
                      activeLayerId={activeLayerId}
                      undoBuffer={undoBuffer}
                      onTextureUpdated={notifyTextureUpdated}
                      primaryColor={primaryColor}
                    />
                  </DockablePanelFrame>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Panels (Torn off into floating windows) */}
      {panelFloating.nodeGraph && activePanels.nodeGraph && (
        <DockablePanelFrame
          id="nodeGraph"
          title="Blender 2.83 LTS Shader Node Graph"
          icon={<Share2 className="w-3.5 h-3.5 text-[#f97316]" />}
          isFloating={true}
          initialPos={{ x: 140, y: 120 }}
          width={640}
          height={420}
          minWidth={440}
          minHeight={320}
          onClose={() => togglePanel('nodeGraph')}
          onToggleFloat={() => togglePanelFloat('nodeGraph')}
        >
          <NodeGraphPanel
            nodes={nodes}
            connections={connections}
            onUpdateNodes={setNodes}
            onUpdateConnections={setConnections}
            onBakeToLayer={handleBakeNodeTree}
            onExportBlenderSpec={handleExportBlenderMaterial}
          />
        </DockablePanelFrame>
      )}

      {panelFloating.symmetry && activePanels.symmetry && (
        <DockablePanelFrame
          id="symmetry"
          title="Symmetry &amp; Symmetrize Docker"
          icon={<SplitSquareVertical className="w-3.5 h-3.5 text-[#3d7fb8]" />}
          isFloating={true}
          initialPos={{ x: 260, y: 140 }}
          width={320}
          height={400}
          onClose={() => togglePanel('symmetry')}
          onToggleFloat={() => togglePanelFloat('symmetry')}
        >
          <SymmetryPanel
            config={symmetryConfig}
            onChangeConfig={(patch) => setSymmetryConfig(c => ({ ...c, ...patch }))}
            onSymmetrize={handleSymmetrize}
            activeLayerName={layers.find(l => l.id === activeLayerId)?.name || 'Active Layer'}
          />
        </DockablePanelFrame>
      )}

      {panelFloating.masking && activePanels.masking && (
        <DockablePanelFrame
          id="masking"
          title="Mask Painting Docker"
          icon={<SquareIcon className="w-3.5 h-3.5 text-[#f97316]" />}
          isFloating={true}
          initialPos={{ x: 300, y: 160 }}
          width={320}
          height={440}
          onClose={() => togglePanel('masking')}
          onToggleFloat={() => togglePanelFloat('masking')}
        >
          <MaskPanel
            selectionMask={selectionMask}
            onUpdateSelectionMask={setSelectionMask}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            layers={layers}
            activeLayerId={activeLayerId}
            undoBuffer={undoBuffer}
            onTextureUpdated={notifyTextureUpdated}
            primaryColor={primaryColor}
          />
        </DockablePanelFrame>
      )}

      {/* 4. Bottom Hardware & Deterministic Memory Status Bar */}
      <div className="h-6 bg-[#262626] border-t border-[#383838] px-3 flex items-center justify-between text-[10px] text-[#888] font-mono select-none z-40">
        <div className="flex items-center gap-3">
          <span className="text-[#a6e3a1]">● RUST/WASM CORE</span>
          <span className="text-[#89b4fa] font-bold">
            {gpuBackend === 'dx11' && '● DIRECTX 11 (D3D11 PRIORITY) ACTIVE'}
            {gpuBackend === 'opengl' && '● OPENGL 2.0+ (COMPATIBILITY) ACTIVE'}
            {gpuBackend === 'modern' && '● MODERN AUTO-DETECT GPU ACTIVE'}
          </span>
          <span className="text-[#3d7fb8]">.XBLEND FORMAT (LINKED ASSETS DEFAULT)</span>
          <span className="text-[#4ade80] font-semibold">● STANDALONE OFFLINE</span>
          <button
            onClick={() => setTouchNavEnabled(t => !t)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors cursor-pointer ${
              touchNavEnabled
                ? 'bg-[#3d7fb8] text-white border-[#5ca2db]'
                : 'bg-[#333] text-[#aaa] border-[#444] hover:text-white'
            }`}
            title="Toggle Android / Tablet Touch Navigation"
          >
            TOUCH NAV (ANDROID): {touchNavEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span>UNDO: NORMALIZED (3 STATES SAVED TO .XBLEND)</span>
          <span>VICTORY UKPONG · OPEN SOURCE</span>
        </div>
      </div>

      {/* 5. Autodesk Sketchbook / Medibang Circular Carousel Widget */}
      <CircularCarousel
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        brushes={brushes}
        activeBrush={activeBrush}
        onSelectBrush={setActiveBrush}
      />

      {/* 6. Triplanar Box Mapping Confirmation Dialog */}
      <TriplanarDialog
        isOpen={isTriplanarOpen}
        onClose={() => setIsTriplanarOpen(false)}
        onConfirm={handleConfirmTriplanar}
        defaultColor={primaryColor}
      />

      {/* 6b. Gaussian Blur (Selected Layer Only) */}
      <GaussianBlurDialog
        isOpen={isGaussianBlurOpen}
        onClose={() => setIsGaussianBlurOpen(false)}
        activeLayer={layers.find(l => l.id === activeLayerId)}
        onApply={handleApplyGaussianBlur}
        onPreviewUpdate={notifyTextureUpdated}
      />

      {/* 6c. Stochastic Layer Scattering */}
      <StochasticScatterDialog
        isOpen={isStochasticScatterOpen}
        onClose={() => setIsStochasticScatterOpen(false)}
        activeLayer={layers.find(l => l.id === activeLayerId)}
        defaultColor={primaryColor}
        onApply={handleApplyStochasticScatter}
        onPreviewUpdate={notifyTextureUpdated}
      />

      {/* 6d. Jenny Stitch Studio (Topology Edge Stitching) */}
      <StitchStudioDialog
        isOpen={isStitchStudioOpen}
        onClose={() => setIsStitchStudioOpen(false)}
        activeLayer={layers.find(l => l.id === activeLayerId)}
        modelKey={modelKey}
        customOBJText={customOBJText}
        onApply={handleApplyStitchStudio}
        onPreviewUpdate={notifyTextureUpdated}
      />

      {/* 7. Screenshot Projection & External Editor Bridge Modal (Strict Nav Lock) */}
      <ProjectionModal
        isOpen={isProjectionModalOpen}
        screenshotUrl={projectionScreenshotUrl}
        onApplyReprojection={handleApplyReprojection}
        onCancel={handleCancelProjection}
      />

      {/* 8. About VUE 3D Canvas Modal with Victory Ukpong Signature */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* 9. .xblend Project Settings & Asset Linking Modal */}
      <ProjectSettingsModal
        isOpen={isProjectSettingsOpen}
        onClose={() => setIsProjectSettingsOpen(false)}
        projectName={projectName}
        setProjectName={setProjectName}
        embed3DAssets={embed3DAssets}
        setEmbed3DAssets={setEmbed3DAssets}
        currentModel={{
          id: modelKey,
          name: modelKey.toUpperCase(),
          source: customOBJText ? 'file' : 'primitive',
          linked: !embed3DAssets,
          filePath: `/models/${modelKey}.obj`,
          fileSizeEstimate: embed3DAssets ? '2.45 MB' : '14.2 KB',
          vertexCount: 1240,
          triangleCount: 2480,
        }}
        onSaveXBlend={handleSaveXBlend}
        onLoadXBlend={handleLoadXBlend}
        onExportBlenderMaterial={handleExportBlenderMaterial}
        onExportOBJ={handleExportOBJ}
        onImportCustomModel={handleImportCustomModel}
        onExportBundleZip={handleExportBundleZip}
        onAutoTextureModel={handleAutoTextureModel}
        onReimportUVs={handleReimportUVs}
        onRepairMesh={handleRepairArchitecturalMesh}
      />

      {/* 10. CorelDraw-Style Texture & Alpha Mask Export Dialog */}
      <ExportTextureDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        layers={layers}
        selectedLayerId={exportDialogLayerId}
        defaultMode={exportDialogMode}
        activeUVChannel={activeUVChannel}
      />

      {/* 11. Undo & Redo Preferences Settings Modal */}
      <UndoSettingsDialog
        isOpen={isUndoSettingsOpen}
        onClose={() => setIsUndoSettingsOpen(false)}
        undoBuffer={undoBuffer}
        layerCount={layers.length}
      />

      {/* 12. Layer Material & PBR Settings Modal */}
      <LayerSettingsModal
        isOpen={isLayerSettingsOpen}
        onClose={() => setIsLayerSettingsOpen(false)}
        layer={layers.find(l => l.id === (layerSettingsTargetId || activeLayerId)) || null}
        onSavePBR={handleSaveLayerPBR}
        uvChannels={activeGeometry ? UVChannelManager.getChannels(activeGeometry) : []}
        onSetUVChannel={handleSetLayerUV}
        onOpenNodeEditor={() => {
          setActivePanels(p => ({ ...p, nodeGraph: true }));
        }}
      />

      {/* 13. Pattern Stamp Tool Configuration Dialog */}
      <PatternStampDialog
        isOpen={isPatternStampDialogOpen}
        onClose={() => setIsPatternStampDialogOpen(false)}
        config={patternStampConfig}
        onChangeConfig={setPatternStampConfig}
        onStampAtCenter={handleStampDecalAtCenter}
      />

      {/* 14. Edge Wear & Cavity Ambient Occlusion Filter Dialog */}
      <EdgeWearDialog
        isOpen={isEdgeWearDialogOpen}
        onClose={() => setIsEdgeWearDialogOpen(false)}
        activeLayer={layers.find(l => l.id === activeLayerId)}
        onApply={handleApplyEdgeWear}
        onPreviewUpdate={notifyTextureUpdated}
      />

      {/* 15. FBX & glTF Multi-Channel Model Exporter Dialog */}
      <ExportModelDialog
        isOpen={isExportModelDialogOpen}
        onClose={() => setIsExportModelDialogOpen(false)}
        layers={layers}
        currentMesh={null}
        activeModelName={modelKey}
        activeUVChannel={activeUVChannel}
      />

      {/* 16. GPU Hardware & Diagnostics Modal */}
      <GpuDiagnosticsModal
        isOpen={isGpuDiagnosticsOpen}
        onClose={() => setIsGpuDiagnosticsOpen(false)}
        activeBackend={gpuBackend}
      />

      {/* 17. Application Preferences & Hardware Diagnostics Modal */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* 18. Texture Import & Auto-Node Setup Modal */}
      <TextureAutoNodeModal
        isOpen={isTextureAutoNodeOpen}
        onClose={() => setIsTextureAutoNodeOpen(false)}
        imageDataUrl={stagedTextureUrl}
        imageFileName={stagedTextureName}
        onApply={handleApplyTextureAutoNode}
      />

      {/* Hidden file input for texture import */}
      <input
        ref={textureFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleTextureFileSelected}
        className="hidden"
      />

      {/* Hidden file input for Blender material import */}
      <input
        ref={importBlenderFileInputRef}
        type="file"
        accept=".json,.py,.txt,.blend"
        onChange={handleImportBlenderMaterialFile}
        className="hidden"
      />
    </div>
  );
}
