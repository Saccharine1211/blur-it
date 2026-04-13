mod commands;
mod settings;

use std::sync::Mutex;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, RunEvent};

#[derive(Default)]
pub struct PendingFile(pub Mutex<Option<String>>);

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Forward file path from second instance to existing window
            if let Some(file_path) = args.get(1) {
                let _ = app.emit("open-file", file_path);
            }
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(PendingFile::default())
        .invoke_handler(tauri::generate_handler![
            commands::file::load_image_file,
            commands::file::save_image_file,
            commands::clipboard::read_clipboard_image,
            commands::clipboard::write_clipboard_image,
            commands::image::apply_effects,
            settings::get_settings,
            settings::save_settings,
        ])
        .setup(|app| {
            // System tray
            let menu = tauri::menu::MenuBuilder::new(app)
                .text("open", "열기")
                .text("clipboard", "클립보드에서 열기")
                .separator()
                .text("quit", "종료")
                .build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "clipboard" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("paste-from-clipboard", ());
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Minimize to tray on close instead of quitting
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |app_handle, event| {
            match event {
                #[cfg(target_os = "macos")]
                RunEvent::Opened { urls } => {
                    if let Some(url) = urls.first() {
                        if let Ok(path) = url.to_file_path() {
                            let path_str = path.to_string_lossy().to_string();
                            if app_handle.emit("open-file", &path_str).is_err() {
                                let state = app_handle.state::<PendingFile>();
                                let mut lock = state.0.lock().unwrap();
                                *lock = Some(path_str);
                                drop(lock);
                            }
                        }
                    }
                }
                RunEvent::Ready => {
                    // Flush any buffered file path
                    let path_opt = {
                        let state = app_handle.state::<PendingFile>();
                        let mut lock = state.0.lock().unwrap();
                        lock.take()
                    };
                    if let Some(path) = path_opt {
                        let _ = app_handle.emit("open-file", &path);
                    }

                    // Windows: check CLI args on startup
                    #[cfg(target_os = "windows")]
                    {
                        let args: Vec<String> = std::env::args().collect();
                        if args.len() > 1 {
                            let _ = app_handle.emit("open-file", &args[1]);
                        }
                    }
                }
                _ => {}
            }
        });
}
