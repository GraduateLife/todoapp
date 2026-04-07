import { useState, useCallback, useRef } from 'react'
import { useTodoStore } from '../store'
import { useUiStore } from '../store/uiStore'
import { useFolderStore } from '../store'
import { TodoInput } from '../components/input-bar'
import { fileToDataUrl } from '#/components/Attachment/ImageAttachment'
import type { Attachment, NoteColor } from '../types'
import type { ParsedTodo } from '../utils/parseMarkdownInput'

function getFileType(file: File): Attachment['type'] {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'voice'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

export function TodoInputContainer() {
  const [value, setValue] = useState('')
  const valueRef = useRef('')
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [selectedColor, setSelectedColor] = useState<NoteColor | 'random'>(
    'random',
  )
  const addTodoWithDetails = useTodoStore((s) => s.addTodoWithDetails)
  const hasOpenFolder = useFolderStore((s) => s.folders.some((f) => f.isOpen))
  const isDragging =
    useUiStore((s) => s.isDragging || !!s.expandedStackId) || hasOpenFolder

  const onChange = useCallback((nextValue: string) => {
    valueRef.current = nextValue
    setValue(nextValue)
  }, [])

  const resolvedColor = selectedColor === 'random' ? undefined : selectedColor

  const handleSubmitExpanded = useCallback(
    (parsed: ParsedTodo) => {
      addTodoWithDetails(
        parsed.title,
        parsed.subtasks,
        parsed.priority,
        pendingAttachments.length > 0 ? pendingAttachments : undefined,
        parsed.color ?? resolvedColor,
      )
      valueRef.current = ''
      setValue('')
      setPendingAttachments([])
    },
    [pendingAttachments, addTodoWithDetails, resolvedColor],
  )

  const handleAddFile = useCallback(async (file: File) => {
    const url = await fileToDataUrl(file)
    setPendingAttachments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: getFileType(file), url, name: file.name },
    ])
  }, [])

  const handleRemoveFile = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return (
    <TodoInput
      value={value}
      onChange={onChange}
      onSubmitExpanded={handleSubmitExpanded}
      isDragging={isDragging}
      selectedColor={selectedColor}
      onColorChange={setSelectedColor}
      pendingFiles={pendingAttachments}
      onAddFile={handleAddFile}
      onRemoveFile={handleRemoveFile}
    />
  )
}
