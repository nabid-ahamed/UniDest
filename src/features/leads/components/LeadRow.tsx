import {
  Tag,
  Plus,
  Mail,
  Phone,
  PhoneCall,
  MessageSquare,
  MessageCircle,
  Pencil,
  UserPlus,
  Eye,
  Settings,
} from 'lucide-react'
import type { Lead } from '../../../mock/leads'

export function LeadRow({
  lead,
  selected,
  onToggle,
  onAction,
}: {
  lead: Lead
  selected: boolean
  onToggle: () => void
  onAction: (type: string) => void
}) {
  const digits = lead.phone.replace(/\D/g, '')

  return (
    <tr className="border-b border-slate-100 align-top hover:bg-slate-50/70">
      {/* Select */}
      <td className="px-3 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </td>

      {/* ID */}
      <td className="px-3 py-4 text-sm font-medium text-slate-700">{lead.id}</td>

      {/* Lead */}
      <td className="px-3 py-4">
        <p className="text-sm font-bold text-slate-900">{lead.name}</p>

        <div className="mt-1 flex items-center gap-1.5 text-slate-400">
          <Tag className="h-3.5 w-3.5" />
          <button
            type="button"
            onClick={() => onAction('Add tag')}
            className="text-brand-600 hover:text-brand-700"
            aria-label="Add tag"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-1.5 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span>{lead.emailDate}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{lead.phone}</span>
            <span className="text-slate-400">- {lead.phoneNote}</span>
          </p>
        </div>

        {/* Quick contact actions (real links) */}
        <div className="mt-2 flex items-center gap-1.5">
          <ContactLink icon={PhoneCall} label="Call" href={`tel:${digits}`} />
          <ContactLink icon={MessageSquare} label="SMS" href={`sms:${digits}`} />
          <ContactLink icon={Mail} label="Email" href={`mailto:${lead.email}`} />
          {lead.whatsapp && (
            <ContactLink
              icon={MessageCircle}
              label="WhatsApp"
              href={`https://wa.me/${digits}`}
              external
              className="text-emerald-600"
            />
          )}
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">
            Lead Age: {lead.leadAgeDays} Days
          </span>
          <span className="rounded-md border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-[11px] font-medium text-pink-600">
            {lead.branch}
          </span>
        </div>
      </td>

      {/* Next Followup */}
      <td className="px-3 py-4 text-sm text-slate-500">{lead.nextFollowup ?? '—'}</td>

      {/* Status */}
      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-md px-2 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: lead.statusColor }}
          >
            {lead.status}
          </span>
          <button
            type="button"
            onClick={() => onAction('Edit status')}
            className="text-brand-600 hover:text-brand-700"
            aria-label="Edit status"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>

      {/* Assigned to */}
      <td className="px-3 py-4">
        {lead.assignedTo ? (
          <span className="text-sm font-medium text-slate-700">{lead.assignedTo}</span>
        ) : (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-500 hover:text-rose-600"
          >
            Unassigned
            <UserPlus className="h-4 w-4" />
          </button>
        )}
      </td>

      {/* Created */}
      <td className="px-3 py-4 text-sm text-slate-500">{lead.created}</td>

      {/* Actions */}
      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5">
          <ActionIcon icon={UserPlus} label="Assign" onClick={() => onAction('Assign')} className="border-brand-300 text-brand-600 hover:bg-brand-50" />
          <ActionIcon icon={Eye} label="View" onClick={() => onAction('View')} className="border-emerald-300 text-emerald-600 hover:bg-emerald-50" />
          <ActionIcon icon={Settings} label="Settings" onClick={() => onAction('Settings')} className="border-rose-300 text-rose-600 hover:bg-rose-50" />
        </div>
      </td>
    </tr>
  )
}

function ContactLink({
  icon: Icon,
  label,
  href,
  external,
  className,
}: {
  icon: typeof Phone
  label: string
  href: string
  external?: boolean
  className?: string
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      aria-label={label}
      className={`flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${className ?? ''}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  )
}

function ActionIcon({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: typeof Eye
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}
