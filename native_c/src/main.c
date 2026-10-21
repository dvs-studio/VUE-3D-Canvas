/**
 * @file main.c
 * @brief VUE 3D Canvas - Native C Application Entry & Desktop Runtime
 * @author Victory Ukpong
 * 
 * Hardware Acceleration: Direct DirectX 11 / OpenGL 2.0+ Core
 * Photoshop CS5 Palette: #333333, #2b2b2b, #3c3c3c, #222222
 * Memory Footprint: <30MB Heap, Max 3 States in .xblend
 */

#include "../include/vue3d.h"
#include "../include/brush_engine.h"
#include "../include/surface_shading.h"
#include "../include/xblend.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

V3D_AppContext* v3d_create_context(int tex_width, int tex_height) {
    V3D_AppContext* ctx = (V3D_AppContext*)calloc(1, sizeof(V3D_AppContext));
    if (!ctx) return NULL;

    ctx->texture_width = tex_width;
    ctx->texture_height = tex_height;
    ctx->theme = V3D_THEME_CS5;
    ctx->active_tool = V3D_TOOL_BRUSH;

    /* Base Composite Canvas */
    ctx->composite_pixels = (uint32_t*)malloc(tex_width * tex_height * sizeof(uint32_t));
    if (ctx->composite_pixels) {
        memset(ctx->composite_pixels, 0x80, tex_width * tex_height * sizeof(uint32_t));
    }

    /* Initialize Base Layer */
    V3D_Layer* base_layer = &ctx->layers[0];
    strcpy(base_layer->id, "layer_base");
    strcpy(base_layer->name, "Background Color");
    base_layer->width = tex_width;
    base_layer->height = tex_height;
    base_layer->opacity = 1.0f;
    base_layer->visible = true;
    base_layer->locked = false;
    base_layer->blend_mode = 0;
    base_layer->pixels = (uint32_t*)malloc(tex_width * tex_height * sizeof(uint32_t));
    if (base_layer->pixels) {
        memset(base_layer->pixels, 0x9C, tex_width * tex_height * sizeof(uint32_t));
    }
    ctx->layer_count = 1;
    ctx->active_layer_idx = 0;

    /* Initialize Default Brush */
    ctx->active_brush = (V3D_Brush){
        .name = "Hard Round Pen",
        .size = 24.0f,
        .opacity = 100.0f,
        .flow = 100.0f,
        .hardness = 95.0f,
        .spacing = 12.0f,
        .scatter = 0.0f,
        .stabilizer = 20.0f,
        .color = { 230, 230, 230, 255 },
        .stroke_type = V3D_STROKE_SPACE,
        .mask_type = V3D_MASK_NONE,
        .pattern_type = V3D_PAT_NONE,
        .mask_scale = 1.0f,
        .pattern_scale = 1.0f
    };

    /* Initialize Camera */
    v3d_camera_init(&ctx->camera);

    /* Initialize Undo Buffer */
    v3d_undo_init(&ctx->undo_buffer, V3D_MAX_UNDO_RUNTIME);
    v3d_undo_push(&ctx->undo_buffer, "Initial Project Setup", ctx->layers, ctx->layer_count);

    return ctx;
}

void v3d_destroy_context(V3D_AppContext* ctx) {
    if (!ctx) return;
    if (ctx->composite_pixels) free(ctx->composite_pixels);
    for (int l = 0; l < ctx->layer_count; ++l) {
        if (ctx->layers[l].pixels) free(ctx->layers[l].pixels);
    }
    for (int i = 0; i < ctx->undo_buffer.count; ++i) {
        for (int l = 0; l < ctx->undo_buffer.stack[i].layer_count; ++l) {
            if (ctx->undo_buffer.stack[i].layer_pixels[l]) {
                free(ctx->undo_buffer.stack[i].layer_pixels[l]);
            }
        }
    }
    free(ctx);
}

void v3d_undo_init(V3D_UndoBuffer* ub, int max_states) {
    if (!ub) return;
    ub->count = 0;
    ub->current_index = -1;
    ub->max_runtime_states = max_states > 0 ? max_states : V3D_MAX_UNDO_RUNTIME;
}

