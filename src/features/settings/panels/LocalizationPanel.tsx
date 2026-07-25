import { useState } from 'react'
import { Save } from 'lucide-react'
import { Panel } from './ListEditorPanel'
import { settings, saveSettings, invoiceCurrencies, dateFormats, timezones, weekStarts } from '../../../mock/settings'

export function LocalizationPanel({ onToast }: { onToast: (msg: string) => void }) {
  const [l, setL] = useState({ ...settings.localization })
  const set = (patch: Partial<typeof l>) => setL((prev) => ({ ...prev, ...patch }))

  const save = () => {
    saveSettings('localization', l)
    onToast('Localization saved')
  }

  return (
    <Panel title="Localization" description="Currency, date and timezone defaults used across the portal.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Default Currency</label>
          <select value={l.currency} onChange={(e) => set({ currency: e.target.value })} className="input">
            {invoiceCurrencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">Shared with the Invoices module.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Date Format</label>
          <select value={l.dateFormat} onChange={(e) => set({ dateFormat: e.target.value })} className="input">
            {dateFormats.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Timezone</label>
          <select value={l.timezone} onChange={(e) => set({ timezone: e.target.value })} className="input">
            {timezones.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Week Starts On</label>
          <select value={l.weekStart} onChange={(e) => set({ weekStart: e.target.value })} className="input">
            {weekStarts.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </Panel>
  )
}
