import { Construction } from 'lucide-react'

/**
 * Staff Portal — placeholder.
 *
 * Renders inside `AdminLayout` (same Header row + Sidebar as the admin CRM).
 * The full staff-facing portal is documented in
 * `docs/superpowers/mock-data/staff.md` and will replace this content when built.
 */
export default function StaffPortalPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
          <Construction className="h-8 w-8 text-brand-600" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">Staff Portal</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          This page hasn&apos;t been built yet. The staff workspace is on the
          way — please check back soon.
        </p>
      </div>
    </div>
  )
}
