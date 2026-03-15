import { useState, useRef, useEffect } from 'react'

interface EditableTitleProps {
  title: string
  onSave: (title: string) => void
  className?: string
  disabled?: boolean
}

export function EditableTitle({
  title,
  onSave,
  className = '',
  disabled = false,
}: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(title)
  }, [title])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleBlur = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== title) onSave(trimmed)
    else setValue(title)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      setValue(title)
      setEditing(false)
      inputRef.current?.blur()
    }
  }

  if (editing && !disabled) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`min-w-0 flex-1 rounded border border-[var(--line)] bg-transparent px-2 py-0.5 text-inherit outline-none focus:border-[var(--lagoon)] ${className}`}
        aria-label="Edit title"
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={`cursor-text select-text rounded px-1 -mx-1 hover:bg-[var(--line)]/50 ${className}`}
      onDoubleClick={() => !disabled && setEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && setEditing(true)}
      aria-label="Double-click to edit"
    >
      {title || 'Untitled'}
    </span>
  )
}
