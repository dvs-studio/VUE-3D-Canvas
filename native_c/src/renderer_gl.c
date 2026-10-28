/**
 * @file renderer_gl.c
 * @brief Dynamic Surface Normal Calculation, Camera Navigation, and Compositor in C
 * @author Victory Ukpong
 */

#include "../include/vue3d.h"
#include "../include/surface_shading.h"
#include <stdlib.h>
#include <string.h>
#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

/* Initialize Camera */
void v3d_camera_init(V3D_Camera* cam) {
    if (!cam) return;
    cam->radius = 4.8f;
    cam->theta = 0.78f;
    cam->phi = 1.15f;
    cam->target = (V3D_Vec3){ 0.0f, 0.0f, 0.0f };
    cam->is_orbiting = false;
    cam->is_panning = false;
    cam->is_drone_mode = false;
    cam->invert_nav = false;
    cam->last_mouse_x = 0.0f;
    cam->last_mouse_y = 0.0f;
}

/* Unconstrained Trackball / Turntable Orbit (Zero Angle Locking) */
void v3d_camera_orbit(V3D_Camera* cam, float dx, float dy) {
    if (!cam) return;
    float dir = cam->invert_nav ? 1.0f : -1.0f;
    cam->theta += dx * 0.008f * dir;
    cam->phi += dy * 0.008f * dir;

    /* Seamless continuous pitch without pole-locking freeze */
    if (cam->phi < 0.001f) cam->phi = 0.001f;
    if (cam->phi > (float)M_PI - 0.001f) cam->phi = (float)M_PI - 0.001f;
}

/* Camera-Relative Planar Panning */
void v3d_camera_pan(V3D_Camera* cam, float dx, float dy) {
    if (!cam) return;

    /* Calculate camera local Right and Up vectors */
    float sin_t = sinf(cam->theta);
    float cos_t = cosf(cam->theta);
    float sin_p = sinf(cam->phi);
    float cos_p = cosf(cam->phi);

    /* Local Right */
    V3D_Vec3 right = { cos_t, 0.0f, -sin_t };
    /* Local Up */
    V3D_Vec3 up = { -cos_p * sin_t, sin_p, -cos_p * cos_t };

    float speed = cam->radius * 0.0016f;
    cam->target.x += (-dx * right.x + dy * up.x) * speed;
    cam->target.y += (-dx * right.y + dy * up.y) * speed;
    cam->target.z += (-dx * right.z + dy * up.z) * speed;
}

/* Camera Zoom */
void v3d_camera_zoom(V3D_Camera* cam, float delta) {
    if (!cam) return;
    float factor = expf(-delta * 0.05f);
    cam->radius *= factor;
    if (cam->radius < 0.001f) cam->radius = 0.001f;
    if (cam->radius > 10000.0f) cam->radius = 10000.0f;
}

/* Blender-Style Drone Flight (WASD + QE) */
void v3d_camera_drone_fly(V3D_Camera* cam, float forward, float right, float up, float speed) {
    if (!cam) return;
    float sin_t = sinf(cam->theta);
    float cos_t = cosf(cam->theta);
    float sin_p = sinf(cam->phi);
    float cos_p = cosf(cam->phi);

    V3D_Vec3 fwd_vec = { -sin_p * sin_t, -cos_p, -sin_p * cos_t };
    V3D_Vec3 rgt_vec = { cos_t, 0.0f, -sin_t };
    V3D_Vec3 up_vec  = { 0.0f, 1.0f, 0.0f };

    cam->target.x += (forward * fwd_vec.x + right * rgt_vec.x + up * up_vec.x) * speed;
    cam->target.y += (forward * fwd_vec.y + right * rgt_vec.y + up * up_vec.y) * speed;
    cam->target.z += (forward * fwd_vec.z + right * rgt_vec.z + up * up_vec.z) * speed;
}

