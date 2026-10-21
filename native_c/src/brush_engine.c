/**
 * @file brush_engine.c
 * @brief 2D & 3D Brush, Eraser, and Smudge Engine Implementation in C
 * @author Victory Ukpong
 */

#include "../include/brush_engine.h"
#include <stdlib.h>
#include <string.h>
#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

void v3d_brush_begin_stroke(V3D_BrushState* state, float x, float y) {
    if (!state) return;
    state->stabilized_pos = (V3D_Vec2){ x, y };
    state->last_dab_pos = (V3D_Vec2){ x, y };
    state->is_painting = true;
    state->has_smudge_color = false;
}

void v3d_brush_end_stroke(V3D_BrushState* state) {
    if (!state) return;
    state->is_painting = false;
    state->has_smudge_color = false;
}

static inline uint32_t blend_colors(uint32_t dst, uint32_t src, float alpha) {
    if (alpha <= 0.0f) return dst;
    if (alpha >= 1.0f) return src;

    uint8_t dr = (dst >> 0) & 0xFF;
    uint8_t dg = (dst >> 8) & 0xFF;
    uint8_t db = (dst >> 16) & 0xFF;
    uint8_t da = (dst >> 24) & 0xFF;

    uint8_t sr = (src >> 0) & 0xFF;
    uint8_t sg = (src >> 8) & 0xFF;
    uint8_t sb = (src >> 16) & 0xFF;
    uint8_t sa = (src >> 24) & 0xFF;

    float effective_a = (float)sa / 255.0f * alpha;
    float inv_a = 1.0f - effective_a;

    uint8_t out_r = (uint8_t)(sr * effective_a + dr * inv_a);
    uint8_t out_g = (uint8_t)(sg * effective_a + dg * inv_a);
    uint8_t out_b = (uint8_t)(sb * effective_a + db * inv_a);
    uint8_t out_a = (uint8_t)(sa * effective_a + da * inv_a);

    return ((uint32_t)out_r << 0) | ((uint32_t)out_g << 8) | ((uint32_t)out_b << 16) | ((uint32_t)out_a << 24);
}

static inline uint32_t erase_pixel(uint32_t dst, float alpha) {
    if (alpha <= 0.0f) return dst;
    uint8_t dr = (dst >> 0) & 0xFF;
    uint8_t dg = (dst >> 8) & 0xFF;
    uint8_t db = (dst >> 16) & 0xFF;
    uint8_t da = (dst >> 24) & 0xFF;

    float new_a = (float)da * (1.0f - alpha);
    if (new_a < 0.0f) new_a = 0.0f;

    return ((uint32_t)dr << 0) | ((uint32_t)dg << 8) | ((uint32_t)db << 16) | ((uint32_t)((uint8_t)new_a) << 24);
}

static float evaluate_mask(V3D_MaskType mask_type, float local_x, float local_y, float radius, float scale) {
    if (mask_type == V3D_MASK_NONE) return 1.0f;
    float norm_x = local_x / (radius * scale);
    float norm_y = local_y / (radius * scale);
    float dist = sqrtf(norm_x * norm_x + norm_y * norm_y);

    switch (mask_type) {
        case V3D_MASK_GRUNGE: {
            int seed = (int)(norm_x * 13.0f) ^ (int)(norm_y * 19.0f);
            float noise = (float)(abs(seed) % 100) / 100.0f;
            return noise > 0.35f ? 0.9f : 0.1f;
        }
        case V3D_MASK_SPLAT: {
            float angle = atan2f(norm_y, norm_x);
            float ray = sinf(angle * 6.0f) * 0.3f + 0.7f;
            return dist < ray ? 1.0f : 0.0f;
        }
        case V3D_MASK_SCRATCH: {
            float d_line = fabsf(norm_x - norm_y);
            return d_line < 0.25f ? 1.0f : 0.05f;
        }
        case V3D_MASK_DOTS: {
            float fx = fmodf(fabsf(local_x), 6.0f);
            float fy = fmodf(fabsf(local_y), 6.0f);
            return (fx * fx + fy * fy < 4.0f) ? 1.0f : 0.0f;
        }
        case V3D_MASK_CRACKS: {
            float noise1 = sinf(local_x * 0.3f) + cosf(local_y * 0.3f);
            return fabsf(noise1) < 0.2f ? 1.0f : 0.0f;
        }
        default:
            return 1.0f;
    }
}

