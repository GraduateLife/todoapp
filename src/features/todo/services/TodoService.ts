import { useTodoStore } from '../store/todoStore'
import { parseTrailingMark } from '../constants/priority'
import type { Attachment } from '../types'

/**
 * TodoService — the single entry point for creating todos from any source.
 * All creation paths (typing, voice, AI generation, import, ...) go through here.
 * UI code should call these methods instead of reaching into the store directly.
 *
 * Priority is derived from the title's trailing mark (`! . ? ~`). Color is
 * then derived from priority inside the store. Callers must never pass a
 * color — priority is the single source of truth.
 */
export const TodoService = {
  /**
   * Create a todo from plain text (e.g. the terminal input bar or the
   * right-click ContextInput). The title's trailing mark decides priority.
   */
  createFromText(
    title: string,
    options: {
      attachments?: Attachment[]
      position?: { x: number; y: number }
    } = {},
  ): void {
    const trimmed = title.trim()
    if (!trimmed) return
    const { priority, stripped } = parseTrailingMark(trimmed)
    if (!stripped) return
    useTodoStore.getState().addTodo(stripped, {
      attachments: options.attachments,
      priority,
      position: options.position,
    })
  },

  /**
   * Create a todo from a voice transcript.
   * The transcript is treated as the todo title; trailing marks are honored
   * so the user can dictate "Buy milk exclamation" equivalents if they want.
   */
  createFromVoice(transcript: string): void {
    const trimmed = transcript.trim()
    if (!trimmed) return
    const { priority, stripped } = parseTrailingMark(trimmed)
    if (!stripped) return
    useTodoStore.getState().addTodo(stripped, { priority })
  },

  /**
   * Create a todo with subtasks from a voice transcript (after AI split).
   */
  createFromVoiceWithSubtasks(
    title: string,
    subtasks: { title: string; completed: boolean }[],
  ): void {
    const trimmed = title.trim()
    if (!trimmed) return
    const { priority, stripped } = parseTrailingMark(trimmed)
    if (!stripped) return
    useTodoStore.getState().addTodoWithDetails(stripped, subtasks, priority)
  },

  /**
   * Create a todo from an AI-generated suggestion.
   * Placeholder for future AI expansion/suggestion features.
   */
  createFromAI(
    title: string,
    options: { description?: string } = {},
  ): void {
    void options
    const trimmed = title.trim()
    if (!trimmed) return
    const { priority, stripped } = parseTrailingMark(trimmed)
    if (!stripped) return
    useTodoStore.getState().addTodo(stripped, { priority })
  },
}
