import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useTodoStore } from '#/features/todo/store'
import { EXPORT_TEMPLATES, getTemplate } from '#/features/todo/export/templates'
import { slugify } from '#/features/todo/export/templates/_helpers'
import { getShareStrategy } from '#/lib/share'

type ShareSearch = {
  id?: string
}

export const Route = createFileRoute('/share')({
  validateSearch: (search: Record<string, unknown>): ShareSearch => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
  component: RouteComponent,
})

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
  if (/^\s*- \[ \] /.test(line)) return { color: '#e6faff' }
  if (/^\s*[-*+] /.test(line)) return { color: '#a8cce0' }
  if (/^\s*> /.test(line)) return { color: '#7fa8c0', fontStyle: 'italic' }
  if (/^```/.test(line)) return { color: '#80d4e8', opacity: 0.7 }
  if (/^\*[^*]+\*\s*$/.test(line))
    return { color: '#80d4e8', fontStyle: 'italic' }
  if (/^\w[\w-]*:\s/.test(line)) return { color: '#b8d4e8' }
  return { color: '#d8ecf5' }
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <pre
      className="font-mono"
      style={{
        margin: 0,
        padding: '24px 28px',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        fontSize: '0.82rem',
        lineHeight: 1.7,
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

function RouteComponent() {
  const { id } = Route.useSearch()
  const navigate = useNavigate()

  const todo = useTodoStore((s) =>
    id ? (s.todos.find((t) => t.id === id) ?? null) : null,
  )

  const [selectedId, setSelectedId] = useState<string>(EXPORT_TEMPLATES[0].id)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  // Share state
  const [shareStatus, setShareStatus] = useState<
    'idle' | 'sharing' | 'shared' | 'error'
  >('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [urlCopied, setUrlCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  // Check if sharing is available — initShareStrategy() is async and may not
  // have completed on first render, so re-check after mount.
  const [shareAvailable, setShareAvailable] = useState(false)
  useEffect(() => {
    try {
      setShareAvailable(getShareStrategy().isAvailable())
    } catch {
      setShareAvailable(false)
    }
  }, [])

  const template = useMemo(() => getTemplate(selectedId), [selectedId])
  const rendered = useMemo(() => {
    if (!todo || !template) return ''
    return template.render(todo)
  }, [todo, template])

  // Reset share panel when switching template
  useEffect(() => {
    setShareStatus('idle')
    setShareUrl(null)
    setUrlCopied(false)
    setShareError(null)
    setCopyStatus('idle')
  }, [selectedId])

  const handleBack = useCallback(() => {
    navigate({ to: '/' })
  }, [navigate])

  // Keyboard: Esc to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleBack])

  const handleCopy = useCallback(async () => {
    if (!rendered) return
    try {
      await navigator.clipboard.writeText(rendered)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 1500)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }, [rendered])

  const handleDownload = useCallback(() => {
    if (!todo || !template) return
    const name = slugify(todo.title || 'untitled')
    const ext = template.format === 'md' ? 'md' : 'html'
    const mime = template.format === 'md' ? 'text/markdown' : 'text/html'
    const blob = new Blob([rendered], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [todo, template, rendered])

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
      try {
        await navigator.clipboard.writeText(result.url)
        setUrlCopied(true)
        setTimeout(() => setUrlCopied(false), 2000)
      } catch {
        // Clipboard can fail on some browsers — that's fine
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

  // ── Missing-todo state ─────────────────────────────────────────────────────
  if (!id || !todo) {
    return (
      <main className="page-wrap px-4 py-16 flex flex-col items-center justify-center">
        <p
          className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2"
          style={{ color: '#ffb800', opacity: 0.6 }}
        >
          export
        </p>
        <p
          className="font-mono text-[0.85rem] mb-6"
          style={{ color: 'var(--rf-text-dim)' }}
        >
          {id ? 'todo not found' : 'no todo selected'}
        </p>
        <button type="button" className="rf-btn" onClick={handleBack}>
          [ back to canvas ]
        </button>
      </main>
    )
  }

  const format = template?.format ?? 'md'

  return (
    <main
      className="page-wrap px-4 py-6 flex flex-col gap-4"
      style={{ minHeight: 'calc(100vh - 120px)' }}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 pb-3">
        <div className="min-w-0">
          <p
            className="font-mono text-[9px] tracking-[0.22em] uppercase mb-1"
            style={{ color: '#ffb800', opacity: 0.6 }}
          >
            export
          </p>
          <p
            className="font-mono text-[0.85rem] truncate"
            style={{ color: 'var(--rf-text)' }}
          >
            {todo.title || 'Untitled'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-1 rounded-[2px]"
            style={{
              color: '#ffb800',
              border: '1px solid rgba(255,184,0,0.3)',
              background: 'rgba(255,184,0,0.05)',
            }}
          >
            .{format}
          </span>
          <button type="button" className="rf-btn" onClick={handleBack}>
            [ back ]
          </button>
        </div>
      </div>

      {/* ── Split layout: sidebar (templates + actions) | preview ───────── */}
      <div
        className="flex gap-4 flex-1 min-h-0"
        style={{ minHeight: 560 }}
      >
        {/* Sidebar */}
        <aside
          className="flex flex-col gap-4 shrink-0"
          style={{ width: 240 }}
        >
          {/* Template picker */}
          <div
            className="rounded-[2px] flex flex-col"
            style={{
              border: '1px solid rgba(255,184,0,0.15)',
              background: 'rgba(255,184,0,0.02)',
            }}
          >
            <div
              className="px-3 py-2 font-mono text-[9px] tracking-[0.2em] uppercase"
              style={{
                color: '#ffb800',
                opacity: 0.6,
                borderBottom: '1px solid rgba(255,184,0,0.12)',
              }}
            >
              templates
            </div>
            <div className="flex flex-col p-2 gap-1">
              {EXPORT_TEMPLATES.map((tpl) => {
                const active = tpl.id === selectedId
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedId(tpl.id)}
                    className="rf-btn text-left flex items-center justify-between"
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
                    <span>{tpl.name.toLowerCase()}</span>
                    <span
                      className="opacity-50"
                      style={{ fontSize: '0.7em' }}
                    >
                      .{tpl.format}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5">
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
              title={
                shareAvailable ? undefined : 'Requires backend connection'
              }
            >
              {shareStatus === 'sharing'
                ? '[ sharing... ]'
                : shareStatus === 'shared'
                  ? '[ re-share ]'
                  : '[ share ]'}
            </button>
          </div>

          {/* Share result */}
          {shareStatus === 'shared' && shareUrl && (
            <div
              className="rounded-[2px] flex flex-col gap-2"
              style={{
                padding: '10px 12px',
                background: 'rgba(0,245,255,0.04)',
                border: '1px solid rgba(0,245,255,0.2)',
              }}
            >
              <span
                className="font-mono text-[9px] tracking-[0.15em] uppercase"
                style={{ color: '#00f5ff', opacity: 0.6 }}
              >
                shared
              </span>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="font-mono text-[10px] bg-transparent outline-none"
                style={{ color: '#d8ecf5', border: 'none' }}
                onFocus={(e) => e.target.select()}
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="rf-btn flex-1"
                  onClick={handleCopyUrl}
                  style={{
                    borderColor: '#00f5ff',
                    color: '#00f5ff',
                    background: 'rgba(0,245,255,0.06)',
                  }}
                >
                  {urlCopied ? '[ copied ]' : '[ copy ]'}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rf-btn flex-1 text-center"
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
            </div>
          )}

          {/* Share error */}
          {shareStatus === 'error' && shareError && (
            <div
              className="rounded-[2px]"
              style={{
                padding: '8px 12px',
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

          {/* Help line */}
          <p
            className="font-mono text-[9px] tracking-[0.12em] opacity-40 mt-auto"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            {shareAvailable
              ? 'esc · back to canvas'
              : 'share requires backend'}
          </p>
        </aside>

        {/* Preview pane */}
        <section
          className="flex-1 min-w-0 rounded-[2px] overflow-hidden"
          style={{
            border: '1px solid rgba(255,184,0,0.15)',
            background: '#000',
          }}
        >
          {template && format === 'html' ? (
            <iframe
              key={selectedId + todo.updatedAt}
              title="export preview"
              srcDoc={rendered}
              sandbox=""
              style={{
                width: '100%',
                height: '100%',
                minHeight: 560,
                border: 'none',
              }}
            />
          ) : (
            <MarkdownPreview content={rendered} />
          )}
        </section>
      </div>
    </main>
  )
}
