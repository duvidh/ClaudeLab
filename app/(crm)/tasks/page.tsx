'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckSquare, Circle, Clock, CheckCircle2, Trash2, List, LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/utils'
import { TaskForm } from '@/components/tasks/TaskForm'
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

const TASK_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'כל הסוגים' },
  { value: 'TASK', label: 'משימה' },
  { value: 'CALL', label: 'שיחה' },
  { value: 'MEETING', label: 'פגישה' },
  { value: 'EMAIL', label: 'אימייל' },
  { value: 'FOLLOWUP', label: 'מעקב' },
  { value: 'ADMINISTRATIVE', label: 'אדמיניסטרציה' },
  { value: 'OTHER', label: 'אחר' },
]

const TASK_TYPE_LABELS: Record<string, string> = {
  TASK: 'משימה',
  CALL: 'שיחה',
  MEETING: 'פגישה',
  EMAIL: 'אימייל',
  FOLLOWUP: 'מעקב',
  ADMINISTRATIVE: 'אדמיניסטרציה',
  OTHER: 'אחר',
}

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
  employee?: { id: string; name: string } | null
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [employees, setEmployeesFilter] = useState<{ id: string; name: string }[]>([])
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [createOpen, setCreateOpen] = useState(false)
  const [kanbanCreateStatus, setKanbanCreateStatus] = useState('PENDING')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    // In kanban mode don't filter by status (all columns shown)
    if (view === 'list' && statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (taskTypeFilter) params.set('taskType', taskTypeFilter)
    try {
      const res = await fetch(`/api/tasks?${params}`)
      const json = await res.json()
      setTasks(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [view, statusFilter, priorityFilter, taskTypeFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTasks() }, [fetchTasks])

  useEffect(() => {
    fetch('/api/employees?status=ACTIVE').then((r) => r.json()).then((j) => setEmployeesFilter(j.data ?? []))
  }, [])

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

  function openCreateWithStatus(status: string) {
    setKanbanCreateStatus(status)
    setCreateOpen(true)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const pendingCount = tasks.filter((t) => t.status !== 'DONE').length

  const filteredTasks = assigneeFilter
    ? tasks.filter((t) => t.employeeId === assigneeFilter)
    : tasks

  const assigneeOptions = [
    { value: '', label: 'כל הנציגים' },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ]

  return (
    <div>
      <PageHeader
        title="משימות"
        subtitle={`${filteredTasks.length} סה"כ · ${pendingCount} ממתינות`}
        actions={
          <div className="flex items-center gap-2">
            {/* List / Kanban toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="תצוגת רשימה"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`p-1.5 rounded transition-colors ${view === 'kanban' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                title="תצוגת לוח"
              >
                <LayoutDashboard size={15} />
              </button>
            </div>
            <Button onClick={() => { setKanbanCreateStatus('PENDING'); setCreateOpen(true) }}>
              <Plus size={16} />
              משימה חדשה
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {view === 'list' && (
          <div className="w-40">
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          </div>
        )}
        <div className="w-40">
          <Select options={PRIORITY_OPTIONS} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} />
        </div>
        <div className="w-44">
          <Select options={TASK_TYPE_FILTER_OPTIONS} value={taskTypeFilter} onChange={(e) => setTaskTypeFilter(e.target.value)} />
        </div>
        {employees.length > 0 && (
          <div className="w-44">
            <Select options={assigneeOptions} value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 && view === 'list' ? (
        <EmptyState
          icon={CheckSquare}
          title="אין משימות"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />משימה חדשה</Button>}
        />
      ) : view === 'kanban' ? (
        <KanbanView tasks={filteredTasks} onCycle={cycleStatus} onDelete={handleDelete} onAddInColumn={openCreateWithStatus} />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow key={task.id} task={task} onCycle={cycleStatus} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="משימה חדשה" size="md">
        <TaskForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} initialStatus={kanbanCreateStatus} />
      </Modal>
    </div>
  )
}

// ─── Shared task row (used by list view) ─────────────────────────────────────

function TaskRow({
  task,
  onCycle,
  onDelete,
}: {
  task: TaskWithRelations
  onCycle: (t: TaskWithRelations) => void
  onDelete: (id: string) => void
}) {
  const Icon = STATUS_ICON[task.status as keyof typeof STATUS_ICON] ?? Circle
  const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()
  return (
    <Card className="flex items-center gap-3 group">
      <button
        onClick={() => onCycle(task)}
        className={`shrink-0 transition-colors ${
          task.status === 'DONE' ? 'text-green-500 dark:text-green-400' :
          task.status === 'IN_PROGRESS' ? 'text-blue-500 dark:text-blue-400' :
          'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <Icon size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {task.title}
          </p>
          {task.taskType && task.taskType !== 'TASK' && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
            </span>
          )}
        </div>
        {task.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{task.description}</p>}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          {task.client && <span>👤 {task.client.name}</span>}
          {task.project && <span>📁 {task.project.name}</span>}
          {task.lead && <span>🎯 {task.lead.fullName}</span>}
          {(task.employee?.name ?? task.assignedTo) && <span>→ {task.employee?.name ?? task.assignedTo}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge type="priority" value={task.priority} />
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  )
}

// ─── Kanban view ──────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { status: 'PENDING', label: 'ממתין', color: 'border-gray-400 dark:border-gray-600', dot: 'bg-gray-400' },
  { status: 'IN_PROGRESS', label: 'בביצוע', color: 'border-blue-500/50', dot: 'bg-blue-400' },
  { status: 'DONE', label: 'הושלם', color: 'border-green-500/50', dot: 'bg-green-400' },
]

function KanbanView({
  tasks,
  onCycle,
  onDelete,
  onAddInColumn,
}: {
  tasks: TaskWithRelations[]
  onCycle: (t: TaskWithRelations) => void
  onDelete: (id: string) => void
  onAddInColumn: (status: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status)
        return (
          <div key={col.status}>
            {/* Column header */}
            <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${col.color}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{col.label}</span>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <button
                onClick={() => onAddInColumn(col.status)}
                className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="הוסף משימה"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {colTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-600 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  אין משימות
                </div>
              ) : (
                colTasks.map((task) => {
                  const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()
                  return (
                    <div key={task.id} className="group bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className={`text-sm font-medium leading-snug ${task.status === 'DONE' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {task.title}
                        </p>
                        <button
                          onClick={() => onDelete(task.id)}
                          className="p-0.5 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {task.client && <span>👤 {task.client.name}</span>}
                          {task.project && <span>📁 {task.project.name}</span>}
                          {(task.employee?.name ?? task.assignedTo) && <span>→ {task.employee?.name ?? task.assignedTo}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge type="priority" value={task.priority} />
                          {task.dueDate && (
                            <span className={`text-xs ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Cycle to next status */}
                      <button
                        onClick={() => onCycle(task)}
                        className="mt-2 w-full text-xs text-gray-400 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center py-0.5"
                      >
                        {task.status === 'PENDING' ? 'התחל ←' : task.status === 'IN_PROGRESS' ? 'סיים ✓' : 'אפס ↺'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

