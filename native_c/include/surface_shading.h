/**
 * @file surface_shading.h
 * @brief Dynamic Blender-Style Surface Normal Calculator for Native C
 * @author Victory Ukpong
 */

#ifndef V3D_SURFACE_SHADING_H
#define V3D_SURFACE_SHADING_H

#include "vue3d.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Recalculates normals dynamically:
 * - V3D_SHADING_DEF: Preserves original input file normals
 * - V3D_SHADING_SMOOTH: Angle-weighted averaged vertex normals
 * - V3D_SHADING_FLAT: Per-face faceted polygon normals
 */
void v3d_compute_surface_normals(V3D_Mesh* mesh, V3D_SurfaceShadingMode mode);

#ifdef __cplusplus
}
#endif

#endif /* V3D_SURFACE_SHADING_H */
