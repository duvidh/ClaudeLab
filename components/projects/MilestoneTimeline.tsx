'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, Plus, LayoutList, BarChart2 } from 'lucide-react'
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

const STATUS_BG = {
  PENDING: 'bg-gray-500',
  IN_PROGRESS: 'bg-blue-500',
  DONE: 'bg-green-500',
}


interface MilestoneTimelineProps {
  milestones: Milestone[]
  projectId: string
  onUpdate: (milestones: Milestone[]) => void
}

function buildGanttRange(milestones: Milestone[]) {
  const dated = milestones.filter((m) => m.plannedDate)
  if (dated.length === 0) return null

  const times = dated.map((m) => new Date(m.plannedDate!).getTime())
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)

  const start = new Date(minTime)
  start.setDate(1)
  const end = new Date(maxTime)
  end.setMonth(end.getMonth() + 1, 1)

  const totalMs = end.getTime() - start.getTime()

  const months: { label: string; leftPct: number; widthPct: number }[] = []
  const cur = new Date(start)
  while (cur < end) {
    const monthStart = cur.getTime() - start.getTime()
    const next = new Date(cur)
    next.setMonth(next.getMonth() + 1, 1)
    const monthEnd = Math.min(next.getTime(), end.getTime()) - start.getTime()
    months.push({
      label: cur.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' }),
      leftPct: (monthStart / totalMs) * 100,
      widthPct: ((monthEnd - monthStart) / totalMs) * 100,
    })
    cur.setMonth(cur.getMonth() + 1, 1)
  }

  const today = new Date()
  const todayPct = today >= start && today <= end
    ? ((today.getTime() - start.getTime()) / totalMs) * 100
    : null

  function pctFor(date: string | Date | null | undefined): number | null {
    if (!date) return null
    const t = new Date(date).getTime()
    if (t < start.getTime() || t > end.getTime()) return null
    return ((t - start.getTime()) / totalMs) * 100
  }

  return { months, todayPct, pctFor }
}

export function MilestoneTimeline({ milestones, projectId, onUpdate }: MilestoneTimelineProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'list' | 'gantt'>('list')

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
  const gantt = buildGanttRange(milestones)
  const hasDates = milestones.some((m) => m.plannedDate)

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {milestones.length > 0 && (
            <div>
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
        </div>
        {hasDates && (
          <div className="flex bg-gray-800 rounded-lg border border-gray-700 p-0.5 ms-4">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="תצוגת רשימה"
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => setView('gantt')}
              className={`p-1.5 rounded transition-colors ${view === 'gantt' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="תצוגת ציר זמן"
            >
              <BarChart2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-1 mb-4">
          {milestones.length === 0 && !adding && (
            <p className="text-gray-500 text-sm text-center py-6">אין אבני דרך — הוסף שלב ראשון</p>
          )}
          {milestones.map((m, idx) => {
            const Icon = STATUS_ICON[m.status as keyof typeof STATUS_ICON] ?? Circle
            const color = STATUS_COLORS[m.status as keyof typeof STATUS_COLORS] ?? 'text-gray-500'
            return (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 group">
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
      )}

      {/* Gantt view */}
      {view === 'gantt' && gantt && (
        <div className="mb-4 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Month header */}
            <div className="relative h-6 mb-1 border-b border-gray-700">
              {gantt.months.map((mo, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center text-[10px] text-gray-500 font-medium border-r border-gray-700/50 px-1"
                  style={{ left: `${mo.leftPct}%`, width: `${mo.widthPct}%` }}
                >
                  {mo.label}
                </div>
              ))}
            </div>

            {/* Timeline rows */}
            <div className="relative">
              {/* Month grid lines */}
              {gantt.months.map((mo, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-gray-800"
                  style={{ left: `${mo.leftPct}%` }}
                />
              ))}

              {/* Today line */}
              {gantt.todayPct !== null && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-blue-500/50 z-10"
                  style={{ left: `${gantt.todayPct}%` }}
                >
                  <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500" />
                </div>
              )}

              {/* Milestone rows */}
              {milestones.map((m) => {
                const pct = gantt.pctFor(m.plannedDate)
                const bg = STATUS_BG[m.status as keyof typeof STATUS_BG] ?? 'bg-gray-500'
                return (
                  <div key={m.id} className="relative h-10 flex items-center border-b border-gray-800/50">
                    {/* Label on the left (fixed) — show as overlay */}
                    <span className={`absolute start-0 text-xs ps-1 truncate max-w-[120px] z-20 ${m.status === 'DONE' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      {m.name}
                    </span>

                    {/* Track line */}
                    <div className="absolute inset-x-0 top-1/2 h-px bg-gray-700" />

                    {/* Milestone marker */}
                    {pct !== null && (
                      <div
                        className="absolute z-10 flex flex-col items-center"
                        style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                      >
                        <button
                          onClick={() => toggleStatus(m)}
                          className={`w-3.5 h-3.5 rounded-full ${bg} ring-2 ring-gray-900 hover:scale-125 transition-transform`}
                          title={`${m.name} — לחץ לשינוי סטטוס`}
                        />
                        {m.plannedDate && (
                          <span className="text-[9px] text-gray-600 mt-0.5 whitespace-nowrap">
                            {new Date(m.plannedDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Milestone with no date */}
                    {pct === null && (
                      <span className="absolute end-2 text-[10px] text-gray-600 italic">ללא תאריך</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block" />ממתין</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />בביצוע</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />הושלם</span>
              {gantt.todayPct !== null && <span className="flex items-center gap-1"><span className="w-px h-3 bg-blue-500/50 inline-block" />היום</span>}
            </div>
          </div>
        </div>
      )}

      {view === 'gantt' && !gantt && (
        <p className="text-sm text-gray-500 text-center py-4">הוסף תאריכים לאבני הדרך כדי לראות את ציר הזמן</p>
      )}

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