/* Dynamic Surface Normal Recalculation (Def, Smooth, Flat) */
void v3d_compute_surface_normals(V3D_Mesh* mesh, V3D_SurfaceShadingMode mode) {
    if (!mesh || !mesh->vertices || !mesh->normals || mesh->vertex_count <= 0) return;

    if (mode == V3D_SHADING_FLAT && mesh->indices && mesh->index_count >= 3) {
        /* Compute per-face faceted normals */
        for (int i = 0; i < mesh->index_count; i += 3) {
            uint32_t i0 = mesh->indices[i + 0];
            uint32_t i1 = mesh->indices[i + 1];
            uint32_t i2 = mesh->indices[i + 2];

            float v0x = mesh->vertices[i0 * 3 + 0], v0y = mesh->vertices[i0 * 3 + 1], v0z = mesh->vertices[i0 * 3 + 2];
            float v1x = mesh->vertices[i1 * 3 + 0], v1y = mesh->vertices[i1 * 3 + 1], v1z = mesh->vertices[i1 * 3 + 2];
            float v2x = mesh->vertices[i2 * 3 + 0], v2y = mesh->vertices[i2 * 3 + 1], v2z = mesh->vertices[i2 * 3 + 2];

            float e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
            float e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

            float nx = e1y * e2z - e1z * e2y;
            float ny = e1z * e2x - e1x * e2z;
            float nz = e1x * e2y - e1y * e2x;

            float len = sqrtf(nx * nx + ny * ny + nz * nz);
            if (len > 0.0001f) { nx /= len; ny /= len; nz /= len; }

            mesh->normals[i0 * 3 + 0] = nx; mesh->normals[i0 * 3 + 1] = ny; mesh->normals[i0 * 3 + 2] = nz;
            mesh->normals[i1 * 3 + 0] = nx; mesh->normals[i1 * 3 + 1] = ny; mesh->normals[i1 * 3 + 2] = nz;
            mesh->normals[i2 * 3 + 0] = nx; mesh->normals[i2 * 3 + 1] = ny; mesh->normals[i2 * 3 + 2] = nz;
        }
    } else if (mode == V3D_SHADING_SMOOTH && mesh->indices && mesh->index_count >= 3) {
        /* Zero out normals and accumulate angle-weighted face normals */
        memset(mesh->normals, 0, mesh->vertex_count * 3 * sizeof(float));

        for (int i = 0; i < mesh->index_count; i += 3) {
            uint32_t i0 = mesh->indices[i + 0];
            uint32_t i1 = mesh->indices[i + 1];
            uint32_t i2 = mesh->indices[i + 2];

            float v0x = mesh->vertices[i0 * 3 + 0], v0y = mesh->vertices[i0 * 3 + 1], v0z = mesh->vertices[i0 * 3 + 2];
            float v1x = mesh->vertices[i1 * 3 + 0], v1y = mesh->vertices[i1 * 3 + 1], v1z = mesh->vertices[i1 * 3 + 2];
            float v2x = mesh->vertices[i2 * 3 + 0], v2y = mesh->vertices[i2 * 3 + 1], v2z = mesh->vertices[i2 * 3 + 2];

            float e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
            float e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

            float nx = e1y * e2z - e1z * e2y;
            float ny = e1z * e2x - e1x * e2z;
            float nz = e1x * e2y - e1y * e2x;

            float len = sqrtf(nx * nx + ny * ny + nz * nz);
            if (len > 0.0001f) { nx /= len; ny /= len; nz /= len; }

            mesh->normals[i0 * 3 + 0] += nx; mesh->normals[i0 * 3 + 1] += ny; mesh->normals[i0 * 3 + 2] += nz;
            mesh->normals[i1 * 3 + 0] += nx; mesh->normals[i1 * 3 + 1] += ny; mesh->normals[i1 * 3 + 2] += nz;
            mesh->normals[i2 * 3 + 0] += nx; mesh->normals[i2 * 3 + 1] += ny; mesh->normals[i2 * 3 + 2] += nz;
        }

        /* Normalize accumulated vertex normals */
        for (int v = 0; v < mesh->vertex_count; ++v) {
            float nx = mesh->normals[v * 3 + 0];
            float ny = mesh->normals[v * 3 + 1];
            float nz = mesh->normals[v * 3 + 2];
            float len = sqrtf(nx * nx + ny * ny + nz * nz);
            if (len > 0.0001f) {
                mesh->normals[v * 3 + 0] /= len;
                mesh->normals[v * 3 + 1] /= len;
                mesh->normals[v * 3 + 2] /= len;
            }
        }
    }

    mesh->current_shading = mode;
}

