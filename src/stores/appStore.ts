import { create } from "zustand";
import type { Region, RegionType, EffectType } from "../lib/regions";
import type { Command } from "../lib/commands";

export interface AppState {
  // Image
  originalImagePath: string | null;
  originalImageDataUrl: string | null;
  displayImage: HTMLImageElement | null;
  displayScale: number;

  // Regions
  regions: Region[];

  // Tools
  selectedTool: RegionType;
  selectedEffect: EffectType;
  intensity: number;

  // Undo/Redo
  undoStack: Command[];
  redoStack: Command[];

  // UI
  isLoading: boolean;
  toastMessage: string | null;

  // Actions
  setImage: (dataUrl: string, path: string | null) => void;
  clearImage: () => void;
  setDisplayImage: (img: HTMLImageElement, scale: number) => void;
  addRegion: (region: Region) => void;
  removeLastRegion: () => void;
  setSelectedTool: (tool: RegionType) => void;
  setSelectedEffect: (effect: EffectType) => void;
  setIntensity: (value: number) => void;
  pushUndo: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  setLoading: (loading: boolean) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const MAX_UNDO = 15;

export const useAppStore = create<AppState>((set, get) => ({
  originalImagePath: null,
  originalImageDataUrl: null,
  displayImage: null,
  displayScale: 1,
  regions: [],
  selectedTool: "rectangle",
  selectedEffect: "mosaic",
  intensity: 50,
  undoStack: [],
  redoStack: [],
  isLoading: false,
  toastMessage: null,

  setImage: (dataUrl, path) =>
    set({
      originalImageDataUrl: dataUrl,
      originalImagePath: path,
      regions: [],
      undoStack: [],
      redoStack: [],
    }),

  clearImage: () =>
    set({
      originalImageDataUrl: null,
      originalImagePath: null,
      displayImage: null,
      displayScale: 1,
      regions: [],
      undoStack: [],
      redoStack: [],
    }),

  setDisplayImage: (img, scale) => set({ displayImage: img, displayScale: scale }),

  addRegion: (region) => set((s) => ({ regions: [...s.regions, region] })),

  removeLastRegion: () =>
    set((s) => ({ regions: s.regions.slice(0, -1) })),

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedEffect: (effect) => set({ selectedEffect: effect }),
  setIntensity: (value) => set({ intensity: value }),

  pushUndo: (cmd) =>
    set((s) => {
      const stack = [...s.undoStack, cmd];
      if (stack.length > MAX_UNDO) stack.shift();
      return { undoStack: stack, redoStack: [] };
    }),

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;
    const cmd = undoStack[undoStack.length - 1];
    cmd.undo();
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, cmd],
    });
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;
    const cmd = redoStack[redoStack.length - 1];
    cmd.execute();
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, cmd],
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },

  clearToast: () => set({ toastMessage: null }),
}));
