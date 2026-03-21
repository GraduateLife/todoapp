import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'

const QUICK_OPTIONS = [
  { label: '15 min', ms: 15 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hr',   ms: 60 * 60 * 1000 },
  { label: '3 hr',   ms: 3 * 60 * 60 * 1000 },
  { label: '1 day',  ms: 24 * 60 * 60 * 1000 },
]

interface ReminderModalProps {
  open: boolean
  todoTitle: string
  onConfirm: (remindAt: number, interval?: number) => void
  onCancel: () => void
  onTitleChange?: (newTitle: string) => void
}

export function ReminderModal({ open, todoTitle, onConfirm, onCancel, onTitleChange }: ReminderModalProps) {
  const [customMinutes, setCustomMinutes] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [selectedMs, setSelectedMs] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCustomMinutes('')
      setRepeat(false)
      setSelectedMs(null)
      setEditingTitle(false)
      setTitleDraft('')
    }
  }, [open])

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select()
  }, [editingTitle])

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== todoTitle) onTitleChange?.(trimmed)
    setEditingTitle(false)
  }

  if (!open || typeof document === 'undefined') return null

  const handleQuickSelect = (ms: number) => {
    setSelectedMs(ms)
    setCustomMinutes('')
  }

  const handleConfirm = () => {
    let ms = selectedMs
    if (!ms && customMinutes.trim()) {
      ms = parseFloat(customMinutes) * 60 * 1000
    }
    if (!ms || ms <= 0) return
    onConfirm(Date.now() + ms, repeat ? ms : undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onCancel()
  }

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9500, background: 'rgba(4,6,12,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="relative rounded-[3px] p-6"
        style={{
          background: '#080c18',
          border: '1px solid rgba(0,245,255,0.25)',
          boxShadow: '0 0 40px rgba(0,245,255,0.1), 0 16px 48px rgba(0,0,0,0.7)',
          minWidth: 320,
          maxWidth: 400,
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="mb-4">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-50 mb-1"
            style={{ color: 'var(--rf-cyan)' }}>
            set reminder
          </p>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="rf-input-field font-mono text-[0.78rem] w-full"
              style={{ color: 'var(--rf-text)', borderBottom: '1px solid rgba(0,245,255,0.3)', paddingBottom: 1 }}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
                if (e.key === 'Escape') { e.preventDefault(); setEditingTitle(false) }
              }}
            />
          ) : (
            <p
              className="font-mono text-[0.78rem] truncate cursor-text"
              style={{ color: 'var(--rf-text)' }}
              title="double-click to edit"
              onDoubleClick={() => { setTitleDraft(todoTitle); setEditingTitle(true) }}
            >
              {todoTitle}
            </p>
          )}
        </div>

        {/* Quick options */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              type="button"
              onClick={() => handleQuickSelect(opt.ms)}
              className="rf-btn"
              style={
                selectedMs === opt.ms
                  ? { borderColor: 'var(--rf-cyan)', color: 'var(--rf-cyan)', background: 'rgba(0,245,255,0.08)' }
                  : undefined
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="mb-4">
          <label className="font-mono text-[9px] tracking-[0.15em] uppercase opacity-50 block mb-1"
            style={{ color: 'var(--rf-text-dim)' }}>
            or enter minutes
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.9rem]" style={{ color: 'var(--rf-cyan)' }}>›</span>
            <input
              ref={inputRef}
              type="number"
              min="1"
              value={customMinutes}
              onChange={(e) => { setCustomMinutes(e.target.value); setSelectedMs(null) }}
              placeholder="e.g. 45"
              className="rf-input-field flex-1"
              style={{ borderBottom: '1px solid rgba(0,245,255,0.2)', paddingBottom: 2 }}
            />
            <span className="font-mono text-[9px] opacity-40" style={{ color: 'var(--rf-text-dim)' }}>min</span>
          </div>
        </div>

        {/* Repeat toggle */}
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => setRepeat((v) => !v)}
            className="font-mono text-[10px] tracking-[0.12em] uppercase transition-all"
            style={{
              color: repeat ? 'var(--rf-cyan)' : 'var(--rf-text-dim)',
              textShadow: repeat ? '0 0 8px rgba(0,245,255,0.5)' : 'none',
            }}
          >
            {repeat ? '[✕] repeat' : '[ ] repeat'}
          </button>
          {repeat && (
            <span className="font-mono text-[8px] opacity-40" style={{ color: 'var(--rf-text-dim)' }}>
              — fires every interval
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button type="button" className="rf-btn" onClick={onCancel}>
            [ cancel ]
          </button>
          <button
            type="button"
            className="rf-btn"
            onClick={handleConfirm}
            style={{
              borderColor: 'var(--rf-cyan)',
              color: 'var(--rf-cyan)',
              background: 'rgba(0,245,255,0.06)',
            }}
          >
            [ confirm ]
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
