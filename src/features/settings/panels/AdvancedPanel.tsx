import { useState } from 'react'
import { Wrench, Database, ExternalLink, RotateCcw, AlertTriangle } from 'lucide-react'
import { Toggle } from '../../cms/components/Toggle'
import { Panel } from './ListEditorPanel'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { settings, setMaintenance } from '../../../mock/settings'

export function AdvancedPanel({ onToast }: { onToast: (msg: string) => void }) {
  const [maintenance, setMaint] = useState(settings.maintenanceMode)
  const [confirmReset, setConfirmReset] = useState(false)

  const reset = () => {
    try {
      localStorage.removeItem('unidest-settings')
    } catch {
      // ignore
    }
    setConfirmReset(false)
    onToast('Settings reset — reloading…')
    window.setTimeout(() => window.location.reload(), 800)
  }

  return (
    <div className="space-y-5">
      <Panel title="Maintenance" description="Take the public site offline while you make changes.">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Wrench className="h-4 w-4 text-slate-400" /> Maintenance mode
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Visitors see a "back soon" page; the admin stays accessible.</p>
          </div>
          <Toggle
            checked={maintenance}
            onChange={(v) => {
              setMaint(v)
              setMaintenance(v)
              onToast(v ? 'Maintenance mode on' : 'Maintenance mode off')
            }}
            label="Maintenance mode"
          />
        </div>
      </Panel>

      <Panel title="Data" description="Back up or restore all of your workspace data.">
        <a
          href="/backups"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-600"
        >
          <Database className="h-4 w-4 text-slate-400" /> Open Backups
          <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
        </a>
        <p className="mt-2 text-xs text-slate-500">Download a full JSON snapshot of every module, or restore from one.</p>
      </Panel>

      <Panel title="Danger Zone" description="Irreversible actions — proceed with care.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3.5">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
              <RotateCcw className="h-4 w-4" /> Reset settings to defaults
            </p>
            <p className="mt-0.5 text-xs text-rose-600/80">Clears only this Settings screen. Module data is untouched.</p>
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
          >
            <AlertTriangle className="h-4 w-4" /> Reset
          </button>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmReset}
        title="Reset settings"
        message="Reset all Settings to their defaults? Your module data (leads, students, etc.) is not affected. The page will reload."
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={reset}
      />
    </div>
  )
}
