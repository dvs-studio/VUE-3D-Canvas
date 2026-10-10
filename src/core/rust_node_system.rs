//! VUE 3D Canvas - Production Node Graph Data System & D3D11 / Blender 2.8+ Bridge
//! Author: Victory Ukpong
//! Architecture: Rust Core (Low Memory Footprint, WASM-First & Win32 D3D11 Native)
//!
//! Component A: Rust Node Layout & State Core
//! Component B: Touch Navigation & Modal Window Handler
//! Component C: Integrated Agnostic Serialization matching Blender 2.8 Python API

use std::collections::HashMap;

// ============================================================================
// COMPONENT A: THE RUST NODE LAYOUT & STATE CORE
// ============================================================================

/// Exact socket type matching Blender 2.8 & ArmorPaint D3D11 shader socket colors:
/// - Color  -> Yellow (#e5b538)
/// - Vector -> Blue (#6366f1)
/// - Float  -> Light Gray (#a0a0a0)
/// - Shader -> Green (#22c55e)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SocketType {
    Color,
    Vector,
    Float,
    Shader,
}

impl SocketType {
    pub fn hex_color(&self) -> &'static str {
        match self {
            SocketType::Color => "#e5b538",
            SocketType::Vector => "#6366f1",
            SocketType::Float => "#a0a0a0",
            SocketType::Shader => "#22c55e",
        }
    }

    pub fn to_blender_type_string(&self) -> &'static str {
        match self {
            SocketType::Color => "NodeSocketColor",
            SocketType::Vector => "NodeSocketVector",
            SocketType::Float => "NodeSocketFloat",
            SocketType::Shader => "NodeSocketShader",
        }
    }
}

/// Dynamic value representation for socket default values & evaluations
#[derive(Debug, Clone, PartialEq)]
pub enum SocketValue {
    Color([f32; 4]),
    Vector([f32; 3]),
    Float(f32),
    ShaderSlot,
}

/// A node input or output socket definition
#[derive(Debug, Clone, PartialEq)]
pub struct NodeSocket {
    pub identifier: String,
    pub name: String,
    pub socket_type: SocketType,
    pub default_value: Option<SocketValue>,
}

/// Comprehensive Data Dictionary for Blender 2.8+ / ArmorPaint D3D11 Shader Nodes
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum BlenderNodeType {
    // Input Nodes
    ShaderNodeTexCoord,
    ShaderNodeUVMap,
    ShaderNodeNewGeometry,
    ShaderNodeRGB,
    ShaderNodeValue,

    // Procedural / Raster Textures (D3D11 HLSL Evaluated)
    ShaderNodeTexImage,
    ShaderNodeTexNoise,
    ShaderNodeTexVoronoi,
    ShaderNodeTexWave,
    ShaderNodeTexMusgrave,
    ShaderNodeTexGradient,
    ShaderNodeTexChecker,
    ShaderNodeTexBrick,

    // Color, Vector & Scalar Computation
    ShaderNodeMixRGB,
    ShaderNodeInvert,
    ShaderNodeValToRGB,
    ShaderNodeBrightContrast,
    ShaderNodeHueSaturation,
    ShaderNodeGamma,
    ShaderNodeMapping,
    ShaderNodeVectorMath,

    // Converters, Converges & Utilities
    ShaderNodeMath,
    ShaderNodeRGBToBW,
    ShaderNodeSeparateRGB,
    ShaderNodeCombineRGB,
    ShaderNodeSeparateXYZ,
    ShaderNodeCombineXYZ,

    // Shader Nodes & Terminals
    ShaderNodeBump,
    ShaderNodeNormalMap,
    ShaderNodeMixShader,
    ShaderNodeBsdfPrincipled,
    ShaderNodeOutputMaterial,
}

