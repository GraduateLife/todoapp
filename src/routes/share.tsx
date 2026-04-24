import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTodoStore } from '#/features/todo/store'
import { EXPORT_TEMPLATES, getTemplate } from '#/features/todo/export/templates'
import { slugify } from '#/features/todo/export/templates/_helpers'
import {
  ContentEditor,
  PreviewFrame,
  ShareActions,
  ShareHeader,
  ShareResult,
  TemplateList,
  useContentOverride,
  useShareState,
} from '#/features/share'

type ShareSearch = {
  id?: string
}

export const Route = createFileRoute('/share')({
  validateSearch: (search: Record<string, unknown>): ShareSearch => ({
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useSearch()
  const navigate = useNavigate()

  const todo = useTodoStore((s) =>
    id ? (s.todos.find((t) => t.id === id) ?? null) : null,
  )

  const [selectedId, setSelectedId] = useState<string>(EXPORT_TEMPLATES[0].id)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const share = useShareState()
  const override = useContentOverride(todo)

  const template = useMemo(() => getTemplate(selectedId), [selectedId])
  const renderTarget = override.overriddenTodo ?? todo
  const rendered = useMemo(() => {
    if (!renderTarget || !template) return ''
    return template.render(renderTarget)
  }, [renderTarget, template])

  // Cheap stable hash of the rendered output — lets us bust the iframe cache
  // whenever the user edits, since some browsers don't re-parse a sandboxed
  // iframe when srcDoc changes in place.
  const renderedHash = useMemo(() => {
    let h = 0
    for (let i = 0; i < rendered.length; i++) {
      h = (h * 31 + rendered.charCodeAt(i)) | 0
    }
    return h.toString(36)
  }, [rendered])

  // Reset panel state when switching template
  useEffect(() => {
    share.reset()
    setCopyStatus('idle')
  }, [selectedId, share])

  const handleBack = useCallback(() => {
    navigate({ to: '/' })
  }, [navigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleBack])

  const handleCopy = useCallback(async () => {
    if (!rendered) return
    try {
      await navigator.clipboard.writeText(rendered)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 1500)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }, [rendered])

  const handleDownload = useCallback(() => {
    if (!renderTarget || !template) return
    const name = slugify(renderTarget.title || 'untitled')
    const ext = template.format === 'md' ? 'md' : 'html'
    const mime = template.format === 'md' ? 'text/markdown' : 'text/html'
    const blob = new Blob([rendered], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [renderTarget, template, rendered])

  const handleShare = useCallback(() => {
    if (!renderTarget || !template) return
    void share.publish({
      title: renderTarget.title || 'Untitled',
      format: template.format,
      content: rendered,
    })
  }, [renderTarget, template, rendered, share])

  // ── Missing-todo state ─────────────────────────────────────────────────────
  if (!id || !todo) {
    return (
      <main className="page-wrap px-4 py-16 flex flex-col items-center justify-center">
        <p
          className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2"
          style={{ color: '#ffb800', opacity: 0.6 }}
        >
          export
        </p>
        <p
          className="font-mono text-[0.85rem] mb-6"
          style={{ color: 'var(--rf-text-dim)' }}
        >
          {id ? 'todo not found' : 'no todo selected'}
        </p>
        <button type="button" className="rf-btn" onClick={handleBack}>
          [ back to canvas ]
        </button>
      </main>
    )
  }

  const format = template?.format ?? 'md'

  return (
    <main
      className="page-wrap px-4 py-6 flex flex-col gap-4"
      style={{ height: 'calc(100dvh - 74px)', overflow: 'hidden' }}
    >
      <ShareHeader
        title={renderTarget?.title ?? todo.title}
        format={format}
        onBack={handleBack}
      />

      <div id="share-layout" className="flex gap-4 flex-1 min-h-0">
        <aside id="share-sidebar" className="flex flex-col gap-4 shrink-0" style={{ width: 260 }}>
          <TemplateList
            templates={EXPORT_TEMPLATES}
            selectedId={selectedId}
            onSelect={setSelectedId}
            fileBaseTitle={renderTarget?.title || 'untitled'}
          />
          <ShareActions
            format={format}
            copyStatus={copyStatus}
            shareStatus={share.status}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onShare={handleShare}
          />
          <ShareResult
            status={share.status}
            url={share.url}
            error={share.error}
            urlCopied={share.urlCopied}
            onCopyUrl={share.copyUrl}
          />
          <p
            className="font-mono text-[9px] tracking-[0.12em] opacity-40 mt-auto"
            style={{ color: 'var(--rf-text-dim)' }}
          >
            esc · back to canvas
          </p>
        </aside>

        <div id="share-preview-panel" className="flex flex-col gap-3 flex-1 min-w-0">
          <ContentEditor
            title={override.title}
            description={override.description}
            priority={override.priority}
            subtasks={override.subtasks}
            attachments={override.attachments}
            isModified={override.isModified}
            onTitleChange={override.setTitle}
            onDescriptionChange={override.setDescription}
            onPriorityChange={override.setPriority}
            onSubtaskAdd={override.addSubtask}
            onSubtaskUpdate={override.updateSubtask}
            onSubtaskRemove={override.removeSubtask}
            onAttachmentsAdd={override.addAttachments}
            onAttachmentRemove={override.removeAttachment}
            onReset={override.resetToOriginal}
          />
          <PreviewFrame
            contentKey={`${selectedId}:${renderedHash}`}
            format={format}
            rendered={rendered}
            templateLabel={
              template
                ? `${template.name.toLowerCase()}.${template.format}`
                : undefined
            }
            modified={override.isModified}
          />
        </div>
      </div>
    </main>
  )
}
