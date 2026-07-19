import { useState, type ReactNode } from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '../../../lib/cn'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg bg-brand-50 px-4 py-3"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</span>
        <ChevronUp
          className={cn('h-4 w-4 text-slate-500 transition-transform duration-300', !open && 'rotate-180')}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  )
}
