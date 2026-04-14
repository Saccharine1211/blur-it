import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

export async function openImageDialog(): Promise<string | null> {
  const result = await open({
    multiple: false,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "webp", "bmp"],
      },
    ],
  });
  if (!result) return null;
  return result as string;
}

export async function loadImageFile(path: string): Promise<string> {
  return invoke<string>("load_image_file", { path });
}

export async function saveImageDialog(): Promise<string | null> {
  const result = await save({
    filters: [
      { name: "PNG", extensions: ["png"] },
      { name: "JPEG", extensions: ["jpg", "jpeg"] },
    ],
  });
  return result;
}

export async function applyAndSave(
  imagePath: string,
  regions: Array<{
    type: string;
    effect: string;
    intensity: number;
    bounds: { x: number; y: number; width: number; height: number };
    points?: { x: number; y: number }[];
  }>,
  outputFormat: string,
): Promise<Vec<number>> {
  return invoke<Vec<number>>("apply_effects", {
    imagePath,
    regions,
    outputFormat,
  });
}

export async function saveImageFile(
  imageData: number[],
  path: string,
): Promise<void> {
  return invoke("save_image_file", { imageData, path });
}

export async function readClipboardFilePath(): Promise<string> {
  return invoke<string>("read_clipboard_file_path");
}

export async function readClipboardImage(): Promise<string> {
  return invoke<string>("read_clipboard_image");
}

export async function writeClipboardImage(
  imageData: number[],
  width: number,
  height: number,
): Promise<void> {
  return invoke("write_clipboard_image", { imageData, width, height });
}

// Workaround: Vec<number> doesn't exist in TS
type Vec<T> = T[];
