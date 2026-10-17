//! VUE 3D Canvas - Core Graphics Engine & WASM Module
//! Author: Victory Ukpong
//! Rust/WASM Core for procedural textures, triplanar blending, and Blender material bridging

pub mod node_system;

pub use node_system::*;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn init_vue3d_core() -> String {
    "VUE 3D Canvas Engine Initialized (Rust + WASM)".to_string()
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub fn evaluate_triplanar_weights(nx: f32, ny: f32, nz: f32, sharpness: f32) -> Vec<f32> {
    let mut wx = nx.abs().powf(sharpness);
    let mut wy = ny.abs().powf(sharpness);
    let mut wz = nz.abs().powf(sharpness);
    let sum = wx + wy + wz;
    if sum > 0.0001 {
        wx /= sum;
        wy /= sum;
        wz /= sum;
    } else {
        wx = 0.3333;
        wy = 0.3333;
        wz = 0.3333;
    }
    vec![wx, wy, wz]
}
