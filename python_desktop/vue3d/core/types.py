"""
Core Data Types and Enums for VUE 3D Canvas (Python Edition)
Author: Victory Ukpong
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Tuple
import numpy as np

class ShadingMode(Enum):
    DEF = "default"      # Original file normals
    SMOOTH = "smooth"    # Angle-weighted shared vertex normals
    FLAT = "flat"        # Faceted per-face normals

class ThemeMode(Enum):
    CS5 = "cs5"          # #333333 Photoshop CS5 Dark Gray
    BW78 = "bw78"        # #141414 78% Black & White Minimalist
    MODERN = "modern"    # #13161d Modern Studio Slate
    PS2022 = "ps2022"    # #1f1f1f Photoshop 2022 Flat Graphite

class ToolType(Enum):
    BRUSH = "brush"
    ERASER = "eraser"
    SMUDGE = "smudge"
    BLUR = "blur"
    CLONE = "clone"
    EYEDROPPER = "eyedropper"
    HAND = "hand"
    ZOOM = "zoom"

class MaskType(Enum):
    NONE = "none"
    GRUNGE = "grunge"
    SPLAT = "splat"
    SCRATCH = "scratch"
    DOTS = "dots"
    NOISE = "noise"
    CRACKS = "cracks"

class PatternType(Enum):
    NONE = "none"
    CHECKER = "checker"
    CARBON = "carbon"
    HALFTONE = "halftone"
    LEATHER = "leather"
    WOOD = "wood"
    WEAVE = "weave"

@dataclass
class Layer:
    id: str
    name: str
    width: int
    height: int
    pixels: np.ndarray          # RGBA uint8 array (height, width, 4)
    opacity: float = 1.0        # 0.0 to 1.0
    visible: bool = True
    locked: bool = False
    blend_mode: str = "normal"

@dataclass
class BrushPreset:
    name: str
    size: float = 24.0
    opacity: float = 100.0
    flow: float = 100.0
    hardness: float = 95.0
    spacing: float = 12.0
    scatter: float = 0.0
    stabilizer: float = 20.0
    color: Tuple[int, int, int, int] = (230, 230, 230, 255)
    stroke_type: str = "space"
    mask_type: MaskType = MaskType.NONE
    pattern_type: PatternType = PatternType.NONE
    mask_scale: float = 1.0
    pattern_scale: float = 1.0
    stencil_url: Optional[str] = None

@dataclass
class Camera:
    radius: float = 4.8
    theta: float = 0.78
    phi: float = 1.15
    target: np.ndarray = field(default_factory=lambda: np.zeros(3, dtype=np.float32))
    is_orbiting: bool = False
    is_panning: bool = False
    is_drone_mode: bool = False
    last_mouse_x: float = 0.0
    last_mouse_y: float = 0.0
