'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckSquare, Circle, Clock, CheckCircle2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'PENDING', label: 'ממתין' },
  { value: 'IN_PROGRESS', label: 'בביצוע' },
  { value: 'DONE', label: 'הושלם' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'כל העדיפויות' },
  { value: 'HIGH', label: 'גבוהה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'LOW', label: 'נמוכה' },
]

const PRIORITY_FORM_OPTIONS = [
  { value: 'HIGH', label: 'גבוהה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'LOW', label: 'נמוכה' },
]

const STATUS_ICON = {
  PENDING: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
}

const STATUS_CYCLE: Record<string, string> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'PENDING',
}

type TaskWithRelations = Task & {
  lead?: { id: string; fullName: string } | null
  client?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    try {
      const res = await fetch(`/api/tasks?${params}`)
      const json = await res.json()
      setTasks(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function cycleStatus(task: TaskWithRelations) {
    const nextStatus = STATUS_CYCLE[task.status]
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: nextStatus }),
    })
    if (res.ok) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t))
    }
  }

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setCreateOpen(false); await fetchTasks() }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const pendingCount = tasks.filter((t) => t.status !== 'DONE').length

  return (
    <div>
      <PageHeader
        title="משימות"
        subtitle={`${tasks.length} סה"כ · ${pendingCount} ממתינות`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            משימה חדשה
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-40">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <div className="w-40">
          <Select options={PRIORITY_OPTIONS} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="אין משימות"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />משימה חדשה</Button>}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const Icon = STATUS_ICON[task.status as keyof typeof STATUS_ICON] ?? Circle
            const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()
            return (
              <Card key={task.id} className="flex items-center gap-3 group">
                <button
                  onClick={() => cycleStatus(task)}
                  className={`shrink-0 transition-colors ${
                    task.status === 'DONE' ? 'text-green-400' :
                    task.status === 'IN_PROGRESS' ? 'text-blue-400' :
                    'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon size={20} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {task.client && <span>👤 {task.client.name}</span>}
                    {task.project && <span>📁 {task.project.name}</span>}
                    {task.lead && <span>🎯 {task.lead.fullName}</span>}
                    {task.assignedTo && <span>→ {task.assignedTo}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge type="priority" value={task.priority} />
                  {task.dueDate && (
                    <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="משימה חדשה" size="sm">
        <TaskForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}

function TaskForm({ onSubmit, onCancel }: { onSubmit: (d: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'MEDIUM', status: 'PENDING' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      await onSubmit({ ...form, dueDate: form.dueDate ? new Date(form.dueDate) : undefined })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="כותרת *" placeholder="תיאור המשימה" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <label className="text-sm text-gray-300 font-medium block">
        פירוט
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      <Input label="שיוך ל" placeholder="שם הנציג" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} />
      <Input label="תאריך יעד" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
      <Select label="עדיפות" options={PRIORITY_FORM_OPTIONS} value={form.priority} onChange={(e) => set('priority', e.target.value)} />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.title} className="flex-1">צור משימה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
