import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useTodoStore } from '../store'
import { useFolderStore } from '../store'
import type { Reminder } from '../types'
import { initStrategy as initAdapter } from '../../../lib/strategies'
import { initAIProvider } from '../../../lib/ai'
import { useUiStore } from '../store/uiStore'
import { StickyNoteContainer as StickyNote } from './StickyNoteContainer'
import { ReminderModal } from '../components/reminder/ReminderModal'
import { ReminderToast } from '../components/reminder/ReminderToast'
import { FolderPickerModal } from '../components/folder/FolderPickerModal'
import { FolderMarkers } from '../components/folder/FolderMarkers'
import { FolderDrawer } from '../components/folder/FolderDrawer'
import { useReminderScheduler } from '../hooks/useReminderScheduler'
import { StackFan } from '../components/stack/StackFan'
import { ContextInput } from '../components/context-input/ContextInput'

export function StickyNoteCanvas() {
  const todos = useTodoStore((s) => s.todos)
  const moveTodo = useTodoStore((s) => s.moveTodo)
  const bringToFront = useTodoStore((s) => s.bringToFront)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const toggleTodo = useTodoStore((s) => s.toggleTodo)
  const updateTitle = useTodoStore((s) => s.updateTitle)
  const archiveTodo = useTodoStore((s) => s.archiveTodo)
  const addSubTask = useTodoStore((s) => s.addSubTask)
  const toggleSubTask = useTodoStore((s) => s.toggleSubTask)
  const deleteSubTask = useTodoStore((s) => s.deleteSubTask)
  const updateSubTask = useTodoStore((s) => s.updateSubTask)
  const setReminder = useTodoStore((s) => s.setReminder)
  const setFolder = useTodoStore((s) => s.setFolder)
  const stackOnto = useTodoStore((s) => s.stackOnto)
  const unstackTodo = useTodoStore((s) => s.unstackTodo)
  const disbandStack = useTodoStore((s) => s.disbandStack)
  const reorderStack = useTodoStore((s) => s.reorderStack)
  const renameStack = useTodoStore((s) => s.renameStack)

  const hasOpenFolder = useFolderStore((s) => s.folders.some((f) => f.isOpen))
  const appendToFolder = useFolderStore((s) => s.appendToFolder)
  const removeFromFolder = useFolderStore((s) => s.removeFromFolder)

  const expandedStackId = useUiStore((s) => s.expandedStackId)
  const setExpandedStack = useUiStore((s) => s.setExpandedStack)

  // Load data from IndexedDB on first mount
  const initializeTodos = useTodoStore((s) => s.initialize)
  const initializeFolders = useFolderStore((s) => s.initialize)
  useEffect(() => {
    initAdapter()
      .then(({ todos, folders }) => {
        initializeTodos(todos)
        initializeFolders(folders)
      })
      .catch(console.error)
    initAIProvider().catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Boot reminder scheduler (idempotent)
  const { activeToast, clearToast } = useReminderScheduler()

  // Reminder modal state
  const [reminderTarget, setReminderTarget] = useState<string | null>(null)
  const reminderTodo = reminderTarget
    ? (todos.find((t) => t.id === reminderTarget) ?? null)
    : null

  const handleReminderConfirm = (reminder: Reminder) => {
    if (!reminderTarget) return
    setReminder(reminderTarget, reminder)
    setReminderTarget(null)
  }

  // Folder picker modal state
  const [folderTarget, setFolderTarget] = useState<string | null>(null)

  const handleFolderConfirm = (folderId: string) => {
    if (!folderTarget) return
    setFolder(folderTarget, folderId)
    appendToFolder(folderId, folderTarget)
    setFolderTarget(null)
  }

  // Move a todo out of a folder back to the main canvas
  const handleMoveToMain = (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId)
    if (todo?.folderId) {
      removeFromFolder(todo.folderId, todoId)
    }
    setFolder(todoId, null)
  }

  // ── Context input (right-click to create) ─────────────────────────────────
  const [contextInputPos, setContextInputPos] = useState<{ x: number; y: number } | null>(null)

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    // Only trigger on the canvas itself, not on sticky notes
    if (e.target === e.currentTarget) {
      e.preventDefault()
      setContextInputPos({ x: e.clientX, y: e.clientY })
    }
  }, [])

  // ── Stack tracking ─────────────────────────────────────────────────────────
  // Which note ID is currently being hovered as a stack target during drag
  const [stackTargetId, setStackTargetId] = useState<string | null>(null)

  // Build a set of all IDs that are "inside" a stack (not the root)
  const stackedSet = new Set(todos.flatMap((t) => t.stackedIds ?? []))

  // Main canvas: non-archived, not in any folder, not stacked inside another
  const visibleTodos = todos.filter(
    (t) => !t.archived && !t.folderId && !stackedSet.has(t.id),
  )

  const handleDropOnNote = (draggedId: string, targetId: string) => {
    // Prevent stacking a note onto itself or onto one of its own stacked children
    const dragged = todos.find((t) => t.id === draggedId)
    if (!dragged) return
    if (draggedId === targetId) return
    if ((dragged.stackedIds ?? []).includes(targetId)) return
    stackOnto(targetId, draggedId)
    // If the dragged note was the expanded stack, close expansion
    if (expandedStackId === draggedId) setExpandedStack(null)
  }

  const handleUnstack = (rootId: string, childId: string) => {
    unstackTodo(rootId, childId)
    // Auto-collapse if stack is now empty
    const root = todos.find((t) => t.id === rootId)
    if (root && (root.stackedIds ?? []).length <= 1) {
      setExpandedStack(null)
    }
  }

  const handleDisbandStack = (rootId: string) => {
    disbandStack(rootId)
    setExpandedStack(null)
  }

  // Precompute fan data so AnimatePresence can keep the last render during exit animation
  const fanRootTodo = expandedStackId
    ? (visibleTodos.find((t) => t.id === expandedStackId) ?? null)
    : null
  const fanStackedNotes: typeof todos = fanRootTodo
    ? ((fanRootTodo.stackedIds ?? [])
        .map((id) => todos.find((t) => t.id === id))
        .filter(Boolean) as typeof todos)
    : []

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      aria-label="Sticky notes canvas"
      onContextMenu={handleCanvasContextMenu}
    >
      {/* Drag-zone edge hints */}
      {(
        [
          {
            label: '↑  archive',
            style: { top: 62, left: '50%', transform: 'translateX(-50%)' },
          },
          {
            label: '↓  delete',
            style: { bottom: 96, left: '50%', transform: 'translateX(-50%)' },
          },
          {
            label: '↑  remind',
            style: {
              right: 12,
              top: '50%',
              transform: 'translateY(-50%) rotate(90deg)',
            },
          },
          {
            label: '↑  folder',
            style: {
              left: 12,
              top: '50%',
              transform: 'translateY(-50%) rotate(-90deg)',
            },
          },
        ] as const
      ).map(({ label, style }) => (
        <div
          key={label}
          className="absolute font-mono text-[8px] tracking-[0.22em] uppercase pointer-events-none select-none"
          style={{
            ...style,
            color: 'var(--rf-text-dim, rgba(0,245,255,0.3))',
            opacity: 0.4,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ))}

      {/* Empty state */}
      {visibleTodos.length === 0 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
          style={{ paddingBottom: '80px' }}
        >
          <p
            className="font-mono text-[11px] tracking-[0.22em] uppercase mb-2"
            style={{ color: 'var(--rf-text-dim)', opacity: 0.55 }}
          >
            {'> no tasks detected_'}
          </p>
          <p
            className="font-mono text-[10px] tracking-[0.16em]"
            style={{ color: 'var(--rf-text-dim)', opacity: 0.35 }}
          >
            use the terminal below to initialize
          </p>
        </div>
      )}

      {/* Folder drawer (slides in from left, includes backdrop) */}
      <FolderDrawer
        onMoveToMain={handleMoveToMain}
        onDeleteTodo={deleteTodo}
        onToggleTodo={toggleTodo}
      />

      {/* Main sticky note cards */}
      <AnimatePresence>
        {visibleTodos.map((todo) => {
          // Resolve stacked note objects
          const stackedNotes = (todo.stackedIds ?? [])
            .map((id) => todos.find((t) => t.id === id))
            .filter(Boolean) as typeof todos

          // Other notes for stack-target detection (all visible notes except this one)
          const otherNotes = visibleTodos
            .filter((t) => t.id !== todo.id)
            .map((t) => ({ id: t.id, position: t.position }))

          const isExpanded = expandedStackId === todo.id

          return (
            <StickyNote
              key={todo.id}
              todo={todo}
              onMove={moveTodo}
              onBringToFront={bringToFront}
              onDelete={deleteTodo}
              onToggle={toggleTodo}
              onUpdateTitle={updateTitle}
              onArchive={archiveTodo}
              onAddSubTask={addSubTask}
              onToggleSubTask={toggleSubTask}
              onDeleteSubTask={deleteSubTask}
              onUpdateSubTask={updateSubTask}
              onRequestReminder={setReminderTarget}
              onRequestFolder={setFolderTarget}
              // Stack props
              otherNotes={otherNotes}
              isStackTarget={stackTargetId === todo.id}
              stackedNotes={stackedNotes}
              isExpanded={isExpanded}
              onStackTargetChange={setStackTargetId}
              onDropOnNote={(targetId) => handleDropOnNote(todo.id, targetId)}
              onToggleExpand={() =>
                setExpandedStack(isExpanded ? null : todo.id)
              }
              onDisbandStack={() => handleDisbandStack(todo.id)}
            />
          )
        })}
      </AnimatePresence>

      {/* Stack fan — expanded stacked notes rendered at canvas level */}
      {/* Stack fan — always centered on screen, with open/close animation */}
      <AnimatePresence>
        {expandedStackId && fanRootTodo && (
          <motion.div
            key={expandedStackId}
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.93,
              transition: { duration: 0.14, ease: 'easeIn' },
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 900,
              pointerEvents: 'none',
            }}
          >
            {/* Invisible backdrop — click outside to close */}
            <div
              className="absolute inset-0"
              style={{ pointerEvents: 'auto' }}
              onPointerDown={() => setExpandedStack(null)}
            />
            <StackFan
              root={fanRootTodo}
              stackedNotes={fanStackedNotes}
              onUnstack={(childId) => handleUnstack(expandedStackId, childId)}
              onReorder={(from, to) => reorderStack(expandedStackId, from, to)}
              onRename={(name) => renameStack(expandedStackId, name)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left-edge folder markers (hidden when drawer is open) */}
      {!hasOpenFolder && <FolderMarkers />}

      {/* Reminder setup modal */}
      <ReminderModal
        open={!!reminderTarget}
        todoTitle={reminderTodo?.title ?? ''}
        onConfirm={handleReminderConfirm}
        onCancel={() => setReminderTarget(null)}
        onTitleChange={(newTitle) => {
          if (reminderTarget) updateTitle(reminderTarget, newTitle)
        }}
      />

      {/* Folder picker modal */}
      <FolderPickerModal
        open={!!folderTarget}
        onConfirm={handleFolderConfirm}
        onCancel={() => setFolderTarget(null)}
      />

      {/* In-app reminder toast (fallback when browser notifications are denied) */}
      <ReminderToast toast={activeToast} onDismiss={clearToast} />

      {/* Right-click context input */}
      <AnimatePresence>
        {contextInputPos && (
          <ContextInput
            key={`${contextInputPos.x}-${contextInputPos.y}`}
            position={contextInputPos}
            onClose={() => setContextInputPos(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
