import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Attachment, Priority } from '../types'

const addTodo = vi.fn()
const addTodoWithDetails = vi.fn()

vi.mock('../store/todoStore', () => ({
  useTodoStore: {
    getState: () => ({
      addTodo,
      addTodoWithDetails,
    }),
  },
}))

import { TodoService } from './TodoService'

describe('TodoService', () => {
  beforeEach(() => {
    addTodo.mockReset()
    addTodoWithDetails.mockReset()
  })

  it('createFromText trims input and forwards attachments, position, and priority', () => {
    const attachments: Attachment[] = [
      {
        id: 'att-1',
        type: 'file',
        url: 'https://example.com/file.txt',
        name: 'file.txt',
      },
    ]

    TodoService.createFromText('  Buy milk!  ', {
      attachments,
      position: { x: 24, y: 48 },
    })

    expect(addTodo).toHaveBeenCalledWith('Buy milk', {
      attachments,
      priority: 'high',
      position: { x: 24, y: 48 },
    })
  })

  it('createFromText does not create a todo for blank input', () => {
    TodoService.createFromText('   ')

    expect(addTodo).not.toHaveBeenCalled()
  })

  it('createFromText does not create a todo when only a trailing mark remains', () => {
    TodoService.createFromText(' ! ')

    expect(addTodo).not.toHaveBeenCalled()
  })

  it('createFromVoice forwards parsed priority to addTodo', () => {
    TodoService.createFromVoice('Maybe later?')

    expect(addTodo).toHaveBeenCalledWith('Maybe later', {
      priority: 'low',
    })
  })

  it('createFromVoiceWithSubtasks forwards stripped title, subtasks, and priority', () => {
    const subtasks = [
      { title: 'Tag release', completed: false },
      { title: 'Post changelog', completed: true },
    ]

    TodoService.createFromVoiceWithSubtasks('Launch prep~', subtasks)

    expect(addTodoWithDetails).toHaveBeenCalledWith(
      'Launch prep',
      subtasks,
      'idea',
    )
  })

  it('createFromAI creates a todo with parsed priority and ignores extra options', () => {
    TodoService.createFromAI('Ship beta.', { description: 'keep internal only' })

    expect(addTodo).toHaveBeenCalledWith('Ship beta', {
      priority: 'normal',
    })
  })

  it.each([
    ['createFromVoice', (title: string) => TodoService.createFromVoice(title)],
    [
      'createFromAI',
      (title: string) => TodoService.createFromAI(title, {
        description: 'ignored',
      }),
    ],
  ])('%s ignores blank input', (_label, run) => {
    run('   ')

    expect(addTodo).not.toHaveBeenCalled()
  })

  it('createFromVoiceWithSubtasks ignores blank input', () => {
    TodoService.createFromVoiceWithSubtasks('   ', [])

    expect(addTodoWithDetails).not.toHaveBeenCalled()
  })

  it.each([
    ['!', 'high'],
    ['.', 'normal'],
    ['?', 'low'],
    ['~', 'idea'],
  ] satisfies Array<[string, Priority]>)(
    'createFromText respects trailing mark %s -> %s',
    (mark, expectedPriority) => {
      TodoService.createFromText(`Task${mark}`)

      expect(addTodo).toHaveBeenCalledWith('Task', {
        attachments: undefined,
        priority: expectedPriority,
        position: undefined,
      })
    },
  )
})
