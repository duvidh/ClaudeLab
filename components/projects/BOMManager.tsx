'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, Package, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'

type BOMItem = {
  id: string
  partNumber: string | null
  description: string
  quantity: number
  unit: string | null
  unitPrice: number | null
  status: string
  supplier: { id: string; name: string } | null
  workPackage: { id: string; name: string } | null
  catalogItem: { id: string; name: string; sku: string | null } | null
}

type CatalogSuggestion = {
  id: string
  name: string
  unit: string | null
  salePrice: number
  sku: string | null
}

type WorkPackageSummary = { id: string; name: string }
type SupplierSummary = { id: string; name: string }

const ITEM_STATUS_OPTIONS = [
  { value: 'REQUIRED', label: 'נדרש' },
  { value: 'ORDERED', label: 'הוזמן' },
  { value: 'DELIVERED', label: 'סופק' },
  { value: 'INSTALLED', label: 'הותקן' },
  { value: 'CANCELLED', label: 'בוטל' },
]

const STATUS_COLOR: Record<string, string> = {
  REQUIRED: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  ORDERED: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  DELIVERED: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  INSTALLED: 'bg-green-500/15 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-500 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  REQUIRED: 'נדרש', ORDERED: 'הוזמן', DELIVERED: 'סופק', INSTALLED: 'הותקן', CANCELLED: 'בוטל',
}

interface BOMManagerProps {
  projectId: string
}

export function BOMManager({ projectId }: BOMManagerProps) {
  const [items, setItems] = useState<BOMItem[]>([])
  const [workPackages, setWorkPackages] = useState<WorkPackageSummary[]>([])
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterWp, setFilterWp] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/bom`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/projects/${projectId}/work-packages`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/suppliers').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([bom, wp, sup]) => {
      setItems(bom.data ?? [])
      setWorkPackages(wp.data ?? [])
      setSuppliers(sup.data ?? [])
      setLoading(false)
    })
  }, [projectId])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/bom`, {
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

  async function handleStatusChange(itemId: string, status: string) {
    const res = await fetch(`/api/projects/${projectId}/bom`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, status }),
    })
    if (res.ok) {
      const json = await res.json()
      setItems((prev) => prev.map((i) => (i.id === itemId ? json.data : i)))
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId)
    try {
      const res = await fetch(`/api/projects/${projectId}/bom?itemId=${itemId}`, { method: 'DELETE' })
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== itemId))
    } finally { setDeletingId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const filtered = items.filter((i) => {
    if (filterWp && i.workPackage?.id !== filterWp) return false
    if (filterStatus && i.status !== filterStatus) return false
    return true
  })

  const totalValue = filtered.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0)

  const wpOptions = [
    { value: '', label: 'כל חבילות העבודה' },
    ...workPackages.map((w) => ({ value: w.id, label: w.name })),
  ]
  const statusFilterOptions = [
    { value: '', label: 'כל הסטטוסים' },
    ...ITEM_STATUS_OPTIONS,
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">רשימת חומרים (BOM)</h3>
          {filtered.length > 0 && (
            <span className="text-xs text-gray-500">{filtered.length} פריטים · {formatCurrency(totalValue)}</span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          הוסף פריט
        </Button>
      </div>

      {(workPackages.length > 0 || items.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          <Select options={wpOptions} value={filterWp} onChange={(e) => setFilterWp(e.target.value)} />
          <Select options={statusFilterOptions} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="אין פריטים ברשימת החומרים"
          action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />הוסף פריט ראשון</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2.5 font-semibold text-gray-500 text-right">תיאור</th>
                <th className="px-3 py-2.5 font-semibold text-gray-500 text-right">כמות</th>
                <th className="px-3 py-2.5 font-semibold text-gray-500 text-right">מחיר יחידה</th>
                <th className="px-3 py-2.5 font-semibold text-gray-500 text-right">סה"כ</th>
                <th className="px-3 py-2.5 font-semibold text-gray-500 text-right">ספק</th>
                <th className="px-3 py-2.5 font-semibold text-gray-500 text-right">סטטוס</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 group transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-gray-900 dark:text-white">{item.description}</p>
                      {item.catalogItem && (
                        <span title="מקושר לקטלוג">
                          <CheckCircle size={12} className="text-green-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    {item.partNumber && <p className="text-xs text-gray-400">#{item.partNumber}</p>}
                    {item.workPackage && <p className="text-xs text-blue-500">{item.workPackage.name}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 tabular-nums">
                    {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 tabular-nums">
                    {item.unitPrice != null ? formatCurrency(item.unitPrice) : '—'}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white tabular-nums">
                    {item.unitPrice != null ? formatCurrency(item.unitPrice * item.quantity) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">
                    {item.supplier?.name ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs px-1.5 py-0.5 rounded border-0 cursor-pointer focus:outline-none ${STATUS_COLOR[item.status] ?? ''}`}
                      style={{ background: 'transparent' }}
                    >
                      {ITEM_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="פריט חדש לרשימת חומרים" size="md">
        <BOMItemForm
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          workPackages={workPackages}
          suppliers={suppliers}
        />
      </Modal>
    </div>
  )
}