/* Layer Compositor */
void v3d_composite_layers(V3D_AppContext* ctx) {
    if (!ctx || !ctx->composite_pixels) return;
    int total_pixels = ctx->texture_width * ctx->texture_height;

    /* Base neutral gray */
    for (int i = 0; i < total_pixels; ++i) {
        ctx->composite_pixels[i] = 0xFF808080;
    }

    /* Composite bottom to top */
    for (int l = 0; l < ctx->layer_count; ++l) {
        V3D_Layer* layer = &ctx->layers[l];
        if (!layer->visible || !layer->pixels) continue;

        float alpha_scale = layer->opacity;
        for (int i = 0; i < total_pixels; ++i) {
            uint32_t src = layer->pixels[i];
            uint8_t sa = (src >> 24) & 0xFF;
            if (sa == 0) continue;

            uint32_t dst = ctx->composite_pixels[i];
            float eff_a = (float)sa / 255.0f * alpha_scale;
            float inv_a = 1.0f - eff_a;

            uint8_t sr = (src >> 0) & 0xFF, sg = (src >> 8) & 0xFF, sb = (src >> 16) & 0xFF;
            uint8_t dr = (dst >> 0) & 0xFF, dg = (dst >> 8) & 0xFF, db = (dst >> 16) & 0xFF;

            uint8_t out_r = (uint8_t)(sr * eff_a + dr * inv_a);
            uint8_t out_g = (uint8_t)(sg * eff_a + dg * inv_a);
            uint8_t out_b = (uint8_t)(sb * eff_a + db * inv_a);

            ctx->composite_pixels[i] = ((uint32_t)out_r << 0) | ((uint32_t)out_g << 8) | ((uint32_t)out_b << 16) | 0xFF000000;
        }
    }

    ctx->texture_needs_update = true;
}

/* Mulberry32 PRNG for deterministic layout variety */
static uint32_t prng_mulberry32(uint32_t* state) {
    *state += 0x6D2B79F5;
    uint32_t z = *state;
    z = (z ^ (z >> 15)) * (z | 1);
    z ^= z + (z ^ (z >> 7)) * (z | 61);
    return z ^ (z >> 14);
}

