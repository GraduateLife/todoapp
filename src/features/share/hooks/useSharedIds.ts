import { useSyncExternalStore } from 'react'
import { readSharedIds, subscribeSharedIds } from '#/lib/share/recent'

const EMPTY: ReadonlySet<string> = new Set()

let cached: ReadonlySet<string> | null = null
let cachedSerialized = ''

function getSnapshot(): ReadonlySet<string> {
  const ids = readSharedIds()
  const serialized = [...ids].sort().join(',')
  if (serialized === cachedSerialized && cached) return cached
  cached = ids
  cachedSerialized = serialized
  return ids
}

function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY
}

export function useSharedIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribeSharedIds, getSnapshot, getServerSnapshot)
}

export function useIsShared(todoId: string): boolean {
  return useSharedIds().has(todoId)
}
