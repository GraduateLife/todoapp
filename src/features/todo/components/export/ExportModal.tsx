import { createPortal } from 'react-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CSSProperties } from 'react'
import type { Todo } from '../../types'
import { EXPORT_TEMPLATES, getTemplate } from '../../export/templates'
import { slugify } from '../../export/templates/_helpers'
import { getShareStrategy } from '../../../../lib/share'

// ─── Markdown preview with lightweight syntax highlighting ──────────────────

function lineStyle(line: string): CSSProperties {
  if (/^---\s*$/.test(line)) return { color: '#ffb800', opacity: 0.55 }
  if (/^###### /.test(line)) return { color: '#ffd580' }
  if (/^##### /.test(line)) return { color: '#ffd580' }
  if (/^#### /.test(line)) return { color: '#ffd580' }
  if (/^### /.test(line)) return { color: '#ffcc66', fontWeight: 500 }
  if (/^## /.test(line)) return { color: '#ffb840', fontWeight: 600 }
  if (/^# /.test(line)) return { color: '#ffb800', fontWeight: 700 }
  if (/^\s*- \[x\] /i.test(line))
    return {
      color: 'rgba(200,220,235,0.5)',
      textDecoration: 'line-through',
    }
  if (/^\s*- \[ \] /.test(line))
    return { color: '#e6faff' }
  if (/^\s*[-*+] /.test(line)) return { color: '#a8cce0' }
  if (/^\s*> /.test(line)) return { color: '#7fa8c0', fontStyle: 'italic' }
  if (/^```/.test(line)) return { color: '#80d4e8', opacity: 0.7 }
  if (/^\*[^*]+\*\s*$/.test(line))
    return { color: '#80d4e8', fontStyle: 'italic' }
  if (/^\w[\w-]*:\s/.test(line))
    return { color: '#b8d4e8' }
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

// ─── Share result panel ─────────────────────────────────────────────────────

function ShareResultPanel({
  url,
  onCopyUrl,
  urlCopied,
}: {
  url: string
  onCopyUrl: () => void
  urlCopied: boolean
}) {
  return (
    <div
      className="mx-6 mb-3 rounded-[2px] flex items-center gap-3"
      style={{
        padding: '10px 14px',
        background: 'rgba(0,245,255,0.04)',
        border: '1px solid rgba(0,245,255,0.2)',
      }}
    >
      <span
        className="font-mono text-[9px] tracking-[0.15em] uppercase shrink-0"
        style={{ color: '#00f5ff', opacity: 0.6 }}
      >
        shared
      </span>
      <input
        type="text"
        readOnly
        value={url}
        className="font-mono text-[11px] flex-1 min-w-0 bg-transparent outline-none"
        style={{ color: '#d8ecf5', border: 'none' }}
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        className="rf-btn shrink-0"
        onClick={onCopyUrl}
        style={{
          borderColor: '#00f5ff',
          color: '#00f5ff',
          background: 'rgba(0,245,255,0.06)',
        }}
      >
        {urlCopied ? '[ copied ]' : '[ copy url ]'}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rf-btn shrink-0"
        style={{
          borderColor: '#00f5ff',
          color: '#00f5ff',
          background: 'rgba(0,245,255,0.06)',
          textDecoration: 'none',
        }}
      >
        [ open ]
      </a>
    </div>
  )
}

// ─── Export Modal ────────────────────────────────────────────────────────────

interface ExportModalProps {
  open: boolean
  todo: Todo | null
  onClose: () => void
}

export function ExportModal({ open, todo, onClose }: ExportModalProps) {
  const [selectedId, setSelectedId] = useState<string>(EXPORT_TEMPLATES[0].id)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  // Share state
  const [shareStatus, setShareStatus] = useState<
    'idle' | 'sharing' | 'shared' | 'error'
  >('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  // Check if sharing is available — re-evaluate each time the modal opens
  // because initShareStrategy() is async and may not have completed on first
  // render.
  const [shareAvailable, setShareAvailable] = useState(false)
  useEffect(() => {
    if (!open) return
    try {
      setShareAvailable(getShareStrategy().isAvailable())
    } catch {
      setShareAvailable(false)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setSelectedId(EXPORT_TEMPLATES[0].id)
      setCopyStatus('idle')
      setShareStatus('idle')
      setShareUrl(null)
      setUrlCopied(false)
      setShareError(null)
    }
  }, [open])

  const template = useMemo(() => getTemplate(selectedId), [selectedId])
  const rendered = useMemo(() => {
    if (!todo || !template) return ''
    return template.render(todo)
  }, [todo, template])

  const handleShare = useCallback(async () => {
    if (!todo || !template) return
    setShareStatus('sharing')
    setShareError(null)
    try {
      const result = await getShareStrategy().publish({
        title: todo.title || 'Untitled',
        format: template.format,
        content: rendered,
      })
      setShareUrl(result.url)
      setShareStatus('shared')
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(result.url)
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
      } catch {
        // Clipboard might fail on some browsers, that's ok
      }
    } catch (err) {
      console.error('[share] failed', err)
      setShareError(err instanceof Error ? err.message : 'Share failed')
      setShareStatus('error')
    }
  }, [todo, template, rendered])

  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (err) {
      console.error('Copy URL failed', err)
    }
  }, [shareUrl])

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

        {/* Share result panel — shown after successful share */}
        {shareStatus === 'shared' && shareUrl && (
          <ShareResultPanel
            url={shareUrl}
            onCopyUrl={handleCopyUrl}
            urlCopied={urlCopied}
          />
        )}

        {/* Share error */}
        {shareStatus === 'error' && shareError && (
          <div
            className="mx-6 mb-3 rounded-[2px]"
            style={{
              padding: '8px 14px',
              background: 'rgba(255,48,48,0.06)',
              border: '1px solid rgba(255,48,48,0.25)',
            }}
          >
            <p
              className="font-mono text-[10px]"
              style={{ color: '#ff6060' }}
            >
              share failed: {shareError}
            </p>
          </div>
        )}

        {/* Footer / actions */}
        <div
          className="px-6 py-3 flex items-center justify-between gap-2"
          style={{ borderTop: '1px solid rgba(255,184,0,0.12)' }}
        >
          <p
            className="font-mono text-[9px] tracking-[0.12em] opacity-40"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            {shareAvailable
              ? 'export · download · share'
              : 'export · download · share requires backend'}
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
            <button
              type="button"
              className="rf-btn"
              onClick={handleShare}
              disabled={!shareAvailable || shareStatus === 'sharing'}
              style={
                shareAvailable
                  ? {
                      borderColor: '#00f5ff',
                      color: '#00f5ff',
                      background: 'rgba(0,245,255,0.06)',
                      opacity: shareStatus === 'sharing' ? 0.5 : 1,
                    }
                  : { opacity: 0.25, cursor: 'not-allowed' }
              }
              title={shareAvailable ? undefined : 'Requires backend connection'}
            >
              {shareStatus === 'sharing'
                ? '[ sharing... ]'
                : shareStatus === 'shared'
                  ? '[ re-share ]'
                  : '[ share ]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
