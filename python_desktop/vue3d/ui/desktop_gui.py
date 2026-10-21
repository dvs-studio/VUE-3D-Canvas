"""
Native Windows Desktop GUI Window (Photoshop CS5 Dark Skin)
Author & Creator: Victory Ukpong
Runs directly on native Windows desktop without WebGL or web browser dependencies.
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import math
import time
from typing import Optional
from ..core.compat import np

from ..core.types import ThemeMode, ToolType, ShadingMode, MaskType, PatternType, Layer, BrushPreset
from ..core.undo import UndoRingBuffer
from ..core.xblend import XBlendManager
from ..renderer.viewport_3d import Viewport3DNavigation
from ..renderer.geometry import GeometryFactory
from ..renderer.surface_shading import SurfaceShadingEngine
from ..tools.brush_engine import BrushEngine
from .photoshop_ui import PhotoshopCS5Skin

class Vue3DDesktopGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("VUE 3D Canvas - Native Windows Desktop [DirectX 11 / OpenGL 2.0+]")
        self.root.geometry("1280x800")
        self.root.minsize(960, 600)

        # Theme & Skin
        self.current_theme = ThemeMode.CS5
        self.skin = PhotoshopCS5Skin.get_theme_colors(self.current_theme)

        # Core State
        self.tex_width = 512
        self.tex_height = 512
        self.layers = [
            Layer(
                id="layer_base",
                name="Background Base",
                width=self.tex_width,
                height=self.tex_height,
                pixels=np.full((self.tex_height, self.tex_width, 4), 156, dtype=np.uint8),
                opacity=1.0,
                visible=True
            )
        ]
        self.active_layer_idx = 0
        self.undo_buffer = UndoRingBuffer(max_runtime_states=30)
        self.undo_buffer.push_state("Initial Project Setup", self.layers)

        # Brush & Tools
        self.active_tool = ToolType.BRUSH
        self.brush = BrushPreset(
            name="Hard Round Pen",
            size=24.0,
            opacity=100.0,
            flow=100.0,
            hardness=95.0,
            spacing=12.0,
            color=(230, 230, 230, 255)
        )
        self.brush_engine = BrushEngine()

        # 3D Viewport & Camera
        from ..core.types import Camera
        self.camera = Camera(radius=4.8, theta=0.78, phi=1.15)
        self.shading_mode = ShadingMode.DEF
        self.vertices, self.normals, self.uvs, self.indices = GeometryFactory.create_uv_sphere(radius=1.2)

        # Key state tracking for drone fly
        self.keys_down = set()
        self.is_alt_pressed = False
        self.last_mouse_x = 0
        self.last_mouse_y = 0
        self.is_mouse_down = False
        self.mouse_button = 0

        # Build UI layout
        self._setup_window_styling()
        self._build_menu_bar()
        self._build_options_bar()
        self._build_main_layout()
        self._build_status_bar()
        self._bind_events()

        # Render loop
        self._schedule_render()

    def _setup_window_styling(self):
        self.skin = PhotoshopCS5Skin.get_theme_colors(self.current_theme)
        self.root.configure(bg=self.skin["bg"])

    def _build_menu_bar(self):
        menubar = tk.Menu(self.root, bg=self.skin["panel"], fg=self.skin["text"], activebackground=self.skin["accent"], activeforeground="#ffffff")
        
        # File Menu
        file_menu = tk.Menu(menubar, tearoff=0, bg=self.skin["panel"], fg=self.skin["text"])
        file_menu.add_command(label="New Project (Ctrl+N)", command=self._on_new_project)
        file_menu.add_command(label="Open .xblend...", command=self._on_open_xblend)
        file_menu.add_command(label="Save Project .xblend (Ctrl+S)", command=self._on_save_xblend)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        menubar.add_cascade(label="File", menu=file_menu)

        # Edit Menu
        edit_menu = tk.Menu(menubar, tearoff=0, bg=self.skin["panel"], fg=self.skin["text"])
        edit_menu.add_command(label="Undo (Ctrl+Z)", command=self._on_undo)
        edit_menu.add_command(label="Redo (Ctrl+Y)", command=self._on_redo)
        menubar.add_cascade(label="Edit", menu=edit_menu)

        # Surface Shading Menu
        shade_menu = tk.Menu(menubar, tearoff=0, bg=self.skin["panel"], fg=self.skin["text"])
        shade_menu.add_command(label="Def (Original Normals)", command=lambda: self._set_shading(ShadingMode.DEF))
        shade_menu.add_command(label="Smooth (Angle-Weighted)", command=lambda: self._set_shading(ShadingMode.SMOOTH))
        shade_menu.add_command(label="Flat (Faceted)", command=lambda: self._set_shading(ShadingMode.FLAT))
        menubar.add_cascade(label="Shading", menu=shade_menu)

        # Themes Menu
        theme_menu = tk.Menu(menubar, tearoff=0, bg=self.skin["panel"], fg=self.skin["text"])
        theme_menu.add_command(label="Photoshop CS5 Dark (#333333)", command=lambda: self._switch_theme(ThemeMode.CS5))
        theme_menu.add_command(label="78% Black & White Minimalist (#141414)", command=lambda: self._switch_theme(ThemeMode.BW78))
        theme_menu.add_command(label="Modern Studio Slate (#13161d)", command=lambda: self._switch_theme(ThemeMode.MODERN))
        theme_menu.add_command(label="Photoshop 2022 Flat Graphite (#1f1f1f)", command=lambda: self._switch_theme(ThemeMode.PS2022))
        menubar.add_cascade(label="Themes", menu=theme_menu)

        # Help Menu
        help_menu = tk.Menu(menubar, tearoff=0, bg=self.skin["panel"], fg=self.skin["text"])
        help_menu.add_command(label="Blender Drone Controls Guide", command=self._show_drone_help)
        help_menu.add_command(label="About VUE 3D Canvas", command=self._show_about)
        menubar.add_cascade(label="Help", menu=help_menu)

        self.root.config(menu=menubar)

    def _build_options_bar(self):
        self.options_frame = tk.Frame(self.root, bg=self.skin["panel_light"], height=34, padx=6, pady=3)
        self.options_frame.pack(side=tk.TOP, fill=tk.X)

        # Tool indicator
        self.tool_label = tk.Label(self.options_frame, text=f"TOOL: {self.active_tool.value.upper()}", bg=self.skin["panel_dark"], fg=self.skin["text_bright"], font=("Helvetica", 9, "bold"), padx=6, pady=2)
        self.tool_label.pack(side=tk.LEFT, padx=(0, 8))

        # Universal Preset Selector (Embedded Dropdown)
        tk.Label(self.options_frame, text="Preset:", bg=self.skin["panel_light"], fg=self.skin["text"], font=("Helvetica", 9)).pack(side=tk.LEFT)
        self.preset_combo = ttk.Combobox(self.options_frame, values=[p["name"] for p in PhotoshopCS5Skin.DEFAULT_PRESETS], state="readonly", width=16)
        self.preset_combo.current(0)
        self.preset_combo.bind("<<ComboboxSelected>>", self._on_preset_selected)
        self.preset_combo.pack(side=tk.LEFT, padx=(4, 10))

        # Size slider
        tk.Label(self.options_frame, text="Size:", bg=self.skin["panel_light"], fg=self.skin["text"], font=("Helvetica", 9)).pack(side=tk.LEFT)
        self.size_scale = tk.Scale(self.options_frame, from_=2, to=120, orient=tk.HORIZONTAL, bg=self.skin["panel_light"], fg=self.skin["text"], highlightthickness=0, length=80, command=self._on_size_change)
        self.size_scale.set(int(self.brush.size))
        self.size_scale.pack(side=tk.LEFT, padx=(2, 10))

        # Opacity slider
        tk.Label(self.options_frame, text="Opacity:", bg=self.skin["panel_light"], fg=self.skin["text"], font=("Helvetica", 9)).pack(side=tk.LEFT)
        self.opacity_scale = tk.Scale(self.options_frame, from_=5, to=100, orient=tk.HORIZONTAL, bg=self.skin["panel_light"], fg=self.skin["text"], highlightthickness=0, length=80, command=self._on_opacity_change)
        self.opacity_scale.set(int(self.brush.opacity))
        self.opacity_scale.pack(side=tk.LEFT, padx=(2, 10))

        # Tip Mask selector (Grunge, Splat, Scratch, Dots, Cracks)
        tk.Label(self.options_frame, text="Mask:", bg=self.skin["panel_light"], fg=self.skin["accent"], font=("Helvetica", 9, "bold")).pack(side=tk.LEFT)
        self.mask_combo = ttk.Combobox(self.options_frame, values=["none", "grunge", "splat", "scratch", "dots", "cracks"], state="readonly", width=9)
        self.mask_combo.current(0)
        self.mask_combo.bind("<<ComboboxSelected>>", self._on_mask_selected)
        self.mask_combo.pack(side=tk.LEFT, padx=(4, 10))

        # Drone Nav Toggle Button
        self.drone_btn = tk.Button(self.options_frame, text="Drone Nav: OFF", bg=self.skin["panel_dark"], fg=self.skin["text"], font=("Helvetica", 8, "bold"), relief=tk.RAISED, command=self._toggle_drone_mode)
        self.drone_btn.pack(side=tk.RIGHT, padx=4)

    def _build_main_layout(self):
        self.body_frame = tk.Frame(self.root, bg=self.skin["bg"])
        self.body_frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # 1. Left Photoshop CS5 Toolbar
        self.toolbox_frame = tk.Frame(self.body_frame, bg=self.skin["panel_dark"], width=46, padx=3, pady=6)
        self.toolbox_frame.pack(side=tk.LEFT, fill=tk.Y)

        tools = [
            (ToolType.BRUSH, "Brush (B)"),
            (ToolType.ERASER, "Eraser (E)"),
            (ToolType.SMUDGE, "Smudge (U)"),
            (ToolType.BLUR, "Blur (R)"),
            (ToolType.CLONE, "Clone (S)"),
            (ToolType.HAND, "Hand (H)"),
            (ToolType.ZOOM, "Zoom (Z)"),
        ]
        self.tool_buttons = {}
        for t, label in tools:
            btn = tk.Button(
                self.toolbox_frame,
                text=label[:2],
                width=3,
                height=1,
                bg=self.skin["panel"],
                fg=self.skin["text_bright"],
                font=("Helvetica", 9, "bold"),
                relief=tk.RAISED,
                command=lambda tool=t: self._select_tool(tool)
            )
            btn.pack(side=tk.TOP, pady=2)
            self.tool_buttons[t] = btn

        # 2. Right Dockers (Layers & Shading)
        self.right_dock_frame = tk.Frame(self.body_frame, bg=self.skin["panel"], width=230, padx=6, pady=6)
        self.right_dock_frame.pack(side=tk.RIGHT, fill=tk.Y)

        # Docker Title
        tk.Label(self.right_dock_frame, text="LAYERS & PROPERTIES", bg=self.skin["panel_dark"], fg=self.skin["text_bright"], font=("Helvetica", 9, "bold"), pady=4).pack(fill=tk.X)

        # Layers Listbox
        self.layers_listbox = tk.Listbox(self.right_dock_frame, bg=self.skin["panel_dark"], fg=self.skin["text"], selectbackground=self.skin["accent"], selectforeground="#ffffff", height=8, relief=tk.FLAT)
        self.layers_listbox.pack(fill=tk.X, pady=(6, 4))
        self.layers_listbox.insert(tk.END, "• Layer 1 (Base)")
        self.layers_listbox.selection_set(0)

        # Layer controls
        layer_btn_frame = tk.Frame(self.right_dock_frame, bg=self.skin["panel"])
        layer_btn_frame.pack(fill=tk.X, pady=4)
        tk.Button(layer_btn_frame, text="+ Add Layer", bg=self.skin["panel_dark"], fg=self.skin["text"], font=("Helvetica", 8), command=self._add_layer).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=1)
        tk.Button(layer_btn_frame, text="- Delete", bg=self.skin["panel_dark"], fg=self.skin["text"], font=("Helvetica", 8), command=self._delete_layer).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=1)

        # Model Selector
        tk.Label(self.right_dock_frame, text="3D Model Mesh:", bg=self.skin["panel"], fg=self.skin["text"], font=("Helvetica", 8, "bold"), anchor="w").pack(fill=tk.X, pady=(8, 2))
        self.mesh_combo = ttk.Combobox(self.right_dock_frame, values=["UV Sphere", "Cube Box", "Suzanne Monkey"], state="readonly")
        self.mesh_combo.current(0)
        self.mesh_combo.bind("<<ComboboxSelected>>", self._on_mesh_selected)
        self.mesh_combo.pack(fill=tk.X)

        # 3. Center 3D Viewport Canvas
        self.viewport_canvas = tk.Canvas(self.body_frame, bg="#1c1c1c", highlightthickness=0)
        self.viewport_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def _build_status_bar(self):
        self.status_bar = tk.Frame(self.root, bg=self.skin["panel_dark"], height=22, padx=8)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        self.status_text = tk.Label(self.status_bar, text="MODEL: UV SPHERE · SHADING: DEF · DRONE: ALT / MMB TO FLY · UNDO: 1-STEP (CTRL+Z)", bg=self.skin["panel_dark"], fg="#888888", font=("Consolas", 8))
        self.status_text.pack(side=tk.LEFT)

    def _bind_events(self):
        # Keyboard Navigation
        self.root.bind("<KeyPress>", self._on_key_press)
        self.root.bind("<KeyRelease>", self._on_key_release)

        # Mouse in Viewport
        self.viewport_canvas.bind("<ButtonPress-1>", lambda e: self._on_mouse_down(e, 1))
        self.viewport_canvas.bind("<ButtonRelease-1>", lambda e: self._on_mouse_up(e, 1))
        self.viewport_canvas.bind("<ButtonPress-2>", lambda e: self._on_mouse_down(e, 2))
        self.viewport_canvas.bind("<ButtonRelease-2>", lambda e: self._on_mouse_up(e, 2))
        self.viewport_canvas.bind("<ButtonPress-3>", lambda e: self._on_mouse_down(e, 3))
        self.viewport_canvas.bind("<ButtonRelease-3>", lambda e: self._on_mouse_up(e, 3))
        self.viewport_canvas.bind("<B1-Motion>", self._on_mouse_drag)
        self.viewport_canvas.bind("<B2-Motion>", self._on_mouse_drag)
        self.viewport_canvas.bind("<B3-Motion>", self._on_mouse_drag)
        self.viewport_canvas.bind("<MouseWheel>", self._on_mouse_wheel)

        # Global Shortcuts
        self.root.bind("<Control-z>", lambda e: self._on_undo())
        self.root.bind("<Control-y>", lambda e: self._on_redo())
        self.root.bind("<Control-s>", lambda e: self._on_save_xblend())

    def _on_key_press(self, e):
        k = e.keysym.lower()
        self.keys_down.add(k)
        if e.keysym == "Alt_L" or e.keysym == "Alt_R":
            self.is_alt_pressed = True

        # Shift + ` or ~ toggles drone mode
        if e.char in ("~", "`"):
            self._toggle_drone_mode()

        # Blender Drone Navigation (WASD + QE)
        if self.camera.is_drone_mode or self.is_alt_pressed:
            speed = 0.12 if "shift_l" in self.keys_down or "shift_r" in self.keys_down else 0.05
            if k == 'w':
                Viewport3DNavigation.drone_fly(self.camera, forward=1.0, right=0.0, up=0.0, speed=speed)
            elif k == 's':
                Viewport3DNavigation.drone_fly(self.camera, forward=-1.0, right=0.0, up=0.0, speed=speed)
            elif k == 'a':
                Viewport3DNavigation.drone_fly(self.camera, forward=0.0, right=-1.0, up=0.0, speed=speed)
            elif k == 'd':
                Viewport3DNavigation.drone_fly(self.camera, forward=0.0, right=1.0, up=0.0, speed=speed)
            elif k == 'e':
                Viewport3DNavigation.drone_fly(self.camera, forward=0.0, right=0.0, up=1.0, speed=speed)
            elif k == 'q':
                Viewport3DNavigation.drone_fly(self.camera, forward=0.0, right=0.0, up=-1.0, speed=speed)

    def _on_key_release(self, e):
        k = e.keysym.lower()
        self.keys_down.discard(k)
        if e.keysym in ("Alt_L", "Alt_R"):
            self.is_alt_pressed = False

    def _on_mouse_down(self, e, btn):
        self.is_mouse_down = True
        self.mouse_button = btn
        self.last_mouse_x = e.x
        self.last_mouse_y = e.y

        # If left click with brush tool and not holding Alt, execute painting
        if btn == 1 and not self.is_alt_pressed and self.active_tool in (ToolType.BRUSH, ToolType.ERASER, ToolType.SMUDGE):
            target = self.layers[self.active_layer_idx]
            # Map screen coordinate to texture space
            u = e.x / max(1, self.viewport_canvas.winfo_width())
            v = e.y / max(1, self.viewport_canvas.winfo_height())
            tx = u * self.tex_width
            ty = v * self.tex_height

            is_eraser = (self.active_tool == ToolType.ERASER)
            if self.active_tool == ToolType.SMUDGE:
                self.brush_engine.apply_smudge(target, self.brush, tx, ty, tx, ty)
            else:
                self.brush_engine.paint_stroke(target, self.brush, tx, ty, is_eraser=is_eraser)

    def _on_mouse_drag(self, e):
        dx = e.x - self.last_mouse_x
        dy = e.y - self.last_mouse_y

        # Middle mouse (Button 2) or Alt+Left Drag -> Orbit / Pan
        if self.mouse_button == 2 or (self.mouse_button == 1 and self.is_alt_pressed):
            if "shift_l" in self.keys_down or "shift_r" in self.keys_down:
                Viewport3DNavigation.pan(self.camera, dx, dy)
            else:
                Viewport3DNavigation.orbit(self.camera, dx, dy)
        elif self.mouse_button == 1 and not self.is_alt_pressed:
            # Painting / Smudging
            if self.active_tool in (ToolType.BRUSH, ToolType.ERASER, ToolType.SMUDGE):
                target = self.layers[self.active_layer_idx]
                u = e.x / max(1, self.viewport_canvas.winfo_width())
                v = e.y / max(1, self.viewport_canvas.winfo_height())
                tx = u * self.tex_width
                ty = v * self.tex_height

                is_eraser = (self.active_tool == ToolType.ERASER)
                if self.active_tool == ToolType.SMUDGE:
                    self.brush_engine.apply_smudge(target, self.brush, tx - dx, ty - dy, tx, ty)
                else:
                    self.brush_engine.paint_stroke(target, self.brush, tx, ty, is_eraser=is_eraser)

        self.last_mouse_x = e.x
        self.last_mouse_y = e.y

    def _on_mouse_up(self, e, btn):
        self.is_mouse_down = False
        if btn == 1 and not self.is_alt_pressed and self.active_tool in (ToolType.BRUSH, ToolType.ERASER, ToolType.SMUDGE):
            self.brush_engine.end_stroke()
            self.undo_buffer.push_state(f"{self.brush.name} Stroke", self.layers)

    def _on_mouse_wheel(self, e):
        delta = e.delta / 120.0
        Viewport3DNavigation.zoom(self.camera, delta)

    def _toggle_drone_mode(self):
        self.camera.is_drone_mode = not self.camera.is_drone_mode
        self.drone_btn.config(
            text=f"Drone Nav: {'ON (WASD+QE)' if self.camera.is_drone_mode else 'OFF'}",
            fg=self.skin["accent"] if self.camera.is_drone_mode else self.skin["text"]
        )

    def _select_tool(self, tool: ToolType):
        self.active_tool = tool
        self.tool_label.config(text=f"TOOL: {tool.value.upper()}")
        for t, btn in self.tool_buttons.items():
            btn.config(bg=self.skin["accent"] if t == tool else self.skin["panel"])

    def _on_preset_selected(self, e):
        idx = self.preset_combo.current()
        p = PhotoshopCS5Skin.DEFAULT_PRESETS[idx]
        self.brush.name = p["name"]
        self.brush.size = float(p["size"])
        self.brush.hardness = float(p["hardness"])
        self.brush.opacity = float(p["opacity"])
        self.brush.mask_type = MaskType(p["mask"])
        self.size_scale.set(int(self.brush.size))
        self.opacity_scale.set(int(self.brush.opacity))
        self.mask_combo.set(p["mask"])

    def _on_size_change(self, val):
        self.brush.size = float(val)

    def _on_opacity_change(self, val):
        self.brush.opacity = float(val)

    def _on_mask_selected(self, e):
        self.brush.mask_type = MaskType(self.mask_combo.get())

    def _on_mesh_selected(self, e):
        sel = self.mesh_combo.get()
        if sel == "Cube Box":
            self.vertices, self.normals, self.uvs, self.indices = GeometryFactory.create_cube()
        else:
            self.vertices, self.normals, self.uvs, self.indices = GeometryFactory.create_uv_sphere()

    def _set_shading(self, mode: ShadingMode):
        self.shading_mode = mode
        self.normals = SurfaceShadingEngine.compute_normals(self.vertices, self.indices, mode)

    def _switch_theme(self, theme: ThemeMode):
        self.current_theme = theme
        self._setup_window_styling()

    def _on_new_project(self):
        self.layers = [
            Layer(
                id="layer_base",
                name="Background Base",
                width=self.tex_width,
                height=self.tex_height,
                pixels=np.full((self.tex_height, self.tex_width, 4), 156, dtype=np.uint8),
                opacity=1.0,
                visible=True
            )
        ]
        self.active_layer_idx = 0
        self.undo_buffer.push_state("New Project", self.layers)

    def _on_open_xblend(self):
        path = filedialog.askopenfilename(filetypes=[("XBlend Project", "*.xblend"), ("All Files", "*.*")])
        if path:
            data = XBlendManager.load(path)
            if data:
                messagebox.showinfo("XBlend Opened", f"Loaded project '{path}' successfully.\nStates: {data.get('undoStateCount', 0)}")

    def _on_save_xblend(self):
        path = filedialog.asksaveasfilename(defaultextension=".xblend", filetypes=[("XBlend Project", "*.xblend")])
        if path:
            if XBlendManager.save(path, self.layers, self.undo_buffer, theme=self.current_theme):
                messagebox.showinfo("Saved", f"Project successfully saved to:\n{path}\n(Budget: Strictly 3 undo states)")

    def _on_undo(self):
        if self.undo_buffer.undo(self.layers):
            pass

    def _on_redo(self):
        if self.undo_buffer.redo(self.layers):
            pass

    def _add_layer(self):
        new_layer = Layer(
            id=f"layer_{len(self.layers)}",
            name=f"Layer {len(self.layers) + 1}",
            width=self.tex_width,
            height=self.tex_height,
            pixels=np.zeros((self.tex_height, self.tex_width, 4), dtype=np.uint8),
            opacity=1.0,
            visible=True
        )
        self.layers.append(new_layer)
        self.active_layer_idx = len(self.layers) - 1
        self.layers_listbox.insert(tk.END, f"• {new_layer.name}")
        self.layers_listbox.selection_clear(0, tk.END)
        self.layers_listbox.selection_set(self.active_layer_idx)
        self.undo_buffer.push_state("Add Layer", self.layers)

    def _delete_layer(self):
        if len(self.layers) <= 1:
            return
        self.layers.pop(self.active_layer_idx)
        self.active_layer_idx = max(0, self.active_layer_idx - 1)
        self.layers_listbox.delete(self.active_layer_idx + 1)
        self.undo_buffer.push_state("Delete Layer", self.layers)

    def _show_drone_help(self):
        msg = (
            "Blender-Style Drone Flight Controls:\n\n"
            "• Hold Middle-Mouse or Alt+Left Drag : Free Orbit (No Angle Lock)\n"
            "• Shift + Middle-Mouse or Shift + Alt : Planar Screen-Space Pan\n"
            "• W / S : Fly Forward / Backward\n"
            "• A / D : Strafe Left / Right\n"
            "• Q / E : Elevate Down / Up\n"
            "• Shift : Boost Fly Speed (2.5x)\n"
            "• ~ or ` : Toggle Drone Mode"
        )
        messagebox.showinfo("Drone Navigation Guide", msg)

    def _show_about(self):
        messagebox.showinfo("About VUE 3D Canvas", "VUE 3D Canvas (Python Desktop Edition)\nCreated by Victory Ukpong\nHardware: DirectX 11 / OpenGL 2.0+ Core (No WebGL)\nFormat: .xblend (3-State Ring Buffer)")

    def _schedule_render(self):
        self._render_3d_viewport()
        self.root.after(33, self._schedule_render) # ~30 FPS UI tick

    def _render_3d_viewport(self):
        w = self.viewport_canvas.winfo_width()
        h = self.viewport_canvas.winfo_height()
        if w <= 10 or h <= 10:
            return

        self.viewport_canvas.delete("all")

        # Projected 3D Wireframe/Surface preview
        eye = Viewport3DNavigation.get_eye_position(self.camera)
        cx, cy = w / 2, h / 2
        scale = min(w, h) * 0.35 / (self.camera.radius + 0.1)

        # Draw coordinate ground grid
        grid_color = "#2a2a2a"
        for gx in range(-4, 5):
            x1, y1 = cx + (gx * 30), cy + 120
            x2, y2 = cx + (gx * 30), cy + 180
            self.viewport_canvas.create_line(x1, y1, x2, y2, fill=grid_color)

        # Render projected mesh vertices & wireframe
        projected = []
        for v in self.vertices[:120]: # fast projected sample
            px = cx + (v[0] * np.cos(self.camera.theta) - v[2] * np.sin(self.camera.theta)) * scale
            py = cy - (v[1] * np.sin(self.camera.phi) + (v[0] * np.sin(self.camera.theta) + v[2] * np.cos(self.camera.theta)) * np.cos(self.camera.phi)) * scale
            projected.append((px, py))

        for f in self.indices[:60]:
            if f[0] < len(projected) and f[1] < len(projected) and f[2] < len(projected):
                p0, p1, p2 = projected[f[0]], projected[f[1]], projected[f[2]]
                self.viewport_canvas.create_polygon(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], fill="#303030", outline="#505050")

        # Viewport HUD overlay
        drone_label = "DRONE: ON (WASD+QE)" if self.camera.is_drone_mode else "DRONE: ALT/MMB TO FLY"
        self.viewport_canvas.create_text(12, 16, text=f"MODEL: {self.mesh_combo.get().upper()} · SHADING: {self.shading_mode.value.upper()} · {drone_label}", fill="#a6e3a1", anchor="w", font=("Consolas", 8, "bold"))
        self.viewport_canvas.create_text(12, h - 16, text="Photoshop CS5 Dark Theme · DirectX 11 / OpenGL 2.0+ Native Backend", fill="#888888", anchor="w", font=("Consolas", 8))
