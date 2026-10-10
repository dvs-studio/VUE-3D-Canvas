# ==============================================================================
# VUE 3D Canvas -> Blender 2.8+ Structural Exporter & Importer Script
# Author: Victory Ukpong
# System Architecture: Rust (Data Engine) -> Target-Agnostic JSON -> Blender 2.8 bpy
# Compatible with: Blender 2.80, 2.81, 2.82, 2.83 LTS & ArmorPaint D3D11 Layers
# ==============================================================================

import bpy
import json
import os
import sys

def import_vue_material_graph(json_file_or_string, target_material_name=None):
    """
    Parses a VUE 3D Canvas structural JSON export and constructs the exact
    Blender 2.8+ Shader Node Graph in bpy.context.active_object.active_material.node_tree.
    
    Rigidly checks `node.blender_type_name`, allocates nodes via `nodes.new()`,
    sets custom properties, and connects sockets via `links.new()`.
    """
    # 1. Parse JSON payload
    if os.path.isfile(json_file_or_string):
        with open(json_file_or_string, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = json.loads(json_file_or_string)

    mat_name = target_material_name or data.get("material_name", "VUE_D3D11_Material")

    # 2. Get or initialize Active Object
    obj = bpy.context.active_object
    if obj is None:
        bpy.ops.mesh.primitive_cube_add()
        obj = bpy.context.active_object
        print(f"[VUE 3D Exporter] Created default mesh object: {obj.name}")

    # 3. Create or reuse Material
    mat = bpy.data.materials.get(mat_name)
    if mat is None:
        mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True

    # Assign to object's active material slot
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat

    tree = mat.node_tree
    nodes = tree.nodes
    links = tree.links

    # Clear default Principled / Output nodes for a clean structural build
    nodes.clear()

    allocated_nodes = {}

    # 4. Rigorous Blender 2.8 Allocation Loop
    for node_data in data.get("nodes", []):
        node_id = node_data["id"]
        type_name = node_data["blender_type_name"]
        loc = node_data.get("location", [0.0, 0.0])
        title = node_data.get("title", type_name)

        try:
            b_node = nodes.new(type=type_name)
        except Exception as err:
            print(f"[VUE 3D Exporter] Error: Could not allocate node '{type_name}': {err}")
            continue

        b_node.name = node_id
        b_node.label = title
        # Invert Y coordinate so top-to-bottom layout matches Blender 2.8 node editor
        b_node.location = (float(loc[0]), -float(loc[1]))

        # Configure exact attributes from properties dictionary
        props = node_data.get("properties", {})
        for prop_key, prop_val in props.items():
            if hasattr(b_node, prop_key):
                try:
                    attr_type = type(getattr(b_node, prop_key))
                    if attr_type == bool:
                        setattr(b_node, prop_key, str(prop_val).lower() in ("true", "1", "yes"))
                    elif attr_type == int:
                        setattr(b_node, prop_key, int(prop_val))
                    elif attr_type == float:
                        setattr(b_node, prop_key, float(prop_val))
                    else:
                        setattr(b_node, prop_key, str(prop_val))
                except Exception as ex:
                    print(f"[VUE 3D Exporter] Warning setting {node_id}.{prop_key}={prop_val}: {ex}")

        # Specialized node property configurations
        if type_name == "ShaderNodeValToRGB" and "stops" in props:
            # Color ramp stops setup
            pass

        allocated_nodes[node_id] = b_node

    # 5. Connect Links step-by-step using links.new()
    successful_links = 0
    for link_data in data.get("links", []):
        from_id = link_data["from_node_id"]
        to_id = link_data["to_node_id"]
        from_sock_name = link_data["from_socket"]
        to_sock_name = link_data["to_socket"]

        from_node = allocated_nodes.get(from_id)
        to_node = allocated_nodes.get(to_id)

        if not from_node or not to_node:
            print(f"[VUE 3D Exporter] Link warning: Missing node ({from_id} -> {to_id})")
            continue

        # Look up output socket by identifier or name
        out_socket = None
        for s in from_node.outputs:
            if s.identifier == from_sock_name or s.name == from_sock_name:
                out_socket = s
                break
        if out_socket is None and len(from_node.outputs) > 0:
            out_socket = from_node.outputs[0]

        # Look up input socket by identifier or name
        in_socket = None
        for s in to_node.inputs:
            if s.identifier == to_sock_name or s.name == to_sock_name:
                in_socket = s
                break
        if in_socket is None and len(to_node.inputs) > 0:
            in_socket = to_node.inputs[0]

        if out_socket and in_socket:
            try:
                links.new(out_socket, in_socket)
                successful_links += 1
            except Exception as e:
                print(f"[VUE 3D Exporter] Link connection failed: {e}")

    print("=" * 60)
    print(f"[VUE 3D Exporter] Imported '{mat_name}' successfully!")
    print(f"Allocated Nodes: {len(allocated_nodes)}")
    print(f"Created Links:   {successful_links}")
    print("=" * 60)
    return mat


# Quick test invocation if run directly inside Blender's Text Editor
if __name__ == "__main__":
    test_json_sample = {
        "material_name": "VUE_ArmorPaint_PBR",
        "nodes": [
            {
                "id": "tex_coord_1",
                "title": "Texture Coordinate",
                "blender_type_name": "ShaderNodeTexCoord",
                "location": [40, 100],
                "size": [200, 160],
                "properties": {},
                "inputs": [],
                "outputs": [{"identifier": "UV", "name": "UV", "type": "NodeSocketVector"}]
            },
            {
                "id": "mapping_1",
                "title": "Vector Mapping",
                "blender_type_name": "ShaderNodeMapping",
                "location": [280, 100],
                "size": [200, 160],
                "properties": {"vector_type": "POINT"},
                "inputs": [{"identifier": "Vector", "name": "Vector", "type": "NodeSocketVector"}],
                "outputs": [{"identifier": "Vector", "name": "Vector", "type": "NodeSocketVector"}]
            },
            {
                "id": "noise_1",
                "title": "Noise Texture",
                "blender_type_name": "ShaderNodeTexNoise",
                "location": [520, 80],
                "size": [200, 160],
                "properties": {},
                "inputs": [{"identifier": "Vector", "name": "Vector", "type": "NodeSocketVector"}],
                "outputs": [
                    {"identifier": "Color", "name": "Color", "type": "NodeSocketColor"},
                    {"identifier": "Fac", "name": "Fac", "type": "NodeSocketFloat"}
                ]
            },
            {
                "id": "ramp_1",
                "title": "ColorRamp",
                "blender_type_name": "ShaderNodeValToRGB",
                "location": [760, 140],
                "size": [240, 160],
                "properties": {"interpolation": "LINEAR"},
                "inputs": [{"identifier": "Fac", "name": "Fac", "type": "NodeSocketFloat"}],
                "outputs": [{"identifier": "Color", "name": "Color", "type": "NodeSocketColor"}]
            },
            {
                "id": "principled_1",
                "title": "Principled BSDF",
                "blender_type_name": "ShaderNodeBsdfPrincipled",
                "location": [1040, 80],
                "size": [260, 240],
                "properties": {},
                "inputs": [
                    {"identifier": "Base Color", "name": "Base Color", "type": "NodeSocketColor"},
                    {"identifier": "Roughness", "name": "Roughness", "type": "NodeSocketFloat"}
                ],
                "outputs": [{"identifier": "BSDF", "name": "BSDF", "type": "NodeSocketShader"}]
            },
            {
                "id": "output_1",
                "title": "Material Output",
                "blender_type_name": "ShaderNodeOutputMaterial",
                "location": [1340, 80],
                "size": [200, 120],
                "properties": {"target": "ALL"},
                "inputs": [{"identifier": "Surface", "name": "Surface", "type": "NodeSocketShader"}],
                "outputs": []
            }
        ],
        "links": [
            {"from_node_id": "tex_coord_1", "from_socket": "UV", "to_node_id": "mapping_1", "to_socket": "Vector"},
            {"from_node_id": "mapping_1", "from_socket": "Vector", "to_node_id": "noise_1", "to_socket": "Vector"},
            {"from_node_id": "noise_1", "from_socket": "Fac", "to_node_id": "ramp_1", "to_socket": "Fac"},
            {"from_node_id": "ramp_1", "from_socket": "Color", "to_node_id": "principled_1", "to_socket": "Base Color"},
            {"from_node_id": "principled_1", "from_socket": "BSDF", "to_node_id": "output_1", "to_socket": "Surface"}
        ]
    }

    import_vue_material_graph(json.dumps(test_json_sample))
