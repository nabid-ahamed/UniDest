import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { cn } from '../../../lib/cn'

/* ---------------------------------------------------------------- */
/* Section chrome                                                    */
/* ---------------------------------------------------------------- */

/** Solid brand-blue section bar (e.g. "Personal Info"). */
export function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-brand-600 px-5 py-3.5 text-lg font-bold text-white">{children}</div>
  )
}

/** Plain section heading (e.g. "Current Address"). */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-slate-800">{children}</h3>
}

/* ---------------------------------------------------------------- */
/* Field wrapper + inputs                                            */
/* ---------------------------------------------------------------- */

export function Field({
  label,
  required,
  htmlFor,
  error,
  children,
}: {
  label: string
  required?: boolean
  htmlFor?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

const baseInput =
  'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2'

const inputCls = (bad?: boolean) =>
  cn(
    baseInput,
    bad
      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
  )

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  invalid?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls(invalid)}
    />
  )
}

/** Native date field (matches the reference's date pickers). */
export function DateInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
}) {
  return (
    <input
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls(invalid)}
    />
  )
}

/** Dropdown select with an optional invalid state (portal-form styling). */
export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select',
  invalid,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  invalid?: boolean
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
        className={cn(
          'flex min-h-[42px] w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-left text-sm focus:outline-none focus:ring-2',
          invalid
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
        )}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-sm hover:bg-brand-50 hover:text-brand-600',
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

/** Yes / No radio pair (Nationality + Background questions). */
export function YesNoField({
  label,
  value,
  onChange,
  name,
}: {
  label: string
  value: 'No' | 'Yes'
  onChange: (v: 'No' | 'Yes') => void
  name: string
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex items-center gap-6">
        {(['No', 'Yes'] as const).map((opt) => (
          <label key={opt} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={name}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="h-4 w-4 accent-brand-600"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

/** Multi-select rendered as removable tags (Study Country / Services). */
export function MultiTagSelect({
  options,
  values,
  onChange,
  placeholder = 'Select…',
}: {
  options: string[]
  values: string[]
  onChange: (v: string[]) => void
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

  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt])

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[42px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-within:border-brand-500"
      >
        {values.length === 0 && <span className="text-slate-400">{placeholder}</span>}
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggle(v)
              }}
              aria-label={`Remove ${v}`}
              className="text-slate-500 hover:text-rose-600"
            >
              <X className="h-3 w-3" />
            </button>
            {v}
          </span>
        ))}
        <ChevronDown
          className={cn('ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </div>
      {open && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((o) => {
            const active = values.includes(o)
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50',
                  active ? 'font-semibold text-brand-600' : 'text-slate-700',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                  )}
                >
                  {active && <X className="h-3 w-3" />}
                </span>
                {o}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Collapsible repeater section (Academic Details, Employment, …)   */
/* ---------------------------------------------------------------- */

export interface RepeaterField {
  key: string
  label: string
  type?: 'text' | 'date' | 'select'
  options?: string[]
  placeholder?: string
}

/**
 * One reusable collapsible section that manages a list of rows against a
 * field schema. Drives all seven apply-form accordions, so there is no
 * duplicate per-section logic.
 */
export function RepeaterSection({
  title,
  fields,
  rows,
  onChange,
  addLabel = 'Add',
}: {
  title: string
  fields: RepeaterField[]
  rows: Record<string, string>[]
  onChange: (rows: Record<string, string>[]) => void
  addLabel?: string
}) {
  const [open, setOpen] = useState(false)

  const addRow = () => onChange([...rows, Object.fromEntries(fields.map((f) => [f.key, '']))])
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const setCell = (i: number, key: string, value: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))

  return (
    <div className="overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 bg-brand-600 px-5 py-3.5 text-left text-lg font-bold text-white transition-colors hover:bg-brand-700"
      >
        {title}
        <ChevronDown className={cn('h-5 w-5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-5 border border-t-0 border-slate-200 bg-white p-5">
          {rows.length === 0 && (
            <p className="text-sm text-slate-500">No entries yet. Add one below.</p>
          )}

          {rows.map((row, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    {f.type === 'select' ? (
                      <Select
                        options={f.options ?? []}
                        value={row[f.key] ?? ''}
                        onChange={(v) => setCell(i, f.key, v)}
                        placeholder={f.placeholder ?? 'Select'}
                      />
                    ) : f.type === 'date' ? (
                      <DateInput value={row[f.key] ?? ''} onChange={(v) => setCell(i, f.key, v)} />
                    ) : (
                      <TextInput
                        value={row[f.key] ?? ''}
                        onChange={(v) => setCell(i, f.key, v)}
                        placeholder={f.placeholder}
                      />
                    )}
                  </Field>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition-colors hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        </div>
      )}
    </div>
  )
}
