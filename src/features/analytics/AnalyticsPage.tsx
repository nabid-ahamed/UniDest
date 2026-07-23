import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { BarChart3, RotateCcw } from 'lucide-react'
import { Field } from '../../components/DataTableUI'
import { ExportButtons } from '../../components/ExportButtons'
import {
  reportTypes,
  analyticsBranches,
  computeReport,
  type ReportType,
  type ReportResult,
} from '../../mock/analytics'

export default function AnalyticsPage() {
  const [type, setType] = useState<ReportType | ''>('')
  const [branch, setBranch] = useState('All Branches')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [report, setReport] = useState<{ type: ReportType; result: ReportResult } | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { t?: number }).t)
    ;(showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(''), 2500)
  }

  const showReport = () => {
    if (!type) return showToast('Please select a report type')
    setReport({ type, result: computeReport(type, { branch, from, to }) })
  }

  const clear = () => {
    setType('')
    setBranch('All Branches')
    setFrom('')
    setTo('')
    setReport(null)
  }

  return (
    <div className="space-y-5">
      {/* View form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="View">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="input"
              aria-label="Select a Report Type"
            >
              <option value="">Select a Report Type</option>
              {reportTypes.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Date Range">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="From date"
                className="input"
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="To date"
                className="input"
              />
            </div>
          </Field>
          <Field label="Branch">
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input">
              {analyticsBranches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={showReport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <BarChart3 className="h-4 w-4" /> Show Report
          </button>
          <button
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-6 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      {/* Report output */}
      {report && (
        <ReportView
          type={report.type}
          result={report.result}
          branch={branch}
          onExportDone={showToast}
        />
      )}

      {toast && (
        <div className="animate-toast-in fixed right-4 top-20 z-[120] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function ReportView({
  type,
  result,
  branch,
  onExportDone,
}: {
  type: ReportType
  result: ReportResult
  branch: string
  onExportDone: (msg: string) => void
}) {
  if (result.empty) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        No data available for <span className="font-semibold text-slate-700">{type}</span> with the
        selected filters.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">
          {type}
          {branch !== 'All Branches' && <span className="text-slate-500"> · {branch}</span>}
        </h2>
        <ExportButtons
          title={type}
          filename={type.toLowerCase().replace(/\s+/g, '-')}
          header={result.headers}
          rows={result.rows}
          onDone={onExportDone}
        />
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {result.tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="truncate text-xl font-bold tabular-nums text-slate-900" title={t.value}>
              {t.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">{result.chartTitle}</h3>
          <div className="mt-3" style={{ minHeight: 280 }}>
            <ResponsiveContainer width="100%" height={280} debounce={200}>
              <BarChart data={result.chart} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={54}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(51,102,255,0.06)' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
                  {result.chart.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="border-b border-slate-100 p-4 text-base font-bold text-slate-800">
            {result.breakdownTitle}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-600">
                  {result.headers.map((h) => (
                    <th key={h} className="px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 text-sm">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={
                          j === 0
                            ? 'px-4 py-2.5 font-medium text-slate-700'
                            : 'px-4 py-2.5 tabular-nums text-slate-600'
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
