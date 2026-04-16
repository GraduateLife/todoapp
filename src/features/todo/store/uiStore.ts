import { create } from 'zustand'

interface UiState {
  isDragging: boolean
  setDragging: (v: boolean) => void
  expandedStackId: string | null
  setExpandedStack: (id: string | null) => void
  // Live header height in px — published by Header.tsx via ResizeObserver.
  // Consumers (drag-zone math, top-edge hints) read this so the "top zone"
  // boundary tracks the real header height instead of a hardcoded constant.
  // Default 60 is a sane fallback before the observer first fires.
  headerHeight: number
  setHeaderHeight: (h: number) => void
  // Live bottom input-bar height in px — published by TodoInput.tsx via
  // ResizeObserver. Consumers (drag-zone math, bottom-edge hints) read this
  // so the "bottom zone" boundary tracks the real bar height. Default 28
  // matches the bar's collapsed natural height.
  inputBarHeight: number
  setInputBarHeight: (h: number) => void
}

export const useUiStore = create<UiState>()((set) => ({
  isDragging: false,
  setDragging: (isDragging) => set({ isDragging }),
  expandedStackId: null,
  setExpandedStack: (expandedStackId) => set({ expandedStackId }),
  headerHeight: 60,
  setHeaderHeight: (headerHeight) => set({ headerHeight }),
  inputBarHeight: 28,
  setInputBarHeight: (inputBarHeight) => set({ inputBarHeight }),
}))
