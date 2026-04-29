'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useSettingsLists } from '@/lib/useSettingsLists'
import type { Client } from '@/types'

const CATEGORY_OPTIONS = [
  { value: 'PRIVATE', label: 'פרטי' },
  { value: 'BUSINESS', label: 'עסקי' },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'INACTIVE', label: 'לא פעיל' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'בחר שיטת תשלום' },
  { value: 'מזומן', label: 'מזומן' },
  { value: 'העברה בנקאית', label: 'העברה בנקאית' },
  { value: 'צ\'ק', label: "צ'ק" },
  { value: 'כרטיס אשראי', label: 'כרטיס אשראי' },
]

type ClientFormData = {
  name: string
  company: string
  idNumber: string
  address: string
  mailingAddress: string
  city: string
  email: string
  phones: string[]
  category: string
  status: string
  paymentMethod: string
  notes: string
}

const toFormData = (c?: Partial<Client>): ClientFormData => ({
  name: c?.name ?? '',
  company: c?.company ?? '',
  idNumber: c?.idNumber ?? '',
  address: c?.address ?? '',
  mailingAddress: c?.mailingAddress ?? '',
  city: c?.city ?? '',
  email: c?.email ?? '',
  phones: (() => {
    try { return JSON.parse(c?.phones ?? '[]') } catch { return [''] }
  })(),
  category: c?.category ?? 'PRIVATE',
  status: c?.status ?? 'ACTIVE',
  paymentMethod: c?.paymentMethod ?? '',
  notes: c?.notes ?? '',
})

interface ClientFormProps {
  initialData?: Partial<Client>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}

export function ClientForm({ initialData, onSubmit, onCancel }: ClientFormProps) {
  const lists = useSettingsLists()
  const [form, setForm] = useState<ClientFormData>(toFormData(initialData))
  const [showMailingAddress, setShowMailingAddress] = useState(!!initialData?.mailingAddress)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({})

  function set(field: keyof ClientFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function setPhone(index: number, value: string) {
    setForm((prev) => {
      const phones = [...prev.phones]
      phones[index] = value
      return { ...prev, phones }
    })
  }

  function addPhone() {
    setForm((prev) => ({ ...prev, phones: [...prev.phones, ''] }))
  }

  function removePhone(index: number) {
    setForm((prev) => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }))
  }

  function validate() {
    const newErrors: typeof errors = {}
    if (!form.name.trim()) newErrors.name = 'שם חובה'
    if (form.idNumber && !/^\d{1,9}$/.test(form.idNumber)) newErrors.idNumber = 'עד 9 ספרות'
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
        phones: JSON.stringify(form.phones.filter(Boolean)),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-700">
          פרטי לקוח
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="name"
            label="שם מלא / חברה *"
            placeholder="ישראל ישראלי"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
          <Input
            id="company"
            label="שם חברה"
            placeholder="חברה בע״מ"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
          />
          <Input
            id="idNumber"
            label="ת.ז / ח.פ"
            placeholder="123456789"
            value={form.idNumber}
            onChange={(e) => set('idNumber', e.target.value)}
            error={errors.idNumber}
            maxLength={9}
          />
          <Input
            id="email"
            label="אימייל"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          <div className="col-span-2 space-y-2">
            <Input
              id="address"
              label="כתובת הנכס"
              placeholder="רחוב הרצל 1"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
            {!showMailingAddress && (
              <button
                type="button"
                onClick={() => setShowMailingAddress(true)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + כתובת למשלוח שונה
              </button>
            )}
            {showMailingAddress && (
              <div>
                <Input
                  id="mailingAddress"
                  label="כתובת למשלוח"
                  placeholder="כתובת אחרת לדואר / חשבוניות"
                  value={form.mailingAddress}
                  onChange={(e) => set('mailingAddress', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => { setShowMailingAddress(false); set('mailingAddress', '') }}
                  className="text-xs text-gray-500 hover:text-red-400 mt-1"
                >
                  הסר כתובת למשלוח
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-300 font-medium block mb-1">עיר</label>
            <input
              list="client-form-cities"
              id="city"
              placeholder="תל אביב"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="client-form-cities">
              {lists.cities.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <Select
            id="category"
            label="קטגוריה"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          />
          <Select
            id="status"
            label="סטטוס"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />
          <Select
            id="paymentMethod"
            label="שיטת תשלום"
            options={[
              { value: '', label: 'בחר שיטת תשלום' },
              ...lists.paymentMethods.map((m) => ({ value: m, label: m })),
            ]}
            value={form.paymentMethod}
            onChange={(e) => set('paymentMethod', e.target.value)}
          />
        </div>
      </section>

      {/* Phones */}
      <section>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-700">
          טלפונים
        </h3>
        <div className="space-y-2">
          {form.phones.map((phone, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`טלפון ${i + 1}`}
                value={phone}
                onChange={(e) => setPhone(i, e.target.value)}
                className="flex-1"
              />
              {form.phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(i)}
                  className="px-2 text-red-400 hover:text-red-300 text-sm"
                >
                  הסר
                </button>
              )}
            </div>
          ))}
          {form.phones.length < 4 && (
            <button
              type="button"
              onClick={addPhone}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + הוסף טלפון
            </button>
          )}
        </div>
      </section>

      {/* Notes */}
      <section>
        <label className="text-sm text-gray-300 font-medium block mb-1">הערות</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          placeholder="הערות כלליות על הלקוח..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'עדכן לקוח' : 'צור לקוח'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  )
}
