interface ContentEditorProps {
  title: string
  description: string
  isModified: boolean
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onReset: () => void
}

export function ContentEditor({
  title,
  description,
  isModified,
  onTitleChange,
  onDescriptionChange,
  onReset,
}: ContentEditorProps) {
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3 shrink-0"
      style={{
        background: 'rgba(0,245,255,0.08)',
        borderTop: '1px solid rgba(0,245,255,0.4)',
        borderBottom: '1px solid rgba(0,245,255,0.4)',
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
          className="rf-edit-field"
          style={{ fontSize: '0.82rem' }}
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
          className="rf-edit-field resize-y"
          style={{
            fontSize: '0.78rem',
            lineHeight: 1.5,
            minHeight: 60,
            maxHeight: 200,
          }}
        />
      </label>
    </div>
  )
}
