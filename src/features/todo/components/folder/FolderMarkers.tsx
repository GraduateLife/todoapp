import { useFolderStore } from '../../store'
import { useTodoStore } from '../../store'

const COLOR_VAR: Record<string, string> = {
  cyan: 'var(--rf-cyan)',
  pink: 'var(--rf-pink)',
  amber: 'var(--rf-amber)',
  green: 'var(--rf-green)',
  purple: 'var(--rf-purple)',
}

export function FolderMarkers() {
  const folders = useFolderStore((s) => s.folders)
  const openFolder = useFolderStore((s) => s.openFolder)
  const closeFolder = useFolderStore((s) => s.closeFolder)
  const todos = useTodoStore((s) => s.todos)

  if (folders.length === 0) return null

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none"
      style={{ zIndex: 200 }}
    >
      {folders.map((folder) => {
        const count = todos.filter((t) => t.folderId === folder.id && !t.archived).length
        const color = COLOR_VAR[folder.color] ?? 'var(--rf-purple)'

        return (
          <div
            key={folder.id}
            className="pointer-events-auto flex items-center group"
          >
            {/* Left-edge pill */}
            <div
              className="flex items-center gap-1 px-1.5 py-1 rounded-r-[3px] cursor-pointer"
              style={{
                background: folder.isOpen
                  ? `rgba(${folder.color === 'purple' ? '191,95,255' : folder.color === 'cyan' ? '0,245,255' : folder.color === 'pink' ? '255,45,120' : folder.color === 'amber' ? '255,184,0' : '57,255,20'},0.12)`
                  : 'rgba(0,245,255,0.04)',
                border: `1px solid ${folder.isOpen ? color : 'rgba(0,245,255,0.15)'}`,
                borderLeft: 'none',
                transition: 'all 150ms ease',
              }}
              onClick={() => folder.isOpen ? closeFolder(folder.id) : openFolder(folder.id)}
            >
              {/* Dot */}
              <span
                className="w-[5px] h-[5px] rounded-full block flex-shrink-0"
                style={{ background: color, boxShadow: `0 0 4px ${color}` }}
              />
              {/* Count */}
              <span
                className="font-mono text-[8px] tracking-[0.08em]"
                style={{ color, opacity: 0.85 }}
              >
                {count}
              </span>
            </div>

            {/* Expanded label — visible on hover */}
            <div
              className="ml-1 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
            >
              <div
                className="px-2 py-1 rounded-[2px] font-mono text-[9px] tracking-[0.1em] whitespace-nowrap"
                style={{
                  background: '#080c18',
                  border: `1px solid ${color}33`,
                  color: 'var(--rf-text)',
                  opacity: 0.9,
                }}
              >
                {folder.name}
                {folder.isOpen && <span className="ml-1 opacity-50 text-[8px]">[open]</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
