import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../../lib/cn'

/**
 * Shared dashboard card: coloured title + muted subtitle, a scrollable body,
 * and an optional "View all" footer. Used by every student home widget so the
 * cards stay visually consistent with no duplicated shell markup.
 */
export function PortalCard({
  title,
  subtitle,
  viewAllTo,
  children,
  bodyClass,
}: {
  title: string
  subtitle?: string
  viewAllTo?: string
  children: ReactNode
  bodyClass?: string
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 pt-5">
        <h2 className="text-lg font-bold text-brand-700">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className={cn('mt-3 flex-1 overflow-y-auto px-5', bodyClass ?? 'max-h-72')}>{children}</div>
      {viewAllTo && (
        <div className="flex justify-end p-4">
          <Link
            to={viewAllTo}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            View all
          </Link>
        </div>
      )}
    </section>
  )
}

/** Two-column list header (e.g. "Document | Status"). */
export function PortalListHead({ left, right }: { left: string; right?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm font-bold text-slate-600">
      <span>{left}</span>
      {right && <span>{right}</span>}
    </div>
  )
}

/** Empty state shown when a card has no records. */
export function PortalEmpty({ text = 'No records found.' }: { text?: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{text}</p>
}
