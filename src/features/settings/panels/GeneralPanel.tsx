import { useState } from 'react'
import { Save, ExternalLink, Link2, MessageCircle } from 'lucide-react'
import { Panel } from './ListEditorPanel'
import { settings, saveSettings, frontendThemes } from '../../../mock/settings'

export function GeneralPanel({ onToast }: { onToast: (msg: string) => void }) {
  const [g, setG] = useState({ ...settings.general, social: { ...settings.general.social } })

  const set = (patch: Partial<typeof g>) => setG((prev) => ({ ...prev, ...patch }))
  const setSocial = (patch: Partial<typeof g.social>) => setG((prev) => ({ ...prev, social: { ...prev.social, ...patch } }))

  const save = () => {
    saveSettings('general', g)
    onToast('General settings saved')
  }

  return (
    <div className="space-y-5">
      <Panel title="Organization Profile" description="Your consultancy's public identity.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App Name" required>
            <input value={g.appName} onChange={(e) => set({ appName: e.target.value })} className="input" />
          </Field>
          <Field label="Tagline">
            <input value={g.tagline} onChange={(e) => set({ tagline: e.target.value })} className="input" />
          </Field>
          <Field label="Contact Email">
            <input value={g.email} onChange={(e) => set({ email: e.target.value })} className="input" />
          </Field>
          <Field label="Contact Phone">
            <input value={g.phone} onChange={(e) => set({ phone: e.target.value })} className="input" />
          </Field>
          <Field label="Address" full>
            <input value={g.address} onChange={(e) => set({ address: e.target.value })} className="input" />
          </Field>
        </div>
      </Panel>

      <Panel title="Public Website Theme" description="Theme for public-facing pages and the student panel.">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Frontend Theme">
            <select value={g.theme} onChange={(e) => set({ theme: e.target.value })} className="input w-56">
              {frontendThemes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <a href="/cms/home-page" className="inline-flex items-center gap-1.5 pb-2 text-sm font-semibold text-brand-600 hover:underline">
            <ExternalLink className="h-4 w-4" /> Advanced &amp; Home Page Configuration
          </a>
        </div>
      </Panel>

      <Panel title="Social Media Links" description="Leave blank to hide the icon on the public site.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Facebook" icon={Link2}>
            <input value={g.social.facebook} onChange={(e) => setSocial({ facebook: e.target.value })} placeholder="https://facebook.com/…" className="input" />
          </Field>
          <Field label="Instagram" icon={Link2}>
            <input value={g.social.instagram} onChange={(e) => setSocial({ instagram: e.target.value })} placeholder="https://instagram.com/…" className="input" />
          </Field>
          <Field label="LinkedIn" icon={Link2}>
            <input value={g.social.linkedin} onChange={(e) => setSocial({ linkedin: e.target.value })} placeholder="https://linkedin.com/company/…" className="input" />
          </Field>
          <Field label="YouTube" icon={Link2}>
            <input value={g.social.youtube} onChange={(e) => setSocial({ youtube: e.target.value })} placeholder="https://youtube.com/@…" className="input" />
          </Field>
          <Field label="X (Twitter)" icon={Link2}>
            <input value={g.social.x} onChange={(e) => setSocial({ x: e.target.value })} placeholder="https://x.com/…" className="input" />
          </Field>
          <Field label="WhatsApp Number" icon={MessageCircle}>
            <input value={g.social.whatsapp} onChange={(e) => setSocial({ whatsapp: e.target.value })} placeholder="8801700000000" className="input" />
          </Field>
        </div>
      </Panel>

      <Panel title="Footer" description='Short description shown in the footer "About Us" column.'>
        <textarea value={g.footerAbout} onChange={(e) => set({ footerAbout: e.target.value })} rows={3} className="input resize-y" />
      </Panel>

      <div className="flex justify-end">
        <button
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  required,
  full,
  icon: Icon,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  full?: boolean
  icon?: typeof Link2
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}
