import { create } from 'zustand'

interface UiState {
  isDragging: boolean
  setDragging: (v: boolean) => void
  expandedStackId: string | null
  setExpandedStack: (id: string | null) => void
}

export const useUiStore = create<UiState>()((set) => ({
  isDragging: false,
  setDragging: (isDragging) => set({ isDragging }),
  expandedStackId: null,
  setExpandedStack: (expandedStackId) => set({ expandedStackId }),
}))
