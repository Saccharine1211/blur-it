use base64::Engine;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub async fn read_clipboard_file_path() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("osascript")
            .args(["-e", "POSIX path of (the clipboard as «class furl»)"])
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                let ext = std::path::Path::new(&path)
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                if matches!(
                    ext.as_str(),
                    "png" | "jpg" | "jpeg" | "webp" | "bmp" | "gif" | "tiff" | "tif"
                ) {
                    return Ok(path);
                }
            }
        }
        Err("클립보드에 이미지 파일이 없습니다".into())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("클립보드 파일 읽기가 지원되지 않는 플랫폼입니다".into())
    }
}

#[tauri::command]
pub async fn read_clipboard_image(app: tauri::AppHandle) -> Result<String, String> {
    let clipboard = app.clipboard();
    match clipboard.read_image() {
        Ok(img) => {
            let b64 = base64::engine::general_purpose::STANDARD.encode(img.rgba());
            Ok(format!("{}x{}:{}", img.width(), img.height(), b64))
        }
        Err(_) => Err("클립보드에 이미지가 없습니다".into()),
    }
}

#[tauri::command]
pub async fn write_clipboard_image(
    app: tauri::AppHandle,
    image_data: Vec<u8>,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let clipboard = app.clipboard();
    let img = tauri::image::Image::new_owned(image_data, width, height);
    clipboard
        .write_image(&img)
        .map_err(|e| format!("클립보드 복사 실패: {}", e))?;
    Ok(())
}
