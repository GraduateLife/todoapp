interface ContentEditorProps {
  title: string
  description: string
  isModified: boolean
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onReset: () => void
  onClose: () => void
}

export function ContentEditor({
  title,
  description,
  isModified,
  onTitleChange,
  onDescriptionChange,
  onReset,
  onClose,
}: ContentEditorProps) {
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3 shrink-0"
      style={{
        background: 'rgba(0,245,255,0.04)',
        borderTop: '1px solid rgba(0,245,255,0.2)',
        borderBottom: '1px solid rgba(0,245,255,0.25)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[9px] tracking-[0.2em] uppercase"
            style={{ color: '#00f5ff' }}
          >
            edit source
          </span>
          {isModified && (
            <span
              className="font-mono text-[8px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-[2px]"
              style={{
                color: '#00f5ff',
                border: '1px solid rgba(0,245,255,0.35)',
                background: 'rgba(0,245,255,0.06)',
              }}
            >
              · modified
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="rf-btn"
            onClick={onReset}
            disabled={!isModified}
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              opacity: isModified ? 1 : 0.3,
              cursor: isModified ? 'pointer' : 'not-allowed',
            }}
          >
            [ reset ]
          </button>
          <button
            type="button"
            className="rf-btn"
            onClick={onClose}
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
          >
            [ close ]
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span
          className="font-mono text-[9px] tracking-[0.2em] uppercase"
          style={{ color: '#00f5ff', opacity: 0.7 }}
        >
          title
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="untitled"
          className="font-mono outline-none rounded-[2px] px-2 py-1.5"
          style={{
            color: '#e6faff',
            fontSize: '0.82rem',
            border: '1px solid rgba(0,245,255,0.35)',
            background: 'rgba(255,255,255,0.04)',
          }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span
          className="font-mono text-[9px] tracking-[0.2em] uppercase"
          style={{ color: '#00f5ff', opacity: 0.7 }}
        >
          description
        </span>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="(empty)"
          rows={3}
          className="font-mono outline-none rounded-[2px] px-2 py-1.5 resize-y"
          style={{
            color: '#e6faff',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            border: '1px solid rgba(0,245,255,0.35)',
            background: 'rgba(255,255,255,0.04)',
            minHeight: 60,
            maxHeight: 200,
          }}
        />
      </label>
    </div>
  )
}
