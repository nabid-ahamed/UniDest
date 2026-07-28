import { useMemo, useRef, useState } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import { buildZip, type ZipEntry } from '../../lib/zip'
import { currentStudent } from '../../mock/student/portal'
import {
  DOC_GROUPS,
  COURSE_DOC_SECTIONS,
  loadDocUploads,
  setDocUpload,
  loadCourseRows,
  loadDocsCompleted,
  setDocsCompleted,
  type DocRequirement,
  type CourseDocSection,
} from '../../mock/student/studentDocs'

/**
 * "Documents / Certificates" tab — faithful to
 * demo.eductrl.com/cn4/admin/auth/user/:id (Documents). A course-preference
 * warning banner, a "Download all docs as Zip" action, then grouped two-column
 * tables (Document | Upload New File) for each requirement set, followed by
 * per-course SOP / Essay / CV upload tables and a completion checkbox. Uploaded
 * file names persist per student. Shared by the admin view and the portal.
 */
export function StudentDocumentsTab({
  studentId,
  onToast,
}: {
  /** Whose documents to show. Defaults to the signed-in portal student. */
  studentId?: number
  onToast: (msg: string) => void
}) {
  const sid = studentId ?? currentStudent().id
  const [uploads, setUploads] = useState<Record<string, string[]>>(() => loadDocUploads(sid))
  const [completed, setCompleted] = useState(() => loadDocsCompleted(sid))
  const courseRows = loadCourseRows(sid)

  // One shared hidden input, retargeted per requirement.
  const inputRef = useRef<HTMLInputElement>(null)
  const pending = useRef<{ key: string; multiple: boolean } | null>(null)
  const [accept, setAccept] = useState('')

  const pickFile = (req: { key: string; accept: string; multiple?: boolean }) => {
    pending.current = { key: req.key, multiple: !!req.multiple }
    setAccept(req.accept)
    // Ensure the accept attr is applied before the dialog opens.
    requestAnimationFrame(() => inputRef.current?.click())
  }

  const onFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const target = pending.current
    pending.current = null
    if (!files.length || !target) return
    const names = files.map((f) => f.name)
    const next = target.multiple ? [...(uploads[target.key] ?? []), ...names] : names
    setUploads(setDocUpload(sid, target.key, next))
    onToast(names.length > 1 ? `${names.length} files uploaded` : `"${names[0]}" uploaded`)
  }

  const removeFile = (key: string, idx: number) => {
    const next = (uploads[key] ?? []).filter((_, i) => i !== idx)
    setUploads(setDocUpload(sid, key, next))
    onToast('File removed')
  }

  const toggleCompleted = () => {
    const next = !completed
    setCompleted(next)
    setDocsCompleted(sid, next)
    onToast(next ? 'Marked as completed' : 'Marked as incomplete')
  }

  // Flatten every uploaded file for the "Download all docs as Zip" manifest.
  const uploadedCount = useMemo(
    () => Object.values(uploads).reduce((n, arr) => n + arr.length, 0),
    [uploads],
  )

  /**
   * "Download all docs as Zip": bundles every uploaded document into a real .zip
   * (built client-side, no library). The mock stores file names only, so each
   * entry is a placeholder text file plus a top-level manifest — swap the
   * placeholder content for the real file bytes when the upload backend lands.
   */
  const downloadAll = () => {
    if (uploadedCount === 0) return onToast('No documents uploaded yet')
    const labelFor = (key: string) => {
      for (const g of DOC_GROUPS) {
        const r = g.requirements.find((x) => x.key === key)
        if (r) return r.title
      }
      const cs = COURSE_DOC_SECTIONS.find((s) => key.startsWith(`${s.key}-`))
      return cs ? `${cs.title} (course ${Number(key.split('-').pop()) + 1})` : key
    }

    const entries: ZipEntry[] = []
    const manifest = ['Documents / Certificates', '========================', '']
    const used = new Set<string>()
    for (const [key, files] of Object.entries(uploads)) {
      if (!files.length) continue
      const label = labelFor(key)
      manifest.push(`${label}:`)
      files.forEach((f) => {
        manifest.push(`  - ${f}`)
        // One folder per document group; de-dupe names so the zip stays valid.
        let name = `${label.replace(/[\\/:*?"<>|]/g, '-')}/${f}`
        while (used.has(name)) name = name.replace(/(\.[^.]*)?$/, ' (copy)$1')
        used.add(name)
        entries.push({ name, content: `Placeholder for "${f}" — file bytes are stored in Phase 2.` })
      })
      manifest.push('')
    }
    entries.unshift({ name: 'manifest.txt', content: manifest.join('\n') })

    const url = URL.createObjectURL(buildZip(entries))
    const a = document.createElement('a')
    a.href = url
    a.download = `student-${sid}-documents.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    onToast(`Downloaded ${uploadedCount} document(s) as zip`)
  }

  return (
    <div className="space-y-6">
      {/* Course-preference warning banner (shown when no programs are selected). */}
      {courseRows.length === 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Student Course Preferences is pending
        </div>
      )}

      {/* Header + download all */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800">Documents / Certificates</h2>
        <button
          type="button"
          onClick={downloadAll}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Download className="h-4 w-4" /> Download all docs as Zip
        </button>
      </div>

      {/* Requirement groups — each a two-column table */}
      {DOC_GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">{group.title}</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="w-1/3 px-4 py-3">Document</th>
                  <th className="px-4 py-3">Upload</th>
                </tr>
              </thead>
              <tbody>
                {group.requirements.map((req) => (
                  <DocRow
                    key={req.key}
                    req={req}
                    files={uploads[req.key] ?? []}
                    onPick={() => pickFile(req)}
                    onRemove={(i) => removeFile(req.key, i)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Per-course SOP / Essay / CV tables (driven by Course Preferences) */}
      {COURSE_DOC_SECTIONS.map((section) => (
        <CourseDocTable
          key={section.key}
          section={section}
          rows={courseRows}
          uploads={uploads}
          onPick={pickFile}
          onRemove={removeFile}
        />
      ))}

      {/* Completion checkbox */}
      <label className="flex cursor-pointer items-center gap-2.5 border-t border-slate-200 pt-4 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={completed}
          onChange={toggleCompleted}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        Mark all documents upload completed
      </label>

      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={onFilesChosen} />
    </div>
  )
}

/** One requirement row: name (+ required *) on the left, uploader on the right. */
function DocRow({
  req,
  files,
  onPick,
  onRemove,
}: {
  req: DocRequirement
  files: string[]
  onPick: () => void
  onRemove: (idx: number) => void
}) {
  const hasFiles = files.length > 0
  return (
    <tr className="border-b border-slate-100 align-top last:border-b-0 odd:bg-white even:bg-slate-50/50">
      <td className="px-4 py-4 text-sm font-medium text-slate-700 [overflow-wrap:anywhere]">
        {req.title}
        {req.required && <span className="ml-0.5 text-rose-500">*</span>}
      </td>
      <td className="px-4 py-4">
        <p className="mb-1.5 text-xs font-semibold text-slate-500">Upload New File:</p>

        {hasFiles && (
          <ul className="mb-2 space-y-1">
            {files.map((name, i) => (
              <li key={`${name}-${i}`} className="flex items-center gap-2">
                <span className="text-sm font-medium text-brand-600 [overflow-wrap:anywhere]">{name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${name}`}
                  className="text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Upload className="h-4 w-4 text-brand-600" /> {req.multiple ? 'Choose Files' : 'Choose File'}
          </button>
          <span className="text-sm text-slate-500">{hasFiles ? `${files.length} file(s)` : 'No file chosen'}</span>
        </div>

        {req.allowedTypes && (
          <p className="mt-1.5 text-xs text-slate-500">Allowed file types: {req.allowedTypes}</p>
        )}
        {req.notes && <p className="mt-1 text-xs text-slate-500">{req.notes}</p>}
        {req.maxFiles && !req.notes && (
          <p className="mt-1 text-xs text-slate-500">Maximum {req.maxFiles} files.</p>
        )}
        {req.required && !hasFiles && (
          <p className="mt-1 text-xs font-medium text-rose-600">Required</p>
        )}
      </td>
    </tr>
  )
}

