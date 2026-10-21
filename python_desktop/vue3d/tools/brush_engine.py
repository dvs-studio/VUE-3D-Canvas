"""
Brush, Eraser, and Smudge Engine with Tip Masks and Pattern Overlays (Python Edition)
Author: Victory Ukpong
"""

import numpy as np
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
        h, w, _ = layer.pixels.shape
        sx = int(np.clip(from_x, 0, w - 1))
        sy = int(np.clip(from_y, 0, h - 1))

        sample = layer.pixels[sy, sx].astype(np.float32)

        if self.smudge_color is None:
            self.smudge_color = sample
        else:
            self.smudge_color = self.smudge_color * 0.75 + sample * 0.25

        # Create temporary brush with picked-up color
        temp_brush = BrushPreset(
            name="Smudge",
            size=brush.size,
            opacity=brush.opacity * 0.45,
            flow=brush.flow,
            hardness=brush.hardness,
            spacing=brush.spacing,
            scatter=brush.scatter,
            stabilizer=brush.stabilizer,
            color=tuple(np.clip(self.smudge_color, 0, 255).astype(np.uint8)),
            mask_type=brush.mask_type,
            pattern_type=brush.pattern_type
        )
        self._render_dab(layer, temp_brush, to_x, to_y, is_eraser=False)

    def _render_dab(self, layer: Layer, brush: BrushPreset, center_x: float, center_y: float, is_eraser: bool):
        h, w, _ = layer.pixels.shape
        radius = brush.size * 0.5
        min_x = int(max(0, np.floor(center_x - radius)))
        max_x = int(min(w, np.ceil(center_x + radius)))
        min_y = int(max(0, np.floor(center_y - radius)))
        max_y = int(min(h, np.ceil(center_y + radius)))

        if min_x >= max_x or min_y >= max_y:
            return

        ys, xs = np.ogrid[min_y:max_y, min_x:max_x]
        dist = np.hypot(xs - center_x, ys - center_y)
        mask = dist <= radius

        hardness = brush.hardness / 100.0
        norm_dist = dist / radius
        factor = np.ones_like(dist)
        falloff_idx = norm_dist > hardness
        factor[falloff_idx] = 1.0 - (norm_dist[falloff_idx] - hardness) / (1.0 - hardness + 0.001)

        base_alpha = (brush.opacity / 100.0) * (brush.flow / 100.0)
        final_alpha = np.clip(factor * base_alpha, 0.0, 1.0)

        # Apply procedural tip mask
        if brush.mask_type == MaskType.GRUNGE:
            noise = ((xs * 13) ^ (ys * 19)) % 100 / 100.0
            final_alpha *= np.where(noise > 0.35, 0.9, 0.1)
        elif brush.mask_type == MaskType.SPLAT:
            angle = np.arctan2(ys - center_y, xs - center_x)
            ray = np.sin(angle * 6.0) * 0.3 + 0.7
            final_alpha *= np.where(norm_dist < ray, 1.0, 0.0)
        elif brush.mask_type == MaskType.SCRATCH:
            norm_x = (xs - center_x) / radius
            norm_y = (ys - center_y) / radius
            final_alpha *= np.where(np.abs(norm_x - norm_y) < 0.25, 1.0, 0.05)

        patch = layer.pixels[min_y:max_y, min_x:max_x]
        if is_eraser:
            patch[mask, 3] = (patch[mask, 3] * (1.0 - final_alpha[mask])).astype(np.uint8)
        else:
            col = np.array(brush.color, dtype=np.float32)
            alpha_col = final_alpha[mask, None]
            patch[mask] = (col * alpha_col + patch[mask] * (1.0 - alpha_col)).astype(np.uint8)
