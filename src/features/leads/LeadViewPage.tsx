import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  ConfidentialNotes,
  DetailGrid,
  Detail,
  RecordsSection,
} from '../../components/DetailSections'
import { LeadIdentityHeader } from './components/LeadIdentityHeader'
import { LeadProfileTab } from './components/LeadProfileTab'
import { LeadCourseSuggestionTab } from './components/LeadCourseSuggestionTab'
import { LeadCoursePreferencesTab } from './components/LeadCoursePreferencesTab'
import { LeadActions } from './components/LeadActions'
import { leads, type Lead } from '../../mock/leads'

const TABS = ['Overview', 'Profile', 'Course Suggestion', 'Course Preferences'] as const

/** Lead detail page (route /leads/:id), matching the reference "View" page. */
export default function LeadViewPage() {
  const { id } = useParams()
  const lead = leads.find((l) => l.id === Number(id))

  if (!lead) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Lead not found.</p>
        <a
          href="/leads"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to Lead Management
        </a>
      </div>
    )
  }

  return <LeadView lead={lead} />
}

function LeadView({ lead }: { lead: Lead }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Identity header */}
      <LeadIdentityHeader lead={lead} onChat={() => showToast('Chat — coming soon')} />

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-3 text-sm font-semibold transition-colors',
              tab === t
                ? 'rounded-t-lg bg-brand-600 text-white'
                : 'bg-slate-100 text-brand-600 hover:bg-slate-200',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_20rem]">
          {/* Left column */}
          <div className="min-w-0 space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-800">Basic Details</h2>
              <div className="mt-4 rounded-lg border border-slate-200 p-5">
                <DetailGrid
                  rows={[
                    ['Gender', lead.gender],
                    ['Date of Birth', undefined],
                    ['Interested Study Level', lead.studyLevel],
                    ['Country Interested in', lead.countryInterested],
                    ['Course Interested to Study', undefined],
                    ['Intake', undefined],
                    ['Other Services Interested In', undefined],
                    ['Qualification', lead.qualification],
                    ['Passout Year', undefined],
                    ['Score/Grade', undefined],
                    ['Currently Studying Course', undefined],
                  ]}
                />
                <hr className="my-5 border-slate-200" />
                <DetailGrid
                  rows={[
                    ['ID', String(lead.id)],
                    ['Branch', lead.branch],
                    ['Assigned to Staff', lead.assignedTo ?? 'Unassigned'],
                    ['Lead Source', lead.source],
                    ['Lead Source Details', undefined],
                  ]}
                />
                <hr className="my-5 border-slate-200" />
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <span className="mt-1 inline-block rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                      Active
                    </span>
                  </div>
                  <Detail label="Last Login At" value="N/A" />
                  <Detail label="Last Login IP" value="N/A" />
                </div>
              </div>
            </section>

            <RecordsSection
              title="Invoices"
              headers={['Date', 'Invoice #', 'Amount']}
              onCreate={() => showToast('Create invoice — coming soon')}
            />

            <RecordsSection
              title="Support Tickets"
              headers={['Ticket', 'Assigned To', 'Status', 'Last Reply']}
              onCreate={() => showToast('Create ticket — coming soon')}
            />

            <section>
              <h2 className="text-lg font-bold text-slate-800">User Activity Log</h2>
              <div className="mt-4 rounded-lg border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Other activity</p>
                    <p className="mt-2 text-sm text-slate-700">
                      LEAD CREATED &amp; ASSIGNED TO: {lead.assignedTo ?? 'Unassigned'}
                    </p>
                    <p className="mt-2 border-t border-slate-100 pt-2 text-sm italic text-slate-500">
                      {lead.created} · {lead.assignedTo ?? 'System'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
              <span className="font-semibold text-slate-600">Created At:</span> {lead.created}{' '}
              · <span className="font-semibold text-slate-600">Last Updated:</span> {lead.created}
            </p>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <LeadActions lead={lead} onToast={showToast} />

            <ConfidentialNotes id={lead.id} onSaved={() => showToast('Note saved')} />
          </div>
        </div>
      ) : tab === 'Profile' ? (
        <div className="px-4 py-6 sm:px-6">
          <LeadProfileTab
            lead={lead}
            onToast={showToast}
            onEditProfile={() => window.location.assign(`/leads/${lead.id}/edit`)}
          />
        </div>
      ) : tab === 'Course Suggestion' ? (
        <div className="px-4 py-6 sm:px-6">
          <LeadCourseSuggestionTab lead={lead} onToast={showToast} />
        </div>
      ) : (
        <div className="px-4 py-6 sm:px-6">
          <LeadCoursePreferencesTab lead={lead} onToast={showToast} />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

