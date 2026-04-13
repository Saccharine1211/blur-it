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
    <div className="flex flex-col h-screen bg-neutral-900 text-white select-none">
      <Toolbar />
      <main className="flex-1 overflow-hidden flex items-center justify-center bg-neutral-800">
        {displayImage ? <ImageCanvas /> : <EmptyState />}
      </main>
      <ActionBar />
    </div>
  );
}

export default App;
