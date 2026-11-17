# ==============================================================================
# VUE 3D Canvas - Layer PBR ZIP Importer for Blender 2.80+
# Author: Victory Ukpong
# Reads layer_manifest.json and baked per-layer maps. Does not rebuild web nodes.
# ==============================================================================

import bpy
import json
import os
import tempfile
import zipfile


def _socket(node, names):
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            return socket
    return None


def _output(node, names):
    for name in names:
        socket = node.outputs.get(name)
        if socket is not None:
            return socket
    return None


def _set_default(node, names, value):
    socket = _socket(node, names)
    if socket is not None:
        socket.default_value = value
        return socket
    return None


def _new_node(nodes, node_type, label, location):
    node = nodes.new(node_type)
    node.label = label
    node.location = location
    return node


def _safe_extract(zip_path, destination):
    root = os.path.realpath(destination)
    with zipfile.ZipFile(zip_path, 'r') as archive:
        for member in archive.infolist():
            target = os.path.realpath(os.path.join(root, member.filename))
            if target != root and not target.startswith(root + os.sep):
                raise ValueError("Unsafe path in VUE project ZIP: " + member.filename)
        archive.extractall(destination)


def _load_manifest(source_path):
    if os.path.isdir(source_path):
        manifest_path = os.path.join(source_path, "layer_manifest.json")
        if not os.path.isfile(manifest_path):
            raise FileNotFoundError("layer_manifest.json was not found in the selected folder.")
        with open(manifest_path, "r", encoding="utf-8") as handle:
            return json.load(handle), source_path

    if zipfile.is_zipfile(source_path):
        temp_dir = tempfile.mkdtemp(prefix="vue3d_import_")
        _safe_extract(source_path, temp_dir)
        manifest_path = os.path.join(temp_dir, "layer_manifest.json")
        if not os.path.isfile(manifest_path):
            raise FileNotFoundError("The ZIP does not contain layer_manifest.json.")
        with open(manifest_path, "r", encoding="utf-8") as handle:
            return json.load(handle), temp_dir

    raise ValueError("Choose a VUE 3D Canvas ZIP bundle or an extracted bundle folder.")


def _image_node(nodes, links, base_dir, relative_path, uv_name, label, location, color_space):
    if not relative_path:
        return None
    image_path = os.path.realpath(os.path.join(base_dir, relative_path))
    base = os.path.realpath(base_dir)
    if not image_path.startswith(base + os.sep) or not os.path.isfile(image_path):
        print("[VUE 3D Canvas] Missing or unsafe map: " + str(relative_path))
        return None

    image = bpy.data.images.load(image_path, check_existing=True)
    try:
        image.colorspace_settings.name = color_space
    except Exception:
        pass

    uv = _new_node(nodes, "ShaderNodeUVMap", label + " UV", (location[0] - 220, location[1]))
    if uv_name and hasattr(uv, "uv_map"):
        uv.uv_map = uv_name

    texture = _new_node(nodes, "ShaderNodeTexImage", label, location)
    texture.image = image
    uv_output = _output(uv, ["UV"])
    vector_input = _socket(texture, ["Vector"])
    if uv_output and vector_input:
        links.new(uv_output, vector_input)
    return texture


def _alpha_factor(nodes, links, texture, strength, location, label):
    alpha = _output(texture, ["Alpha"])
    if alpha is None:
        return None
    factor = _new_node(nodes, "ShaderNodeMath", label + " opacity × influence", location)
    factor.operation = 'MULTIPLY'
    factor.inputs[1].default_value = max(0.0, min(1.0, float(strength)))
    links.new(alpha, factor.inputs[0])
    return factor.outputs[0]


