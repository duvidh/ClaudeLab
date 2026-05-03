'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { HardHat, Eye, EyeOff, Lock } from 'lucide-react'
import { CRM_SETTING_KEYS } from '@/lib/crm-settings'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('סיסמה שגויה')
      } else if (result?.ok) {
        const from = searchParams.get('from') ?? '/dashboard'
        router.push(from)
        router.refresh()
      } else {
        setError('שגיאת כניסה')
      }
    } catch {
      setError('שגיאת חיבור לשרת')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">סיסמה</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="הכנס סיסמה..."
            autoFocus
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 pe-10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 end-0 pe-3 flex items-center text-gray-500 hover:text-gray-300"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all shadow-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            מתחבר...
          </span>
        ) : 'כניסה'}
      </button>
    </form>
  )
}

function CompanyName() {
  const [name, setName] = useState('CRM קבלנות')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/settings')
        const j = await res.json()
        if (cancelled) return
        const company = j.data?.[CRM_SETTING_KEYS.company]
        if (company && typeof company === 'object' && company !== null && 'name' in company) {
          const n = (company as { name?: unknown }).name
          if (typeof n === 'string' && n) setName(n)
        }
      } catch {
        /* default title */
      }
    })()
    return () => { cancelled = true }
  }, [])

  return <h1 className="text-2xl font-bold text-white">{name}</h1>
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-purple-900/20 pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4 shadow-xl">
            <HardHat size={32} className="text-white" />
          </div>
          <CompanyName />
          <p className="text-sm text-gray-400 mt-1">מערכת ניהול לקוחות</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-300">כניסה למערכת</h2>
          </div>

          <Suspense fallback={<div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <LoginForm />
          </Suspense>

          <p className="text-center text-xs text-gray-600 mt-6">
            ברירת מחדל: הגדר{' '}
            <code className="text-gray-500 bg-gray-700 px-1 rounded">ADMIN_PASSWORD</code>
            {' '}ב‑.env
          </p>
        </div>
      </div>
    </div>
  )
}
