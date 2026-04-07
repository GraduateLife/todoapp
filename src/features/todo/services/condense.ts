import { getAIProvider } from '../../../lib/ai'
import { TITLE_MAX_LEN } from '../../../lib/limits'

const CONDENSE_SYSTEM_PROMPT = `You are a concise task summarizer. Your job is to shorten a voice-transcribed todo item to under ${TITLE_MAX_LEN} characters while preserving the core meaning. Rules:
- Output ONLY the shortened text, nothing else
- Keep the same language as the input
- Preserve key details: who, what, when
- No quotes, no explanation, no punctuation changes`

const SPLIT_SYSTEM_PROMPT = `You are a task planner. Break a voice-transcribed todo into a main title and actionable subtasks. Rules:
- First line is the main title (under 60 characters)
- Following lines are subtasks, each prefixed with "- "
- Keep the same language as the input
- 2-5 subtasks, each under 80 characters
- Output ONLY the title and subtasks, nothing else`

const CHAR_LIMIT = TITLE_MAX_LEN

export interface SplitResult {
  title: string
  subtasks: { title: string; completed: boolean }[]
}

export async function condenseTodo(text: string): Promise<string> {
  if (text.length <= CHAR_LIMIT) return text

  const result = await getAIProvider().complete(
    `Shorten this todo to under ${CHAR_LIMIT} characters:\n\n${text}`,
    {
      systemPrompt: CONDENSE_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 128,
    },
  )

  return result.length > CHAR_LIMIT ? result.slice(0, CHAR_LIMIT) : result
}

export async function splitTodo(text: string): Promise<SplitResult> {
  const result = await getAIProvider().complete(
    `Break this todo into a main title and subtasks:\n\n${text}`,
    {
      systemPrompt: SPLIT_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 256,
    },
  )

  const lines = result.split('\n').filter((l) => l.trim())
  const title = lines[0]?.replace(/^#+\s*/, '').trim() || text.slice(0, 60)
  const subtasks = lines
    .slice(1)
    .filter((l) => l.trim().startsWith('-'))
    .map((l) => ({
      title: l.replace(/^-\s*/, '').trim(),
      completed: false,
    }))

  return { title, subtasks: subtasks.length > 0 ? subtasks : [{ title: text.slice(0, 80), completed: false }] }
}

export { CHAR_LIMIT }