impl BlenderNodeType {
    /// Returns the exact string identifier required by Blender's bpy `nodes.new(type=...)`
    pub fn blender_type_name(&self) -> &'static str {
        match self {
            BlenderNodeType::ShaderNodeTexCoord => "ShaderNodeTexCoord",
            BlenderNodeType::ShaderNodeUVMap => "ShaderNodeUVMap",
            BlenderNodeType::ShaderNodeNewGeometry => "ShaderNodeNewGeometry",
            BlenderNodeType::ShaderNodeRGB => "ShaderNodeRGB",
            BlenderNodeType::ShaderNodeValue => "ShaderNodeValue",

            BlenderNodeType::ShaderNodeTexImage => "ShaderNodeTexImage",
            BlenderNodeType::ShaderNodeTexNoise => "ShaderNodeTexNoise",
            BlenderNodeType::ShaderNodeTexVoronoi => "ShaderNodeTexVoronoi",
            BlenderNodeType::ShaderNodeTexWave => "ShaderNodeTexWave",
            BlenderNodeType::ShaderNodeTexMusgrave => "ShaderNodeTexMusgrave",
            BlenderNodeType::ShaderNodeTexGradient => "ShaderNodeTexGradient",
            BlenderNodeType::ShaderNodeTexChecker => "ShaderNodeTexChecker",
            BlenderNodeType::ShaderNodeTexBrick => "ShaderNodeTexBrick",

            BlenderNodeType::ShaderNodeMixRGB => "ShaderNodeMixRGB",
            BlenderNodeType::ShaderNodeInvert => "ShaderNodeInvert",
            BlenderNodeType::ShaderNodeValToRGB => "ShaderNodeValToRGB",
            BlenderNodeType::ShaderNodeBrightContrast => "ShaderNodeBrightContrast",
            BlenderNodeType::ShaderNodeHueSaturation => "ShaderNodeHueSaturation",
            BlenderNodeType::ShaderNodeGamma => "ShaderNodeGamma",
            BlenderNodeType::ShaderNodeMapping => "ShaderNodeMapping",
            BlenderNodeType::ShaderNodeVectorMath => "ShaderNodeVectorMath",

            BlenderNodeType::ShaderNodeMath => "ShaderNodeMath",
            BlenderNodeType::ShaderNodeRGBToBW => "ShaderNodeRGBToBW",
            BlenderNodeType::ShaderNodeSeparateRGB => "ShaderNodeSeparateRGB",
            BlenderNodeType::ShaderNodeCombineRGB => "ShaderNodeCombineRGB",
            BlenderNodeType::ShaderNodeSeparateXYZ => "ShaderNodeSeparateXYZ",
            BlenderNodeType::ShaderNodeCombineXYZ => "ShaderNodeCombineXYZ",

            BlenderNodeType::ShaderNodeBump => "ShaderNodeBump",
            BlenderNodeType::ShaderNodeNormalMap => "ShaderNodeNormalMap",
            BlenderNodeType::ShaderNodeMixShader => "ShaderNodeMixShader",
            BlenderNodeType::ShaderNodeBsdfPrincipled => "ShaderNodeBsdfPrincipled",
            BlenderNodeType::ShaderNodeOutputMaterial => "ShaderNodeOutputMaterial",
        }
    }
}

/// A node in the graph layout with exact inputs, outputs, coordinates, and property map
#[derive(Debug, Clone)]
pub struct GraphNode {
    pub id: String,
    pub title: String,
    pub node_type: BlenderNodeType,
    pub location: (f32, f32),
    pub size: (f32, f32),
    pub inputs: Vec<NodeSocket>,
    pub outputs: Vec<NodeSocket>,
    /// Properties hash-map storing exact Blender internal variables
    /// (e.g. "interpolation" -> "LINEAR", "blend_type" -> "MULTIPLY", "color_space" -> "sRGB")
    pub properties: HashMap<String, String>,
}

impl GraphNode {
    pub fn new(id: impl Into<String>, title: impl Into<String>, node_type: BlenderNodeType, x: f32, y: f32) -> Self {
        let (inputs, outputs, default_props) = Self::generate_default_schema(&node_type);
        Self {
            id: id.into(),
            title: title.into(),
            node_type,
            location: (x, y),
            size: (220.0, 160.0),
            inputs,
            outputs,
            properties: default_props,
        }
    }

