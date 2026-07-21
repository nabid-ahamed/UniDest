import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'

/** Three-dot bouncing preloader shown while a list "fetches". */
export function DotsLoader() {
  return (
    <div className="flex items-center justify-center gap-2" role="status" aria-label="Loading">
      <span className="h-3.5 w-3.5 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.3s]" />
      <span className="h-3.5 w-3.5 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.15s]" />
      <span className="h-3.5 w-3.5 animate-bounce rounded-full bg-brand-600" />
    </div>
  )
}

/** Labelled filter field. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

/** Prev/next arrow button in the pagination strip. */
export function PageBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/**
 * Custom single-select. Used where a native `<select>` would drop a very long
 * list past the dialog edge (e.g. the 24-month Intake list).
 */
export function SingleSelect({
  options,
  value,
  onChange,
  placeholder = '- Select -',
}: {
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[38px] w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-left text-sm focus:border-brand-500"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-500'}>{value || placeholder}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-1.5 text-left text-sm hover:bg-brand-50 hover:text-brand-600',
                o === value ? 'font-semibold text-brand-600' : 'text-slate-700',
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
