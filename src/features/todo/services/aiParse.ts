import { getAIProvider, isAIAvailable } from '../../../lib/ai'

const FIX_SYNTAX_PROMPT = `You are a minimal syntax fixer for a todo-list app.

SYNTAX:
- Line 1 = title (plain text, NO prefix)
- Lines 2+ = subtasks, each MUST start with exactly "- " (one dash, one space)
- "!" or "?" suffixes on the title line indicate priority — do NOT add these to subtask lines

RULES:
1. NEVER modify line 1 in any way — no prefix, no suffix, no rewording
2. For lines 2+: ONLY add "- " at the start if missing. That is the ONLY change allowed
3. Fix "-text" (no space) → "- text"
4. NEVER add "!", "?", "." to subtask lines
5. NEVER add tabs, extra spaces, or indentation
6. NEVER reword, reorder, or remove any text
7. NEVER wrap output in code fences or add explanation
8. If input is already correct, return it UNCHANGED

EXAMPLES:

Input:
Buy groceries!
apple
milk
- bread

Output:
Buy groceries!
- apple
- milk
- bread

Input:
Fix auth bug
-check tokens
validate flow

Output:
Fix auth bug
- check tokens
- validate flow

Input:
Deploy app?
- run tests
- push to prod

Output:
Deploy app?
- run tests
- push to prod`

/**
 * Ask AI to fix/supplement syntax in the user's buffer input.
 * Returns the corrected text string, or null if AI is unavailable or fails.
 */
export async function aiFixSyntax(raw: string): Promise<string | null> {
  if (!isAIAvailable()) return null

  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const result = await getAIProvider().complete(
      `Fix the syntax:\n\n${trimmed}`,
      {
        systemPrompt: FIX_SYNTAX_PROMPT,
        temperature: 0,
        maxTokens: 512,
      },
    )

    const cleaned = result.trim()
    if (!cleaned || cleaned.length > raw.length * 3) return null

    // Reject if AI changed line count (sign of rewriting)
    const inputLines = trimmed.split('\n').length
    const outputLines = cleaned.split('\n').length
    if (outputLines !== inputLines) return null

    // Reject if AI modified the first line at all
    const firstIn = trimmed.split('\n')[0]
    const firstOut = cleaned.split('\n')[0]
    if (firstIn !== firstOut) return null

    return cleaned
  } catch {
    return null
  }
}

export { isAIAvailable }
