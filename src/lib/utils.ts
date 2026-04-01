import React from 'react'
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function imeGuard<E extends React.KeyboardEvent>(
  handler: (e: E) => void,
): (e: E) => void {
  return (e) => {
    if (e.nativeEvent.isComposing) return
    handler(e)
  }
}
