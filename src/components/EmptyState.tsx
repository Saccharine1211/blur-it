import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { openImageDialog, loadImageFile } from "../lib/tauri-api";

export function EmptyState() {
  const setImage = useAppStore((s) => s.setImage);
  const setLoading = useAppStore((s) => s.setLoading);
  const showToast = useAppStore((s) => s.showToast);

  const handleOpen = async () => {
    try {
      const path = await openImageDialog();
      if (!path) return;
      setLoading(true);
      const dataUrl = await loadImageFile(path);
      setImage(dataUrl, path);
    } catch (e) {
      showToast(`파일 열기 실패: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      // Use FileReader for drag-and-drop since we get a File object
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl, null);
      };
      reader.readAsDataURL(file);
    },
    [setImage],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="text-6xl opacity-20">+</div>
      <p className="text-neutral-400 text-sm">
        Drag & drop an image, or press Ctrl+V to paste from clipboard
      </p>
      <button
        onClick={handleOpen}
        className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
      >
        Open Image
      </button>
    </div>
  );
}
