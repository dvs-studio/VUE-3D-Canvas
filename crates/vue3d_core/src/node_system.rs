//! VUE 3D Canvas - Production Node Graph Data System & Blender 2.8+ Bridge
//! Author: Victory Ukpong
//! Architecture: Rust Core (Low Memory Footprint, WASM-First & Win32 D3D11 Native)

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SocketValue {
    Color([f32; 4]),
    Vector([f32; 3]),
    Float(f32),
    ShaderSlot,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NodeSocket {
    pub identifier: String,
    pub name: String,
    pub socket_type: SocketType,
    pub default_value: Option<SocketValue>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BlenderNodeType {
    ShaderNodeTexCoord,
    ShaderNodeUVMap,
    ShaderNodeNewGeometry,
    ShaderNodeRGB,
    ShaderNodeValue,
    ShaderNodeTexImage,
    ShaderNodeTexNoise,
    ShaderNodeTexVoronoi,
    ShaderNodeTexWave,
    ShaderNodeTexMusgrave,
    ShaderNodeTexGradient,
    ShaderNodeTexChecker,
    ShaderNodeTexBrick,
    ShaderNodeMixRGB,
    ShaderNodeInvert,
    ShaderNodeValToRGB,
    ShaderNodeBrightContrast,
    ShaderNodeHueSaturation,
    ShaderNodeGamma,
    ShaderNodeMapping,
    ShaderNodeVectorMath,
    ShaderNodeMath,
    ShaderNodeRGBToBW,
    ShaderNodeSeparateRGB,
    ShaderNodeCombineRGB,
    ShaderNodeSeparateXYZ,
    ShaderNodeCombineXYZ,
    ShaderNodeVectorTransform,
    ShaderNodeBump,
    ShaderNodeNormalMap,
    ShaderNodeMixShader,
    ShaderNodeEmission,
    ShaderNodeBsdfPrincipled,
    ShaderNodeOutputMaterial,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RustShaderNode {
    pub id: String,
    pub node_type: BlenderNodeType,
    pub title: String,
    pub x: f32,
    pub y: f32,
    pub inputs: Vec<NodeSocket>,
    pub outputs: Vec<NodeSocket>,
    pub properties: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RustNodeConnection {
    pub id: String,
    pub from_node_id: String,
    pub from_socket_id: String,
    pub to_node_id: String,
    pub to_socket_id: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RustNodeGraph {
    pub nodes: Vec<RustShaderNode>,
    pub connections: Vec<RustNodeConnection>,
}

impl RustNodeGraph {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_node(&mut self, node: RustShaderNode) {
        self.nodes.push(node);
    }

    pub fn connect(&mut self, from_node: &str, from_socket: &str, to_node: &str, to_socket: &str) {
        self.connections.push(RustNodeConnection {
            id: format!("{}_{}_{}_{}", from_node, from_socket, to_node, to_socket),
            from_node_id: from_node.to_string(),
            from_socket_id: from_socket.to_string(),
            to_node_id: to_node.to_string(),
            to_socket_id: to_socket.to_string(),
        });
    }

    /// Auto-arranger utility: layers nodes topologically from inputs on the left to outputs on the right
    pub fn auto_arrange(&mut self) {
        let mut ranks: HashMap<String, usize> = HashMap::new();

        // Nodes with no inputs or pure generator nodes start at rank 0
        for node in &self.nodes {
            match node.node_type {
                BlenderNodeType::ShaderNodeTexCoord
                | BlenderNodeType::ShaderNodeUVMap
                | BlenderNodeType::ShaderNodeRGB
                | BlenderNodeType::ShaderNodeValue
                | BlenderNodeType::ShaderNodeNewGeometry => {
                    ranks.insert(node.id.clone(), 0);
                }
                _ => {}
            }
        }

        // Propagate ranks through connections
        let mut changed = true;
        let mut passes = 0;
        while changed && passes < 20 {
            changed = false;
            passes += 1;
            for conn in &self.connections {
                let from_rank = *ranks.get(&conn.from_node_id).unwrap_or(&0);
                let to_rank = ranks.entry(conn.to_node_id.clone()).or_insert(1);
                if from_rank + 1 > *to_rank {
                    *to_rank = from_rank + 1;
                    changed = true;
                }
            }
        }

        // Material output always highest rank
        let max_rank = ranks.values().cloned().max().unwrap_or(0);
        for node in &self.nodes {
            if node.node_type == BlenderNodeType::ShaderNodeOutputMaterial {
                ranks.insert(node.id.clone(), max_rank + 1);
            }
        }

        // Position nodes with clean spacing: 280px X spacing, 180px Y spacing
        let mut rank_counts: HashMap<usize, usize> = HashMap::new();
        for node in &mut self.nodes {
            let r = *ranks.get(&node.id).unwrap_or(&1);
            let count_in_rank = rank_counts.entry(r).or_insert(0);
            node.x = 60.0 + (r as f32) * 280.0;
            node.y = 80.0 + (*count_in_rank as f32) * 200.0;
            *count_in_rank += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_socket_types() {
        assert_eq!(SocketType::Color.hex_color(), "#e5b538");
        assert_eq!(SocketType::Vector.to_blender_type_string(), "NodeSocketVector");
    }

    #[test]
    fn test_node_graph_auto_arrange() {
        let mut graph = RustNodeGraph::new();
        let uv_node = RustShaderNode {
            id: "uv1".into(),
            node_type: BlenderNodeType::ShaderNodeUVMap,
            title: "UV Map".into(),
            x: 0.0,
            y: 0.0,
            inputs: vec![],
            outputs: vec![NodeSocket {
                identifier: "UV".into(),
                name: "UV".into(),
                socket_type: SocketType::Vector,
                default_value: None,
            }],
            properties: HashMap::new(),
        };
        let out_node = RustShaderNode {
            id: "out1".into(),
            node_type: BlenderNodeType::ShaderNodeOutputMaterial,
            title: "Material Output".into(),
            x: 0.0,
            y: 0.0,
            inputs: vec![NodeSocket {
                identifier: "Surface".into(),
                name: "Surface".into(),
                socket_type: SocketType::Shader,
                default_value: None,
            }],
            outputs: vec![],
            properties: HashMap::new(),
        };
        graph.add_node(uv_node);
        graph.add_node(out_node);
        graph.connect("uv1", "UV", "out1", "Surface");
        graph.auto_arrange();

        assert!(graph.nodes[0].x < graph.nodes[1].x);
    }
}
