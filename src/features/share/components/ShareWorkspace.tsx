import { useCallback, useEffect, useMemo, useState } from 'react'
import { EXPORT_TEMPLATES, getTemplate } from '#/features/todo/export/templates'
import { slugify } from '#/features/todo/export/templates/_helpers'
import type { Todo } from '#/features/todo/types'
import { useContentOverride } from '../hooks/useContentOverride'
import { useShareState } from '../hooks/useShareState'
import { ContentEditor } from './ContentEditor'
import { PreviewFrame } from './PreviewFrame'
import { ShareActions } from './ShareActions'
import { ShareDiagnostics } from './ShareDiagnostics'
import { ShareHeader } from './ShareHeader'
import { ShareResult } from './ShareResult'
import { TemplateList } from './TemplateList'

interface ShareWorkspaceProps {
  todo: Todo
  onBack: () => void
}

export function ShareWorkspace({ todo, onBack }: ShareWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string>(EXPORT_TEMPLATES[0].id)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [editorOpen, setEditorOpen] = useState(true)
  const share = useShareState(todo.id)
  const override = useContentOverride(todo)

  const template = useMemo(() => getTemplate(selectedId), [selectedId])
  const renderTarget = override.overriddenTodo ?? todo
  const rendered = useMemo(() => {
    if (!template) return ''
    return template.render(renderTarget)
  }, [renderTarget, template])

  // Force-reset the iframe when source changes so sandboxed previews refresh reliably.
  const renderedHash = useMemo(() => {
    let h = 0
    for (let i = 0; i < rendered.length; i++) {
      h = (h * 31 + rendered.charCodeAt(i)) | 0
    }
    return h.toString(36)
  }, [rendered])

  useEffect(() => {
    share.reset()
    setCopyStatus('idle')
  }, [selectedId, share.reset])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])

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
    if (!template) return
    const name = slugify(renderTarget.title || 'untitled')
    const ext = template.format === 'md' ? 'md' : 'html'
    const mime = template.format === 'md' ? 'text/markdown' : 'text/html'
    const blob = new Blob([rendered], { type: mime })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${name}.${ext}`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [renderTarget, rendered, template])

  const handleShare = useCallback(() => {
    if (!template) return
    void share.publish({
      todoId: renderTarget.id,
      title: renderTarget.title || 'Untitled',
      format: template.format,
      content: rendered,
    })
  }, [renderTarget, rendered, share, template])

  const format = template?.format ?? 'md'

  return (
    <main
      className="relative page-wrap rf-scrollbar px-4 py-6 flex flex-col gap-4"
      style={{ height: 'calc(100dvh - 74px)', overflow: 'auto' }}
    >
      <ShareHeader
        title={renderTarget.title || todo.title}
        format={format}
        onBack={onBack}
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
            fileBaseTitle={renderTarget.title || 'untitled'}
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
            panelOpen={editorOpen}
            onPanelOpenChange={setEditorOpen}
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
            editorCollapsed={!editorOpen}
            onToggleEditor={() => setEditorOpen((v) => !v)}
          />
        </div>
      </div>
    </main>
  )
}
