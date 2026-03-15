import { useState, useRef, useCallback } from 'react'

interface VoiceAttachmentProps {
  onRecorded: (blob: Blob, name: string) => void
  children?: React.ReactNode
}

export function VoiceAttachment({
  onRecorded,
  children,
}: VoiceAttachmentProps) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const name = `voice-${Date.now()}.webm`
        onRecorded(blob, name)
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }, [onRecorded])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      setIsRecording(false)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      className="rounded p-1.5 text-[var(--sea-ink-soft)] hover:bg-[var(--line)] hover:text-[var(--sea-ink)]"
      aria-label={isRecording ? 'Stop recording' : 'Record voice'}
    >
      {children ?? (isRecording ? '⏹' : '🎤')}
    </button>
  )
}

/** 将 Blob 转为 base64 data URL */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
