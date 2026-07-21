import { Mail, Phone, Pencil, UserPlus, Eye, Settings, GraduationCap, FileText } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { pickTextColor } from '../../../lib/contrast'
import type { Student } from '../../../mock/students'

export function StudentRow({
  student,
  assignedTo,
  selected,
  onToggle,
  onAction,
}: {
  student: Student
  assignedTo: string | null
  selected: boolean
  onToggle: () => void
  onAction: (type: string) => void
}) {
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
          aria-label={`Select ${student.name}`}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </td>

      {/* ID */}
      <td className="px-3 py-3 text-sm font-medium tabular-nums text-slate-700">{student.id}</td>

      {/* Student — identity / contact / meta, same 3-tier rhythm as LeadRow */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onAction('View')}
          className="text-sm font-bold text-slate-900 hover:text-brand-600 hover:underline"
        >
          {student.name}
        </button>
        <p className="text-xs tabular-nums text-slate-500">{student.studentNo}</p>

        {/* overflow-wrap:anywhere lets long emails break when the sidebar
            squeezes the table, instead of forcing the row past the card. */}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 [overflow-wrap:anywhere]">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {student.email}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {student.phone}
            <span className="text-slate-400">· {student.phoneNote}</span>
          </span>
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-xs font-medium text-pink-700">
            {student.branch}
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
            {student.source}
          </span>
        </div>
      </td>

      {/* Study interest */}
      <td className="px-3 py-3">
        <p className="text-sm font-medium text-slate-700">{student.countryInterested}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {student.studyLevel} · {student.course}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">Intake: {student.intake}</p>
        {student.university && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
            {student.university}
          </p>
        )}
      </td>

      {/* Applications */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onAction('Applications')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold transition-colors',
            student.applications > 0
              ? 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100',
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          {student.applications}
        </button>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-md px-2 py-1 text-xs font-semibold"
            style={{
              backgroundColor: student.statusColor,
              color: pickTextColor(student.statusColor),
            }}
          >
            {student.status}
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
        {assignedTo ? (
          <button
            type="button"
            onClick={() => onAction('Assign')}
            title="Re-assign"
            className="text-sm font-medium text-slate-700 hover:text-brand-600 hover:underline"
          >
            {assignedTo}
          </button>
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
      <td className="px-3 py-3 text-sm text-slate-500">{student.created}</td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <ActionIcon
            icon={UserPlus}
            label="Assign"
            onClick={() => onAction('Assign')}
            className="border-brand-300 text-brand-600 hover:border-brand-600 hover:bg-brand-600 hover:text-white"
          />
          <ActionIcon
            icon={Eye}
            label="View"
            onClick={() => onAction('View')}
            className="border-emerald-300 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
          />
          <ActionIcon
            icon={Settings}
            label="Settings"
            onClick={() => onAction('Settings')}
            className="border-slate-300 text-slate-600 hover:border-slate-600 hover:bg-slate-600 hover:text-white"
          />
        </div>
      </td>
    </tr>
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
  // Instant CSS tooltip — the native title attribute takes ~1s to appear.
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}
