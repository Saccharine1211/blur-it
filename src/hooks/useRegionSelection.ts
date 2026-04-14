import { useState, useCallback, type RefObject } from "react";
import { useAppStore } from "../stores/appStore";
import { toImageCoord, computeFreehandBounds } from "../lib/regions";
import type { Region, Point } from "../lib/regions";

export function useRegionSelection(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [previewRegion, setPreviewRegion] = useState<Region | null>(null);

  const selectedTool = useAppStore((s) => s.selectedTool);
  const selectedEffect = useAppStore((s) => s.selectedEffect);
  const intensity = useAppStore((s) => s.intensity);
  const displayScale = useAppStore((s) => s.displayScale);
  const addRegion = useAppStore((s) => s.addRegion);

  const getCanvasCoord = useCallback(
    (e: React.MouseEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const displayX = e.clientX - rect.left;
      const displayY = e.clientY - rect.top;
      return toImageCoord(displayX, displayY, displayScale);
    },
    [canvasRef, displayScale],
  );

  const buildRegion = useCallback(
    (start: Point, end: Point, points: Point[]): Region => {
      const id = crypto.randomUUID();

      if (selectedTool === "freehand") {
        const bounds = computeFreehandBounds(points);
        return {
          id,
          type: "freehand",
          effect: selectedEffect,
          intensity,
          bounds,
          points,
        };
      }

      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      return {
        id,
        type: selectedTool,
        effect: selectedEffect,
        intensity,
        bounds: { x, y, width, height },
      };
    },
    [selectedTool, selectedEffect, intensity],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const pt = getCanvasCoord(e);
      setIsDrawing(true);
      setStartPoint(pt);
      setCurrentPoints([pt]);
    },
    [getCanvasCoord],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint) return;
      const pt = getCanvasCoord(e);

      if (selectedTool === "freehand") {
        setCurrentPoints((prev) => [...prev, pt]);
      }

      const region = buildRegion(startPoint, pt, [...currentPoints, pt]);
      setPreviewRegion(region);
    },
    [isDrawing, startPoint, getCanvasCoord, selectedTool, buildRegion, currentPoints],
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !startPoint) return;
      const pt = getCanvasCoord(e);
      const finalPoints = selectedTool === "freehand" ? [...currentPoints, pt] : [];
      const region = buildRegion(startPoint, pt, finalPoints);

      // Skip tiny regions
      if (region.bounds.width < 3 && region.bounds.height < 3) {
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoints([]);
        setPreviewRegion(null);
        return;
      }

      addRegion(region);

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoints([]);
      setPreviewRegion(null);
    },
    [
      isDrawing,
      startPoint,
      getCanvasCoord,
      selectedTool,
      currentPoints,
      buildRegion,
      addRegion,
    ],
  );

  return { onMouseDown, onMouseMove, onMouseUp, previewRegion };
}