void v3d_undo_push(V3D_UndoBuffer* ub, const char* desc, V3D_Layer* layers, int count) {
    if (!ub || !layers || count <= 0) return;

    /* Truncate redo tree if we branched */
    if (ub->current_index < ub->count - 1) {
        for (int i = ub->current_index + 1; i < ub->count; ++i) {
            for (int l = 0; l < ub->stack[i].layer_count; ++l) {
                if (ub->stack[i].layer_pixels[l]) free(ub->stack[i].layer_pixels[l]);
            }
        }
        ub->count = ub->current_index + 1;
    }

    if (ub->count >= ub->max_runtime_states) {
        /* Discard oldest snapshot */
        for (int l = 0; l < ub->stack[0].layer_count; ++l) {
            if (ub->stack[0].layer_pixels[l]) free(ub->stack[0].layer_pixels[l]);
        }
        memmove(&ub->stack[0], &ub->stack[1], (ub->count - 1) * sizeof(V3D_UndoSnapshot));
        ub->count--;
        ub->current_index--;
    }

    V3D_UndoSnapshot* snap = &ub->stack[ub->count];
    snap->timestamp = (uint32_t)time(NULL);
    strncpy(snap->description, desc ? desc : "Paint Action", sizeof(snap->description) - 1);
    snap->layer_count = count;

    for (int l = 0; l < count; ++l) {
        size_t bytes = layers[l].width * layers[l].height * sizeof(uint32_t);
        snap->layer_pixels[l] = (uint32_t*)malloc(bytes);
        if (snap->layer_pixels[l] && layers[l].pixels) {
            memcpy(snap->layer_pixels[l], layers[l].pixels, bytes);
        }
    }

    ub->count++;
    ub->current_index = ub->count - 1;
}

bool v3d_undo_step(V3D_UndoBuffer* ub, V3D_Layer* layers, int* count) {
    if (!ub || ub->current_index <= 0) return false;
    ub->current_index--;
    V3D_UndoSnapshot* snap = &ub->stack[ub->current_index];

    for (int l = 0; l < snap->layer_count && l < *count; ++l) {
        size_t bytes = layers[l].width * layers[l].height * sizeof(uint32_t);
        if (layers[l].pixels && snap->layer_pixels[l]) {
            memcpy(layers[l].pixels, snap->layer_pixels[l], bytes);
        }
    }
    return true;
}

bool v3d_redo_step(V3D_UndoBuffer* ub, V3D_Layer* layers, int* count) {
    if (!ub || ub->current_index >= ub->count - 1) return false;
    ub->current_index++;
    V3D_UndoSnapshot* snap = &ub->stack[ub->current_index];

    for (int l = 0; l < snap->layer_count && l < *count; ++l) {
        size_t bytes = layers[l].width * layers[l].height * sizeof(uint32_t);
        if (layers[l].pixels && snap->layer_pixels[l]) {
            memcpy(layers[l].pixels, snap->layer_pixels[l], bytes);
        }
    }
    return true;
}

static void print_banner(void) {
    printf("========================================================================\n");
    printf("  VUE 3D Canvas - Native C Production Engine v%s\n", V3D_VERSION);
    printf("  Author & Creator: Victory Ukpong\n");
    printf("  Architecture: Pure C99/C11 Native Runtime + DirectX 11 / OpenGL 2.0+\n");
    printf("  Memory Footprint: < 30 MB Heap, Max 3 States in .xblend\n");
    printf("========================================================================\n\n");
}

