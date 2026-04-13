use image::{DynamicImage, ImageBuffer, Rgba, RgbaImage};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Region {
    #[serde(rename = "type")]
    pub region_type: String,
    pub effect: String,
    pub intensity: u32,
    pub bounds: Bounds,
    pub points: Option<Vec<Point>>,
}

#[derive(Deserialize)]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Deserialize, Clone)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[tauri::command]
pub async fn apply_effects(
    image_path: String,
    regions: Vec<Region>,
    output_format: String,
) -> Result<Vec<u8>, String> {
    let img = image::open(&image_path).map_err(|e| format!("이미지 로드 실패: {}", e))?;
    let mut output = img.to_rgba8();

    for region in &regions {
        apply_region_effect(&mut output, &img, region);
    }

    let mut buf: Vec<u8> = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut buf);

    match output_format.as_str() {
        "jpeg" | "jpg" => {
            let dyn_img = DynamicImage::ImageRgba8(output);
            let rgb = dyn_img.to_rgb8();
            rgb.write_to(&mut cursor, image::ImageFormat::Jpeg)
                .map_err(|e| format!("JPEG 인코딩 실패: {}", e))?;
        }
        _ => {
            output
                .write_to(&mut cursor, image::ImageFormat::Png)
                .map_err(|e| format!("PNG 인코딩 실패: {}", e))?;
        }
    }

    Ok(buf)
}

fn apply_region_effect(output: &mut RgbaImage, _original: &DynamicImage, region: &Region) {
    let bx = region.bounds.x.max(0.0) as u32;
    let by = region.bounds.y.max(0.0) as u32;
    let bw = region.bounds.width as u32;
    let bh = region.bounds.height as u32;

    let (img_w, img_h) = output.dimensions();
    let bx = bx.min(img_w.saturating_sub(1));
    let by = by.min(img_h.saturating_sub(1));
    let bw = bw.min(img_w - bx);
    let bh = bh.min(img_h - by);

    if bw == 0 || bh == 0 {
        return;
    }

    match region.effect.as_str() {
        "mosaic" => apply_mosaic(output, bx, by, bw, bh, region.intensity),
        "blur" => apply_blur(output, bx, by, bw, bh, region.intensity),
        _ => {}
    }
}

fn apply_mosaic(img: &mut RgbaImage, bx: u32, by: u32, bw: u32, bh: u32, intensity: u32) {
    let block_size = ((intensity as f64 / 100.0) * 30.0).max(2.0) as u32;

    let mut y = by;
    while y < by + bh {
        let mut x = bx;
        while x < bx + bw {
            let actual_bw = block_size.min(bx + bw - x);
            let actual_bh = block_size.min(by + bh - y);

            // Calculate average color for this block
            let mut r_sum: u64 = 0;
            let mut g_sum: u64 = 0;
            let mut b_sum: u64 = 0;
            let mut a_sum: u64 = 0;
            let mut count: u64 = 0;

            for dy in 0..actual_bh {
                for dx in 0..actual_bw {
                    let px = img.get_pixel(x + dx, y + dy);
                    r_sum += px[0] as u64;
                    g_sum += px[1] as u64;
                    b_sum += px[2] as u64;
                    a_sum += px[3] as u64;
                    count += 1;
                }
            }

            if count > 0 {
                let avg = Rgba([
                    (r_sum / count) as u8,
                    (g_sum / count) as u8,
                    (b_sum / count) as u8,
                    (a_sum / count) as u8,
                ]);

                for dy in 0..actual_bh {
                    for dx in 0..actual_bw {
                        img.put_pixel(x + dx, y + dy, avg);
                    }
                }
            }

            x += block_size;
        }
        y += block_size;
    }
}

fn apply_blur(img: &mut RgbaImage, bx: u32, by: u32, bw: u32, bh: u32, intensity: u32) {
    let sigma = (intensity as f32 / 100.0) * 15.0_f32;
    let sigma = sigma.max(0.5);

    // Extract the region as a sub-image
    let sub: ImageBuffer<Rgba<u8>, Vec<u8>> =
        ImageBuffer::from_fn(bw, bh, |x, y| *img.get_pixel(bx + x, by + y));

    let blurred = imageproc::filter::gaussian_blur_f32(&sub, sigma);

    // Write blurred region back
    for y in 0..bh {
        for x in 0..bw {
            img.put_pixel(bx + x, by + y, *blurred.get_pixel(x, y));
        }
    }
}
