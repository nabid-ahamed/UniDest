import { request, USING_REAL_API, mocked } from '../client'

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
  pointOfContactId: number | null
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
    branchId?: number; pointOfContactId?: number; commissionRate?: number; password?: string
    canSubmitApplications?: boolean; autoConvertReferrals?: boolean
  }) =>
    request<ApiAgent>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: number) => request<{ ok: boolean }>(`/agents/${id}`, { method: 'DELETE' }),
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