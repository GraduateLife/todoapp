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
  placeholder = 'type a task and press enter_',
  attachments,
}: TodoInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="rf-input-bar">
      {/* Top edge glow line */}
      <div
        className="w-full h-[1px] opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.6), transparent)',
        }}
      />
      <div className="rf-input-inner">
        <span className="rf-input-prompt" aria-hidden="true">
          &gt;_
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rf-input-field"
          aria-label="New todo"
          autoComplete="off"
          spellCheck={false}
        />
        {attachments && (
          <div className="flex items-center gap-1 flex-shrink-0">{attachments}</div>
        )}
        {value.trim() && (
          <button
            type="button"
            onClick={onSubmit}
            className="rf-btn flex-shrink-0"
            aria-label="Add todo"
          >
            [ add ]
          </button>
        )}
      </div>
    </div>
  )
}
