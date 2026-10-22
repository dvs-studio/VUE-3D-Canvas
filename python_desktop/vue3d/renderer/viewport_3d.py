"""
3D Viewport Navigation & Blender Drone Fly Engine (Python Edition)
Author: Victory Ukpong
"""

from ..core.compat import np
from ..core.types import Camera

class Viewport3DNavigation:
    @staticmethod
    def orbit(cam: Camera, dx: float, dy: float, invert: bool = False):
        sign = 1.0 if invert else -1.0
        cam.theta += dx * 0.008 * sign
        cam.phi += dy * 0.008 * sign
        # Continuous pitch without pole freeze
        cam.phi = max(0.001, min(np.pi - 0.001, cam.phi))

    @staticmethod
    def pan(cam: Camera, dx: float, dy: float):
        """Camera-relative planar panning along local right and up axes."""
        sin_t = np.sin(cam.theta)
        cos_t = np.cos(cam.theta)
        sin_p = np.sin(cam.phi)
        cos_p = np.cos(cam.phi)

        right = np.array([cos_t, 0.0, -sin_t], dtype=np.float32)
        up = np.array([-cos_p * sin_t, sin_p, -cos_p * cos_t], dtype=np.float32)

        speed = cam.radius * 0.0016
        cam.target += (-dx * right + dy * up) * speed

    @staticmethod
    def drone_fly(cam: Camera, forward: float, right: float, up: float, speed: float = 0.08):
        """Blender-style drone flight (WASD + QE + Shift boost)."""
        sin_t = np.sin(cam.theta)
        cos_t = np.cos(cam.theta)
        sin_p = np.sin(cam.phi)
        cos_p = np.cos(cam.phi)

        fwd_vec = np.array([-sin_p * sin_t, -cos_p, -sin_p * cos_t], dtype=np.float32)
        rgt_vec = np.array([cos_t, 0.0, -sin_t], dtype=np.float32)
        up_vec  = np.array([0.0, 1.0, 0.0], dtype=np.float32)

        cam.target += (forward * fwd_vec + right * rgt_vec + up * up_vec) * speed

    @staticmethod
    def zoom(cam: Camera, delta: float):
        factor = np.exp(-delta * 0.05)
        cam.radius = max(0.001, min(10000.0, cam.radius * factor))

    @staticmethod
    def get_eye_position(cam: Camera) -> np.ndarray:
        sin_t = np.sin(cam.theta)
        cos_t = np.cos(cam.theta)
        sin_p = np.sin(cam.phi)
        cos_p = np.cos(cam.phi)

        x = cam.radius * sin_p * sin_t
        y = cam.radius * cos_p
        z = cam.radius * sin_p * cos_t

        return np.array([x, y, z], dtype=np.float32) + cam.target
