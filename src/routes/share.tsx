import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTodoStore } from '#/features/todo/store'
import { EXPORT_TEMPLATES, getTemplate } from '#/features/todo/export/templates'
import { slugify } from '#/features/todo/export/templates/_helpers'
import { getShareStrategy } from '#/lib/share'
import {
  ContentEditor,
  PreviewFrame,
  ShareActions,
  ShareDiagnostics,
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
  const todos = useTodoStore((s) => s.todos)

  const todo = useTodoStore((s) =>
    id ? (s.todos.find((t) => t.id === id) ?? null) : null,
  )

  const [selectedId, setSelectedId] = useState<string>(EXPORT_TEMPLATES[0].id)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const share = useShareState(todo?.id ?? null)
  const override = useContentOverride(todo)
  const sharedTodos = useQuery({
    queryKey: ['share', 'active-list', todos.map((t) => t.id)],
    queryFn: async () => {
      const strategy = getShareStrategy()
      const results = await Promise.all(
        todos.map(async (item) => ({
          todo: item,
          share: await strategy.getByTodoId(item.id),
        })),
      )

      return results.filter(
        (
          entry,
        ): entry is {
          todo: (typeof todos)[number]
          share: NonNullable<typeof entry.share>
        } => Boolean(entry.share),
      )
    },
    enabled: !id && todos.length > 0,
    staleTime: 10_000,
  })

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
  }, [selectedId, share.reset])

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
      todoId: renderTarget.id,
      title: renderTarget.title || 'Untitled',
      format: template.format,
      content: rendered,
    })
  }, [renderTarget, template, rendered, share])

  // ── Missing-todo state ─────────────────────────────────────────────────────
  if (!id || !todo) {
    return (
      <main className="relative page-wrap px-4 py-16 flex flex-col items-center justify-center">
        <p
          className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2"
          style={{ color: '#ffb800', opacity: 0.6 }}
        >
          exported
        </p>
        {!id && (
          <div
            className="w-full max-w-[560px] rounded-[2px] flex flex-col gap-2 mb-6"
            style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(200,224,244,0.12)',
            }}
          >
            {/* <p
              className="font-mono text-[9px] tracking-[0.15em] uppercase"
              style={{ color: '#80d4e8', opacity: 0.75 }}
            >
              active shares
            </p> */}

            {sharedTodos.isLoading ? (
              <p
                className="font-mono text-[10px]"
                style={{ color: 'var(--rf-text-dim)' }}
              >
                loading shared todos...
              </p>
            ) : sharedTodos.data?.length ? (
              <div className="flex flex-col gap-2">
                {sharedTodos.data.map(
                  ({ todo: sharedTodo, share: activeShare }) => (
                    <button
                      key={sharedTodo.id}
                      type="button"
                      className="text-left rounded-[2px]"
                      onClick={() =>
                        navigate({
                          to: '/share',
                          search: { id: sharedTodo.id },
                        })
                      }
                      style={{
                        padding: '10px 12px',
                        border: '1px solid rgba(0,245,255,0.18)',
                        background: 'rgba(0,245,255,0.04)',
                      }}
                    >
                      <p
                        className="font-mono text-[10px] uppercase tracking-[0.12em]"
                        style={{ color: '#00f5ff' }}
                      >
                        {sharedTodo.title || 'untitled'}
                      </p>
                      <p
                        className="font-mono text-[9px] mt-1"
                        style={{ color: 'var(--rf-text-dim)' }}
                      >
                        {activeShare.url}
                      </p>
                    </button>
                  ),
                )}
              </div>
            ) : (
              <p
                className="font-mono text-[10px]"
                style={{ color: 'var(--rf-text-dim)' }}
              >
                no active shares yet
              </p>
            )}
          </div>
        )}
        <p
          className="font-mono text-[9px]"
          style={{ color: 'var(--rf-text-dim)' }}
        >
          click to inspect any shared todo.
        </p>
      </main>
    )
  }

  const format = template?.format ?? 'md'

  return (
    <main
      className="relative page-wrap px-4 py-6 flex flex-col gap-4"
      style={{ height: 'calc(100dvh - 74px)', overflow: 'hidden' }}
    >
      <ShareHeader
        title={renderTarget?.title ?? todo.title}
        format={format}
        onBack={handleBack}
      />

      <div id="share-layout" className="flex gap-4 flex-1 min-h-0">
        <aside
          id="share-sidebar"
          className="flex flex-col gap-4 shrink-0"
          style={{ width: 260 }}
        >
          <TemplateList
            templates={EXPORT_TEMPLATES}
            selectedId={selectedId}
            onSelect={setSelectedId}
            disabled={share.isLocked}
            fileBaseTitle={renderTarget?.title || 'untitled'}
          />
          <ShareActions
            format={format}
            copyStatus={copyStatus}
            shareStatus={share.status}
            hasActiveShare={share.isLocked}
            isRevoking={share.isRevoking}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onShare={handleShare}
            onUnshare={() => void share.unshare()}
          />
          <ShareResult
            status={share.status}
            url={share.activeShare.data?.url ?? share.url}
            recentUrl={share.recentShare?.url ?? null}
            recentSharedAt={share.recentShare?.sharedAt ?? null}
            error={share.error}
            urlCopied={share.urlCopied}
            onCopyUrl={share.copyUrl}
          />
          {import.meta.env.DEV && (
            <ShareDiagnostics
              lastAttempt={share.lastAttempt}
              health={share.health}
            />
          )}
        </aside>

        <div
          id="share-preview-panel"
          className="flex flex-col gap-3 flex-1 min-w-0"
        >
          <ContentEditor
            title={override.title}
            description={override.description}
            priority={override.priority}
            subtasks={override.subtasks}
            attachments={override.attachments}
            isModified={override.isModified}
            disabled={share.isLocked}
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
