import { useAppStore } from "../../stores/appStore";
import type { RegionType, EffectType } from "../../lib/regions";

const tools: { key: RegionType; label: string; icon: string }[] = [
  { key: "rectangle", label: "Rect", icon: "▢" },
  { key: "ellipse", label: "Oval", icon: "◯" },
  { key: "freehand", label: "Free", icon: "✍" },
];

const effects: { key: EffectType; label: string }[] = [
  { key: "mosaic", label: "Mosaic" },
  { key: "blur", label: "Blur" },
];

export function Toolbar() {
  const selectedTool = useAppStore((s) => s.selectedTool);
  const selectedEffect = useAppStore((s) => s.selectedEffect);
  const intensity = useAppStore((s) => s.intensity);
  const setSelectedTool = useAppStore((s) => s.setSelectedTool);
  const setSelectedEffect = useAppStore((s) => s.setSelectedEffect);
  const setIntensity = useAppStore((s) => s.setIntensity);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const undoStack = useAppStore((s) => s.undoStack);
  const redoStack = useAppStore((s) => s.redoStack);

  return (
    <div className="flex items-center gap-4 px-4 h-11 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm z-50">
      {/* Selection tools (Segmented Control) */}
      <div className="flex p-0.5 bg-gray-200/50 rounded-lg">
        {tools.map((t) => (
          <button
            key={t.key}
            onClick={() => setSelectedTool(t.key)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
              selectedTool === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Effect selector (Segmented Control) */}
      <div className="flex p-0.5 bg-gray-200/50 rounded-lg">
        {effects.map((e) => (
          <button
            key={e.key}
            onClick={() => setSelectedEffect(e.key)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
              selectedEffect === e.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Intensity slider */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-tight">Intensity</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={100}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-[11px] font-medium text-gray-500 w-6 text-right tabular-nums">{intensity}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Undo (⌘Z)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 5.5L1.5 8.5L4.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 8.5H8.5C11.2614 8.5 13.5 10.7386 13.5 13.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Redo (⇧⌘Z)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.5 5.5L14.5 8.5L11.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.5 8.5H7.5C4.73858 8.5 2.5 10.7386 2.5 13.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
