import { useRef, useState } from 'react'
import { Download, UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  buildSampleCsv,
  parseCsv,
  buildPreview,
  runImport,
  type ImportEntity,
  type ImportPreview,
} from '../../mock/importData'

const PREVIEW_LIMIT = 8

/** One entity's import workflow: rules → sample → upload → preview → import. */
export default function ImportPanel({ entity, onImported }: { entity: ImportEntity; onImported: () => void }) {
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [branch, setBranch] = useState('')
  const [autoPassword, setAutoPassword] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const branches = entity.columns.find((c) => c.field === 'branch')?.enumValues ?? []
  const enumRules = entity.columns.filter((c) => c.enumValues && c.enumValues.length)
  const mandatory = entity.columns.filter((c) => c.required).map((c) => c.header)

  const reset = () => {
    setFileName('')
    setPreview(null)
    setResult(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const onPickFile = (file: File | undefined) => {
    if (!file) return
    setResult(null)
    setError('')
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a .csv file.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ''))
      const pv = buildPreview(entity, parsed)
      setPreview(pv)
      if (!pv.headerOk) setError(`Missing required column(s): ${pv.missingHeaders.join(', ')}`)
    }
    reader.readAsText(file)
  }

  const downloadSample = () => {
    const csv = buildSampleCsv(entity)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entity.key}-sample.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const doImport = () => {
    if (!preview || !preview.headerOk || preview.validCount === 0) return
    const added = runImport(entity, preview, { branch: branch || undefined, autoPassword })
    setResult(added)
    setPreview(null)
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
    onImported()
  }

  return (
    <div className="space-y-5">
      {/* Format rules */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-sm font-semibold text-rose-600">
          The data file must be in "CSV UTF-8 (Comma delimited) (*.csv)" format
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
          Data must be formatted as in the sample file.
          <button onClick={downloadSample} className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
            <Download className="h-3.5 w-3.5" /> Download Sample File
          </button>
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-600">
          <li>The header row must match the sample file.</li>
          <li>
            Mandatory columns: <span className="font-semibold">{mandatory.join(', ')}</span>. Other columns can be left
            blank.
          </li>
          {enumRules.map((c) => (
            <li key={c.field}>
              Valid values for '{c.header}': <span className="font-semibold">{c.enumValues!.join(', ')}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* File picker */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Select {entity.fileNoun} data file (.csv)</label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <UploadCloud className="h-4 w-4" /> Choose File
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            {fileName ? <FileText className="h-4 w-4 text-brand-500" /> : null}
            {fileName || 'No file chosen'}
          </span>
          {fileName && (
            <button onClick={reset} className="text-slate-400 hover:text-rose-600" aria-label="Clear file">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Options */}
      {(entity.branchOption || entity.passwordOption) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {entity.branchOption && (
            <div>
              <label htmlFor={`branch-${entity.key}`} className="mb-1 block text-sm font-semibold text-slate-700">
                Assign to Branch
              </label>
              <select id={`branch-${entity.key}`} value={branch} onChange={(e) => setBranch(e.target.value)} className="input">
                <option value="">Use branch from file</option>
                {branches.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
          {entity.passwordOption && (
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-600 sm:pb-0 sm:pt-7">
              <input
                type="checkbox"
                checked={autoPassword}
                onChange={(e) => setAutoPassword(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Auto-generate password &amp; email to {entity.fileNoun}s
            </label>
          )}
        </div>
      )}

      {/* Preview */}
      {preview && preview.headerOk && (
        <div className="rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">Preview</p>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> {preview.validCount} valid
              </span>
              {preview.errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> {preview.errorCount} with errors
                </span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-brand-50/60 text-left font-semibold text-slate-700">
                  <th className="px-3 py-2">#</th>
                  {entity.columns.map((c) => (
                    <th key={c.field} className="px-3 py-2 whitespace-nowrap">{c.header}</th>
                  ))}
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, PREVIEW_LIMIT).map((r, i) => (
                  <tr key={i} className={cn('border-t border-slate-100', !r.valid && 'bg-rose-50/40')}>
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    {entity.columns.map((c) => (
                      <td key={c.field} className="px-3 py-2 text-slate-600 [overflow-wrap:anywhere]">{r.values[c.field] || '—'}</td>
                    ))}
                    <td className="px-3 py-2">
                      {r.valid ? (
                        <span className="text-emerald-600">OK</span>
                      ) : (
                        <span className="text-xs text-rose-600" title={r.errors.join('; ')}>{r.errors[0]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rows.length > PREVIEW_LIMIT && (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
              Showing first {PREVIEW_LIMIT} of {preview.rows.length} rows.
            </p>
          )}
        </div>
      )}

      {/* Result */}
      {result !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Imported {result} {entity.fileNoun}
            {result === 1 ? '' : 's'} into {entity.tabLabel}.
          </p>
          <a href={entity.route} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
            View in {entity.tabLabel} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Import button */}
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          onClick={doImport}
          disabled={!preview || !preview.headerOk || preview.validCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UploadCloud className="h-4 w-4" /> Import{preview?.validCount ? ` ${preview.validCount}` : ''}
        </button>
      </div>
    </div>
  )
}
