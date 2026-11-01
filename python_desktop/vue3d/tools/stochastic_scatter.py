"""
VUE 3D Canvas - Stochastic Layer Scattering Engine (Python Desktop Edition)
Created by Victory Ukpong

Distributes patterns, stamps, or stencils with controlled procedural variation,
deterministic Mulberry32 PRNG reproducibility, custom texture import,
physical color masking, and alpha-based outline dilation/blur.
"""

import math
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFilter, ImageOps


class MulberryPRNG:
    """Fast deterministic 32-bit PRNG (Mulberry32)."""

    def __init__(self, seed: int):
        self.state = int(seed) & 0xFFFFFFFF

    def next(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((self.state ^ (self.state >> 15)) * (1 | self.state)) & 0xFFFFFFFF
        t = (t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        val = ((t ^ (t >> 14)) & 0xFFFFFFFF)
        return val / 4294967296.0

    def next_range(self, min_val: float, max_val: float) -> float:
        return min_val + (max_val - min_val) * self.next()


class StochasticScatterConfig:
    def __init__(
        self,
        number_of_repeats: int = 0,
        stamp_density: int = 45,
        edge_blend_contrast: float = 0.35,
        scatter_strength: float = 0.75,
        random_seed: int = 1337,
        rotation_min: float = -180.0,
        rotation_max: float = 180.0,
        scale_min: float = 0.4,
        scale_max: float = 1.2,
        blend_mode: str = "NORMAL",
        stamp_type: str = "grunge",
        primary_color: str = "#e6e6e6",
        opacity: int = 85,
        custom_image: Optional[Image.Image] = None,
        use_physical_fill_color: bool = False,
        enable_outline: bool = False,
        outline_color: str = "#000000",
        outline_spread: int = 4,
        outline_blur: int = 2,
    ):
        self.number_of_repeats = number_of_repeats
        self.stamp_density = stamp_density
        self.edge_blend_contrast = edge_blend_contrast
        self.scatter_strength = scatter_strength
        self.random_seed = random_seed
        self.rotation_min = rotation_min
        self.rotation_max = rotation_max
        self.scale_min = scale_min
        self.scale_max = scale_max
        self.blend_mode = blend_mode
        self.stamp_type = stamp_type
        self.primary_color = primary_color
        self.opacity = opacity
        self.custom_image = custom_image
        self.use_physical_fill_color = use_physical_fill_color
        self.enable_outline = enable_outline
        self.outline_color = outline_color
        self.outline_spread = max(0, min(25, int(outline_spread)))
        self.outline_blur = max(0, min(20, int(outline_blur)))


def _hex_to_rgba(hex_code: str, alpha: int = 255) -> Tuple[int, int, int, int]:
    h = hex_code.lstrip('#')
    if len(h) == 3:
        h = ''.join([c * 2 for c in h])
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return (r, g, b, alpha)


class StochasticScatterEngine:
    @staticmethod
    def create_stamp_image(
        config: StochasticScatterConfig,
        base_size: int,
        prng: MulberryPRNG,
    ) -> Image.Image:
        """Creates a single stamp PIL RGBA image based on config."""
        raw_size = int(base_size)
        stamp = Image.new("RGBA", (raw_size, raw_size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(stamp)
        center = raw_size / 2.0
        radius = raw_size * 0.44
        col_rgba = _hex_to_rgba(config.primary_color, 255)

        st_type = config.stamp_type

        if st_type == "custom" and config.custom_image is not None:
            # Custom image texture stamp
            img = config.custom_image.convert("RGBA")
            aspect = img.width / max(1, img.height)
            draw_w = int(raw_size * 0.88)
            draw_h = int(raw_size * 0.88)
            if aspect > 1.0:
                draw_h = max(1, int(draw_w / aspect))
            else:
                draw_w = max(1, int(draw_h * aspect))
            resized = img.resize((draw_w, draw_h), Image.Resampling.LANCZOS)
            dx = int(center - draw_w / 2)
            dy = int(center - draw_h / 2)
            stamp.paste(resized, (dx, dy), resized)

            # If use_physical_fill_color is True, replace color while keeping alpha
            if config.use_physical_fill_color:
                r_col, g_col, b_col, _ = col_rgba
                r, g, b, a = stamp.split()
                colored = Image.merge("RGBA", (
                    Image.new("L", stamp.size, r_col),
                    Image.new("L", stamp.size, g_col),
                    Image.new("L", stamp.size, b_col),
                    a
                ))
                stamp = colored

        elif st_type == "grunge":
            for _ in range(28):
                ang = prng.next_range(0, math.pi * 2)
                dist = prng.next_range(0, radius)
                r = prng.next_range(2, radius * 0.35)
                cx = center + math.cos(ang) * dist
                cy = center + math.sin(ang) * dist
                alpha = int(prng.next_range(50, 220))
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(col_rgba[0], col_rgba[1], col_rgba[2], alpha))

        elif st_type == "splat":
            draw.ellipse([center - radius * 0.4, center - radius * 0.4, center + radius * 0.4, center + radius * 0.4], fill=col_rgba)
            for _ in range(18):
                ang = prng.next_range(0, math.pi * 2)
                dist = prng.next_range(radius * 0.35, radius * 0.95)
                dr = prng.next_range(1.5, radius * 0.16)
                cx = center + math.cos(ang) * dist
                cy = center + math.sin(ang) * dist
                draw.ellipse([cx - dr, cy - dr, cx + dr, cy + dr], fill=col_rgba)

        elif st_type == "scratch":
            for _ in range(7):
                x1 = prng.next_range(raw_size * 0.1, raw_size * 0.9)
                y1 = prng.next_range(raw_size * 0.1, raw_size * 0.9)
                length = prng.next_range(radius * 0.4, radius * 1.2)
                ang = prng.next_range(-0.4, 0.4)
                x2 = x1 + math.cos(ang) * length
                y2 = y1 + math.sin(ang) * length
                draw.line([(x1, y1), (x2, y2)], fill=col_rgba, width=max(2, int(radius * 0.08)))

        elif st_type == "dots":
            for _ in range(20):
                x = prng.next_range(raw_size * 0.1, raw_size * 0.9)
                y = prng.next_range(raw_size * 0.1, raw_size * 0.9)
                r = prng.next_range(radius * 0.06, radius * 0.24)
                draw.ellipse([x - r, y - r, x + r, y + r], fill=col_rgba)

        elif st_type == "hex":
            pts = []
            for i in range(6):
                a = (i * math.pi) / 3.0
                pts.append((center + math.cos(a) * radius, center + math.sin(a) * radius))
            draw.polygon(pts, fill=col_rgba)

        elif st_type == "stars":
            pts = []
            num_pts = 5
            for i in range(num_pts * 2):
                r = radius if i % 2 == 0 else radius * 0.45
                a = (i * math.pi) / num_pts - math.pi / 2.0
                pts.append((center + math.cos(a) * r, center + math.sin(a) * r))
            draw.polygon(pts, fill=col_rgba)

        else:
            # Default soft round dab
            draw.ellipse([center - radius, center - radius, center + radius, center + radius], fill=col_rgba)

        # Alpha outline generation
        if not config.enable_outline:
            return stamp

        spread = config.outline_spread
        blur = config.outline_blur
        out_rgba = _hex_to_rgba(config.outline_color, 255)
        pad = int(math.ceil(spread + blur * 2 + 6))

        # Pad canvas
        expanded = Image.new("RGBA", (raw_size + pad * 2, raw_size + pad * 2), (0, 0, 0, 0))
        expanded.paste(stamp, (pad, pad), stamp)

        # Extract alpha mask
        alpha = expanded.split()[3]
        if spread > 0:
            # Morphological dilation via MaxFilter
            filter_size = spread * 2 + 1
            dilated = alpha.filter(ImageFilter.MaxFilter(filter_size))
        else:
            dilated = alpha

        if blur > 0:
            dilated = dilated.filter(ImageFilter.GaussianBlur(blur))

        # Build colored outline
        r_out, g_out, b_out, _ = out_rgba
        outline_layer = Image.merge("RGBA", (
            Image.new("L", expanded.size, r_out),
            Image.new("L", expanded.size, g_out),
            Image.new("L", expanded.size, b_out),
            dilated
        ))

        # Paste stamp over outline
        outline_layer.paste(expanded, (0, 0), expanded)
        return outline_layer

    @staticmethod
    def apply_scatter(
        target_image: Image.Image,
        config: StochasticScatterConfig,
    ) -> Image.Image:
        """Applies stochastic pattern scattering across target PIL RGBA image."""
        w, h = target_image.size
        prng = MulberryPRNG(config.random_seed)

        # Calculate number of instances
        density_factor = config.stamp_density / 50.0
        repeats = config.number_of_repeats
        count = int(repeats * 8) if repeats > 0 else int(30 * density_factor * config.scatter_strength)
        count = max(4, min(300, count))

        base_dim = max(w, h)
        base_stamp_size = max(16, int(base_dim * 0.12))

        result = target_image.copy()

        for _ in range(count):
            stamp = StochasticScatterEngine.create_stamp_image(config, base_stamp_size, prng)

            # Random rotation
            rot = prng.next_range(config.rotation_min, config.rotation_max)
            # Random scale
            scale = prng.next_range(config.scale_min, config.scale_max)
            new_w = max(4, int(stamp.width * scale))
            new_h = max(4, int(stamp.height * scale))

            transformed = stamp.resize((new_w, new_h), Image.Resampling.BILINEAR)
            if abs(rot) > 0.5:
                transformed = transformed.rotate(rot, resample=Image.Resampling.BILINEAR, expand=True)

            # Random position
            px = prng.next_range(0, w) - transformed.width / 2.0
            py = prng.next_range(0, h) - transformed.height / 2.0

            # Opacity modulation
            alpha_mult = (config.opacity / 100.0)
            if alpha_mult < 1.0:
                r, g, b, a = transformed.split()
                a = a.point(lambda p: int(p * alpha_mult))
                transformed = Image.merge("RGBA", (r, g, b, a))

            result.paste(transformed, (int(px), int(py)), transformed)

        return result
