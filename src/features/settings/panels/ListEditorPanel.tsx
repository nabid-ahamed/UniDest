import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '../../../lib/cn'

/**
 * Reusable editable-string-list panel — powers both Branches and Study Levels.
 * The caller owns the data (add/remove return to it); this just renders chips +
 * an add box and surfaces validation via the toast.
 */
export function ListEditorPanel({
  title,
  description,
  connectedNote,
  items,
  placeholder,
  onAdd,
  onRemove,
  onToast,
}: {
  title: string
  description: string
  connectedNote?: React.ReactNode
  items: string[]
  placeholder: string
  onAdd: (name: string) => boolean
  onRemove: (name: string) => void
  onToast: (msg: string) => void
}) {
  const [value, setValue] = useState('')
  const [, setRev] = useState(0)

  const add = () => {
    const name = value.trim()
    if (!name) return
    if (onAdd(name)) {
      setValue('')
      setRev((n) => n + 1)
      onToast(`${name} added`)
    } else {
      onToast('Already exists')
    }
  }

  return (
    <Panel title={title} description={description}>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={cn('inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-1.5 text-sm font-semibold text-slate-700')}
          >
            {item}
            <button
              onClick={() => {
                onRemove(item)
                setRev((n) => n + 1)
                onToast(`${item} removed`)
              }}
              aria-label={`Remove ${item}`}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">Nothing here yet — add the first one.</p>}
      </div>

      <div className="mt-4 flex max-w-md gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="input"
        />
        <button
          onClick={add}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {connectedNote && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">{connectedNote}</div>
      )}
    </Panel>
  )
}

/** Shared card wrapper used by every settings panel. */
export function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
