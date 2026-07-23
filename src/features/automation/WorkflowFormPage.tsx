import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import {
  workflowTypes,
  workflowModes,
  audienceTargets,
  statusOptionsFor,
  allCountries,
  matchedUsers,
  addWorkflow,
  type WorkflowType,
  type WorkflowMode,
  type AudienceTarget,
  type WorkflowStep,
} from '../../mock/automation'

const TIME_OPTS = Array.from({ length: 12 }, (_, i) => `${(i + 1).toString().padStart(2, '0')}:00`)

export default function WorkflowFormPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<WorkflowType | ''>('')
  const [mode, setMode] = useState<WorkflowMode>('Email')
  const [time, setTime] = useState('10:00')
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM')
  const [target, setTarget] = useState<AudienceTarget>('Leads')
  const [status, setStatus] = useState('')
  const [country, setCountry] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([{ schedule: 'On: (today)', message: '' }])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const matched = useMemo(
    () => matchedUsers({ target, status, country }),
    [target, status, country],
  )

  const updateStep = (i: number, patch: Partial<WorkflowStep>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))

  const submit = () => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Please enter a title.'
    if (!type) next.type = 'Please choose a workflow type.'
    if (!steps.some((s) => s.message.trim())) next.steps = 'Add at least one message.'
    setErrors(next)
    if (Object.keys(next).length) return

    const wf = addWorkflow({
      title: title.trim(),
      type: type as WorkflowType,
      mode,
      at: `${time} ${meridiem}`,
      created: 'Just now',
      status: 'Active',
      audience: { target, status, country },
      steps: steps.filter((s) => s.message.trim()),
      history: [],
    })
    navigate(`/automation/workflow/${wf.id}`)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Add New Workflow</h1>
        <a
          href="/automation"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
      </div>

      <div className="mt-6 max-w-3xl space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="wf-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Title <span className="text-rose-600">*</span>
          </label>
          <input
            id="wf-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setErrors((p) => ({ ...p, title: '' }))
            }}
            className={cn('input', errors.title && 'border-rose-500')}
          />
          {errors.title && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.title}
            </p>
          )}
        </div>

        {/* Workflow type */}
        <div>
          <label htmlFor="wf-type" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Workflow Type <span className="text-rose-600">*</span>
          </label>
          <select
            id="wf-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as WorkflowType)
              setErrors((p) => ({ ...p, type: '' }))
            }}
            className={cn('input', errors.type && 'border-rose-500')}
          >
            <option value="">Select</option>
            {workflowTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {errors.type && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.type}
            </p>
          )}
        </div>

        {/* Send + At */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Send *">
            <select value={mode} onChange={(e) => setMode(e.target.value as WorkflowMode)} className="input">
              {workflowModes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="At *">
            <select value={time} onChange={(e) => setTime(e.target.value)} className="input">
              {TIME_OPTS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="&nbsp;">
            <select
              value={meridiem}
              onChange={(e) => setMeridiem(e.target.value as 'AM' | 'PM')}
              className="input"
              aria-label="AM or PM"
            >
              <option>AM</option>
              <option>PM</option>
            </select>
          </Field>
        </div>

        {/* Target audience */}
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3">
          <Field label="Target Audience">
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as AudienceTarget)
                setStatus('')
              }}
              className="input"
            >
              {audienceTargets.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              <option value="">- Any -</option>
              {statusOptionsFor(target).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Country Interested">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input">
              <option value="">- Any -</option>
              {allCountries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <p className="text-sm text-slate-500 sm:col-span-3">
            Matched Users: <span className="font-semibold text-brand-600">{matched}</span>
          </p>
        </div>

        {/* Message steps */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Messages <span className="text-rose-600">*</span>
            </label>
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, { schedule: `After ${prev.length} Day(s)`, message: '' }])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            >
              <Plus className="h-4 w-4" /> Add Message
            </button>
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center">
                <input
                  value={step.schedule}
                  onChange={(e) => updateStep(i, { schedule: e.target.value })}
                  placeholder="On: 01-01-2026 / After 3 Day(s)"
                  aria-label={`Message ${i + 1} schedule`}
                  className="input sm:w-56"
                />
                <input
                  value={step.message}
                  onChange={(e) => {
                    updateStep(i, { message: e.target.value })
                    setErrors((p) => ({ ...p, steps: '' }))
                  }}
                  placeholder="Message content"
                  aria-label={`Message ${i + 1} content`}
                  className="input flex-1"
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Remove message"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.steps && (
            <p role="alert" className="mt-1.5 text-sm text-rose-600">
              {errors.steps}
            </p>
          )}
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={submit}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  )
}
