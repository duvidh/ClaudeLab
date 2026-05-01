'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Receipt, CheckCircle2, Clock, Trash2, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { formatCurrency, formatDate } from '@/lib/utils'

type Invoice = {
  id: string
  number: string
  clientId: string
  client: { id: string; name: string }
  amount: number
  date: string
  dueDate: string | null
  isPaid: boolean
  createdAt: string
}

const FILTER_OPTIONS = [
  { value: '', label: 'כל החשבוניות' },
  { value: 'false', label: 'ממתינות לתשלום' },
  { value: 'true', label: 'שולמו' },
]

function exportInvoicesCSV(invoices: Invoice[]) {
  const headers = ['מספר', 'לקוח', 'סכום', 'תאריך', 'תאריך פירעון', 'סטטוס']
  const rows = invoices.map((inv) => [
    inv.number,
    inv.client.name,
    inv.amount.toString(),
    new Date(inv.date).toLocaleDateString('he-IL'),
    inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('he-IL') : '',
    inv.isPaid ? 'שולמה' : 'ממתינה',
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter) params.set('isPaid', filter)
    try {
      const res = await fetch(`/api/invoices?${params}`)
      const json = await res.json()
      setInvoices(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvoices()
  }, [fetchInvoices])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setCreateOpen(false)
      await fetchInvoices()
    }
  }

  async function markPaid(invoice: Invoice) {
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaid: !invoice.isPaid }),
    })
    if (res.ok) {
      const json = await res.json()
      setInvoices((prev) => prev.map((inv) => inv.id === invoice.id ? { ...inv, isPaid: json.data.isPaid } : inv))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/invoices/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } finally {
      setDeleting(false) }
  }

  const totalUnpaid = invoices.filter((i) => !i.isPaid).reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <PageHeader
        title="חשבוניות"
        subtitle={`${invoices.length} חשבוניות · ${invoices.filter((i) => !i.isPaid).length} ממתינות`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportInvoicesCSV(invoices)}
              disabled={invoices.length === 0}
              title="ייצוא CSV"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
            </button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              חשבונית חדשה
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs text-gray-500 mb-1">ממתינות לתשלום</p>
          <p className="text-xl font-bold text-yellow-400">{formatCurrency(totalUnpaid)}</p>
          <p className="text-xs text-gray-600 mt-0.5">{invoices.filter((i) => !i.isPaid).length} חשבוניות</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">שולמו</p>
          <p className="text-xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-gray-600 mt-0.5">{invoices.filter((i) => i.isPaid).length} חשבוניות</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">סה&quot;כ</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalUnpaid + totalPaid)}</p>
          <p className="text-xs text-gray-600 mt-0.5">{invoices.length} חשבוניות</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-48">
          <Select options={FILTER_OPTIONS} value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <button
          onClick={fetchInvoices}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="אין חשבוניות"
          description="הוסף חשבוניות ללקוחות ועקוב אחרי גבייה"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />חשבונית חדשה</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700 text-gray-400 text-xs">
                <th className="px-4 py-3 font-semibold text-right">מספר</th>
                <th className="px-4 py-3 font-semibold text-right">לקוח</th>
                <th className="px-4 py-3 font-semibold text-right">סכום</th>
                <th className="px-4 py-3 font-semibold text-right">תאריך</th>
                <th className="px-4 py-3 font-semibold text-right">תאריך פירעון</th>
                <th className="px-4 py-3 font-semibold text-right">סטטוס</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {invoices.map((inv) => {
                const isOverdue = !inv.isPaid && inv.dueDate && new Date(inv.dueDate) < new Date()
                return (
                  <tr key={inv.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">{inv.number}</td>
                    <td className="px-4 py-3 font-medium text-white">{inv.client.name}</td>
                    <td className="px-4 py-3 font-semibold text-white">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3">
                      {inv.dueDate ? (
                        <span className={isOverdue ? 'text-red-400 font-medium' : 'text-gray-400'}>
                          {formatDate(inv.dueDate)}
                          {isOverdue && <span className="ms-1 text-[10px]">פגה</span>}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => markPaid(inv)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                          inv.isPaid
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                        }`}
                      >
                        {inv.isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {inv.isPaid ? 'שולמה' : 'ממתינה'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="חשבונית חדשה" size="md">
        <InvoiceForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="מחיקת חשבונית"
        message={`האם למחוק חשבונית ${deleteTarget?.number}?`}
        confirmLabel="מחק"
        loading={deleting}
      />
    </div>
  )
}

function InvoiceForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    clientId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((j) => setClients(j.data ?? []))
  }, [])

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId || !form.amount) return
    setLoading(true)
    try {
      await onSubmit({
        clientId: form.clientId,
        amount: form.amount,
        date: form.date || undefined,
        dueDate: form.dueDate || undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">לקוח *</label>
        <select
          value={form.clientId}
          onChange={(e) => set('clientId', e.target.value)}
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">בחר לקוח...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <Input
        label="סכום *"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={form.amount}
        onChange={(e) => set('amount', e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="תאריך חשבונית"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
        />
        <Input
          label="תאריך פירעון"
          type="date"
          value={form.dueDate}
          onChange={(e) => set('dueDate', e.target.value)}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.clientId || !form.amount} className="flex-1">
          צור חשבונית
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
