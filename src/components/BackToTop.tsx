import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '../lib/cn'

/**
 * Premium "Back to Top" button: glassmorphism surface, a gradient circular
 * scroll-progress ring, fade + scale entrance, hover lift, and a click ripple.
 */
export function BackToTop() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [ripple, setRipple] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const top = window.scrollY || el.scrollTop
      setProgress(max > 0 ? Math.min(1, top / max) : 0)
      setVisible(top > 300)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const R = 20
  const CIRC = 2 * Math.PI * R
  const dashOffset = CIRC * (1 - progress)

  const handleClick = () => {
    setRipple((n) => n + 1) // re-key the ripple span to restart its animation
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Back to top (${Math.round(progress * 100)}% scrolled)`}
      className={cn(
        'group fixed bottom-1 right-4 z-40 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full',
        // Glassmorphism surface + soft brand-tinted shadow
        'border border-white/60 bg-white/70 backdrop-blur-md',
        'shadow-[0_8px_24px_-6px_rgba(31,71,245,0.35)]',
        // Entrance + interaction transitions
        'transition-all duration-300 ease-out will-change-transform',
        'hover:-translate-y-1 hover:scale-105 hover:bg-white/85 hover:shadow-[0_14px_30px_-6px_rgba(31,71,245,0.5)]',
        'active:scale-95',
        visible
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-2 scale-75 opacity-0',
      )}
    >
      {/* Click ripple */}
      {ripple > 0 && (
        <span
          key={ripple}
          className="animate-btt-ripple pointer-events-none absolute inset-0 rounded-full bg-brand-500/30"
        />
      )}

      {/* Gradient progress ring — starts at 12 o'clock */}
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="btt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#598eff" />
            <stop offset="100%" stopColor="#1836e1" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r={R} fill="none" stroke="#1f47f5" strokeOpacity="0.12" strokeWidth="4.5" />
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="url(#btt-grad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>

      <ArrowUp
        className="relative h-4 w-4 text-brand-700 transition-transform duration-300 group-hover:-translate-y-0.5"
        strokeWidth={3.25}
      />
    </button>
  )
}
