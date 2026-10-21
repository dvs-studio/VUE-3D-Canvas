"""
Brush, Eraser, and Smudge Engine with Tip Masks and Pattern Overlays (Python Edition)
Author: Victory Ukpong
"""

from ..core.compat import np
from typing import Tuple, Optional
from ..core.types import Layer, BrushPreset, MaskType

class BrushEngine:
    def __init__(self):
        self.stabilized_pos: Optional[Tuple[float, float]] = None
        self.last_dab_pos: Optional[Tuple[float, float]] = None
        self.smudge_color: Optional[np.ndarray] = None

    def begin_stroke(self, x: float, y: float):
        self.stabilized_pos = (x, y)
        self.last_dab_pos = (x, y)
        self.smudge_color = None

    def end_stroke(self):
        self.stabilized_pos = None
        self.last_dab_pos = None
        self.smudge_color = None

    def update_stabilizer(self, x: float, y: float, stabilizer_level: float) -> Tuple[float, float]:
        if self.stabilized_pos is None:
            self.stabilized_pos = (x, y)
            return (x, y)
        factor = max(0.08, 1.0 - (stabilizer_level / 100.0) * 0.90)
        sx = self.stabilized_pos[0] + (x - self.stabilized_pos[0]) * factor
        sy = self.stabilized_pos[1] + (y - self.stabilized_pos[1]) * factor
        self.stabilized_pos = (sx, sy)
        return self.stabilized_pos

    def paint_stroke(self, layer: Layer, brush: BrushPreset, to_x: float, to_y: float, is_eraser: bool = False):
        if self.last_dab_pos is None:
            self.begin_stroke(to_x, to_y)

        stabilized = self.update_stabilizer(to_x, to_y, brush.stabilizer)
        from_x, from_y = self.last_dab_pos
        dx = stabilized[0] - from_x
        dy = stabilized[1] - from_y
        dist = np.hypot(dx, dy)

        spacing_step = max(1.0, brush.size * (brush.spacing / 100.0))
        steps = max(1, int(dist / spacing_step))

        for i in range(1, steps + 1):
            t = i / steps
            cx = from_x + dx * t
            cy = from_y + dy * t
            self._render_dab(layer, brush, cx, cy, is_eraser)

        self.last_dab_pos = stabilized

    def apply_smudge(self, layer: Layer, brush: BrushPreset, from_x: float, from_y: float, to_x: float, to_y: float):
        h, w = len(layer.pixels), len(layer.pixels[0])
        sx = int(max(0, min(w - 1, from_x)))
        sy = int(max(0, min(h - 1, from_y)))

        sample = layer.pixels[sy][sx]
        if self.smudge_color is None:
            self.smudge_color = [sample[0], sample[1], sample[2], sample[3]]
        else:
            self.smudge_color[0] = int(self.smudge_color[0] * 0.75 + sample[0] * 0.25)
            self.smudge_color[1] = int(self.smudge_color[1] * 0.75 + sample[1] * 0.25)
            self.smudge_color[2] = int(self.smudge_color[2] * 0.75 + sample[2] * 0.25)
            self.smudge_color[3] = int(self.smudge_color[3] * 0.75 + sample[3] * 0.25)

        temp_brush = BrushPreset(
            name="Smudge",
            size=brush.size,
            opacity=brush.opacity * 0.45,
            flow=brush.flow,
            hardness=brush.hardness,
            spacing=brush.spacing,
            scatter=brush.scatter,
            stabilizer=brush.stabilizer,
            color=tuple(self.smudge_color),
            mask_type=brush.mask_type,
            pattern_type=brush.pattern_type
        )
        self._render_dab(layer, temp_brush, to_x, to_y, is_eraser=False)

    def _render_dab(self, layer: Layer, brush: BrushPreset, center_x: float, center_y: float, is_eraser: bool):
        import math
        h, w = len(layer.pixels), len(layer.pixels[0])
        radius = brush.size * 0.5
        min_x = int(max(0, math.floor(center_x - radius)))
        max_x = int(min(w, math.ceil(center_x + radius)))
        min_y = int(max(0, math.floor(center_y - radius)))
        max_y = int(min(h, math.ceil(center_y + radius)))

        if min_x >= max_x or min_y >= max_y:
            return

        hardness = brush.hardness / 100.0
        base_alpha = (brush.opacity / 100.0) * (brush.flow / 100.0)
        col = brush.color

        for y in range(min_y, max_y):
            for x in range(min_x, max_x):
                dx = x - center_x
                dy = y - center_y
                dist = math.hypot(dx, dy)
                if dist > radius:
                    continue

                norm_dist = dist / radius
                factor = 1.0
                if norm_dist > hardness:
                    factor = 1.0 - (norm_dist - hardness) / (1.0 - hardness + 0.001)

                mask_val = 1.0
                if brush.mask_type == MaskType.GRUNGE:
                    noise = (((x * 13) ^ (y * 19)) % 100) / 100.0
                    mask_val = 0.9 if noise > 0.35 else 0.1
                elif brush.mask_type == MaskType.SPLAT:
                    angle = math.atan2(dy, dx)
                    ray = math.sin(angle * 6.0) * 0.3 + 0.7
                    mask_val = 1.0 if norm_dist < ray else 0.0
                elif brush.mask_type == MaskType.SCRATCH:
                    norm_x = dx / radius
                    norm_y = dy / radius
                    mask_val = 1.0 if abs(norm_x - norm_y) < 0.25 else 0.05

                final_alpha = max(0.0, min(1.0, factor * base_alpha * mask_val))
                pixel = layer.pixels[y][x]
                if is_eraser:
                    pixel[3] = int(pixel[3] * (1.0 - final_alpha))
                else:
                    inv_a = 1.0 - final_alpha
                    pixel[0] = int(col[0] * final_alpha + pixel[0] * inv_a)
                    pixel[1] = int(col[1] * final_alpha + pixel[1] * inv_a)
                    pixel[2] = int(col[2] * final_alpha + pixel[2] * inv_a)
                    pixel[3] = max(pixel[3], int(col[3] * final_alpha))
