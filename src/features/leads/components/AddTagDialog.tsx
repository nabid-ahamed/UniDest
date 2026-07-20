import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Plus } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { Lead } from '../../../mock/leads'

/**
 * "Add Tags" modal: pick one of the last 10 used tags from the dropdown, or
 * type a brand-new one. Rendered through a portal so it covers the header.
 */
export function AddTagDialog({
  lead,
  recentTags,
  tagCount,
  maxTags,
  onClose,
  onAdd,
}: {
  lead: Lead
  recentTags: string[]
  tagCount: number
  maxTags: number
  onClose: () => void
  onAdd: (tag: string) => void
}) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const query = value.trim().toLowerCase()
  const matches = recentTags.filter((t) => t.toLowerCase().includes(query))
  const isNew = query.length > 0 && !recentTags.some((t) => t.toLowerCase() === query)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (open ? setOpen(false) : onClose())
    }
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open, onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const tag = value.trim()
    if (!tag) {
      setError('Please select or type a tag.')
      inputRef.current?.focus()
      return
    }
    onAdd(tag)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tag-title"
        className="animate-dialog-in relative my-16 w-full max-w-lg rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="add-tag-title" className="text-lg font-bold text-slate-800">
            Add Tags
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <label htmlFor="tag-input" className="mb-1.5 block text-sm font-medium text-slate-700">
            Select/Add New Tag <span className="text-rose-600">*</span>
          </label>

          <div ref={boxRef} className="relative">
            <input
              id="tag-input"
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
                setOpen(true)
              }}
              // Opens on click, not on focus: the field is auto-focused when the
              // dialog mounts, so an onFocus handler would pop the list open
              // unprompted every time the dialog appears.
              onClick={() => setOpen(true)}
              autoComplete="off"
              placeholder="Select a tag or type a new one"
              aria-invalid={!!error}
              aria-describedby={error ? 'tag-error' : undefined}
              className={cn(
                'w-full rounded-lg border bg-white py-2.5 pl-3 pr-9 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2',
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
              )}
            />
            <button
              type="button"
              onClick={() => {
                setOpen((v) => !v)
                inputRef.current?.focus()
              }}
              aria-label="Show recent tags"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-700"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <p className="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Last 10 used tags
                </p>
                {matches.length > 0 ? (
                  matches.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setValue(t)
                        setError('')
                        setOpen(false)
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No matching tag</p>
                )}

                {isNew && (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-1 flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    <Plus className="h-4 w-4" />
                    Create “{value.trim()}”
                  </button>
                )}
              </div>
            )}
          </div>

          {error && (
            <p id="tag-error" role="alert" className="mt-1.5 text-sm text-rose-600">
              {error}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            Adding to <span className="font-medium text-slate-700">{lead.name}</span> (#{lead.id}) ·{' '}
            <span className={cn('font-medium', tagCount >= maxTags && 'text-amber-700')}>
              {tagCount} of {maxTags} tags used
            </span>
          </p>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Add Tag
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
