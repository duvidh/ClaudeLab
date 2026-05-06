'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'

type Contract = {
  id: string
  title: string
  contractType: string
  totalValue: number
  status: string
  supplier: { id: string; name: string } | null
  signedDate: string | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  createdAt: string
}

const CONTRACT_TYPE_OPTIONS = [
  { value: 'FIXED_PRICE', label: 'מחיר קבוע' },
  { value: 'TURN_KEY', label: 'מפתח ביד' },
  { value: 'COST_PLUS', label: 'עלות + רווח' },
  { value: 'TIME_AND_MATERIAL', label: 'זמן וחומרים' },
  { value: 'BOQ', label: 'כמויות (BOQ)' },
]

const CONTRACT_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'טיוטה' },
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'COMPLETED', label: 'הושלם' },
  { value: 'TERMINATED', label: 'בוטל' },
  { value: 'EXPIRED', label: 'פג תוקף' },
]

const TYPE_COLOR: Record<string, string> = {
  FIXED_PRICE: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  TURN_KEY: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  COST_PLUS: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  TIME_AND_MATERIAL: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  BOQ: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  ACTIVE: 'bg-green-500/15 text-green-700 dark:text-green-400',
  COMPLETED: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  TERMINATED: 'bg-red-500/15 text-red-700 dark:text-red-400',
  EXPIRED: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
}

const TYPE_LABEL: Record<string, string> = {
  FIXED_PRICE: 'מחיר קבוע', TURN_KEY: 'מפתח ביד', COST_PLUS: 'עלות + רווח',
  TIME_AND_MATERIAL: 'זמן וחומרים', BOQ: 'כמויות',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'טיוטה', ACTIVE: 'פעיל', COMPLETED: 'הושלם', TERMINATED: 'בוטל', EXPIRED: 'פג תוקף',
}

interface ContractsListProps {
  projectId: string
}

export function ContractsList({ projectId }: ContractsListProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/contracts`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/suppliers').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([ct, sup]) => {
      setContracts(ct.data ?? [])
      setSuppliers(sup.data ?? [])
      setLoading(false)
    })
  }, [projectId])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setContracts((prev) => [json.data, ...prev])
      setAddOpen(false)
    }
  }

  async function handleStatusChange(contractId: string, status: string) {
    const res = await fetch(`/api/projects/${projectId}/contracts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contractId, status }),
    })
    if (res.ok) {
      const json = await res.json()
      setContracts((prev) => prev.map((c) => (c.id === contractId ? json.data : c)))
    }
  }

  async function handleDelete(contractId: string) {
    setDeletingId(contractId)
    try {
      const res = await fetch(`/api/projects/${projectId}/contracts?contractId=${contractId}`, { method: 'DELETE' })
      if (res.ok) setContracts((prev) => prev.filter((c) => c.id !== contractId))
    } finally { setDeletingId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalValue = contracts.filter((c) => c.status !== 'TERMINATED').reduce((s, c) => s + c.totalValue, 0)
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">חוזי ספקים וקבלני משנה</h3>
          {contracts.length > 0 && (
            <span className="text-xs text-gray-500">
              {activeCount} פעילים · {formatCurrency(totalValue)}
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          הוסף חוזה
        </Button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="אין חוזים רשומים"
          action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />הוסף חוזה ראשון</Button>}
        />
      ) : (
        <div className="space-y-2">
          {contracts.map((contract) => (
            <Card key={contract.id} className="group">
              <div className="flex items-center gap-3">
                <button className="flex-1 min-w-0 text-right" onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{contract.title}</span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${TYPE_COLOR[contract.contractType] ?? ''}`}>
                      {TYPE_LABEL[contract.contractType] ?? contract.contractType}
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${STATUS_COLOR[contract.status] ?? ''}`}>
                      {STATUS_LABEL[contract.status] ?? contract.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {contract.totalValue > 0 && (
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(contract.totalValue)}</span>
                    )}
                    {contract.supplier && <span className="text-xs text-gray-500">{contract.supplier.name}</span>}
                    {contract.startDate && <span className="text-xs text-gray-400">{formatDate(contract.startDate)}</span>}
                    {contract.endDate && <span className="text-xs text-gray-400">→ {formatDate(contract.endDate)}</span>}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={contract.status}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(contract.id, e.target.value) }}
                    className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-gray-600 dark:text-gray-400 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {CONTRACT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button
                    onClick={() => handleDelete(contract.id)}
                    disabled={deletingId === contract.id}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {expandedId === contract.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expandedId === contract.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5 ps-3">
                  {contract.signedDate && (
                    <p className="text-xs text-gray-500">חתימה: <span className="text-gray-700 dark:text-gray-300">{formatDate(contract.signedDate)}</span></p>
                  )}
                  {contract.notes && (
                    <p className="text-xs text-gray-500">הערות: <span className="text-gray-700 dark:text-gray-300">{contract.notes}</span></p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="חוזה חדש" size="md">
        <ContractForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} suppliers={suppliers} />
      </Modal>
    </div>
  )
}

function ContractForm({
  onSubmit,
  onCancel,
  suppliers,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  suppliers: { id: string; name: string }[]
}) {
  const [form, setForm] = useState({
    title: '',
    contractType: 'FIXED_PRICE',
    totalValue: '',
    status: 'DRAFT',
    supplierId: '',
    signedDate: '',
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        totalValue: form.totalValue ? parseFloat(form.totalValue) : 0,
        supplierId: form.supplierId || undefined,
        signedDate: form.signedDate || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
      })
    } finally { setLoading(false) }
  }

  const supplierOptions = [
    { value: '', label: 'ללא ספק / קבלן' },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="כותרת חוזה *" placeholder="לדוגמה: חוזה עבודות עפר" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="סוג חוזה" options={CONTRACT_TYPE_OPTIONS} value={form.contractType} onChange={(e) => set('contractType', e.target.value)} />
        <Select label="סטטוס" options={CONTRACT_STATUS_OPTIONS} value={form.status} onChange={(e) => set('status', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="ערך חוזה (₪)" type="number" min="0" step="0.01" placeholder="0" value={form.totalValue} onChange={(e) => set('totalValue', e.target.value)} />
        {suppliers.length > 0 && (
          <Select label="ספק / קבלן" options={supplierOptions} value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)} />
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="תאריך חתימה" type="date" value={form.signedDate} onChange={(e) => set('signedDate', e.target.value)} />
        <Input label="תאריך התחלה" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        <Input label="תאריך סיום" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
      </div>
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
        הערות
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.title} className="flex-1">הוסף חוזה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
