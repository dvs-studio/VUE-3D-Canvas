/**
 * @file xblend.c
 * @brief .xblend Format Serialization with 3-State Undo Ring Buffer in C
 * @author Victory Ukpong
 */

#include "../include/xblend.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool v3d_xblend_save(const char* filepath, const V3D_AppContext* ctx, const char* model_path) {
    if (!filepath || !ctx) return false;

    FILE* f = fopen(filepath, "wb");
    if (!f) return false;

    /* Write .xblend Header */
    fprintf(f, "{\n");
    fprintf(f, "  \"format\": \"XBLEND\",\n");
    fprintf(f, "  \"version\": \"%s\",\n", V3D_VERSION);
    fprintf(f, "  \"author\": \"Victory Ukpong\",\n");
    fprintf(f, "  \"model\": \"%s\",\n", model_path ? model_path : "builtin:suzanne");
    fprintf(f, "  \"textureWidth\": %d,\n", ctx->texture_width);
    fprintf(f, "  \"textureHeight\": %d,\n", ctx->texture_height);
    fprintf(f, "  \"layerCount\": %d,\n", ctx->layer_count);
    fprintf(f, "  \"theme\": %d,\n", (int)ctx->theme);

    /* Enforce Strict 3-State Undo Budget into .xblend file */
    int states_to_save = ctx->undo_buffer.count < V3D_XBLEND_SAVE_STATES 
                       ? ctx->undo_buffer.count 
                       : V3D_XBLEND_SAVE_STATES;

    fprintf(f, "  \"undoStateCount\": %d,\n", states_to_save);
    fprintf(f, "  \"undoStates\": [\n");
    for (int i = 0; i < states_to_save; ++i) {
        int idx = (ctx->undo_buffer.current_index - states_to_save + 1 + i);
        if (idx < 0) idx = 0;
        const V3D_UndoSnapshot* snap = &ctx->undo_buffer.stack[idx];
        fprintf(f, "    {\"slot\": %d, \"description\": \"%s\", \"timestamp\": %u}%s\n",
                i, snap->description, snap->timestamp, (i == states_to_save - 1) ? "" : ",");
    }
    fprintf(f, "  ],\n");

    /* Layers Metadata */
    fprintf(f, "  \"layers\": [\n");
    for (int l = 0; l < ctx->layer_count; ++l) {
        const V3D_Layer* lyr = &ctx->layers[l];
        fprintf(f, "    {\"id\": \"%s\", \"name\": \"%s\", \"opacity\": %.2f, \"visible\": %s, \"blendMode\": %d}%s\n",
                lyr->id, lyr->name, lyr->opacity, lyr->visible ? "true" : "false", lyr->blend_mode,
                (l == ctx->layer_count - 1) ? "" : ",");
    }
    fprintf(f, "  ]\n");
    fprintf(f, "}\n");

    fclose(f);
    return true;
}

bool v3d_xblend_load(const char* filepath, V3D_AppContext* ctx, char* out_model_path, size_t max_path_len) {
    if (!filepath || !ctx) return false;

    FILE* f = fopen(filepath, "r");
    if (!f) return false;

    char line[256];
    while (fgets(line, sizeof(line), f)) {
        if (strstr(line, "\"model\":") && out_model_path) {
            char* quote1 = strchr(line, ':');
            if (quote1) {
                quote1 = strchr(quote1, '"');
                if (quote1) {
                    char* quote2 = strchr(quote1 + 1, '"');
                    if (quote2) {
                        size_t len = quote2 - (quote1 + 1);
                        if (len >= max_path_len) len = max_path_len - 1;
                        strncpy(out_model_path, quote1 + 1, len);
                        out_model_path[len] = '\0';
                    }
                }
            }
        }
    }

    fclose(f);
    return true;
}
