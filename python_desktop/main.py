#!/usr/bin/env python3
"""
VUE 3D Canvas - Standalone Python Desktop Workstation
Author & Creator: Victory Ukpong
Target: Python 3.9+ with direct OpenGL 2.0+ & DirectX 11 Fallback Support
"""

import sys
import os
import time

from vue3d.core.compat import np

from vue3d.core.types import Layer, BrushPreset, Camera, ThemeMode, ToolType, ShadingMode, MaskType
from vue3d.core.undo import UndoRingBuffer
from vue3d.core.xblend import XBlendManager
from vue3d.renderer.viewport_3d import Viewport3DNavigation
from vue3d.renderer.surface_shading import SurfaceShadingEngine
from vue3d.renderer.geometry import GeometryFactory
from vue3d.tools.brush_engine import BrushEngine
from vue3d.ui.photoshop_ui import PhotoshopCS5Skin

BANNER = r"""
========================================================================
   __     ___   _ _____   ____  ____     ____                                
   \ \   / / | | | ____| |___ \|  _ \   / ___|__ _ _ ____   ____ _ ___       
    \ \ / /| | | |  _|     __) | | | | | |   / _` | '_ \ \ / / _` / __|      
     \ V / | |_| | |___   / __/| |_| | | |__| (_| | | | \ V / (_| \__ \      
      \_/   \___/|_____| |_____|____/   \____\__,_|_| |_|\_/ \__,_|___/      
========================================================================
  VUE 3D Canvas - Python Desktop Edition v0.1.0
  Author & Creator: Victory Ukpong
  Direct OpenGL 2.0+ & DirectX 11 Hardware Fallback Support
  Memory Budget: < 30 MB Heap, Max 3 States in .xblend
========================================================================
"""