/** Per-course upload table: Course | University | Upload {SOP/Essay/CV}. */
function CourseDocTable({
  section,
  rows,
  uploads,
  onPick,
  onRemove,
}: {
  section: CourseDocSection
  rows: { course: string; university: string }[]
  uploads: Record<string, string[]>
  onPick: (req: { key: string; accept: string }) => void
  onRemove: (key: string, idx: number) => void
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-700">
        {section.title}
        {section.required && <span className="ml-0.5 text-rose-500">*</span>}
      </h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">University</th>
              <th className="px-4 py-3">{section.label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                  No programs selected yet. Add programs in the{' '}
                  <span className="font-medium text-slate-700">Course Preferences</span> tab to upload
                  a course-specific {section.title}.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const key = `${section.key}-${i}`
                const files = uploads[key] ?? []
                return (
                  <tr key={key} className="border-b border-slate-100 text-sm odd:bg-white even:bg-slate-50/50">
                    <td className="px-4 py-4 font-semibold text-slate-800 [overflow-wrap:anywhere]">
                      {row.course}
                    </td>
                    <td className="px-4 py-4 text-slate-600 [overflow-wrap:anywhere]">{row.university}</td>
                    <td className="px-4 py-4">
                      {files[0] ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-brand-600 [overflow-wrap:anywhere]">{files[0]}</span>
                          <button
                            type="button"
                            onClick={() => onRemove(key, 0)}
                            aria-label="Remove file"
                            className="text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onPick({ key, accept: section.accept })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Upload className="h-4 w-4 text-brand-600" /> Choose File
                          </button>
                          {section.required && (
                            <p className="mt-1 text-xs font-medium text-rose-600">Required</p>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
