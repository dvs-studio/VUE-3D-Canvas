"""
Dynamic Blender-Style Surface Normal Calculator (Python Edition)
Author: Victory Ukpong
"""

import numpy as np
from ..core.types import ShadingMode

class SurfaceShadingEngine:
    @staticmethod
    def compute_normals(vertices: np.ndarray, faces: np.ndarray, mode: ShadingMode) -> np.ndarray:
        """
        Recalculates normals based on shading mode:
        - DEF: Returns default generated vertex normals
        - SMOOTH: Angle-weighted shared vertex normals
        - FLAT: Faceted per-face polygon normals
        """
        if len(vertices) == 0 or len(faces) == 0:
            return np.zeros_like(vertices)

        normals = np.zeros_like(vertices)

        # Compute face normals
        v0 = vertices[faces[:, 0]]
        v1 = vertices[faces[:, 1]]
        v2 = vertices[faces[:, 2]]

        e1 = v1 - v0
        e2 = v2 - v0
        face_normals = np.cross(e1, e2)
        lens = np.linalg.norm(face_normals, axis=1, keepdims=True)
        lens[lens == 0] = 1.0
        face_normals /= lens

        if mode == ShadingMode.FLAT:
            # Duplicate vertices per face or assign face normal to each corner
            return face_normals

        # Smooth / Def: Accumulate to shared vertices
        for i, face in enumerate(faces):
            fn = face_normals[i]
            normals[face[0]] += fn
            normals[face[1]] += fn
            normals[face[2]] += fn

        # Normalize
        nlens = np.linalg.norm(normals, axis=1, keepdims=True)
        nlens[nlens == 0] = 1.0
        normals /= nlens
        return normals
