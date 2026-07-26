import { useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { currentStudent } from '../../mock/student/portal'
import {
  ACADEMIC_DOCS,
  TEST_DOCS,
  OTHER_DOCS,
  loadDocUploads,
  setDocUpload,
  loadCourseRows,
  type DocRequirement,
} from '../../mock/student/studentDocs'

/**
 * "Study Abroad Apply → Documents" — faithful to
 * demo.eductrl.com/cn4/overseas/docs. A set of named document requirements
 * grouped into Academic Certificates, Tests/English Certificates, and
 * SOP/LOR/CV, plus a per-course CV upload table driven by Course Preferences.
 * Uploaded file names persist per student.
 */
export function StudentDocumentsTab({ onToast }: { onToast: (msg: string) => void }) {
  const student = currentStudent()
  const [uploads, setUploads] = useState<Record<string, string[]>>(() => loadDocUploads(student.id))
  const courseRows = loadCourseRows(student.id)

  // One shared hidden input, retargeted per requirement.
  const inputRef = useRef<HTMLInputElement>(null)
  const pending = useRef<{ key: string; multiple: boolean } | null>(null)
  const [accept, setAccept] = useState('')

  const pickFile = (req: DocRequirement | { key: string; accept: string; multiple?: boolean }) => {
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
    setUploads(setDocUpload(student.id, target.key, next))
    onToast(names.length > 1 ? `${names.length} files uploaded` : `"${names[0]}" uploaded`)
  }

  const removeFile = (key: string, idx: number) => {
    const next = (uploads[key] ?? []).filter((_, i) => i !== idx)
    setUploads(setDocUpload(student.id, key, next))
    onToast('File removed')
  }

  return (
    <div className="space-y-10">
      {/* ---- Section 1: Academic Certificates & Document ---- */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Academic Certificates &amp; Document</h2>
          <p className="mt-1 text-sm font-medium text-rose-600">
            Each individual file size must not exceed 2 MB.
          </p>
        </div>
        <div className="space-y-5">
          {ACADEMIC_DOCS.map((req) => (
            <DocCard
              key={req.key}
              req={req}
              files={uploads[req.key] ?? []}
              onPick={() => pickFile(req)}
              onRemove={(i) => removeFile(req.key, i)}
            />
          ))}
        </div>
      </section>

      {/* ---- Section 2: Tests / English Certificates ---- */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tests/English Certificates</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            Upload all applicable certificates. The documents must be in pdf format.
            <FileText className="h-4 w-4 text-brand-600" />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {TEST_DOCS.map((req) => (
            <DocCard
              key={req.key}
              req={req}
              files={uploads[req.key] ?? []}
              onPick={() => pickFile(req)}
              onRemove={(i) => removeFile(req.key, i)}
            />
          ))}
        </div>
      </section>

      {/* ---- Section 3: SOP / LOR / CV ---- */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold text-slate-800">Statement, Recommendation &amp; CV</h2>
        <div className="space-y-5">
          {OTHER_DOCS.map((req) => (
            <DocCard
              key={req.key}
              req={req}
              files={uploads[req.key] ?? []}
              onPick={() => pickFile(req)}
              onRemove={(i) => removeFile(req.key, i)}
            />
          ))}
        </div>

        {/* Per-course CV table (driven by Course Preferences) */}
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left text-sm font-semibold text-slate-700">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">University</th>
                <th className="px-4 py-3">
                  Upload CV
                  <span className="block text-xs font-normal text-slate-500">
                    Upload Essay .docx, .doc, .pdf
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {courseRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    No programs selected yet. Add programs in the{' '}
                    <span className="font-medium text-slate-700">Course Preferences</span> tab to
                    upload a course-specific CV.
                  </td>
                </tr>
              ) : (
                courseRows.map((row, i) => {
                  const key = `course-cv-${i}`
                  const files = uploads[key] ?? []
                  return (
                    <tr key={key} className="border-b border-slate-100 text-sm odd:bg-slate-50/70">
                      <td className="px-4 py-4 font-semibold text-slate-800 [overflow-wrap:anywhere]">
                        {row.course}
                      </td>
                      <td className="px-4 py-4 text-slate-600 [overflow-wrap:anywhere]">
                        {row.university}
                      </td>
                      <td className="px-4 py-4">
                        {files[0] ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-brand-600 [overflow-wrap:anywhere]">{files[0]}</span>
                            <button
                              type="button"
                              onClick={() => removeFile(key, 0)}
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
                              onClick={() => pickFile({ key, accept: '.pdf,.doc,.docx' })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                            >
                              <Upload className="h-4 w-4" /> Choose File
                            </button>
                            <p className="mt-1.5 text-sm font-medium text-rose-600">Required</p>
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

      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={onFilesChosen} />
    </div>
  )
}

/** One document-requirement card: header + uploaded file(s) + chooser. */
function DocCard({
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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="bg-brand-600 px-5 py-3.5 text-lg font-bold text-white">{req.title}</div>
      <div className="space-y-3 p-5">
        {hasFiles && (
          <div className="space-y-1.5">
            <p className="text-sm text-slate-600">Uploaded File{files.length > 1 ? 's' : ''}:</p>
            <ul className="space-y-1">
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
          </div>
        )}

        <div className="space-y-1.5">
          {hasFiles && <p className="text-sm text-slate-600">Replace File</p>}
          <button
            type="button"
            onClick={onPick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            <Upload className="h-4 w-4" /> {req.multiple ? 'Choose Files' : 'Choose File'}
          </button>
          {req.required && !hasFiles && (
            <p className="text-sm font-medium text-rose-600">Required</p>
          )}
        </div>

        <div className="text-sm text-slate-600">
          Allowed File Types: <span className="font-medium">{req.allowedTypes}</span>
        </div>
        {(req.maxFiles || req.notes) && (
          <p className="text-xs text-slate-500">
            {req.maxFiles ? `Maximum ${req.maxFiles} files.` : ''}
            {req.maxFiles && req.notes ? ' ' : ''}
            {req.notes ? `Notes: ${req.notes}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}
