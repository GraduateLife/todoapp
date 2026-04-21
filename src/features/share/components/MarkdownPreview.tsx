import type { CSSProperties } from 'react'

function lineStyle(line: string): CSSProperties {
  if (/^---\s*$/.test(line)) return { color: '#ffb800', opacity: 0.55 }
  if (/^###### /.test(line)) return { color: '#ffd580' }
  if (/^##### /.test(line)) return { color: '#ffd580' }
  if (/^#### /.test(line)) return { color: '#ffd580' }
  if (/^### /.test(line)) return { color: '#ffcc66', fontWeight: 500 }
  if (/^## /.test(line)) return { color: '#ffb840', fontWeight: 600 }
  if (/^# /.test(line)) return { color: '#ffb800', fontWeight: 700 }
  if (/^\s*- \[x\] /i.test(line))
    return {
      color: 'rgba(200,220,235,0.5)',
      textDecoration: 'line-through',
    }
  if (/^\s*- \[ \] /.test(line)) return { color: '#e6faff' }
  if (/^\s*[-*+] /.test(line)) return { color: '#a8cce0' }
  if (/^\s*> /.test(line)) return { color: '#7fa8c0', fontStyle: 'italic' }
  if (/^```/.test(line)) return { color: '#80d4e8', opacity: 0.7 }
  if (/^\*[^*]+\*\s*$/.test(line))
    return { color: '#80d4e8', fontStyle: 'italic' }
  if (/^\w[\w-]*:\s/.test(line)) return { color: '#b8d4e8' }
  return { color: '#d8ecf5' }
}

export function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <pre
      className="font-mono"
      style={{
        margin: 0,
        padding: '24px 28px',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        fontSize: '0.82rem',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background:
          'linear-gradient(180deg, rgba(255,184,0,0.02), transparent 40%), #0a0f1c',
        color: '#d8ecf5',
      }}
    >
      {lines.map((line, i) => (
        <span key={i} style={lineStyle(line)}>
          {line}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}