int main(int argc, char* argv[]) {
    print_banner();

    V3D_AppContext* ctx = v3d_create_context(1024, 1024);
    if (!ctx) {
        fprintf(stderr, "Fatal Error: Failed to allocate VUE 3D Canvas context.\n");
        return 1;
    }

    printf("Initialization Complete:\n");
    printf("  • Surface Normal Pipeline : Dynamic Def / Smooth / Flat Active\n");
    printf("  • Camera Engine           : Blender Drone (WASD+QE) & Unconstrained Orbit\n");
    printf("  • Undo Architecture       : 1-Step Session Undo (%d states) + 3-State .xblend\n", ctx->undo_buffer.max_runtime_states);
    printf("  • UI Color Palette        : Photoshop CS5 Dark Skin (#333333)\n\n");

    /* Interactive Command Shell Safeguard so window never closes immediately */
    printf("Interactive Terminal Shell Ready. Type 'help', 'status', 'stroke', 'undo', 'save', or 'exit'.\n\n");

    char cmd[128];
    while (1) {
        printf("vue3d-c> ");
        fflush(stdout);

        if (!fgets(cmd, sizeof(cmd), stdin)) break;
        cmd[strcspn(cmd, "\r\n")] = 0;
        if (strlen(cmd) == 0) continue;

        if (strcmp(cmd, "exit") == 0 || strcmp(cmd, "quit") == 0 || strcmp(cmd, "q") == 0) {
            printf("Exiting VUE 3D Canvas Native C runtime. Goodbye!\n");
            break;
        } else if (strcmp(cmd, "help") == 0 || strcmp(cmd, "?") == 0) {
            printf("\nCommands:\n");
            printf("  status    - View memory usage, layer count, and active camera position\n");
            printf("  stroke    - Simulate a brush stroke dab with lazy-mouse tether\n");
            printf("  smudge    - Simulate a smudge/smear dab\n");
            printf("  undo      - Undo exactly 1 step (Ctrl+Z)\n");
            printf("  redo      - Redo exactly 1 step (Ctrl+Y)\n");
            printf("  save      - Save active project to .xblend with 3-state ring buffer\n");
            printf("  drone     - Toggle Blender drone flight navigation (WASD+QE)\n");
            printf("  theme     - Switch UI theme (cs5, bw78, modern, ps2022)\n");
            printf("  exit      - Terminate engine\n\n");
        } else if (strcmp(cmd, "status") == 0) {
            printf("\nStatus Report:\n");
            printf("  Version      : %s\n", V3D_VERSION);
            printf("  Layers       : %d / %d active\n", ctx->layer_count, V3D_MAX_LAYERS);
            printf("  Texture Size : %dx%d (32-bit RGBA)\n", ctx->texture_width, ctx->texture_height);
            printf("  Camera Pos   : Radius=%.2f, Yaw=%.2f, Pitch=%.2f\n", ctx->camera.radius, ctx->camera.theta, ctx->camera.phi);
            printf("  Drone Mode   : %s\n", ctx->camera.is_drone_mode ? "ACTIVE (WASD+QE)" : "INACTIVE");
            printf("  Undo Depth   : %d snapshots (current: %d)\n\n", ctx->undo_buffer.count, ctx->undo_buffer.current_index);
        } else if (strcmp(cmd, "stroke") == 0) {
            V3D_BrushState bs;
            v3d_brush_begin_stroke(&bs, 256.0f, 256.0f);
            v3d_brush_paint_stroke(&bs, &ctx->layers[ctx->active_layer_idx], &ctx->active_brush, 320.0f, 320.0f, false);
            v3d_brush_end_stroke(&bs);
            v3d_undo_push(&ctx->undo_buffer, "Paint Dab (C Engine)", ctx->layers, ctx->layer_count);
            v3d_composite_layers(ctx);
            printf("Painted brush stroke dab onto layer '%s'.\n", ctx->layers[ctx->active_layer_idx].name);
        } else if (strcmp(cmd, "smudge") == 0) {
            V3D_BrushState bs;
            v3d_brush_begin_stroke(&bs, 256.0f, 256.0f);
            v3d_brush_apply_smudge(&bs, &ctx->layers[ctx->active_layer_idx], &ctx->active_brush, 256.0f, 256.0f, 290.0f, 290.0f);
            v3d_brush_end_stroke(&bs);
            v3d_undo_push(&ctx->undo_buffer, "Smudge Dab (C Engine)", ctx->layers, ctx->layer_count);
            v3d_composite_layers(ctx);
            printf("Applied smudge smear onto layer '%s'.\n", ctx->layers[ctx->active_layer_idx].name);
        } else if (strcmp(cmd, "undo") == 0) {
            if (v3d_undo_step(&ctx->undo_buffer, ctx->layers, &ctx->layer_count)) {
                v3d_composite_layers(ctx);
                printf("Undone 1 step successfully. Current index: %d\n", ctx->undo_buffer.current_index);
            } else {
                printf("Cannot undo: at earliest snapshot.\n");
            }
        } else if (strcmp(cmd, "redo") == 0) {
            if (v3d_redo_step(&ctx->undo_buffer, ctx->layers, &ctx->layer_count)) {
                v3d_composite_layers(ctx);
                printf("Redone 1 step successfully. Current index: %d\n", ctx->undo_buffer.current_index);
            } else {
                printf("Cannot redo: at latest snapshot.\n");
            }
        } else if (strcmp(cmd, "save") == 0) {
            if (v3d_xblend_save("project_backup.xblend", ctx, "builtin:suzanne")) {
                printf("Project saved successfully to 'project_backup.xblend' (adhering to 3-state ring buffer budget).\n");
            } else {
                printf("Failed to write .xblend file.\n");
            }
        } else if (strcmp(cmd, "drone") == 0) {
            ctx->camera.is_drone_mode = !ctx->camera.is_drone_mode;
            printf("Blender Drone Flight Mode %s.\n", ctx->camera.is_drone_mode ? "ENABLED (WASD+QE)" : "DISABLED");
        } else {
            printf("Unknown command: '%s'. Type 'help' for command list.\n", cmd);
        }
    }

    v3d_destroy_context(ctx);
    return 0;
}
