import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { imeGuard } from '@/lib/utils'
import { useFolderStore } from '../../store'
import { COLOR_OPTIONS } from '../../constants/noteColors'
import type { Folder, NoteColor } from '../../types'

const COLOR_VAR: Record<string, string> = {
  cyan: 'var(--rf-cyan)',
  pink: 'var(--rf-pink)',
  amber: 'var(--rf-amber)',
  green: 'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

interface FolderPickerModalProps {
  open: boolean
  onConfirm: (folderId: string) => void
  onCancel: () => void
}

export function FolderPickerModal({
  open,
  onConfirm,
  onCancel,
}: FolderPickerModalProps) {
  const folders = useFolderStore((s) => s.folders)
  const createFolder = useFolderStore((s) => s.createFolder)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedColor, setSelectedColor] = useState<NoteColor>('purple')

  useEffect(() => {
    if (open) {
      setIsCreating(false)
      setNewName('')
      setSelectedColor('purple')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open || typeof document === 'undefined') return null

  const handleCreateConfirm = () => {
    const name = newName.trim()
    if (!name) return
    const folder = createFolder(name, selectedColor)
    onConfirm(folder.id)
  }

  // The accent color for the "create" UI (changes with picker selection)
  const accentVar = COLOR_VAR[selectedColor] ?? 'var(--rf-purple)'

  // Color options — exclude 'random' since folders need a fixed color
  const folderColors = COLOR_OPTIONS.filter((o) => o.key !== 'random') as Array<{
    key: NoteColor
    label: string
    hex: string
  }>

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9500,
        background: 'rgba(4,6,12,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="relative rounded-[3px] p-6"
        style={{
          background: 'var(--rf-bg-2)',
          border: `1px solid rgba(var(--rf-purple-rgb, 191,95,255),0.25)`,
          borderColor: `color-mix(in srgb, ${accentVar} 30%, transparent)`,
          boxShadow: `0 0 40px color-mix(in srgb, ${accentVar} 10%, transparent), 0 16px 48px rgba(0,0,0,0.5)`,
          minWidth: 300,
          maxWidth: 400,
          width: '90vw',
        }}
      >
        {/* Header */}
        <p
          className="font-mono text-[9px] tracking-[0.2em] uppercase mb-4"
          style={{ color: 'var(--rf-text-dim)', opacity: 0.7 }}
        >
          move to folder
        </p>

        {/* Existing folders */}
        {folders.length > 0 && (
          <div className="flex flex-col gap-1 mb-4">
            {folders.map((folder: Folder) => {
              const fc = COLOR_VAR[folder.color] ?? 'var(--rf-purple)'
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => onConfirm(folder.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[2px] text-left transition-all"
                  style={{
                    border: `1px solid color-mix(in srgb, ${fc} 18%, transparent)`,
                    background: `color-mix(in srgb, ${fc} 5%, transparent)`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `color-mix(in srgb, ${fc} 12%, transparent)`
                    e.currentTarget.style.borderColor = `color-mix(in srgb, ${fc} 35%, transparent)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `color-mix(in srgb, ${fc} 5%, transparent)`
                    e.currentTarget.style.borderColor = `color-mix(in srgb, ${fc} 18%, transparent)`
                  }}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-[1px] flex-shrink-0"
                    style={{ background: fc, opacity: 0.85 }}
                  />
                  <span
                    className="font-mono text-[0.78rem]"
                    style={{ color: 'var(--rf-text)' }}
                  >
                    {folder.name}
                  </span>
                  <span
                    className="ml-auto font-mono text-[8px] opacity-35"
                    style={{ color: 'var(--rf-text-dim)' }}
                  >
                    open →
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Create new folder */}
        {!isCreating ? (
          <button
            type="button"
            className="rf-btn w-full"
            onClick={() => setIsCreating(true)}
          >
            [ + new folder ]
          </button>
        ) : (
          <div>
            {/* Name input row */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="font-mono text-[0.9rem]"
                style={{ color: accentVar }}
              >
                ›
              </span>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={imeGuard((e) => {
                  if (e.key === 'Enter') handleCreateConfirm()
                  if (e.key === 'Escape') setIsCreating(false)
                })}
                placeholder="folder name..."
                className="flex-1 font-mono text-[0.88rem] bg-transparent outline-none"
                style={{
                  color: 'var(--rf-text)',
                  caretColor: accentVar,
                  borderBottom: `1px solid color-mix(in srgb, ${accentVar} 35%, transparent)`,
                  paddingBottom: 2,
                }}
              />
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-1 mb-4 pl-5">
              {folderColors.map((opt) => {
                const isSelected = selectedColor === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.key}
                    onClick={() => setSelectedColor(opt.key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: 6,
                        height: 6,
                        borderRadius: 1,
                        background: opt.hex,
                        opacity: isSelected ? 1 : 0.2,
                        boxShadow: isSelected ? `0 0 4px 1px ${opt.hex}` : 'none',
                        transition: 'opacity 150ms, box-shadow 150ms',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: isSelected ? opt.hex : 'var(--rf-text-dim)',
                        opacity: isSelected ? 1 : 0.35,
                        transition: 'opacity 150ms, color 150ms',
                        lineHeight: 1,
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                className="rf-btn flex-1"
                onClick={() => setIsCreating(false)}
              >
                [ cancel ]
              </button>
              <button
                type="button"
                className="rf-btn flex-1"
                onClick={handleCreateConfirm}
                style={{ borderColor: accentVar, color: accentVar }}
              >
                [ create ]
              </button>
            </div>
          </div>
        )}

        {/* Cancel — only when not in create mode */}
        {!isCreating && (
          <button
            type="button"
            className="rf-btn w-full mt-2"
            onClick={onCancel}
          >
            [ cancel ]
          </button>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
