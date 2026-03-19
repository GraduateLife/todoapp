import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useTodoStore } from '../store'
import { useFolderStore } from '../store'
import { StickyNote } from '../components/StickyNote'
import { ReminderModal } from '../components/reminder/ReminderModal'
import { ReminderMarkers } from '../components/reminder/ReminderMarkers'
import { ReminderToast } from '../components/reminder/ReminderToast'
import { FolderPickerModal } from '../components/folder/FolderPickerModal'
import { FolderMarkers } from '../components/folder/FolderMarkers'
import { FolderDrawer } from '../components/folder/FolderDrawer'
import { useReminderScheduler } from '../hooks/useReminderScheduler'

export function StickyNoteCanvas() {
  const todos = useTodoStore((s) => s.todos)
  const moveTodo = useTodoStore((s) => s.moveTodo)
  const bringToFront = useTodoStore((s) => s.bringToFront)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)
  const toggleTodo = useTodoStore((s) => s.toggleTodo)
  const updateTitle = useTodoStore((s) => s.updateTitle)
  const setPriority = useTodoStore((s) => s.setPriority)
  const archiveTodo = useTodoStore((s) => s.archiveTodo)
  const addSubTask = useTodoStore((s) => s.addSubTask)
  const toggleSubTask = useTodoStore((s) => s.toggleSubTask)
  const deleteSubTask = useTodoStore((s) => s.deleteSubTask)
  const updateSubTask = useTodoStore((s) => s.updateSubTask)
  const setReminder = useTodoStore((s) => s.setReminder)
  const setFolder = useTodoStore((s) => s.setFolder)
  const hasOpenFolder = useFolderStore((s) => s.folders.some((f) => f.isOpen))
  const appendToFolder = useFolderStore((s) => s.appendToFolder)
  const removeFromFolder = useFolderStore((s) => s.removeFromFolder)

  // Boot reminder scheduler (idempotent)
  const { activeToast, clearToast } = useReminderScheduler()

  // Reminder modal state
  const [reminderTarget, setReminderTarget] = useState<string | null>(null)
  const reminderTodo = reminderTarget
    ? todos.find((t) => t.id === reminderTarget) ?? null
    : null

  const handleReminderConfirm = (remindAt: number, interval?: number) => {
    if (!reminderTarget) return
    setReminder(reminderTarget, { remindAt, interval })
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

  // Main canvas: non-archived, not in any folder
  const visibleTodos = todos.filter((t) => !t.archived && !t.folderId)

  return (
    <div className="fixed inset-0 overflow-hidden" aria-label="Sticky notes canvas">

      {/* Drag-zone edge hints */}
      {([
        { label: '↑  archive', side: 'top',    style: { top: 62,   left: '50%', transform: 'translateX(-50%)' } },
        { label: '↓  delete',  side: 'bottom', style: { bottom: 96, left: '50%', transform: 'translateX(-50%)' } },
        { label: '↑  remind',  side: 'right',  style: { right: 12,  top: '50%',  transform: 'translateY(-50%) rotate(90deg)' } },
        { label: '↑  folder',  side: 'left',   style: { left: 12,   top: '50%',  transform: 'translateY(-50%) rotate(-90deg)' } },
      ] as const).map(({ label, style }) => (
        <div
          key={label}
          className="absolute font-mono text-[8px] tracking-[0.22em] uppercase pointer-events-none select-none"
          style={{ ...style, color: 'rgba(0,245,255,0.13)', whiteSpace: 'nowrap' }}
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
            style={{ color: 'rgba(0, 245, 255, 0.25)' }}
          >
            {'> no tasks detected_'}
          </p>
          <p
            className="font-mono text-[10px] tracking-[0.16em]"
            style={{ color: 'rgba(0, 245, 255, 0.15)' }}
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
        {visibleTodos.map((todo) => (
          <StickyNote
            key={todo.id}
            todo={todo}
            onMove={moveTodo}
            onBringToFront={bringToFront}
            onDelete={deleteTodo}
            onToggle={toggleTodo}
            onUpdateTitle={updateTitle}
            onSetPriority={setPriority}
            onArchive={archiveTodo}
            onAddSubTask={addSubTask}
            onToggleSubTask={toggleSubTask}
            onDeleteSubTask={deleteSubTask}
            onUpdateSubTask={updateSubTask}
            onRequestReminder={setReminderTarget}
            onRequestFolder={setFolderTarget}
          />
        ))}
      </AnimatePresence>

      {/* Left-edge folder markers (hidden when drawer is open) */}
      {!hasOpenFolder && <FolderMarkers />}

      {/* Right-edge reminder countdown markers */}
      <ReminderMarkers />

      {/* Reminder setup modal */}
      <ReminderModal
        open={!!reminderTarget}
        todoTitle={reminderTodo?.title ?? ''}
        onConfirm={handleReminderConfirm}
        onCancel={() => setReminderTarget(null)}
      />

      {/* Folder picker modal */}
      <FolderPickerModal
        open={!!folderTarget}
        onConfirm={handleFolderConfirm}
        onCancel={() => setFolderTarget(null)}
      />

      {/* In-app reminder toast (fallback when browser notifications are denied) */}
      <ReminderToast toast={activeToast} onDismiss={clearToast} />
    </div>
  )
}
