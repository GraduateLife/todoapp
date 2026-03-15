import { Input } from '@heroui/react'
import type { ReactNode } from 'react'

interface TodoInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  attachments?: ReactNode
}

export function TodoInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add a todo…',
  attachments,
}: TodoInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-sm">
      <Input
        type="text"
        value={value}
        onValueChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        variant="flat"
        classNames={{
          input: 'bg-transparent',
          inputWrapper: 'bg-transparent shadow-none',
        }}
        aria-label="New todo title"
      />
      {attachments}
    </div>
  )
}
