'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/shared/EmptyState'

type Risk = {
  id: string
  title: string
  description: string | null
  probability: string
  impact: string
  mitigation: string | null
  status: string
  owner: { id: string; name: string } | null
  createdAt: string
}

const PROB_OPTIONS = [
  { value: 'LOW', label: 'נמוכה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'HIGH', label: 'גבוהה' },
]

const IMPACT_OPTIONS = [
  { value: 'LOW', label: 'נמוך' },
  { value: 'MEDIUM', label: 'בינוני' },
  { value: 'HIGH', label: 'גבוה' },
  { value: 'CRITICAL', label: 'קריטי' },
]

const STATUS_OPTIONS = [
  { value: 'IDENTIFIED', label: 'זוהה' },
  { value: 'MONITORING', label: 'במעקב' },
  { value: 'MITIGATED', label: 'מופחת' },
  { value: 'CLOSED', label: 'סגור' },
]

const LEVEL_COLOR: Record<string, string> = {
  LOW: 'bg-green-500/15 text-green-700 dark:text-green-400',
  MEDIUM: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  HIGH: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  CRITICAL: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

const STATUS_COLOR: Record<string, string> = {
  IDENTIFIED: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  MONITORING: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  MITIGATED: 'bg-green-500/15 text-green-700 dark:text-green-400',
  CLOSED: 'bg-gray-500/15 text-gray-500 dark:text-gray-400',
}

const LEVEL_LABEL: Record<string, string> = {
  LOW: 'נמוך', MEDIUM: 'בינוני', HIGH: 'גבוה', CRITICAL: 'קריטי',
}
const STATUS_LABEL: Record<string, string> = {
  IDENTIFIED: 'זוהה', MONITORING: 'במעקב', MITIGATED: 'מופחת', CLOSED: 'סגור',
}

interface RiskRegisterProps {
  projectId: string
}

export function RiskRegister({ projectId }: RiskRegisterProps) {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/risks`)
      .then((r) => r.json())
      .then((j) => { setRisks(j.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${projectId}/risks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setRisks((prev) => [json.data, ...prev])
      setAddOpen(false)
    }
  }

  async function handleDelete(riskId: string) {
    setDeletingId(riskId)
    try {
      const res = await fetch(`/api/projects/${projectId}/risks?riskId=${riskId}`, { method: 'DELETE' })
      if (res.ok) setRisks((prev) => prev.filter((r) => r.id !== riskId))
    } finally { setDeletingId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const open = risks.filter((r) => r.status !== 'CLOSED')
  const closed = risks.filter((r) => r.status === 'CLOSED')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">סיכונים פעילים</h3>
          {open.length > 0 && (
            <span className="text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
              {open.length}
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          הוסף סיכון
        </Button>
      </div>

      {risks.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="אין סיכונים רשומים"
          action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} />הוסף סיכון ראשון</Button>}
        />
      ) : (
        <div className="space-y-2">
          {open.map((risk) => (
            <RiskRow
              key={risk.id}
              risk={risk}
              expanded={expandedId === risk.id}
              onToggle={() => setExpandedId(expandedId === risk.id ? null : risk.id)}
              onDelete={() => handleDelete(risk.id)}
              deleting={deletingId === risk.id}
            />
          ))}
          {closed.length > 0 && (
            <>
              <p className="text-xs text-gray-500 mt-4 mb-2">סיכונים סגורים</p>
              {closed.map((risk) => (
                <RiskRow
                  key={risk.id}
                  risk={risk}
                  expanded={expandedId === risk.id}
                  onToggle={() => setExpandedId(expandedId === risk.id ? null : risk.id)}
                  onDelete={() => handleDelete(risk.id)}
                  deleting={deletingId === risk.id}
                />
              ))}
            </>
          )}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="סיכון חדש" size="md">
        <RiskForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}

function RiskRow({
  risk,
  expanded,
  onToggle,
  onDelete,
  deleting,
}: {
  risk: Risk
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const riskScore = getRiskScore(risk.probability, risk.impact)

  return (
    <Card className="group">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-8 rounded-full shrink-0 ${riskScore >= 6 ? 'bg-red-500' : riskScore >= 3 ? 'bg-yellow-500' : 'bg-green-500'}`} />
        <button className="flex-1 min-w-0 text-right" onClick={onToggle}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{risk.title}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${STATUS_COLOR[risk.status] ?? ''}`}>
              {STATUS_LABEL[risk.status] ?? risk.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${LEVEL_COLOR[risk.probability] ?? ''}`}>
              הסתברות: {LEVEL_LABEL[risk.probability] ?? risk.probability}
            </span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded ${LEVEL_COLOR[risk.impact] ?? ''}`}>
              השפעה: {LEVEL_LABEL[risk.impact] ?? risk.impact}
            </span>
            {risk.owner && <span className="text-[11px] text-gray-500">{risk.owner.name}</span>}
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
          <button onClick={onToggle} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 ps-5">
          {risk.description && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">תיאור</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{risk.description}</p>
            </div>
          )}
          {risk.mitigation && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">תוכנית מיגון</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{risk.mitigation}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function getRiskScore(probability: string, impact: string): number {
  const p = { LOW: 1, MEDIUM: 2, HIGH: 3 }[probability] ?? 1
  const i = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[impact] ?? 1
  return p * i
}

function RiskForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    mitigation: '',
    status: 'IDENTIFIED',
  })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try { await onSubmit(form) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="כותרת סיכון *" placeholder="תאר את הסיכון בקצרה" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
        תיאור
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Select label="הסתברות" options={PROB_OPTIONS} value={form.probability} onChange={(e) => set('probability', e.target.value)} />
        <Select label="השפעה" options={IMPACT_OPTIONS} value={form.impact} onChange={(e) => set('impact', e.target.value)} />
      </div>
      <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
        תוכנית מיגון
        <textarea
          value={form.mitigation}
          onChange={(e) => set('mitigation', e.target.value)}
          rows={2}
          placeholder="תאר כיצד ניתן להפחית סיכון זה..."
          className="mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <Select label="סטטוס" options={STATUS_OPTIONS} value={form.status} onChange={(e) => set('status', e.target.value)} />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.title} className="flex-1">הוסף סיכון</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
