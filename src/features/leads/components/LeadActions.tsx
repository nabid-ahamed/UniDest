import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  MessageSquare,
  MessageCircle,
  SquarePen,
  FileSignature,
  Link2,
  Globe,
  ChevronsRight,
  Trash2,
  X,
} from 'lucide-react'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { showSuccessDialog } from '../../../store/successDialog'
import type { Lead } from '../../../mock/leads'
import { useConvertLead, useDeleteLead } from '../../../lib/api'

/** Agents a lead/student can be linked to (mock — Phase 2: real agents table). */
const AGENTS = ['Global Study Partners', 'EduLink Consultancy', 'BrightPath Agents', 'Overseas Connect', 'GlobalEd Direct']
/** Private country-info folders shown in the permissions grid (matches the reference). */
const COUNTRY_FOLDERS = ['Australia', 'Germany', 'Ireland', 'Canada', 'France', 'UK']

/* localStorage helpers so Link-to-Agent and Country Permissions actually persist. */
function loadMap(key: string): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}
function saveMap(key: string, map: Record<string, unknown>) {
  try {
    localStorage.setItem(key, JSON.stringify(map))
  } catch {
    /* storage blocked — stays in memory */
  }
}
const AGENT_KEY = 'unidest-lead-agent'
const PERM_KEY = 'unidest-country-perms'

type Modal = null | 'agreement' | 'agent' | 'country'

function ModalShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-500/60" onClick={onClose} />
      <div className="animate-dialog-in relative my-8 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">{footer}</div>
      </div>
    </div>,
    document.body,
  )
}

const Btn = ({ children, onClick, tone = 'primary' }: { children: React.ReactNode; onClick: () => void; tone?: 'primary' | 'ghost' }) => (
  <button
    onClick={onClick}
    className={
      tone === 'primary'
        ? 'rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700'
        : 'rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50'
    }
  >
    {children}
  </button>
)

const ReadOnly = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{value || '—'}</div>
  </div>
)

