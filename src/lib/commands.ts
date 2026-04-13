import type { Bounds } from "./regions";
import { toDisplayBounds } from "./regions";

export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

export class ApplyEffectCommand implements Command {
  private regionImageData: ImageData | null = null;
  private canvas: HTMLCanvasElement;
  private displayBounds: Bounds;
  description: string;
  private applyFn: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    imageBounds: Bounds,
    displayScale: number,
    description: string,
    applyFn: () => void,
  ) {
    this.canvas = canvas;
    this.displayBounds = toDisplayBounds(imageBounds, displayScale);
    this.description = description;
    this.applyFn = applyFn;

    // Capture the region before applying the effect
    const ctx = canvas.getContext("2d")!;
    const { x, y, width, height } = this.displayBounds;
    if (width > 0 && height > 0) {
      this.regionImageData = ctx.getImageData(
        Math.floor(x),
        Math.floor(y),
        Math.ceil(width),
        Math.ceil(height),
      );
    }
  }

  execute(): void {
    this.applyFn();
  }

  undo(): void {
    if (!this.regionImageData) return;
    const ctx = this.canvas.getContext("2d")!;
    ctx.putImageData(
      this.regionImageData,
      Math.floor(this.displayBounds.x),
      Math.floor(this.displayBounds.y),
    );
  }
}
