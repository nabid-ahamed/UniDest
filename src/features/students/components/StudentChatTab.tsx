import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Paperclip, Send, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { loadChat, sendChat, type ChatMessage } from '../../../mock/student/supportChat'
import type { Student } from '../../../mock/students'

/**
 * "Chat" tab on the student detail page — a 1-on-1 support conversation with
 * this student. Messages persist per student (localStorage, prototype). Staff
 * messages align right, the student's left. Mirrors the reference: brand-blue
 * header, scrollable message area with an empty state, and a compose bar with
 * an attachment button.
 */
export function StudentChatTab({
  student,
  onToast,
}: {
  student: Student
  onToast: (msg: string) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat(student.id))
  const [draft, setDraft] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  const timeLabel = () =>
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())

  const send = () => {
    const text = draft.trim()
    if (!text && files.length === 0) return
    setMessages(sendChat(student.id, { from: 'staff', text, at: timeLabel(), files }))
    setDraft('')
    setFiles([])
  }

  const onFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files ?? []).map((f) => f.name)
    e.target.value = ''
    if (names.length) {
      setFiles((prev) => [...prev, ...names])
      onToast(names.length > 1 ? `${names.length} files attached` : `"${names[0]}" attached`)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {/* Header */}
      <div className="bg-brand-600 px-4 py-3 text-white">
        <p className="flex items-center gap-2 font-bold">
          <MessageCircle className="h-4 w-4" />
          Chat with Student: {student.name}
          <span className="inline-flex items-center gap-1 text-sm font-normal text-white/90">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
          </span>
        </p>
        <p className="text-xs text-white/80">Support Chat</p>
      </div>

      {/* Messages */}
      <div className="flex h-[26rem] flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
        {messages.length === 0 ? (
          <div className="m-auto flex flex-col items-center gap-2 text-center">
            <MessageCircle className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex', m.from === 'staff' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                  m.from === 'staff'
                    ? 'rounded-br-sm bg-brand-600 text-white'
                    : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700',
                )}
              >
                {m.text && <p className="[overflow-wrap:anywhere]">{m.text}</p>}
                {m.files?.map((f) => (
                  <p
                    key={f}
                    className={cn(
                      'mt-1 inline-flex items-center gap-1 text-xs [overflow-wrap:anywhere]',
                      m.from === 'staff' ? 'text-white/90' : 'text-brand-600',
                    )}
                  >
                    <Paperclip className="h-3 w-3" /> {f}
                  </p>
                ))}
                <p
                  className={cn(
                    'mt-1 text-right text-[11px]',
                    m.from === 'staff' ? 'text-white/70' : 'text-slate-400',
                  )}
                >
                  {m.at}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Attached-files chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-4 py-2">
          {files.map((f, i) => (
            <span
              key={`${f}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
            >
              <Paperclip className="h-3 w-3" /> {f}
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${f}`}
                className="text-slate-400 hover:text-rose-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Compose bar */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Attach file"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onFilesChosen} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Type a message..."
          aria-label="Message"
          className="input flex-1"
        />
        <button
          type="button"
          onClick={send}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
    </div>
  )
}
