import type { ReactNode } from 'react'
import type { ExportFormat } from '#/features/todo/export/templates'
import { MarkdownPreview } from './MarkdownPreview'

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
}

export function PreviewFrame({
  contentKey,
  format,
  rendered,
  templateLabel,
  editorSlot,
  toolbarSlot,
  modified,
}: PreviewFrameProps) {
  return (
    <section
      className="flex-1 min-w-0 rounded-[2px] overflow-hidden flex flex-col"
      style={{
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
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[6px] h-[6px] rounded-full"
            style={{ background: '#ffb800', boxShadow: '0 0 6px #ffb800' }}
          />
          <span>preview</span>
          {templateLabel && (
            <span style={{ opacity: 0.5 }}>· {templateLabel}</span>
          )}
          {modified && (
            <span
              className="px-1.5 py-0.5 rounded-[2px]"
              style={{
                color: '#00f5ff',
                border: '1px solid rgba(0,245,255,0.35)',
                background: 'rgba(0,245,255,0.06)',
                fontSize: '8px',
              }}
            >
              · modified
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {toolbarSlot}
          <span style={{ opacity: 0.5 }}>
            {rendered.length.toLocaleString()} chars
          </span>
        </div>
      </div>

      {editorSlot}

      <div
        className="flex-1 min-h-0 relative"
        style={{ background: '#05070d' }}
      >
        {format === 'html' ? (
          <iframe
            key={contentKey}
            title="export preview"
            srcDoc={rendered}
            sandbox=""
            style={{
              width: '100%',
              height: '100%',
              minHeight: 520,
              border: 'none',
              display: 'block',
            }}
          />
        ) : (
          <MarkdownPreview content={rendered} />
        )}
      </div>
    </section>
  )
}
