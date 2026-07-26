import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import { cmsCountries } from '../../mock/cms'

/**
 * "Country Information" — a grid of destination-country cards. Countries come
 * live from the CMS Countries module (mock/cms.ts); hidden ones are excluded,
 * so the portal always matches what the office has published. Matches
 * demo.eductrl.com/cn4/hostcountryinfo.
 */
export default function StudentCountryInfoPage() {
  const navigate = useNavigate()
  const countries = cmsCountries.filter((c) => c.status !== 'Hidden')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">Country Information</h1>
        <p className="mt-1 text-sm text-slate-500">Documents</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {countries.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/portal/country-info/${c.id}`)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-40 items-center justify-center bg-amber-50">
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-400 text-white">
                <Info className="h-12 w-12" />
              </span>
            </div>
            <div className="space-y-2 px-5 py-5 text-center">
              <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">{c.name}</h2>
              <span className="inline-block text-sm font-semibold text-brand-600 group-hover:underline">
                Browse Documents
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
