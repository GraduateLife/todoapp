import { useState } from 'react'
import { useFolderStore } from '../../store'
import { useTodoStore } from '../../store'
// import { ArchivePanel } from '../archive/ArchivePanel'
import { ARCHIVE_FOLDER_ID } from '../../store/folderStore'

const COLOR_VAR: Record<string, string> = {
  cyan: 'var(--rf-cyan)',
  pink: 'var(--rf-pink)',
  amber: 'var(--rf-amber)',
  green: 'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

const COLOR_RGB: Record<string, string> = {
  cyan: '0,245,255',
  pink: '255,45,120',
  amber: '255,184,0',
  green: '57,255,20',
  purple: '191,95,255',
}

// ─── Archive marker (gray, top-left) ──────────────────────────────────────────
function ArchiveFolderMarker() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const archivedCount = useTodoStore(
    (s) => s.todos.filter((t) => t.archived).length,
  )

  const GRAY = 'rgba(140,150,160,0.7)'
  const GRAY_DIM = 'rgba(140,150,160,0.25)'
  const borderColor = hovered ? GRAY : GRAY_DIM
  const bg = hovered ? 'rgba(140,150,160,0.09)' : 'rgba(140,150,160,0.04)'

  return (
    <>
      <div
        style={{ position: 'fixed', top: 12, left: 0, zIndex: 200 }}
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 8,
            paddingRight: 10,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: '0 3px 3px 0',
            background: bg,
            borderTop: `1px solid ${borderColor}`,
            borderRight: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            borderLeft: 'none',
            cursor: 'pointer',
            transition: 'all 180ms ease',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 1,
              flexShrink: 0,
              background: hovered ? GRAY : 'rgba(140,150,160,0.4)',
              transition: 'background 180ms',
            }}
          />
          <span
            style={{
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 9,
              letterSpacing: '0.1em',
              color: GRAY,
              opacity: hovered ? 0.9 : 0.6,
              whiteSpace: 'nowrap',
              transition: 'opacity 180ms',
            }}
          >
            archive
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 8,
              color: GRAY,
              opacity: 0.3,
            }}
          >
            ·
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 9,
              letterSpacing: '0.08em',
              color: GRAY,
              opacity: 0.65,
            }}
          >
            {archivedCount}
          </span>
        </div>
      </div>
      {/* <ArchivePanel open={open} onClose={() => setOpen(false)} /> */}
    </>
  )
}

// ─── FolderMarkers ────────────────────────────────────────────────────────────
export function FolderMarkers() {
  const folders = useFolderStore((s) => s.folders)
  const openFolder = useFolderStore((s) => s.openFolder)
  const closeFolder = useFolderStore((s) => s.closeFolder)
  const todos = useTodoStore((s) => s.todos)

  const regularFolders = folders.filter((f) => f.id !== ARCHIVE_FOLDER_ID)

  return (
    <>
      {/* Archive marker — always at top-left */}
      <ArchiveFolderMarker />

      {/* Regular folder markers — vertically centered on left edge */}
      {regularFolders.length > 0 && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none"
          style={{ zIndex: 200 }}
        >
          {regularFolders.map((folder) => {
            const count = todos.filter(
              (t) => t.folderId === folder.id && !t.archived,
            ).length
            const color = COLOR_VAR[folder.color] ?? 'var(--rf-purple)'
            const rgb = COLOR_RGB[folder.color] ?? '191,95,255'
            const bg = folder.isOpen ? `rgba(${rgb},0.12)` : `rgba(${rgb},0.05)`
            const borderColor = folder.isOpen ? color : `rgba(${rgb},0.22)`

            return (
              <div
                key={folder.id}
                className="pointer-events-auto"
                onClick={() =>
                  folder.isOpen ? closeFolder(folder.id) : openFolder(folder.id)
                }
              >
                <div
                  className="flex items-center gap-1.5 pl-0 pr-2.5 py-1.5 rounded-r-[3px] cursor-pointer"
                  style={{
                    background: bg,
                    borderTop: `1px solid ${borderColor}`,
                    borderRight: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                    borderLeft: 'none',
                    transition: 'all 150ms ease',
                    paddingLeft: '8px',
                  }}
                >
                  <span
                    className="w-[6px] h-[6px] rounded-full block flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                  />
                  <span
                    className="font-mono text-[9px] tracking-[0.1em] whitespace-nowrap"
                    style={{
                      color,
                      opacity: folder.isOpen ? 1 : 0.8,
                      maxWidth: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {folder.name}
                  </span>
                  <span
                    className="font-mono text-[8px] opacity-30"
                    style={{ color }}
                  >
                    ·
                  </span>
                  <span
                    className="font-mono text-[9px] tracking-[0.08em]"
                    style={{ color, opacity: 0.7 }}
                  >
                    {count}
                  </span>
                  {folder.isOpen && (
                    <span
                      className="font-mono text-[7px] tracking-[0.1em] opacity-50"
                      style={{ color }}
                    >
                      [open]
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
