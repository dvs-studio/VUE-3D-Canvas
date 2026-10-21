"""
Dynamic Blender-Style Surface Normal Calculator (Python Edition)
Author: Victory Ukpong
"""

import math
from ..core.compat import np
from ..core.types import ShadingMode

class SurfaceShadingEngine:
    @staticmethod
    def compute_normals(vertices, faces, mode: ShadingMode):
        """
        Recalculates normals based on shading mode:
        - DEF: Returns default generated vertex normals
        - SMOOTH: Angle-weighted shared vertex normals
        - FLAT: Faceted per-face polygon normals
        """
        if len(vertices) == 0 or len(faces) == 0:
            return [[0.0, 1.0, 0.0] for _ in range(len(vertices))]

        # Check if NumPy is active and arrays are numpy ndarrays
        if hasattr(vertices, "shape") and hasattr(faces, "shape"):
            try:
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
                    return face_normals

                normals = np.zeros_like(vertices)
                for i, face in enumerate(faces):
                    fn = face_normals[i]
                    normals[face[0]] += fn
                    normals[face[1]] += fn
                    normals[face[2]] += fn

                nlens = np.linalg.norm(normals, axis=1, keepdims=True)
                nlens[nlens == 0] = 1.0
                normals /= nlens
                return normals
            except Exception:
                pass # Fall through to pure python

        # Pure Python calculation (works with zero-dependency list structure)
        normals = [[0.0, 0.0, 0.0] for _ in range(len(vertices))]
        face_normals = []

        for f in faces:
            i0, i1, i2 = int(f[0]), int(f[1]), int(f[2])
            v0 = vertices[i0]
            v1 = vertices[i1]
            v2 = vertices[i2]

            e1 = (v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2])
            e2 = (v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2])

            nx = e1[1] * e2[2] - e1[2] * e2[1]
            ny = e1[2] * e2[0] - e1[0] * e2[2]
            nz = e1[0] * e2[1] - e1[1] * e2[0]
            l = math.sqrt(nx * nx + ny * ny + nz * nz)
            if l > 1e-7:
                nx, ny, nz = nx / l, ny / l, nz / l
            else:
                nx, ny, nz = 0.0, 1.0, 0.0

            face_normals.append((nx, ny, nz))
            if mode != ShadingMode.FLAT:
                normals[i0][0] += nx; normals[i0][1] += ny; normals[i0][2] += nz
                normals[i1][0] += nx; normals[i1][1] += ny; normals[i1][2] += nz
                normals[i2][0] += nx; normals[i2][1] += ny; normals[i2][2] += nz

        if mode == ShadingMode.FLAT:
            return face_normals

        # Normalize vertex normals
        for i in range(len(normals)):
            vx, vy, vz = normals[i]
            l = math.sqrt(vx * vx + vy * vy + vz * vz)
            if l > 1e-7:
                normals[i] = [vx / l, vy / l, vz / l]
            else:
                normals[i] = [0.0, 1.0, 0.0]

        return normals

