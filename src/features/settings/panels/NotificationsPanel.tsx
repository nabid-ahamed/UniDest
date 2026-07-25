import { useState } from 'react'
import { Save, ExternalLink, Mail, MessageSquare, Zap } from 'lucide-react'
import { Toggle } from '../../cms/components/Toggle'
import { Panel } from './ListEditorPanel'
import { settings, saveSettings } from '../../../mock/settings'

const CHANNELS: { key: 'emailEnabled' | 'smsEnabled' | 'whatsappEnabled'; label: string; icon: typeof Mail }[] = [
  { key: 'emailEnabled', label: 'Email', icon: Mail },
  { key: 'smsEnabled', label: 'SMS', icon: MessageSquare },
  { key: 'whatsappEnabled', label: 'WhatsApp', icon: Zap },
]

const EVENTS: { key: 'newLead' | 'newStudent' | 'applicationUpdate' | 'invoicePaid' | 'webinarReminder'; label: string; desc: string }[] = [
  { key: 'newLead', label: 'New Lead', desc: 'When a lead is created or captured.' },
  { key: 'newStudent', label: 'New Student', desc: 'When a lead converts to a student.' },
  { key: 'applicationUpdate', label: 'Application Update', desc: 'When an application status changes.' },
  { key: 'invoicePaid', label: 'Invoice Paid', desc: 'When a student invoice is marked paid.' },
  { key: 'webinarReminder', label: 'Webinar Reminder', desc: 'Before an upcoming webinar.' },
]

export function NotificationsPanel({ onToast }: { onToast: (msg: string) => void }) {
  const [n, setN] = useState({ ...settings.notifications })
  const set = (patch: Partial<typeof n>) => setN((prev) => ({ ...prev, ...patch }))

  const save = () => {
    saveSettings('notifications', n)
    onToast('Notification settings saved')
  }

  return (
    <div className="space-y-5">
      <Panel title="Channels" description="Which channels this workspace can send through.">
        <div className="grid gap-3 sm:grid-cols-3">
          {CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <c.icon className="h-4 w-4 text-slate-400" /> {c.label}
              </span>
              <Toggle checked={n[c.key]} onChange={(v) => set({ [c.key]: v } as Partial<typeof n>)} label={c.label} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Message content is managed in{' '}
          <a href="/message-templates/email" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
            Message Templates <ExternalLink className="h-3 w-3" />
          </a>
          .
        </p>
      </Panel>

      <Panel title="Events" description="Trigger a notification when these things happen.">
        <div className="grid gap-3 md:grid-cols-2">
          {EVENTS.map((e) => (
            <div key={e.key} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
              <div>
                <p className="text-sm font-semibold text-slate-800">{e.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{e.desc}</p>
              </div>
              <Toggle checked={n[e.key]} onChange={(v) => set({ [e.key]: v } as Partial<typeof n>)} label={e.label} />
            </div>
          ))}
        </div>
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
