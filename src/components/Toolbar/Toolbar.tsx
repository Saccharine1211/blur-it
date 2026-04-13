import { useAppStore } from "../../stores/appStore";
import type { RegionType, EffectType } from "../../lib/regions";

const tools: { key: RegionType; label: string }[] = [
  { key: "rectangle", label: "Rectangle" },
  { key: "ellipse", label: "Ellipse" },
  { key: "freehand", label: "Freehand" },
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
    <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900 border-b border-neutral-700">
      {/* Selection tools */}
      <div className="flex gap-1">
        {tools.map((t) => (
          <button
            key={t.key}
            onClick={() => setSelectedTool(t.key)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              selectedTool === t.key
                ? "bg-blue-600 text-white"
                : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-neutral-600" />

      {/* Effect selector */}
      <div className="flex gap-1">
        {effects.map((e) => (
          <button
            key={e.key}
            onClick={() => setSelectedEffect(e.key)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              selectedEffect === e.key
                ? "bg-purple-600 text-white"
                : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-neutral-600" />

      {/* Intensity slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">Intensity</span>
        <input
          type="range"
          min={1}
          max={100}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-24 accent-purple-500"
        />
        <span className="text-xs text-neutral-300 w-7 text-right">{intensity}</span>
      </div>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="px-2 py-1.5 text-sm rounded bg-neutral-700 text-neutral-300 hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="px-2 py-1.5 text-sm rounded bg-neutral-700 text-neutral-300 hover:bg-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
      </div>
    </div>
  );
}
