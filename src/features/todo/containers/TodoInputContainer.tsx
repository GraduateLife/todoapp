import { useState, useCallback } from 'react'
import { useTodoStore } from '../store'
import { TodoInput } from '../components/TodoInput'
import { ImageAttachment, fileToDataUrl } from '#/components/Attachment/ImageAttachment'
import { VoiceAttachment, blobToDataUrl } from '#/components/Attachment/VoiceAttachment'
import type { Attachment } from '../types'

export function TodoInputContainer() {
  const [value, setValue] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const addTodo = useTodoStore((s) => s.addTodo)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    addTodo(trimmed, pendingAttachments.length > 0 ? pendingAttachments : undefined)
    setValue('')
    setPendingAttachments([])
  }, [value, pendingAttachments, addTodo])

  const handleImageSelect = useCallback(async (file: File) => {
    const url = await fileToDataUrl(file)
    setPendingAttachments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'image',
        url,
        name: file.name,
      },
    ])
  }, [])

  const handleVoiceRecorded = useCallback(async (blob: Blob, name: string) => {
    const url = await blobToDataUrl(blob)
    setPendingAttachments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'voice',
        url,
        name,
      },
    ])
  }, [])

  const attachments = (
    <div className="flex items-center gap-0.5">
      <ImageAttachment onSelect={handleImageSelect} />
      <VoiceAttachment onRecorded={handleVoiceRecorded} />
      {pendingAttachments.length > 0 && (
        <span className="ml-1 text-xs text-[var(--sea-ink-soft)]">
          +{pendingAttachments.length}
        </span>
      )}
    </div>
  )

  return (
    <TodoInput
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      attachments={attachments}
    />
  )
}
