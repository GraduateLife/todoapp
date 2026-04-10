import { describe, expect, it } from 'vitest'
import {
  PRIORITY_TO_COLOR,
  parseTrailingMark,
  priorityToColor,
} from './priority'

describe('priorityToColor', () => {
  it('maps every priority to its fixed note color', () => {
    for (const [priority, color] of Object.entries(PRIORITY_TO_COLOR)) {
      expect(priorityToColor(priority as keyof typeof PRIORITY_TO_COLOR)).toBe(
        color,
      )
    }
  })
})

describe('parseTrailingMark', () => {
  it('parses a high-priority trailing mark', () => {
    expect(parseTrailingMark('Buy milk!')).toEqual({
      priority: 'high',
      stripped: 'Buy milk',
    })
  })

  it('defaults to normal when no trailing mark is present', () => {
    expect(parseTrailingMark('Refill printer paper')).toEqual({
      priority: 'normal',
      stripped: 'Refill printer paper',
    })
  })

  it('preserves internal punctuation and trims only the recognized suffix', () => {
    expect(parseTrailingMark('Ship v2.0 today?')).toEqual({
      priority: 'low',
      stripped: 'Ship v2.0 today',
    })
  })

  it('trims trailing whitespace after removing a recognized suffix', () => {
    expect(parseTrailingMark('Draft roadmap ~')).toEqual({
      priority: 'idea',
      stripped: 'Draft roadmap',
    })
  })

  it('keeps unknown suffixes untouched', () => {
    expect(parseTrailingMark('Check backups;')).toEqual({
      priority: 'normal',
      stripped: 'Check backups;',
    })
  })
})
