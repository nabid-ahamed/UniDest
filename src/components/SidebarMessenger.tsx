import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Users,
  User,
  UserPlus,
  ChevronUp,
  Search,
  Plus,
  Minus,
  X,
  Paperclip,
  SendHorizonal,
  UsersRound,
  Check,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { pickTextColor } from '../lib/contrast'
import { useAuth } from '../store/auth'
import { avatarColor, initials } from '../mock/staff'
import { contactsFor, type Contact, type ContactKind } from '../mock/messenger'
import { relativeTime } from '../mock/notifications'
import { useMessenger } from '../store/messenger'

/** Clock time like "09:10 PM" for message bubbles. */
function formatTime(t: number): string {
  const d = new Date(t)
  const m = String(d.getMinutes()).padStart(2, '0')
  const h = d.getHours()
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

const TABS: { kind: ContactKind; icon: typeof Users }[] = [
  { kind: 'Team', icon: Users },
  { kind: 'Student', icon: User },
  { kind: 'Lead', icon: UserPlus },
]

/** A round avatar with the person's initials on a name-derived colour. */
function Avatar({ name, size = 'h-9 w-9 text-sm' }: { name: string; size?: string }) {
  const bg = avatarColor(name)
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full font-bold', size)}
      style={{ backgroundColor: bg, color: pickTextColor(bg) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

/**
 * Sidebar messenger. The Team / Student / Agent tabs pick which audience to chat
 * with (lists sourced live from Staff / Students / Applications). Start 1-to-1
 * conversations or create a group; messages persist via the messenger store.
 */
export function SidebarMessenger() {
  const user = useAuth((s) => s.user)
  const groups = useMessenger((s) => s.groups)
  const threads = useMessenger((s) => s.threads)
  const send = useMessenger((s) => s.send)
  const createGroup = useMessenger((s) => s.createGroup)

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ContactKind>('Team')
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(true)
  const [groupMode, setGroupMode] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupPick, setGroupPick] = useState<Set<string>>(new Set())
  // Open chat windows — up to 2. Index 0 = rightmost (first opened); a new
  // conversation opens to its left; a 3rd replaces the 1st (rightmost) window.
  const [chats, setChats] = useState<Contact[]>([])
  const [minimized, setMinimized] = useState<Set<string>>(new Set())
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const rootRef = useRef<HTMLDivElement>(null)

  const adminName = user?.name || 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()

  const contacts = useMemo(() => contactsFor(tab), [tab])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? contacts.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q)) : contacts
  }, [contacts, search])

  // Close when clicking outside the whole widget.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const openTab = (k: ContactKind) => {
    setTab(k)
    setGroupMode(false)
    setOpen(true)
  }

  /**
   * Open a conversation window. A new chat always enters on the LEFT; when 2 are
   * already open the windows shift right and the oldest (rightmost) drops off —
   * i.e. #3 takes #2's slot, #2 takes #1's slot, #1 closes.
   */
  const openChat = (c: Contact) => {
    setChats((prev) => {
      if (prev.some((x) => x.key === c.key)) return prev
      if (prev.length < 2) return [...prev, c]
      return [prev[1], c]
    })
    setMinimized((prev) => {
      const n = new Set(prev)
      n.delete(c.key)
      return n
    })
  }
  const closeChat = (key: string) => {
    setChats((prev) => prev.filter((x) => x.key !== key))
    setMinimized((prev) => {
      const n = new Set(prev)
      n.delete(key)
      return n
    })
  }
  const toggleMin = (key: string) =>
    setMinimized((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  const sendTo = (key: string) => {
    const text = (drafts[key] ?? '').trim()
    if (!text) return
    send(key, text)
    setDrafts((p) => ({ ...p, [key]: '' }))
  }
  const introFor = (c: Contact) =>
    c.key.startsWith('group:')
      ? `Group "${c.name}" created. Say hello 👋`
      : `Hi! This is ${c.name.split(' ')[0]}. Start the conversation.`

  const togglePick = (key: string) =>
    setGroupPick((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const submitGroup = () => {
    const name = groupName.trim()
    if (!name) return
    const key = createGroup(name, [...groupPick])
    setGroupMode(false)
    setGroupName('')
    const count = groupPick.size
    setGroupPick(new Set())
    openChat({ key, name, email: `${count} member${count === 1 ? '' : 's'}` })
  }

  /* ---- shared bits ---- */
  // The clip lives on an inner wrapper (for the round image), so the green
  // "active" dot on the outer span isn't cut off by overflow-hidden.
  const adminAvatar = (
    <span className="relative inline-flex h-9 w-9 shrink-0">
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-brand-600 text-sm font-bold text-white">
        {user?.avatar ? (
          <img src={user.avatar} alt={adminName} className="h-full w-full object-cover" />
        ) : (
          adminInitial
        )}
      </span>
      <span
        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
        aria-label="Active"
      />
    </span>
  )

  return (
    <div ref={rootRef}>
      {/* ---- Floating chat windows — up to 2, bottom-aligned; index 1 sits to
             the left of index 0 (the first-opened, rightmost one) ---- */}
      {chats.map((c, i) => {
        const right = i === 0 ? '26.5rem' : '45rem'
        const isGroup = c.key.startsWith('group:')
        if (minimized.has(c.key)) {
          return (
            <div
              key={c.key}
              style={{ right }}
              className="fixed bottom-0 z-[60] flex w-72 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-t-xl bg-brand-600 px-3 py-2 text-white shadow-lg"
            >
              <button type="button" onClick={() => toggleMin(c.key)} className="flex min-w-0 flex-1 items-center gap-2">
                {isGroup ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20"><UsersRound className="h-3.5 w-3.5" /></span>
                ) : (
                  <Avatar name={c.name} size="h-6 w-6 text-[10px]" />
                )}
                <span className="truncate text-sm font-semibold">{c.name}</span>
              </button>
              <button type="button" onClick={() => closeChat(c.key)} aria-label="Close chat" className="rounded p-0.5 hover:bg-white/15">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        }
        const thread = threads[c.key] ?? []
        return (
          <div
            key={c.key}
            style={{ right }}
            className="fixed bottom-0 z-[60] flex h-[26rem] max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-t-xl border border-b-0 border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-2 bg-brand-600 px-3 py-2.5 text-white">
              {isGroup ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><UsersRound className="h-4 w-4" /></span>
              ) : (
                <Avatar name={c.name} size="h-8 w-8 text-xs" />
              )}
              <p className="min-w-0 flex-1 truncate text-sm font-bold">{c.name}</p>
              <button type="button" onClick={() => toggleMin(c.key)} aria-label="Minimize" className="rounded p-1 hover:bg-white/15">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => closeChat(c.key)} aria-label="Close chat" className="rounded p-1 hover:bg-white/15">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
              <div className="flex justify-start">
                <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">{introFor(c)}</p>
              </div>
              {thread.map((m) => (
                <div key={m.id} className={cn('flex flex-col', m.from === 'me' ? 'items-end' : 'items-start')}>
                  <p className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm', m.from === 'me' ? 'rounded-tr-sm bg-brand-600 text-white' : 'rounded-tl-sm bg-white text-slate-700')}>
                    {m.text}
                  </p>
                  <span className="mt-0.5 px-1 text-[10px] text-slate-400">{formatTime(m.at)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 p-2.5">
              <button type="button" aria-label="Attach" className="shrink-0 text-slate-400 hover:text-slate-600">
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                value={drafts[c.key] ?? ''}
                onChange={(e) => setDrafts((p) => ({ ...p, [c.key]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && sendTo(c.key)}
                placeholder="Type a message..."
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
              <button type="button" onClick={() => sendTo(c.key)} disabled={!(drafts[c.key] ?? '').trim()} aria-label="Send" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40">
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}

      {/* ---- Messenger card — docked bottom-right. Header (tab strip) on top,
             contacts/list below when open ---- */}
      <div
        className={cn(
          'fixed bottom-0 right-[72px] z-40 flex w-72 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-lg',
          open && 'max-h-[58vh]',
        )}
      >
        {/* Header — avatar | Team / Student / Lead | arrow */}
        <div className="flex shrink-0 items-center justify-between px-3 py-1.5">
          <button type="button" onClick={() => openTab('Team')} aria-label="Open messenger" className="rounded-full">
            {adminAvatar}
          </button>
          <div className="flex items-center gap-1">
            {TABS.map(({ kind, icon: Icon }) => (
              <button
                key={kind}
                type="button"
                onClick={() => openTab(kind)}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors',
                  open && tab === kind ? 'text-brand-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {kind}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => (open ? setOpen(false) : openTab(tab))}
            aria-label={open ? 'Collapse messenger' : 'Expand messenger'}
            aria-expanded={open}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ChevronUp className={cn('h-5 w-5 transition-transform duration-300', open && 'rotate-180')} />
          </button>
        </div>

        {open && (
          <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100">
          {groupMode ? (
            /* ---- Create group ---- */
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
              <p className="mt-3 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Add {tab} members ({groupPick.size})
              </p>
              <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                {contacts.map((c) => {
                  const picked = groupPick.has(c.key)
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => togglePick(c.key)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <Avatar name={c.name} size="h-8 w-8 text-xs" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{c.name}</span>
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border',
                          picked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300',
                        )}
                      >
                        {picked && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => { setGroupMode(false); setGroupPick(new Set()); setGroupName('') }}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitGroup}
                  disabled={!groupName.trim()}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            /* ---- People list ---- */
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Groups are a Team-only feature. */}
              {tab === 'Team' && (
                <div className="flex justify-end px-3 pt-2.5">
                  <button
                    type="button"
                    onClick={() => setGroupMode(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    <UsersRound className="h-4 w-4" /> Create Group
                  </button>
                </div>
              )}
              <div className="px-3 pt-2.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search staff/group in conversations"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Groups */}
              {groups.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Your Groups ({groups.length})</p>
                  {groups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => openChat({ key: g.key, name: g.name, email: `${g.memberKeys.length} members` })}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                        <UsersRound className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{g.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-slate-100 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  All {tab} Members ({filtered.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowList((v) => !v)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  {showList ? 'Hide' : 'Show'}
                </button>
              </div>

              {showList && (
                <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {filtered.map((c) => {
                    const t = threads[c.key]
                    const last = t && t.length ? t[t.length - 1] : null
                    return (
                      <div key={c.key} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                        <Avatar name={c.name} size="h-8 w-8 text-xs" />
                        <button
                          type="button"
                          onClick={() => openChat(c)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-[13px] font-semibold text-slate-800">{c.name}</p>
                          {last ? (
                            <>
                              <p className="truncate text-[11px] text-slate-500">You › {last.text}</p>
                              <p className="text-[10px] text-slate-400">{relativeTime(last.at)}</p>
                            </>
                          ) : (
                            <p className="truncate text-[11px] text-slate-500">{c.email}</p>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openChat(c)}
                          aria-label={`Message ${c.name}`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                  {filtered.length === 0 && (
                    <p className="px-3 py-8 text-center text-sm text-slate-400">No {tab.toLowerCase()} found.</p>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
}
