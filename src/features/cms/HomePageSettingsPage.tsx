import { useState } from 'react'
import { LayoutGrid, Minimize2, Check, Palette, ExternalLink } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Toggle } from './components/Toggle'
import {
  homeSettings,
  saveHomeSettings,
  frontendThemes,
  brandColors,
  homeSections,
  type LayoutMode,
} from '../../mock/cms'

export default function HomePageSettingsPage() {
  const [theme, setTheme] = useState(homeSettings.theme)
  const [brandColorId, setBrandColorId] = useState(homeSettings.brandColorId)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(homeSettings.layoutMode)
  const [sections, setSections] = useState<Record<string, boolean>>({ ...homeSettings.sections })
  const [header, setHeader] = useState({ ...homeSettings.header })
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2600)
  }

  const saveLayout = () => {
    saveHomeSettings({ theme, brandColorId, layoutMode, sections })
    showToast('Layout settings saved')
  }
  const saveHeaderFooter = () => {
    saveHomeSettings({ header })
    showToast('Header / footer settings saved')
  }

  return (
    <div className="space-y-5">
      {/* Public Website Theme */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-900">Home Page &amp; Theme Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Configure the public-facing pages theme and home page.</p>
        </div>

        <h2 className="mt-5 flex items-center gap-2 text-base font-bold text-slate-900">
          <Palette className="h-4 w-4 text-brand-500" /> Public Website Theme
        </h2>
        <p className="mt-1 text-sm text-slate-500">Choose the theme and brand colors for public-facing pages.</p>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div>
            <label htmlFor="theme" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Frontend Theme
            </label>
            <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)} className="input">
              {frontendThemes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Brand Colors</p>
            <div className="flex flex-wrap gap-2">
              {brandColors.map((c) => {
                const active = c.id === brandColorId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBrandColorId(c.id)}
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={active}
                    className={cn(
                      'relative h-10 w-10 overflow-hidden rounded-lg ring-offset-2 transition-transform hover:scale-105',
                      active ? 'ring-2 ring-brand-600' : 'ring-1 ring-slate-200',
                    )}
                  >
                    <span className="absolute inset-0" style={{ background: c.primary }} />
                    <span className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: c.accent }} />
                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Homepage Layout */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">{theme} — Homepage Layout</h2>
        <p className="mt-1 text-sm text-slate-500">Control what visitors see on the {theme} home page.</p>

        <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Layout Mode</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <LayoutCard
            active={layoutMode === 'minimal'}
            onClick={() => setLayoutMode('minimal')}
            icon={Minimize2}
            title="Minimal Layout"
            desc="Only shows login/signup and essential access options."
          />
          <LayoutCard
            active={layoutMode === 'full'}
            onClick={() => setLayoutMode('full')}
            icon={LayoutGrid}
            title="Full Layout"
            desc="Shows complete website content including programs, destinations, and resources."
          />
        </div>

        <div className={cn('mt-6', layoutMode === 'minimal' && 'pointer-events-none opacity-50')}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Visible Sections <span className="normal-case text-slate-400">(Full Layout only)</span>
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {homeSections.map((s) => (
              <div
                key={s.key}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5"
              >
                <div className="flex items-start gap-3">
                  <Toggle
                    checked={!!sections[s.key]}
                    onChange={(next) => setSections((prev) => ({ ...prev, [s.key]: next }))}
                    label={s.label}
                  />
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      {s.label}
                      {s.count && (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-600">
                          {s.count()}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                  </div>
                </div>
                {s.configurable && (
                  <button
                    type="button"
                    aria-label={`Configure ${s.label}`}
                    className="mt-0.5 shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-brand-300 hover:text-brand-600"
                    onClick={() => showToast(`${s.label} settings open in a full build`)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={saveLayout}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Save Layout Settings
        </button>
      </section>

      {/* Header / Footer Display */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Header / Footer Display</h2>
        <p className="mt-1 text-sm text-slate-500">Show or hide structural page elements. Applies to all public themes.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <HeaderRow label="Top Bar" desc="Thin promotional / announcement bar above the header." checked={header.topBar} onChange={(v) => setHeader((h) => ({ ...h, topBar: v }))} />
          <HeaderRow label="Menu Bar" desc="Main navigation header with logo and nav links." checked={header.menuBar} onChange={(v) => setHeader((h) => ({ ...h, menuBar: v }))} />
          <HeaderRow label="Footer" desc="Footer columns with links, contact info and newsletter." checked={header.footer} onChange={(v) => setHeader((h) => ({ ...h, footer: v }))} />
          <HeaderRow label="Copyright Bar" desc="Bottom copyright strip with legal text." checked={header.copyright} onChange={(v) => setHeader((h) => ({ ...h, copyright: v }))} />
        </div>

        <button
          onClick={saveHeaderFooter}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Save Header/Footer Settings
        </button>
      </section>

      {/* Connected page settings shortcut */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Page Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Individual public pages are managed in the connected CMS modules.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/cms/countries" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600">
            <ExternalLink className="h-4 w-4" /> Countries
          </a>
          <a href="/cms/pages" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600">
            <ExternalLink className="h-4 w-4" /> Content Pages
          </a>
          <a href="/cms/menu" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600">
            <ExternalLink className="h-4 w-4" /> Menu Manager
          </a>
        </div>
      </section>

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function LayoutCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: typeof LayoutGrid
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
        active ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300',
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', active ? 'text-brand-600' : 'text-slate-400')} />
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
    </button>
  )
}

function HeaderRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
      <Toggle checked={checked} onChange={onChange} label={label} />
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  )
}
