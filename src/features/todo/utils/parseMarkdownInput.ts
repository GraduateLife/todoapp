import type { Priority } from '../types'

export type ParsedSubTask = { title: string; completed: boolean }

export type ParsedTodo = {
  title: string
  subtasks: ParsedSubTask[]
  priority: Priority
}

/** Classification of a single raw line */
export type LineToken =
  | { kind: 'title';    text: string }
  | { kind: 'subtask';  text: string; completed: boolean }
  | { kind: 'priority'; text: string; value: Priority }
  | { kind: 'warn';     text: string }   // e.g. "-milk" — looks like a subtask missing a space
  | { kind: 'extra';    text: string }   // extra plain line = CONFLICT
  | { kind: 'empty' }

export type ParseResult =
  | { ok: true;  data: ParsedTodo; tokens: LineToken[]; hasWarnings: boolean }
  | { ok: false; error: string;    tokens: LineToken[] }

/** Tokenise every raw line */
function tokenise(lines: string[]): LineToken[] {
  let titleSeen = false
  return lines.map((raw): LineToken => {
    const line = raw.trim()
    if (!line) return { kind: 'empty' }

    // ── Priority markers ────────────────────────────────────────────────────
    // [!+] = high · [!-] = low · [!] = normal (explicit)
    if (line === '[!+]') return { kind: 'priority', text: line, value: 'high'   }
    if (line === '[!-]') return { kind: 'priority', text: line, value: 'low'    }
    if (line === '[!]')  return { kind: 'priority', text: line, value: 'normal' }

    // ── Subtask — full form: "- [x] text" or "- [] text" or "- [ ] text" ──
    const subFull = line.match(/^-\s+\[(x|\s*)\]\s+(.+)/)
    if (subFull) {
      return { kind: 'subtask', text: subFull[2].trim(), completed: subFull[1] === 'x' }
    }

    // ── Subtask — short form: "- text" ─────────────────────────────────────
    const subShort = line.match(/^-\s+(.+)/)
    if (subShort) {
      return { kind: 'subtask', text: subShort[1].trim(), completed: false }
    }

    // ── Malformed subtask: "-text" with no space ────────────────────────────
    if (/^-\S/.test(line)) return { kind: 'warn', text: line }

    // ── Plain lines ─────────────────────────────────────────────────────────
    if (!titleSeen) { titleSeen = true; return { kind: 'title', text: line } }
    return { kind: 'extra', text: line }
  })
}

/**
 * Parse a raw multiline string into a structured todo.
 * Returns null when the input is completely empty.
 */
export function parseMarkdownInput(raw: string): ParseResult | null {
  const lines  = raw.split('\n')
  const tokens = tokenise(lines)

  const nonEmpty = tokens.filter((t) => t.kind !== 'empty')
  if (nonEmpty.length === 0) return null

  const titleTokens = tokens.filter((t) => t.kind === 'title')
  const extraTokens = tokens.filter((t) => t.kind === 'extra')
  const warnTokens  = tokens.filter((t) => t.kind === 'warn')
  const subtasks    = tokens
    .filter((t): t is Extract<LineToken, { kind: 'subtask' }> => t.kind === 'subtask')
    .map((t) => ({ title: t.text, completed: t.completed }))
  const priorityTok = tokens
    .filter((t): t is Extract<LineToken, { kind: 'priority' }> => t.kind === 'priority')
    .at(-1)
  const priority: Priority = priorityTok?.value ?? 'normal'

  if (titleTokens.length === 0) {
    return {
      ok: false,
      error: 'no title line — add one line without any prefix',
      tokens,
    }
  }

  if (extraTokens.length > 0) {
    const total = titleTokens.length + extraTokens.length
    return {
      ok: false,
      error: `${total} title lines detected — only 1 allowed per todo`,
      tokens,
    }
  }

  return {
    ok: true,
    data:        { title: titleTokens[0].text, subtasks, priority },
    tokens,
    hasWarnings: warnTokens.length > 0,
  }
}
