import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Toggle } from '../../cms/components/Toggle'
import { Panel } from './ListEditorPanel'
import { settings, moduleRegistry, toggleModule, enabledModuleCount } from '../../../mock/settings'

export function ModulesPanel({ onToast }: { onToast: (msg: string) => void }) {
  const [, setRev] = useState(0)

  return (
    <Panel
      title="Modules"
      description={`Enable or disable modules for your workspace. ${enabledModuleCount()} of ${moduleRegistry.length} enabled.`}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {moduleRegistry.map((m) => {
          const on = settings.modules[m.key]
          return (
            <div key={m.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
              <div>
                <a href={m.route} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-brand-600 hover:underline">
                  {m.label}
                  <ExternalLink className="h-3 w-3 text-slate-300" />
                </a>
                <p className="mt-0.5 text-xs text-slate-500">{on ? 'Visible in the sidebar' : 'Hidden from the sidebar'}</p>
              </div>
              <Toggle
                checked={on}
                onChange={() => {
                  toggleModule(m.key)
                  setRev((n) => n + 1)
                  onToast(`${m.label} ${settings.modules[m.key] ? 'enabled' : 'disabled'}`)
                }}
                label={m.label}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
        Toggling a module updates this workspace preference. Core modules (Dashboard, Staff, User Management, Settings)
        always stay available.
      </div>
    </Panel>
  )
}
