import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Settings as SettingsIcon, ArrowRight, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  settings,
  settingsSections,
  addBranch,
  removeBranch,
  addStudyLevel,
  removeStudyLevel,
  pendingSetupSteps,
  type SettingsSectionId,
} from '../../mock/settings'
import { GeneralPanel } from './panels/GeneralPanel'
import { LocalizationPanel } from './panels/LocalizationPanel'
import { ModulesPanel } from './panels/ModulesPanel'
import { NotificationsPanel } from './panels/NotificationsPanel'
import { AdvancedPanel } from './panels/AdvancedPanel'
import { ListEditorPanel } from './panels/ListEditorPanel'

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const initial = settingsSections.find((s) => s.id === params.get('tab'))?.id ?? 'general'
  const [active, setActive] = useState<SettingsSectionId>(initial)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const select = (id: SettingsSectionId) => {
    setActive(id)
    setParams({ tab: id }, { replace: true })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pending = useMemo(() => pendingSetupSteps(), [toast])

  return (
    <div className="space-y-5">
      {/* Master Setup banner */}
      {pending.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-amber-800">Master Setup</p>
            <p className="mt-0.5 text-sm text-amber-700">
              You have {pending.length} pending step{pending.length === 1 ? '' : 's'}: {pending.join(' · ')}
            </p>
          </div>
          <button
            onClick={() => select('general')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Complete Steps <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <SettingsIcon className="h-5 w-5 text-brand-500" /> Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">Configure your workspace — profile, branches, modules and more.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* Settings nav */}
        <nav className="lg:sticky lg:top-20 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
            {settingsSections.map((s) => {
              const on = s.id === active
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    onClick={() => select(s.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                      on ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {s.label}
                    <ChevronRight className={cn('hidden h-4 w-4 lg:block', on ? 'text-white/80' : 'text-slate-300')} />
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Active panel */}
        <div className="min-w-0">
          {active === 'general' && <GeneralPanel onToast={showToast} />}
          {active === 'branches' && (
            <ListEditorPanel
              title="Branches"
              description="Your office branches — used across Staff, Users, Leads and Import."
              items={settings.branches}
              placeholder="e.g. Rajshahi"
              onAdd={addBranch}
              onRemove={removeBranch}
              onToast={showToast}
              connectedNote={
                <span>
                  Branches appear in branch pickers throughout <a href="/staff" className="font-semibold text-brand-600 hover:underline">Staff</a>,{' '}
                  <a href="/user-management" className="font-semibold text-brand-600 hover:underline">User Management</a> and{' '}
                  <a href="/import" className="font-semibold text-brand-600 hover:underline">Import</a>.
                </span>
              }
            />
          )}
          {active === 'study-levels' && (
            <ListEditorPanel
              title="Study Levels"
              description="Levels offered — used in Leads, Students, Courses and Import."
              items={settings.studyLevels}
              placeholder="e.g. Certificate"
              onAdd={addStudyLevel}
              onRemove={removeStudyLevel}
              onToast={showToast}
              connectedNote={
                <span>
                  Study levels are selectable in <a href="/leads" className="font-semibold text-brand-600 hover:underline">Leads</a>,{' '}
                  <a href="/students" className="font-semibold text-brand-600 hover:underline">Students</a> and{' '}
                  <a href="/courses" className="font-semibold text-brand-600 hover:underline">Course Management</a>.
                </span>
              }
            />
          )}
          {active === 'localization' && <LocalizationPanel onToast={showToast} />}
          {active === 'modules' && <ModulesPanel onToast={showToast} />}
          {active === 'notifications' && <NotificationsPanel onToast={showToast} />}
          {active === 'advanced' && <AdvancedPanel onToast={showToast} />}
        </div>
      </div>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
