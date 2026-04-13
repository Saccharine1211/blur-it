export type RegionType = "rectangle" | "ellipse" | "freehand";
export type EffectType = "mosaic" | "blur";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Region {
  id: string;
  type: RegionType;
  effect: EffectType;
  intensity: number;
  bounds: Bounds;
  points?: Point[];
}

export function computeFreehandBounds(points: Point[]): Bounds {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}

export function toImageCoord(
  displayX: number,
  displayY: number,
  scale: number,
): Point {
  return { x: displayX / scale, y: displayY / scale };
}

export function toDisplayCoord(
  imageX: number,
  imageY: number,
  scale: number,
): Point {
  return { x: imageX * scale, y: imageY * scale };
}

export function toDisplayBounds(bounds: Bounds, scale: number): Bounds {
  return {
    x: bounds.x * scale,
    y: bounds.y * scale,
    width: bounds.width * scale,
    height: bounds.height * scale,
  };
}
