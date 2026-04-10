import type { Priority, NoteColor } from '../types'
import { parseTrailingMark } from '../constants/priority'

export type ParsedSubTask = { title: string; completed: boolean }

export type ParsedTodo = {
  title: string
  subtasks: ParsedSubTask[]
  priority: Priority
  color?: NoteColor
}

/** Classification of a single raw line */
export type LineToken =
  | { kind: 'title'; text: string; priority: Priority }
  | { kind: 'subtask'; text: string; completed: boolean }
  | { kind: 'color'; text: string; value: NoteColor }
  | { kind: 'warn'; text: string } // e.g. "-milk" — looks like a subtask missing a space
  | { kind: 'extra'; text: string } // extra plain line (will be treated as subtask)
  | { kind: 'empty' }

export type ParseResult =
  | { ok: true; data: ParsedTodo; tokens: LineToken[]; hasWarnings: boolean }
  | { ok: false; error: string; tokens: LineToken[] }

// ── Color markers ───────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, NoteColor> = {
  '[cyan]': 'cyan',
  '[pink]': 'pink',
  '[amber]': 'amber',
  '[green]': 'green',
  '[purple]': 'purple',
}

/**
 * Extract priority suffix from title text:
 *   "Buy groceries!" → { text: "Buy groceries", priority: "high"   } (pink)
 *   "Ship it."       → { text: "Ship it",       priority: "normal" } (amber)
 *   "Maybe later?"   → { text: "Maybe later",   priority: "low"    } (green)
 *   "Dark mode~"     → { text: "Dark mode",     priority: "idea"   } (purple)
 *   "No mark"        → { text: "No mark",       priority: "normal" } (amber)
 *
 * `system` priority (cyan) has no mark — it is reserved for agent-created
 * cards and is unreachable from user input.
 */
function parseTitlePriority(text: string): {
  text: string
  priority: Priority
} {
  const { priority, stripped } = parseTrailingMark(text)
  return { text: stripped, priority }
}

/**
 * Relaxed tokeniser:
 * - First non-empty line → title (priority from trailing mark: !/./?/~)
 * - Lines starting with "- " → subtask (supports [x]/[] checkbox prefix)
 * - Lines starting with "-" but no space → warn (typo hint)
 * - Color markers still recognised
 * - Any other non-empty line → extra (treated as subtask at exec time)
 */
function tokenise(lines: string[]): LineToken[] {
  let titleSeen = false
  return lines.map((raw): LineToken => {
    const line = raw.trim()
    if (!line) return { kind: 'empty' }

    // Color markers
    if (COLOR_MAP[line]) {
      return { kind: 'color', text: line, value: COLOR_MAP[line] }
    }

    // Subtask — full form: "- [x] text" or "- [] text" or "- [ ] text"
    const subFull = line.match(/^-\s+\[(x|\s*)\]\s+(.+)/)
    if (subFull) {
      return {
        kind: 'subtask',
        text: subFull[2].trim(),
        completed: subFull[1] === 'x',
      }
    }

    // Subtask — short form: "- text"
    const subShort = line.match(/^-\s+(.+)/)
    if (subShort) {
      return { kind: 'subtask', text: subShort[1].trim(), completed: false }
    }

    // Malformed subtask: "-text" with no space
    if (/^-\S/.test(line)) return { kind: 'warn', text: line }

    // First plain line → title (with priority suffix)
    if (!titleSeen) {
      titleSeen = true
      const { priority } = parseTitlePriority(line)
      return { kind: 'title', text: line, priority }
    }

    // Additional plain lines → extra
    return { kind: 'extra', text: line }
  })
}

/**
 * Parse a raw multiline string into a structured todo.
 * Relaxed mode: always succeeds if there's any non-empty content.
 */
export function parseMarkdownInput(raw: string): ParseResult | null {
  const lines = raw.split('\n')
  const tokens = tokenise(lines)

  const nonEmpty = tokens.filter((t) => t.kind !== 'empty')
  if (nonEmpty.length === 0) return null

  const titleToken = tokens.find(
    (t): t is Extract<LineToken, { kind: 'title' }> => t.kind === 'title',
  )
  const warnTokens = tokens.filter((t) => t.kind === 'warn')

  // Collect subtasks from subtask tokens and extra lines
  const subtasks = tokens
    .filter(
      (
        t,
      ): t is
        | Extract<LineToken, { kind: 'subtask' }>
        | Extract<LineToken, { kind: 'extra' }> =>
        t.kind === 'subtask' || t.kind === 'extra',
    )
    .map((t) => ({
      title: t.text,
      completed: t.kind === 'subtask' ? t.completed : false,
    }))

  const colorTok = tokens
    .filter(
      (t): t is Extract<LineToken, { kind: 'color' }> => t.kind === 'color',
    )
    .at(-1)
  const color: NoteColor | undefined = colorTok?.value

  // Extract title and priority
  const { text: titleText, priority } = titleToken
    ? parseTitlePriority(titleToken.text)
    : { text: '', priority: 'normal' as Priority }

  // Fallback: use first non-empty token text if no title
  const title =
    titleText || (nonEmpty[0] && 'text' in nonEmpty[0] ? nonEmpty[0].text : '')

  if (!title) {
    return {
      ok: false,
      error: 'empty input',
      tokens,
    }
  }

  return {
    ok: true,
    data: { title, subtasks, priority, color },
    tokens,
    hasWarnings: warnTokens.length > 0,
  }
}
