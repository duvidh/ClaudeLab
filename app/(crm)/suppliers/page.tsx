'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, RefreshCw, Truck, Pencil, Check, X, Power, Phone, Mail, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSettingsLists } from '@/lib/useSettingsLists'

type Supplier = {
  id: string
  name: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  category?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<Partial<Supplier>>({})
  const lists = useSettingsLists()

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/suppliers?${params}`)
      const json = await res.json()
      setSuppliers(json.data ?? [])
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchSuppliers, 300)
    return () => clearTimeout(t)
  }, [fetchSuppliers])

  const categories = useMemo(() =>
    Array.from(new Set(suppliers.map((s) => s.category).filter(Boolean))) as string[]
  , [suppliers])

  const displayed = useMemo(() => {
    let list = suppliers
    if (!showInactive) list = list.filter((s) => s.isActive)
    if (categoryFilter) list = list.filter((s) => s.category === categoryFilter)
    return list
  }, [suppliers, showInactive, categoryFilter])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setCreateOpen(false); await fetchSuppliers() }
  }

  async function saveEdit(supplier: Supplier) {
    const res = await fetch(`/api/suppliers/${supplier.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editRow),
    })
    if (res.ok) {
      const json = await res.json()
      setSuppliers((prev) => prev.map((s) => s.id === supplier.id ? json.data : s))
      setEditingId(null)
    }
  }

  async function toggleActive(supplier: Supplier) {
    const res = await fetch(`/api/suppliers/${supplier.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !supplier.isActive }),
    })
    if (res.ok) {
      const json = await res.json()
      setSuppliers((prev) => prev.map((s) => s.id === supplier.id ? json.data : s))
    }
  }

  const categoryOptions = [
    { value: '', label: 'כל הקטגוריות' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div>
      <PageHeader
        title="ספקים"
        subtitle={`${displayed.length} ספקים`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            ספק חדש
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="חיפוש לפי שם, איש קשר, קטגוריה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-blue-500" />
          הצג לא פעילים
        </label>
        <button onClick={fetchSuppliers} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="אין ספקים"
          description="הוסף ספקים לניהול ורישום חומרים ושירותים"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />ספק חדש</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700 text-gray-400">
                <th className="px-4 py-3 font-semibold text-right">שם ספק</th>
                <th className="px-4 py-3 font-semibold text-right">איש קשר</th>
                <th className="px-4 py-3 font-semibold text-right">טלפון</th>
                <th className="px-4 py-3 font-semibold text-right">אימייל</th>
                <th className="px-4 py-3 font-semibold text-right">כתובת</th>
                <th className="px-4 py-3 font-semibold text-right">קטגוריה</th>
                <th className="px-4 py-3 font-semibold text-right">סטטוס</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayed.map((supplier) => {
                const isEditing = editingId === supplier.id
                return (
                  <tr key={supplier.id} className={`hover:bg-gray-800/30 ${!supplier.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-white">
                      {isEditing
                        ? <input value={editRow.name ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} className="w-32 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : supplier.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">
                      {isEditing
                        ? <input value={editRow.contactName ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, contactName: e.target.value }))} className="w-28 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : supplier.contactName || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing
                        ? <input value={editRow.phone ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, phone: e.target.value }))} className="w-28 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : supplier.phone
                          ? <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors"><Phone size={12} className="text-gray-500" />{supplier.phone}</a>
                          : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditing
                        ? <input value={editRow.email ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, email: e.target.value }))} className="w-36 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : supplier.email
                          ? <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"><Mail size={12} className="text-gray-500" />{supplier.email}</a>
                          : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">
                      {isEditing
                        ? <input value={editRow.address ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, address: e.target.value }))} className="w-36 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : supplier.address
                          ? <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-600 shrink-0" />{supplier.address}</span>
                          : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">
                      {isEditing
                        ? (
                          <input list="supplier-categories" value={editRow.category ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, category: e.target.value }))} className="w-24 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        )
                        : supplier.category || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${supplier.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                        {supplier.isActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(supplier)} className="text-green-400 hover:text-green-300 p-1"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-white p-1"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(supplier.id); setEditRow({ ...supplier }) }} className="text-gray-500 hover:text-blue-400 p-1"><Pencil size={13} /></button>
                            <button onClick={() => toggleActive(supplier)} className={`p-1 ${supplier.isActive ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-green-400'}`}>
                              <Power size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <datalist id="supplier-categories">
        {lists.supplierCategories.map((c) => <option key={c} value={c} />)}
      </datalist>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="ספק חדש" size="md">
        <SupplierForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} categories={lists.supplierCategories} />
      </Modal>
    </div>
  )
}

function SupplierForm({
  onSubmit,
  onCancel,
  categories,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  categories: string[]
}) {
  const [form, setForm] = useState({ name: '', contactName: '', phone: '', email: '', address: '', category: '', notes: '' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
      await onSubmit({
        name: form.name,
        contactName: form.contactName || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        category: form.category || undefined,
        notes: form.notes || undefined,
      })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input label="שם ספק *" placeholder="שם החברה / הספק" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <Input label="איש קשר" placeholder="שם מנהל" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
        <Input label="טלפון" placeholder="050-0000000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label="אימייל" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <div>
          <label className="text-sm text-gray-300 font-medium block mb-1">קטגוריה</label>
          <input
            list="supplier-form-categories"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="חומרי בניה, כלים..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id="supplier-form-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="col-span-2">
          <Input label="כתובת" placeholder="רחוב, עיר" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-sm text-gray-300 font-medium block mb-1">הערות</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.name} className="flex-1">הוסף ספק</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
