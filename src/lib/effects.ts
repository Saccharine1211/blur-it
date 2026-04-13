import * as StackBlur from "stackblur-canvas";
import type { Bounds, Region } from "./regions";
import { toDisplayBounds } from "./regions";

export function applyEffectToCanvas(
  canvas: HTMLCanvasElement,
  region: Region,
  displayScale: number,
): void {
  const ctx = canvas.getContext("2d")!;
  const db = toDisplayBounds(region.bounds, displayScale);

  if (db.width <= 0 || db.height <= 0) return;

  if (region.effect === "mosaic") {
    applyMosaic(ctx, db, region.intensity, region, displayScale);
  } else {
    applyBlur(canvas, db, region.intensity);
  }
}

function applyMosaic(
  ctx: CanvasRenderingContext2D,
  db: Bounds,
  intensity: number,
  region: Region,
  displayScale: number,
): void {
  const blockSize = Math.max(2, Math.round((intensity / 100) * 30 * displayScale));
  const { x, y, width, height } = db;

  // Set clipping path for the region shape
  ctx.save();
  setClipPath(ctx, region, displayScale);

  for (let by = Math.floor(y); by < y + height; by += blockSize) {
    for (let bx = Math.floor(x); bx < x + width; bx += blockSize) {
      const bw = Math.min(blockSize, Math.floor(x + width) - bx);
      const bh = Math.min(blockSize, Math.floor(y + height) - by);
      if (bw <= 0 || bh <= 0) continue;

      const data = ctx.getImageData(bx, by, bw, bh).data;
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        a += data[i + 3];
        count++;
      }
      if (count > 0) {
        ctx.fillStyle = `rgba(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)},${(a / count / 255).toFixed(2)})`;
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  }

  ctx.restore();
}

function applyBlur(
  canvas: HTMLCanvasElement,
  db: Bounds,
  intensity: number,
): void {
  const radius = Math.max(1, Math.round((intensity / 100) * 15));
  const ix = Math.floor(db.x);
  const iy = Math.floor(db.y);
  const iw = Math.ceil(db.width);
  const ih = Math.ceil(db.height);

  if (iw <= 0 || ih <= 0) return;

  const ctx = canvas.getContext("2d")!;

  // Extract region, apply StackBlur, put back
  const imageData = ctx.getImageData(ix, iy, iw, ih);

  // Create temporary canvas for StackBlur
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = iw;
  tmpCanvas.height = ih;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.putImageData(imageData, 0, 0);

  StackBlur.canvasRGBA(tmpCanvas, 0, 0, iw, ih, radius);

  const blurredData = tmpCtx.getImageData(0, 0, iw, ih);
  ctx.putImageData(blurredData, ix, iy);
}

function setClipPath(
  ctx: CanvasRenderingContext2D,
  region: Region,
  displayScale: number,
): void {
  const db = toDisplayBounds(region.bounds, displayScale);
  ctx.beginPath();

  switch (region.type) {
    case "rectangle":
      ctx.rect(db.x, db.y, db.width, db.height);
      break;
    case "ellipse":
      ctx.ellipse(
        db.x + db.width / 2,
        db.y + db.height / 2,
        db.width / 2,
        db.height / 2,
        0,
        0,
        Math.PI * 2,
      );
      break;
    case "freehand":
      if (region.points && region.points.length > 0) {
        const pts = region.points;
        ctx.moveTo(pts[0].x * displayScale, pts[0].y * displayScale);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * displayScale, pts[i].y * displayScale);
        }
        ctx.closePath();
      }
      break;
  }

  ctx.clip();
}
