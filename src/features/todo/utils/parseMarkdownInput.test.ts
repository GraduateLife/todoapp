import { describe, expect, it } from 'vitest'
import { parseMarkdownInput } from './parseMarkdownInput'

describe('parseMarkdownInput', () => {
  it('returns null for empty input', () => {
    expect(parseMarkdownInput(' \n \n')).toBeNull()
  })

  it('parses a title, priority, subtasks, and color marker', () => {
    const result = parseMarkdownInput(
      'Ship release!\n- [x] tag commit\n- announce launch\n[green]',
    )

    expect(result).toEqual({
      ok: true,
      data: {
        title: 'Ship release',
        subtasks: [
          { title: 'tag commit', completed: true },
          { title: 'announce launch', completed: false },
        ],
        priority: 'high',
        color: 'green',
      },
      tokens: [
        { kind: 'title', text: 'Ship release!', priority: 'high' },
        { kind: 'subtask', text: 'tag commit', completed: true },
        { kind: 'subtask', text: 'announce launch', completed: false },
        { kind: 'color', text: '[green]', value: 'green' },
      ],
      hasWarnings: false,
    })
  })

  it('treats extra plain lines as unchecked subtasks', () => {
    const result = parseMarkdownInput(
      'Weekly review.\ncollect notes\nshare summary',
    )

    expect(result).toEqual({
      ok: true,
      data: {
        title: 'Weekly review',
        subtasks: [
          { title: 'collect notes', completed: false },
          { title: 'share summary', completed: false },
        ],
        priority: 'normal',
        color: undefined,
      },
      tokens: [
        { kind: 'title', text: 'Weekly review.', priority: 'normal' },
        { kind: 'extra', text: 'collect notes' },
        { kind: 'extra', text: 'share summary' },
      ],
      hasWarnings: false,
    })
  })

  it('reports malformed subtask lines as warnings', () => {
    const result = parseMarkdownInput('Inbox zero?\n-email finance')

    expect(result).toEqual({
      ok: true,
      data: {
        title: 'Inbox zero',
        subtasks: [],
        priority: 'low',
        color: undefined,
      },
      tokens: [
        { kind: 'title', text: 'Inbox zero?', priority: 'low' },
        { kind: 'warn', text: '-email finance' },
      ],
      hasWarnings: true,
    })
  })

  it('falls back to the first non-empty token text when no title token exists', () => {
    const result = parseMarkdownInput('[pink]\n- call ops')

    expect(result).toEqual({
      ok: true,
      data: {
        title: '[pink]',
        subtasks: [{ title: 'call ops', completed: false }],
        priority: 'normal',
        color: 'pink',
      },
      tokens: [
        { kind: 'color', text: '[pink]', value: 'pink' },
        { kind: 'subtask', text: 'call ops', completed: false },
      ],
      hasWarnings: false,
    })
  })
})
