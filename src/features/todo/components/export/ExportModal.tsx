import { createPortal } from 'react-dom'
import { useState, useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { Todo } from '../../types'
import { EXPORT_TEMPLATES, getTemplate } from '../../export/templates'
import { slugify } from '../../export/templates/_helpers'

// ─── Markdown preview with lightweight syntax highlighting ──────────────────
// This is a per-line highlighter — not a full markdown renderer. Headings,
// list items, task boxes, emphasis, fences and frontmatter dividers are
// colored so the raw source stays readable on a dark background.

function lineStyle(line: string): CSSProperties {
  // YAML frontmatter / horizontal rule
  if (/^---\s*$/.test(line)) return { color: '#ffb800', opacity: 0.55 }
  // Headings
  if (/^###### /.test(line)) return { color: '#ffd580' }
  if (/^##### /.test(line)) return { color: '#ffd580' }
  if (/^#### /.test(line)) return { color: '#ffd580' }
  if (/^### /.test(line)) return { color: '#ffcc66', fontWeight: 500 }
  if (/^## /.test(line)) return { color: '#ffb840', fontWeight: 600 }
  if (/^# /.test(line)) return { color: '#ffb800', fontWeight: 700 }
  // Task list (checked)
  if (/^\s*- \[x\] /i.test(line))
    return {
      color: 'rgba(200,220,235,0.5)',
      textDecoration: 'line-through',
    }
  // Task list (unchecked)
  if (/^\s*- \[ \] /.test(line))
    return { color: '#e6faff' }
  // Regular list items
  if (/^\s*[-*+] /.test(line)) return { color: '#a8cce0' }
  // Blockquote
  if (/^\s*> /.test(line)) return { color: '#7fa8c0', fontStyle: 'italic' }
  // Code fence
  if (/^```/.test(line)) return { color: '#80d4e8', opacity: 0.7 }
  // Line that is pure italic / caption (e.g. "*Apr 16 · normal*")
  if (/^\*[^*]+\*\s*$/.test(line))
    return { color: '#80d4e8', fontStyle: 'italic' }
  // YAML frontmatter entry "key: value"
  if (/^\w[\w-]*:\s/.test(line))
    return { color: '#b8d4e8' }
  // Default body text
  return { color: '#d8ecf5' }
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <pre
      className="font-mono"
      style={{
        margin: 0,
        padding: '20px 22px',
        width: '100%',
        height: '100%',
        minHeight: 320,
        maxHeight: '60vh',
        overflow: 'auto',
        fontSize: '0.8rem',
        lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background:
          'linear-gradient(180deg, rgba(255,184,0,0.02), transparent 40%), #0a0f1c',
        color: '#d8ecf5',
      }}
    >
      {lines.map((line, i) => (
        <span key={i} style={lineStyle(line)}>
          {line}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}

interface ExportModalProps {
  open: boolean
  todo: Todo | null
  onClose: () => void
}

export function ExportModal({ open, todo, onClose }: ExportModalProps) {
  const [selectedId, setSelectedId] = useState<string>(EXPORT_TEMPLATES[0].id)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  useEffect(() => {
    if (open) {
      setSelectedId(EXPORT_TEMPLATES[0].id)
      setCopyStatus('idle')
    }
  }, [open])

  const template = useMemo(() => getTemplate(selectedId), [selectedId])
  const rendered = useMemo(() => {
    if (!todo || !template) return ''
    return template.render(todo)
  }, [todo, template])

  if (!open || !todo || !template || typeof document === 'undefined') return null

  const format = template.format

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 1500)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  const handleDownload = () => {
    const name = slugify(todo.title || 'untitled')
    const ext = format === 'md' ? 'md' : 'html'
    const mime = format === 'md' ? 'text/markdown' : 'text/html'
    const blob = new Blob([rendered], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9500,
        background: 'rgba(4,6,12,0.75)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative rounded-[3px] flex flex-col"
        style={{
          background: '#080c18',
          border: '1px solid rgba(255,184,0,0.25)',
          boxShadow:
            '0 0 40px rgba(255,184,0,0.08), 0 16px 48px rgba(0,0,0,0.7)',
          width: '92vw',
          maxWidth: 880,
          maxHeight: '90vh',
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-50 mb-1"
              style={{ color: '#ffb800' }}
            >
              export
            </p>
            <p
              className="font-mono text-[0.78rem] truncate"
              style={{ color: 'var(--rf-text)' }}
            >
              {todo.title || 'Untitled'}
            </p>
          </div>
          <span
            className="font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-1 rounded-[2px] shrink-0"
            style={{
              color: '#ffb800',
              border: '1px solid rgba(255,184,0,0.3)',
              background: 'rgba(255,184,0,0.05)',
            }}
          >
            .{format}
          </span>
        </div>

        {/* Template picker */}
        <div className="px-6 pb-3 flex flex-wrap gap-1.5">
          {EXPORT_TEMPLATES.map((tpl) => {
            const active = tpl.id === selectedId
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedId(tpl.id)}
                className="rf-btn text-left"
                style={
                  active
                    ? {
                        borderColor: '#ffb800',
                        color: '#ffb800',
                        background: 'rgba(255,184,0,0.08)',
                      }
                    : undefined
                }
                title={tpl.description}
              >
                {tpl.name.toLowerCase()}
                <span
                  className="ml-1 opacity-50"
                  style={{ fontSize: '0.75em' }}
                >
                  .{tpl.format}
                </span>
              </button>
            )
          })}
        </div>

        {/* Preview */}
        <div
          className="mx-6 mb-4 rounded-[2px] overflow-hidden"
          style={{
            border: '1px solid rgba(255,184,0,0.15)',
            flex: 1,
            minHeight: 320,
            background: '#000',
          }}
        >
          {format === 'html' ? (
            <iframe
              key={selectedId + todo.updatedAt}
              title="export preview"
              srcDoc={rendered}
              sandbox=""
              style={{
                width: '100%',
                height: '100%',
                minHeight: 320,
                border: 'none',
              }}
            />
          ) : (
            <MarkdownPreview content={rendered} />
          )}
        </div>

        {/* Footer / actions */}
        <div
          className="px-6 py-3 flex items-center justify-between gap-2"
          style={{ borderTop: '1px solid rgba(255,184,0,0.12)' }}
        >
          <p
            className="font-mono text-[9px] tracking-[0.12em] opacity-40"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            phase 1 · local only · backend link coming soon
          </p>
          <div className="flex gap-2">
            <button type="button" className="rf-btn" onClick={onClose}>
              [ cancel ]
            </button>
            <button type="button" className="rf-btn" onClick={handleCopy}>
              {copyStatus === 'copied'
                ? '[ copied ]'
                : `[ copy ${format} ]`}
            </button>
            <button
              type="button"
              className="rf-btn"
              onClick={handleDownload}
              style={{
                borderColor: '#ffb800',
                color: '#ffb800',
                background: 'rgba(255,184,0,0.06)',
              }}
            >
              [ download ]
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
