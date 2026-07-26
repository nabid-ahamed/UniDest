/** Grey section header bar used on the portal application / service detail pages. */
export function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-100 px-5 py-4 text-lg font-bold text-slate-800">{children}</div>
  )
}