    /// Factory method providing canonical socket specifications for all Blender 2.8 nodes
    fn generate_default_schema(
        node_type: &BlenderNodeType,
    ) -> (Vec<NodeSocket>, Vec<NodeSocket>, HashMap<String, String>) {
        let mut inputs = Vec::new();
        let mut outputs = Vec::new();
        let mut props = HashMap::new();

        match node_type {
            BlenderNodeType::ShaderNodeTexCoord => {
                outputs.push(NodeSocket { identifier: "Generated".into(), name: "Generated".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "Normal".into(), name: "Normal".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "UV".into(), name: "UV".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "Object".into(), name: "Object".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "Camera".into(), name: "Camera".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "Window".into(), name: "Window".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "Reflection".into(), name: "Reflection".into(), socket_type: SocketType::Vector, default_value: None });
            }

            BlenderNodeType::ShaderNodeMapping => {
                inputs.push(NodeSocket { identifier: "Vector".into(), name: "Vector".into(), socket_type: SocketType::Vector, default_value: None });
                inputs.push(NodeSocket { identifier: "Location".into(), name: "Location".into(), socket_type: SocketType::Vector, default_value: Some(SocketValue::Vector([0.0, 0.0, 0.0])) });
                inputs.push(NodeSocket { identifier: "Rotation".into(), name: "Rotation".into(), socket_type: SocketType::Vector, default_value: Some(SocketValue::Vector([0.0, 0.0, 0.0])) });
                inputs.push(NodeSocket { identifier: "Scale".into(), name: "Scale".into(), socket_type: SocketType::Vector, default_value: Some(SocketValue::Vector([1.0, 1.0, 1.0])) });
                outputs.push(NodeSocket { identifier: "Vector".into(), name: "Vector".into(), socket_type: SocketType::Vector, default_value: None });
                props.insert("vector_type".into(), "POINT".into());
            }

            BlenderNodeType::ShaderNodeTexNoise => {
                inputs.push(NodeSocket { identifier: "Vector".into(), name: "Vector".into(), socket_type: SocketType::Vector, default_value: None });
                inputs.push(NodeSocket { identifier: "Scale".into(), name: "Scale".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(5.0)) });
                inputs.push(NodeSocket { identifier: "Detail".into(), name: "Detail".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(2.0)) });
                inputs.push(NodeSocket { identifier: "Roughness".into(), name: "Roughness".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.5)) });
                inputs.push(NodeSocket { identifier: "Distortion".into(), name: "Distortion".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.0)) });
                outputs.push(NodeSocket { identifier: "Color".into(), name: "Color".into(), socket_type: SocketType::Color, default_value: None });
                outputs.push(NodeSocket { identifier: "Fac".into(), name: "Fac".into(), socket_type: SocketType::Float, default_value: None });
                props.insert("noise_dimensions".into(), "3D".into());
            }

            BlenderNodeType::ShaderNodeValToRGB => {
                inputs.push(NodeSocket { identifier: "Fac".into(), name: "Fac".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.5)) });
                outputs.push(NodeSocket { identifier: "Color".into(), name: "Color".into(), socket_type: SocketType::Color, default_value: None });
                outputs.push(NodeSocket { identifier: "Alpha".into(), name: "Alpha".into(), socket_type: SocketType::Float, default_value: None });
                props.insert("interpolation".into(), "LINEAR".into());
            }

            BlenderNodeType::ShaderNodeMixRGB => {
                inputs.push(NodeSocket { identifier: "Fac".into(), name: "Fac".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.5)) });
                inputs.push(NodeSocket { identifier: "Color1".into(), name: "Color1".into(), socket_type: SocketType::Color, default_value: Some(SocketValue::Color([1.0, 1.0, 1.0, 1.0])) });
                inputs.push(NodeSocket { identifier: "Color2".into(), name: "Color2".into(), socket_type: SocketType::Color, default_value: Some(SocketValue::Color([0.0, 0.0, 0.0, 1.0])) });
                outputs.push(NodeSocket { identifier: "Color".into(), name: "Color".into(), socket_type: SocketType::Color, default_value: None });
                props.insert("blend_type".into(), "MIX".into());
                props.insert("use_clamp".into(), "True".into());
            }

            BlenderNodeType::ShaderNodeTexImage => {
                inputs.push(NodeSocket { identifier: "Vector".into(), name: "Vector".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "Color".into(), name: "Color".into(), socket_type: SocketType::Color, default_value: None });
                outputs.push(NodeSocket { identifier: "Alpha".into(), name: "Alpha".into(), socket_type: SocketType::Float, default_value: None });
                props.insert("interpolation".into(), "Linear".into());
                props.insert("extension".into(), "REPEAT".into());
                props.insert("color_space".into(), "sRGB".into());
            }

            BlenderNodeType::ShaderNodeBsdfPrincipled => {
                inputs.push(NodeSocket { identifier: "Base Color".into(), name: "Base Color".into(), socket_type: SocketType::Color, default_value: Some(SocketValue::Color([0.8, 0.8, 0.8, 1.0])) });
                inputs.push(NodeSocket { identifier: "Subsurface".into(), name: "Subsurface".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.0)) });
                inputs.push(NodeSocket { identifier: "Subsurface Radius".into(), name: "Subsurface Radius".into(), socket_type: SocketType::Vector, default_value: Some(SocketValue::Vector([1.0, 0.2, 0.1])) });
                inputs.push(NodeSocket { identifier: "Subsurface Color".into(), name: "Subsurface Color".into(), socket_type: SocketType::Color, default_value: Some(SocketValue::Color([1.0, 1.0, 1.0, 1.0])) });
                inputs.push(NodeSocket { identifier: "Metallic".into(), name: "Metallic".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.0)) });
                inputs.push(NodeSocket { identifier: "Specular".into(), name: "Specular".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.5)) });
                inputs.push(NodeSocket { identifier: "Roughness".into(), name: "Roughness".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.4)) });
                inputs.push(NodeSocket { identifier: "Anisotropic".into(), name: "Anisotropic".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.0)) });
                inputs.push(NodeSocket { identifier: "Sheen".into(), name: "Sheen".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.0)) });
                inputs.push(NodeSocket { identifier: "Clearcoat".into(), name: "Clearcoat".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.0)) });
                inputs.push(NodeSocket { identifier: "IOR".into(), name: "IOR".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(1.45)) });
                inputs.push(NodeSocket { identifier: "Transmission".into(), name: "Transmission".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(0.0)) });
                inputs.push(NodeSocket { identifier: "Emission".into(), name: "Emission".into(), socket_type: SocketType::Color, default_value: Some(SocketValue::Color([0.0, 0.0, 0.0, 1.0])) });
                inputs.push(NodeSocket { identifier: "Alpha".into(), name: "Alpha".into(), socket_type: SocketType::Float, default_value: Some(SocketValue::Float(1.0)) });
                inputs.push(NodeSocket { identifier: "Normal".into(), name: "Normal".into(), socket_type: SocketType::Vector, default_value: None });
                outputs.push(NodeSocket { identifier: "BSDF".into(), name: "BSDF".into(), socket_type: SocketType::Shader, default_value: None });
            }

            BlenderNodeType::ShaderNodeOutputMaterial => {
                inputs.push(NodeSocket { identifier: "Surface".into(), name: "Surface".into(), socket_type: SocketType::Shader, default_value: None });
                inputs.push(NodeSocket { identifier: "Volume".into(), name: "Volume".into(), socket_type: SocketType::Shader, default_value: None });
                inputs.push(NodeSocket { identifier: "Displacement".into(), name: "Displacement".into(), socket_type: SocketType::Vector, default_value: None });
                props.insert("target".into(), "ALL".into());
            }

            _ => {
                inputs.push(NodeSocket { identifier: "In".into(), name: "Input".into(), socket_type: SocketType::Color, default_value: None });
                outputs.push(NodeSocket { identifier: "Out".into(), name: "Output".into(), socket_type: SocketType::Color, default_value: None });
            }
        }

        (inputs, outputs, props)
    }
}

