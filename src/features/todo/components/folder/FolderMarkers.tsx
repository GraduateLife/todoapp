import { useFolderStore } from '../../store'
import { useTodoStore } from '../../store'

const COLOR_VAR: Record<string, string> = {
  cyan:   'var(--rf-cyan)',
  pink:   'var(--rf-pink)',
  amber:  'var(--rf-amber)',
  green:  'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

// rgb values for bg tint
const COLOR_RGB: Record<string, string> = {
  cyan:   '0,245,255',
  pink:   '255,45,120',
  amber:  '255,184,0',
  green:  '57,255,20',
  purple: '191,95,255',
}

export function FolderMarkers() {
  const folders    = useFolderStore((s) => s.folders)
  const openFolder  = useFolderStore((s) => s.openFolder)
  const closeFolder = useFolderStore((s) => s.closeFolder)
  const todos      = useTodoStore((s) => s.todos)

  if (folders.length === 0) return null

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none"
      style={{ zIndex: 200 }}
    >
      {folders.map((folder) => {
        const count = todos.filter((t) => t.folderId === folder.id && !t.archived).length
        const color = COLOR_VAR[folder.color] ?? 'var(--rf-purple)'
        const rgb   = COLOR_RGB[folder.color] ?? '191,95,255'
        const bg    = folder.isOpen
          ? `rgba(${rgb},0.12)`
          : `rgba(${rgb},0.05)`
        const borderColor = folder.isOpen ? color : `rgba(${rgb},0.22)`

        return (
          <div
            key={folder.id}
            className="pointer-events-auto"
            onClick={() => folder.isOpen ? closeFolder(folder.id) : openFolder(folder.id)}
          >
            <div
              className="flex items-center gap-1.5 pl-0 pr-2.5 py-1.5 rounded-r-[3px] cursor-pointer"
              style={{
                background:   bg,
                borderTop:    `1px solid ${borderColor}`,
                borderRight:  `1px solid ${borderColor}`,
                borderBottom: `1px solid ${borderColor}`,
                borderLeft:   'none',
                transition:   'all 150ms ease',
                paddingLeft:  '8px',
              }}
            >
              {/* Dot */}
              <span
                className="w-[6px] h-[6px] rounded-full block flex-shrink-0"
                style={{ background: color, boxShadow: `0 0 5px ${color}` }}
              />
              {/* Folder name */}
              <span
                className="font-mono text-[9px] tracking-[0.1em] whitespace-nowrap"
                style={{ color, opacity: folder.isOpen ? 1 : 0.8, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {folder.name}
              </span>
              {/* Divider */}
              <span className="font-mono text-[8px] opacity-30" style={{ color }}>·</span>
              {/* Count */}
              <span
                className="font-mono text-[9px] tracking-[0.08em]"
                style={{ color, opacity: 0.7 }}
              >
                {count}
              </span>
              {/* Open indicator */}
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
  )
}
