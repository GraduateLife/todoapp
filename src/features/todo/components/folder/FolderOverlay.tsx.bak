import { useEffect } from 'react'
import { useFolderStore } from '../../store'
import { useTodoStore } from '../../store'

const CARD_WIDTH = 256
const CARD_HEIGHT = 180 // estimated, cards are variable height
const GRID_COLS = 3
const GRID_GAP = 20
const GRID_ORIGIN_X = 80  // left margin from screen edge
const GRID_ORIGIN_Y = 80  // top margin from screen edge

const COLOR_VAR: Record<string, string> = {
  cyan: 'var(--rf-cyan)',
  pink: 'var(--rf-pink)',
  amber: 'var(--rf-amber)',
  green: 'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

interface FolderOverlayProps {
  /** Called when a todo is dragged outside the folder overlay area */
  onTodoEscaped?: (todoId: string) => void
}

export function FolderOverlay({ onTodoEscaped: _ }: FolderOverlayProps) {
  const folders = useFolderStore((s) => s.folders)
  const closeAllFolders = useFolderStore((s) => s.closeAllFolders)
  const moveTodo = useTodoStore((s) => s.moveTodo)

  const openFolder = folders.find((f) => f.isOpen) ?? null
  const todos = useTodoStore((s) => s.todos)

  const folderTodos = openFolder
    ? todos.filter((t) => t.folderId === openFolder.id && !t.archived)
    : []

  // Reposition todos into a grid when folder opens
  useEffect(() => {
    if (!openFolder) return
    folderTodos.forEach((todo, index) => {
      const col = index % GRID_COLS
      const row = Math.floor(index / GRID_COLS)
      const targetX = GRID_ORIGIN_X + col * (CARD_WIDTH + GRID_GAP)
      const targetY = GRID_ORIGIN_Y + 60 + row * (CARD_HEIGHT + GRID_GAP)
      moveTodo(todo.id, targetX, targetY)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFolder?.id])

  if (!openFolder) return null

  const color = COLOR_VAR[openFolder.color] ?? 'var(--rf-purple)'

  // Compute overlay bounding box
  const cols = Math.min(folderTodos.length, GRID_COLS)
  const rows = Math.ceil(folderTodos.length / GRID_COLS)
  const overlayW = Math.max(
    GRID_ORIGIN_X + cols * (CARD_WIDTH + GRID_GAP) + 40,
    320
  )
  const overlayH = GRID_ORIGIN_Y + 60 + rows * (CARD_HEIGHT + GRID_GAP) + 60

  return (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 90, background: 'rgba(4,6,12,0.55)', backdropFilter: 'blur(2px)' }}
        onClick={closeAllFolders}
      />

      {/* Folder frame */}
      <div
        className="fixed"
        style={{
          zIndex: 91,
          top: 60, // below header
          left: 0,
          width: overlayW,
          height: overlayH,
          background: 'rgba(8,12,24,0.85)',
          border: `1px solid ${color}33`,
          borderLeft: 'none',
          borderRadius: '0 4px 4px 0',
          boxShadow: `0 0 40px ${color}18`,
          pointerEvents: 'none',
        }}
      >
        {/* Folder title */}
        <div
          className="absolute top-3 left-4 flex items-center gap-2"
          style={{ pointerEvents: 'auto' }}
        >
          <span
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color, textShadow: `0 0 8px ${color}` }}
          >
            {openFolder.name}
          </span>
          <span className="font-mono text-[8px] opacity-40" style={{ color: 'var(--rf-text-dim)' }}>
            ({folderTodos.length})
          </span>
        </div>

        {/* Corner brackets */}
        <span className="absolute top-[8px] right-[8px] font-mono text-[10px] opacity-30"
          style={{ color, pointerEvents: 'none' }}>─┐</span>
        <span className="absolute bottom-[8px] left-[8px] font-mono text-[10px] opacity-30"
          style={{ color, pointerEvents: 'none' }}>└─</span>
        <span className="absolute bottom-[8px] right-[8px] font-mono text-[10px] opacity-30"
          style={{ color, pointerEvents: 'none' }}>─┘</span>

        {folderTodos.length === 0 && (
          <p
            className="absolute font-mono text-[0.75rem] opacity-30"
            style={{ color: 'var(--rf-text-dim)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
          >
            empty folder
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        className="rf-btn fixed"
        style={{ zIndex: 95, top: 68, left: overlayW + 8 }}
        onClick={closeAllFolders}
      >
        [ close ]
      </button>
    </>
  )
}
