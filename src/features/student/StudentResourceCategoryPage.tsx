import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Image, Video, FileArchive, File, GraduationCap } from 'lucide-react'
import { showSuccessDialog } from '../../store/successDialog'
import {
  getResourceCategory,
  resourcesForCategory,
  formatFileSize,
  relatedCourse,
  type ResourceFileType,
} from '../../mock/studentResources'

/** File-type → icon + tint (matches the resource's `fileType`). */
const FILE_ICON: Record<ResourceFileType, { icon: typeof FileText; tint: string }> = {
  pdf: { icon: FileText, tint: 'bg-rose-50 text-rose-600' },
  doc: { icon: FileText, tint: 'bg-blue-50 text-blue-600' },
  image: { icon: Image, tint: 'bg-emerald-50 text-emerald-600' },
  video: { icon: Video, tint: 'bg-violet-50 text-violet-600' },
  zip: { icon: FileArchive, tint: 'bg-amber-50 text-amber-600' },
  other: { icon: File, tint: 'bg-slate-100 text-slate-600' },
}

export default function StudentResourceCategoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const category = getResourceCategory(Number(id))

  if (!category) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Resource collection not found.</p>
        <button
          type="button"
          onClick={() => navigate('/portal/resources')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Resources
        </button>
      </div>
    )
  }

  const files = resourcesForCategory(category.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">Resources</h1>
        <nav className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/portal/resources" className="hover:text-brand-600">
            Resources
          </Link>
          <span>›</span>
          <span className="font-semibold text-slate-700">{category.name}</span>
        </nav>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">{category.name}</h2>
        {category.description && <p className="mt-1 text-sm text-slate-600">{category.description}</p>}
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No files in this collection yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {files.map((r) => {
            const { icon: Icon, tint } = FILE_ICON[r.fileType]
            const course = relatedCourse(r.relatedCourseId)
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 [overflow-wrap:anywhere]">{r.title}</p>
                    <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">
                      {r.fileName} · {formatFileSize(r.fileSize)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Uploaded by {r.uploadedBy} · {r.uploadedAt}
                    </p>
                    {course && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
                        <GraduationCap className="h-3.5 w-3.5" /> {course.title}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showSuccessDialog(`"${r.title}" download has started.`, 'Downloading')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
