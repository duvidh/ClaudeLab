'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { calcLinePrice, calcElementCost, calcProfitPercent, calcQuoteSummary } from '@/lib/calculations'
import type { QuoteItem, CatalogItem } from '@/types'

type ItemRow = QuoteItem & { catalogItem?: CatalogItem | null }

interface QuoteCalculatorProps {
  quoteId: string
  initialItems: ItemRow[]
  initialDiscount: number
  onItemsChange?: (items: ItemRow[]) => void
}

type EditableField = 'productName' | 'category' | 'unit' | 'dimension1' | 'dimension2' | 'unitPrice' | 'materialsCost' | 'transportCost' | 'laborCost' | 'notes'

export function QuoteCalculator({ quoteId, initialItems, initialDiscount, onItemsChange }: QuoteCalculatorProps) {
  const [items, setItems] = useState<ItemRow[]>(initialItems)
  const [discount, setDiscount] = useState(initialDiscount)
  const [saving, setSaving] = useState<string | null>(null)
  
  // הוספנו סטייט לקטלוג המלא כדי שהחיפוש יהיה מיידי
  const [fullCatalog, setFullCatalog] = useState<CatalogItem[]>([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([])
  const [searchingFor, setSearchingFor] = useState<string | null>(null)

  const summary = calcQuoteSummary(items, discount)

  // טעינת כל הקטלוג פעם אחת כשהעמוד עולה
  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(j => setFullCatalog(j.data ?? []))
      .catch(console.error)
  }, [])

  function updateItems(updated: ItemRow[]) {
    setItems(updated)
    onItemsChange?.(updated)
  }

  async function addRow() {
    setSaving('new')
    try {
      const res = await fetch(`/api/quotes/${quoteId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: 'פריט חדש',
          category: '',
          unit: '',
          unitPrice: 0,
          materialsCost: 0,
          transportCost: 0,
          laborCost: 0,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        updateItems([...items, json.data])
      }
    } finally {
      setSaving(null)
    }
  }

  async function deleteRow(item: ItemRow) {
    setSaving(item.id)
    try {
      await fetch(`/api/quotes/${quoteId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      })
      updateItems(items.filter((i) => i.id !== item.id))
    } finally {
      setSaving(null)
    }
  }

  async function updateField(item: ItemRow, field: EditableField, rawValue: string) {
    const numFields: EditableField[] = ['dimension1', 'dimension2', 'unitPrice', 'materialsCost', 'transportCost', 'laborCost']
    const value = numFields.includes(field) ? (parseFloat(rawValue) || 0) : rawValue

    const updated = items.map((i) => i.id === item.id ? { ...i, [field]: value } : i)
    updateItems(updated)

    setSaving(item.id)
    try {
      await fetch(`/api/quotes/${quoteId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, [field]: value }),
      })
    } finally {
      setSaving(null)
    }
  }

  // פונקציית חיפוש חדשה ומיידית מהזיכרון המקומי
  function searchCatalog(query: string) {
    setCatalogSearch(query)
    if (query.trim() === '') { 
      setCatalogResults([])
      return 
    }
    const lowerQuery = query.toLowerCase()
    const results = fullCatalog.filter(cat => 
      cat.name.toLowerCase().includes(lowerQuery) || 
      (cat.sku && cat.sku.toLowerCase().includes(lowerQuery)) ||
      (cat.category && cat.category.toLowerCase().includes(lowerQuery))
    )
    setCatalogResults(results)
  }

  // החלת הפריט והכנסת הקטגוריה והיחידה בצורה אגרסיבית
  async function applyCatalogItem(row: ItemRow, catalogItem: CatalogItem) {
    const updatedRow: Partial<ItemRow> = {
      catalogItemId: catalogItem.id,
      productName: catalogItem.name,
      category: catalogItem.category || '',
      unit: catalogItem.unit || '',
      unitPrice: catalogItem.salePrice || 0,
      materialsCost: catalogItem.selfCost || 0,
    }
    
    const updated = items.map((i) => i.id === row.id ? { ...i, ...updatedRow } : i)
    updateItems(updated)
    setSearchingFor(null)
    setCatalogSearch('')
    setCatalogResults([])

    setSaving(row.id)
    try {
      await fetch(`/api/quotes/${quoteId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: row.id, ...updatedRow }),
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-700 mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800/80 border-b border-gray-700 text-gray-400">
              <th className="px-2 py-2.5 text-right font-semibold w-6">#</th>
              <th className="px-2 py-2.5 text-right font-semibold min-w-[160px]">שם מוצר / מק&quot;ט</th>
              <th className="px-2 py-2.5 text-right font-semibold">קטגוריה</th>
              <th className="px-2 py-2.5 text-right font-semibold w-16" title="אורך / כמות במטרים">מ׳ (1)</th>
              <th className="px-2 py-2.5 text-right font-semibold w-16" title="רוחב / גובה בסנטימטרים">ס״מ (2)</th>
              <th className="px-2 py-2.5 text-right font-semibold w-14">יחידה</th>
              <th className="px-2 py-2.5 text-right font-semibold w-20">מחיר יח׳</th>
              <th className="px-2 py-2.5 text-right font-semibold w-24 bg-blue-900/20">מחיר שורה</th>
              <th className="px-2 py-2.5 text-right font-semibold w-20">חומרים</th>
              <th className="px-2 py-2.5 text-right font-semibold w-20">הובלה</th>
              <th className="px-2 py-2.5 text-right font-semibold w-20">עבודה</th>
              <th className="px-2 py-2.5 text-right font-semibold w-20">עלות כוללת</th>
              <th className="px-2 py-2.5 text-right font-semibold w-16 bg-green-900/20">% רווח</th>
              <th className="px-2 py-2.5 text-right font-semibold min-w-[100px]">הערות</th>
              <th className="px-2 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.length === 0 && (
              <tr>
                <td colSpan={15} className="text-center text-gray-500 py-8">
                  הצעת מחיר ריקה — הוסף פריט ראשון
                </td>
              </tr>
            )}
            {items.map((item, idx) => {
              const linePrice = calcLinePrice(item)
              const elementCost = calcElementCost(item)
              const profitPct = calcProfitPercent(linePrice, elementCost)
              const isSaving = saving === item.id

              return (
                <tr key={item.id} className={`hover:bg-gray-800/30 ${isSaving ? 'opacity-60' : ''}`}>
                  <td className="px-2 py-1.5 text-gray-500 text-center">{idx + 1}</td>

                  <td className="px-2 py-1.5 relative">
                    {searchingFor === item.id ? (
                      <div className="flex items-center gap-1 bg-gray-700/60 border border-blue-500/50 rounded px-1.5 py-0.5">
                        <Search size={11} className="text-blue-400 shrink-0" />
                        <span className="text-xs text-blue-300 truncate">{item.productName || 'מחפש...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group/cell">
                        <EditableCell
                          value={item.productName}
                          onSave={(v) => updateField(item, 'productName', v)}
                        />
                        <button
                          onClick={() => { setSearchingFor(item.id); setCatalogSearch(''); setCatalogResults([]) }}
                          className="opacity-0 group-hover/cell:opacity-100 text-gray-500 hover:text-blue-400 shrink-0 transition-opacity"
                          title="חפש בקטלוג"
                        >
                          <Search size={11} />
                        </button>
                      </div>
                    )}
                    {item.catalogItem && (
                      <div className="text-gray-600 text-xs mt-0.5">{item.catalogItem.sku}</div>
                    )}
                  </td>

                  <td className="px-2 py-1.5">
                    <EditableCell value={item.category ?? ''} onSave={(v) => updateField(item, 'category', v)} placeholder="קטגוריה" />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={item.dimension1?.toString() ?? ''} onSave={(v) => updateField(item, 'dimension1', v)} type="number" placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={item.dimension2?.toString() ?? ''} onSave={(v) => updateField(item, 'dimension2', v)} type="number" placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={item.unit ?? ''} onSave={(v) => updateField(item, 'unit', v)} placeholder="מ״ר" />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={item.unitPrice.toString()} onSave={(v) => updateField(item, 'unitPrice', v)} type="number" />
                  </td>

                  <td className="px-2 py-1.5 bg-blue-900/10 font-semibold text-blue-300 text-center">
                    {linePrice > 0 ? formatCurrency(linePrice) : '—'}
                  </td>

                  <td className="px-2 py-1.5">
                    <EditableCell value={item.materialsCost.toString()} onSave={(v) => updateField(item, 'materialsCost', v)} type="number" />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={item.transportCost.toString()} onSave={(v) => updateField(item, 'transportCost', v)} type="number" />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={item.laborCost.toString()} onSave={(v) => updateField(item, 'laborCost', v)} type="number" />
                  </td>

                  <td className="px-2 py-1.5 text-gray-300 text-center text-xs">
                    {elementCost > 0 ? formatCurrency(elementCost) : '—'}
                  </td>

                  <td className={`px-2 py-1.5 text-center font-semibold bg-green-900/10 ${profitPct >= 20 ? 'text-green-400' : profitPct >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {linePrice > 0 ? `${profitPct.toFixed(1)}%` : '—'}
                  </td>

                  <td className="px-2 py-1.5">
                    <EditableCell value={item.notes ?? ''} onSave={(v) => updateField(item, 'notes', v)} placeholder="הערה..." />
                  </td>

                  <td className="px-2 py-1.5">
                    <button onClick={() => deleteRow(item)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Catalog search panel ──────────────────────────────────────────────
          Rendered OUTSIDE the overflow-x-auto table wrapper so the results
          are never clipped by the scroll container's implicit overflow-y:auto. */}
      {searchingFor && (
        <div className="mb-4 border border-blue-500/40 bg-gray-800/90 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Search size={13} className="text-blue-400 shrink-0" />
            <span className="text-xs text-gray-400 flex-1 truncate">
              חיפוש עבור:{' '}
              <span className="text-white font-medium">
                {items.find((i) => i.id === searchingFor)?.productName || 'פריט'}
              </span>
            </span>
            <button
              onClick={() => { setSearchingFor(null); setCatalogSearch(''); setCatalogResults([]) }}
              className="text-gray-500 hover:text-gray-300 transition-colors text-sm leading-none"
              title="סגור חיפוש"
            >
              ✕
            </button>
          </div>
          <input
            autoFocus
            value={catalogSearch}
            onChange={(e) => searchCatalog(e.target.value)}
            placeholder='חפש לפי שם, מק"ט או קטגוריה...'
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {catalogSearch.trim() !== '' && catalogResults.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-3">לא נמצאו תוצאות</p>
          )}
          {catalogResults.length > 0 && (
            <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-700">
              {catalogResults.map((cat) => {
                const row = items.find((i) => i.id === searchingFor)
                return (
                  <button
                    key={cat.id}
                    onClick={() => row && applyCatalogItem(row, cat)}
                    className="w-full text-right px-3 py-2.5 hover:bg-gray-700 flex items-center justify-between transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{cat.name}</p>
                      <p className="text-xs text-gray-500">{cat.sku} · {cat.category ?? '—'} · {cat.unit ?? '—'}</p>
                    </div>
                    <span className="text-xs text-blue-300 shrink-0 ms-3">{formatCurrency(cat.salePrice)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <button
        onClick={addRow}
        disabled={saving === 'new'}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors mb-6 disabled:opacity-50"
      >
        <Plus size={14} />
        הוסף שורה
      </button>

      <div className="flex justify-end">
        <div className="w-80 bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
          <SummaryRow label='סה"כ לפני הנחה' value={formatCurrency(summary.subtotal)} />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">הנחה (₪)</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              onBlur={() => {
                fetch(`/api/quotes/${quoteId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ discount }),
                })
              }}
              className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="border-t border-gray-700 pt-2">
            <SummaryRow label='סה"כ לפני מע"מ' value={formatCurrency(summary.totalBeforeVAT)} />
            <SummaryRow label='מע"מ (17%)' value={formatCurrency(summary.vat)} muted />
          </div>

          <div className="border-t border-gray-700 pt-2">
            <SummaryRow label='סה"כ לתשלום' value={formatCurrency(summary.totalWithVAT)} bold />
          </div>
        </div>
      </div>
    </div>
  )
}

function EditableCell({
  value,
  onSave,
  type = 'text',
  placeholder = '',
}: {
  value: string
  onSave: (v: string) => void
  type?: 'text' | 'number'
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)

  function commit() {
    setEditing(false)
    if (local !== value) onSave(local)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setLocal(value); setEditing(false) } }}
        className="w-full bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none"
      />
    )
  }

  return (
    <div
      onClick={() => { setLocal(value); setEditing(true) }}
      className="cursor-text min-h-[22px] px-1.5 py-0.5 rounded hover:bg-gray-700/50 text-gray-200 truncate"
    >
      {value || <span className="text-gray-600">{placeholder}</span>}
    </div>
  )
}

function SummaryRow({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${muted ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'text-white font-bold text-base' : muted ? 'text-gray-500' : 'text-white'}`}>{value}</span>
    </div>
  )
}