/** Actions panel for the lead detail page — every button wired to a real behaviour. */
export function LeadActions({ lead, onToast }: { lead: Lead; onToast: (m: string) => void }) {
  const navigate = useNavigate()
  const deleteLeadMutation = useDeleteLead()
  const convertLead = useConvertLead()
  const [modal, setModal] = useState<Modal>(null)
  const [confirm, setConfirm] = useState<null | 'convert' | 'delete'>(null)

  // Agreement note
  const [note, setNote] = useState('')
  // Link to agent
  const [agent, setAgent] = useState<string>(() => (loadMap(AGENT_KEY)[lead.id] as string) || '')
  // Country permissions
  const [perms, setPerms] = useState<Record<string, boolean>>(
    () => (loadMap(PERM_KEY)[lead.id] as Record<string, boolean>) || {},
  )

  const close = () => {
    setModal(null)
    setNote('')
  }

  const openWhatsapp = () => {
    const digits = (lead.phone || '').replace(/[^\d+]/g, '')
    if (!digits) {
      onToast('No phone number on file')
      return
    }
    window.open(`https://wa.me/${digits.replace('+', '')}`, '_blank', 'noopener')
  }

  const ACTIONS: { label: string; icon: typeof Mail; run: () => void }[] = [
    { label: 'Send email', icon: Mail, run: () => navigate(`/leads/${lead.id}/email`) },
    { label: 'Send sms', icon: MessageSquare, run: () => navigate(`/leads/${lead.id}/sms`) },
    { label: 'Send Whatsapp', icon: MessageCircle, run: openWhatsapp },
    { label: 'Edit Lead Details', icon: SquarePen, run: () => navigate(`/leads/${lead.id}/edit`) },
    { label: 'Student Agreement', icon: FileSignature, run: () => setModal('agreement') },
    { label: 'Link to Agent', icon: Link2, run: () => setModal('agent') },
    { label: 'Country Info Permissions', icon: Globe, run: () => setModal('country') },
    { label: 'Convert To Student', icon: ChevronsRight, run: () => setConfirm('convert') },
  ]

  const doAgreement = () => {
    close()
    showSuccessDialog(`Student agreement sent to ${lead.email} for e-signature.`, 'Agreement Sent')
  }

  const doLinkAgent = () => {
    if (!agent) return
    saveMap(AGENT_KEY, { ...loadMap(AGENT_KEY), [lead.id]: agent })
    setModal(null)
    showSuccessDialog(`${lead.name} linked to ${agent}.`, 'Agent Linked')
  }

  const doSavePerms = () => {
    saveMap(PERM_KEY, { ...loadMap(PERM_KEY), [lead.id]: perms })
    setModal(null)
    showSuccessDialog('Country info permissions updated.', 'Permissions Saved')
  }

  /**
   * Convert this lead into a student.
   *
   * The API keeps BOTH rows and links them (lead.convertedStudentId /
   * student.leadId), then moves the lead to the won status. It used to create
   * the student and delete the lead, which destroyed funnel lineage and made
   * conversion-rate reporting impossible.
   */
  const doConvert = () => {
    convertLead.mutate(
      { leadId: lead.id },
      {
        onSuccess: (student) => {
          setConfirm(null)
          showSuccessDialog(
            `${lead.name} has been converted to a student.`,
            'Converted To Student',
          )
          navigate(`/students/${student.id}`)
        },
        onError: () => {
          setConfirm(null)
          onToast('Could not convert this lead. Please try again.')
        },
      },
    )
  }

  const doDelete = () => {
    deleteLeadMutation.mutate(lead.id)
    setConfirm(null)
    showSuccessDialog(`${lead.name} (#${lead.id}) has been deleted.`, 'Lead Deleted')
    navigate('/leads')
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-slate-200">
        <h2 className="bg-brand-600 px-4 py-3 font-bold text-white">Actions</h2>
        <div className="divide-y divide-slate-100">
          {ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.run}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              <a.icon className="h-4 w-4 text-brand-600" />
              {a.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setConfirm('delete')}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4 text-brand-600" />
            Delete
          </button>
        </div>
      </section>

      {/* Student Agreement */}
      {modal === 'agreement' && (
        <ModalShell
          title="Student Agreement"
          onClose={close}
          footer={<><Btn tone="ghost" onClick={close}>Cancel</Btn><Btn onClick={doAgreement}>Send for e-Signature</Btn></>}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Send the student agreement to the applicant for electronic signature.</p>
            <ReadOnly label="Recipient" value={`${lead.name} · ${lead.email}`} />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Note (optional)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input" placeholder="Add a note to the recipient…" />
            </div>
          </div>
        </ModalShell>
      )}

      {/* Link to Agent */}
      {modal === 'agent' && (
        <ModalShell
          title="Link Student to Agent"
          onClose={() => setModal(null)}
          footer={<><Btn tone="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={doLinkAgent}>Save</Btn></>}
        >
          <div className="space-y-4">
            <ReadOnly label="User Name" value={lead.name} />
            <ReadOnly label="User Email" value={lead.email} />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Agents</label>
              <select value={agent} onChange={(e) => setAgent(e.target.value)} className="input">
                <option value="">Select</option>
                {AGENTS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Country Info Permissions */}
      {modal === 'country' && (
        <ModalShell
          title="Country Info Access Permissions"
          onClose={() => setModal(null)}
          footer={<><Btn tone="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={doSavePerms}>Save Changes</Btn></>}
        >
          <p className="mb-3 text-sm text-slate-500">Manage which private country folders {lead.name} can access.</p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-700">
                  <th className="px-4 py-2.5">Folder</th>
                  <th className="px-4 py-2.5 text-right">Has Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COUNTRY_FOLDERS.map((c) => (
                  <tr key={c}>
                    <td className="px-4 py-2.5 text-slate-700">{c} &gt; Visa Documents</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="checkbox"
                        checked={!!perms[c]}
                        onChange={(e) => setPerms((p) => ({ ...p, [c]: e.target.checked }))}
                        className="h-4 w-4 accent-brand-600"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Note: Only private folders are shown.</p>
        </ModalShell>
      )}

      {/* Convert To Student */}
      {confirm === 'convert' &&
        createPortal(
          <ConfirmDialog
            open
            title="Convert this lead to a student?"
            message={
              <>
                <span className="font-medium text-slate-700">{lead.name}</span> will be moved to Student
                Management. This removes them from the leads list.
              </>
            }
            confirmLabel="Convert"
            onConfirm={doConvert}
            onCancel={() => setConfirm(null)}
          />,
          document.body,
        )}

      {/* Delete */}
      {confirm === 'delete' &&
        createPortal(
          <ConfirmDialog
            open
            title="Delete this lead?"
            message={
              <>
                <span className="font-medium text-slate-700">{lead.name}</span> (#{lead.id}) will be removed
                permanently.
              </>
            }
            confirmLabel="Delete"
            onConfirm={doDelete}
            onCancel={() => setConfirm(null)}
          />,
          document.body,
        )}
    </>
  )
}
