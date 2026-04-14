import { ImageCanvas } from "./components/Canvas/ImageCanvas";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { ActionBar } from "./components/ActionBar/ActionBar";
import { EmptyState } from "./components/EmptyState";
import { useAppStore } from "./stores/appStore";
import { useKeyboard } from "./hooks/useKeyboard";

function App() {
  useKeyboard();
  const displayImage = useAppStore((s) => s.displayImage);

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] text-gray-900 select-none overflow-hidden">
      {/* Top Bar with Drag Region */}
      <header className="shrink-0" data-tauri-drag-region>
        <Toolbar />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex items-center justify-center p-8">
        <div className="w-full h-full max-w-6xl mx-auto flex items-center justify-center">
          {displayImage ? <ImageCanvas /> : <EmptyState />}
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
