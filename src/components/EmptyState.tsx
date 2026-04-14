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
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/50">
      <div
        className="max-w-md w-full aspect-video flex flex-col items-center justify-center gap-6 border-2 border-dashed border-gray-300 rounded-[24px] bg-white/50 hover:bg-white/80 hover:border-blue-400 hover:shadow-xl transition-all duration-300 group cursor-default"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-300">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10Z" fill="currentColor"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 13.5684 19.5478 15.0311 18.7699 16.2641L15.3536 12.8477C14.7678 12.2619 13.818 12.2619 13.2322 12.8477L9.41421 16.6657L8.12132 15.3728C7.53553 14.787 6.58579 14.787 6 15.3728L4.41421 16.9586C4.14805 15.4627 4 13.75 4 12ZM12 20C9.9142 20 8.01859 19.2044 6.58579 17.9014L8.70711 15.7801L10.1213 17.1943C10.7071 17.7801 11.6569 17.7801 12.2426 17.1943L16.7678 12.6692L19.0664 14.9678C17.6534 18.0163 14.5686 20 12 20Z" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-[17px] font-semibold text-gray-800">Drop image here</p>
          <p className="text-[13px] text-gray-500">or click to browse files</p>
        </div>

        <button
          onClick={handleOpen}
          className="mt-2 px-6 py-2 text-[13px] font-medium rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-md active:scale-95 transition-all"
        >
          Choose File
        </button>
      </div>
    </div>
  );
}
