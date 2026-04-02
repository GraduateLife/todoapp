import { create } from 'zustand'
import type { Folder, NoteColor } from '../types'
import { NOTE_COLORS } from '../types'
import { getStrategy as getAdapter } from '../../../lib/strategies'

// ── Debounce for high-frequency saves (marker drag) ──────────────────────────

const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
function debouncedSave(key: string, fn: () => void, ms = 300) {
  const t = _debounceTimers.get(key)
  if (t) clearTimeout(t)
  _debounceTimers.set(key, setTimeout(() => { _debounceTimers.delete(key); fn() }, ms))
}

interface FolderState {
  folders: Folder[]
  initialize: (folders: Folder[]) => void
  createFolder: (name: string, color?: NoteColor) => Folder
  deleteFolder: (id: string) => void
  renameFolder: (id: string, name: string) => void
  openFolder: (id: string) => void
  closeFolder: (id: string) => void
  closeAllFolders: () => void
  updateMarkerY: (id: string, markerY: number) => void
  appendToFolder: (folderId: string, todoId: string) => void
  removeFromFolder: (folderId: string, todoId: string) => void
  reorderTodo: (folderId: string, fromIndex: number, toIndex: number) => void
  setOrderedTodoIds: (folderId: string, ids: string[]) => void
}

function randomFolderColor(): NoteColor {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
}

export const useFolderStore = create<FolderState>()(
  (set, get) => ({
    folders: [],

    initialize: (folders) => set({ folders }),

    createFolder: (name, color) => {
      const folder: Folder = {
        id: crypto.randomUUID(),
        name,
        color: color ?? randomFolderColor(),
        createdAt: Date.now(),
        isOpen: false,
        markerY: 120 + get().folders.length * 64,
        orderedTodoIds: [],
      }
      set((state) => ({ folders: [...state.folders, folder] }))
      getAdapter().saveFolder(folder).catch(console.error)
      return folder
    },

    deleteFolder: (id) => {
      set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }))
      getAdapter().deleteFolder(id).catch(console.error)
    },

    renameFolder: (id, name) => {
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
      }))
      const updated = get().folders.find((f) => f.id === id)
      if (updated) getAdapter().saveFolder(updated).catch(console.error)
    },

    // isOpen is transient UI state — not persisted to IDB
    openFolder: (id) =>
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === id ? { ...f, isOpen: true } : { ...f, isOpen: false },
        ),
      })),

    closeFolder: (id) =>
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === id ? { ...f, isOpen: false } : f,
        ),
      })),

    closeAllFolders: () =>
      set((state) => ({
        folders: state.folders.map((f) => ({ ...f, isOpen: false })),
      })),

    updateMarkerY: (id, markerY) => {
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === id ? { ...f, markerY } : f,
        ),
      }))
      const updated = get().folders.find((f) => f.id === id)
      if (updated) debouncedSave(`marker-${id}`, () => getAdapter().saveFolder(updated).catch(console.error))
    },

    appendToFolder: (folderId, todoId) => {
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === folderId && !f.orderedTodoIds.includes(todoId)
            ? { ...f, orderedTodoIds: [...f.orderedTodoIds, todoId] }
            : f,
        ),
      }))
      const updated = get().folders.find((f) => f.id === folderId)
      if (updated) getAdapter().saveFolder(updated).catch(console.error)
    },

    removeFromFolder: (folderId, todoId) => {
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === folderId
            ? {
                ...f,
                orderedTodoIds: f.orderedTodoIds.filter((id) => id !== todoId),
              }
            : f,
        ),
      }))
      const updated = get().folders.find((f) => f.id === folderId)
      if (updated) getAdapter().saveFolder(updated).catch(console.error)
    },

    reorderTodo: (folderId, fromIndex, toIndex) => {
      set((state) => ({
        folders: state.folders.map((f) => {
          if (f.id !== folderId) return f
          const ids = [...f.orderedTodoIds]
          const [moved] = ids.splice(fromIndex, 1)
          ids.splice(toIndex, 0, moved)
          return { ...f, orderedTodoIds: ids }
        }),
      }))
      const updated = get().folders.find((f) => f.id === folderId)
      if (updated) getAdapter().saveFolder(updated).catch(console.error)
    },

    setOrderedTodoIds: (folderId, ids) => {
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === folderId ? { ...f, orderedTodoIds: ids } : f,
        ),
      }))
      const updated = get().folders.find((f) => f.id === folderId)
      if (updated) getAdapter().saveFolder(updated).catch(console.error)
    },
  }),
)
