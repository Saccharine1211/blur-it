import { useAppStore } from "../../stores/appStore";
import { openImageDialog, loadImageFile, saveImageDialog, applyAndSave, saveImageFile } from "../../lib/tauri-api";

export function ActionBar() {
  const displayImage = useAppStore((s) => s.displayImage);
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
    if (!originalImagePath || regions.length === 0) {
      showToast("저장할 이미지나 효과가 없습니다");
      return;
    }
    try {
      const savePath = await saveImageDialog();
      if (!savePath) return;
      setLoading(true);

      const format = savePath.toLowerCase().endsWith(".jpg") || savePath.toLowerCase().endsWith(".jpeg")
        ? "jpeg" : "png";

      const regionData = regions.map((r) => ({
        type: r.type,
        effect: r.effect,
        intensity: r.intensity,
        bounds: r.bounds,
        points: r.points,
      }));

      const imageBytes = await applyAndSave(originalImagePath, regionData, format);
      await saveImageFile(imageBytes, savePath);
      showToast("저장 완료!");
    } catch (e) {
      showToast(`저장 실패: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    showToast("클립보드 복사는 준비 중입니다");
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-t border-neutral-700">
      <button
        onClick={handleOpen}
        className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
      >
        Open
      </button>

      {displayImage && (
        <>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-500 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 text-sm rounded bg-neutral-600 text-white hover:bg-neutral-500 transition-colors"
          >
            Copy
          </button>
        </>
      )}

      <div className="flex-1" />

      {/* Toast notification */}
      {toastMessage && (
        <span className="text-sm text-yellow-300 animate-pulse">{toastMessage}</span>
      )}
    </div>
  );
}
