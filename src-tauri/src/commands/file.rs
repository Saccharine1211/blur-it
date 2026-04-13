use base64::Engine;
use std::path::PathBuf;

#[tauri::command]
pub async fn load_image_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        return Err("파일을 찾을 수 없습니다".into());
    }

    let bytes = std::fs::read(&path).map_err(|e| format!("파일 읽기 실패: {}", e))?;

    // Validate it's a valid image
    image::load_from_memory(&bytes).map_err(|e| format!("지원하지 않는 이미지 형식: {}", e))?;

    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);

    // Detect mime type from extension
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        _ => "image/png",
    };

    Ok(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
pub async fn save_image_file(image_data: Vec<u8>, path: String) -> Result<(), String> {
    std::fs::write(&path, &image_data).map_err(|e| format!("저장 실패: {}", e))?;
    Ok(())
}
