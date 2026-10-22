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
