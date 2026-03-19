import { useState, useCallback, useRef } from 'react'
import { useTodoStore } from '../store'
import { useUiStore } from '../store/uiStore'
import { TodoInput } from '../components/TodoInput'
import { ImageAttachment, fileToDataUrl } from '#/components/Attachment/ImageAttachment'
import { VoiceAttachment, blobToDataUrl } from '#/components/Attachment/VoiceAttachment'
import type { Attachment } from '../types'
import type { ParsedTodo } from '../utils/parseMarkdownInput'

export function TodoInputContainer() {
  const [value, setValue] = useState('')
  const valueRef = useRef('')
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const addTodo = useTodoStore((s) => s.addTodo)
  const addTodoWithDetails = useTodoStore((s) => s.addTodoWithDetails)
  const isDragging = useUiStore((s) => s.isDragging)

  const onChange = useCallback((nextValue: string) => {
    valueRef.current = nextValue
    setValue(nextValue)
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = valueRef.current.trim()
    if (!trimmed) return
    addTodo(trimmed, pendingAttachments.length > 0 ? pendingAttachments : undefined)
    valueRef.current = ''
    setValue('')
    setPendingAttachments([])
  }, [pendingAttachments, addTodo])

  const handleSubmitExpanded = useCallback((parsed: ParsedTodo) => {
    addTodoWithDetails(
      parsed.title,
      parsed.subtasks,
      parsed.priority,
      pendingAttachments.length > 0 ? pendingAttachments : undefined,
    )
    valueRef.current = ''
    setValue('')
    setPendingAttachments([])
  }, [pendingAttachments, addTodoWithDetails])

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
        <span className="ml-1 font-mono text-[10px]" style={{ color: 'var(--rf-cyan)' }}>
          +{pendingAttachments.length}
        </span>
      )}
    </div>
  )

  return (
    <TodoInput
      value={value}
      onChange={onChange}
      onSubmit={handleSubmit}
      onSubmitExpanded={handleSubmitExpanded}
      attachments={attachments}
      isDragging={isDragging}
    />
  )
}