def _ramp_node(nodes, links, texture, stops, location, label):
    bw = _new_node(nodes, "ShaderNodeRGBToBW", label + " luminance", (location[0] - 190, location[1]))
    ramp = _new_node(nodes, "ShaderNodeValToRGB", label + " bump ramp", location)
    color_input = _socket(bw, ["Color"])
    color_output = _output(texture, ["Color"])
    if color_output and color_input:
        links.new(color_output, color_input)

    ramp_data = sorted(stops or [{"position": 0.0, "height": 0.0}, {"position": 1.0, "height": 1.0}],
                       key=lambda item: float(item.get("position", 0.0)))
    elements = ramp.color_ramp.elements
    while len(elements) > 2:
        elements.remove(elements[-1])
    for index, stop in enumerate(ramp_data):
        position = max(0.0, min(1.0, float(stop.get("position", index))))
        height = max(0.0, min(1.0, float(stop.get("height", position))))
        if index < 2:
            element = elements[index]
        else:
            element = elements.new(position)
        element.position = position
        element.color = (height, height, height, 1.0)
    if len(ramp_data) < 2:
        elements[0].position = 0.0
        elements[0].color = (0.0, 0.0, 0.0, 1.0)
        elements[1].position = 1.0
        elements[1].color = (1.0, 1.0, 1.0, 1.0)
    links.new(bw.outputs["Val"], ramp.inputs["Fac"])
    return ramp.outputs["Color"]


def _make_material(obj, name):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    material.use_nodes = True
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)
    material.node_tree.nodes.clear()
    return material


def import_vue_layer_manifest(manifest_path, target_material_name=None):
    """Import a folder containing layer_manifest.json and its layer_maps directory."""
    with open(manifest_path, "r", encoding="utf-8") as handle:
        manifest = json.load(handle)
    return _build_layer_material(manifest, os.path.dirname(os.path.realpath(manifest_path)),
                                 target_material_name)