/* Smart UV Unwrap with Seeded Island Variation and Conformal Padding */
void v3d_uv_smart_unwrap(V3D_Mesh* mesh, float angle_limit_deg, float margin, int bleed_px, uint32_t seed) {
    if (!mesh || !mesh->vertices || !mesh->uvs || mesh->vertex_count <= 0) return;

    uint32_t prng_state = (seed == 0) ? 1337 : seed;
    float eff_margin = margin + ((float)bleed_px / 1024.0f);
    if (eff_margin < 0.005f) eff_margin = 0.005f;

    /* Base rotational jitter candidates (0, 45, 90, 180) */
    float base_angles[] = { 0.0f, 0.785f, 1.57f, 3.14159f };
    float rot = base_angles[prng_mulberry32(&prng_state) % 4];
    float cos_r = cosf(rot);
    float sin_r = sinf(rot);

    float min_u = 1e9f, max_u = -1e9f;
    float min_v = 1e9f, max_v = -1e9f;

    /* Project vertices onto planar bounding space */
    for (int i = 0; i < mesh->vertex_count; ++i) {
        float x = mesh->vertices[i * 3 + 0];
        float y = mesh->vertices[i * 3 + 1];
        float ru = x * cos_r - y * sin_r;
        float rv = x * sin_r + y * cos_r;

        if (ru < min_u) min_u = ru;
        if (ru > max_u) max_u = ru;
        if (rv < min_v) min_v = rv;
        if (rv > max_v) max_v = rv;
    }

    float span_u = (max_u - min_u > 1e-5f) ? (max_u - min_u) : 1.0f;
    float span_v = (max_v - min_v > 1e-5f) ? (max_v - min_v) : 1.0f;
    float scale = (1.0f - eff_margin * 2.0f);

    for (int i = 0; i < mesh->vertex_count; ++i) {
        float x = mesh->vertices[i * 3 + 0];
        float y = mesh->vertices[i * 3 + 1];
        float ru = x * cos_r - y * sin_r;
        float rv = x * sin_r + y * cos_r;

        float u = eff_margin + ((ru - min_u) / span_u) * scale;
        float v = eff_margin + ((rv - min_v) / span_v) * scale;

        mesh->uvs[i * 2 + 0] = (u < 0.001f) ? 0.001f : ((u > 0.999f) ? 0.999f : u);
        mesh->uvs[i * 2 + 1] = (v < 0.001f) ? 0.001f : ((v > 0.999f) ? 0.999f : v);
    }
}

/* Bilateral Symmetry UV Mirroring with Midpoint & Ear Protection */
void v3d_uv_symmetrize(V3D_Mesh* mesh, char axis, bool side_by_side, float midpoint_thresh, bool protect_ears) {
    if (!mesh || !mesh->vertices || !mesh->uvs || mesh->vertex_count <= 0) return;

    int axis_idx = (axis == 'Y') ? 1 : ((axis == 'Z') ? 2 : 0);

    for (int i = 0; i < mesh->vertex_count; ++i) {
        float val = mesh->vertices[i * 3 + axis_idx];

        /* Centerline weld seam: pin to 0.5 in side-by-side mode */
        if (fabsf(val) <= midpoint_thresh) {
            if (side_by_side) {
                mesh->uvs[i * 2 + 0] = 0.5f;
            }
            continue;
        }

        /* Ear protection: keep outer extremities independent */
        if (protect_ears && fabsf(val) > 1.25f) {
            continue;
        }

        /* If negative side, find matching positive vertex */
        if (val < -midpoint_thresh) {
            int best_j = -1;
            float best_d = 1e9f;

            for (int j = 0; j < mesh->vertex_count; ++j) {
                if (mesh->vertices[j * 3 + axis_idx] > midpoint_thresh) {
                    float dx = mesh->vertices[i * 3 + 0] - ((axis_idx == 0) ? -mesh->vertices[j * 3 + 0] : mesh->vertices[j * 3 + 0]);
                    float dy = mesh->vertices[i * 3 + 1] - ((axis_idx == 1) ? -mesh->vertices[j * 3 + 1] : mesh->vertices[j * 3 + 1]);
                    float dz = mesh->vertices[i * 3 + 2] - ((axis_idx == 2) ? -mesh->vertices[j * 3 + 2] : mesh->vertices[j * 3 + 2]);
                    float d = dx * dx + dy * dy + dz * dz;
                    if (d < best_d) {
                        best_d = d;
                        best_j = j;
                    }
                }
            }

            if (best_j != -1 && best_d < 0.05f) {
                if (side_by_side) {
                    float mu = 1.0f - mesh->uvs[best_j * 2 + 0];
                    mesh->uvs[i * 2 + 0] = (mu < 0.001f) ? 0.001f : ((mu > 0.999f) ? 0.999f : mu);
                    mesh->uvs[i * 2 + 1] = mesh->uvs[best_j * 2 + 1];
                } else {
                    mesh->uvs[i * 2 + 0] = mesh->uvs[best_j * 2 + 0];
                    mesh->uvs[i * 2 + 1] = mesh->uvs[best_j * 2 + 1];
                }
            }
        }
    }
}

