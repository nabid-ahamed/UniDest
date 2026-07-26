import { useParams, useNavigate, Link } from 'react-router-dom'
import { Info, Download, FileText } from 'lucide-react'
import { showSuccessDialog } from '../../store/successDialog'
import { getCmsCountry, universitiesInCountry } from '../../mock/cms'
import { countryDocuments } from '../../mock/student/countryDocs'

export default function StudentCountryInfoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const country = getCmsCountry(Number(id))

  if (!country || country.status === 'Hidden') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Country not found.</p>
        <button
          type="button"
          onClick={() => navigate('/portal/country-info')}
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Country Information
        </button>
      </div>
    )
  }

  const categories = countryDocuments(country.name)
  const uniCount = universitiesInCountry(country.name)

  const download = (title: string) =>
    showSuccessDialog(`"${title}" download has started.`, 'Downloading')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">Country Information</h1>
        <nav className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/portal/country-info" className="hover:text-brand-600">
            Documents
          </Link>
          <span>›</span>
          <span className="font-semibold uppercase text-slate-700">{country.name}</span>
        </nav>
      </div>

      {/* Country intro (from the CMS Countries module) */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
          <Info className="h-10 w-10" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800">{country.heading}</h2>
          <p className="mt-1 text-sm text-slate-600">{country.intro}</p>
          {uniCount > 0 && (
            <p className="mt-2 text-sm font-semibold text-brand-600">
              {uniCount} partner {uniCount === 1 ? 'university' : 'universities'}
            </p>
          )}
        </div>
      </div>

      {/* Documents grouped by category */}
      <div className="space-y-5">
        {categories.map((cat) => (
          <section key={cat.category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
              <Info className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">{cat.category}</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {cat.documents.map((doc) => (
                <li key={doc.title} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <p className="font-semibold text-slate-800 [overflow-wrap:anywhere]">{doc.title}</p>
                      <p className="text-xs text-slate-500">{doc.fileType}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => download(doc.title)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