def _build_layer_material(manifest, base_dir, target_material_name=None):
    if manifest.get("format") != "VUE3D_LAYER_PBR_MANIFEST":
        raise ValueError("Unsupported VUE manifest. Expected VUE3D_LAYER_PBR_MANIFEST.")

    obj = bpy.context.active_object
    if obj is None or not hasattr(obj.data, "materials"):
        raise RuntimeError("Select a mesh object before importing the VUE material.")

    project_name = manifest.get("projectName", "VUE3D_Project")
    material_name = target_material_name or (project_name + "_Material")
    material = _make_material(obj, material_name)
    nodes = material.node_tree.nodes
    links = material.node_tree.links

    output = _new_node(nodes, "ShaderNodeOutputMaterial", "VUE Material Output", (1500, 100))
    principled = _new_node(nodes, "ShaderNodeBsdfPrincipled", "VUE Principled BSDF", (1200, 100))
    surface = _output(principled, ["BSDF"])
    surface_input = _socket(output, ["Surface"])
    if surface and surface_input:
        links.new(surface, surface_input)

    _set_default(principled, ["Metallic"], 0.0)
    _set_default(principled, ["Roughness"], 1.0)
    _set_default(principled, ["Base Color"], (1.0, 1.0, 1.0, 1.0))

    layers = sorted(manifest.get("layers", []), key=lambda layer: int(layer.get("order", 0)))
    color_chain = None
    roughness_chain = None
    emission_chain = None
    height_chain = None
    normal_texture = None
    normal_strength = 1.0
    x_color = -700
    y_color = 700

    for index, layer in enumerate(layers):
        if not layer.get("visible", True):
            continue
        maps = layer.get("maps", {})
        uv_name = layer.get("uvChannel", "")
        opacity = max(0.0, min(1.0, float(layer.get("opacity", 100)) / 100.0))
        order_y = y_color - index * 260

        # Base colour: blend modes and alpha are evaluated per layer.
        color_path = maps.get("color") if layer.get("colorOn", True) else None
        color_tex = _image_node(nodes, links, base_dir, color_path, uv_name,
                                "Layer %s Colour" % layer.get("name", index),
                                (x_color, order_y), "sRGB")
        if color_tex:
            influence = opacity * max(0.0, min(1.0, float(layer.get("colorInfluence", 1.0))))
            factor = _alpha_factor(nodes, links, color_tex, influence, (x_color + 190, order_y - 110),
                                   "Layer %s colour factor" % index)
            mix = _new_node(nodes, "ShaderNodeMixRGB", "Layer %s colour blend" % index,
                            (x_color + 420, order_y))
            blend_modes = {
                "normal": "MIX", "multiply": "MULTIPLY", "screen": "SCREEN",
                "overlay": "OVERLAY", "darken": "DARKEN", "lighten": "LIGHTEN",
                "hard_light": "HARD_LIGHT", "soft_light": "SOFT_LIGHT",
                "difference": "DIFFERENCE",
            }
            mix.blend_type = blend_modes.get(layer.get("blendMode", "normal"), "MIX")
            if color_chain:
                links.new(color_chain, mix.inputs["Color1"])
            else:
                mix.inputs["Color1"].default_value = (1.0, 1.0, 1.0, 1.0)
            links.new(_output(color_tex, ["Color"]), mix.inputs["Color2"])
            if factor:
                links.new(factor, mix.inputs["Fac"])
            else:
                mix.inputs["Fac"].default_value = influence
            color_chain = mix.outputs["Color"]

        # Reflection strength is inverted into roughness; no colour blend mode is used.
        reflection_path = maps.get("reflection") if layer.get("reflectionOn", False) else None
        reflection_tex = _image_node(nodes, links, base_dir, reflection_path, uv_name,
                                     "Layer %s Reflection" % layer.get("name", index),
                                     (x_color, order_y - 300), "Non-Color")
        if reflection_tex:
            bw = _new_node(nodes, "ShaderNodeRGBToBW", "Reflection strength", (x_color + 210, order_y - 300))
            links.new(_output(reflection_tex, ["Color"]), bw.inputs["Color"])
            scaled = _new_node(nodes, "ShaderNodeMath", "Reflection influence", (x_color + 400, order_y - 300))
            scaled.operation = 'MULTIPLY'
            scaled.inputs[1].default_value = opacity * max(0.0, min(1.0, float(layer.get("reflectionInfluence", 0.0))))
            links.new(bw.outputs["Val"], scaled.inputs[0])
            invert = _new_node(nodes, "ShaderNodeMath", "Reflection to roughness", (x_color + 590, order_y - 300))
            invert.operation = 'SUBTRACT'
            invert.inputs[0].default_value = 1.0
            links.new(scaled.outputs[0], invert.inputs[1])
            factor = _alpha_factor(nodes, links, reflection_tex, 1.0, (x_color + 210, order_y - 420),
                                   "Reflection alpha")
            mix = _new_node(nodes, "ShaderNodeMixRGB", "Roughness layer mix", (x_color + 800, order_y - 300))
            mix.inputs["Color1"].default_value = (1.0, 1.0, 1.0, 1.0) if roughness_chain is None else (0.5, 0.5, 0.5, 1.0)
            if roughness_chain:
                links.new(roughness_chain, mix.inputs["Color1"])
            links.new(invert.outputs[0], mix.inputs["Color2"])
            if factor:
                links.new(factor, mix.inputs["Fac"])
            else:
                mix.inputs["Fac"].default_value = 0.0
            roughness_chain = mix.outputs["Color"]

        # Emission accumulates additively, independent of albedo.
        emission_path = maps.get("emission") if layer.get("emissionOn", False) else None
        emission_tex = _image_node(nodes, links, base_dir, emission_path, uv_name,
                                   "Layer %s Emission" % layer.get("name", index),
                                   (x_color, order_y - 600), "sRGB")
        if emission_tex:
            influence = opacity * max(0.0, min(1.0, float(layer.get("emissionInfluence", 0.0))))
            factor = _alpha_factor(nodes, links, emission_tex, influence, (x_color + 210, order_y - 710),
                                   "Emission factor")
            add = _new_node(nodes, "ShaderNodeMixRGB", "Emission additive mix", (x_color + 440, order_y - 600))
            add.blend_type = 'ADD'
            if emission_chain:
                links.new(emission_chain, add.inputs["Color1"])
            else:
                add.inputs["Color1"].default_value = (0.0, 0.0, 0.0, 1.0)
            links.new(_output(emission_tex, ["Color"]), add.inputs["Color2"])
            if factor:
                links.new(factor, add.inputs["Fac"])
            else:
                add.inputs["Fac"].default_value = influence
            emission_chain = add.outputs["Color"]

        # Height is ramped per layer and accumulated into one scalar height chain.
        height_path = maps.get("height") if layer.get("bumpOn", False) else None
        height_tex = _image_node(nodes, links, base_dir, height_path, uv_name,
                                 "Layer %s Height" % layer.get("name", index),
                                 (x_color, order_y - 900), "Non-Color")
        if height_tex:
            ramp_output = _ramp_node(nodes, links, height_tex, layer.get("bumpRamp", []),
                                     (x_color + 220, order_y - 900), "Layer %s" % index)
            influence = opacity * max(0.0, min(1.0, float(layer.get("bumpInfluence", 0.0))))
            factor = _alpha_factor(nodes, links, height_tex, influence, (x_color + 220, order_y - 1030),
                                   "Height factor")
            add = _new_node(nodes, "ShaderNodeMixRGB", "Height additive mix", (x_color + 480, order_y - 900))
            add.blend_type = 'ADD'
            if height_chain:
                links.new(height_chain, add.inputs["Color1"])
            else:
                add.inputs["Color1"].default_value = (0.0, 0.0, 0.0, 1.0)
            links.new(ramp_output, add.inputs["Color2"])
            if factor:
                links.new(factor, add.inputs["Fac"])
            else:
                add.inputs["Fac"].default_value = influence
            height_chain = add.outputs["Color"]

        if layer.get("normalLock", False) and maps.get("normal"):
            normal_texture = _image_node(nodes, links, base_dir, maps.get("normal"), uv_name,
                                         "Locked Normal - " + layer.get("name", str(index)),
                                         (x_color + 20, order_y - 1200), "Non-Color")
            normal_strength = max(0.0, min(2.0, float(layer.get("normalStrength", 1.0))))

    if color_chain:
        links.new(color_chain, _socket(principled, ["Base Color"]))
    if roughness_chain:
        links.new(roughness_chain, _socket(principled, ["Roughness"]))
    if emission_chain:
        emission_input = _socket(principled, ["Emission", "Emission Color"])
        if emission_input:
            links.new(emission_chain, emission_input)
        _set_default(principled, ["Emission Strength"], 1.0)

    if normal_texture:
        normal_node = _new_node(nodes, "ShaderNodeNormalMap", "Single locked normal source", (850, -650))
        links.new(_output(normal_texture, ["Color"]), normal_node.inputs["Color"])
        if normal_node.inputs.get("Strength") is not None:
            normal_node.inputs["Strength"].default_value = normal_strength
        normal_output = _output(normal_node, ["Normal"])
        if normal_output:
            links.new(normal_output, _socket(principled, ["Normal"]))
    elif height_chain:
        height_normal = _new_node(nodes, "ShaderNodeNormalMap", "Normal from combined height", (850, -900))
        links.new(height_chain, height_normal.inputs["Color"])
        links.new(_output(height_normal, ["Normal"]), _socket(principled, ["Normal"]))
        displacement = _new_node(nodes, "ShaderNodeDisplacement", "Height displacement", (1200, -650))
        links.new(height_chain, _socket(displacement, ["Height"]))
        displacement_output = _output(displacement, ["Displacement"])
        displacement_input = _socket(output, ["Displacement"])
        if displacement_output and displacement_input:
            links.new(displacement_output, displacement_input)

    print("[VUE 3D Canvas] Imported %d layer records into one Principled material: %s" %
          (len(layers), material.name))
    return material


def import_vue_layer_bundle(zip_path, target_material_name=None):
    """Import a VUE .xblend + ZIP bundle generated by the self-hosted painter."""
    manifest, base_dir = _load_manifest(zip_path)
    return _build_layer_material(manifest, base_dir, target_material_name)


# Compatibility name for older scripts. The retired web node graph is intentionally unsupported.
def import_vue_material_graph(json_file_or_string, target_material_name=None):
    raise ValueError(
        "The old web node-graph importer is retired. Export a .xblend + ZIP bundle "
        "and call import_vue_layer_bundle(zip_path) instead."
    )


if __name__ == "__main__":
    print("VUE 3D Canvas importer ready. Run import_vue_layer_bundle('/path/to/project.zip') "
          "with a mesh object selected.")
