'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import type { Milestone } from '@/types'

const STATUS_ICON = {
  PENDING: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
}

const STATUS_COLORS = {
  PENDING: 'text-gray-500',
  IN_PROGRESS: 'text-blue-400',
  DONE: 'text-green-400',
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'ממתין' },
  { value: 'IN_PROGRESS', label: 'בביצוע' },
  { value: 'DONE', label: 'הושלם' },
]

interface MilestoneTimelineProps {
  milestones: Milestone[]
  projectId: string
  onUpdate: (milestones: Milestone[]) => void
}

export function MilestoneTimeline({ milestones, projectId, onUpdate }: MilestoneTimelineProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          plannedDate: newDate ? new Date(newDate) : undefined,
          status: 'PENDING',
        }),
      })
      if (res.ok) {
        const json = await res.json()
        onUpdate([...milestones, json.data])
        setNewName('')
        setNewDate('')
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(milestone: Milestone) {
    const nextStatus =
      milestone.status === 'PENDING' ? 'IN_PROGRESS'
      : milestone.status === 'IN_PROGRESS' ? 'DONE'
      : 'PENDING'
    const res = await fetch(`/api/projects/${projectId}/milestones`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId: milestone.id, status: nextStatus }),
    })
    if (res.ok) {
      onUpdate(milestones.map((m) => m.id === milestone.id ? { ...m, status: nextStatus } : m))
    }
  }

  const doneCount = milestones.filter((m) => m.status === 'DONE').length

  return (
    <div>
      {/* Summary bar */}
      {milestones.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>אבני דרך</span>
            <span>{doneCount} / {milestones.length} הושלמו</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${milestones.length > 0 ? (doneCount / milestones.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-1 mb-4">
        {milestones.length === 0 && !adding && (
          <p className="text-gray-500 text-sm text-center py-6">אין אבני דרך — הוסף שלב ראשון</p>
        )}
        {milestones.map((m, idx) => {
          const Icon = STATUS_ICON[m.status as keyof typeof STATUS_ICON] ?? Circle
          const color = STATUS_COLORS[m.status as keyof typeof STATUS_COLORS] ?? 'text-gray-500'
          return (
            <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 group">
              {/* Connector */}
              <div className="flex flex-col items-center">
                <button onClick={() => toggleStatus(m)} className={`${color} hover:scale-110 transition-transform`} title="לחץ לשינוי סטטוס">
                  <Icon size={20} />
                </button>
                {idx < milestones.length - 1 && <div className="w-px h-5 bg-gray-700 mt-1" />}
              </div>
              <div className="flex-1">
                <span className={`text-sm ${m.status === 'DONE' ? 'line-through text-gray-500' : 'text-white'}`}>
                  {m.name}
                </span>
              </div>
              {m.plannedDate && (
                <span className="text-xs text-gray-500">{formatDate(m.plannedDate)}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Add milestone */}
      {adding ? (
        <div className="flex gap-2 items-end">
          <Input
            placeholder="שם השלב..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-36"
          />
          <Button size="sm" onClick={handleAdd} loading={saving} disabled={!newName.trim()}>
            הוסף
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>ביטול</Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors"
        >
          <Plus size={14} />
          הוסף אבן דרך
        </button>
      )}
    </div>
  )
}
