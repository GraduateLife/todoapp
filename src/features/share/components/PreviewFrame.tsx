import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ExportFormat } from '#/features/todo/export/templates'
import { MarkdownPreview } from './MarkdownPreview'

const IFRAME_MIN_HEIGHT = 360

function useIframeContentHeight(contentKey: string) {
  const ref = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState(IFRAME_MIN_HEIGHT)

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return
    let observer: ResizeObserver | null = null

    // Force <html>/<body> to size to their children, otherwise templates that
    // use `100vh` / `min-height:100%` create a feedback loop: iframe grows →
    // body grows to match → scrollHeight grows → iframe grows again.
    const applyReset = (doc: Document) => {
      const id = '__rf-preview-reset'
      if (doc.getElementById(id)) return
      const style = doc.createElement('style')
      style.id = id
      style.textContent =
        'html,body{height:auto!important;min-height:0!important;margin:0;}'
      doc.head.appendChild(style)
    }

    const measure = () => {
      const doc = iframe.contentDocument
      if (!doc?.body) return
      // Use body.scrollHeight only — documentElement.scrollHeight reflects the
      // iframe's own current height in some browsers, which feeds back.
      const next = Math.max(doc.body.scrollHeight, IFRAME_MIN_HEIGHT)
      setHeight((prev) => (Math.abs(prev - next) < 2 ? prev : next))
    }

    const onLoad = () => {
      const doc = iframe.contentDocument
      if (!doc) return
      applyReset(doc)
      measure()
      observer = new ResizeObserver(() => measure())
      observer.observe(doc.body)
    }

    iframe.addEventListener('load', onLoad)
    if (iframe.contentDocument?.readyState === 'complete') onLoad()

    return () => {
      iframe.removeEventListener('load', onLoad)
      observer?.disconnect()
    }
  }, [contentKey])

  return { ref, height }
}

interface PreviewFrameProps {
  /** Unique key used to force-reset the iframe when source changes */
  contentKey: string
  format: ExportFormat
  rendered: string
  templateLabel?: string
  /** Rendered between the chrome bar and the preview body — e.g. the content editor */
  editorSlot?: ReactNode
  /** Rendered on the right side of the chrome bar, before the char count */
  toolbarSlot?: ReactNode
  /** Small badge shown next to "preview" when source has been edited */
  modified?: boolean
  /** Whether the editor panel is currently collapsed (controls yellow light). */
  editorCollapsed?: boolean
  /** Toggle the editor panel. When provided, a yellow mac-style light appears. */
  onToggleEditor?: () => void
}

export function PreviewFrame({
  contentKey,
  format,
  rendered,
  templateLabel,
  editorSlot,
  toolbarSlot,
  modified,
  editorCollapsed,
  onToggleEditor,
}: PreviewFrameProps) {
  const { ref: iframeRef, height: iframeHeight } =
    useIframeContentHeight(contentKey)

  const handleMaximize = () => {
    if (!rendered) return
    const mime = format === 'html' ? 'text/html' : 'text/plain;charset=utf-8'
    const blob = new Blob([rendered], { type: mime })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <section
      className="min-w-0 shrink-0 rounded-[2px] overflow-hidden flex flex-col"
      style={{
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(255,184,0,0.35)',
        background: '#0a0f1c',
        boxShadow: '0 0 24px rgba(255,184,0,0.04)',
      }}
    >
      <div
        className="px-3 py-2 font-mono text-[9px] tracking-[0.2em] uppercase flex items-center justify-between shrink-0"
        style={{
          color: '#ffb800',
          borderBottom: '1px solid rgba(255,184,0,0.2)',
          background: 'rgba(255,184,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleMaximize}
            title="open in new tab"
            aria-label="maximize preview"
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#1a6b2a',
              border: '1px solid rgba(40,180,64,0.3)',
              padding: 0,
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 0 4px rgba(40,180,64,0.2)',
            }}
          />
          {onToggleEditor && (
            <button
              type="button"
              onClick={onToggleEditor}
              title={editorCollapsed ? 'expand editor' : 'collapse editor'}
              aria-label={editorCollapsed ? 'expand editor' : 'collapse editor'}
              aria-pressed={editorCollapsed}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: editorCollapsed ? '#5c4a14' : '#a6791f',
                border: '1px solid rgba(255,184,0,0.45)',
                padding: 0,
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
                boxShadow: editorCollapsed
                  ? 'none'
                  : '0 0 4px rgba(255,184,0,0.3)',
              }}
            />
          )}
        </div>
      </div>

      {editorSlot}

      <div
        className="preview-frame-body"
        style={{
          background: '#05070d',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div className="preview-frame-content" style={{ width: '100%' }}>
          {format === 'html' ? (
            <iframe
              ref={iframeRef}
              key={contentKey}
              title="export preview"
              srcDoc={rendered}
              sandbox="allow-same-origin"
              scrolling="no"
              style={{
                width: '100%',
                height: iframeHeight,
                border: 'none',
                display: 'block',
              }}
            />
          ) : (
            <MarkdownPreview content={rendered} />
          )}
        </div>
      </div>
    </section>
  )
}
