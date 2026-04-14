import { useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import { loadImageFile, readClipboardFilePath, readClipboardImage } from "../lib/tauri-api";
import { listen } from "@tauri-apps/api/event";

export function useKeyboard() {
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const setImage = useAppStore((s) => s.setImage);
  const showToast = useAppStore((s) => s.showToast);
  const selectedRegionId = useAppStore((s) => s.selectedRegionId);
  const removeRegion = useAppStore((s) => s.removeRegion);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Delete/Backspace: remove selected region
      if ((e.key === "Delete" || e.key === "Backspace") && !mod) {
        if (selectedRegionId) {
          e.preventDefault();
          removeRegion(selectedRegionId);
          return;
        }
      }

      // Undo: Ctrl/Cmd + Z
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl + Y
      if ((mod && e.key === "z" && e.shiftKey) || (e.ctrlKey && e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (mod && e.key === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedRegionId, removeRegion]);

  // Listen for file open events from Tauri (context menu / single-instance)
  useEffect(() => {
    const unlisten = listen<string>("open-file", async (event) => {
      try {
        const dataUrl = await loadImageFile(event.payload);
        setImage(dataUrl, event.payload);
      } catch (e) {
        showToast(`파일 열기 실패: ${e}`);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [setImage, showToast]);

  // Listen for clipboard paste event from tray menu
  useEffect(() => {
    const unlisten = listen("paste-from-clipboard", () => {
      handlePaste();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handlePaste = async () => {
    // 1. Try reading file path from clipboard (e.g. Finder file copy)
    try {
      const filePath = await readClipboardFilePath();
      const dataUrl = await loadImageFile(filePath);
      setImage(dataUrl, filePath);
      return;
    } catch {
      // No image file path on clipboard; try image data
    }

    // 2. Try Tauri clipboard image API (screenshot paste, etc.)
    try {
      const raw = await readClipboardImage();
      // Format: "WIDTHxHEIGHT:BASE64_RGBA"
      const colonIdx = raw.indexOf(":");
      const dims = raw.slice(0, colonIdx);
      const b64 = raw.slice(colonIdx + 1);
      const [width, height] = dims.split("x").map(Number);

      const rgba = Uint8ClampedArray.from(atob(b64), (c) => c.charCodeAt(0));
      const imageData = new ImageData(rgba, width, height);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      setImage(dataUrl, null);
      return;
    } catch {
      // Tauri API failed; fall back to browser clipboard API
    }

    // 3. Fallback: navigator.clipboard.read() (browser API)
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            setImage(dataUrl, null);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      showToast("클립보드에 이미지가 없습니다");
    } catch {
      showToast("클립보드 읽기 실패");
    }
  };
}
