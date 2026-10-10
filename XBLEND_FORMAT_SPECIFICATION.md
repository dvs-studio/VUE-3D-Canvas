# .xblend Project Format Specification (VUE 3D Canvas)

## 1. Overview & File Architecture
* **File Extension:** `.xblend`
* **MIME Type:** `application/x-blend+json` or `application/json`
* **Created by:** Victory Ukpong (VUE 3D Canvas)
* **Target Integration:** Blender 2.80+ LTS
* **Design Philosophy:** Low memory footprint, linked asset priority, deterministic serialization, and non-destructive shader node mapping.

---

## 2. Top-Level JSON Schema Definition

```json
{
  "formatVersion": "1.2.0",
  "application": "VUE 3D Canvas",
  "author": "Victory Ukpong",
  "projectName": "MyModelProject",
  "embed3DAssets": false,
  "model": {
    "id": "suzanne",
    "name": "SUZANNE",
    "source": "primitive",
    "linked": true,
    "filePath": "/models/suzanne.obj",
    "fileSizeEstimate": "14.2 KB",
    "vertexCount": 1240,
    "triangleCount": 2480,
    "embeddedGeometryData": null
  },
  "layers": [
    {
      "id": "layer_base",
      "name": "Base_Color_Layer",
      "visible": true,
      "opacity": 100,
      "blendMode": "normal",
      "locked": false,
      "channel": "color",
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    },
    {
      "id": "layer_details",
      "name": "Decals_and_Paint",
      "visible": true,
      "opacity": 90,
      "blendMode": "normal",
      "locked": false,
      "channel": "color",
      "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ],
  "nodeGraph": {
    "nodes": [
      {
        "id": "tex_coord_1",
        "type": "TEX_COORD",
        "title": "Texture Coordinate",
        "x": 40,
        "y": 120,
        "inputs": [],
        "outputs": [
          { "id": "uv", "name": "UV", "type": "vector" }
        ],
        "properties": {}
      },
      {
        "id": "mapping_1",
        "type": "MAPPING",
        "title": "Mapping",
        "x": 240,
        "y": 120,
        "inputs": [
          { "id": "vector", "name": "Vector", "type": "vector" },
          { "id": "location", "name": "Location", "type": "vector", "value": [0, 0, 0] },
          { "id": "rotation", "name": "Rotation", "type": "vector", "value": [0, 0, 0] },
          { "id": "scale", "name": "Scale", "type": "vector", "value": [1, 1, 1] }
        ],
        "outputs": [
          { "id": "vector_out", "name": "Vector", "type": "vector" }
        ],
        "properties": { "vector_type": "Point" }
      },
      {
        "id": "principled_bsdf_1",
        "type": "PRINCIPLED_BSDF",
        "title": "Principled BSDF",
        "x": 620,
        "y": 80,
        "inputs": [
          { "id": "base_color", "name": "Base Color", "type": "color" },
          { "id": "metallic", "name": "Metallic", "type": "float", "value": 0.15 },
          { "id": "roughness", "name": "Roughness", "type": "float", "value": 0.35 },
          { "id": "ior", "name": "IOR", "type": "float", "value": 1.45 }
        ],
        "outputs": [
          { "id": "bsdf", "name": "BSDF", "type": "shader" }
        ],
        "properties": {
          "metallic": 0.15,
          "roughness": 0.35,
          "ior": 1.45
        }
      },
      {
        "id": "material_output_1",
        "type": "MATERIAL_OUTPUT",
        "title": "Material Output",
        "x": 980,
        "y": 80,
        "inputs": [
          { "id": "surface", "name": "Surface", "type": "shader" }
        ],
        "outputs": [],
        "properties": { "target": "All" }
      }
    ],
    "connections": [
      {
        "id": "conn_1",
        "fromNodeId": "tex_coord_1",
        "fromSocketId": "uv",
        "toNodeId": "mapping_1",
        "toSocketId": "vector"
      },
      {
        "id": "conn_2",
        "fromNodeId": "principled_bsdf_1",
        "fromSocketId": "bsdf",
        "toNodeId": "material_output_1",
        "toSocketId": "surface"
      }
    ]
  },
  "undoRingBuffer": {
    "maxStates": 3,
    "states": [
      {
        "id": "slot_0",
        "timestamp": 1740000000000,
        "description": "Base Coat Layer Setup"
      },
      {
        "id": "slot_1",
        "timestamp": 1740000050000,
        "description": "Paint Details"
      },
      {
        "id": "slot_2",
        "timestamp": 1740000100000,
        "description": "Latest Brush Stroke"
      }
    ]
  },
  "materialProperties": {
    "metallic": 0.15,
    "roughness": 0.35,
    "normalStrength": 1.0,
    "clearcoat": 0.0,
    "ior": 1.45
  },
  "createdDate": "2026-10-10T00:00:00.000Z",
  "savedDate": "2026-10-10T00:00:00.000Z"
}
```