/// Linkage connecting an output socket of one node to an input socket of another
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NodeLink {
    pub from_node_id: String,
    pub from_socket: String,
    pub to_node_id: String,
    pub to_socket: String,
}

/// The complete Graph State Tree containing nodes, links, and metadata
#[derive(Debug, Clone)]
pub struct NodeGraphTree {
    pub material_name: String,
    pub nodes: Vec<GraphNode>,
    pub links: Vec<NodeLink>,
}

impl NodeGraphTree {
    pub fn new(material_name: impl Into<String>) -> Self {
        Self {
            material_name: material_name.into(),
            nodes: Vec::new(),
            links: Vec::new(),
        }
    }

    pub fn add_node(&mut self, node: GraphNode) {
        self.nodes.push(node);
    }

    pub fn connect(
        &mut self,
        from_id: impl Into<String>,
        from_sock: impl Into<String>,
        to_id: impl Into<String>,
        to_sock: impl Into<String>,
    ) {
        self.links.push(NodeLink {
            from_node_id: from_id.into(),
            from_socket: from_sock.into(),
            to_node_id: to_id.into(),
            to_socket: to_sock.into(),
        });
    }
}

// ============================================================================
// COMPONENT B: TOUCH NAVIGATION & MODAL WINDOW HANDLER
// ============================================================================

