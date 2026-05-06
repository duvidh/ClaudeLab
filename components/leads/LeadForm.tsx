'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useSettingsLists } from '@/lib/useSettingsLists'
import type { Lead } from '@/types'

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'חדש' },
  { value: 'CONTACTED', label: 'נוצר קשר' },
  { value: 'MEETING_SCHEDULED', label: 'פגישה נקבעה' },
  { value: 'QUOTE_SENT', label: 'הצעת מחיר נשלחה' },
  { value: 'WON', label: 'זכינו' },
  { value: 'LOST', label: 'אבד' },
]

const SOURCE_OPTIONS = [
  { value: 'WEBSITE', label: 'אתר אינטרנט' },
  { value: 'REFERRAL', label: 'המלצה' },
  { value: 'FACEBOOK', label: 'פייסבוק' },
  { value: 'GOOGLE', label: 'גוגל' },
  { value: 'PHONE', label: 'טלפון' },
  { value: 'OTHER', label: 'אחר' },
]

const TYPE_OPTIONS = [
  { value: 'PRIVATE', label: 'פרטי' },
  { value: 'BUSINESS', label: 'עסקי' },
]

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'נמוכה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'HIGH', label: 'גבוהה' },
]

type LeadFormData = {
  fullName: string
  primaryPhone: string
  secondaryPhone: string
  email: string
  propertyAddress: string
  city: string
  clientType: string
  leadSource: string
  status: string
  workType: string
  needDescription: string
  estimatedSize: string
  budget: string
  urgency: string
  assignedRep: string
  buildingPermit: boolean
}

const DEFAULT_FORM: LeadFormData = {
  fullName: '',
  primaryPhone: '',
  secondaryPhone: '',
  email: '',
  propertyAddress: '',
  city: '',
  clientType: 'PRIVATE',
  leadSource: 'OTHER',
  status: 'NEW',
  workType: '',
  needDescription: '',
  estimatedSize: '',
  budget: '',
  urgency: 'MEDIUM',
  assignedRep: '',
  buildingPermit: false,
}

interface LeadFormProps {
  initialData?: Partial<Lead>
  onSubmit: (data: LeadFormData) => Promise<void>
  onCancel: () => void
}

