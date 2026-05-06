'use client'

import { useState, useEffect } from 'react'
import { Plus, Shield, CheckCircle2, XCircle, Minus, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/utils'

type ChecklistItem = { item: string; passed: boolean | null }

type NCR = {
  id: string
  title: string
  severity: string
  status: string
  createdAt: string
}

type QualityCheck = {
  id: string
  title: string
  checklistItems: string
  status: string
  notes: string | null
  inspector: { id: string; name: string } | null
  ncrs: NCR[]
  createdAt: string
}

type Employee = { id: string; name: string }

const QC_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  PASSED: 'bg-green-500/15 text-green-700 dark:text-green-400',
  FAILED: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const QC_STATUS_LABEL: Record<string, string> = {
  PENDING: 'ממתין', IN_PROGRESS: 'בביצוע', PASSED: 'עבר', FAILED: 'נכשל',
}

const NCR_SEVERITY_COLOR: Record<string, string> = {
  LOW: 'text-green-600 dark:text-green-400',
  MEDIUM: 'text-yellow-600 dark:text-yellow-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  CRITICAL: 'text-red-600 dark:text-red-400',
}

const NCR_STATUS_LABEL: Record<string, string> = {
  OPEN: 'פתוח', IN_PROGRESS: 'בטיפול', RESOLVED: 'נפתר', CLOSED: 'סגור',
}

interface QualityChecksProps {
  projectId: string
}

export function QualityChecks({ projectId }: QualityChecksProps) {
  const [checks, setChecks] = useState<QualityCheck[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [ncrOpen, setNcrOpen] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/quality-checks`).then((r) => r.json()),
      fetch('/api/employees?status=ACTIVE').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([qc, emp]) => {
      setChecks(qc.data ?? [])
      setEmployees(emp.data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [projectId])

  async function handleCreateCheck(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/quality-checks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setChecks((prev) => [json.data, ...prev])
      setAddOpen(false)
    }
  }

  async function handleCreateNCR(checkId: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/ncrs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, qualityCheckId: checkId }),
    })
    if (res.ok) {
      const json = await res.json()
      setChecks((prev) =>
        prev.map((c) =>
          c.id === checkId
            ? { ...c, ncrs: [json.data, ...c.ncrs] }
            : c
        )
      )
      setNcrOpen(null)
    }
  }

  async function toggleChecklistItem(check: QualityCheck, idx: number) {
    let items: ChecklistItem[] = []
    try { items = JSON.parse(check.checklistItems) } catch { items = [] }
    const current = items[idx]?.passed
    const next = current === null ? true : current === true ? false : null
    items[idx] = { ...items[idx], passed: next }
    const res = await fetch(`/api/projects/${projectId}/quality-checks?checkId=${check.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistItems: JSON.stringify(items) }),
    })
    if (res.ok) {
      setChecks((prev) =>
        prev.map((c) => c.id === check.id ? { ...c, checklistItems: JSON.stringify(items) } : c)
      )
    }
  }

  async function updateCheckStatus(check: QualityCheck, status: string) {
    const res = await fetch(`/api/projects/${projectId}/quality-checks?checkId=${check.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setChecks((prev) => prev.map((c) => c.id === check.id ? { ...c, status } : c))
    }
  }

  const openNCRCount = checks.reduce((s, c) => s + c.ncrs.filter((n) => n.status === 'OPEN' || n.status === 'IN_PROGRESS').length, 0)

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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">בקרת איכות</h3>
          {openNCRCount > 0 && (
            <span className="text-xs bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
              {openNCRCount} ממ&quot;ת פתוחות
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          בדיקת איכות חדשה
        </Button>
      </div>

      {checks.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="אין בדיקות איכות"
          action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />הוסף בדיקה</Button>}
        />
      ) : (
        <div className="space-y-3">
          {checks.map((check) => {
            let items: ChecklistItem[] = []
            try { items = JSON.parse(check.checklistItems) } catch { items = [] }
            const passedCount = items.filter((i) => i.passed === true).length
            const failedCount = items.filter((i) => i.passed === false).length
            const expanded = expandedId === check.id

            return (
              <Card key={check.id}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <button className="w-full text-right" onClick={() => setExpandedId(expanded ? null : check.id)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{check.title}</span>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${QC_STATUS_COLOR[check.status] ?? ''}`}>
                          {QC_STATUS_LABEL[check.status] ?? check.status}
                        </span>
                        {check.ncrs.length > 0 && (
                          <span className="text-[11px] bg-red-500/15 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                            {check.ncrs.length} ממ&quot;ת
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {items.length > 0 && (
                          <span>{passedCount}/{items.length} פריטים עברו</span>
                        )}
                        {check.inspector && <span>מפקח: {check.inspector.name}</span>}
                        <span>{formatDate(check.createdAt)}</span>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select
                      options={[
                        { value: 'PENDING', label: 'ממתין' },
                        { value: 'IN_PROGRESS', label: 'בביצוע' },
                        { value: 'PASSED', label: 'עבר' },
                        { value: 'FAILED', label: 'נכשל' },
                      ]}
                      value={check.status}
                      onChange={(e) => updateCheckStatus(check, e.target.value)}
                    />
                    <button
                      onClick={() => setExpandedId(expanded ? null : check.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ms-1"
                    >
                      {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {expanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    {/* Progress bar for checklist */}
                    {items.length > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>רשימת ביקורת</span>
                          <span className="flex items-center gap-2">
                            <span className="text-green-600 dark:text-green-400">{passedCount} עבר</span>
                            {failedCount > 0 && <span className="text-red-500">· {failedCount} נכשל</span>}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${items.length > 0 ? (passedCount / items.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Checklist items */}
                    {items.length > 0 && (
                      <div className="space-y-1">
                        {items.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleChecklistItem(check, idx)}
                            className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-right group"
                          >
                            {item.passed === true ? (
                              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                            ) : item.passed === false ? (
                              <XCircle size={16} className="text-red-500 shrink-0" />
                            ) : (
                              <Minus size={16} className="text-gray-400 shrink-0" />
                            )}
                            <span className={`text-sm flex-1 ${
                              item.passed === true ? 'text-gray-500 line-through' :
                              item.passed === false ? 'text-red-600 dark:text-red-400' :
                              'text-gray-700 dark:text-gray-300'
                            }`}>
                              {item.item}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* NCRs section */}
                    {check.ncrs.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">דוחות אי-התאמה (ממ&quot;ת)</p>
                        <div className="space-y-1.5">
                          {check.ncrs.map((ncr) => (
                            <div key={ncr.id} className="flex items-center gap-2.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                              <AlertOctagon size={13} className={NCR_SEVERITY_COLOR[ncr.severity] ?? 'text-gray-500'} />
                              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{ncr.title}</span>
                              <span className="text-xs text-gray-500">{NCR_STATUS_LABEL[ncr.status] ?? ncr.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add NCR button */}
                    <div>
                      {ncrOpen === check.id ? (
                        <NCRForm
                          employees={employees}
                          onSubmit={(data) => handleCreateNCR(check.id, data)}
                          onCancel={() => setNcrOpen(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setNcrOpen(check.id)}
                          className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                        >
                          <Plus size={13} />
                          דווח אי-התאמה (ממ&quot;ת)
                        </button>
                      )}
                    </div>

                    {check.notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">הערות</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{check.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="בדיקת איכות חדשה" size="md">
        <QualityCheckForm
          employees={employees}
          onSubmit={handleCreateCheck}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  )
}

function QualityCheckForm({
  employees,
  onSubmit,
  onCancel,
}: {
  employees: Employee[]
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [inspectorId, setInspectorId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    setLoading(true)
    const checklistItems = items
      .filter((i) => i.trim())
      .map((item) => ({ item, passed: null }))
    try {
      await onSubmit({
        title,
        inspectorId: inspectorId || undefined,
        notes: notes || undefined,
        checklistItems: JSON.stringify(checklistItems),
      })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="כותרת בדיקה *" placeholder="לדוגמה: בדיקת יסודות" value={title} onChange={(e) => setTitle(e.target.value)} />
      {employees.length > 0 && (
        <Select
          label="מפקח"
          options={[{ value: '', label: 'ללא שיוך' }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
          value={inspectorId}
          onChange={(e) => setInspectorId(e.target.value)}
        />
      )}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">פריטי ביקורת</p>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => setItems((prev) => prev.map((v, i) => i === idx ? e.target.value : v))}
                placeholder={`פריט ${idx + 1}...`}
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setItems((prev) => [...prev.slice(0, idx + 1), '', ...prev.slice(idx + 1)])
                  }
                }}
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, ''])}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            + הוסף פריט
          </button>
        </div>
      </div>
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
        הערות
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!title} className="flex-1">צור בדיקה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}

function NCRForm({
  employees,
  onSubmit,
  onCancel,
}: {
  employees: Employee[]
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM', reportedById: '' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try { await onSubmit({ ...form, reportedById: form.reportedById || undefined }) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 space-y-2.5 mt-2">
      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">דיווח אי-התאמה</p>
      <Input label="כותרת *" placeholder="תאר את הבעיה" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <Select
        label="חומרה"
        options={[
          { value: 'LOW', label: 'נמוכה' },
          { value: 'MEDIUM', label: 'בינונית' },
          { value: 'HIGH', label: 'גבוהה' },
          { value: 'CRITICAL', label: 'קריטית' },
        ]}
        value={form.severity}
        onChange={(e) => set('severity', e.target.value)}
      />
      {employees.length > 0 && (
        <Select
          label='מדווח ע"י'
          options={[{ value: '', label: 'ללא שיוך' }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
          value={form.reportedById}
          onChange={(e) => set('reportedById', e.target.value)}
        />
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={loading} disabled={!form.title} className="flex-1">שמור ממ&quot;ת</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
