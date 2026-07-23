import { useMemo, useRef, useState } from 'react'
import {
  Search,
  Plus,
  ListTree,
  UploadCloud,
  Copy,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  FileArchive,
  File as FileIcon,
  Link2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { ExportButtons } from '../../components/ExportButtons'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  studentResources,
  resourceCategories,
  categoryName,
  addResource,
  deleteResource,
  relatedCourse,
  allowedExtensions,
  maxFileMb,
  fileExtension,
  fileTypeOf,
  formatFileSize,
  mockFileUrl,
  type StudentResource,
  type ResourceFileType,
} from '../../mock/studentResources'
import { courses } from '../../mock/courseManagement'
import { staff } from '../../mock/staff'

const FILE_ICON: Record<ResourceFileType, { icon: typeof FileText; className: string }> = {
  pdf: { icon: FileText, className: 'bg-rose-50 text-rose-600' },
  doc: { icon: FileText, className: 'bg-sky-50 text-sky-600' },
  image: { icon: ImageIcon, className: 'bg-emerald-50 text-emerald-600' },
  video: { icon: Video, className: 'bg-violet-50 text-violet-600' },
  zip: { icon: FileArchive, className: 'bg-amber-50 text-amber-600' },
  other: { icon: FileIcon, className: 'bg-slate-100 text-slate-500' },
}

// A logged-in admin would be the uploader; use the first Super Admin as "me".
const currentUser = staff.find((s) => s.role === 'Super Admin')?.name ?? staff[0]?.name ?? 'Admin'