export function LeadForm({ initialData, onSubmit, onCancel }: LeadFormProps) {
  const lists = useSettingsLists()
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/employees?status=ACTIVE')
      .then((r) => r.json())
      .then((j) => setEmployees(j.data ?? []))
      .catch(() => {})
  }, [])

  const [form, setForm] = useState<LeadFormData>({
    ...DEFAULT_FORM,
    ...(initialData
      ? {
          fullName: initialData.fullName ?? '',
          primaryPhone: initialData.primaryPhone ?? '',
          secondaryPhone: initialData.secondaryPhone ?? '',
          email: initialData.email ?? '',
          propertyAddress: initialData.propertyAddress ?? '',
          city: initialData.city ?? '',
          clientType: initialData.clientType ?? 'PRIVATE',
          leadSource: initialData.leadSource ?? 'OTHER',
          status: initialData.status ?? 'NEW',
          workType: initialData.workType ?? '',
          needDescription: initialData.needDescription ?? '',
          estimatedSize: initialData.estimatedSize?.toString() ?? '',
          budget: initialData.budget?.toString() ?? '',
          urgency: initialData.urgency ?? 'MEDIUM',
          assignedRep: initialData.assignedRep ?? '',
          buildingPermit: initialData.buildingPermit ?? false,
        }
      : {}),
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({})

  function set(field: keyof LeadFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.fullName.trim()) newErrors.fullName = 'שם חובה'
    if (!form.primaryPhone.trim()) newErrors.primaryPhone = 'טלפון חובה'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit(form)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* פרטי ליד */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          פרטי הליד
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input
              id="fullName"
              label="שם מלא *"
              placeholder="ישראל ישראלי"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              error={errors.fullName}
            />
          </div>
          <Input
            id="primaryPhone"
            label="טלפון ראשי *"
            placeholder="050-0000000"
            value={form.primaryPhone}
            onChange={(e) => set('primaryPhone', e.target.value)}
            error={errors.primaryPhone}
          />
          <Input
            id="secondaryPhone"
            label="טלפון משני"
            placeholder="050-0000000"
            value={form.secondaryPhone}
            onChange={(e) => set('secondaryPhone', e.target.value)}
          />
          <Input
            id="email"
            label="אימייל"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          <FormField id="city" label="עיר/אזור">
            <input
              list="lead-form-cities"
              id="city"
              placeholder="תל אביב"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="lead-form-cities">
              {lists.cities.map((c) => <option key={c} value={c} />)}
            </datalist>
          </FormField>
          <div className="col-span-2">
            <Input
              id="propertyAddress"
              label="כתובת נכס"
              placeholder="רחוב הרצל 1, תל אביב"
              value={form.propertyAddress}
              onChange={(e) => set('propertyAddress', e.target.value)}
            />
          </div>
          <Select
            id="clientType"
            label="סוג לקוח"
            options={TYPE_OPTIONS}
            value={form.clientType}
            onChange={(e) => set('clientType', e.target.value)}
          />
          <Select
            id="leadSource"
            label="מקור ליד"
            options={SOURCE_OPTIONS}
            value={form.leadSource}
            onChange={(e) => set('leadSource', e.target.value)}
          />
          <Select
            id="status"
            label="סטטוס"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />
          {employees.length > 0 ? (
            <Select
              id="assignedRep"
              label="נציג אחראי"
              value={form.assignedRep}
              onChange={(e) => set('assignedRep', e.target.value)}
              options={[
                { value: '', label: 'ללא שיוך' },
                ...employees.map((e) => ({ value: e.name, label: e.name })),
                ...(form.assignedRep && !employees.some((e) => e.name === form.assignedRep)
                  ? [{ value: form.assignedRep, label: form.assignedRep }]
                  : []),
              ]}
            />
          ) : (
            <Input
              id="assignedRep"
              label="נציג אחראי"
              placeholder="שם הנציג"
              value={form.assignedRep}
              onChange={(e) => set('assignedRep', e.target.value)}
            />
          )}
        </div>
      </section>

      {/* פרטי פרויקט */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          פרטי פרויקט מבוקש
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="workType" label="סוג עבודה">
            <input
              list="lead-form-worktypes"
              id="workType"
              placeholder="שיפוץ, בניה חדשה..."
              value={form.workType}
              onChange={(e) => set('workType', e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="lead-form-worktypes">
              {lists.workTypes.map((w) => <option key={w} value={w} />)}
            </datalist>
          </FormField>
          <Input
            id="estimatedSize"
            label='גודל משוער (מ"ר)'
            type="number"
            placeholder="120"
            value={form.estimatedSize}
            onChange={(e) => set('estimatedSize', e.target.value)}
          />
          <Input
            id="budget"
            label="תקציב (₪)"
            type="number"
            placeholder="500000"
            value={form.budget}
            onChange={(e) => set('budget', e.target.value)}
          />
          <Select
            id="urgency"
            label="דחיפות"
            options={URGENCY_OPTIONS}
            value={form.urgency}
            onChange={(e) => set('urgency', e.target.value)}
          />
          <FormField id="needDescription" label="תיאור צורך" className="col-span-2">
            <textarea
              id="needDescription"
              placeholder="תאר את הצורך של הלקוח..."
              value={form.needDescription}
              onChange={(e) => set('needDescription', e.target.value)}
              rows={3}
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="buildingPermit"
              checked={form.buildingPermit}
              onChange={(e) => set('buildingPermit', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <label htmlFor="buildingPermit" className="text-sm text-gray-700 dark:text-gray-300">
              יש היתר בניה
            </label>
          </div>
        </div>
      </section>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'עדכן ליד' : 'צור ליד'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  )
}