static void render_dab(V3D_Layer* layer, const V3D_Brush* brush, float center_x, float center_y, bool is_eraser) {
    if (!layer || !layer->pixels) return;
    float radius = brush->size * 0.5f;
    int min_x = (int)floorf(center_x - radius);
    int max_x = (int)ceilf(center_x + radius);
    int min_y = (int)floorf(center_y - radius);
    int max_y = (int)ceilf(center_y + radius);

    if (min_x < 0) min_x = 0;
    if (min_y < 0) min_y = 0;
    if (max_x >= layer->width) max_x = layer->width - 1;
    if (max_y >= layer->height) max_y = layer->height - 1;

    float hardness = brush->hardness / 100.0f;
    float base_alpha = (brush->opacity / 100.0f) * (brush->flow / 100.0f);

    uint32_t brush_src_color = ((uint32_t)brush->color.r << 0) |
                               ((uint32_t)brush->color.g << 8) |
                               ((uint32_t)brush->color.b << 16) |
                               ((uint32_t)brush->color.a << 24);

    for (int y = min_y; y <= max_y; ++y) {
        for (int x = min_x; x <= max_x; ++x) {
            float dx = (float)x - center_x;
            float dy = (float)y - center_y;
            float dist = sqrtf(dx * dx + dy * dy);
            if (dist > radius) continue;

            float factor = 1.0f;
            float norm_dist = dist / radius;
            if (norm_dist > hardness) {
                factor = 1.0f - (norm_dist - hardness) / (1.0f - hardness + 0.001f);
            }

            float mask_val = evaluate_mask(brush->mask_type, dx, dy, radius, brush->mask_scale > 0 ? brush->mask_scale : 1.0f);
            float final_alpha = base_alpha * factor * mask_val;

            int idx = y * layer->width + x;
            if (is_eraser) {
                layer->pixels[idx] = erase_pixel(layer->pixels[idx], final_alpha);
            } else {
                layer->pixels[idx] = blend_colors(layer->pixels[idx], brush_src_color, final_alpha);
            }
        }
    }
}

void v3d_brush_paint_stroke(V3D_BrushState* state, V3D_Layer* layer, const V3D_Brush* brush, float to_x, float to_y, bool is_eraser) {
    if (!state || !layer || !brush) return;

    /* Lazy-mouse tether stabilizer */
    float factor = 1.0f - (brush->stabilizer / 100.0f) * 0.90f;
    if (factor < 0.08f) factor = 0.08f;
    state->stabilized_pos.x += (to_x - state->stabilized_pos.x) * factor;
    state->stabilized_pos.y += (to_y - state->stabilized_pos.y) * factor;

    float dx = state->stabilized_pos.x - state->last_dab_pos.x;
    float dy = state->stabilized_pos.y - state->last_dab_pos.y;
    float dist = sqrtf(dx * dx + dy * dy);

    float spacing_step = fmaxf(1.0f, brush->size * (brush->spacing / 100.0f));
    int steps = (int)floorf(dist / spacing_step);

    if (steps == 0) {
        render_dab(layer, brush, state->stabilized_pos.x, state->stabilized_pos.y, is_eraser);
        state->last_dab_pos = state->stabilized_pos;
    } else {
        for (int i = 1; i <= steps; ++i) {
            float t = (float)i / (float)steps;
            float cur_x = state->last_dab_pos.x + dx * t;
            float cur_y = state->last_dab_pos.y + dy * t;
            render_dab(layer, brush, cur_x, cur_y, is_eraser);
        }
        state->last_dab_pos = state->stabilized_pos;
    }
}

void v3d_brush_apply_smudge(V3D_BrushState* state, V3D_Layer* layer, const V3D_Brush* brush, float from_x, float from_y, float to_x, float to_y) {
    if (!state || !layer || !layer->pixels || !brush) return;

    int sx = (int)from_x;
    int sy = (int)from_y;
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx >= layer->width) sx = layer->width - 1;
    if (sy >= layer->height) sy = layer->height - 1;

    uint32_t sample = layer->pixels[sy * layer->width + sx];
    uint8_t sr = (sample >> 0) & 0xFF;
    uint8_t sg = (sample >> 8) & 0xFF;
    uint8_t sb = (sample >> 16) & 0xFF;
    uint8_t sa = (sample >> 24) & 0xFF;

    if (!state->has_smudge_color) {
        state->smudge_color = (V3D_ColorRGBA){ sr, sg, sb, sa };
        state->has_smudge_color = true;
    } else {
        state->smudge_color.r = (uint8_t)(state->smudge_color.r * 0.75f + sr * 0.25f);
        state->smudge_color.g = (uint8_t)(state->smudge_color.g * 0.75f + sg * 0.25f);
        state->smudge_color.b = (uint8_t)(state->smudge_color.b * 0.75f + sb * 0.25f);
        state->smudge_color.a = (uint8_t)(state->smudge_color.a * 0.75f + sa * 0.25f);
    }

    V3D_Brush smudge_brush = *brush;
    smudge_brush.color = state->smudge_color;
    render_dab(layer, &smudge_brush, to_x, to_y, false);
}
