import { useAppStore } from "../../stores/appStore";
import { openImageDialog, loadImageFile, saveImageDialog, applyAndSave, saveImageFile, writeClipboardImage } from "../../lib/tauri-api";

export function ActionBar() {
  const originalImageDataUrl = useAppStore((s) => s.originalImageDataUrl);
  const originalImagePath = useAppStore((s) => s.originalImagePath);
  const regions = useAppStore((s) => s.regions);
  const setImage = useAppStore((s) => s.setImage);
  const setLoading = useAppStore((s) => s.setLoading);
  const showToast = useAppStore((s) => s.showToast);
  const toastMessage = useAppStore((s) => s.toastMessage);

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

  const handleSave = async () => {
    if (!originalImageDataUrl) {
      showToast("저장할 이미지가 없습니다");
      return;
    }
    try {
      const savePath = await saveImageDialog();
      if (!savePath) return;
      setLoading(true);

      const format = savePath.toLowerCase().endsWith(".jpg") || savePath.toLowerCase().endsWith(".jpeg")
        ? "jpeg" : "png";

      let imageBytes: number[];

      if (originalImagePath && regions.length > 0) {
        // File-backed image with regions: use Rust backend for full-quality processing
        const regionData = regions.map((r) => ({
          type: r.type,
          effect: r.effect,
          intensity: r.intensity,
          bounds: r.bounds,
          points: r.points,
        }));
        imageBytes = await applyAndSave(originalImagePath, regionData, format);
      } else {
        // Paste/drop image (no originalImagePath) or no regions: export from canvas
        const canvasEl = useAppStore.getState().canvasRef?.current;
        if (!canvasEl) {
          showToast("저장 실패: 캔버스를 찾을 수 없습니다");
          return;
        }
        const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
        const blob = await new Promise<Blob | null>((resolve) =>
          canvasEl.toBlob(resolve, mimeType),
        );
        if (!blob) {
          showToast("저장 실패: 이미지를 추출할 수 없습니다");
          return;
        }
        const arrayBuffer = await blob.arrayBuffer();
        imageBytes = Array.from(new Uint8Array(arrayBuffer));
      }

      await saveImageFile(imageBytes, savePath);
      showToast("저장 완료!");
    } catch (e) {
      showToast(`저장 실패: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      const canvasRef = useAppStore.getState().canvasRef;
      const canvas = canvasRef?.current ?? document.querySelector("canvas");
      if (!canvas) {
        showToast("복사할 이미지가 없습니다");
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        showToast("캔버스 컨텍스트를 가져올 수 없습니다");
        return;
      }
      const { width, height } = canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      const imageDataArray = Array.from(imageData.data);
      await writeClipboardImage(imageDataArray, width, height);
      showToast("클립보드에 복사했습니다");
    } catch (e) {
      showToast(`복사 실패: ${e}`);
    }
  };

  return (
    <>
      {/* Toast Notification (macOS style) */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-gray-200/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[13px] font-medium text-gray-800">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 h-10 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
        <button
          onClick={handleOpen}
          className="px-3 py-1 text-[13px] font-medium rounded-full bg-gray-200/80 text-gray-800 hover:bg-gray-300 transition-all active:scale-95"
        >
          Open
        </button>

        {originalImageDataUrl && (
          <>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-[13px] font-medium rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-sm transition-all active:scale-95"
            >
              Save Image
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-[13px] font-medium rounded-full bg-gray-200/80 text-gray-800 hover:bg-gray-300 transition-all active:scale-95"
            >
              Copy
            </button>
          </>
        )}

        <div className="flex-1" />
        
        <div className="text-[11px] text-gray-400 font-medium tabular-nums">
          {originalImageDataUrl ? `${regions.length} regions` : "No image loaded"}
        </div>
      </div>
    </>
  );
}
