'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Phone, Mail, Users2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatCurrency } from '@/lib/utils'

type Employee = {
  id: string
  name: string
  role: string
  position: string | null
  wageType: string
  wageAmount: number
  status: string
  startDate: string | null
  phone: string | null
  email: string | null
  notes: string | null
}

const ROLE_OPTIONS = [
  { value: 'INTERNAL', label: 'פנימי' },
  { value: 'EXTERNAL', label: 'חיצוני / קבלן משנה' },
]

const WAGE_TYPE_OPTIONS = [
  { value: 'MONTHLY', label: 'משכורת חודשית' },
  { value: 'HOURLY', label: 'שכר שעתי' },
  { value: 'PER_PROJECT', label: 'לפי פרויקט' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'INACTIVE', label: 'לא פעיל' },
]

const ROLE_LABELS: Record<string, string> = {
  INTERNAL: 'פנימי',
  EXTERNAL: 'חיצוני',
}

const WAGE_TYPE_LABELS: Record<string, string> = {
  MONTHLY: 'חודשי',
  HOURLY: 'שעתי',
  PER_PROJECT: 'לפי פרויקט',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/employees?${params}`)
      const json = await res.json()
      setEmployees(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setCreateOpen(false); await fetchEmployees() }
  }

  async function handleEdit(data: Record<string, unknown>) {
    if (!editEmployee) return
    const res = await fetch(`/api/employees/${editEmployee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setEditEmployee(null); await fetchEmployees() }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/employees/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== deleteId))
        setDeleteId(null)
      }
    } finally { setDeleting(false) }
  }

  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length
  const deleteEmployee = employees.find((e) => e.id === deleteId)

  return (
    <div>
      <PageHeader
        title="עובדים"
        subtitle={`${employees.length} סה"כ · ${activeCount} פעילים`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            עובד חדש
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-44">
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="אין עובדים"
          description="הוסף את הצוות שלך כדי לשייך משימות ולעקוב אחר עלויות"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />עובד חדש</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700">
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">שם</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">תפקיד</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">סוג</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">שכר</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">סטטוס</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">תחילת עבודה</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{emp.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {emp.phone && (
                            <a href={`tel:${emp.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors">
                              <Phone size={10} />{emp.phone}
                            </a>
                          )}
                          {emp.email && (
                            <a href={`mailto:${emp.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors">
                              <Mail size={10} />{emp.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{emp.position || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.role === 'INTERNAL'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-orange-500/20 text-orange-300'
                    }`}>
                      {ROLE_LABELS[emp.role] ?? emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-200 font-medium">{formatCurrency(emp.wageAmount)}</p>
                    <p className="text-xs text-gray-500">{WAGE_TYPE_LABELS[emp.wageType] ?? emp.wageType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === 'ACTIVE'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {emp.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {emp.startDate ? formatDate(emp.startDate) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditEmployee(emp)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                        title="עריכה"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(emp.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="עובד חדש" size="lg">
        <EmployeeForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!editEmployee} onClose={() => setEditEmployee(null)} title="עריכת עובד" size="lg">
        {editEmployee && (
          <EmployeeForm initialData={editEmployee} onSubmit={handleEdit} onCancel={() => setEditEmployee(null)} />
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="מחיקת עובד"
        message={`האם למחוק את "${deleteEmployee?.name}"?`}
        confirmLabel="מחק"
        loading={deleting}
      />
    </div>
  )
}

type EmployeeFormData = {
  name: string
  position: string
  role: string
  wageType: string
  wageAmount: string
  status: string
  startDate: string
  phone: string
  email: string
  notes: string
}

const DEFAULT_FORM: EmployeeFormData = {
  name: '',
  position: '',
  role: 'INTERNAL',
  wageType: 'MONTHLY',
  wageAmount: '',
  status: 'ACTIVE',
  startDate: '',
  phone: '',
  email: '',
  notes: '',
}

function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Employee
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<EmployeeFormData>({
    ...DEFAULT_FORM,
    ...(initialData ? {
      name: initialData.name,
      position: initialData.position ?? '',
      role: initialData.role,
      wageType: initialData.wageType,
      wageAmount: String(initialData.wageAmount),
      status: initialData.status,
      startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
      phone: initialData.phone ?? '',
      email: initialData.email ?? '',
      notes: initialData.notes ?? '',
    } : {}),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof EmployeeFormData, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('שם חובה'); return }
    setLoading(true)
    try {
      await onSubmit({
        name: form.name,
        position: form.position || null,
        role: form.role,
        wageType: form.wageType,
        wageAmount: form.wageAmount,
        status: form.status,
        startDate: form.startDate || null,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
      })
    } finally {
      setLoading(false)
    }
  }

  const wageLabel = form.wageType === 'MONTHLY' ? '₪ לחודש' : form.wageType === 'HOURLY' ? '₪ לשעה' : '₪ לפרויקט'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-700">פרטים אישיים</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input label="שם מלא *" placeholder="ישראל ישראלי" value={form.name} onChange={(e) => set('name', e.target.value)} error={error} />
          </div>
          <Input label="תפקיד" placeholder="מנהל עבודה, טכנאי..." value={form.position} onChange={(e) => set('position', e.target.value)} />
          <Select
            label="סוג עובד"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
          />
          <Input label="טלפון" placeholder="050-0000000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label="אימייל" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="תאריך תחילת עבודה" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          <Select
            label="סטטוס"
            options={[{ value: 'ACTIVE', label: 'פעיל' }, { value: 'INACTIVE', label: 'לא פעיל' }]}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-700">תנאי שכר</h3>
        <div className="grid grid-cols-2 gap-3">
          <Select label="סוג שכר" options={WAGE_TYPE_OPTIONS} value={form.wageType} onChange={(e) => set('wageType', e.target.value)} />
          <Input label={`שכר (${wageLabel})`} type="number" placeholder="5000" value={form.wageAmount} onChange={(e) => set('wageAmount', e.target.value)} />
        </div>
      </section>

      <section>
        <label className="text-sm text-gray-300 font-medium block mb-1">הערות</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="הערות על העובד..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'עדכן עובד' : 'צור עובד'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
