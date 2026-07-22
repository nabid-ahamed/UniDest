import { Download, SquarePen } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Lead } from '../../../mock/leads'

type Row = [label: string, value?: string]

/** Splits "Aarav Kumar Sharma" into first / middle / last. */
function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts.shift() ?? ''
  const last = parts.pop() ?? ''
  return { first, middle: parts.join(' '), last }
}

function buildSections(lead: Lead): { title: string; rows: Row[]; note?: string }[] {
  const { first, middle, last } = splitName(lead.name)
  return [
    {
      title: 'Basic Information',
      rows: [
        ['First Name', first],
        ['Middle Name', middle || undefined],
        ['Last Name', last],
        ['Gender', lead.gender],
        ['E-mail', lead.email],
        ['Date of Birth', undefined],
        ['Mobile', lead.phone],
        ['Whatsapp', lead.whatsapp ? lead.phone : undefined],
        ['Alternate Contact', undefined],
        ['Interested Study Level', lead.studyLevel],
        ['Country Interested in', lead.countryInterested],
        ['Course Interested to Study', undefined],
        ['Intake', undefined],
        ['Other Services Interested In', undefined],
        ['Highest Level of Education', lead.qualification],
        ['Passout Year', undefined],
        ['Score/Grade', undefined],
        ['Currently Studying Course', undefined],
        ['Work Experience', undefined],
        ['Marital status', undefined],
        ['Nationality', lead.countryOfResidence],
        ['Citizenship', undefined],
        ['Country of Education', undefined],
      ],
    },
    {
      title: 'Additional Information',
      rows: [
        ['Lead Source', lead.source],
        ['Lead Source Details', undefined],
        ['Branch', lead.branch],
        ['When would you like to start study?', undefined],
      ],
    },
    {
      title: 'Current Address',
      rows: [
        ['Address', undefined],
        ['Country', lead.countryOfResidence],
        ['State', undefined],
        ['City', undefined],
        ['Postal Code', undefined],
      ],
    },
    { title: 'Permanent Address', rows: [], note: 'Same as Current Address' },
    {
      title: 'Passport Information',
      rows: [
        ['Name (As in Passport)', undefined],
        ['Passport No.', undefined],
        ['Issue Date', undefined],
        ['Expiry Date', undefined],
        ['Issue Country', undefined],
        ['City of Birth', undefined],
        ['Country of Birth', undefined],
      ],
    },
    {
      title: 'Nationality',
      rows: [
        ['Is the applicant a citizen of more than one country?', 'No'],
        ['Is the applicant living and studying in any other country?', 'No'],
      ],
    },
    {
      title: 'Background Info',
      rows: [
        ['Has applicant applied for any type of immigration into any country?', 'No'],
        ['Does applicant suffer from a serious medical condition?', 'No'],
        ['Has applicant Visa refusal for any country?', 'No'],
        ['Has applicant ever been convicted of a criminal offence?', 'No'],
      ],
    },
    {
      title: 'Emergency Contacts',
      rows: [
        ['Name', undefined],
        ['Email', undefined],
        ['Phone', undefined],
        ['Relationship with Applicant', undefined],
        ['Address', undefined],
        ['Country', undefined],
        ['State', undefined],
        ['City', undefined],
        ['Postal Code', undefined],
      ],
    },
  ]
}

/** Sections that have no data yet — rendered as "No Data Available". */
const EMPTY_SECTIONS: { title: string; sub?: string }[] = [
  { title: 'Academic Information' },
  { title: 'Tests, Language Certifications', sub: 'English' },
  { title: 'Other Languages' },
  { title: 'GRE / GMAT' },
  { title: 'Internships' },
  { title: 'Additional Courses' },
  { title: 'Employment History' },
  { title: 'Visa Application History' },
  { title: 'International Travel History' },
  { title: 'Family Details' },
]

/** "Profile" tab of the lead detail page, matching the reference. */
export function LeadProfileTab({
  lead,
  onToast,
  onEditProfile,
}: {
  lead: Lead
  onToast: (msg: string) => void
  onEditProfile: () => void
}) {
  const sections = buildSections(lead)

  const downloadProfile = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`${lead.name} — Student Profile`, 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Lead #${lead.id} · ${lead.status} · Created ${lead.created}`, 14, 23)
    let y = 30
    for (const s of sections) {
      autoTable(doc, {
        startY: y,
        head: [[s.title, '']],
        body: s.note ? [[s.note, '']] : s.rows.map(([l, v]) => [l, v ?? '--']),
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [31, 71, 245] },
        columnStyles: { 0: { cellWidth: 90 } },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
    }
    doc.save(`${lead.name.toLowerCase().replace(/\s+/g, '-')}-profile.pdf`)
    onToast('Profile PDF downloaded')
  }

  return (
    <div className="space-y-5">
      {/* Incomplete warning */}
      <div className="rounded-md bg-rose-100 px-4 py-2.5 text-sm font-medium text-rose-700">
        Student Profile Incomplete
      </div>

      {/* Blue section bar */}
      <div className="rounded-md bg-brand-600 px-4 py-2.5 font-bold text-white">
        Student Profile
      </div>

      {/* Heading + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">Basic Information</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadProfile}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            <Download className="h-4 w-4" /> Download Profile
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <SquarePen className="h-4 w-4" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Filled sections */}
      <div className="divide-y divide-slate-200">
        {sections.map((s, i) => (
          <section key={s.title} className={i === 0 ? 'pb-6' : 'py-6'}>
            {s.title !== 'Basic Information' && (
              <h3 className="mb-4 text-base font-bold text-slate-800">{s.title}</h3>
            )}
            {s.note ? (
              <p className="text-sm font-semibold text-slate-700">{s.note}</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {s.rows.map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
                      {value ?? '--'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Not-yet-filled sections */}
        {EMPTY_SECTIONS.map((s) => (
          <section key={s.title} className="py-6">
            <h3 className="text-base font-bold text-slate-800">{s.title}</h3>
            {s.sub && (
              <p className="mt-2 text-sm font-medium text-brand-600 underline underline-offset-2">
                {s.sub}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-500">No Data Available</p>
          </section>
        ))}
      </div>

      <p className="border-t border-slate-200 pt-4 text-sm text-slate-500">
        <span className="font-semibold text-slate-600">Created At:</span> {lead.created} ·{' '}
        <span className="font-semibold text-slate-600">Last Updated:</span> {lead.created}
      </p>
    </div>
  )
}
