import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Todo } from '#/features/todo/types'

interface OverrideState {
  title: string
  description: string
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
  const [override, setOverride] = useState<OverrideState>(() => ({
    title: source?.title ?? '',
    description: source?.description ?? '',
  }))

  useEffect(() => {
    setOverride({
      title: source?.title ?? '',
      description: source?.description ?? '',
    })
  }, [source?.id])

  const setTitle = useCallback(
    (v: string) => setOverride((o) => ({ ...o, title: v })),
    [],
  )
  const setDescription = useCallback(
    (v: string) => setOverride((o) => ({ ...o, description: v })),
    [],
  )
  const resetToOriginal = useCallback(() => {
    if (!source) return
    setOverride({
      title: source.title,
      description: source.description ?? '',
    })
  }, [source])

  const isModified = useMemo(() => {
    if (!source) return false
    return (
      override.title !== source.title ||
      override.description !== (source.description ?? '')
    )
  }, [source, override])

  const overriddenTodo = useMemo<Todo | null>(() => {
    if (!source) return null
    if (!isModified) return source
    return {
      ...source,
      title: override.title,
      description: override.description || undefined,
    }
  }, [source, override, isModified])

  return {
    title: override.title,
    description: override.description,
    setTitle,
    setDescription,
    isModified,
    resetToOriginal,
    overriddenTodo,
  }
}
