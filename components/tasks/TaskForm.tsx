'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const PRIORITY_FORM_OPTIONS = [
  { value: 'HIGH', label: 'גבוהה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'LOW', label: 'נמוכה' },
]

const TASK_TYPE_FORM_OPTIONS = [
  { value: 'TASK', label: 'משימה' },
  { value: 'CALL', label: 'שיחה' },
  { value: 'MEETING', label: 'פגישה' },
  { value: 'EMAIL', label: 'אימייל' },
  { value: 'FOLLOWUP', label: 'מעקב' },
  { value: 'ADMINISTRATIVE', label: 'אדמיניסטרציה' },
  { value: 'OTHER', label: 'אחר' },
]

interface TaskFormProps {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  initialStatus?: string
}

export function TaskForm({ onSubmit, onCancel, initialStatus = 'PENDING' }: TaskFormProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    employeeId: '',
    dueDate: '',
    priority: 'MEDIUM',
    status: initialStatus,
    taskType: 'TASK',
    leadId: '',
    clientId: '',
    projectId: '',
  })
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [leads, setLeads] = useState<{ id: string; fullName: string }[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/employees?status=ACTIVE').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/leads').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/clients').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/projects').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([emp, lds, cls, prj]) => {
      setEmployees(emp.data ?? [])
      setLeads((lds.data ?? []).map((l: { id: string; fullName: string }) => ({ id: l.id, fullName: l.fullName })))
      setClients((cls.data ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
      setProjects((prj.data ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
    })
  }, [])

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      const selectedEmp = employees.find((e) => e.id === form.employeeId)
      const payload: Record<string, unknown> = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
        employeeId: form.employeeId || undefined,
        assignedTo: selectedEmp?.name || undefined,
        leadId: form.leadId || undefined,
        clientId: form.clientId || undefined,
        projectId: form.projectId || undefined,
      }
      await onSubmit(payload)
    } finally { setLoading(false) }
  }

  const assignOptions = [
    { value: '', label: 'ללא שיוך' },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ]
  const leadOptions = [
    { value: '', label: 'ללא ליד' },
    ...leads.map((l) => ({ value: l.id, label: l.fullName })),
  ]
  const clientOptions = [
    { value: '', label: 'ללא לקוח' },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ]
  const projectOptions = [
    { value: '', label: 'ללא פרויקט' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="כותרת *" placeholder="תיאור המשימה" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
        פירוט
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Select label="סוג משימה" options={TASK_TYPE_FORM_OPTIONS} value={form.taskType} onChange={(e) => set('taskType', e.target.value)} />
        <Select label="עדיפות" options={PRIORITY_FORM_OPTIONS} value={form.priority} onChange={(e) => set('priority', e.target.value)} />
      </div>
      {employees.length > 0 ? (
        <Select label="שיוך לעובד" options={assignOptions} value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} />
      ) : (
        <Input label="שיוך לעובד" placeholder="שם הנציג" value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} />
      )}
      <Input label="תאריך ושעה" type="datetime-local" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="לקוח (אופציונלי)" options={clientOptions} value={form.clientId} onChange={(e) => set('clientId', e.target.value)} />
        <Select label="פרויקט (אופציונלי)" options={projectOptions} value={form.projectId} onChange={(e) => set('projectId', e.target.value)} />
      </div>
      <Select label="ליד (אופציונלי)" options={leadOptions} value={form.leadId} onChange={(e) => set('leadId', e.target.value)} />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.title} className="flex-1">צור משימה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
