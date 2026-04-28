'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { Project } from '@/types'

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'תכנון' },
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'PAUSED', label: 'מושהה' },
  { value: 'COMPLETED', label: 'הושלם' },
  { value: 'CANCELLED', label: 'בוטל' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'בחר סוג פרויקט' },
  { value: 'שיפוץ', label: 'שיפוץ' },
  { value: 'בניה חדשה', label: 'בניה חדשה' },
  { value: 'תוספת בניה', label: 'תוספת בניה' },
  { value: 'עיצוב פנים', label: 'עיצוב פנים' },
  { value: 'בניה מסחרית', label: 'בניה מסחרית' },
  { value: 'תשתיות', label: 'תשתיות' },
  { value: 'אחר', label: 'אחר' },
]

type ProjectFormData = {
  name: string
  clientId: string
  address: string
  projectType: string
  status: string
  projectManager: string
  contractValue: string
  startDate: string
  plannedEndDate: string
  notes: string
}

interface ProjectFormProps {
  initialData?: Partial<Project>
  preselectedClientId?: string
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}

export function ProjectForm({ initialData, preselectedClientId, onSubmit, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>({
    name: initialData?.name ?? '',
    clientId: initialData?.clientId ?? preselectedClientId ?? '',
    address: initialData?.address ?? '',
    projectType: initialData?.projectType ?? '',
    status: initialData?.status ?? 'PLANNING',
    projectManager: initialData?.projectManager ?? '',
    contractValue: initialData?.contractValue?.toString() ?? '',
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
    plannedEndDate: initialData?.plannedEndDate ? new Date(initialData.plannedEndDate).toISOString().split('T')[0] : '',
    notes: initialData?.notes ?? '',
  })
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((j) => setClients((j.data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))))
  }, [])

  function set(field: keyof ProjectFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate() {
    const newErrors: typeof errors = {}
    if (!form.name.trim()) newErrors.name = 'שם חובה'
    if (!form.clientId) newErrors.clientId = 'לקוח חובה'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        contractValue: form.contractValue ? parseFloat(form.contractValue) : 0,
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        plannedEndDate: form.plannedEndDate ? new Date(form.plannedEndDate) : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input id="name" label="שם פרויקט *" placeholder="פרויקט שיפוץ..." value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        </div>
        <Select id="clientId" label="לקוח *" options={clients} value={form.clientId} onChange={(e) => set('clientId', e.target.value)} placeholder="בחר לקוח" error={errors.clientId} />
        <Select id="projectType" label="סוג פרויקט" options={TYPE_OPTIONS} value={form.projectType} onChange={(e) => set('projectType', e.target.value)} />
        <div className="col-span-2">
          <Input id="address" label="כתובת" placeholder="רחוב הרצל 1, תל אביב" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <Select id="status" label="סטטוס" options={STATUS_OPTIONS} value={form.status} onChange={(e) => set('status', e.target.value)} />
        <Input id="projectManager" label="מנהל פרויקט" placeholder="שם המנהל" value={form.projectManager} onChange={(e) => set('projectManager', e.target.value)} />
        <Input id="contractValue" label="ערך חוזה (₪)" type="number" placeholder="500000" value={form.contractValue} onChange={(e) => set('contractValue', e.target.value)} />
        <div />
        <Input id="startDate" label="תאריך התחלה" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        <Input id="plannedEndDate" label="תאריך סיום מתוכנן" type="date" value={form.plannedEndDate} onChange={(e) => set('plannedEndDate', e.target.value)} />
        <div className="col-span-2">
          <label className="text-sm text-gray-300 font-medium block mb-1">הערות</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} className="flex-1">{initialData ? 'עדכן פרויקט' : 'צור פרויקט'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