/* 2D UV Interactive Sculpt Brush Stroke (0=Straighten, 1=Smooth, 2=Pinch, 3=Expand, 4=Crease) */
void v3d_uv_sculpt_stroke(V3D_Mesh* mesh, float bu, float bv, float radius, float strength, int mode) {
    if (!mesh || !mesh->uvs || mesh->vertex_count <= 0) return;

    float r_sq = radius * radius;
    for (int i = 0; i < mesh->vertex_count; ++i) {
        float u = mesh->uvs[i * 2 + 0];
        float v = mesh->uvs[i * 2 + 1];
        float du = u - bu;
        float dv = v - bv;
        float d_sq = du * du + dv * dv;
        if (d_sq > r_sq) continue;

        float dist = sqrtf(d_sq);
        float falloff = cosf((dist / radius) * (3.14159f * 0.5f)) * strength;

        if (mode == 0) { /* Straighten */
            if (fabsf(du) < fabsf(dv)) u += (bu - u) * falloff * 0.6f;
            else v += (bv - v) * falloff * 0.6f;
        } else if (mode == 1) { /* Smooth / Relax */
            u += (bu - u) * falloff * 0.25f;
            v += (bv - v) * falloff * 0.25f;
        } else if (mode == 2) { /* Pinch */
            u -= du * falloff * 0.4f;
            v -= dv * falloff * 0.4f;
        } else if (mode == 3) { /* Expand */
            if (dist > 1e-5f) {
                u += (du / dist) * radius * 0.15f * falloff;
                v += (dv / dist) * radius * 0.15f * falloff;
            }
        } else if (mode == 4) { /* Crease */
            float tu = (du > 0) ? bu + radius * 0.5f : bu - radius * 0.5f;
            float tv = (dv > 0) ? bv + radius * 0.5f : bv - radius * 0.5f;
            u += (tu - u) * falloff * 0.35f;
            v += (tv - v) * falloff * 0.35f;
        }

        mesh->uvs[i * 2 + 0] = (u < 0.001f) ? 0.001f : ((u > 0.999f) ? 0.999f : u);
        mesh->uvs[i * 2 + 1] = (v < 0.001f) ? 0.001f : ((v > 0.999f) ? 0.999f : v);
    }
}

/* Multi-UV Channel Helpers */
void v3d_uv_channel_add(V3D_Mesh* mesh, const char* name) {
    if (!mesh || mesh->uv_channel_count >= V3D_MAX_UV_CHANNELS) return;
    int idx = mesh->uv_channel_count++;
    strncpy(mesh->uv_channels[idx].name, name, 31);
    mesh->uv_channels[idx].name[31] = '\0';
    mesh->uv_channels[idx].is_generated = true;
    mesh->uv_channels[idx].uvs = (float*)malloc(mesh->vertex_count * 2 * sizeof(float));
    if (mesh->uv_channels[idx].uvs && mesh->uvs) {
        memcpy(mesh->uv_channels[idx].uvs, mesh->uvs, mesh->vertex_count * 2 * sizeof(float));
    }
}

void v3d_uv_channel_set_active(V3D_Mesh* mesh, int idx) {
    if (!mesh || idx < 0 || idx >= mesh->uv_channel_count) return;
    mesh->active_uv_channel_idx = idx;
    if (mesh->uv_channels[idx].uvs && mesh->uvs) {
        memcpy(mesh->uvs, mesh->uv_channels[idx].uvs, mesh->vertex_count * 2 * sizeof(float));
    }
}

void v3d_uv_rebake(V3D_AppContext* ctx, int from_channel_idx, int to_channel_idx) {
    if (!ctx) return;
    /* Triggers texture composite refresh after UV channel re-arrangement */
    v3d_composite_layers(ctx);
}
