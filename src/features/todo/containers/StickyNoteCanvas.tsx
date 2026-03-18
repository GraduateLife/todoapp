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
import { FolderOverlay } from '../components/folder/FolderOverlay'
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
  const setReminder = useTodoStore((s) => s.setReminder)
  const setFolder = useTodoStore((s) => s.setFolder)
  const hasOpenFolder = useFolderStore((s) => s.folders.some((f) => f.isOpen))
  const openFolderId = useFolderStore((s) => s.folders.find((f) => f.isOpen)?.id ?? null)

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
    setFolderTarget(null)
  }

  // Visible: non-archived. When a folder is open, only show todos IN that folder.
  const visibleTodos = todos.filter((t) => !t.archived)

  return (
    <div className="fixed inset-0 overflow-hidden" aria-label="Sticky notes canvas">
      {/* Folder overlay (backdrop + frame) — renders below folder cards */}
      <FolderOverlay />

      {/* Folder todos — rendered after overlay so they appear above the backdrop (z-index 200+) */}
      <AnimatePresence>
        {openFolderId && visibleTodos
          .filter((t) => t.folderId === openFolderId)
          .map((todo) => (
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
              onRequestReminder={setReminderTarget}
              onRequestFolder={setFolderTarget}
              zIndexOverride={200 + todo.zIndex}
            />
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {visibleTodos
          .filter((t) => !openFolderId || t.folderId !== openFolderId)
          .map((todo) => (
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
              onRequestReminder={setReminderTarget}
              onRequestFolder={setFolderTarget}
            />
          ))}
      </AnimatePresence>

      {/* Left-edge folder markers */}
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
