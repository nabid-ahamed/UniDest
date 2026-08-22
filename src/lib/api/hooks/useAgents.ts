import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { agentsApi } from '../resources/agents'
import { qk } from '../keys'

export function useAgents() {
  return useQuery({ queryKey: qk.agents.list(), queryFn: agentsApi.list })
}

export function useAgent(id: number | undefined) {
  return useQuery({ queryKey: qk.agents.detail(id!), queryFn: () => agentsApi.get(id!), enabled: id !== undefined })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: agentsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: qk.agents.all }) })
}

export function useAgentReferrals(filters?: { search?: string; agentId?: string }) {
  return useQuery({ queryKey: [...qk.agents.referrals(), filters ?? {}], queryFn: () => agentsApi.referrals(filters) })
}

export function useAgentCommissions(filters?: { status?: string; from?: string; to?: string; agentId?: string }) {
  return useQuery({ queryKey: [...qk.agents.commissions(), filters ?? {}], queryFn: () => agentsApi.commissions(filters) })
}

export function useUpdateAgent() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof agentsApi.update>[1] }) => agentsApi.update(id, patch), onSuccess: () => qc.invalidateQueries({ queryKey: qk.agents.all }) })
}

export function useAgentSubmissionSetting() {
  return useQuery({ queryKey: [...qk.agents.all, 'submission-setting'], queryFn: agentsApi.submissionSetting })
}

export function useUpdateAgentSubmissionSetting() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: agentsApi.updateSubmissionSetting, onSuccess: () => qc.invalidateQueries({ queryKey: [...qk.agents.all, 'submission-setting'] }) })
}

export function useDeleteAgent() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: agentsApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: qk.agents.all }) })
}