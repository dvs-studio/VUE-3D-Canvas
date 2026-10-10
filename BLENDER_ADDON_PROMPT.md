# Blender 2.8+ Add-on Generation Prompt

Copy and paste the prompt below into an AI model (Claude, ChatGPT, Grok, or Gemini) to generate the complete Blender Python add-on:

---

```markdown
# Role & Task
You are a senior Blender Python Add-on Engineer. Write a production-ready Blender 2.80+ Python Add-on (in a single file `__init__.py`) named **"VUE 3D Canvas Importer"**.

## Core Purpose
The add-on imports **VUE 3D Canvas (.xblend + ZIP Bundle)** projects into Blender 2.80, 2.9x, 3.x, and 4.x.
It focuses specifically on importing the **Shader Node and Masking Setup**, automatically reading the bundled textures, alpha masks, and `texture_to_node_mapping.json`.

## Add-on Specifications

### 1. UI Integration
- Register a panel in the 3D Viewport Sidebar:
  - Tab category: `VUE 3D`
  - Panel name: `VUE_PT_ImporterPanel`
  - Label: `VUE 3D Canvas Importer`
- Controls in panel:
  - File/Folder browser operator button: **"Import VUE 3D Project (.zip or folder)"**
  - Option checkbox: `[x] Create New Material` (otherwise updates active object material)
  - Option checkbox: `[x] Clean Existing Nodes` (clears default nodes before building)

### 2. File Selection & Unpacking Workflow
- The file dialog should allow the user to select either:
  1. A `.zip` bundle (e.g. `MyProject_xblend_bundle.zip`).
  2. Or an extracted folder containing the `.xblend` project and textures.
- If a `.zip` file is selected:
  - Automatically extract it into a temporary subfolder or project directory.
  - Locate `texture_to_node_mapping.json`.

### 3. Node Graph Construction in Blender
Using `bpy.data.materials` and `material.node_tree`:
1. **Material Output Node:**
   - Create `ShaderNodeOutputMaterial` placed at `(600, 0)`.
2. **Principled BSDF Node:**
   - Create `ShaderNodeBsdfPrincipled` placed at `(200, 0)`.
   - Set initial values from `mapping["principledBSDFConfig"]`:
     - `Metallic` = config.get("metallic", 0.0)
     - `Roughness` = config.get("roughness", 0.5)
     - `IOR` = config.get("ior", 1.45)
   - Connect `Principled BSDF -> BSDF` to `Material Output -> Surface`.
3. **Texture Coordinate & Mapping:**
   - Create `ShaderNodeTexCoord` placed at `(-800, 0)`.
   - Create `ShaderNodeMapping` placed at `(-600, 0)`.
   - Link `TexCoord -> UV` to `Mapping -> Vector`.
4. **Layer Textures & Alpha Mask Nodes (from `texture_to_node_mapping.json`):**
   - Iterate over the `layers` list in `texture_to_node_mapping.json`.
   - For each layer:
     - **Image Texture Node:**
       - Create `ShaderNodeTexImage` placed at `(-300, y_offset)`.
       - Load image from `textures/<filename>`.
       - Label the node with `Layer: <layerName>`.
       - Set `image.colorspace_settings.name = 'sRGB'`.
       - Link `Mapping -> Vector` to `Image Texture -> Vector`.
     - **Alpha Mask Texture Node:**
       - Create `ShaderNodeTexImage` placed at `(-300, y_offset - 250)`.
       - Load alpha mask from `alpha_masks/<maskFilename>`.
       - Label the node with `Mask: <layerName> Alpha`.
       - Set `image.colorspace_settings.name = 'Non-Color'`.
       - Link `Mapping -> Vector` to `Alpha Mask -> Vector`.
     - **Layer Blending / Mix Shader:**
       - For the base coat layer (index 0), connect `Image Texture -> Color` directly to `Principled BSDF -> Base Color`.
       - For subsequent layers (index > 0):
         - Create a `ShaderNodeMixRGB` (or `ShaderNodeMix` in Blender 3.4+).
         - Connect the previous color into `Color1`.
         - Connect current layer's `Image Texture -> Color` into `Color2`.
         - Connect `Alpha Mask -> Color` (or `Alpha`) into `Fac`.
         - Set blend mode according to `blendMode` (e.g. `MIX`, `MULTIPLY`, `SCREEN`, `OVERLAY`).
         - Connect output to `Principled BSDF -> Base Color`.
       - If the layer channel is `alpha`, connect `Alpha Mask -> Color` into `Principled BSDF -> Alpha`, and set `material.blend_method = 'BLEND'`.

### 4. Technical Constraints
- The procedural triplanar filter is baked into the texture pixels and NOT imported as a procedural node.
- Ensure cross-compatibility between Blender 2.80 through 4.2 LTS by checking Blender version:
  `is_blender_34_plus = bpy.app.version >= (3, 4, 0)` for `ShaderNodeMix` vs `ShaderNodeMixRGB`.
- Provide clean error logging if `texture_to_node_mapping.json` is missing or corrupt.

### 5. Output Format
Provide the complete, self-contained Python script with `bl_info` dictionary at the top so it can be installed via **Edit -> Preferences -> Add-ons -> Install**.
```
