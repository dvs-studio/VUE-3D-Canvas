//! Native window for the built painting UI. In-process file loading only.

use std::borrow::Cow;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::Command;

use tao::dpi::LogicalSize;
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoop};
use tao::window::WindowBuilder;
use wry::http::header::CONTENT_TYPE;
use wry::http::{Request, Response};
use wry::WebViewBuilder;

pub fn run() -> Result<(), String> {
    let root = ui_root();
    let backend = selected_backend();
    apply_gpu_environment(&backend)?;

    let event_loop = EventLoop::new();
    let window = WindowBuilder::new()
        .with_title("VUE 3D Canvas")
        .with_inner_size(LogicalSize::new(1440.0, 900.0))
        .build(&event_loop)
        .map_err(|err| err.to_string())?;

    let index = root.join("index.html");
    let mut builder = WebViewBuilder::new()
        .with_devtools(false)
        .with_initialization_script(format!(
            "window.__VUE_DESKTOP__ = true; window.__VUE_GPU_BACKEND__ = '{backend}';"
        ))
        .with_ipc_handler(move |request| {
            let body = request.body().trim();
            let Some(mode) = body.strip_prefix("gpu:") else {
                return;
            };
            if mode != "dx11" && mode != "opengl" && mode != "modern" {
                return;
            }
            if mode == selected_backend() {
                return;
            }
            if let Some(dir) = exe_dir() {
                let _ = fs::write(dir.join("gpu-backend.txt"), mode);
                if let Ok(exe) = std::env::current_exe() {
                    let _ = Command::new(exe).spawn();
                }
            }
            std::process::exit(0);
        });

    if index.is_file() {
        let serve_root = root.clone();
        builder = builder
            .with_custom_protocol("vue".into(), move |_id, request| serve(&serve_root, request))
            .with_url("vue://localhost/index.html");
    } else {
        builder = builder.with_html(missing_ui_page(&root));
    }

    let _webview = builder.build(&window).map_err(|err| err.to_string())?;

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;
        if let Event::WindowEvent {
            event: WindowEvent::CloseRequested,
            ..
        } = event
        {
            *control_flow = ControlFlow::ExitWithCode(0);
        }
    });
}

fn exe_dir() -> Option<PathBuf> {
    std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(|dir| dir.to_path_buf()))
}

fn ui_root() -> PathBuf {
    if let Some(dir) = exe_dir() {
        let beside = dir.join("ui");
        if beside.join("index.html").is_file() {
            return beside;
        }
        let nested = dir.join("dist");
        if nested.join("index.html").is_file() {
            return nested;
        }
    }
    PathBuf::from("ui")
}

fn selected_backend() -> String {
    for arg in std::env::args().skip(1) {
        match arg.as_str() {
            "--opengl" | "--gl" => return "opengl".to_string(),
            "--modern" => return "modern".to_string(),
            "--dx11" | "--directx" => return "dx11".to_string(),
            _ => {}
        }
    }
    if let Some(dir) = exe_dir() {
        if let Ok(text) = fs::read_to_string(dir.join("gpu-backend.txt")) {
            match text.trim() {
                "opengl" => return "opengl".to_string(),
                "modern" => return "modern".to_string(),
                "dx11" => return "dx11".to_string(),
                _ => {}
            }
        }
    }
    "dx11".to_string()
}

fn apply_gpu_environment(backend: &str) -> Result<(), String> {
    let angle = match backend {
        "opengl" => "--use-angle=gl --ignore-gpu-blocklist --enable-gpu-rasterization --disable-software-rasterizer",
        "modern" => "--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu-rasterization --disable-software-rasterizer --enable-features=WebGPU --enable-unsafe-webgpu",
        _ => "--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu-rasterization --disable-software-rasterizer",
    };
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", angle);
    if let Some(dir) = exe_dir() {
        let profile = dir.join("webview2-data");
        fs::create_dir_all(&profile).map_err(|err| err.to_string())?;
        std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &profile);
    }
    Ok(())
}

fn serve(root: &Path, request: Request<Vec<u8>>) -> Response<Cow<'static, [u8]>> {
    let rel = request.uri().path();
    match safe_file(root, rel) {
        Some(path) => match fs::read(&path) {
            Ok(bytes) => Response::builder()
                .header(CONTENT_TYPE, mime_type(&path))
                .body(Cow::Owned(bytes))
                .unwrap_or_else(|_| plain(500, "Could not build a response.")),
            Err(_) => plain(404, "That file is not in the ui folder."),
        },
        None => plain(404, "That file is not in the ui folder."),
    }
}

fn safe_file(root: &Path, raw_path: &str) -> Option<PathBuf> {
    let decoded = percent_decode(raw_path);
    let trimmed = decoded.trim_start_matches('/');
    let mut out = root.to_path_buf();
    if trimmed.is_empty() {
        out.push("index.html");
        return out.is_file().then_some(out);
    }
    for part in Path::new(trimmed).components() {
        match part {
            Component::Normal(piece) => out.push(piece),
            Component::CurDir => {}
            _ => return None,
        }
    }
    out.is_file().then_some(out)
}

fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(value) = u8::from_str_radix(
                std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or(""),
                16,
            ) {
                out.push(value);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn mime_type(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "html" | "htm" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" | "map" => "application/json",
        "wasm" => "application/wasm",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "gif" => "image/gif",
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "txt" => "text/plain; charset=utf-8",
        "glb" => "model/gltf-binary",
        "gltf" => "model/gltf+json",
        _ => "application/octet-stream",
    }
}

fn plain(status: u16, message: &str) -> Response<Cow<'static, [u8]>> {
    Response::builder()
        .status(status)
        .header(CONTENT_TYPE, "text/plain; charset=utf-8")
        .body(Cow::Owned(message.as_bytes().to_vec()))
        .unwrap_or_else(|_| {
            Response::builder()
                .status(500)
                .body(Cow::Owned(b"error".to_vec()))
                .expect("fallback response")
        })
}

fn missing_ui_page(root: &Path) -> String {
    format!(
        "<!doctype html><html><head><meta charset=\"utf-8\"><title>VUE 3D Canvas</title></head>\
         <body style=\"margin:0;background:#333;color:#eee;font:16px sans-serif\">\
         <main style=\"max-width:42rem;margin:4rem auto;padding:0 1.5rem\">\
         <h1>The painting UI is not beside this programme.</h1>\
         <p>Expected <code>index.html</code> in <code>{}</code>.</p>\
         <p>Extract the whole Windows zip. <code>vue_3d_canvas.exe</code> and the <code>ui</code> folder must stay together. This window is the application. It does not start a server, and it is not a diagnostic shell.</p>\
         </main></body></html>",
        root.display()
    )
}
