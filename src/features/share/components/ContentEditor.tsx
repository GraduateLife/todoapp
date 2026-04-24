import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Attachment, Priority, SubTask } from '#/features/todo/types'
import { USER_PRIORITIES } from '#/features/todo/constants/priority'

const PRIORITY_HEX: Record<Priority, string> = {
  high: '#ff2d78',
  normal: '#ffb800',
  low: '#39ff14',
  idea: '#bf5fff',
  system: '#00f5ff',
}

const CYAN = '#00f5ff'
const PINK = '#ff2d78'

interface ContentEditorProps {
  title: string
  description: string
  priority: Priority
  subtasks: SubTask[]
  attachments: Attachment[]
  isModified: boolean
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onPriorityChange: (p: Priority) => void
  onSubtaskAdd: () => void
  onSubtaskUpdate: (
    id: string,
    patch: Partial<Pick<SubTask, 'title' | 'completed'>>,
  ) => void
  onSubtaskRemove: (id: string) => void
  onAttachmentsAdd: (files: FileList | File[]) => void
  onAttachmentRemove: (id: string) => void
  onReset: () => void
}

const LABEL_STYLE = {
  color: CYAN,
  opacity: 0.7,
} as const

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: CYAN,
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  disabled?: boolean
  danger?: boolean
}) {
  const color = danger ? PINK : CYAN
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 18,
        height: 18,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1,
        color,
        background: 'transparent',
        border: `1px solid ${color}55`,
        borderRadius: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.25 : 0.75,
        transition: 'opacity 120ms ease, background 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.background = `${color}14`
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        e.currentTarget.style.opacity = '0.75'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

function Caret({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        color: CYAN,
        fontSize: 11,
        lineHeight: 1,
        width: 11,
        display: 'inline-block',
        textAlign: 'center',
      }}
    >
      {open ? '▾' : '▸'}
    </span>
  )
}

function SectionHeader({
  label,
  count,
  open,
  onToggle,
  actions,
}: {
  label: string
  count?: number
  open: boolean
  onToggle: () => void
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '2px 0',
          cursor: 'pointer',
        }}
      >
        <Caret open={open} />
        <span style={SECTION_LABEL}>{label}</span>
        {typeof count === 'number' && (
          <span
            style={{
              ...SECTION_LABEL,
              opacity: 0.45,
              letterSpacing: '0.1em',
            }}
          >
            {count}
          </span>
        )}
      </button>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  )
}

