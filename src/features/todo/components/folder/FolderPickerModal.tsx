import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { useFolderStore } from '../../store'
import type { Folder } from '../../types'

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

  useEffect(() => {
    if (open) {
      setIsCreating(false)
      setNewName('')
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
    const folder = createFolder(name)
    onConfirm(folder.id)
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
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="relative rounded-[3px] p-6"
        style={{
          background: '#080c18',
          border: '1px solid rgba(191,95,255,0.25)',
          boxShadow:
            '0 0 40px rgba(191,95,255,0.08), 0 16px 48px rgba(0,0,0,0.7)',
          minWidth: 300,
          maxWidth: 380,
        }}
      >
        {/* Header */}
        <p
          className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-50 mb-4"
          style={{ color: 'var(--rf-purple)' }}
        >
          move to folder
        </p>

        {/* Existing folders */}
        {folders.length > 0 && (
          <div className="flex flex-col gap-1 mb-4">
            {folders.map((folder: Folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onConfirm(folder.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-[2px] text-left transition-all"
                style={{
                  border: '1px solid rgba(191,95,255,0.12)',
                  background: 'rgba(191,95,255,0.03)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(191,95,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(191,95,255,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(191,95,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(191,95,255,0.12)'
                }}
              >
                <span
                  className="font-mono text-[10px]"
                  style={{
                    color: COLOR_VAR[folder.color] ?? 'var(--rf-purple)',
                  }}
                >
                  ▣
                </span>
                <span
                  className="font-mono text-[0.78rem]"
                  style={{ color: 'var(--rf-text)' }}
                >
                  {folder.name}
                </span>
                <span
                  className="ml-auto font-mono text-[8px] opacity-40"
                  style={{ color: 'var(--rf-text-dim)' }}
                >
                  open →
                </span>
              </button>
            ))}
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
            <div className="flex items-center gap-2 mb-3">
              <span
                className="font-mono text-[0.9rem]"
                style={{ color: 'var(--rf-purple)' }}
              >
                ›
              </span>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateConfirm()
                  if (e.key === 'Escape') setIsCreating(false)
                }}
                placeholder="folder name..."
                className="rf-input-field flex-1"
                style={{
                  borderBottom: '1px solid rgba(191,95,255,0.3)',
                  paddingBottom: 2,
                }}
              />
            </div>
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
                style={{
                  borderColor: 'var(--rf-purple)',
                  color: 'var(--rf-purple)',
                }}
              >
                [ create ]
              </button>
            </div>
          </div>
        )}

        {/* Cancel */}
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
