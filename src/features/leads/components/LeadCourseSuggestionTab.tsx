import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { Lead } from '../../../mock/leads'

interface Suggestion {
  date: string
  file: string
  accepted: string
}

const SUGGESTIONS_KEY = 'unidest-lead-suggestions'
const ALLOWED = ['xls', 'xlsx', 'csv', 'doc', 'docx', 'pdf']

function loadSuggestions(leadId: number): Suggestion[] {
  try {
    const all = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) ?? '{}')
    return Array.isArray(all[leadId]) ? all[leadId] : []
  } catch {
    return []
  }
}

function saveSuggestions(leadId: number, list: Suggestion[]) {
  try {
    const all = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) ?? '{}')
    all[leadId] = list
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(all))
  } catch {
    // Storage blocked — uploads just won't persist.
  }
}

/** Blue section bar used throughout this tab (matches the reference). */
function Bar({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-brand-600 px-4 py-2.5 font-bold text-white">{children}</div>
}

/** "Course Suggestion" tab of the lead detail page. */
export function LeadCourseSuggestionTab({
  lead,
  onToast,
}: {
  lead: Lead
  onToast: (msg: string) => void
}) {
  const [title, setTitle] = useState('')
  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState<{ title?: string; file?: string }>({})
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => loadSuggestions(lead.id))
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = () => {
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Please enter a title.'
    if (!fileName) next.file = 'Please choose a file.'
    else {
      const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
      if (!ALLOWED.includes(ext)) next.file = `Only ${ALLOWED.join('/')} files are allowed.`
    }
    setErrors(next)
    if (Object.keys(next).length) return

    const date = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date())
    const entry: Suggestion = { date, file: `${title.trim()} — ${fileName}`, accepted: '--' }
    const list = [entry, ...suggestions]
    setSuggestions(list)
    saveSuggestions(lead.id, list)
    setTitle('')
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
    onToast('Course suggestion shared with the student')
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <section className="space-y-4">
        <Bar>Share course suggestions to student</Bar>
        <p className="text-sm font-semibold text-slate-700">Upload Document</p>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_1.2fr_auto]">
          <div>
            <label htmlFor="cs-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="cs-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setErrors((p) => ({ ...p, title: undefined }))
              }}
              className={cn(
                'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
                errors.title
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/30',
              )}
            />
            {errors.title && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                {errors.title}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="cs-file" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Select File <span className="text-rose-600">*</span>
            </label>
            <input
              id="cs-file"
              ref={fileRef}
              type="file"
              accept=".xls,.xlsx,.csv,.doc,.docx,.pdf"
              onChange={(e) => {
                setFileName(e.target.files?.[0]?.name ?? '')
                setErrors((p) => ({ ...p, file: undefined }))
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
            />
            <p className="mt-1.5 text-xs text-slate-500">Allowed: xls/xlsx/csv/doc/docx/pdf</p>
            {errors.file && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                {errors.file}
              </p>
            )}
          </div>
          <div className="lg:pt-7">
            <button
              type="button"
              onClick={upload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Upload className="h-4 w-4" /> Upload
            </button>
          </div>
        </div>
      </section>

      {/* Previous suggestions */}
      <section className="space-y-4">
        <Bar>Previous Course Suggestions</Bar>
        <table className="w-full border border-slate-200">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">File</th>
              <th className="px-4 py-2.5">Accepted?</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.length > 0 ? (
              suggestions.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 text-sm odd:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                    {s.date}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 [overflow-wrap:anywhere]">
                    {s.file}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.accepted}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-sm text-slate-600">
                  Record Not Found!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Course finder suggestions */}
      <section className="space-y-4">
        <Bar>Course Finder Suggestions/ Student Bookmarked</Bar>
        <p className="text-sm text-slate-600">
          You can search for a course in course finder and suggest to student{' '}
          <button
            type="button"
            onClick={() => onToast('Course Finder — coming soon')}
            className="font-medium text-brand-600 hover:underline"
          >
            Open Course Finder
          </button>
        </p>
        <table className="w-full border border-slate-200">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-left text-sm font-semibold text-slate-700">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Course</th>
              <th className="px-4 py-2.5">Accepted?</th>
              <th className="px-4 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-600">
                No suggestions yet!
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <p className="border-t border-slate-200 pt-4 text-sm text-slate-500">
        <span className="font-semibold text-slate-600">Created At:</span> {lead.created} ·{' '}
        <span className="font-semibold text-slate-600">Last Updated:</span> {lead.created}
      </p>
    </div>
  )
}
