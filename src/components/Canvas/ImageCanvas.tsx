import { useRef, useEffect, useCallback, useState } from "react";
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
  const setCanvasRef = useAppStore((s) => s.setCanvasRef);
  const originalImageDataUrl = useAppStore((s) => s.originalImageDataUrl);
  const setImage = useAppStore((s) => s.setImage);
  const clearImage = useAppStore((s) => s.clearImage);
  const selectedRegionId = useAppStore((s) => s.selectedRegionId);
  const setSelectedRegionId = useAppStore((s) => s.setSelectedRegionId);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setCanvasRef(canvasRef);
  }, [setCanvasRef]);

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
  const { onMouseDown: onRegionMouseDown, onMouseMove, onMouseUp, previewRegion } =
    useRegionSelection(canvasRef);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Check if click is on any existing region; if not, deselect
      if (selectedRegionId !== null) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const displayX = e.clientX - rect.left;
          const displayY = e.clientY - rect.top;
          const clickedOnRegion = regions.some((r) => {
            const db = toDisplayBounds(r.bounds, displayScale);
            return (
              displayX >= db.x &&
              displayX <= db.x + db.width &&
              displayY >= db.y &&
              displayY <= db.y + db.height
            );
          });
          if (!clickedOnRegion) {
            setSelectedRegionId(null);
          }
        }
      }
      onRegionMouseDown(e);
    },
    [selectedRegionId, regions, displayScale, canvasRef, setSelectedRegionId, onRegionMouseDown],
  );

  // Draw preview overlay
  useEffect(() => {
    if (!previewRegion || !canvasRef.current) return;
    // Preview is drawn via CSS overlay, not on the main canvas
  }, [previewRegion]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
      className={`relative w-full h-full flex items-center justify-center p-8 rounded-xl overflow-hidden transition-colors duration-150 ${isDragging ? "bg-blue-100 ring-2 ring-blue-400 ring-inset" : "bg-[#ececec]"}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <div className="relative">
        {/* Close button */}
        <button
          onClick={() => clearImage()}
          className="absolute top-2 right-2 z-30 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/70 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-lg backdrop-blur-sm"
          title="닫기"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
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
        {/* Highlight overlay for selected region */}
        {selectedRegionId && (() => {
          const selectedRegion = regions.find((r) => r.id === selectedRegionId);
          return selectedRegion ? (
            <SelectedRegionOverlay
              region={selectedRegion}
              scale={displayScale}
              canvasRef={canvasRef}
            />
          ) : null;
        })()}
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

  // Freehand: SVG path overlay with viewBox for correct coordinate mapping
  if (region.type === "freehand" && region.points && region.points.length > 1) {
    const pathData =
      region.points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x * scale},${p.y * scale}`)
        .join(" ") + " Z";

    return (
      <svg
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <path
          d={pathData}
          fill="rgba(0, 113, 227, 0.1)"
          stroke="#60a5fa"
          strokeWidth="2"
          strokeDasharray="6 3"
        />
      </svg>
    );
  }

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

function SelectedRegionOverlay({
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

  // Freehand: SVG path overlay with viewBox for correct coordinate mapping
  if (region.type === "freehand" && region.points && region.points.length > 1) {
    const pathData =
      region.points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x * scale},${p.y * scale}`)
        .join(" ") + " Z";

    return (
      <svg
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <path
          d={pathData}
          fill="rgba(0, 113, 227, 0.08)"
          stroke="#60a5fa"
          strokeWidth="2"
        />
      </svg>
    );
  }

  const db = toDisplayBounds(region.bounds, scale);

  const style: React.CSSProperties = {
    position: "absolute",
    left: db.x,
    top: db.y,
    width: db.width,
    height: db.height,
    border: "2px solid #60a5fa",
    backgroundColor: "rgba(0, 113, 227, 0.08)",
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
