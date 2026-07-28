import { useState } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'

export function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-800">{value ?? '-'}</p>
    </div>
  )
}

export function DetailGrid({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <Detail key={label} label={label} value={value} />
      ))}
    </div>
  )
}

/**
 * Records table with a Create button. Pass `rows` (cell arrays matching
 * `headers`) to render records; omit or leave empty for the "No Records Found"
 * state. Optional `onDelete(rowIndex)` adds a trailing remove action per row.
 */
export function RecordsSection({
  title,
  headers,
  rows,
  onCreate,
  onDelete,
}: {
  title: string
  headers: string[]
  rows?: (string | number)[][]
  onCreate: () => void
  onDelete?: (rowIndex: number) => void
}) {
  const hasRows = !!rows && rows.length > 0
  const colSpan = headers.length + (onDelete ? 1 : 0)
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <PlusCircle className="h-4 w-4" /> Create
        </button>
      </div>
      <table className="mt-4 w-full border border-slate-200">
        <thead>
          <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-700">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5">
                {h}
              </th>
            ))}
            {onDelete && <th className="px-4 py-2.5" />}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            rows!.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 [overflow-wrap:anywhere]">
                    {cell}
                  </td>
                ))}
                {onDelete && (
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(i)}
                      aria-label="Remove record"
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr className="bg-slate-50 text-sm text-slate-500">
              <td colSpan={colSpan} className="px-4 py-3 text-center">
                No Records Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}

interface Note {
  text: string
  at: string
}

function loadNotes(storageKey: string, id: number): Note[] {
  try {
    const all = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    return Array.isArray(all[id]) ? all[id] : []
  } catch {
    return []
  }
}

function saveNotes(storageKey: string, id: number, notes: Note[]) {
  try {
    const all = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    all[id] = notes
    localStorage.setItem(storageKey, JSON.stringify(all))
  } catch {
    // Storage blocked — notes just won't persist.
  }
}

/** Staff-only notes, persisted per record in localStorage. */
export function ConfidentialNotes({
  id,
  storageKey = 'unidest-lead-notes',
  onSaved,
}: {
  id: number
  storageKey?: string
  onSaved: () => void
}) {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes(storageKey, id))
  const [draft, setDraft] = useState('')

  const save = () => {
    const text = draft.trim()
    if (!text) return
    const at = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(),
    )
    const next = [{ text, at }, ...notes]
    setNotes(next)
    saveNotes(storageKey, id, next)
    setDraft('')
    onSaved()
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200">
      <h2 className="bg-brand-600 px-4 py-3 font-bold text-white">Confidential Notes</h2>
      <div className="space-y-3 p-4">
        <p className="text-sm text-slate-600">This notes is visible to staff only</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder="Write your notes here..."
          aria-label="Confidential note"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="flex justify-end">
          <button
            onClick={save}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Save
          </button>
        </div>
        {notes.length > 0 ? (
          <ul className="space-y-2">
            {notes.map((n, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-700">{n.text}</p>
                <p className="mt-1 text-xs text-slate-400">{n.at}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-500">
            No Notes Found!
          </div>
        )}
      </div>
    </section>
  )
}
