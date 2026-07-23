import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Undo2, Plus, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Field } from '../../components/DataTableUI'
import { students } from '../../mock/students'
import {
  businesses,
  businessById,
  formatMoney,
  addStudentInvoice,
  updateStudentInvoice,
  studentInvoiceById,
  invoiceNowStamp,
  type InvoiceItem,
  type StudentInvoice,
} from '../../mock/studentInvoices'

interface DraftItem extends InvoiceItem {
  key: number
}

/** Create + edit share this one form (route /invoices/student/new and /:id/edit). */
export default function StudentInvoiceFormPage() {
  const { id } = useParams()
  const existing = id ? studentInvoiceById(Number(id)) : undefined
  const isEdit = Boolean(existing)

  const [businessId, setBusinessId] = useState(existing?.businessId ?? businesses[0].id)
  const [studentNo, setStudentNo] = useState(existing?.studentNo ?? '')
  const [dueDate, setDueDate] = useState(toInputDate(existing?.dueDate))
  const [terms, setTerms] = useState(existing?.terms ?? 'Payable within 30 days of issue.')
  const [discount, setDiscount] = useState(String(existing?.discount ?? 0))
  const [emailClient, setEmailClient] = useState(false)
  const [tried, setTried] = useState(false)
  const [saved, setSaved] = useState(false)
  const [items, setItems] = useState<DraftItem[]>(
    existing && existing.items.length
      ? existing.items.map((it, i) => ({ ...it, key: i }))
      : [{ description: '', amount: 0, key: 0 }],
  )

  const biz = businessById(businessId)
  const student = useMemo(() => students.find((s) => s.studentNo === studentNo), [studentNo])

  const subTotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0)
  const grandTotal = Math.max(0, subTotal - (Number(discount) || 0))

  const addRow = () => setItems((rows) => [...rows, { description: '', amount: 0, key: Date.now() }])
  const removeRow = (key: number) =>
    setItems((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows))
  const setItem = (key: number, patch: Partial<InvoiceItem>) =>
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const validItems = items.filter((it) => it.description.trim() && Number(it.amount) > 0)

  const save = () => {
    setTried(true)
    if (!student || validItems.length === 0) return
    const payload: Omit<StudentInvoice, 'id'> = {
      date: existing?.date ?? invoiceNowStamp(),
      businessId,
      studentNo: student.studentNo,
      student: student.name,
      email: student.email,
      phone: student.phone,
      dueDate: fromInputDate(dueDate),
      items: validItems.map(({ description, amount }) => ({ description: description.trim(), amount: Number(amount) })),
      discount: Number(discount) || 0,
      terms: terms.trim(),
      payments: existing?.payments ?? [],
    }
    if (existing) updateStudentInvoice({ ...existing, ...payload })
    else addStudentInvoice(payload)
    setSaved(true)
    window.setTimeout(() => window.location.assign('/invoices/student'), 700)
  }

  const inputCls = (bad?: boolean) => cn('input', bad && 'border-rose-500')

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
        <a
          href="/invoices/student"
          aria-label="Back to Student Invoices"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
        >
          <Undo2 className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: business + student */}
        <div className="space-y-4">
          <Field label="Select Business">
            <select value={businessId} onChange={(e) => setBusinessId(Number(e.target.value))} className="input">
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <label htmlFor="si-student" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Select Student <span className="text-rose-600">*</span>
            </label>
            <select
              id="si-student"
              value={studentNo}
              onChange={(e) => setStudentNo(e.target.value)}
              className={inputCls(tried && !student)}
            >
              <option value="">- Select -</option>
              {students.map((s) => (
                <option key={s.studentNo} value={s.studentNo}>
                  {s.name} ({s.studentNo})
                </option>
              ))}
            </select>
            {tried && !student && (
              <p role="alert" className="mt-1.5 text-sm text-rose-600">
                Please select a student.
              </p>
            )}
          </div>

          {/* Bill To */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
            <p className="font-bold text-slate-700">Bill To</p>
            {student ? (
              <>
                <p className="mt-1 font-semibold text-slate-800">{student.name}</p>
                <p className="text-slate-500 [overflow-wrap:anywhere]">Email: {student.email}</p>
                <p className="text-slate-500">Mob: {student.phone}</p>
              </>
            ) : (
              <p className="mt-1 text-slate-400">Select a student to fill billing details.</p>
            )}
          </div>
        </div>

        {/* Right: business options + due date */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
            <p className="font-bold text-slate-700">Options</p>
            <p className="mt-1 text-slate-600">Address: {biz.address}</p>
            <p className="text-slate-600">Ph: {biz.phone}</p>
            <p className="text-slate-600 [overflow-wrap:anywhere]">Email: {biz.email}</p>
            <p className="text-slate-600">GSTN: {biz.gstn}</p>
            <p className="text-slate-600">Currency: {biz.currency}</p>
          </div>
          <Field label="Due Date">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </Field>
        </div>
      </div>

      {/* Line items */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border border-slate-200">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold text-slate-700">
              <th className="w-16 px-3 py-2.5">Sl.No</th>
              <th className="px-3 py-2.5">Item &amp; Description</th>
              <th className="w-48 px-3 py-2.5">Amount ({biz.currency})</th>
              <th className="w-12 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.key} className="border-b border-slate-100">
                <td className="px-3 py-2.5 text-center text-slate-600">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <input
                    value={it.description}
                    onChange={(e) => setItem(it.key, { description: e.target.value })}
                    placeholder="Enter item / description"
                    aria-label={`Item ${i + 1} description`}
                    className="input"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="number"
                    value={it.amount || ''}
                    onChange={(e) => setItem(it.key, { amount: Number(e.target.value) })}
                    placeholder="0.00"
                    aria-label={`Item ${i + 1} amount`}
                    className="input"
                  />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(it.key)}
                    aria-label={`Remove item ${i + 1}`}
                    disabled={items.length === 1}
                    className="rounded-md p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tried && validItems.length === 0 && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          Add at least one item with a description and amount.
        </p>
      )}

      <button
        type="button"
        onClick={addRow}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> Add More
      </button>

      {/* Terms + totals */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="si-terms" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Terms &amp; Conditions
          </label>
          <textarea
            id="si-terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={5}
            className="input"
          />
        </div>
        <div className="space-y-3 self-start rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Sub Total</span>
            <span className="font-semibold text-slate-800">{formatMoney(biz.currency, subTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Discount (-)</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">{biz.currency}</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                aria-label="Discount"
                className="input w-28 py-1.5 text-right"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="font-bold text-slate-700">Grand Total</span>
            <span className="font-bold text-slate-900">{formatMoney(biz.currency, grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col items-center gap-3 border-t border-slate-100 pt-5">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={emailClient}
            onChange={(e) => setEmailClient(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Email invoice to client
        </label>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saved}
            className="rounded-lg bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {saved ? 'Saved ✓' : isEdit ? 'Save Changes' : 'Create'}
          </button>
          <a
            href="/invoices/student"
            className="rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  )
}

/** "dd-mm-yyyy" (stored) → "yyyy-mm-dd" (date input). */
function toInputDate(stored?: string): string {
  if (!stored) return ''
  const [d, m, y] = stored.split('-')
  return y && m && d ? `${y}-${m}-${d}` : ''
}
/** "yyyy-mm-dd" (date input) → "dd-mm-yyyy" (stored). Empty stays empty. */
function fromInputDate(input: string): string {
  if (!input) return ''
  const [y, m, d] = input.split('-')
  return `${d}-${m}-${y}`
}
