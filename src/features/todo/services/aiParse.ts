import { isAIAvailable } from '../../../lib/ai'

/**
 * Pure local syntax fixer — no AI, instant, deterministic.
 *
 * Rules:
 * - Line 1 (title) → never touched
 * - Lines 2+:
 *   - Already starts with "- " → keep as-is
 *   - Starts with "-" but no space (e.g. "-milk") → fix to "- milk"
 *   - Already starts with "- [x] " or "- [] " or "- [ ] " → keep (checkbox)
 *   - Empty line → keep
 *   - Plain text → prepend "- "
 *
 * Returns the fixed text, or null if nothing changed.
 */
export function localFixSyntax(raw: string): string | null {
  const lines = raw.split('\n')
  if (lines.length < 2) return null

  let changed = false
  const result = lines.map((line, i) => {
    // Never touch the first line (title)
    if (i === 0) return line

    // Empty or whitespace-only → keep
    if (!line.trim()) return line

    // Already a valid subtask: "- text", "- [x] text", "- [] text"
    if (/^- /.test(line)) return line

    // Malformed: "-text" → "- text"
    const noSpace = line.match(/^-(\S.*)/)
    if (noSpace) {
      changed = true
      return `- ${noSpace[1]}`
    }

    // Plain text → prepend "- "
    changed = true
    return `- ${line}`
  })

  return changed ? result.join('\n') : null
}

export { isAIAvailable }
