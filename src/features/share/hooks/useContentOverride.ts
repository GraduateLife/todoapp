import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Attachment, Priority, SubTask, Todo } from '#/features/todo/types'

interface OverrideState {
  title: string
  description: string
  priority: Priority
  subtasks: SubTask[]
  attachments: Attachment[]
}

function initial(source: Todo | null): OverrideState {
  return {
    title: source?.title ?? '',
    description: source?.description ?? '',
    priority: source?.priority ?? 'normal',
    subtasks: source?.subtasks ? source.subtasks.map((s) => ({ ...s })) : [],
    attachments: source?.attachments
      ? source.attachments.map((a) => ({ ...a }))
      : [],
  }
}

function sameSubtasks(a: SubTask[], b: SubTask[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].title !== b[i].title ||
      a[i].completed !== b[i].completed
    )
      return false
  }
  return true
}

function sameAttachments(a: Attachment[], b: Attachment[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].url !== b[i].url ||
      a[i].name !== b[i].name ||
      a[i].type !== b[i].type
    )
      return false
  }
  return true
}

/**
 * Session-local edit overlay for the share flow.
 *
 * Returns a `Todo` that carries the user's edits instead of the stored values,
 * without writing anything back to the todo store — the original note stays
 * untouched no matter what the user types here. Resets whenever the source
 * todo's id changes.
 */
export function useContentOverride(source: Todo | null) {
  const [override, setOverride] = useState<OverrideState>(() => initial(source))

  useEffect(() => {
    setOverride(initial(source))
  }, [source?.id])

  const setTitle = useCallback(
    (v: string) => setOverride((o) => ({ ...o, title: v })),
    [],
  )
  const setDescription = useCallback(
    (v: string) => setOverride((o) => ({ ...o, description: v })),
    [],
  )
  const setPriority = useCallback(
    (p: Priority) => setOverride((o) => ({ ...o, priority: p })),
    [],
  )
  const addSubtask = useCallback(() => {
    setOverride((o) => ({
      ...o,
      subtasks: [
        ...o.subtasks,
        { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: '', completed: false },
      ],
    }))
  }, [])
  const updateSubtask = useCallback(
    (id: string, patch: Partial<Pick<SubTask, 'title' | 'completed'>>) => {
      setOverride((o) => ({
        ...o,
        subtasks: o.subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }))
    },
    [],
  )
  const removeSubtask = useCallback((id: string) => {
    setOverride((o) => ({
      ...o,
      subtasks: o.subtasks.filter((s) => s.id !== id),
    }))
  }, [])
  const addAttachments = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    if (!arr.length) return
    Promise.all(
      arr.map(
        (f) =>
          new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const url = typeof reader.result === 'string' ? reader.result : ''
              const type: Attachment['type'] = f.type.startsWith('image/')
                ? 'image'
                : f.type.startsWith('audio/')
                ? 'voice'
                : f.type.startsWith('video/')
                ? 'video'
                : 'file'
              resolve({
                id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                type,
                url,
                name: f.name,
              })
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(f)
          }),
      ),
    ).then((attachments) => {
      setOverride((o) => ({ ...o, attachments: [...o.attachments, ...attachments] }))
    })
  }, [])
  const removeAttachment = useCallback((id: string) => {
    setOverride((o) => ({
      ...o,
      attachments: o.attachments.filter((a) => a.id !== id),
    }))
  }, [])

  const resetToOriginal = useCallback(() => {
    if (!source) return
    setOverride(initial(source))
  }, [source])

  const isModified = useMemo(() => {
    if (!source) return false
    return (
      override.title !== source.title ||
      override.description !== (source.description ?? '') ||
      override.priority !== source.priority ||
      !sameSubtasks(override.subtasks, source.subtasks) ||
      !sameAttachments(override.attachments, source.attachments)
    )
  }, [source, override])

  const overriddenTodo = useMemo<Todo | null>(() => {
    if (!source) return null
    if (!isModified) return source
    return {
      ...source,
      title: override.title,
      description: override.description || undefined,
      priority: override.priority,
      subtasks: override.subtasks,
      attachments: override.attachments,
    }
  }, [source, override, isModified])

  return {
    title: override.title,
    description: override.description,
    priority: override.priority,
    subtasks: override.subtasks,
    attachments: override.attachments,
    setTitle,
    setDescription,
    setPriority,
    addSubtask,
    updateSubtask,
    removeSubtask,
    addAttachments,
    removeAttachment,
    isModified,
    resetToOriginal,
    overriddenTodo,
  }
}
