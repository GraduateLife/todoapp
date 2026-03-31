import { useFolderStore } from '../../store'
import { useTodoStore } from '../../store'

const COLOR_VAR: Record<string, string> = {
  cyan: 'var(--rf-cyan)',
  pink: 'var(--rf-pink)',
  amber: 'var(--rf-amber)',
  green: 'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

// RGB values for computing semi-transparent tints
const COLOR_RGB: Record<string, string> = {
  cyan: '0,245,255',
  pink: '255,45,120',
  amber: '255,184,0',
  green: '57,255,20',
  purple: '191,95,255',
}

export function FolderMarkers() {
  const folders = useFolderStore((s) => s.folders)
  const openFolder = useFolderStore((s) => s.openFolder)
  const closeFolder = useFolderStore((s) => s.closeFolder)
  const todos = useTodoStore((s) => s.todos)

  if (folders.length === 0) return null

  return (
    <div
      className="fixed left-0 top-1/3 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none"
      style={{ zIndex: 200 }}
    >
      {folders.map((folder) => {
        const count = todos.filter(
          (t) => t.folderId === folder.id && !t.archived,
        ).length
        const color = COLOR_VAR[folder.color] ?? 'var(--rf-purple)'
        const rgb = COLOR_RGB[folder.color] ?? '191,95,255'
        const bg = folder.isOpen
          ? `rgba(${rgb},0.10)`
          : `rgba(${rgb},0.05)`
        const borderColor = folder.isOpen
          ? `rgba(${rgb},0.55)`
          : `rgba(${rgb},0.25)`

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
              {/* Dot */}
              <span
                className="w-[6px] h-[6px] rounded-full block flex-shrink-0"
                style={{ background: color, boxShadow: `0 0 5px ${color}` }}
              />
              {/* Folder name */}
              <span
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={
                  {
                    color,
                    opacity: folder.isOpen ? 1 : 0.75,
                    maxWidth: 100,
                    wordBreak: 'break-all',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textShadow: folder.isOpen ? `0 0 10px ${color}` : 'none',
                  } as React.CSSProperties
                }
              >
                {folder.name}
              </span>
              {/* Count */}
              <span
                className="font-mono text-[8px] tracking-[0.08em] opacity-40"
                style={{ color }}
              >
                ({count})
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
