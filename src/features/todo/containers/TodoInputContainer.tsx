import { useState, useCallback, useRef } from 'react'
import { useTodoStore } from '../store'
import { useUiStore } from '../store/uiStore'
import { useFolderStore } from '../store'
import { TodoInput } from '../components/input-bar'
import {
  ImageAttachment,
  fileToDataUrl,
} from '#/components/Attachment/ImageAttachment'
import {
  VoiceAttachment,
  blobToDataUrl,
} from '#/components/Attachment/VoiceAttachment'
import type { Attachment, NoteColor } from '../types'
import type { ParsedTodo } from '../utils/parseMarkdownInput'

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

  const handleImageSelect = useCallback(async (file: File) => {
    const url = await fileToDataUrl(file)
    setPendingAttachments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'image', url, name: file.name },
    ])
  }, [])

  const handleVoiceRecorded = useCallback(async (blob: Blob, name: string) => {
    const url = await blobToDataUrl(blob)
    setPendingAttachments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'voice', url, name },
    ])
  }, [])

  const attachments = (
    <div className="flex items-center gap-0.5">
      <ImageAttachment onSelect={handleImageSelect} />
      <VoiceAttachment onRecorded={handleVoiceRecorded} />
      {pendingAttachments.length > 0 && (
        <span
          className="ml-1 font-mono text-[10px]"
          style={{ color: 'var(--rf-cyan)' }}
        >
          +{pendingAttachments.length}
        </span>
      )}
    </div>
  )

  return (
    <TodoInput
      value={value}
      onChange={onChange}
      onSubmitExpanded={handleSubmitExpanded}
      attachments={attachments}
      isDragging={isDragging}
      selectedColor={selectedColor}
      onColorChange={setSelectedColor}
    />
  )
}
