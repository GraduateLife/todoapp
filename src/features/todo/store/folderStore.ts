import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Folder, NoteColor } from '../types'
import { NOTE_COLORS } from '../types'

const STORAGE_KEY = 'todoai-folders'

interface FolderState {
  folders: Folder[]
  createFolder: (name: string) => Folder
  deleteFolder: (id: string) => void
  renameFolder: (id: string, name: string) => void
  openFolder: (id: string) => void
  closeFolder: (id: string) => void
  closeAllFolders: () => void
  updateMarkerY: (id: string, markerY: number) => void
}

function randomFolderColor(): NoteColor {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set, get) => ({
      folders: [],

      createFolder: (name) => {
        const folder: Folder = {
          id: crypto.randomUUID(),
          name,
          color: randomFolderColor(),
          createdAt: Date.now(),
          isOpen: false,
          markerY: 120 + get().folders.length * 64, // stack markers vertically
        }
        set((state) => ({ folders: [...state.folders, folder] }))
        return folder
      },

      deleteFolder: (id) =>
        set((state) => ({ folders: state.folders.filter((f) => f.id !== id) })),

      renameFolder: (id, name) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),

      openFolder: (id) =>
        set((state) => ({
          // Only one folder open at a time
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, isOpen: true } : { ...f, isOpen: false }
          ),
        })),

      closeFolder: (id) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, isOpen: false } : f)),
        })),

      closeAllFolders: () =>
        set((state) => ({
          folders: state.folders.map((f) => ({ ...f, isOpen: false })),
        })),

      updateMarkerY: (id, markerY) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, markerY } : f)),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
    }
  )
)
