import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: number
  from: 'me' | 'them'
  text: string
  at: number // epoch ms
}

export interface ChatGroup {
  key: string // e.g. "group:1"
  name: string
  memberKeys: string[]
}

interface MessengerState {
  /** Messages per conversation key (contact key or group key). */
  threads: Record<string, ChatMessage[]>
  groups: ChatGroup[]
  send: (key: string, text: string) => void
  createGroup: (name: string, memberKeys: string[]) => string
}

// Threads + created groups persist so conversations survive a reload.
export const useMessenger = create<MessengerState>()(
  persist(
    (set, get) => ({
      threads: {},
      groups: [],
      send: (key, text) =>
        set((s) => {
          const thread = s.threads[key] ?? []
          const msg: ChatMessage = {
            id: (thread[thread.length - 1]?.id ?? 0) + 1,
            from: 'me',
            text,
            at: Date.now(),
          }
          return { threads: { ...s.threads, [key]: [...thread, msg] } }
        }),
      createGroup: (name, memberKeys) => {
        const key = `group:${get().groups.length + 1}`
        set((s) => ({ groups: [{ key, name, memberKeys }, ...s.groups] }))
        return key
      },
    }),
    { name: 'unidest-messenger' },
  ),
)