export default function StudentResourcesPage() {
  const [rev, setRev] = useState(0)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [confirm, setConfirm] = useState<StudentResource | null>(null)
  const [toast, setToast] = useState('')

  // Add-resource form state.
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [relatedCourseId, setRelatedCourseId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return studentResources
      .filter((r) => !catFilter || String(r.categoryId) === catFilter)
      .filter(
        (r) => !q || `${r.title} ${categoryName(r.categoryId)} ${r.fileName} ${r.uploadedBy}`.toLowerCase().includes(q),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, catFilter, rev])

  const onFile = (f: File | null) => {
    setErrors((p) => ({ ...p, file: '' }))
    if (!f) {
      setFile(null)
      return
    }
    const ext = fileExtension(f.name)
    if (!allowedExtensions.includes(ext)) {
      setErrors((p) => ({ ...p, file: `Unsupported type ".${ext || '?'}". Allowed: ${allowedExtensions.join(', ')}` }))
      setFile(null)
      return
    }
    if (f.size > maxFileMb * 1024 * 1024) {
      setErrors((p) => ({ ...p, file: `File is too large (max ${maxFileMb} MB).` }))
      setFile(null)
      return
    }
    setFile(f)
  }

  const resetForm = () => {
    setTitle('')
    setCategoryId('')
    setRelatedCourseId('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const upload = () => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Please enter a title.'
    if (!categoryId) next.category = 'Please choose a category.'
    if (!file) next.file = next.file || 'Please choose a file to upload.'
    setErrors(next)
    if (Object.keys(next).length || !file) return

    addResource({
      title: title.trim(),
      categoryId: Number(categoryId),
      fileName: file.name,
      fileType: fileTypeOf(file.name),
      fileSize: file.size,
      fileUrl: mockFileUrl(file.name),
      relatedCourseId: relatedCourseId ? Number(relatedCourseId) : null,
      uploadedBy: currentUser,
      uploadedAt: today(),
    })
    resetForm()
    setRev((n) => n + 1)
    showToast('Resource uploaded')
  }

  const copyLink = (url: string) => {
    navigator.clipboard?.writeText(url)
    showToast('Link copied')
  }

  const exportHeader = ['Title', 'Category', 'Related Course', 'File', 'Size', 'Uploaded By', 'Date', 'URL']
  const exportRows = filtered.map((r) => [
    r.title,
    categoryName(r.categoryId),
    relatedCourse(r.relatedCourseId)?.title ?? '—',
    r.fileName,
    formatFileSize(r.fileSize),
    r.uploadedBy,
    r.uploadedAt,
    r.fileUrl,
  ])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Resources</h1>
          <p className="mt-1 text-sm text-slate-500">Documents shared with all students in the portal.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/student-resources/categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ListTree className="h-4 w-4" /> Categories
          </a>
          <a
            href="/student-resources/categories?create=1"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Create Category
          </a>
        </div>
      </div>

      {/* Add new resource */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Add New Resource</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="sr-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="sr-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })) }}
              placeholder="Resource title"
              className={cn('input', errors.title && 'border-rose-500')}
            />
            {errors.title && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.title}</p>}
          </div>
          <div>
            <label htmlFor="sr-cat" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Category <span className="text-rose-600">*</span>
            </label>
            <select
              id="sr-cat"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setErrors((p) => ({ ...p, category: '' })) }}
              className={cn('input', errors.category && 'border-rose-500')}
            >
              <option value="">Select Category</option>
              {resourceCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="sr-course" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Related Course <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              id="sr-course"
              value={relatedCourseId}
              onChange={(e) => setRelatedCourseId(e.target.value)}
              className="input"
            >
              <option value="">None</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title} — {c.university}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Document <span className="text-rose-600">*</span>
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedExtensions.map((e) => `.${e}`).join(',')}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className={cn(
                'block w-full cursor-pointer rounded-lg border text-sm text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700',
                errors.file ? 'border-rose-500' : 'border-slate-300',
              )}
            />
            {file && !errors.file && (
              <p className="mt-1 text-xs text-slate-500">
                {file.name} · {formatFileSize(file.size)}
              </p>
            )}
            {errors.file && <p role="alert" className="mt-1.5 text-sm text-rose-600">{errors.file}</p>}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Maximum file size: {maxFileMb} MB · Allowed types: {allowedExtensions.map((e) => `.${e}`).join(', ')}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={upload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <UploadCloud className="h-4 w-4" /> Upload
          </button>
          <p className="text-xs text-slate-400">Uploaded documents are visible to all students under Student Menu → Resources.</p>
        </div>
      </div>

      {/* All resources */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">
            All Student Resources <span className="ml-1 text-sm font-semibold text-slate-400">({filtered.length})</span>
          </h2>
          <ExportButtons title="Student Resources" filename="student-resources" header={exportHeader} rows={exportRows} onDone={showToast} />
        </div>

        {/* Filter + search */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input sm:w-64">
            <option value="">All Categories</option>
            {resourceCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources..."
              aria-label="Search resources"
              className="input w-full pl-9"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Related Course</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3">File URL</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const meta = FILE_ICON[r.fileType]
                const course = relatedCourse(r.relatedCourseId)
                return (
                  <tr key={r.id} className="border-b border-slate-100 align-top text-sm">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.className)} aria-hidden="true">
                          <meta.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 [overflow-wrap:anywhere]">{r.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {r.fileName} · {formatFileSize(r.fileSize)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {categoryName(r.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {course ? (
                        <a href={`/courses/${course.id}`} className="text-brand-600 hover:underline [overflow-wrap:anywhere]">
                          {course.title}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {r.uploadedBy}
                      <span className="mt-0.5 block text-xs text-slate-400">{r.uploadedAt}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex max-w-[220px] items-center gap-1.5 truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
                          <Link2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{r.fileUrl}</span>
                        </span>
                        <button
                          onClick={() => copyLink(r.fileUrl)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={r.fileName}
                          className="inline-flex items-center gap-1 rounded-md bg-sky-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-600"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                        <button
                          onClick={() => setConfirm(r)}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    No resources found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Delete resource"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteResource(confirm.id)
            showToast('Resource deleted')
            setConfirm(null)
            setRev((n) => n + 1)
          }
        }}
      />

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

/** Today formatted like the seed dates, e.g. "23 Jul 2026". */
function today(): string {
  const d = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}
