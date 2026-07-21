import { Printer, Copy, Table } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { cn } from '../lib/cn'

/** Excel logo-style mark (lucide has no brand icon). */
function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M14 4v16" />
      <path d="M6 8.5l5 7M11 8.5l-5 7" />
    </svg>
  )
}

/** PDF document mark with "PDF" label (lucide has no brand icon). */
function PdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <text
        x="12"
        y="17.5"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        PDF
      </text>
    </svg>
  )
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const EXPORTS = [
  { label: 'Copy', icon: Copy, btn: 'hover:border-slate-600 hover:bg-slate-600', tip: 'bg-slate-700' },
  { label: 'Excel', icon: ExcelIcon, btn: 'hover:border-emerald-600 hover:bg-emerald-600', tip: 'bg-emerald-600' },
  { label: 'CSV', icon: Table, btn: 'hover:border-sky-600 hover:bg-sky-600', tip: 'bg-sky-600' },
  { label: 'PDF', icon: PdfIcon, btn: 'hover:border-rose-600 hover:bg-rose-600', tip: 'bg-rose-600' },
  { label: 'Print', icon: Printer, btn: 'hover:border-indigo-600 hover:bg-indigo-600', tip: 'bg-indigo-600' },
]

export type ExportCell = string | number

/**
 * Copy / Excel / CSV / PDF / Print cluster shared by the data-table pages.
 * The caller owns the data — it passes the header row plus the already-filtered
 * body rows, and gets a toast message back to display.
 */
export function ExportButtons({
  title,
  filename,
  header,
  rows,
  onDone,
}: {
  title: string
  /** Base name without extension, e.g. "students". */
  filename: string
  header: string[]
  rows: ExportCell[][]
  onDone: (message: string) => void
}) {
  const handleExport = (label: string) => {
    if (label === 'Print') {
      const style =
        'body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}h2{margin:0 0 12px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#1f47f5;color:#fff}'
      const table = `<h2>${title}</h2><table><thead><tr>${header
        .map((h) => `<th>${h}</th>`)
        .join('')}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
      const w = window.open('', '_blank', 'width=920,height=680')
      if (!w) {
        onDone('Allow pop-ups to print')
        return
      }
      w.document.write(
        `<!doctype html><html><head><title>${title}</title><style>${style}</style></head><body>${table}</body></html>`,
      )
      w.document.close()
      w.focus()
      w.print()
      return
    }
    if (label === 'Copy') {
      const text = [header, ...rows].map((r) => r.join('\t')).join('\n')
      navigator.clipboard?.writeText(text)
      onDone(`Copied ${rows.length} rows`)
    } else if (label === 'CSV') {
      const cell = (v: ExportCell) => {
        const s = String(v)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\n')
      downloadFile(`${filename}.csv`, csv, 'text/csv;charset=utf-8')
      onDone('CSV downloaded')
    } else if (label === 'Excel') {
      const html = `<table border="1">${[header, ...rows]
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</table>`
      downloadFile(`${filename}.xls`, html, 'application/vnd.ms-excel')
      onDone('Excel downloaded')
    } else if (label === 'PDF') {
      const doc = new jsPDF()
      doc.setFontSize(14)
      doc.text(title, 14, 15)
      autoTable(doc, {
        head: [header],
        body: rows.map((r) => r.map(String)),
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 71, 245] },
      })
      doc.save(`${filename}.pdf`)
      onDone('PDF downloaded')
    }
  }

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      {EXPORTS.map((ex) => (
        <div key={ex.label} className="group relative">
          <button
            onClick={() => handleExport(ex.label)}
            aria-label={ex.label}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:text-white',
              ex.btn,
            )}
          >
            <ex.icon className="h-4 w-4" />
          </button>
          <span
            className={cn(
              'pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100',
              ex.tip,
            )}
          >
            {ex.label}
          </span>
        </div>
      ))}
    </div>
  )
}
