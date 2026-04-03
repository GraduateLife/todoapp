import { useTodoStore } from '../store/todoStore'
import type { NoteColor, Attachment } from '../types'

/**
 * TodoService — the single entry point for creating todos from any source.
 * All creation paths (typing, voice, AI generation, import, ...) go through here.
 * UI code should call these methods instead of reaching into the store directly.
 */
export const TodoService = {
  /**
   * Create a todo from plain text (e.g. the input bar).
   */
  createFromText(
    title: string,
    options: { color?: NoteColor; attachments?: Attachment[] } = {},
  ): void {
    const trimmed = title.trim()
    if (!trimmed) return
    useTodoStore.getState().addTodo(trimmed, options.attachments, options.color)
  },

  /**
   * Create a todo from a voice transcript.
   * The transcript is treated as the todo title.
   */
  createFromVoice(
    transcript: string,
    options: { color?: NoteColor } = {},
  ): void {
    const trimmed = transcript.trim()
    if (!trimmed) return
    useTodoStore.getState().addTodo(trimmed, [], options.color)
  },

  /**
   * Create a todo with subtasks from a voice transcript (after AI split).
   */
  createFromVoiceWithSubtasks(
    title: string,
    subtasks: { title: string; completed: boolean }[],
    options: { color?: NoteColor } = {},
  ): void {
    const trimmed = title.trim()
    if (!trimmed) return
    useTodoStore.getState().addTodoWithDetails(trimmed, subtasks, 'none', [], options.color)
  },

  /**
   * Create a todo from an AI-generated suggestion.
   * Placeholder for future AI expansion/suggestion features.
   */
  createFromAI(
    title: string,
    options: { color?: NoteColor; description?: string } = {},
  ): void {
    const trimmed = title.trim()
    if (!trimmed) return
    useTodoStore.getState().addTodo(trimmed, [], options.color)
  },
}
