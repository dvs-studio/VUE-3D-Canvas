/**
 * @file vue3d.h
 * @brief VUE 3D Canvas - Core Native C Engine Header
 * @author Victory Ukpong
 * 
 * Target: C99/C11 Native Desktop Architecture
 * Direct DirectX 11 / OpenGL 2.0+ Support (Zero WebGL Overhead)
 * Low Memory Footprint (<30MB Heap), Max 3 Undo States in .xblend
 */

#ifndef VUE3D_H
#define VUE3D_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

#define V3D_VERSION "0.1.0"
#define V3D_MAX_LAYERS 32
#define V3D_MAX_UNDO_RUNTIME 30
#define V3D_XBLEND_SAVE_STATES 3

/* Math Primitives */
typedef struct { float x, y; } V3D_Vec2;
typedef struct { float x, y, z; } V3D_Vec3;
typedef struct { float x, y, z, w; } V3D_Vec4;
typedef struct { float m[16]; } V3D_Mat4;

typedef struct {
    uint8_t r, g, b, a;
} V3D_ColorRGBA;

/* Surface Normal Shading Modes */
typedef enum {
    V3D_SHADING_DEF = 0,    /* Original vertex normals */
    V3D_SHADING_SMOOTH = 1, /* Angle-weighted averaged vertex normals */
    V3D_SHADING_FLAT = 2    /* Faceted per-face polygon normals */
} V3D_SurfaceShadingMode;

/* UI Color Themes */
typedef enum {
    V3D_THEME_CS5 = 0,      /* Photoshop CS5 Dark Gray (#333333) */
    V3D_THEME_BW78 = 1,     /* 78% Black & White Minimalist (#141414) */
    V3D_THEME_MODERN = 2,   /* Modern Studio Slate (#13161d) */
    V3D_THEME_PS2022 = 3    /* Photoshop 2022 Flat Graphite (#1f1f1f) */
} V3D_ThemeMode;

/* Brush Stroke Types */
typedef enum {
    V3D_STROKE_SPACE = 0,
    V3D_STROKE_AIRBRUSH,
    V3D_STROKE_DOT,
    V3D_STROKE_DRAGGED_DOT,
    V3D_STROKE_CURVE
} V3D_StrokeType;

/* Brush Tip Mask Stencils */
typedef enum {
    V3D_MASK_NONE = 0,
    V3D_MASK_GRUNGE,
    V3D_MASK_SPLAT,
    V3D_MASK_SCRATCH,
    V3D_MASK_DOTS,
    V3D_MASK_NOISE,
    V3D_MASK_CRACKS,
    V3D_MASK_CUSTOM_IMAGE
} V3D_MaskType;

/* Pattern Overlays */
typedef enum {
    V3D_PAT_NONE = 0,
    V3D_PAT_CHECKER,
    V3D_PAT_CARBON,
    V3D_PAT_HALFTONE,
    V3D_PAT_LEATHER,
    V3D_PAT_WOOD,
    V3D_PAT_WEAVE,
    V3D_PAT_CUSTOM_IMAGE
} V3D_PatternType;

/* Active Painting Tool */
typedef enum {
    V3D_TOOL_BRUSH = 0,
    V3D_TOOL_ERASER,
    V3D_TOOL_SMUDGE,
    V3D_TOOL_BLUR,
    V3D_TOOL_CLONE,
    V3D_TOOL_EYEDROPPER,
    V3D_TOOL_HAND,
    V3D_TOOL_ZOOM
} V3D_ToolType;

/* Layer Specification */
typedef struct {
    char id[64];
    char name[64];
    int width;
    int height;
    uint32_t* pixels;       /* RGBA 32-bit pixel buffer */
    float opacity;          /* 0.0 to 1.0 */
    bool visible;
    bool locked;
    int blend_mode;         /* 0=Normal, 1=Multiply, 2=Screen, 3=Overlay */
} V3D_Layer;

/* Brush Settings */
typedef struct {
    char name[64];
    float size;
    float opacity;          /* 0 to 100 */
    float flow;             /* 0 to 100 */
    float hardness;         /* 0 to 100 */
    float spacing;          /* dab spacing percent */
    float scatter;          /* scatter radius percent */
    float stabilizer;       /* lazy-mouse tether level (0-100) */
    V3D_ColorRGBA color;
    V3D_StrokeType stroke_type;
    V3D_MaskType mask_type;
    V3D_PatternType pattern_type;
    float mask_scale;
    float pattern_scale;
    uint32_t* custom_mask_pixels;
    int custom_mask_width;
    int custom_mask_height;
} V3D_Brush;

/* Undo Snapshot for 3-state ring buffer and session stack */
typedef struct {
    uint32_t timestamp;
    char description[64];
    uint32_t* layer_pixels[V3D_MAX_LAYERS];
    int layer_count;
} V3D_UndoSnapshot;

/* Undo Manager */
typedef struct {
    V3D_UndoSnapshot stack[V3D_MAX_UNDO_RUNTIME];
    int count;
    int current_index;
    int max_runtime_states;
} V3D_UndoBuffer;

/* Blender-Style Camera Orbit & Drone Flight State */
typedef struct {
    float radius;
    float theta;            /* Yaw */
    float phi;              /* Pitch */
    V3D_Vec3 target;        /* Look-at center */
    bool is_orbiting;
    bool is_panning;
    bool is_drone_mode;     /* WASD+QE flight mode */
    bool invert_nav;        /* Inverted axis toggle */
    float last_mouse_x;
    float last_mouse_y;
} V3D_Camera;

/* 3D Mesh Geometry */
typedef struct {
    float* vertices;
    float* normals;
    float* uvs;
    uint32_t* indices;
    int vertex_count;
    int index_count;
    V3D_SurfaceShadingMode current_shading;
} V3D_Mesh;

/* Application State */
typedef struct {
    V3D_Layer layers[V3D_MAX_LAYERS];
    int layer_count;
    int active_layer_idx;
    V3D_Brush active_brush;
    V3D_ToolType active_tool;
    V3D_Camera camera;
    V3D_Mesh active_mesh;
    V3D_UndoBuffer undo_buffer;
    V3D_ThemeMode theme;
    uint32_t* composite_pixels;
    int texture_width;
    int texture_height;
    bool texture_needs_update;
} V3D_AppContext;

/* Engine Core Prototypes */
V3D_AppContext* v3d_create_context(int tex_width, int tex_height);
void v3d_destroy_context(V3D_AppContext* ctx);
void v3d_composite_layers(V3D_AppContext* ctx);
void v3d_set_theme(V3D_AppContext* ctx, V3D_ThemeMode theme);

/* Camera Navigation Prototypes */
void v3d_camera_init(V3D_Camera* cam);
void v3d_camera_orbit(V3D_Camera* cam, float dx, float dy);
void v3d_camera_pan(V3D_Camera* cam, float dx, float dy);
void v3d_camera_zoom(V3D_Camera* cam, float delta);
void v3d_camera_drone_fly(V3D_Camera* cam, float forward, float right, float up, float speed);

/* Undo / Redo Prototypes */
void v3d_undo_init(V3D_UndoBuffer* ub, int max_states);
void v3d_undo_push(V3D_UndoBuffer* ub, const char* desc, V3D_Layer* layers, int count);
bool v3d_undo_step(V3D_UndoBuffer* ub, V3D_Layer* layers, int* count);
bool v3d_redo_step(V3D_UndoBuffer* ub, V3D_Layer* layers, int* count);

#ifdef __cplusplus
}
#endif

#endif /* VUE3D_H */
