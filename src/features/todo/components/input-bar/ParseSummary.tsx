import type { ParseResult } from '../../utils/parseMarkdownInput'

interface ParseSummaryProps {
  parseResult: ParseResult | null
}

export function ParseSummary({ parseResult }: ParseSummaryProps) {
  if (!parseResult) return <span />

  if (!parseResult.ok) {
    return (
      <span
        className="font-mono text-[9px] tracking-[0.12em]"
        style={{ color: 'var(--rf-danger, #ff3030)' }}
      >
        CONFLICT: {parseResult.error}
      </span>
    )
  }

  const { data, hasWarnings } = parseResult
  const doneCount = data.subtasks.filter((s) => s.completed).length
  const totalSubs = data.subtasks.length
  const subPart =
    totalSubs > 0
      ? `${totalSubs} subtask${totalSubs > 1 ? 's' : ''}${doneCount > 0 ? ` (${doneCount} done)` : ''}`
      : null
  const priPart = data.priority !== 'normal' ? data.priority : null
  const warnPart = hasWarnings ? 'check SUB? lines' : null
  const parts = ['1 todo', subPart, priPart, warnPart].filter(Boolean)

  return (
    <span
      className="font-mono text-[9px] tracking-[0.12em]"
      style={{
        color: hasWarnings ? 'var(--rf-amber, #ffb800)' : 'var(--rf-cyan)',
        opacity: 0.75,
      }}
    >
      {hasWarnings ? '\u26A0 ' : '\u2713 '}
      {parts.join(' \u00B7 ')}
    </span>
  )
}
