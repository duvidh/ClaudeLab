'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Package, Pencil, Check, X, Power } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { CatalogItem } from '@/types'

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<Partial<CatalogItem>>({})

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (showInactive) params.set('active', 'false')
    try {
      const res = await fetch(`/api/catalog?${params}`)
      const json = await res.json()
      setItems(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, showInactive])

  useEffect(() => {
    const t = setTimeout(fetchItems, 300)
    return () => clearTimeout(t)
  }, [fetchItems])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setCreateOpen(false); await fetchItems() }
  }

  async function saveEdit(item: CatalogItem) {
    const res = await fetch(`/api/catalog/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editRow),
    })
    if (res.ok) {
      const json = await res.json()
      setItems((prev) => prev.map((i) => i.id === item.id ? json.data : i))
      setEditingId(null)
    }
  }

  async function toggleActive(item: CatalogItem) {
    const res = await fetch(`/api/catalog/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    })
    if (res.ok) {
      const json = await res.json()
      setItems((prev) => prev.map((i) => i.id === item.id ? json.data : i))
    }
  }

  return (
    <div>
      <PageHeader
        title="קטלוג חומרים"
        subtitle={`${items.length} פריטים`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            פריט חדש
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="חיפוש לפי שם, מק״ט, קטגוריה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-blue-500" />
          הצג לא פעילים
        </label>
        <button onClick={fetchItems} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="קטלוג ריק"
          description="הוסף חומרים לקטלוג כדי להשתמש בהם בהצעות מחיר"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />פריט חדש</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700 text-gray-400">
                <th className="px-4 py-3 font-semibold text-right">מק״ט</th>
                <th className="px-4 py-3 font-semibold text-right">שם פריט</th>
                <th className="px-4 py-3 font-semibold text-right">קטגוריה</th>
                <th className="px-4 py-3 font-semibold text-right">יחידה</th>
                <th className="px-4 py-3 font-semibold text-right">מחיר מכירה</th>
                <th className="px-4 py-3 font-semibold text-right">עלות עצמית</th>
                <th className="px-4 py-3 font-semibold text-right">% רווח</th>
                <th className="px-4 py-3 font-semibold text-right">ספק</th>
                <th className="px-4 py-3 font-semibold text-right">מלאי</th>
                <th className="px-4 py-3 font-semibold text-right">סטטוס</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {items.map((item) => {
                const isEditing = editingId === item.id
                const profitPct = item.salePrice > 0
                  ? ((item.salePrice - item.selfCost) / item.salePrice * 100)
                  : 0

                return (
                  <tr key={item.id} className={`hover:bg-gray-800/30 ${!item.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                      {isEditing
                        ? <input value={editRow.sku ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, sku: e.target.value }))} className="w-20 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.sku}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-white">
                      {isEditing
                        ? <input value={editRow.name ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} className="w-36 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">
                      {isEditing
                        ? <input value={editRow.category ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, category: e.target.value }))} className="w-24 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.category || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">
                      {isEditing
                        ? <input value={editRow.unit ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, unit: e.target.value }))} className="w-16 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.unit || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-white">
                      {isEditing
                        ? <input type="number" value={editRow.salePrice ?? 0} onChange={(e) => setEditRow((p) => ({ ...p, salePrice: parseFloat(e.target.value) || 0 }))} className="w-20 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : formatCurrency(item.salePrice)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">
                      {isEditing
                        ? <input type="number" value={editRow.selfCost ?? 0} onChange={(e) => setEditRow((p) => ({ ...p, selfCost: parseFloat(e.target.value) || 0 }))} className="w-20 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : formatCurrency(item.selfCost)}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${profitPct >= 20 ? 'text-green-400' : profitPct >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {profitPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">
                      {isEditing
                        ? <input value={editRow.supplier ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, supplier: e.target.value }))} className="w-24 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.supplier || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">
                      {isEditing
                        ? <input type="number" value={editRow.stock ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, stock: parseFloat(e.target.value) || 0 }))} className="w-16 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.stock ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                        {item.isActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(item)} className="text-green-400 hover:text-green-300 p-1"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-white p-1"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(item.id); setEditRow({ ...item }) }} className="text-gray-500 hover:text-blue-400 p-1"><Pencil size={13} /></button>
                            <button onClick={() => toggleActive(item)} className={`p-1 ${item.isActive ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-green-400'}`} title={item.isActive ? 'השבת' : 'הפעל'}>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="פריט חדש בקטלוג" size="md">
        <CatalogItemForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}

function CatalogItemForm({ onSubmit, onCancel }: { onSubmit: (d: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ sku: '', name: '', category: '', unit: '', salePrice: '', selfCost: '', supplier: '', stock: '' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sku || !form.name) return
    setLoading(true)
    try {
      await onSubmit({ ...form, salePrice: parseFloat(form.salePrice) || 0, selfCost: parseFloat(form.selfCost) || 0, stock: form.stock ? parseFloat(form.stock) : undefined })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label='מק"ט *' placeholder="SKU-001" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
        <Input label="שם פריט *" placeholder="שם החומר" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Input label="קטגוריה" placeholder="ריצוף, גבס..." value={form.category} onChange={(e) => set('category', e.target.value)} />
        <Input label="יחידת מידה" placeholder='מ"ר, יחידה...' value={form.unit} onChange={(e) => set('unit', e.target.value)} />
        <Input label="מחיר מכירה (₪)" type="number" placeholder="100" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} />
        <Input label="עלות עצמית (₪)" type="number" placeholder="70" value={form.selfCost} onChange={(e) => set('selfCost', e.target.value)} />
        <Input label="ספק" placeholder="שם הספק" value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
        <Input label="מלאי" type="number" placeholder="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
      </div>
      {form.salePrice && form.selfCost && (
        <p className="text-xs text-gray-400">
          % רווח: <span className="text-green-400 font-semibold">
            {(((parseFloat(form.salePrice) - parseFloat(form.selfCost)) / parseFloat(form.salePrice)) * 100).toFixed(1)}%
          </span>
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.sku || !form.name} className="flex-1">הוסף לקטלוג</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
