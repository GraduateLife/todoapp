import { useState, useEffect, useRef, useCallback } from 'react'
import { isAIAvailable } from '../../../../lib/ai'
import { suggestNextSubtask } from '../../services/aiSuggest'

const SUGGEST_DEBOUNCE_MS = 500

/**
 * Hook: AI-powered subtask suggestion (ghost text).
 *
 * Triggers when user is on an empty line after at least one subtask or title.
 * Returns the suggestion text and the line index where it should appear.
 * Call `accept()` to insert the suggestion into the text.
 */
export function useAiSuggestion(
  value: string,
  onChange: (v: string) => void,
  isExpanded: boolean,
) {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [suggestLineIdx, setSuggestLineIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(false)
  // Track which suggestion was already shown for this context to avoid re-fetching
  const lastContextKey = useRef('')

  const clearSuggestion = useCallback(() => {
    setSuggestion(null)
    setSuggestLineIdx(-1)
    abortRef.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const accept = useCallback(() => {
    if (!suggestion || suggestLineIdx < 0) return
    const lines = value.split('\n')
    if (suggestLineIdx >= lines.length) return

    // Insert "- suggestion" at the current empty line
    lines[suggestLineIdx] = `- ${suggestion}`
    onChange(lines.join('\n'))
    clearSuggestion()
    lastContextKey.current = '' // allow new suggestions
  }, [suggestion, suggestLineIdx, value, onChange, clearSuggestion])

  useEffect(() => {
    if (!isExpanded || !isAIAvailable()) {
      clearSuggestion()
      return
    }

    const lines = value.split('\n')

    // Find title (first non-empty line)
    const titleLine = lines[0]?.trim()
    if (!titleLine) {
      clearSuggestion()
      return
    }

    // Check if the last line is empty or just "- " (user started a new subtask)
    const lastIdx = lines.length - 1
    const lastLine = lines[lastIdx]?.trim()
    const isEmptyLastLine = lastLine === '' || lastLine === '-' || lastLine === '- '

    if (!isEmptyLastLine || lines.length < 2) {
      clearSuggestion()
      return
    }

    // Collect existing subtasks
    const subtasks = lines
      .slice(1, lastIdx)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- '))
      .map((l) => l.slice(2).replace(/^\[[ x]?\]\s*/, ''))
      .filter(Boolean)

    // Need at least a title to suggest
    const contextKey = `${titleLine}|${subtasks.join(',')}`
    if (contextKey === lastContextKey.current) return

    // Clear previous
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSuggestion(null)

    abortRef.current = false
    debounceRef.current = setTimeout(() => {
      lastContextKey.current = contextKey
      suggestNextSubtask(titleLine, subtasks)
        .then((result) => {
          if (!abortRef.current && result) {
            setSuggestion(result)
            setSuggestLineIdx(lastIdx)
          }
        })
        .catch(() => {})
    }, SUGGEST_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, isExpanded, clearSuggestion])

  // Reset on collapse
  useEffect(() => {
    if (!isExpanded) {
      clearSuggestion()
      lastContextKey.current = ''
    }
  }, [isExpanded, clearSuggestion])

  return { suggestion, suggestLineIdx, accept, clearSuggestion }
}
