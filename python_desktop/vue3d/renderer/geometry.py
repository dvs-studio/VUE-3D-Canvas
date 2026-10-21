"""
Procedural 3D Mesh Geometries and OBJ Parser (Python Edition)
Author: Victory Ukpong
Full UV Range Assurance (0..1 spherical/cylindrical polar UV maps without overlapping gaps).
"""

from ..core.compat import np
from typing import Tuple

class GeometryFactory:
    @staticmethod
    def create_uv_sphere(radius: float = 1.0, segments: int = 24, rings: int = 16) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        verts = []
        uvs = []
        for i in range(rings + 1):
            theta = i * np.pi / rings
            sin_t = np.sin(theta)
            cos_t = np.cos(theta)
            v = 1.0 - (i / rings)

            for j in range(segments + 1):
                phi = j * 2.0 * np.pi / segments
                sin_p = np.sin(phi)
                cos_p = np.cos(phi)
                u = j / segments

                x = radius * sin_t * sin_p
                y = radius * cos_t
                z = radius * sin_t * cos_p

                verts.append([x, y, z])
                uvs.append([u, v])

        faces = []
        for i in range(rings):
            for j in range(segments):
                i0 = i * (segments + 1) + j
                i1 = i0 + (segments + 1)
                faces.append([i0, i1, i0 + 1])
                faces.append([i1, i1 + 1, i0 + 1])

        vertices = np.array(verts, dtype=np.float32)
        texcoords = np.array(uvs, dtype=np.float32)
        indices = np.array(faces, dtype=np.uint32)

        # Initial normals
        norm_list = []
        for x, y, z in verts:
            l = (x * x + y * y + z * z) ** 0.5
            if l > 0.0001:
                norm_list.append([x / l, y / l, z / l])
            else:
                norm_list.append([0.0, 1.0, 0.0])
        normals = np.array(norm_list, dtype=np.float32)
        return vertices, normals, texcoords, indices

    @staticmethod
    def create_cube(size: float = 1.6) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        h = size * 0.5
        v = [
            [-h, -h,  h], [ h, -h,  h], [ h,  h,  h], [-h,  h,  h],  # front
            [ h, -h, -h], [-h, -h, -h], [-h,  h, -h], [ h,  h, -h],  # back
        ]
        faces = [
            [0, 1, 2], [0, 2, 3],  # front
            [1, 4, 7], [1, 7, 2],  # right
            [4, 5, 6], [4, 6, 7],  # back
            [5, 0, 3], [5, 3, 6],  # left
            [3, 2, 7], [3, 7, 6],  # top
            [5, 4, 1], [5, 1, 0],  # bottom
        ]
        vertices = np.array(v, dtype=np.float32)
        indices = np.array(faces, dtype=np.uint32)
        normals = np.zeros_like(vertices)
        texcoords = np.zeros((len(vertices), 2), dtype=np.float32)
        return vertices, normals, texcoords, indices
