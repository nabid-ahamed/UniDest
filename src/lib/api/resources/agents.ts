import { API_BASE_URL, ApiError, request, USING_REAL_API, mocked } from '../client'
import { getAccessToken } from '../../../store/auth'

/** The document slots an agent profile carries. */
export type AgentDocumentSlot = 'logo' | 'idProof' | 'incorporationCert'

export interface ApiAgent {
  id: number
  publicId: string
  name: string
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  country: string
  state: string
  city: string
  address: string
  category: string
  branchId: number
  /** Resolved branch name — prefer this over branchId for display. */
  branch: string
  pointOfContactId: number | null
  /** Resolved staff name, or null when unassigned. */
  pointOfContact: string | null
  /** Storage keys, not URLs: fetch through `/agents/:id/documents/:slot/file`. */
  logoUrl: string
  idProofUrl: string
  incorporationCertUrl: string
  userId: number | null
  canSubmitApplications: boolean
  autoConvertReferrals: boolean
  commissionRate: number
  status: 'Active' | 'Inactive'
  joined: string
  applications: number
  commissions: number
}

export interface ApiReferral {
  id: number
  type: 'Lead' | 'Student'
  name: string
  email: string
  phone: string
  status: string
  addedOn: string
  agent: { id: number; name: string; email: string | null } | null
}

export interface ApiCommission {
  id: number
  agentId: number
  agent: string
  applicationId: number
  student: string
  studentNo: string
  course: string
  university: string
  intake: string
  amount: number
  currency: string
  status: string
  statusColor: string
  paidAt: string | null
  note: string
  created: string
}

function agentAuthHeaders(): HeadersInit {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const agentsApi = {
  list: () => USING_REAL_API ? request<ApiAgent[]>('/agents') : mocked(() => []),
  get: (id: number) => request<ApiAgent>(`/agents/${id}`),
  create: (data: {
    name: string; firstName?: string; lastName?: string; company?: string; email?: string; phone?: string
    country?: string; state?: string; city?: string; address?: string; category?: string
    branchId?: number; pointOfContactId?: number
    commissionRate?: number; password?: string; canSubmitApplications?: boolean; autoConvertReferrals?: boolean
  }) =>
    request<ApiAgent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, patch: {
    name?: string; firstName?: string; lastName?: string; company?: string; email?: string; phone?: string
    country?: string; state?: string; city?: string; address?: string; category?: string
    branchId?: number; pointOfContactId?: number | null; commissionRate?: number; password?: string
    canSubmitApplications?: boolean; autoConvertReferrals?: boolean
  }) =>
    request<ApiAgent>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: number) => request<{ ok: boolean }>(`/agents/${id}`, { method: 'DELETE' }),

  /**
   * Provision or reset the agent's portal login.
   *
   * Returns a one-time password rather than mailing it — the API has no mail
   * transport, so the operator passes it on out of band.
   */
  invite: (id: number) =>
    request<{ ok: boolean; reset: boolean; email: string; tempPassword: string }>(
      `/agents/${id}/invite`,
      { method: 'POST' },
    ),

  /**
   * Upload (or replace) one of the three document slots.
   *
   * Raw fetch rather than `request`: that helper forces a JSON Content-Type,
   * and multipart needs the browser to set its own boundary.
   */
  uploadDocument: async (id: number, slot: AgentDocumentSlot, file: File): Promise<ApiAgent> => {
    if (!USING_REAL_API) throw new ApiError('File uploads need the API.', 503)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE_URL}/agents/${id}/documents/${slot}`, {
      method: 'POST',
      headers: agentAuthHeaders(),
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new ApiError(body?.message ?? res.statusText, res.status)
    }
    return res.json()
  },

  /** Fetch a document through the authenticated route and save it. */
  downloadDocument: async (id: number, slot: AgentDocumentSlot, filename: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/agents/${id}/documents/${slot}/file`, {
      headers: agentAuthHeaders(),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new ApiError(body?.message ?? res.statusText, res.status)
    }
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },

  removeDocument: (id: number, slot: AgentDocumentSlot) =>
    request<ApiAgent>(`/agents/${id}/documents/${slot}`, { method: 'DELETE' }),
  submissionSetting: () => request<{ enabled: boolean }>('/agents/settings/submission'),
  updateSubmissionSetting: (enabled: boolean) =>
    request<{ enabled: boolean }>('/agents/settings/submission', { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  referrals: (filters?: { search?: string; agentId?: string }) => {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.agentId) params.set('agentId', filters.agentId)
    const query = params.toString()
    return request<ApiReferral[]>(`/agents/referrals${query ? `?${query}` : ''}`)
  },
  commissions: (filters?: { status?: string; from?: string; to?: string; agentId?: string }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.from) params.set('from', filters.from)
    if (filters?.to) params.set('to', filters.to)
    if (filters?.agentId) params.set('agentId', filters.agentId)
    const query = params.toString()
    return request<ApiCommission[]>(`/commissions${query ? `?${query}` : ''}`)
  },
}