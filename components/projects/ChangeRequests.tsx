'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, GitPullRequest, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'

type ChangeRequest = {
  id: string
  title: string
  description: string | null
  costImpact: number
  timeImpact: number
  status: string
  isCompleted: boolean
  requestedBy: { id: string; name: string } | null
  approvedBy: { id: string; name: string } | null
  approvedAt: string | null
  createdAt: string
}

type Employee = { id: string; name: string }

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  APPROVED: 'bg-green-500/15 text-green-700 dark:text-green-400',
  REJECTED: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'ממתין לאישור',
  APPROVED: 'אושר',
  REJECTED: 'נדחה',
}

const FILTER_TABS = [
  { value: '', label: 'הכל' },
  { value: 'PENDING', label: 'ממתינים' },
  { value: 'APPROVED', label: 'מאושרים' },
  { value: 'REJECTED', label: 'נדחים' },
]

interface ChangeRequestsProps {
  projectId: string
}

export function ChangeRequests({ projectId }: ChangeRequestsProps) {
  const [items, setItems] = useState<ChangeRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approverSelectId, setApproverSelectId] = useState<string | null>(null)
  const [selectedApproverId, setSelectedApproverId] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/change-requests`).then((r) => r.json()),
      fetch('/api/employees?status=ACTIVE').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([cr, emp]) => {
      setItems(cr.data ?? [])
      setEmployees(emp.data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/change-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setItems((prev) => [json.data, ...prev])
      setAddOpen(false)
    }
  }

  async function handleApproveReject(id: string, action: 'APPROVE' | 'REJECT', approvedById?: string) {
    setApprovingId(id)
    try {
      const res = await fetch(`/api/projects/${projectId}/change-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, approvedById: approvedById || undefined }),
      })
      if (res.ok) {
        const json = await res.json()
        setItems((prev) => prev.map((c) => c.id === id ? { ...c, ...json.data } : c))
        setApproverSelectId(null)
        setSelectedApproverId('')
      }
    } finally { setApprovingId(null) }
  }

  async function handleToggleCompleted(id: string, isCompleted: boolean) {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/projects/${projectId}/change-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isCompleted }),
      })
      if (res.ok) {
        const json = await res.json()
        setItems((prev) => prev.map((c) => c.id === id ? { ...c, isCompleted: json.data.isCompleted } : c))
      }
    } finally { setTogglingId(null) }
  }

  const filtered = filter ? items.filter((c) => c.status === filter) : items
  const pendingCount = items.filter((c) => c.status === 'PENDING').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">בקשות שינוי</h3>
          {pendingCount > 0 && (
            <span className="text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
              {pendingCount} ממתינות
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          בקשת שינוי חדשה
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-lg p-0.5 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === tab.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="אין בקשות שינוי"
          action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />בקשה ראשונה</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((cr) => (
            <Card key={cr.id} className="group">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <button
                    className="w-full text-right"
                    onClick={() => setExpandedId(expandedId === cr.id ? null : cr.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{cr.title}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${STATUS_COLOR[cr.status] ?? ''}`}>
                        {STATUS_LABEL[cr.status] ?? cr.status}
                      </span>
                      {cr.status === 'APPROVED' && cr.isCompleted && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-400">
                          בוצע
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                      {cr.costImpact !== 0 && (
                        <span className={cr.costImpact > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                          עלות: {cr.costImpact > 0 ? '+' : ''}{formatCurrency(cr.costImpact)}
                        </span>
                      )}
                      {cr.timeImpact !== 0 && (
                        <span className={cr.timeImpact > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                          זמן: {cr.timeImpact > 0 ? '+' : ''}{cr.timeImpact} ימים
                        </span>
                      )}
                      {cr.requestedBy && <span>הוגש ע&quot;י {cr.requestedBy.name}</span>}
                      <span>{formatDate(cr.createdAt)}</span>
                    </div>
                  </button>

                  {/* Approval actions for pending CRs */}
                  {cr.status === 'PENDING' && (
                    <div className="mt-2">
                      {approverSelectId === cr.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {employees.length > 0 && (
                            <Select
                              options={[
                                { value: '', label: 'ללא שיוך מאשר' },
                                ...employees.map((e) => ({ value: e.id, label: e.name })),
                              ]}
                              value={selectedApproverId}
                              onChange={(e) => setSelectedApproverId(e.target.value)}
                            />
                          )}
                          <Button
                            size="sm"
                            loading={approvingId === cr.id}
                            onClick={() => handleApproveReject(cr.id, 'APPROVE', selectedApproverId || undefined)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check size={13} />
                            אשר
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={approvingId === cr.id}
                            onClick={() => handleApproveReject(cr.id, 'REJECT', selectedApproverId || undefined)}
                          >
                            <X size={13} />
                            דחה
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setApproverSelectId(null); setSelectedApproverId('') }}>
                            ביטול
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setApproverSelectId(cr.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          אשר / דחה →
                        </button>
                      )}
                    </div>
                  )}

                  {/* isCompleted toggle — only for APPROVED CRs */}
                  {cr.status === 'APPROVED' && (
                    <button
                      onClick={() => handleToggleCompleted(cr.id, !cr.isCompleted)}
                      disabled={togglingId === cr.id}
                      className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-all disabled:opacity-60 ${
                        cr.isCompleted
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cr.isCompleted
                        ? <CheckSquare size={13} className="shrink-0" />
                        : <Square size={13} className="shrink-0" />}
                      בוצע בפועל
                    </button>
                  )}

                  {cr.status !== 'PENDING' && cr.approvedBy && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      {cr.status === 'APPROVED' ? 'אושר' : 'נדחה'} ע&quot;י {cr.approvedBy.name}
                      {cr.approvedAt && ` · ${formatDate(cr.approvedAt)}`}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setExpandedId(expandedId === cr.id ? null : cr.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
                >
                  {expandedId === cr.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>

              {expandedId === cr.id && cr.description && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">תיאור</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{cr.description}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="בקשת שינוי חדשה" size="md">
        <ChangeRequestForm
          employees={employees}
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  )
}

function ChangeRequestForm({
  employees,
  onSubmit,
  onCancel,
}: {
  employees: Employee[]
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    costImpact: '',
    timeImpact: '',
    requestedById: '',
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
        costImpact: form.costImpact ? parseFloat(form.costImpact) : 0,
        timeImpact: form.timeImpact ? parseInt(form.timeImpact) : 0,
        requestedById: form.requestedById || undefined,
      })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="כותרת *" placeholder="תאר את בקשת השינוי" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
        תיאור / נימוק
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="השפעה על עלות (₪)"
          type="number"
          placeholder="0 (שלילי = חיסכון)"
          value={form.costImpact}
          onChange={(e) => set('costImpact', e.target.value)}
        />
        <Input
          label='השפעה על לו"ז (ימים)'
          type="number"
          placeholder="0 (שלילי = קיצור)"
          value={form.timeImpact}
          onChange={(e) => set('timeImpact', e.target.value)}
        />
      </div>
      {employees.length > 0 && (
        <Select
          label='הוגש ע"י'
          options={[{ value: '', label: 'ללא שיוך' }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
          value={form.requestedById}
          onChange={(e) => set('requestedById', e.target.value)}
        />
      )}
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.title} className="flex-1">שלח בקשה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
