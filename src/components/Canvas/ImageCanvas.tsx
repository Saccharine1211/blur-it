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

  const checkerboardStyle: React.CSSProperties = {
    backgroundImage: `
      linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
      linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
      linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
    `,
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
    backgroundColor: "#ffffff",
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center p-8 bg-[#ececec] rounded-xl overflow-hidden"
    >
      <div className="relative">
        <div className="shadow-2xl rounded-lg overflow-hidden">
          <div style={checkerboardStyle} className="absolute inset-0" />
          <canvas
            ref={canvasRef}
            className="relative max-w-full max-h-full cursor-crosshair block"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
        </div>
        {/* Preview overlay for region being drawn */}
        {previewRegion && (
          <PreviewOverlay
            region={previewRegion}
            scale={displayScale}
            canvasRef={canvasRef}
          />
        )}
      </div>
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
    left: db.x,
    top: db.y,
    width: db.width,
    height: db.height,
    border: "2px dashed #60a5fa",
    backgroundColor: "rgba(0, 113, 227, 0.1)",
    pointerEvents: "none",
    borderRadius: region.type === "ellipse" ? "50%" : "2px",
    zIndex: 10,
  };

  const handleSize = 6;
  const handleStyle: React.CSSProperties = {
    position: "absolute",
    width: handleSize,
    height: handleSize,
    backgroundColor: "#60a5fa",
    borderRadius: "50%",
    border: "1px solid white",
  };

  return (
    <div style={style}>
      {/* Corner Handles */}
      <div style={{ ...handleStyle, left: -handleSize / 2, top: -handleSize / 2 }} />
      <div style={{ ...handleStyle, right: -handleSize / 2, top: -handleSize / 2 }} />
      <div style={{ ...handleStyle, left: -handleSize / 2, bottom: -handleSize / 2 }} />
      <div style={{ ...handleStyle, right: -handleSize / 2, bottom: -handleSize / 2 }} />
    </div>
  );
}
