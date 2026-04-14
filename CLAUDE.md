# BlurIt - Project Instructions

## Build & Run

- **Dev**: `npm run tauri dev`
- **Build**: `npm run tauri build`
- Rust toolchain 필요: `source "$HOME/.cargo/env"` (macOS)

## Bundle Targets

- **macOS**: DMG (Apple Silicon)
- **Windows**: NSIS installer만 사용 (MSI 사용하지 않음)
- `tauri.conf.json`의 `targets`를 `["dmg", "nsis"]`로 설정

## Architecture

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand 5
- Backend: Tauri 2 (Rust)
- 캔버스 렌더링은 `regions` 상태 기반 반응적 렌더링 (regions 변경 시 이미지 + 전체 효과 재적용)

## Undo/Redo

- Region 기반 undo/redo (`Region[]` 스택). Command 패턴 사용하지 않음.
- `addRegion`이 자동으로 undoStack에 추가
- undo: regions에서 제거 → 반응적 캔버스 re-render
- redo: regions에 재추가 → 반응적 캔버스 re-render

## Release

- GitHub Actions 워크플로우 `.github/workflows/build-windows.yml`로 Windows NSIS 빌드
- macOS DMG는 로컬에서 빌드 후 수동 업로드
- `gh workflow run build-windows.yml --field tag=<version>` 으로 트리거
