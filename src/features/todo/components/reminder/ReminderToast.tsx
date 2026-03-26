import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReminderToast as ReminderToastType } from '../../hooks/useReminderScheduler'

interface ReminderToastProps {
  toast: ReminderToastType | null
  onDismiss: () => void
}

const AUTO_DISMISS_MS = 8000

export function ReminderToast({ toast, onDismiss }: ReminderToastProps) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed"
      style={{
        zIndex: 9999,
        bottom: 24,
        right: 24,
        minWidth: 260,
        maxWidth: 340,
        background: '#080c18',
        border: '1px solid rgba(0,245,255,0.4)',
        borderRadius: 3,
        boxShadow: '0 0 24px rgba(0,245,255,0.15), 0 8px 32px rgba(0,0,0,0.8)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--rf-cyan)',
            textShadow: '0 0 8px var(--rf-cyan)',
          }}
        >
          ⏰ reminder
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="font-mono"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(0,245,255,0.5)',
            fontSize: '0.7rem',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Todo title */}
      <p
        className="font-mono"
        style={{
          fontSize: '0.82rem',
          color: 'var(--rf-text)',
          margin: 0,
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {toast.title}
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: 1,
          background: 'rgba(0,245,255,0.15)',
          marginTop: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: '100%',
            background: 'var(--rf-cyan)',
            transformOrigin: 'left center',
            animation: `toast-shrink ${AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>,
    document.body,
  )
}
