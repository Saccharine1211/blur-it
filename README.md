<p align="center">
  <img src="src-tauri/icons/icon.svg" width="120" height="120" alt="BlurIt Icon" />
</p>

<h1 align="center">BlurIt</h1>

<p align="center">
  <strong>Mosaic & Blur. Anywhere on your image.</strong>
</p>

<p align="center">
  <a href="https://github.com/Saccharine1211/blur-it/releases/latest">
    <img src="https://img.shields.io/github/v/release/Saccharine1211/blur-it?style=flat-square&color=blue" alt="Release" />
  </a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/github/license/Saccharine1211/blur-it?style=flat-square" alt="License" />
</p>

<br/>

BlurIt is a lightweight desktop app for quickly applying **mosaic** or **blur** effects to any part of an image. Select a region, pick an effect, and export -- that's it.

Built with **Tauri 2** + **React 19** for a native-feeling experience at a fraction of an Electron app's size.

---

## Features

| | |
|---|---|
| **Three selection tools** | Rectangle, Ellipse, and Freehand for precise region targeting |
| **Two effects** | Mosaic (pixelation) and Gaussian Blur with adjustable intensity |
| **Live editing** | Select a region and change its effect or intensity in real-time |
| **Clipboard support** | Paste images directly from Finder / Explorer (Cmd+V) |
| **Undo / Redo** | Full undo history with Cmd+Z / Cmd+Shift+Z |
| **Drag & drop** | Drop an image file onto the window to open it |
| **Lightweight** | ~6 MB DMG, fast startup, low memory footprint |
| **System tray** | Runs in the background, accessible from the menu bar |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open file | Toolbar > Open |
| Paste from clipboard | `Cmd/Ctrl + V` |
| Undo | `Cmd/Ctrl + Z` |
| Redo | `Cmd/Ctrl + Shift + Z` |
| Delete region | `Delete` / `Backspace` |

## Download

Grab the latest release for your platform:

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [BlurIt_0.1.0_aarch64.dmg](https://github.com/Saccharine1211/blur-it/releases/latest) |
| Windows (x64) | [BlurIt_0.1.0_x64-setup.exe](https://github.com/Saccharine1211/blur-it/releases/latest) |

## Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) stable
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

### Steps

```bash
# Clone
git clone https://github.com/Saccharine1211/blur-it.git
cd blur-it

# Install dependencies
npm install

# Development
npm run tauri dev

# Production build
npm run tauri build
```

The built app will be at `src-tauri/target/release/bundle/`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Tauri 2](https://v2.tauri.app/) |
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Effects | stackblur-canvas, imageproc (Rust) |
| Image I/O | image crate (Rust) |

## Project Structure

```
blur-it/
├── src/                    # React frontend
│   ├── components/         # Canvas, Toolbar, ActionBar, RegionList
│   ├── hooks/              # useRegionSelection, useKeyboard
│   ├── lib/                # effects, regions, tauri-api
│   └── stores/             # Zustand store
├── src-tauri/              # Rust backend
│   └── src/commands/       # clipboard, file, image processing
└── package.json
```

## License

MIT
