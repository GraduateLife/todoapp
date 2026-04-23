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
      ></div>

      {editorSlot}

      <div
        className="flex-1 min-h-0 preview-frame-body rf-scrollbar"
        style={{
          background: '#05070d',
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div className="preview-frame-content" style={{ width: '100%', height: '100%' }}>
          {format === 'html' ? (
            <iframe
              key={contentKey}
              title="export preview"
              srcDoc={rendered}
              sandbox=""
              scrolling="no"
              style={{
                width: '100%',
                height: '100%',
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
