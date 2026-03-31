import type { NoteColor } from '../../types'
import { COLOR_OPTIONS } from '../../constants/noteColors'

interface ColorPickerProps {
  selectedColor: NoteColor | 'random'
  onColorChange: (color: NoteColor | 'random') => void
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        padding: '0 8px',
        gap: 2,
      }}
    >
      {COLOR_OPTIONS.map((opt) => {
        const isSelected = selectedColor === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            title={opt.key === 'random' ? 'Random color' : opt.key}
            onClick={() => onColorChange(opt.key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 5px',
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
                backgroundColor: opt.hex,
                opacity: isSelected ? 1 : 0.2,
                boxShadow: isSelected ? `0 0 4px 1px ${opt.hex}` : 'none',
                transition: 'box-shadow 150ms, opacity 150ms',
              }}
            />
            <span
              style={{
                fontFamily: '"Space Mono", ui-monospace, monospace',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: isSelected ? opt.hex : 'var(--rf-text-dim)',
                opacity: isSelected ? 1 : 0.3,
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
  )
}
