"""
Photoshop CS5 UI Theme Definitions and Layout Models (Python Edition)
Author: Victory Ukpong
"""

from typing import Dict, Any
from ..core.types import ThemeMode

class PhotoshopCS5Skin:
    PALETTES: Dict[ThemeMode, Dict[str, str]] = {
        ThemeMode.CS5: {
            "bg": "#333333",
            "panel": "#2b2b2b",
            "panel_dark": "#222222",
            "panel_light": "#3c3c3c",
            "border": "#444444",
            "text": "#c8c8c8",
            "text_bright": "#eeeeee",
            "accent": "#3d7fb8"
        },
        ThemeMode.BW78: {
            "bg": "#141414",
            "panel": "#202020",
            "panel_dark": "#181818",
            "panel_light": "#2c2c2c",
            "border": "#383838",
            "text": "#d8d8d8",
            "text_bright": "#ffffff",
            "accent": "#e0e0e0"
        },
        ThemeMode.MODERN: {
            "bg": "#13161d",
            "panel": "#1e2430",
            "panel_dark": "#161b24",
            "panel_light": "#272f3d",
            "border": "#2d3647",
            "text": "#cbd5e1",
            "text_bright": "#f8fafc",
            "accent": "#6366f1"
        },
        ThemeMode.PS2022: {
            "bg": "#1f1f1f",
            "panel": "#282828",
            "panel_dark": "#202020",
            "panel_light": "#323232",
            "border": "#3a3a3a",
            "text": "#cccccc",
            "text_bright": "#ffffff",
            "accent": "#1473e6"
        }
    }

    DEFAULT_PRESETS = [
        {"name": "Hard Round Pen", "size": 24, "hardness": 95, "opacity": 100, "mask": "none"},
        {"name": "Soft Airbrush", "size": 52, "hardness": 15, "opacity": 80, "mask": "none"},
        {"name": "Charcoal Grit", "size": 42, "hardness": 85, "opacity": 90, "mask": "grunge"},
        {"name": "Splatter Ink", "size": 36, "hardness": 90, "opacity": 100, "mask": "splat"},
        {"name": "Rough Scratch", "size": 28, "hardness": 95, "opacity": 95, "mask": "scratch"},
        {"name": "Stipple Dots", "size": 30, "hardness": 80, "opacity": 90, "mask": "dots"},
        {"name": "Weathered Cracks", "size": 48, "hardness": 95, "opacity": 100, "mask": "cracks"},
    ]

    @classmethod
    def get_theme_colors(cls, theme: ThemeMode) -> Dict[str, str]:
        return cls.PALETTES.get(theme, cls.PALETTES[ThemeMode.CS5])
