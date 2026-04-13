import { useRef, useEffect, useCallback } from "react";
import { useAppStore } from "../../stores/appStore";
import { useRegionSelection } from "../../hooks/useRegionSelection";
import { applyEffectToCanvas } from "../../lib/effects";
import { toDisplayBounds } from "../../lib/regions";
import type { Region } from "../../lib/regions";

export function ImageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayScale = useAppStore((s) => s.displayScale);
  const regions = useAppStore((s) => s.regions);
  const setDisplayImage = useAppStore((s) => s.setDisplayImage);
  const originalImageDataUrl = useAppStore((s) => s.originalImageDataUrl);

  // Load and scale image onto canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !originalImageDataUrl) return;

    const img = new Image();
    img.onload = () => {
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const scale = Math.min(containerW / img.width, containerH / img.height, 1.0);

      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      setDisplayImage(img, scale);

      // Re-apply all regions
      for (const region of regions) {
        applyEffectToCanvas(canvas, region, scale);
      }
    };
    img.src = originalImageDataUrl;
  }, [originalImageDataUrl, setDisplayImage, regions]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Region selection handling
  const { onMouseDown, onMouseMove, onMouseUp, previewRegion } =
    useRegionSelection(canvasRef);

  // Draw preview overlay
  useEffect(() => {
    if (!previewRegion || !canvasRef.current) return;
    // Preview is drawn via CSS overlay, not on the main canvas
  }, [previewRegion]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full cursor-crosshair shadow-lg"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      />
      {/* Preview overlay for region being drawn */}
      {previewRegion && (
        <PreviewOverlay region={previewRegion} scale={displayScale} canvasRef={canvasRef} />
      )}
    </div>
  );
}

function PreviewOverlay({
  region,
  scale,
  canvasRef,
}: {
  region: Region;
  scale: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const canvas = canvasRef.current;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const db = toDisplayBounds(region.bounds, scale);

  const style: React.CSSProperties = {
    position: "absolute",
    left: rect.left - (canvas.parentElement?.getBoundingClientRect().left ?? 0) + db.x,
    top: rect.top - (canvas.parentElement?.getBoundingClientRect().top ?? 0) + db.y,
    width: db.width,
    height: db.height,
    border: "2px dashed rgba(59, 130, 246, 0.8)",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    pointerEvents: "none",
    borderRadius: region.type === "ellipse" ? "50%" : 0,
  };

  return <div style={style} />;
}