function Collapsible({
  open,
  children,
}: {
  open: boolean
  children: React.ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ContentEditor({
  title,
  description,
  priority,
  subtasks,
  attachments,
  isModified,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onSubtaskAdd,
  onSubtaskUpdate,
  onSubtaskRemove,
  onAttachmentsAdd,
  onAttachmentRemove,
  onReset,
}: ContentEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [subtasksOpen, setSubtasksOpen] = useState(true)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(0,245,255,0.08)',
        borderTop: `1px solid ${CYAN}66`,
        borderBottom: `1px solid ${CYAN}66`,
      }}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4"
        style={{ height: 30 }}
      >
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="flex items-center gap-2"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Caret open={panelOpen} />
          <span style={SECTION_LABEL}>edit source</span>
          {isModified && (
            <span
              className="font-mono"
              style={{
                fontSize: 8,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '1px 6px',
                color: CYAN,
                border: `1px solid ${CYAN}59`,
                background: `${CYAN}10`,
                borderRadius: 2,
              }}
            >
              modified
            </span>
          )}
        </button>
        <IconBtn
          onClick={isModified ? onReset : undefined}
          disabled={!isModified}
          title="Reset to original"
        >
          ↺
        </IconBtn>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <Collapsible open={panelOpen}>
        <div className="flex flex-col gap-2 px-4 pt-1 pb-3">
          {/* Title */}
          <label className="flex flex-col gap-1">
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={LABEL_STYLE}
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

          {/* Description */}
          <label className="flex flex-col gap-1">
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={LABEL_STYLE}
            >
              description
            </span>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="(empty)"
              rows={2}
              className="rf-edit-field resize-y"
              style={{
                fontSize: '0.78rem',
                lineHeight: 1.5,
                minHeight: 48,
                maxHeight: 160,
              }}
            />
          </label>

          {/* Priority — always visible, compact dots */}
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[9px] tracking-[0.2em] uppercase shrink-0"
              style={LABEL_STYLE}
            >
              priority
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {USER_PRIORITIES.map((p) => {
                const active = p === priority
                const hex = PRIORITY_HEX[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPriorityChange(p)}
                    className="flex items-center gap-1.5"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '2px 0',
                      cursor: 'pointer',
                      opacity: active ? 1 : 0.45,
                      transition: 'opacity 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.opacity = '0.75'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.opacity = '0.45'
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: active ? hex : 'transparent',
                        border: `1px solid ${hex}`,
                        boxShadow: active ? `0 0 4px ${hex}88` : 'none',
                      }}
                    />
                    <span
                      className="font-mono uppercase"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.18em',
                        color: active ? hex : 'var(--rf-text-dim)',
                      }}
                    >
                      {p}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subtasks — accordion */}
          <div className="flex flex-col gap-1">
            <SectionHeader
              label="subtasks"
              count={subtasks.length}
              open={subtasksOpen}
              onToggle={() => setSubtasksOpen((v) => !v)}
              actions={
                <IconBtn
                  onClick={() => {
                    setSubtasksOpen(true)
                    onSubtaskAdd()
                  }}
                  title="Add subtask"
                >
                  +
                </IconBtn>
              }
            />
            <Collapsible open={subtasksOpen}>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {subtasks.length === 0 ? (
                  <p
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--rf-text-dim)',
                      opacity: 0.5,
                      padding: '2px 0 4px',
                    }}
                  >
                    no subtasks
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1 pt-1">
                    {subtasks.map((st) => (
                      <li key={st.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={(e) =>
                            onSubtaskUpdate(st.id, { completed: e.target.checked })
                          }
                          style={{ cursor: 'pointer', accentColor: CYAN }}
                        />
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) =>
                            onSubtaskUpdate(st.id, { title: e.target.value })
                          }
                          placeholder="subtask…"
                          className="rf-edit-field flex-1"
                          style={{
                            fontSize: '0.76rem',
                            textDecoration: st.completed ? 'line-through' : 'none',
                            opacity: st.completed ? 0.55 : 1,
                          }}
                        />
                        <IconBtn
                          danger
                          onClick={() => onSubtaskRemove(st.id)}
                          title="Remove"
                        >
                          ×
                        </IconBtn>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Collapsible>
          </div>

          {/* Attachments — accordion */}
          <div className="flex flex-col gap-1">
            <SectionHeader
              label="attachments"
              count={attachments.length}
              open={attachmentsOpen}
              onToggle={() => setAttachmentsOpen((v) => !v)}
              actions={
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files) onAttachmentsAdd(e.target.files)
                      e.target.value = ''
                    }}
                  />
                  <IconBtn
                    onClick={() => {
                      setAttachmentsOpen(true)
                      fileInputRef.current?.click()
                    }}
                    title="Upload files"
                  >
                    ↑
                  </IconBtn>
                </>
              }
            />
            <Collapsible open={attachmentsOpen}>
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {attachments.length === 0 ? (
                  <p
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--rf-text-dim)',
                      opacity: 0.5,
                      padding: '2px 0 4px',
                    }}
                  >
                    no attachments
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1 pt-1">
                    {attachments.map((att) => (
                      <li
                        key={att.id}
                        className="flex items-center gap-2"
                        style={{
                          padding: '3px 6px',
                          border: `1px solid ${CYAN}33`,
                          borderRadius: 2,
                          background: `${CYAN}08`,
                        }}
                      >
                        {att.type === 'image' ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            style={{
                              width: 22,
                              height: 22,
                              objectFit: 'cover',
                              borderRadius: 2,
                            }}
                          />
                        ) : (
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 11,
                              width: 22,
                              height: 22,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: CYAN,
                              border: `1px solid ${CYAN}4d`,
                              borderRadius: 2,
                            }}
                          >
                            {att.type === 'voice'
                              ? '♫'
                              : att.type === 'video'
                              ? '▶'
                              : '·'}
                          </span>
                        )}
                        <span
                          className="font-mono flex-1 truncate"
                          style={{
                            fontSize: 11,
                            color: 'var(--rf-text-dim)',
                          }}
                          title={att.name}
                        >
                          {att.name}
                        </span>
                        <span
                          className="font-mono uppercase"
                          style={{
                            fontSize: 9,
                            letterSpacing: '0.15em',
                            color: `${CYAN}80`,
                          }}
                        >
                          {att.type}
                        </span>
                        <IconBtn
                          danger
                          onClick={() => onAttachmentRemove(att.id)}
                          title="Remove"
                        >
                          ×
                        </IconBtn>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Collapsible>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}
