import { useEffect, useRef } from "react";
import { useAppStore } from "../../stores/appStore";
import type { Region, RegionType, EffectType } from "../../lib/regions";

function RegionTypeIcon({ type }: { type: RegionType }) {
  if (type === "rectangle") return <span title="Rectangle">&#9633;</span>;
  if (type === "ellipse") return <span title="Ellipse">&#9675;</span>;
  return <span title="Freehand">&#9997;</span>;
}

function RegionTypeLabel({ type }: { type: RegionType }) {
  if (type === "rectangle") return "Rectangle";
  if (type === "ellipse") return "Ellipse";
  return "Freehand";
}

function EffectLabel({ effect }: { effect: EffectType }) {
  if (effect === "mosaic") return "Mosaic";
  return "Blur";
}

function ThumbnailCanvas({ region }: { region: Region }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeCanvasRef = useAppStore((s) => s.canvasRef);

  useEffect(() => {
    const thumbCanvas = canvasRef.current;
    const srcCanvas = storeCanvasRef?.current;
    if (!thumbCanvas || !srcCanvas) return;

    const { x, y, width, height } = region.bounds;
    if (width <= 0 || height <= 0) return;

    const srcCtx = srcCanvas.getContext("2d");
    if (!srcCtx) return;

    const scale = useAppStore.getState().displayScale;
    const sx = Math.round(x * scale);
    const sy = Math.round(y * scale);
    const sw = Math.round(width * scale);
    const sh = Math.round(height * scale);

    const clampedSx = Math.max(0, Math.min(sx, srcCanvas.width));
    const clampedSy = Math.max(0, Math.min(sy, srcCanvas.height));
    const clampedSw = Math.min(sw, srcCanvas.width - clampedSx);
    const clampedSh = Math.min(sh, srcCanvas.height - clampedSy);

    if (clampedSw <= 0 || clampedSh <= 0) return;

    const imageData = srcCtx.getImageData(clampedSx, clampedSy, clampedSw, clampedSh);

    const THUMB_SIZE = 48;
    const aspect = clampedSw / clampedSh;
    let thumbW = THUMB_SIZE;
    let thumbH = THUMB_SIZE;
    if (aspect > 1) thumbH = Math.round(THUMB_SIZE / aspect);
    else thumbW = Math.round(THUMB_SIZE * aspect);

    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = clampedSw;
    tempCanvas.height = clampedSh;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.putImageData(imageData, 0, 0);

    const thumbCtx = thumbCanvas.getContext("2d")!;
    thumbCtx.drawImage(tempCanvas, 0, 0, thumbW, thumbH);
  }, [region, storeCanvasRef]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded object-cover bg-gray-100"
      style={{ width: 48, height: 48 }}
    />
  );
}

function RegionItem({
  region,
  isSelected,
  onSelect,
  onRemove,
}: {
  region: Region;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-100 group ${
        isSelected
          ? "bg-blue-50 ring-1 ring-blue-300 shadow-sm"
          : "hover:bg-gray-50"
      }`}
    >
      <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
        <ThumbnailCanvas region={region} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-gray-700 text-sm font-medium leading-tight">
          <span className="text-base leading-none">
            <RegionTypeIcon type={region.type} />
          </span>
          <span className="truncate">
            <RegionTypeLabel type={region.type} />
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          <EffectLabel effect={region.effect} />
          {" · "}
          {region.intensity}%
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-100"
        title="Remove region"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function RegionList() {
  const regions = useAppStore((s) => s.regions);
  const selectedRegionId = useAppStore((s) => s.selectedRegionId);
  const setSelectedRegionId = useAppStore((s) => s.setSelectedRegionId);
  const removeRegion = useAppStore((s) => s.removeRegion);

  if (regions.length === 0) return null;

  return (
    <div className="w-64 shrink-0 flex flex-col h-full">
      <div
        className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-lg"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="px-4 pt-4 pb-2 shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Regions
            <span className="ml-1.5 text-gray-300 font-normal normal-case tracking-normal">
              {regions.length}
            </span>
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {regions.map((region) => (
            <RegionItem
              key={region.id}
              region={region}
              isSelected={selectedRegionId === region.id}
              onSelect={() =>
                setSelectedRegionId(
                  selectedRegionId === region.id ? null : region.id,
                )
              }
              onRemove={() => removeRegion(region.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
