import { useRef } from 'react'
import type { ChangeEvent } from 'react'

interface ImageAttachmentProps {
  onSelect: (file: File) => void
  accept?: string
  children?: React.ReactNode
}

export function ImageAttachment({
  onSelect,
  accept = 'image/*',
  children,
}: ImageAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onSelect(file)
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        aria-label="Attach image"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded p-1.5 text-[var(--sea-ink-soft)] hover:bg-[var(--line)] hover:text-[var(--sea-ink)]"
        aria-label="Attach image"
      >
        {children ?? '📷'}
      </button>
    </>
  )
}

/** 将 File 转为 base64 data URL，用于存储 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
