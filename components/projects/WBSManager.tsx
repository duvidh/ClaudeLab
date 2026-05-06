'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'

type WorkPackage = {
  id: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  budget: number
  status: string
  assignee: { id: string; name: string } | null
  createdAt: string
}

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'מתוכנן' },
  { value: 'IN_PROGRESS', label: 'בביצוע' },
  { value: 'COMPLETED', label: 'הושלם' },
  { value: 'ON_HOLD', label: 'מושהה' },
  { value: 'CANCELLED', label: 'בוטל' },
]

const STATUS_COLOR: Record<string, string> = {
  PLANNED: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  COMPLETED: 'bg-green-500/15 text-green-700 dark:text-green-400',
  ON_HOLD: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  CANCELLED: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'מתוכנן', IN_PROGRESS: 'בביצוע', COMPLETED: 'הושלם', ON_HOLD: 'מושהה', CANCELLED: 'בוטל',
}

const STATUS_BAR: Record<string, string> = {
  PLANNED: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  CANCELLED: 'bg-red-500',
}

interface WBSManagerProps {
  projectId: string
}

export function WBSManager({ projectId }: WBSManagerProps) {
  const [packages, setPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/work-packages`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/employees?status=ACTIVE').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([wp, emp]) => {
      setPackages(wp.data ?? [])
      setEmployees(emp.data ?? [])
      setLoading(false)
    })
  }, [projectId])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/work-packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setPackages((prev) => [...prev, json.data])
      setAddOpen(false)
    }
  }

  async function handleStatusChange(wpId: string, status: string) {
    const res = await fetch(`/api/projects/${projectId}/work-packages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: wpId, status }),
    })
    if (res.ok) {
      const json = await res.json()
      setPackages((prev) => prev.map((p) => (p.id === wpId ? json.data : p)))
    }
  }

  async function handleDelete(wpId: string) {
    setDeletingId(wpId)
    try {
      const res = await fetch(`/api/projects/${projectId}/work-packages?wpId=${wpId}`, { method: 'DELETE' })
      if (res.ok) setPackages((prev) => prev.filter((p) => p.id !== wpId))
    } finally { setDeletingId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalBudget = packages.reduce((s, p) => s + p.budget, 0)
  const completedCount = packages.filter((p) => p.status === 'COMPLETED').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">חבילות עבודה (WBS)</h3>
          {packages.length > 0 && (
            <span className="text-xs text-gray-500">
              {completedCount}/{packages.length} הושלמו · {formatCurrency(totalBudget)}
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          הוסף חבילה
        </Button>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="אין חבילות עבודה"
          action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />הוסף חבילה ראשונה</Button>}
        />
      ) : (
        <div className="space-y-2">
          {packages.map((wp) => (
            <Card key={wp.id} className="group">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full shrink-0 ${STATUS_BAR[wp.status] ?? 'bg-gray-400'}`} />
                <button className="flex-1 min-w-0 text-right" onClick={() => setExpandedId(expandedId === wp.id ? null : wp.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{wp.name}</span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${STATUS_COLOR[wp.status] ?? ''}`}>
                      {STATUS_LABEL[wp.status] ?? wp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {wp.budget > 0 && <span className="text-xs text-gray-500">{formatCurrency(wp.budget)}</span>}
                    {wp.assignee && <span className="text-xs text-gray-500">{wp.assignee.name}</span>}
                    {wp.startDate && <span className="text-xs text-gray-400">{formatDate(wp.startDate)}</span>}
                    {wp.endDate && <span className="text-xs text-gray-400">→ {formatDate(wp.endDate)}</span>}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={wp.status}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(wp.id, e.target.value) }}
                    className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 text-gray-600 dark:text-gray-400 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button
                    onClick={() => handleDelete(wp.id)}
                    disabled={deletingId === wp.id}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === wp.id ? null : wp.id)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {expandedId === wp.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {expandedId === wp.id && wp.description && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 ps-5">
                  <p className="text-xs text-gray-500 mb-0.5">תיאור</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{wp.description}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="חבילת עבודה חדשה" size="md">
        <WPForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} employees={employees} />
      </Modal>
    </div>
  )
}

function WPForm({
  onSubmit,
  onCancel,
  employees,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  employees: { id: string; name: string }[]
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'PLANNED',
    assigneeId: '',
  })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        budget: form.budget ? parseFloat(form.budget) : 0,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        assigneeId: form.assigneeId || undefined,
      })
    } finally { setLoading(false) }
  }

  const assigneeOptions = [
    { value: '', label: 'ללא שיוך' },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="שם חבילת עבודה *" placeholder="לדוגמה: עבודות בטון" value={form.name} onChange={(e) => set('name', e.target.value)} />
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
        תיאור
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Input label="תאריך התחלה" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        <Input label="תאריך סיום" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="תקציב (₪)" type="number" min="0" step="0.01" placeholder="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
        <Select label="סטטוס" options={STATUS_OPTIONS} value={form.status} onChange={(e) => set('status', e.target.value)} />
      </div>
      {employees.length > 0 && (
        <Select label="אחראי" options={assigneeOptions} value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} />
      )}
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.name} className="flex-1">הוסף חבילה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
