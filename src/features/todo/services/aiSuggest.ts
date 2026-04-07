import { getAIProvider, isAIAvailable } from '../../../lib/ai'

const SUGGEST_PROMPT = `You are a subtask suggestion engine for a todo app.

Given a todo title and existing subtasks, predict the SINGLE most likely next subtask.

RULES:
1. Return ONLY the subtask text (no "- " prefix, no numbering, no explanation)
2. Keep it short — under 40 characters
3. Make it contextually relevant to the title and existing subtasks
4. Don't repeat existing subtasks
5. If you can't think of anything useful, return exactly "NONE"
6. Match the language of the input (Chinese → Chinese, English → English)

EXAMPLES:

Title: Buy groceries
Subtasks: apple, milk
→ bread

Title: 准备搬家
Subtasks: 找搬家公司, 打包衣物
→ 通知物业

Title: Deploy v2.0
Subtasks: run tests, push to prod
→ verify monitoring

Title: Fix login bug
Subtasks: check auth tokens
→ test login flow`

export async function suggestNextSubtask(
  title: string,
  existingSubtasks: string[],
): Promise<string | null> {
  if (!isAIAvailable()) return null

  const subsText = existingSubtasks.length > 0
    ? `Subtasks: ${existingSubtasks.join(', ')}`
    : 'Subtasks: (none yet)'

  try {
    const result = await getAIProvider().complete(
      `Title: ${title}\n${subsText}\n→`,
      {
        systemPrompt: SUGGEST_PROMPT,
        temperature: 0.3,
        maxTokens: 60,
      },
    )

    const cleaned = result.trim().replace(/^- /, '')
    if (!cleaned || cleaned === 'NONE' || cleaned.length > 60) return null
    return cleaned
  } catch {
    return null
  }
}
