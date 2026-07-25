import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, GraduationCap, UserCog, BookOpen, Database } from 'lucide-react'
import { cn } from '../../lib/cn'
import ImportPanel from './ImportPanel'
import { importEntities, type ImportEntity } from '../../mock/importData'

const TAB_ICON: Record<ImportEntity['key'], typeof Users> = {
  leads: Users,
  students: GraduationCap,
  staff: UserCog,
  courses: BookOpen,
}

export default function ImportPage() {
  const [params, setParams] = useSearchParams()
  const initial = importEntities.find((e) => e.key === params.get('tab'))?.key ?? 'leads'
  const [active, setActive] = useState<ImportEntity['key']>(initial)
  // Bumped after an import so the live counts below re-read from their modules.
  const [, setRev] = useState(0)

  const entity = importEntities.find((e) => e.key === active)!

  const selectTab = (key: ImportEntity['key']) => {
    setActive(key)
    setParams({ tab: key }, { replace: true })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-brand-500" />
        <h1 className="text-xl font-bold text-slate-900">Import</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Bulk-create records from a CSV file. Each tab writes straight into its module.
      </p>

      {/* Tabs */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-slate-200">
        {importEntities.map((e) => {
          const Icon = TAB_ICON[e.key]
          const on = e.key === active
          return (
            <button
              key={e.key}
              onClick={() => selectTab(e.key)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                on ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              <Icon className="h-4 w-4" /> {e.tabLabel}
              <span
                className={cn(
                  'ml-0.5 rounded px-1.5 text-[11px] font-bold',
                  on ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
                )}
              >
                {e.count()}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active panel */}
      <div className="mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{entity.label}</h2>
          <span className="text-xs text-slate-500">
            Currently <span className="font-bold text-slate-700">{entity.count()}</span> {entity.tabLabel.toLowerCase()} in the system
          </span>
        </div>
        <ImportPanel key={entity.key} entity={entity} onImported={() => setRev((n) => n + 1)} />
      </div>
    </div>
  )
}
