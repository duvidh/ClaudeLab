'use client'

import { Bell, Menu, Search, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Users, UserCheck, FolderKanban, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/header'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useUiStore } from '@/lib/store/uiStore'

interface Notification {
  id: string
  message: string
  type: string
  isRead: boolean
  relatedEntity: string | null
  createdAt: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
}
const TYPE_COLOR: Record<string, string> = {
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  success: 'text-green-400',
  error: 'text-red-400',
}

type SearchResult = {
  type: 'lead' | 'client' | 'project'
  id: string
  label: string
  sub: string
  status: string
  href: string
}

const RESULT_ICON: Record<string, React.ElementType> = { lead: Users, client: UserCheck, project: FolderKanban }
const RESULT_LABEL: Record<string, string> = { lead: 'ליד', client: 'לקוח', project: 'פרויקט' }

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const globalSearchOpen = useUiStore((s) => s.globalSearchOpen)
  const setGlobalSearchOpen = useUiStore((s) => s.setGlobalSearchOpen)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setGlobalSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setGlobalSearchOpen])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.length < 2) { setResults([]); setGlobalSearchOpen(false); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json.data ?? [])
        setGlobalSearchOpen(true)
      } finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [query, setGlobalSearchOpen])

  function handleSelect(href: string) {
    setGlobalSearchOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <div className="flex-1 max-w-sm relative" ref={searchRef}>
      <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 pointer-events-none" />
      {loading && (
        <div className="absolute top-1/2 -translate-y-1/2 left-3 w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
      <input
        type="text"
        placeholder="חיפוש לידים, לקוחות, פרויקטים..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setGlobalSearchOpen(true)}
        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pr-9 pl-3 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
      />
      {globalSearchOpen && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((r) => {
            const Icon = RESULT_ICON[r.type] ?? Users
            return (
              <button
                key={r.id}
                onClick={() => handleSelect(r.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-right"
              >
                <Icon size={15} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{r.label}</p>
                  <p className="text-xs text-gray-500 truncate">{r.sub}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{RESULT_LABEL[r.type]}</span>
              </button>
            )
          })}
        </div>
      )}
      {globalSearchOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 px-4 py-3">
          <p className="text-sm text-gray-500 text-center">לא נמצאו תוצאות עבור &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  )
}

interface HeaderProps {
  onMenuOpen: () => void
}

export function Header({ onMenuOpen }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function fetchUnreadCount() {
    try {
      const res = await fetch('/api/notifications')
      const json = await res.json()
      setUnreadCount(json.unreadCount ?? 0)
    } catch {}
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchUnreadCount() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function openPanel() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const json = await res.json()
      setNotifications(json.data ?? [])
      setUnreadCount(json.unreadCount ?? 0)
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  function formatRelative(dateStr: string) {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'עכשיו'
    if (min < 60) return `לפני ${min} דק'`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `לפני ${hr} שע'`
    return `לפני ${Math.floor(hr / 24)} ימים`
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={onMenuOpen}
        className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Menu size={20} />
      </button>

      <GlobalSearch />

      <div className="mr-auto flex items-center gap-2">
        <ThemeToggle />
        <div className="relative" ref={ref}>
          <button
            onClick={openPanel}
            className={`relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${open ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">התראות</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <CheckCheck size={13} />
                    סמן הכל כנקרא
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    אין התראות
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = TYPE_ICON[n.type] ?? Info
                    const color = TYPE_COLOR[n.type] ?? 'text-blue-400'
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && markRead(n.id)}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 transition-colors ${
                          n.isRead ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <Icon size={15} className={`shrink-0 mt-0.5 ${color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-900 dark:text-white leading-snug">{n.message}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{formatRelative(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
            מ
          </div>
          <div className="absolute end-0 top-10 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
            <button
              onClick={() => {
                void signOut({ callbackUrl: '/login' })
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut size={13} />
              התנתק
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
