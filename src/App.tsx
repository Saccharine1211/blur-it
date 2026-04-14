import { ImageCanvas } from "./components/Canvas/ImageCanvas";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { ActionBar } from "./components/ActionBar/ActionBar";
import { EmptyState } from "./components/EmptyState";
import { RegionList } from "./components/RegionList/RegionList";
import { useAppStore } from "./stores/appStore";
import { useKeyboard } from "./hooks/useKeyboard";

function App() {
  useKeyboard();
  const originalImageDataUrl = useAppStore((s) => s.originalImageDataUrl);
  const regions = useAppStore((s) => s.regions);

  const showRegionList = Boolean(originalImageDataUrl) && regions.length > 0;

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] text-gray-900 select-none overflow-hidden">
      {/* Top Bar with Drag Region */}
      <header className="shrink-0" data-tauri-drag-region>
        <Toolbar />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex items-center justify-center p-8">
        <div className="w-full h-full max-w-6xl mx-auto flex items-center justify-center gap-4">
          <div className="flex-1 h-full min-w-0">
            {originalImageDataUrl ? <ImageCanvas /> : <EmptyState />}
          </div>
          {showRegionList && <RegionList />}
        </div>
      </main>

      {/* Bottom Bar */}
      <footer className="shrink-0">
        <ActionBar />
      </footer>
    </div>
  );
}

export default App;