// ─── Autocomplete Combobox ────────────────────────────────────────────────────

function CatalogCombobox({
  value,
  onChange,
  onSelect,
}: {
  value: string
  onChange: (val: string) => void
  onSelect: (item: CatalogSuggestion) => void
}) {
  const [suggestions, setSuggestions] = useState<CatalogSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(() => {
      setFetching(true)
      fetch(`/api/catalog?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => { setSuggestions(j.data ?? []); setOpen(true) })
        .catch(() => {})
        .finally(() => setFetching(false))
    }, 200)
  }, [])

  useEffect(() => { search(value) }, [value, search])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-1">
        תיאור פריט *
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          placeholder="הקלד שם מוצר לחיפוש בקטלוג..."
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pe-8"
          autoComplete="off"
          dir="rtl"
        />
        {fetching && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <p className="text-[10px] text-gray-400 px-3 pt-2 pb-1">מוצרים מהקטלוג</p>
          <ul className="max-h-48 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full text-right px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onMouseDown={(e) => { e.preventDefault(); onSelect(item); setOpen(false) }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.unit && <span className="text-xs text-gray-400">{item.unit}</span>}
                      {item.salePrice > 0 && (
                        <span className="text-xs text-green-600 dark:text-green-400 tabular-nums">
                          ₪{item.salePrice.toLocaleString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.sku && <p className="text-[10px] text-gray-400 mt-0.5">מק"ט: {item.sku}</p>}
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[11px] text-gray-400">
              לא מצאת? המשך להקליד — הפריט יתווסף לקטלוג אוטומטית
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── BOM Item Form ────────────────────────────────────────────────────────────

function BOMItemForm({
  onSubmit,
  onCancel,
  workPackages,
  suppliers,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  workPackages: WorkPackageSummary[]
  suppliers: SupplierSummary[]
}) {
  const [form, setForm] = useState({
    description: '',
    catalogItemId: '',
    partNumber: '',
    quantity: '1',
    unit: '',
    unitPrice: '',
    status: 'REQUIRED',
    supplierId: '',
    workPackageId: '',
  })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function handleCatalogSelect(item: CatalogSuggestion) {
    setForm((p) => ({
      ...p,
      description: item.name,
      catalogItemId: item.id,
      unit: item.unit ?? p.unit,
      unitPrice: item.salePrice > 0 ? item.salePrice.toString() : p.unitPrice,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description) return
    setLoading(true)
    try {
      await onSubmit({
        description: form.description,
        catalogItemId: form.catalogItemId || undefined,
        partNumber: form.partNumber || undefined,
        quantity: parseFloat(form.quantity) || 1,
        unit: form.unit || undefined,
        unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
        status: form.status,
        supplierId: form.supplierId || undefined,
        workPackageId: form.workPackageId || undefined,
      })
    } finally { setLoading(false) }
  }

  const wpOptions = [
    { value: '', label: 'ללא חבילת עבודה' },
    ...workPackages.map((w) => ({ value: w.id, label: w.name })),
  ]
  const supplierOptions = [
    { value: '', label: 'ללא ספק' },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <CatalogCombobox
        value={form.description}
        onChange={(v) => setForm((p) => ({ ...p, description: v, catalogItemId: '' }))}
        onSelect={handleCatalogSelect}
      />

      {form.catalogItemId && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle size={12} />
          מוצר נבחר מהקטלוג — השדות מולאו אוטומטית
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input label='מק"ט / Part Number' placeholder="אופציונלי" value={form.partNumber} onChange={(e) => set('partNumber', e.target.value)} />
        <Input label="יחידת מידה" placeholder={'מ"ר, מ\', יח\''} value={form.unit} onChange={(e) => set('unit', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="כמות" type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        <Input label="מחיר יחידה (₪)" type="number" min="0" step="0.01" placeholder="0" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="סטטוס" options={ITEM_STATUS_OPTIONS} value={form.status} onChange={(e) => set('status', e.target.value)} />
        {suppliers.length > 0 && (
          <Select label="ספק" options={supplierOptions} value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)} />
        )}
      </div>
      {workPackages.length > 0 && (
        <Select label="חבילת עבודה (אופציונלי)" options={wpOptions} value={form.workPackageId} onChange={(e) => set('workPackageId', e.target.value)} />
      )}
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.description} className="flex-1">הוסף פריט</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
