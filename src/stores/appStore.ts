import { create } from "zustand";
import type React from "react";
import type { Region, RegionType, EffectType } from "../lib/regions";

export interface AppState {
  // Image
  originalImagePath: string | null;
  originalImageDataUrl: string | null;
  displayImage: HTMLImageElement | null;
  displayScale: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null> | null;

  // Regions
  regions: Region[];
  selectedRegionId: string | null;

  // Tools
  selectedTool: RegionType;
  selectedEffect: EffectType;
  intensity: number;

  // Undo/Redo (region-based)
  undoStack: Region[];
  redoStack: Region[];

  // UI
  isLoading: boolean;
  toastMessage: string | null;

  // Actions
  setCanvasRef: (ref: React.RefObject<HTMLCanvasElement | null>) => void;
  setImage: (dataUrl: string, path: string | null) => void;
  clearImage: () => void;
  setDisplayImage: (img: HTMLImageElement, scale: number) => void;
  addRegion: (region: Region) => void;
  removeLastRegion: () => void;
  removeRegion: (id: string) => void;
  setSelectedRegionId: (id: string | null) => void;
  setSelectedTool: (tool: RegionType) => void;
  setSelectedEffect: (effect: EffectType) => void;
  setIntensity: (value: number) => void;
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
  canvasRef: null,
  regions: [],
  selectedRegionId: null,
  selectedTool: "rectangle",
  selectedEffect: "mosaic",
  intensity: 50,
  undoStack: [],
  redoStack: [],
  isLoading: false,
  toastMessage: null,

  setCanvasRef: (ref) => set({ canvasRef: ref }),

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

  addRegion: (region) =>
    set((s) => {
      const stack = [...s.undoStack, region];
      if (stack.length > MAX_UNDO) stack.shift();
      return {
        regions: [...s.regions, region],
        undoStack: stack,
        redoStack: [],
      };
    }),

  removeLastRegion: () =>
    set((s) => ({ regions: s.regions.slice(0, -1) })),

  removeRegion: (id) =>
    set((s) => ({
      regions: s.regions.filter((r) => r.id !== id),
      selectedRegionId: s.selectedRegionId === id ? null : s.selectedRegionId,
    })),

  setSelectedRegionId: (id) => {
    if (id) {
      const region = get().regions.find((r) => r.id === id);
      if (region) {
        set({ selectedRegionId: id, selectedEffect: region.effect, intensity: region.intensity });
        return;
      }
    }
    set({ selectedRegionId: id });
  },

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedEffect: (effect) => {
    const { selectedRegionId, regions } = get();
    if (selectedRegionId) {
      set({
        selectedEffect: effect,
        regions: regions.map((r) =>
          r.id === selectedRegionId ? { ...r, effect } : r,
        ),
      });
    } else {
      set({ selectedEffect: effect });
    }
  },
  setIntensity: (value) => {
    const { selectedRegionId, regions } = get();
    if (selectedRegionId) {
      set({
        intensity: value,
        regions: regions.map((r) =>
          r.id === selectedRegionId ? { ...r, intensity: value } : r,
        ),
      });
    } else {
      set({ intensity: value });
    }
  },

  undo: () => {
    const { undoStack, redoStack, regions } = get();
    if (undoStack.length === 0) return;
    const region = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, region],
      regions: regions.filter((r) => r.id !== region.id),
      selectedRegionId: null,
    });
  },

  redo: () => {
    const { undoStack, redoStack, regions } = get();
    if (redoStack.length === 0) return;
    const region = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, region],
      regions: [...regions, region],
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },

  clearToast: () => set({ toastMessage: null }),
}));
