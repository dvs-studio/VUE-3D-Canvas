/**
 * @file brush_engine.h
 * @brief 2D & 3D Brush, Eraser, and Smudge Engine with Mask & Pattern Modulations
 * @author Victory Ukpong
 */

#ifndef V3D_BRUSH_ENGINE_H
#define V3D_BRUSH_ENGINE_H

#include "vue3d.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    V3D_Vec2 stabilized_pos;
    V3D_Vec2 last_dab_pos;
    bool is_painting;
    V3D_ColorRGBA smudge_color;
    bool has_smudge_color;
} V3D_BrushState;

void v3d_brush_begin_stroke(V3D_BrushState* state, float x, float y);
void v3d_brush_paint_stroke(V3D_BrushState* state, V3D_Layer* layer, const V3D_Brush* brush, float to_x, float to_y, bool is_eraser);
void v3d_brush_apply_smudge(V3D_BrushState* state, V3D_Layer* layer, const V3D_Brush* brush, float from_x, float from_y, float to_x, float to_y);
void v3d_brush_end_stroke(V3D_BrushState* state);

#ifdef __cplusplus
}
#endif

#endif /* V3D_BRUSH_ENGINE_H */
