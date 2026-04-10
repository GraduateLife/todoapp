import { useState, useCallback, useRef } from 'react'
import { useTodoStore } from '../store'
import { useUiStore } from '../store/uiStore'
import { useFolderStore } from '../store'
import { TodoInput } from '../components/input-bar'
import { fileToDataUrl } from '#/components/Attachment/ImageAttachment'
import { MAX_FILE_SIZE, MAX_FILES_PER_TODO, ALLOWED_FILE_TYPES } from '../../../lib/limits'
import type { Attachment } from '../types'
import type { ParsedTodo } from '../utils/parseMarkdownInput'

function getFileType(file: File): Attachment['type'] {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'voice'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

function validateFile(file: File, currentCount: number): string | null {
  if (currentCount >= MAX_FILES_PER_TODO) {
    return `最多 ${MAX_FILES_PER_TODO} 个文件`
  }
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024)
    return `文件过大（上限 ${maxMB}MB）`
  }
  if (!ALLOWED_FILE_TYPES.some((t) => file.type.startsWith(t))) {
    return '不支持的文件类型（仅支持图片和音频）'
  }
  return null
}

export function TodoInputContainer() {
  const [value, setValue] = useState('')
  const valueRef = useRef('')
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const addTodoWithDetails = useTodoStore((s) => s.addTodoWithDetails)
  const hasOpenFolder = useFolderStore((s) => s.folders.some((f) => f.isOpen))
  const isDragging =
    useUiStore((s) => s.isDragging || !!s.expandedStackId) || hasOpenFolder

  const onChange = useCallback((nextValue: string) => {
    valueRef.current = nextValue
    setValue(nextValue)
  }, [])

  const handleSubmitExpanded = useCallback(
    (parsed: ParsedTodo) => {
      // Priority is the source of truth; color is derived inside the store.
      addTodoWithDetails(
        parsed.title,
        parsed.subtasks,
        parsed.priority,
        pendingAttachments.length > 0 ? pendingAttachments : undefined,
      )
      valueRef.current = ''
      setValue('')
      setPendingAttachments([])
    },
    [pendingAttachments, addTodoWithDetails],
  )

  const handleAddFile = useCallback(async (file: File) => {
    const error = validateFile(file, pendingAttachments.length)
    if (error) {
      console.warn(`[file] rejected: ${error}`)
      // TODO: surface as toast/notification
      return
    }
    const url = await fileToDataUrl(file)
    setPendingAttachments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: getFileType(file), url, name: file.name },
    ])
  }, [pendingAttachments.length])

  const handleRemoveFile = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return (
    <TodoInput
      value={value}
      onChange={onChange}
      onSubmitExpanded={handleSubmitExpanded}
      isDragging={isDragging}
      pendingFiles={pendingAttachments}
      onAddFile={handleAddFile}
      onRemoveFile={handleRemoveFile}
    />
  )
}