---

## 3. `.xblend + ZIP Bundle` Structure

When exported using **Export .xblend + ZIP Bundle**, the archive contains:

```
project_xblend_bundle.zip
│
├── project_name.xblend                  # Full project metadata and node graph
├── texture_to_node_mapping.json         # Automated Blender node wiring schema
│
├── textures/                            # Exported individual layer textures
│   ├── Base_Color_Layer_Texture.png
│   └── Decals_and_Paint_Texture.png
│
└── alpha_masks/                         # Individual UV alpha mask maps
    ├── Base_Color_Layer_AlphaMask.png
    └── Decals_and_Paint_AlphaMask.png
```

---

## 4. `texture_to_node_mapping.json` Schema

This file instructs the Blender add-on on how to build Image Texture and Alpha Mask nodes:

```json
{
  "format": "VUE3D_TEXTURE_TO_NODE_MAPPING",
  "version": "1.2.0",
  "targetApplication": "Blender 2.8+",
  "projectName": "MyModelProject",
  "materialName": "MyModelProject_Material",
  "textureCount": 2,
  "principledBSDFConfig": {
    "metallic": 0.15,
    "roughness": 0.35,
    "normalStrength": 1.0,
    "ior": 1.45
  },
  "layers": [
    {
      "layerIndex": 0,
      "layerId": "layer_base",
      "layerName": "Base_Color_Layer",
      "channel": "color",
      "blendMode": "normal",
      "opacity": 100,
      "textureFile": "textures/Base_Color_Layer_Texture.png",
      "alphaMaskFile": "alpha_masks/Base_Color_Layer_AlphaMask.png",
      "blenderTargetSocket": "Base Color",
      "colorSpace": "sRGB",
      "maskColorSpace": "Non-Color"
    },
    {
      "layerIndex": 1,
      "layerId": "layer_details",
      "layerName": "Decals_and_Paint",
      "channel": "color",
      "blendMode": "normal",
      "opacity": 90,
      "textureFile": "textures/Decals_and_Paint_Texture.png",
      "alphaMaskFile": "alpha_masks/Decals_and_Paint_AlphaMask.png",
      "blenderTargetSocket": "Color",
      "colorSpace": "sRGB",
      "maskColorSpace": "Non-Color"
    }
  ],
  "notes": "Triplanar filter is baked into textures and omitted from procedural nodes."
}
```

---

## 5. Key Rules for Importer Implementations
1. **Triplanar Omission:** The Triplanar Box Mapping Filter is destructive upon execution; it bakes directly into layer pixel data. Importers MUST NOT expect a procedural triplanar node.
2. **Strict 3 Save States:** Only the latest 3 undo states are saved in `.xblend` to enforce low memory overhead.
3. **Color Space Rule:**
   - Texture maps (`textures/`): `sRGB`
   - Alpha masks (`alpha_masks/`): `Non-Color`