class Vue3DDesktopApp:
    def __init__(self, tex_width: int = 1024, tex_height: int = 1024):
        self.tex_width = tex_width
        self.tex_height = tex_height
        self.theme = ThemeMode.CS5
        self.active_tool = ToolType.BRUSH

        # Layer Stack
        self.layers = [
            Layer(
                id="layer_base",
                name="Background Base",
                width=tex_width,
                height=tex_height,
                pixels=np.full((tex_height, tex_width, 4), 156, dtype=np.uint8),
                opacity=1.0,
                visible=True
            )
        ]
        self.active_layer_idx = 0

        # Undo Ring Buffer (Strictly 3 states in .xblend, 30 in session)
        self.undo_buffer = UndoRingBuffer(max_runtime_states=30)
        self.undo_buffer.push_state("Initial Project Setup", self.layers)

        # Active Brush
        self.brush = BrushPreset(
            name="Hard Round Pen",
            size=24.0,
            opacity=100.0,
            flow=100.0,
            hardness=95.0,
            spacing=12.0,
            scatter=0.0,
            stabilizer=20.0,
            color=(230, 230, 230, 255)
        )

        # 3D Viewport Camera
        self.camera = Camera(radius=4.8, theta=0.78, phi=1.15)
        self.brush_engine = BrushEngine()

        # Geometry
        self.vertices, self.normals, self.uvs, self.indices = GeometryFactory.create_uv_sphere(radius=1.2)
        self.shading_mode = ShadingMode.DEF

    def run_interactive_shell(self):
        print(BANNER)
        print("Initialization Successful:")
        print(f"  • Hardware Backend : OpenGL 2.0+ / DirectX 11 ANGLE Context")
        print(f"  • Surface Shading  : Dynamic Def / Smooth / Flat Normal Engine")
        print(f"  • Camera Engine    : Blender Drone Navigation (WASD+QE)")
        print(f"  • Undo Stack       : 1-Step Live Undo ({self.undo_buffer.max_states} states) + 3-State .xblend")
        print(f"  • Active Skin      : Photoshop CS5 Dark Theme (#333333)\n")
        print("Interactive Command Shell active. Type 'help', 'status', 'stroke', 'undo', 'save', or 'exit'.\n")

        while True:
            try:
                line = input("vue3d-py> ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nExiting VUE 3D Canvas.")
                break

            if not line:
                continue

            parts = line.split()
            cmd = parts[0].lower()
            args = parts[1:]

            if cmd in ("exit", "quit", "q"):
                print("Shutting down VUE 3D Canvas Desktop Python edition. Goodbye!")
                break
            elif cmd in ("help", "?"):
                print("\nCommands:")
                print("  status                - View memory footprint, layers, and camera parameters")
                print("  stroke [x1 y1 x2 y2]  - Paint brush stroke dab with lazy-mouse stabilizer")
                print("  smudge [x1 y1 x2 y2]  - Apply smudge pixel smear with tip mask texture")
                print("  erase [x y]           - Apply destination-out eraser dab")
                print("  undo                  - Undo 1 step (Ctrl+Z)")
                print("  redo                  - Redo 1 step (Ctrl+Y)")
                print("  save [filename]       - Save project to .xblend with 3-state ring buffer")
                print("  load <filename>       - Load project from .xblend")
                print("  shading <def|smooth|flat> - Change surface normal shading mode")
                print("  mesh <sphere|cube>    - Change active 3D geometry primitive")
                print("  drone [on|off]        - Toggle Blender drone flight navigation (WASD+QE)")
                print("  theme <cs5|bw78|modern|ps2022> - Switch UI theme")
                print("  exit                  - Safely close application\n")
            elif cmd == "status":
                eye = Viewport3DNavigation.get_eye_position(self.camera)
                print(f"\nStatus Report:")
                print(f"  Layers      : {len(self.layers)} active")
                print(f"  Texture     : {self.tex_width}x{self.tex_height} RGBA")
                print(f"  Mesh        : Vertices={len(self.vertices)}, Faces={len(self.indices)}")
                print(f"  Shading     : {self.shading_mode.value.upper()}")
                print(f"  Camera Eye  : X={eye[0]:.2f}, Y={eye[1]:.2f}, Z={eye[2]:.2f}")
                print(f"  Drone Nav   : {'ACTIVE (WASD+QE)' if self.camera.is_drone_mode else 'INACTIVE'}")
                print(f"  Undo Depth  : {len(self.undo_buffer.stack)} states (index: {self.undo_buffer.current_index})\n")
            elif cmd == "stroke":
                target = self.layers[self.active_layer_idx]
                x1, y1 = (float(args[0]), float(args[1])) if len(args) >= 2 else (256.0, 256.0)
                x2, y2 = (float(args[2]), float(args[3])) if len(args) >= 4 else (x1 + 64.0, y1 + 64.0)
                self.brush_engine.paint_stroke(target, self.brush, x1, y1)
                self.brush_engine.paint_stroke(target, self.brush, x2, y2)
                self.brush_engine.end_stroke()
                self.undo_buffer.push_state("Paint Stroke (Python)", self.layers)
                print(f"Painted brush stroke onto layer '{target.name}' from ({x1:.0f},{y1:.0f}) to ({x2:.0f},{y2:.0f}).")
            elif cmd == "smudge":
                target = self.layers[self.active_layer_idx]
                x1, y1 = (float(args[0]), float(args[1])) if len(args) >= 2 else (256.0, 256.0)
                x2, y2 = (float(args[2]), float(args[3])) if len(args) >= 4 else (x1 + 24.0, y1 + 24.0)
                self.brush_engine.apply_smudge(target, self.brush, x1, y1, x2, y2)
                self.undo_buffer.push_state("Smudge Dab (Python)", self.layers)
                print(f"Applied smudge smear onto layer '{target.name}'.")
            elif cmd == "erase":
                target = self.layers[self.active_layer_idx]
                x, y = (float(args[0]), float(args[1])) if len(args) >= 2 else (256.0, 256.0)
                self.brush_engine.paint_stroke(target, self.brush, x, y, is_eraser=True)
                self.brush_engine.end_stroke()
                self.undo_buffer.push_state("Eraser Dab (Python)", self.layers)
                print(f"Erased dab on layer '{target.name}' at ({x:.0f},{y:.0f}).")
            elif cmd == "undo":
                if self.undo_buffer.undo(self.layers):
                    print(f"Undone 1 step. Current snapshot index: {self.undo_buffer.current_index}")
                else:
                    print("Cannot undo: already at initial state.")
            elif cmd == "redo":
                if self.undo_buffer.redo(self.layers):
                    print(f"Redone 1 step. Current snapshot index: {self.undo_buffer.current_index}")
                else:
                    print("Cannot redo: at newest state.")
            elif cmd == "save":
                target_path = args[0] if args else "project_backup.xblend"
                if XBlendManager.save(target_path, self.layers, self.undo_buffer, theme=self.theme):
                    print(f"Project saved to '{target_path}' (strictly adhering to 3-state ring buffer limit).")
                else:
                    print(f"Failed to save {target_path}.")
            elif cmd == "load":
                if not args:
                    print("Usage: load <filename.xblend>")
                else:
                    data = XBlendManager.load(args[0])
                    if data:
                        print(f"Loaded '{args[0]}' successfully (undo states: {data.get('undoStateCount', 0)}).")
                    else:
                        print(f"Failed to load '{args[0]}'.")
            elif cmd == "shading":
                mode_str = args[0].lower() if args else "def"
                if mode_str in ("def", "smooth", "flat"):
                    self.shading_mode = ShadingMode(mode_str)
                    self.normals = SurfaceShadingEngine.compute_normals(self.vertices, self.indices, self.shading_mode)
                    print(f"Surface shading mode switched to: {self.shading_mode.value.upper()}")
                else:
                    print("Unknown mode. Valid options: def, smooth, flat")
            elif cmd == "mesh":
                primitive = args[0].lower() if args else "sphere"
                if primitive == "cube":
                    self.vertices, self.normals, self.uvs, self.indices = GeometryFactory.create_cube()
                    print(f"Geometry primitive changed to Cube Box ({len(self.vertices)} vertices).")
                else:
                    self.vertices, self.normals, self.uvs, self.indices = GeometryFactory.create_uv_sphere()
                    print(f"Geometry primitive changed to UV Sphere ({len(self.vertices)} vertices).")
            elif cmd == "drone":
                if args and args[0].lower() in ("on", "1", "true"):
                    self.camera.is_drone_mode = True
                elif args and args[0].lower() in ("off", "0", "false"):
                    self.camera.is_drone_mode = False
                else:
                    self.camera.is_drone_mode = not self.camera.is_drone_mode
                print(f"Blender Drone Navigation {'ENABLED (WASD+QE)' if self.camera.is_drone_mode else 'DISABLED'}.")
            elif cmd in ("axis", "flip"):
                if args and args[0].lower() in ("inv", "1", "inverted"):
                    self.invert_nav = True
                elif args and args[0].lower() in ("nat", "0", "natural"):
                    self.invert_nav = False
                else:
                    self.invert_nav = not getattr(self, "invert_nav", False)
                print(f"Navigation Axis Direction: {'INVERTED' if self.invert_nav else 'STANDARD NATURAL'}.")
            elif cmd == "theme":
                target_theme = args[0].lower() if args else "cs5"
                if target_theme in ("cs5", "bw78", "modern", "ps2022"):
                    self.theme = ThemeMode(target_theme)
                    print(f"UI theme set to {target_theme.upper()}.")
                else:
                    print("Available themes: cs5, bw78, modern, ps2022")
            else:
                print(f"Unknown command '{cmd}'. Type 'help' for available commands.")

def main():
    force_cli = "--cli" in sys.argv or "--console" in sys.argv or "-c" in sys.argv
    has_display = True
    if sys.platform.startswith("linux") and not os.environ.get("DISPLAY"):
        has_display = False

    if not force_cli and has_display:
        try:
            import tkinter as tk
            from vue3d.ui.desktop_gui import Vue3DDesktopGUI
            root = tk.Tk()
            gui = Vue3DDesktopGUI(root)
            root.mainloop()
            return
        except Exception as e:
            print(f"[Desktop GUI Warning] Unable to open native window ({e}). Falling back to interactive console shell.\n")

    app = Vue3DDesktopApp()
    app.run_interactive_shell()

if __name__ == "__main__":
    main()
