import { create } from 'zustand'

interface UiState {
  isDragging: boolean
  setDragging: (v: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  isDragging: false,
  setDragging: (isDragging) => set({ isDragging }),
}))
