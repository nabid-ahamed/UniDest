// Mock data for the Referral Signups module (modeled on the EduCtrl demo's
// referral-signups page). Docs: docs/superpowers/mock-data/adminpage.md.
//
// A referral signup = a student who joined through another student's referral
// link, so both sides reference the Students module.

import { students } from './students'

export interface ReferralSignup {
  id: number
  date: string // "22-04-2026 01:18 pm"
  studentId: number // the student who signed up (Name column)
  studentNo: string
  student: string
  referrerId: number | null // the referring student (Refered By column)
  referrer: string | null // null → only the ID is known
  /** Referral commission; null renders "--" until set. */
  commission: number | null
}

/** Referral commissions are paid in Bangladeshi Taka. */
export const referralCurrency = 'BDT'

/** e.g. "৳ 5,000.00" — Taka symbol with grouped digits. */
export const formatCommission = (amount: number) =>
  `৳ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const st = (i: number) => students[i]
const SIGNUPS_KEY = 'unidest-referral-signups'

const seedSignups: ReferralSignup[] = [
  { id: 1, date: '22-04-2026 01:18 pm', studentId: st(0).id, studentNo: st(0).studentNo, student: st(0).name, referrerId: st(2).id, referrer: st(2).name, commission: 5000 },
  { id: 2, date: '22-02-2026 11:03 am', studentId: st(1).id, studentNo: st(1).studentNo, student: st(1).name, referrerId: st(3).id, referrer: st(3).name, commission: null },
  { id: 3, date: '18-11-2025 11:25 am', studentId: st(5).id, studentNo: st(5).studentNo, student: st(5).name, referrerId: st(4).id, referrer: st(4).name, commission: null },
  { id: 4, date: '04-08-2025 10:11 pm', studentId: st(6).id, studentNo: st(6).studentNo, student: st(6).name, referrerId: st(8).id, referrer: null, commission: 5000 },
  { id: 5, date: '09-07-2025 09:41 am', studentId: st(9).id, studentNo: st(9).studentNo, student: st(9).name, referrerId: st(11).id, referrer: st(11).name, commission: 15000 },
  { id: 6, date: '21-01-2025 11:02 am', studentId: st(10).id, studentNo: st(10).studentNo, student: st(10).name, referrerId: st(2).id, referrer: st(2).name, commission: 3000 },
  { id: 7, date: '14-12-2024 12:44 pm', studentId: st(12).id, studentNo: st(12).studentNo, student: st(12).name, referrerId: st(13).id, referrer: st(13).name, commission: 20000 },
  { id: 8, date: '14-12-2024 12:38 pm', studentId: st(14).id, studentNo: st(14).studentNo, student: st(14).name, referrerId: st(7).id, referrer: st(7).name, commission: 12000 },
  { id: 9, date: '13-12-2024 10:55 pm', studentId: st(3).id, studentNo: st(3).studentNo, student: st(3).name, referrerId: st(11).id, referrer: st(11).name, commission: 10000 },
]

export function loadReferralSignups(): ReferralSignup[] {
  try {
    const raw = localStorage.getItem(SIGNUPS_KEY)
    if (!raw) return seedSignups
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedSignups
  } catch {
    return seedSignups
  }
}

export const referralSignups: ReferralSignup[] = loadReferralSignups()

export function saveReferralSignups(next: ReferralSignup[]) {
  try {
    localStorage.setItem(SIGNUPS_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked — the commission update just won't persist.
  }
}

export function setReferralCommission(id: number, amount: number) {
  const i = referralSignups.findIndex((r) => r.id === id)
  if (i >= 0) referralSignups[i] = { ...referralSignups[i], commission: amount }
  saveReferralSignups([...referralSignups])
}

/* ---------- Referral Payout (aggregates the signups above by referrer) ---------- */

export interface PayPreference {
  mode: string // "Bank Transfer" / "bKash" / "Nagad" / ...
  details: string
}

export const payoutModes = ['Bank Transfer', 'bKash', 'Nagad', 'Rocket', 'Cash']

/** Each referrer's chosen payout method (keyed by their student id). */
export const payPreferences: Record<number, PayPreference> = {
  [st(2).id]: { mode: 'bKash', details: '+880 1710 445566' },
  [st(3).id]: { mode: 'Bank Transfer', details: 'BRAC Bank · 1502 0345 6789' },
  [st(4).id]: { mode: 'Nagad', details: '+880 1811 220033' },
  [st(7).id]: { mode: 'Rocket', details: '+880 1911 556677' },
  [st(8).id]: { mode: 'Cash', details: 'Collect from Dhaka branch' },
  [st(11).id]: { mode: 'Bank Transfer', details: 'City Bank · 2201 8899 0011' },
  [st(13).id]: { mode: 'bKash', details: '+880 1521 334455' },
}

export interface ReferralPayout {
  referrerId: number
  referrer: string
  mode: string
  details: string
  count: number // referrals that month
  reward: number // total commission owed
}

/** "22-04-2026 01:18 pm" → "2026-04". */
function monthKeyOf(date: string): string {
  const [d] = date.split(' ')
  const [, mm, yyyy] = d.split('-')
  return `${yyyy}-${mm}`
}

/** Distinct months that actually have referral signups, newest first. */
export function payoutMonths(): { value: string; label: string }[] {
  const keys = [...new Set(referralSignups.map((r) => monthKeyOf(r.date)))].sort().reverse()
  return keys.map((value) => {
    const [y, m] = value.split('-')
    const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(Number(y), Number(m) - 1, 1),
    )
    return { value, label }
  })
}

/** Payout summary for a month: one row per referrer, referrals counted and rewards summed. */
export function computePayouts(monthKey: string): ReferralPayout[] {
  const rows = referralSignups.filter((r) => monthKeyOf(r.date) === monthKey && r.referrerId != null)
  const byReferrer = new Map<number, ReferralPayout>()
  for (const r of rows) {
    const key = r.referrerId as number
    const existing = byReferrer.get(key)
    if (existing) {
      existing.count += 1
      existing.reward += r.commission ?? 0
    } else {
      const pref = payPreferences[key]
      byReferrer.set(key, {
        referrerId: key,
        referrer: r.referrer ?? `ID: ${key}`,
        mode: pref?.mode ?? '—',
        details: pref?.details ?? '—',
        count: 1,
        reward: r.commission ?? 0,
      })
    }
  }
  return [...byReferrer.values()].sort((a, b) => b.reward - a.reward)
}
