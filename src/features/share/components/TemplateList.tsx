import type { ExportTemplate } from '#/features/todo/export/templates'
import { slugify } from '#/features/todo/export/templates/_helpers'

interface TemplateListProps {
  templates: ExportTemplate[]
  selectedId: string
  onSelect: (id: string) => void
  disabled?: boolean
  /** The title used to generate the per-template filename (e.g. "abc" → "abc.html") */
  fileBaseTitle: string
}

export function TemplateList({
  templates,
  selectedId,
  onSelect,
  disabled = false,
  fileBaseTitle,
}: TemplateListProps) {
  const base = slugify(fileBaseTitle || 'untitled')

  return (
    <div
      className="rounded-[2px] flex flex-col"
      style={{
        border: '1px solid rgba(255,184,0,0.35)',
        background: 'rgba(255,184,0,0.03)',
      }}
    >
      <div
        className="px-3 py-2 font-mono text-[9px] tracking-[0.2em] uppercase flex items-center justify-between"
        style={{
          color: '#ffb800',
          borderBottom: '1px solid rgba(255,184,0,0.2)',
          background: 'rgba(255,184,0,0.05)',
        }}
      >
        <span>files</span>
        <span style={{ opacity: 0.5 }}>
          {templates.length.toString().padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-col p-1.5 gap-0.5">
        {templates.map((tpl) => {
          const active = tpl.id === selectedId
          const filename = `${base}.${tpl.format}`
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              disabled={disabled}
              className="relative text-left px-2.5 py-2 font-mono rounded-[2px] transition-colors flex items-center justify-between gap-2"
              style={{
                background: active ? 'rgba(255,184,0,0.08)' : 'transparent',
                color: active ? '#ffe8a8' : 'var(--rf-text)',
                border: active
                  ? '1px solid rgba(255,184,0,0.35)'
                  : '1px solid transparent',
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
              title={tpl.description}
            >
              {active && (
                <span
                  aria-hidden
                  style={{
                    // position: 'absolute',
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 2,
                    background: '#ffb800',
                    boxShadow: '0 0 6px rgba(255,184,0,0.6)',
                  }}
                />
              )}
              <span
                className="truncate text-[0.78rem]"
                style={{ letterSpacing: '0.02em' }}
              >
                {filename}
              </span>
              <span
                className="shrink-0 px-1.5 py-0.5 rounded-[2px] text-[8px] tracking-[0.18em] uppercase"
                style={{
                  color: active ? '#ffb800' : 'var(--rf-text-dim)',
                  border: `1px solid ${
                    active ? 'rgba(255,184,0,0.4)' : 'rgba(200,220,235,0.15)'
                  }`,
                  background: active
                    ? 'rgba(255,184,0,0.06)'
                    : 'rgba(200,220,235,0.03)',
                }}
              >
                {tpl.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