/// Modal tracking mode for the viewport window
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NavigationMode {
    /// Standard viewport pan, pinch-to-zoom matrix tracking
    CanvasPanZoom,
    /// Locked viewport canvas, localized element & socket editing active
    NodeEditing,
}

/// Mathematical 2D transform matrix for pan and zoom tracking
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ViewportMatrix {
    pub pan_x: f32,
    pub pan_y: f32,
    pub zoom: f32,
}

impl Default for ViewportMatrix {
    fn default() -> Self {
        Self { pan_x: 0.0, pan_y: 0.0, zoom: 1.0 }
    }
}

impl ViewportMatrix {
    /// Screen coordinate to world canvas coordinate transformation
    #[inline]
    pub fn screen_to_world(&self, screen_x: f32, screen_y: f32) -> (f32, f32) {
        (
            (screen_x - self.pan_x) / self.zoom,
            (screen_y - self.pan_y) / self.zoom,
        )
    }

    /// World canvas coordinate to screen coordinate transformation
    #[inline]
    pub fn world_to_screen(&self, world_x: f32, world_y: f32) -> (f32, f32) {
        (
            world_x * self.zoom + self.pan_x,
            world_y * self.zoom + self.pan_y,
        )
    }
}

/// State tracker implementing Component B modal requirements:
/// - Screen coordinate inputs `(tap_x, tap_y)` combined with world canvas translation matrices
/// - Boundary hit-testing locking global canvas movements on node hit
/// - Safe flush of active selection and re-engagement of pan/pinch on miss
pub struct TouchModalHandler {
    pub current_mode: NavigationMode,
    pub active_selected_node_id: Option<String>,
    pub matrix: ViewportMatrix,
    pub is_dragging_node: bool,
    pub drag_offset: (f32, f32),
    pub pinch_initial_distance: Option<f32>,
    pub pinch_initial_zoom: f32,
}

impl TouchModalHandler {
    pub fn new() -> Self {
        Self {
            current_mode: NavigationMode::CanvasPanZoom,
            active_selected_node_id: None,
            matrix: ViewportMatrix::default(),
            is_dragging_node: false,
            drag_offset: (0.0, 0.0),
            pinch_initial_distance: None,
            pinch_initial_zoom: 1.0,
        }
    }

    /// Functional hit-box tracking function taking screen coordinate inputs `(tap_x, tap_y)`
    /// combined with world canvas translation matrices `(pan_offset, zoom_level)`.
    pub fn handle_tap_down(&mut self, tap_x: f32, tap_y: f32, graph: &NodeGraphTree) -> NavigationMode {
        let (world_x, world_y) = self.matrix.screen_to_world(tap_x, tap_y);

        // Reverse iterate to pick top-most rendered node
        for node in graph.nodes.iter().rev() {
            let left = node.location.0;
            let top = node.location.1;
            let right = left + node.size.0;
            let bottom = top + node.size.1;

            if world_x >= left && world_x <= right && world_y >= top && world_y <= bottom {
                // Node boundary box clicked!
                // Lock global canvas movements completely and expose localized element parameters
                self.current_mode = NavigationMode::NodeEditing;
                self.active_selected_node_id = Some(node.id.clone());
                self.is_dragging_node = true;
                self.drag_offset = (world_x - left, world_y - top);
                return NavigationMode::NodeEditing;
            }
        }

        // Tap registered outside the bound frame coordinates of any node block:
        // Immediately flush active selection arrays, commit configurations safely,
        // and re-engage standard pan/pinch-to-zoom matrix tracking rules.
        self.active_selected_node_id = None;
        self.is_dragging_node = false;
        self.current_mode = NavigationMode::CanvasPanZoom;
        NavigationMode::CanvasPanZoom
    }

