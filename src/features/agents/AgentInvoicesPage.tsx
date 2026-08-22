import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download, Eye } from 'lucide-react'
import { useAgentCommissions, useAgents, type ApiCommission } from '../../lib/api'
import { ExportButtons } from '../../components/ExportButtons'

async function downloadInvoice(row: ApiCommission) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  pdf.setFontSize(18)
  pdf.text(`Agent Invoice #${row.id}`, 20, 24)
  pdf.setFontSize(11)
  pdf.text(`Agent: ${row.agent}`, 20, 40)
  pdf.text(`Student: ${row.student} (${row.studentNo})`, 20, 50)
  pdf.text(`Application: #${row.applicationId}`, 20, 60)
  pdf.text(`University: ${row.university || 'Not set'}`, 20, 70)
  pdf.text(`Course: ${row.course || 'Not set'}`, 20, 80)
  pdf.text(`Amount: ${row.currency} ${row.amount.toFixed(2)}`, 20, 100)
  pdf.text(`Status: ${row.status}`, 20, 110)
  pdf.text(`Date: ${row.created}`, 20, 120)
  pdf.save(`agent-invoice-${row.id}.pdf`)
}

export default function AgentInvoicesPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [agentId, setAgentId] = useState(params.get('agentId') ?? '')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data: agents = [] } = useAgents()
  const { data = [], isLoading } = useAgentCommissions({ status, agentId, from, to })
  const exportRows = data.map((row) => [row.id, row.agent, row.student, row.applicationId, row.university, row.course, row.intake, row.amount, row.currency, row.status, row.created])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-bold text-slate-900">Agent Invoices</h1><p className="mt-1 text-sm text-slate-500">Commission records for referred applications.</p></div>
        <ExportButtons title="Agent Invoices" filename="agent-invoices" header={['Invoice', 'Agent', 'Student', 'Application', 'University', 'Course', 'Intake', 'Amount', 'Currency', 'Status', 'Date']} rows={exportRows} onDone={() => {}} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="input"><option value="">All agents</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input"><option value="">All statuses</option><option>Pending</option><option>Paid</option></select>
        <label className="text-xs font-medium text-slate-600">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input mt-1 w-full" /></label>
        <label className="text-xs font-medium text-slate-600">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input mt-1 w-full" /></label>
      </div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1100px]"><thead><tr className="border-y border-slate-200 bg-brand-50/60 text-left text-sm font-semibold text-slate-700"><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Agent</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Application</th><th className="px-4 py-3">University / Course</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">Loading invoices...</td></tr> : data.map((row) => <tr key={row.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 font-semibold text-slate-800">#{row.id}</td><td className="px-4 py-4 text-slate-600">{row.agent}</td><td className="px-4 py-4 text-slate-600">{row.student}<br /><span className="text-xs text-slate-500">{row.studentNo}</span></td><td className="px-4 py-4"><Link to={`/applications/${row.applicationId}`} className="font-semibold text-brand-600 hover:underline">#{row.applicationId}</Link><p className="text-xs text-slate-500">{row.intake || 'Intake not set'}</p></td><td className="px-4 py-4 text-slate-600">{row.university || '—'}<br /><span className="text-xs text-slate-500">{row.course || 'Course not set'}</span></td><td className="px-4 py-4 font-semibold text-slate-800">{row.currency} {row.amount.toFixed(2)}</td><td className="px-4 py-4"><span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{row.status}</span></td><td className="px-4 py-4 text-slate-600">{row.created}</td><td className="flex gap-1 px-4 py-4"><Link to={`/applications/${row.applicationId}`} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" title="View application"><Eye className="h-4 w-4" /></Link><button onClick={() => void downloadInvoice(row)} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" title="Download invoice"><Download className="h-4 w-4" /></button></td></tr>)}{!isLoading && data.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">No invoices found.</td></tr>}</tbody></table></div>
    </section>
  )
}
