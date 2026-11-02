//! VUE 3D Canvas — Windows application process.
//!
//! Double-clicking the exe opens the painting programme in a native window.
//! WebGL reaches DirectX 11 or OpenGL through ANGLE inside WebView2.
//! Nothing is served on a port.

#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

#[cfg(windows)]
mod desktop;

fn main() {
    #[cfg(windows)]
    {
        if let Err(err) = desktop::run() {
            let log = std::env::current_exe()
                .ok()
                .and_then(|exe| exe.parent().map(|dir| dir.join("vue3d-startup-error.log")))
                .unwrap_or_else(|| std::path::PathBuf::from("vue3d-startup-error.log"));
            let _ = std::fs::write(
                &log,
                format!(
                    "VUE 3D Canvas could not open the painting window.\n{err}\n\nWindows 10 needs the Evergreen WebView2 Runtime if it is not already installed. Windows 11 includes it.\n"
                ),
            );
        }
    }

    #[cfg(not(windows))]
    {
        eprintln!("vue_3d_canvas.exe is built on Windows. This command only launches the desktop window.");
        std::process::exit(1);
    }
}
