import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

/**
 * Searchable multi-select. Selected values sit inside the box as removable
 * chips; typing in the box filters the option list. Used by the Leads filter
 * ("Lead Status", "Country Interested In") and the Add-Lead form.
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = '- Select -',
}: {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const available = options
    .filter((o) => !selected.includes(o))
    .filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const add = (val: string) => {
    onChange([...selected, val])
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
        className="flex min-h-[38px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus-within:border-brand-500"
      >
        {selected.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(selected.filter((s) => s !== val))
              }}
              className="text-slate-400 hover:text-rose-500"
              aria-label={`Remove ${val}`}
            >
              <X className="h-3 w-3" />
            </button>
            {val}
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !query && selected.length) {
              onChange(selected.slice(0, -1))
            }
          }}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="min-w-[60px] flex-1 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {available.length > 0 ? (
            available.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => add(o)}
                className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-600"
              >
                {o}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-slate-400">No matches</p>
          )}
        </div>
      )}
    </div>
  )
}
