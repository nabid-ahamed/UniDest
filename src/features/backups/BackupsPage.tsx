import { useMemo, useRef, useState } from 'react'
import {
  Database,
  Download,
  Upload,
  DatabaseBackup,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  CalendarClock,
  ArrowRight,
} from 'lucide-react'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  listSources,
  buildBackup,
  downloadBackup,
  parseBackup,
  restoreBackup,
  summarizeManifest,
  getLastBackup,
  formatDateTime,
  formatBytes,
  type BackupManifest,
} from '../../mock/backups'

export default function BackupsPage() {
  const [rev, setRev] = useState(0)
  const [lastBackup, setLastBackup] = useState<string | null>(getLastBackup())
  const [pending, setPending] = useState<BackupManifest | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sources = useMemo(() => listSources(), [rev])
  const totalRecords = sources.reduce((n, s) => n + (s.count ?? 0), 0)
  const totalBytes = sources.reduce((n, s) => n + s.bytes, 0)

  const onDownload = () => {
    const manifest = buildBackup()
    downloadBackup(manifest)
    setLastBackup(manifest.generatedAt)
    showToast('Backup downloaded')
  }

  const onPickFile = (file: File | undefined) => {
    if (!file) return
    setRestoreError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setPending(parseBackup(String(reader.result ?? '')))
      } catch (e) {
        setPending(null)
        setRestoreError(e instanceof Error ? e.message : 'Could not read the file.')
      }
    }
    reader.readAsText(file)
  }

  const doRestore = () => {
    if (!pending) return
    const restored = restoreBackup(pending, 'replace')
    setConfirmRestore(false)
    setPending(null)
    if (fileRef.current) fileRef.current.value = ''
    setRev((n) => n + 1)
    setLastBackup(getLastBackup())
    showToast(`Restored ${restored} data set${restored === 1 ? '' : 's'} — reloading…`)
    window.setTimeout(() => window.location.reload(), 900)
  }

  const pendingSummary = pending ? summarizeManifest(pending) : []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Database className="h-5 w-5 text-brand-500" /> Backups
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Snapshot every module's data to a file, and restore it any time.
        </p>
      </div>

      {/* Generate & download */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Generate &amp; download backup</h2>
        <p className="mt-1 text-sm text-slate-500">
          Exports all module data ({sources.length} data sets) as a single JSON file you can keep safe.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Data sets" value={String(sources.length)} icon={DatabaseBackup} />
          <Stat label="Total records" value={totalRecords.toLocaleString()} icon={Database} />
          <Stat label="Snapshot size" value={formatBytes(totalBytes)} icon={Download} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Download className="h-4 w-4" /> Download Backup
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" /> Last backup: <span className="font-semibold text-slate-700">{formatDateTime(lastBackup)}</span>
          </span>
        </div>
      </section>

      {/* What's included */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">What's included</h2>
        <p className="mt-1 text-sm text-slate-500">Live snapshot of each module's stored data.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Storage key</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.storageKey} className="border-b border-slate-100 text-sm">
                  <td className="px-4 py-3">
                    {s.route ? (
                      <a href={s.route} className="inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:text-brand-600 hover:underline">
                        {s.label}
                        {s.kind === 'settings' && <SettingsTag />}
                        <ExternalLink className="h-3 w-3 text-slate-300" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                        {s.label}
                        {s.kind === 'settings' && <SettingsTag />}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.count === null ? <span className="text-slate-400">—</span> : s.count.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatBytes(s.bytes)}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500">{s.storageKey}</code>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    No stored data yet — interact with the modules first.
                  </td>
                </tr>
              )}
            </tbody>
            {sources.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 text-sm font-semibold text-slate-700">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3">{totalRecords.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatBytes(totalBytes)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Restore */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Upload className="h-4 w-4 text-brand-500" /> Restore from backup
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload a previously downloaded backup file. This replaces the matching data in this browser.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" /> Choose backup file
          </button>
          <span className="text-sm text-slate-500">{pending ? 'File ready to restore' : 'No file chosen'}</span>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} />
        </div>

        {restoreError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {restoreError}
          </div>
        )}

        {pending && (
          <div className="mt-4 rounded-lg border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">
                Backup from {formatDateTime(pending.generatedAt)}
              </p>
              <span className="text-xs font-semibold text-slate-500">{pendingSummary.length} data sets</span>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {pendingSummary.map((s) => (
                <span key={s.key} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {s.label}
                  {s.count !== null && <span className="rounded bg-white px-1 text-brand-600">{s.count}</span>}
                </span>
              ))}
            </div>
            <div className="border-t border-slate-100 px-4 py-3">
              <button
                onClick={() => setConfirmRestore(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
              >
                <DatabaseBackup className="h-4 w-4" /> Restore this backup
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Scheduled backups (guidance) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <CalendarClock className="h-4 w-4 text-brand-500" /> Scheduled backups
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          This portal keeps its data in your browser, so backups are on-demand. On a hosted deployment you'd schedule
          server-side dumps — for reference:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>Download a backup here regularly and store the JSON somewhere safe (cloud drive, repo).</span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              For a live database, schedule a nightly dump via cron, e.g.{' '}
              <code className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-rose-600">0 0 * * * mysqldump … &gt; backup.sql</code>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>Keep uploaded files (Media Library, Student Resources) in versioned object storage.</span>
          </li>
        </ul>
      </section>

      <ConfirmDialog
        open={confirmRestore}
        title="Restore backup"
        message="This overwrites the matching data in this browser with the backup's contents. The page will reload. Continue?"
        confirmLabel="Restore"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={doRestore}
      />

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Database }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function SettingsTag() {
  return <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">settings</span>
}
