import { describe, expect, it } from 'vitest'
import { localFixSyntax } from './aiParse'

describe('localFixSyntax', () => {
  it('returns null for single-line input', () => {
    expect(localFixSyntax('Buy milk')).toBeNull()
  })

  it('normalizes malformed subtasks and prefixes plain lines', () => {
    expect(localFixSyntax('Weekend plan\n-milk\nCall mom')).toBe(
      'Weekend plan\n- milk\n- Call mom',
    )
  })

  it('preserves valid subtask syntax and blank lines', () => {
    expect(
      localFixSyntax('Trip prep\n- [x] book flights\n- pack charger\n'),
    ).toBeNull()
  })

  it('keeps the first line untouched', () => {
    expect(localFixSyntax('Idea~\nsummary line')).toBe('Idea~\n- summary line')
  })
})
