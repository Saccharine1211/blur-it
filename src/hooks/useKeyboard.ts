import { useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import { loadImageFile } from "../lib/tauri-api";
import { listen } from "@tauri-apps/api/event";

export function useKeyboard() {
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const setImage = useAppStore((s) => s.setImage);
  const showToast = useAppStore((s) => s.showToast);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

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
  }, [undo, redo]);

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
    try {
      // Try reading image from clipboard via navigator API
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