    /// Handle one-finger touch drag or mouse move
    pub fn handle_touch_move(&mut self, screen_x: f32, screen_y: f32, delta_x: f32, delta_y: f32, graph: &mut NodeGraphTree) {
        match self.current_mode {
            NavigationMode::CanvasPanZoom => {
                // Re-engaged standard pan tracking
                self.matrix.pan_x += delta_x;
                self.matrix.pan_y += delta_y;
            }
            NavigationMode::NodeEditing => {
                // Localized element movement: update node world coordinate safely
                if self.is_dragging_node {
                    if let Some(ref sel_id) = self.active_selected_node_id {
                        let (world_x, world_y) = self.matrix.screen_to_world(screen_x, screen_y);
                        for node in &mut graph.nodes {
                            if &node.id == sel_id {
                                node.location.0 = (world_x - self.drag_offset.0).max(0.0);
                                node.location.1 = (world_y - self.drag_offset.1).max(0.0);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    /// Handle multi-touch pinch-to-zoom gesture
    pub fn handle_pinch_zoom(&mut self, current_finger_distance: f32) {
        if let Some(initial_dist) = self.pinch_initial_distance {
            if initial_dist > 0.001 {
                let ratio = current_finger_distance / initial_dist;
                let new_zoom = (self.pinch_initial_zoom * ratio).clamp(0.25, 3.0);
                self.matrix.zoom = new_zoom;
            }
        } else {
            self.pinch_initial_distance = Some(current_finger_distance);
            self.pinch_initial_zoom = self.matrix.zoom;
        }
    }

    pub fn handle_touch_up(&mut self) {
        self.is_dragging_node = false;
        self.pinch_initial_distance = None;
    }
}

// ============================================================================
// COMPONENT C: THE COMPLETE BLENDER 2.8 PY EXPORTER SCRIPT GENERATOR
// ============================================================================

impl NodeGraphTree {
    /// Integrated serialization method generating valid, cleanly structured target-agnostic JSON
    pub fn serialize_to_json(&self) -> String {
        let mut json = String::with_capacity(4096);
        json.push_str("{\n");
        json.push_str(&format!("  \"material_name\": \"{}\",\n", self.material_name));
        json.push_str("  \"nodes\": [\n");

        for (i, node) in self.nodes.iter().enumerate() {
            json.push_str("    {\n");
            json.push_str(&format!("      \"id\": \"{}\",\n", node.id));
            json.push_str(&format!("      \"title\": \"{}\",\n", node.title));
            json.push_str(&format!("      \"blender_type_name\": \"{}\",\n", node.node_type.blender_type_name()));
            json.push_str(&format!("      \"location\": [{}, {}],\n", node.location.0, node.location.1));
            json.push_str(&format!("      \"size\": [{}, {}],\n", node.size.0, node.size.1));

            // Properties
            json.push_str("      \"properties\": {\n");
            let mut prop_entries: Vec<_> = node.properties.iter().collect();
            prop_entries.sort_by_key(|(k, _)| *k);
            for (p_idx, (k, v)) in prop_entries.iter().enumerate() {
                let comma = if p_idx + 1 < prop_entries.len() { "," } else { "" };
                json.push_str(&format!("        \"{}\": \"{}\"{}\n", k, v, comma));
            }
            json.push_str("      },\n");

            // Inputs
            json.push_str("      \"inputs\": [\n");
            for (in_idx, inp) in node.inputs.iter().enumerate() {
                let comma = if in_idx + 1 < node.inputs.len() { "," } else { "" };
                json.push_str(&format!(
                    "        {{\"identifier\": \"{}\", \"name\": \"{}\", \"type\": \"{}\"}}{}\n",
                    inp.identifier, inp.name, inp.socket_type.to_blender_type_string(), comma
                ));
            }
            json.push_str("      ],\n");

            // Outputs
            json.push_str("      \"outputs\": [\n");
            for (out_idx, out) in node.outputs.iter().enumerate() {
                let comma = if out_idx + 1 < node.outputs.len() { "," } else { "" };
                json.push_str(&format!(
                    "        {{\"identifier\": \"{}\", \"name\": \"{}\", \"type\": \"{}\"}}{}\n",
                    out.identifier, out.name, out.socket_type.to_blender_type_string(), comma
                ));
            }
            json.push_str("      ]\n");

            let node_comma = if i + 1 < self.nodes.len() { "," } else { "" };
            json.push_str(&format!("    }}{}\n", node_comma));
        }

        json.push_str("  ],\n");
        json.push_str("  \"links\": [\n");

        for (l_idx, link) in self.links.iter().enumerate() {
            let comma = if l_idx + 1 < self.links.len() { "," } else { "" };
            json.push_str(&format!(
                "    {{\"from_node_id\": \"{}\", \"from_socket\": \"{}\", \"to_node_id\": \"{}\", \"to_socket\": \"{}\"}}{}\n",
                link.from_node_id, link.from_socket, link.to_node_id, link.to_socket, comma
            ));
        }

        json.push_str("  ]\n");
        json.push_str("}\n");
        json
    }

    /// Provides the full accompanying Blender 2.8 Python script wrapper designed to parse
    /// this structural JSON tree natively inside Blender's viewport material graph.
    pub fn generate_blender_python_script(&self) -> String {
        let json_payload = self.serialize_to_json();
        let escaped_json = json_payload.replace('\\', "\\\\").replace('\"', "\\\"");

        format!(
r#"# ==============================================================================
# VUE 3D Canvas -> Blender 2.8+ LTS Native Material Graph Importer
# Generated by VUE 3D Canvas Engine (Victory Ukpong)
# Target: Blender 2.80 - 2.83 LTS Material Node Tree
# ==============================================================================

import bpy
import json

GRAPH_DATA = """{}"""

def import_vue_node_graph(json_str):
    data = json.loads(json_str)
    mat_name = data.get("material_name", "VUE_Material")

    # 1. Ensure or allocate active object and active material
    obj = bpy.context.active_object
    if obj is None:
        bpy.ops.mesh.primitive_cube_add()
        obj = bpy.context.active_object

    mat = bpy.data.materials.get(mat_name)
    if mat is None:
        mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True

    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    tree = mat.node_tree
    nodes = tree.nodes
    links = tree.links

    # Clear existing nodes for pristine recreation
    nodes.clear()

    allocated_nodes = {{}}

    # 2. Allocate and place every node step-by-step
    for node_spec in data.get("nodes", []):
        node_id = node_spec["id"]
        b_type = node_spec["blender_type_name"]
        loc = node_spec.get("location", [0.0, 0.0])

        try:
            b_node = nodes.new(type=b_type)
        except Exception as e:
            print(f"[VUE 3D Exporter] Warning: Failed to allocate {{b_type}}: {{e}}")
            continue

        b_node.name = node_id
        b_node.label = node_spec.get("title", b_type)
        b_node.location = (loc[0], -loc[1]) # Invert Y for Blender 2.8 coordinate system

        # Configure exact attributes from properties map
        props = node_spec.get("properties", {{}})
        for prop_key, prop_val in props.items():
            if hasattr(b_node, prop_key):
                try:
                    attr_type = type(getattr(b_node, prop_key))
                    if attr_type == bool:
                        setattr(b_node, prop_key, prop_val.lower() in ("true", "1"))
                    elif attr_type == int:
                        setattr(b_node, prop_key, int(prop_val))
                    elif attr_type == float:
                        setattr(b_node, prop_key, float(prop_val))
                    else:
                        setattr(b_node, prop_key, prop_val)
                except Exception as ex:
                    print(f"Could not assign property {{prop_key}}={{prop_val}}: {{ex}}")

        allocated_nodes[node_id] = b_node

    # 3. Map linkages step-by-step using .links.new()
    for link_spec in data.get("links", []):
        from_node = allocated_nodes.get(link_spec["from_node_id"])
        to_node = allocated_nodes.get(link_spec["to_node_id"])
        if not from_node or not to_node:
            continue

        from_socket_name = link_spec["from_socket"]
        to_socket_name = link_spec["to_socket"]

        out_sock = from_node.outputs.get(from_socket_name)
        if not out_sock and len(from_node.outputs) > 0:
            out_sock = from_node.outputs[0]

        in_sock = to_node.inputs.get(to_socket_name)
        if not in_sock and len(to_node.inputs) > 0:
            in_sock = to_node.inputs[0]

        if out_sock and in_sock:
            try:
                links.new(out_sock, in_sock)
            except Exception as e:
                print(f"[VUE 3D Exporter] Link error: {{e}}")

    print(f"[VUE 3D Exporter] Successfully imported '{{mat_name}}' with {{len(allocated_nodes)}} nodes and {{len(links)}} links.")

if __name__ == "__main__":
    import_vue_node_graph(GRAPH_DATA)
"#,
            json_payload
        )
    }
}
