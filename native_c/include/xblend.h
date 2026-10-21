/**
 * @file xblend.h
 * @brief .xblend Project Format Serialization Header
 * @author Victory Ukpong
 * 
 * Strict Constraint: Max 3 undo states persisted into .xblend file
 * Linked 3D model asset references, embedded layer base64/binary payloads
 */

#ifndef V3D_XBLEND_H
#define V3D_XBLEND_H

#include "vue3d.h"

#ifdef __cplusplus
extern "C" {
#endif

bool v3d_xblend_save(const char* filepath, const V3D_AppContext* ctx, const char* model_path);
bool v3d_xblend_load(const char* filepath, V3D_AppContext* ctx, char* out_model_path, size_t max_path_len);

#ifdef __cplusplus
}
#endif

#endif /* V3D_XBLEND_H */
