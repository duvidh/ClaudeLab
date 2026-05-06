'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, RefreshCw, Package, Pencil, Check, X, Power, Download, Upload, FileWarning } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { CatalogItem } from '@/types'

type ImportRowError = {
  row: number
  data: Record<string, string>
  errors: string[]
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; error: number } | null>(null)
  const [importErrors, setImportErrors] = useState<ImportRowError[]>([])
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

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[]
    return cats.sort()
  }, [items])

  const displayedItems = useMemo(() => {
    if (!categoryFilter) return items
    return items.filter((i) => i.category === categoryFilter)
  }, [items, categoryFilter])

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

  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let inQuotes = false
    let current = ''
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = '' }
      else { current += char }
    }
    result.push(current.trim())
    return result
  }

  async function handleImportCSV(e: React.FormEvent) {
    e.preventDefault()
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    setImportErrors([])
    try {
      const text = await importFile.text()
      const lines = text.replace(/^﻿/, '').split('\n').filter((l) => l.trim())
      const headers = parseCSVLine(lines[0])
      const dataLines = lines.slice(1)
      let success = 0
      const errors: ImportRowError[] = []

      for (let i = 0; i < dataLines.length; i++) {
        const values = parseCSVLine(dataLines[i])
        const rowData: Record<string, string> = {}
        headers.forEach((h, idx) => { rowData[h] = values[idx] ?? '' })

        const [sku, name, category, unit, salePrice, selfCost, supplier, stock] = values
        const rowErrors: string[] = []
        if (!name) rowErrors.push('שם פריט חסר')

        if (rowErrors.length > 0) {
          errors.push({ row: i + 2, data: rowData, errors: rowErrors })
          continue
        }

        const res = await fetch('/api/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku: sku || undefined,
            name,
            category: category || undefined,
            unit: unit || undefined,
            salePrice: parseFloat(salePrice) || 0,
            selfCost: parseFloat(selfCost) || 0,
            supplier: supplier || undefined,
            stock: stock ? parseFloat(stock) : undefined,
          }),
        })

        if (res.ok) {
          success++
        } else {
          let reason = 'שגיאת שרת'
          try { const j = await res.json(); if (j.error) reason = j.error } catch {}
          errors.push({ row: i + 2, data: rowData, errors: [reason] })
        }
      }

      setImportResult({ success, error: errors.length })
      setImportErrors(errors)
      if (success > 0) {
        await fetchItems()
        if (errors.length === 0) setTimeout(() => { setImportOpen(false); setImportResult(null); setImportFile(null) }, 1500)
      }
    } finally { setImporting(false) }
  }

  function downloadErrorReport() {
    if (importErrors.length === 0) return
    const dataKeys = importErrors.length > 0 ? Object.keys(importErrors[0].data) : []
    const csvHeaders = [...dataKeys, 'שורה', 'סיבת שגיאה']
    const csvRows = importErrors.map((e) => [
      ...dataKeys.map((k) => e.data[k] ?? ''),
      String(e.row),
      e.errors.join('; '),
    ])
    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog_import_errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportCSV() {
    const headers = ['מק"ט', 'שם פריט', 'קטגוריה', 'יחידה', 'מחיר מכירה', 'עלות עצמית', 'ספק', 'מלאי', 'סטטוס']
    const rows = displayedItems.map((i) => [
      i.sku, i.name, i.category ?? '', i.unit ?? '',
      i.salePrice, i.selfCost, i.supplier ?? '', i.stock ?? '', i.isActive ? 'פעיל' : 'לא פעיל',
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalog.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const categoryOptions = [
    { value: '', label: 'כל הקטגוריות' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div>
      <PageHeader
        title="קטלוג חומרים"
        subtitle={`${displayedItems.length} פריטים${categoryFilter ? ` · ${categoryFilter}` : ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setImportOpen(true); setImportResult(null); setImportFile(null); setImportErrors([]) }}>
              <Upload size={16} />
              ייבוא CSV
            </Button>
            <Button variant="secondary" onClick={exportCSV}>
              <Download size={16} />
              ייצוא CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              פריט חדש
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="חיפוש לפי שם, מק״ט, קטגוריה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {categories.length > 0 && (
          <div className="w-44">
            <Select options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
          </div>
        )}
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
      ) : displayedItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="קטלוג ריק"
          description="הוסף חומרים לקטלוג כדי להשתמש בהם בהצעות מחיר"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />פריט חדש</Button>}
        />
      ) : (
        <>
        {/* Mobile: card list */}
        <div className="md:hidden space-y-3">
          {displayedItems.map((item) => {
            const profitPct = item.salePrice > 0 ? ((item.salePrice - item.selfCost) / item.salePrice * 100) : 0
            return (
              <div key={item.id} className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                    {item.sku && <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">{item.sku}</p>}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'}`}>
                    {item.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {item.category && <div><span className="text-gray-400">קטגוריה: </span>{item.category}</div>}
                  {item.unit && <div><span className="text-gray-400">יחידה: </span>{item.unit}</div>}
                  <div><span className="text-gray-400">מחיר: </span><span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.salePrice)}</span></div>
                  <div className={`font-semibold ${profitPct >= 20 ? 'text-green-500' : profitPct >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                    רווח: {profitPct.toFixed(1)}%
                  </div>
                  {item.supplier && <div className="col-span-2 truncate"><span className="text-gray-400">ספק: </span>{item.supplier}</div>}
                </div>
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => { setEditingId(item.id); setEditRow({ ...item }) }}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => toggleActive(item)}
                    className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${item.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}
                  >
                    <Power size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop: standard table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {displayedItems.map((item) => {
                const isEditing = editingId === item.id
                const profitPct = item.salePrice > 0
                  ? ((item.salePrice - item.selfCost) / item.salePrice * 100)
                  : 0

                return (
                  <tr key={item.id} className={`bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!item.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {isEditing
                        ? <input value={editRow.sku ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, sku: e.target.value }))} className="w-20 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.sku}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                      {isEditing
                        ? <input value={editRow.name ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))} className="w-36 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                      {isEditing
                        ? <input value={editRow.category ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, category: e.target.value }))} className="w-24 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.category || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                      {isEditing
                        ? <input value={editRow.unit ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, unit: e.target.value }))} className="w-16 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.unit || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                      {isEditing
                        ? <input type="number" value={editRow.salePrice ?? 0} onChange={(e) => setEditRow((p) => ({ ...p, salePrice: parseFloat(e.target.value) || 0 }))} className="w-20 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : formatCurrency(item.salePrice)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                      {isEditing
                        ? <input type="number" value={editRow.selfCost ?? 0} onChange={(e) => setEditRow((p) => ({ ...p, selfCost: parseFloat(e.target.value) || 0 }))} className="w-20 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : formatCurrency(item.selfCost)}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${profitPct >= 20 ? 'text-green-400' : profitPct >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {profitPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      {isEditing
                        ? <input value={editRow.supplier ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, supplier: e.target.value }))} className="w-24 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.supplier || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      {isEditing
                        ? <input type="number" value={editRow.stock ?? ''} onChange={(e) => setEditRow((p) => ({ ...p, stock: parseFloat(e.target.value) || 0 }))} className="w-16 bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white text-xs outline-none" />
                        : item.stock ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.isActive ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'}`}>
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
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="פריט חדש בקטלוג" size="md">
        <CatalogItemForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} existingCategories={categories} />
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="ייבוא CSV לקטלוג" size="sm">
        <form onSubmit={handleImportCSV} className="space-y-4">
          <p className="text-xs text-gray-400">
            העלה קובץ CSV בפורמט הייצוא: מק&ldquo;ט, שם פריט, קטגוריה, יחידה, מחיר מכירה, עלות עצמית, ספק, מלאי
          </p>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-1">קובץ CSV *</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-300 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
            />
          </div>
          {importResult && (
            <div className={`text-sm rounded-lg px-3 py-2 ${importResult.error > 0 ? 'bg-yellow-500/10 text-yellow-300' : 'bg-green-500/10 text-green-300'}`}>
              יובאו בהצלחה: {importResult.success} · שגיאות: {importResult.error}
            </div>
          )}
          {importErrors.length > 0 && (
            <div className="space-y-2">
              <div className="max-h-32 overflow-y-auto rounded-lg bg-red-500/5 border border-red-500/20 divide-y divide-red-500/10">
                {importErrors.slice(0, 5).map((e) => (
                  <div key={e.row} className="px-3 py-1.5 text-xs text-red-400">
                    <span className="font-medium">שורה {e.row}:</span> {e.errors.join(' · ')}
                  </div>
                ))}
                {importErrors.length > 5 && (
                  <div className="px-3 py-1.5 text-xs text-gray-500">
                    ועוד {importErrors.length - 5} שגיאות נוספות...
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={downloadErrorReport}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                <FileWarning size={14} />
                הורד דוח שגיאות ({importErrors.length} שורות)
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={importing} disabled={!importFile} className="flex-1">
              ייבא פריטים
            </Button>
            <Button type="button" variant="secondary" onClick={() => setImportOpen(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function CatalogItemForm({
  onSubmit,
  onCancel,
  existingCategories,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  existingCategories: string[]
}) {
  const [form, setForm] = useState({ sku: '', name: '', category: '', unit: '', salePrice: '', selfCost: '', supplier: '', stock: '' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function generateSku() {
    const prefix = form.category
      ? form.category.replace(/\s+/g, '').slice(0, 3).toUpperCase()
      : 'SKU'
    const suffix = Date.now().toString().slice(-4)
    set('sku', `${prefix}-${suffix}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sku || !form.name) return
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        salePrice: parseFloat(form.salePrice) || 0,
        selfCost: parseFloat(form.selfCost) || 0,
        stock: form.stock ? parseFloat(form.stock) : undefined,
      })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* SKU with generate button */}
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-1">מק&quot;ט *</label>
          <div className="flex gap-1">
            <input
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="SKU-001"
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={generateSku}
              className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg transition-colors"
              title="צור מק״ט אוטומטי"
            >
              ✨
            </button>
          </div>
        </div>
        <Input label="שם פריט *" placeholder="שם החומר" value={form.name} onChange={(e) => set('name', e.target.value)} />

        {/* Category with datalist */}
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-1">קטגוריה</label>
          <input
            list="catalog-categories"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="ריצוף, גבס..."
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id="catalog-categories">
            {existingCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

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
