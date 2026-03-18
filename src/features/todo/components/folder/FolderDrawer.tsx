import { useEffect, useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useFolderStore } from '../../store'
import { useTodoStore } from '../../store'
import { FolderTodoCard } from './FolderTodoCard'
import type { NoteColor, Todo } from '../../types'

const COLOR_VAR: Record<NoteColor, string> = {
  cyan: 'var(--rf-cyan)',
  pink: 'var(--rf-pink)',
  amber: 'var(--rf-amber)',
  green: 'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

const COLOR_RGB: Record<NoteColor, string> = {
  cyan: '0,245,255',
  pink: '255,45,120',
  amber: '255,184,0',
  green: '57,255,20',
  purple: '191,95,255',
}

interface FolderDrawerProps {
  onMoveToMain: (todoId: string) => void
  onDeleteTodo: (todoId: string) => void
  onToggleTodo: (todoId: string) => void
}

export function FolderDrawer({ onMoveToMain, onDeleteTodo, onToggleTodo }: FolderDrawerProps) {
  const folders = useFolderStore((s) => s.folders)
  const closeAllFolders = useFolderStore((s) => s.closeAllFolders)
  const appendToFolder = useFolderStore((s) => s.appendToFolder)
  const setOrderedTodoIds = useFolderStore((s) => s.setOrderedTodoIds)
  const todos = useTodoStore((s) => s.todos)

  const openFolder = folders.find((f) => f.isOpen) ?? null

  // ── Build the canonical ordered list from the store ──────────────────────
  const storeTodos: Todo[] = openFolder
    ? (openFolder.orderedTodoIds
        .map((id) =>
          todos.find((t) => t.id === id && !t.archived && t.folderId === openFolder.id)
        )
        .filter(Boolean) as Todo[])
    : []

  // ── Local state drives the Reorder animation (no store writes mid-drag) ──
  const [localTodos, setLocalTodos] = useState<Todo[]>(storeTodos)

  // Sync local state when the open folder changes or storeTodos changes from
  // outside (e.g. a todo is moved to main, deleted, or the migration effect
  // appends missing IDs).
  useEffect(() => {
    setLocalTodos(storeTodos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFolder?.id, openFolder?.orderedTodoIds.length, todos.length])

  // ── Migration: add any todos with folderId not yet in orderedTodoIds ──────
  useEffect(() => {
    if (!openFolder) return
    todos
      .filter(
        (t) =>
          t.folderId === openFolder.id &&
          !t.archived &&
          !openFolder.orderedTodoIds.includes(t.id)
      )
      .forEach((t) => appendToFolder(openFolder.id, t.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFolder?.id])

  // ── During drag: only update local state (smooth animation) ──────────────
  const handleReorder = (reordered: Todo[]) => {
    setLocalTodos(reordered)
  }

  // ── On drag end: persist the final order to the store once ───────────────
  const handleDragEnd = () => {
    if (!openFolder) return
    setOrderedTodoIds(openFolder.id, localTodos.map((t) => t.id))
  }

  const color = openFolder ? COLOR_VAR[openFolder.color] : 'var(--rf-cyan)'
  const rgb = openFolder ? COLOR_RGB[openFolder.color] : '0,245,255'

  return (
    <AnimatePresence>
      {openFolder && (
        <>
          {/* Dim backdrop — click to close */}
          <motion.div
            key="folder-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{ zIndex: 140, background: 'rgba(4,6,12,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={closeAllFolders}
          />

          {/* Drawer panel */}
          <motion.div
            key="folder-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-[60px] left-0 bottom-0 flex flex-col"
            style={{
              width: 'min(540px, 88vw)',
              zIndex: 150,
              background: '#05080f',
              borderRight: `1px solid rgba(${rgb}, 0.18)`,
              boxShadow: `6px 0 48px rgba(${rgb}, 0.07), 6px 0 80px rgba(0,0,0,0.7)`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid rgba(${rgb}, 0.12)` }}
            >
              <span
                className="w-[8px] h-[8px] rounded-full flex-shrink-0"
                style={{ background: color, boxShadow: `0 0 7px ${color}` }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.22em] uppercase flex-1 truncate"
                style={{ color, textShadow: `0 0 10px ${color}` }}
              >
                {openFolder.name}
              </span>
              <span
                className="font-mono text-[9px] opacity-40 flex-shrink-0"
                style={{ color: 'var(--rf-text-dim)' }}
              >
                ({localTodos.length})
              </span>
              <button
                type="button"
                className="rf-btn ml-3 flex-shrink-0"
                onClick={closeAllFolders}
              >
                [ close ]
              </button>
            </div>

            {/* Hint */}
            <p
              className="font-mono text-[8px] tracking-[0.12em] opacity-25 px-5 pt-3 pb-1 flex-shrink-0"
              style={{ color: 'var(--rf-text-dim)' }}
            >
              drag to reorder · right-click to move or delete
            </p>

            {/* Card area */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
              {localTodos.length === 0 ? (
                <p
                  className="font-mono text-[0.78rem] opacity-25 text-center mt-12"
                  style={{ color: 'var(--rf-text-dim)' }}
                >
                  empty folder
                </p>
              ) : (
                <Reorder.Group
                  axis="x"
                  values={localTodos}
                  onReorder={handleReorder}
                  className="flex flex-wrap gap-2"
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                >
                  {localTodos.map((todo) => (
                    <Reorder.Item
                      key={todo.id}
                      value={todo}
                      style={{ display: 'inline-flex' }}
                      onDragEnd={handleDragEnd}
                    >
                      <FolderTodoCard
                        todo={todo}
                        onMoveToMain={onMoveToMain}
                        onDelete={onDeleteTodo}
                        onToggle={onToggleTodo}
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
