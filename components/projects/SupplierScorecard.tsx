'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'

type SupplierScore = {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  qualityScore: number | null
  deliveryScore: number | null
  priceScore: number | null
  communicationScore: number | null
  overallScore: number | null
}

const SCORE_DIMENSIONS = [
  { key: 'qualityScore' as const, label: 'איכות' },
  { key: 'deliveryScore' as const, label: 'אספקה' },
  { key: 'priceScore' as const, label: 'מחיר' },
  { key: 'communicationScore' as const, label: 'תקשורת' },
]

interface SupplierScorecardProps {
  projectId: string
}

export function SupplierScorecard({ projectId }: SupplierScorecardProps) {
  const [suppliers, setSuppliers] = useState<SupplierScore[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScores, setEditScores] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load suppliers that are linked to this project (via BOM items or contracts)
    Promise.all([
      fetch(`/api/projects/${projectId}/bom`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/projects/${projectId}/contracts`).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(async ([bom, contracts]) => {
      const supplierIds = new Set<string>()
      ;(bom.data ?? []).forEach((i: { supplier?: { id: string } }) => { if (i.supplier?.id) supplierIds.add(i.supplier.id) })
      ;(contracts.data ?? []).forEach((c: { supplier?: { id: string } }) => { if (c.supplier?.id) supplierIds.add(c.supplier.id) })

      if (supplierIds.size === 0) { setLoading(false); return }

      const fetches = Array.from(supplierIds).map((id) =>
        fetch(`/api/suppliers/${id}`).then((r) => r.json()).catch(() => null)
      )
      const results = await Promise.all(fetches)
      setSuppliers(results.filter(Boolean).map((r: { data: SupplierScore }) => r.data))
      setLoading(false)
    })
  }, [projectId])

  function startEdit(supplier: SupplierScore) {
    setEditingId(supplier.id)
    setEditScores({
      qualityScore: supplier.qualityScore?.toString() ?? '',
      deliveryScore: supplier.deliveryScore?.toString() ?? '',
      priceScore: supplier.priceScore?.toString() ?? '',
      communicationScore: supplier.communicationScore?.toString() ?? '',
    })
  }

  async function saveScores(supplierId: string) {
    setSaving(true)
    try {
      const body: Record<string, number | null> = {}
      for (const dim of SCORE_DIMENSIONS) {
        const val = editScores[dim.key]
        body[dim.key] = val !== '' ? Math.min(5, Math.max(1, parseFloat(val))) : null
      }
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const json = await res.json()
        setSuppliers((prev) => prev.map((s) => (s.id === supplierId ? { ...s, ...json.data } : s)))
        setEditingId(null)
      }
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (suppliers.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="אין ספקים מקושרים לפרויקט"
        description="הוסף ספקים לחוזים או לרשימת החומרים כדי לראות את הדירוג שלהם כאן"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">דירוג ספקים</h3>
        <span className="text-xs text-gray-400">לחץ על ספק לעריכת הדירוג</span>
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier) => {
          const isEditing = editingId === supplier.id
          return (
            <Card key={supplier.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</p>
                  {supplier.contactName && <p className="text-xs text-gray-500">{supplier.contactName}</p>}
                </div>
                {supplier.overallScore != null && !isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {supplier.overallScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">/5</span>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {SCORE_DIMENSIONS.map((dim) => (
                      <label key={dim.key} className="text-xs text-gray-600 dark:text-gray-400 font-medium block">
                        {dim.label} (1–5)
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={editScores[dim.key]}
                          onChange={(e) => setEditScores((p) => ({ ...p, [dim.key]: e.target.value }))}
                          placeholder="—"
                          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveScores(supplier.id)}
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
                    >
                      {saving ? 'שומר...' : 'שמור'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5">
                  <div className="grid grid-cols-4 gap-2">
                    {SCORE_DIMENSIONS.map((dim) => {
                      const score = supplier[dim.key]
                      return (
                        <div key={dim.key} className="text-center">
                          <p className="text-xs text-gray-400 mb-1">{dim.label}</p>
                          <ScoreBar score={score} />
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => startEdit(supplier)}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    ערוך דירוג
                  </button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) {
    return <p className="text-sm text-gray-400">—</p>
  }
  const pct = (score / 5) * 100
  const color = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : score >= 2 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{score.toFixed(1)}</p>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
