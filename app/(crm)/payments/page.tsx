'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, Download, CreditCard, TrendingUp, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'

type Payment = {
  id: string
  amount: number
  date: string
  method: string | null
  reference: string | null
  notes: string | null
  project: { id: string; name: string; client: { id: string; name: string } | null } | null
}

const METHOD_LABELS: Record<string, string> = {
  'מזומן': 'מזומן',
  "צ'ק": "צ'ק",
  'העברה': 'העברה בנקאית',
  'כרטיס': 'כרטיס אשראי',
  'אחר': 'אחר',
}

function exportCSV(payments: Payment[]) {
  const headers = ['תאריך', 'לקוח', 'פרויקט', 'סכום', 'אמצעי תשלום', 'אסמכתא', 'הערות']
  const rows = payments.map((p) => [
    new Date(p.date).toLocaleDateString('he-IL'),
    p.project?.client?.name ?? '',
    p.project?.name ?? '',
    p.amount.toString(),
    p.method ?? '',
    p.reference ?? '',
    p.notes ?? '',
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [methodFilter, setMethodFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (methodFilter) params.set('method', methodFilter)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    try {
      const res = await fetch(`/api/payments?${params}`)
      const json = await res.json()
      setPayments(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [methodFilter, fromDate, toDate])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPayments() }, [fetchPayments])

  const total = payments.reduce((s, p) => s + p.amount, 0)
  const thisMonth = payments
    .filter((p) => {
      const d = new Date(p.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, p) => s + p.amount, 0)

  const methods = Array.from(new Set(payments.map((p) => p.method).filter(Boolean))) as string[]

  return (
    <div>
      <PageHeader
        title="תשלומים"
        subtitle={`${payments.length} תשלומים`}
        actions={
          <button
            onClick={() => exportCSV(payments)}
            disabled={payments.length === 0}
            title="ייצוא CSV"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={16} />
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs text-gray-500 mb-1">סה&quot;כ תשלומים</p>
          <p className="text-xl font-bold text-green-400">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-600 mt-0.5">{payments.length} עסקאות</p>
        </Card>
        <Card>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={11} className="text-gray-500" />
            <p className="text-xs text-gray-500">החודש</p>
          </div>
          <p className="text-xl font-bold text-blue-400">{formatCurrency(thisMonth)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={11} className="text-gray-500" />
            <p className="text-xs text-gray-500">ממוצע לעסקה</p>
          </div>
          <p className="text-xl font-bold text-white">
            {payments.length > 0 ? formatCurrency(total / payments.length) : '—'}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 whitespace-nowrap">מתאריך</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 whitespace-nowrap">עד תאריך</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {methods.length > 0 && (
          <div className="w-44">
            <Select
              options={[
                { value: '', label: 'כל אמצעי התשלום' },
                ...methods.map((m) => ({ value: m, label: METHOD_LABELS[m] ?? m })),
              ]}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            />
          </div>
        )}
        {(fromDate || toDate || methodFilter) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); setMethodFilter('') }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            נקה סינון
          </button>
        )}
        <button
          onClick={fetchPayments}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="אין תשלומים"
          description="תשלומים נרשמים מתוך עמוד הפרויקט"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700 text-gray-400 text-xs">
                <th className="px-4 py-3 font-semibold text-right">תאריך</th>
                <th className="px-4 py-3 font-semibold text-right">לקוח</th>
                <th className="px-4 py-3 font-semibold text-right">פרויקט</th>
                <th className="px-4 py-3 font-semibold text-right">סכום</th>
                <th className="px-4 py-3 font-semibold text-right">אמצעי תשלום</th>
                <th className="px-4 py-3 font-semibold text-right">אסמכתא</th>
                <th className="px-4 py-3 font-semibold text-right">הערות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-300">{formatDate(p.date)}</td>
                  <td className="px-4 py-3">
                    {p.project?.client ? (
                      <Link href={`/clients/${p.project.client.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                        {p.project.client.name}
                      </Link>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.project ? (
                      <Link href={`/projects/${p.project.id}`} className="text-gray-300 hover:text-white transition-colors">
                        {p.project.name}
                      </Link>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-300">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-400">{p.method ? (METHOD_LABELS[p.method] ?? p.method) : '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.reference || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-800/40 border-t border-gray-700">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-400">
                  סה&quot;כ {payments.length} תשלומים
                </td>
                <td className="px-4 py-3 font-bold text-green-300">{formatCurrency(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
