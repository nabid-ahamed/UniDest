import { Construction } from 'lucide-react'

/** Temporary stand-in for student portal sections not yet built. */
export default function StudentPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">{title}</h1>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Construction className="h-7 w-7" />
        </span>
        <p className="mt-4 text-base font-bold text-slate-700">Coming soon</p>
        <p className="mt-1 text-sm text-slate-500">This section of your student portal is being built.</p>
      </div>
    </div>
  )
}
