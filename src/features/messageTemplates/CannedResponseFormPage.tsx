import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Toggle } from '../cms/components/Toggle'
import { getCanned, addCanned, updateCanned } from '../../mock/messageTemplates'

export default function CannedResponseFormPage() {
  const { id } = useParams()
  const editing = id != null
  const existing = editing ? getCanned(Number(id)) : undefined

  const [type, setType] = useState(existing?.type ?? '')
  const [details, setDetails] = useState(existing?.details ?? '')
  const [enabled, setEnabled] = useState(existing?.enabled ?? true)
  const [responses, setResponses] = useState<string[]>(existing?.responses.length ? existing.responses : [''])
  const [error, setError] = useState('')

  if (editing && !existing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Canned response not found.</p>
        <a href="/message-templates/canned" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Canned Responses
        </a>
      </div>
    )
  }

  const setResponse = (i: number, val: string) =>
    setResponses((prev) => prev.map((r, idx) => (idx === i ? val : r)))
  const addResponse = () => setResponses((prev) => [...prev, ''])
  const removeResponse = (i: number) => setResponses((prev) => prev.filter((_, idx) => idx !== i))

  const onSave = () => {
    if (!type.trim()) {
      setError('Type is required.')
      return
    }
    const cleaned = responses.map((r) => r.trim()).filter(Boolean)
    if (cleaned.length === 0) {
      setError('Add at least one reply.')
      return
    }
    if (editing && existing) {
      updateCanned(existing.id, { type, details, enabled, responses: cleaned })
    } else {
      addCanned({ type, details, enabled, responses: cleaned })
    }
    window.location.href = '/message-templates/canned'
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{editing ? 'Edit' : 'Add'} Canned Response</h1>
        <a
          href="/message-templates/canned"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
      )}

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-semibold text-slate-700">Type *</label>
          <input id="type" value={type} onChange={(e) => setType(e.target.value)} className="input" placeholder="e.g. Live Chat Greetings" />
        </div>
        <div>
          <label htmlFor="details" className="mb-1 block text-sm font-semibold text-slate-700">Details</label>
          <input id="details" value={details} onChange={(e) => setDetails(e.target.value)} className="input" placeholder="When agents should use this group" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">Quick Replies</label>
            <button onClick={addResponse} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
              <Plus className="h-4 w-4" /> Add reply
            </button>
          </div>
          <div className="space-y-2">
            {responses.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  value={r}
                  onChange={(e) => setResponse(i, e.target.value)}
                  rows={2}
                  className="input resize-y"
                  placeholder={`Reply ${i + 1}`}
                />
                <button
                  onClick={() => removeResponse(i)}
                  disabled={responses.length === 1}
                  aria-label="Remove reply"
                  className="mt-1 shrink-0 rounded-md border border-slate-200 p-2 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <Toggle checked={enabled} onChange={setEnabled} label="Enabled" />
          <span className="text-sm font-medium text-slate-700">{enabled ? 'Enabled' : 'Disabled'}</span>
        </div>

        <button
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Save className="h-4 w-4" /> {editing ? 'Save Changes' : 'Create'}
        </button>
      </div>
    </div>
  )
}
