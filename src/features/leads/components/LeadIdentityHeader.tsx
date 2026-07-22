import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Mail, Phone, Globe, QrCode, MessageCircle, User, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { pickTextColor } from '../../../lib/contrast'
import { leadStatuses, type Lead } from '../../../mock/leads'

/**
 * Identity header shared by the lead detail and edit-profile pages: initials
 * avatar, name, contact row (with a working QR dialog), country, status badge
 * and the assignee on the right.
 */
export function LeadIdentityHeader({ lead, onChat }: { lead: Lead; onChat?: () => void }) {
  const [qrOpen, setQrOpen] = useState(false)
  const statusColor = leadStatuses.find((s) => s.label === lead.status)?.color ?? lead.statusColor
  const initials = lead.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-4 pt-6 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{lead.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 [overflow-wrap:anywhere]">
              <Mail className="h-4 w-4 text-slate-400" />
              {lead.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-slate-400" />
              {lead.phone}
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                aria-label="Show QR code"
                className="text-brand-600 hover:text-brand-700"
              >
                <QrCode className="h-4 w-4" />
              </button>
              {onChat && (
                <button
                  type="button"
                  onClick={onChat}
                  aria-label="Chat"
                  className="text-brand-600 hover:text-brand-700"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              )}
            </span>
          </div>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm uppercase text-slate-600">
            <Globe className="h-4 w-4 text-slate-400" />
            {lead.countryOfResidence ?? '-'}
          </p>
          <div className="mt-2">
            <span
              className="rounded-md px-2 py-1 text-xs font-semibold"
              style={{ backgroundColor: statusColor, color: pickTextColor(statusColor) }}
            >
              {lead.status}
            </span>
          </div>
        </div>
      </div>
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <User className="h-4 w-4 text-slate-400" />
        {lead.assignedTo ?? 'Unassigned'}
      </p>

      {/* Contact QR code */}
      {qrOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-title"
          >
            <div
              className="animate-fade-in absolute inset-0 bg-slate-500/60"
              onClick={() => setQrOpen(false)}
            />
            <div className="animate-dialog-in relative w-full max-w-sm rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 id="qr-title" className="text-lg font-bold text-slate-800">
                  Contact QR Code
                </h2>
                <button
                  type="button"
                  onClick={() => setQrOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col items-center px-6 py-8">
                {/* Scanning opens the phone dialer with this lead's number. */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <QRCodeSVG value={`tel:${lead.phone.replace(/\s+/g, '')}`} size={192} />
                </div>
                <p className="mt-4 font-semibold text-slate-800">{lead.name}</p>
                <p className="mt-0.5 text-sm tabular-nums text-slate-600">{lead.phone}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Scan with your phone to call this lead
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
