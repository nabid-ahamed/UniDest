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
import { cn } from '../../../lib/cn'
import { pickTextColor } from '../../../lib/contrast'
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
    <tr
      className={cn(
        'border-b border-slate-100 align-top transition-colors',
        selected ? 'bg-brand-50' : 'hover:bg-slate-50/70',
      )}
    >
      {/* Select — carries the left accent bar for the selected state */}
      <td
        className={cn(
          'px-3 py-3',
          selected ? 'border-l-2 border-l-brand-600' : 'border-l-2 border-l-transparent',
        )}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${lead.name}`}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </td>

      {/* ID */}
      <td className="px-3 py-3 text-sm font-medium tabular-nums text-slate-700">{lead.id}</td>

      {/* Lead — 3 compact tiers: identity+actions / details / meta */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => onAction('View')}
            className="text-sm font-bold text-slate-900 hover:text-brand-600 hover:underline"
          >
            {lead.name}
          </button>

          <button
            type="button"
            onClick={() => onAction('Add tag')}
            aria-label="Add tag"
            title="Add tag"
            className="flex items-center text-slate-400 hover:text-brand-600"
          >
            <Tag className="h-3.5 w-3.5" />
            <Plus className="h-3 w-3" />
          </button>

          <span className="mx-0.5 h-3 w-px bg-slate-200" aria-hidden="true" />

          <ContactLink icon={PhoneCall} label="Call" href={`tel:${digits}`} />
          <ContactLink icon={MessageSquare} label="SMS" href={`sms:${digits}`} />
          <ContactLink icon={Mail} label="Email" href={`mailto:${lead.email}`} />
          {lead.whatsapp && (
            <ContactLink
              icon={MessageCircle}
              label="WhatsApp"
              href={`https://wa.me/${digits}`}
              external
              className="text-emerald-600 hover:text-emerald-700"
            />
          )}
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {lead.emailDate}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {lead.phone}
            <span className="text-slate-400">· {lead.phoneNote}</span>
          </span>
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
            Lead Age: {lead.leadAgeDays} Days
          </span>
          <span className="rounded-md border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-xs font-medium text-pink-700">
            {lead.branch}
          </span>
        </div>
      </td>

      {/* Next Followup */}
      <td className="px-3 py-3 text-sm text-slate-500">{lead.nextFollowup ?? '—'}</td>

      {/* Status */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-md px-2 py-1 text-xs font-semibold"
            style={{
              backgroundColor: lead.statusColor,
              color: pickTextColor(lead.statusColor),
            }}
          >
            {lead.status}
          </span>
          <button
            type="button"
            onClick={() => onAction('Edit status')}
            aria-label="Edit status"
            title="Edit status"
            className="text-brand-600 hover:text-brand-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>

      {/* Assigned to */}
      <td className="px-3 py-3">
        {lead.assignedTo ? (
          <span className="text-sm font-medium text-slate-700">{lead.assignedTo}</span>
        ) : (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Unassigned
            <UserPlus className="h-4 w-4" />
          </button>
        )}
      </td>

      {/* Created */}
      <td className="px-3 py-3 text-sm text-slate-500">{lead.created}</td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <ActionIcon
            icon={UserPlus}
            label="Assign"
            onClick={() => onAction('Assign')}
            className="border-brand-300 text-brand-600 hover:bg-brand-50"
          />
          <ActionIcon
            icon={Eye}
            label="View"
            onClick={() => onAction('View')}
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
          />
          <ActionIcon
            icon={Settings}
            label="Settings"
            onClick={() => onAction('Settings')}
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
          />
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
      title={label}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700',
        className,
      )}
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
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}
