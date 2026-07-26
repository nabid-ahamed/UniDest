import { useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { resourceCategories, resourceCountForCategory } from '../../mock/studentResources'

/**
 * "Resources" — a grid of resource-collection cards. Collections come live from
 * the admin Student Resources module (`resourceCategories`), and each card shows
 * its live file count. Matches demo.eductrl.com/cn4/resources.
 */
export default function StudentResourcesPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Resources</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {resourceCategories.map((cat) => {
          const count = resourceCountForCategory(cat.id)
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/portal/resources/${cat.id}`)}
              className="group flex min-h-[11rem] flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Layers className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-800 group-hover:text-brand-700 [overflow-wrap:anywhere]">
                {cat.name}
              </h2>
              <p className="mt-auto pt-3 text-sm text-slate-500">
                {count} {count === 1 ? 'file' : 'files'}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
