import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  error?: string
  rightSlot?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, rightSlot, className, ...props }, ref) => (
    <div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            icon ? 'pl-10' : 'pl-3.5',
            rightSlot ? 'pr-10' : 'pr-3.5',
            error ? 'border-red-400' : 'border-slate-300',
            className,
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightSlot}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
