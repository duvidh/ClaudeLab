'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, User, Users, DollarSign,
  TrendingUp, TrendingDown, FolderKanban, Trash2, Plus,
  Upload, Download, File as FileIcon,
} from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { MilestoneTimeline } from '@/components/projects/MilestoneTimeline'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useSettingsLists } from '@/lib/useSettingsLists'
import type { Project, Client, Milestone, Quote, Payment, Task, ProjectFile } from '@/types'

type ProjectWithRelations = Project & {
  client: Client
  milestones: Milestone[]
  quotes: Quote[]
  payments: Payment[]
  tasks: Task[]
  files: ProjectFile[]
}

const TABS = [
  { id: 'overview', label: 'סקירה' },
  { id: 'milestones', label: 'אבני דרך' },
  { id: 'financials', label: 'כספים' },
  { id: 'tasks', label: 'משימות' },
  { id: 'documents', label: 'מסמכים' },
]

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'גבוהה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'LOW', label: 'נמוכה' },
]

interface ProjectDetailProps {
  project: ProjectWithRelations
}

export function ProjectDetail({ project: initialProject }: ProjectDetailProps) {
  const lists = useSettingsLists()
  const [project, setProject] = useState(initialProject)
  const [files, setFiles] = useState<ProjectFile[]>(initialProject.files)
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem(`tab-project-${initialProject.id}`) ?? 'overview' } catch { return 'overview' }
  })

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    try { localStorage.setItem(`tab-project-${initialProject.id}`, tab) } catch {}
  }
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [progressEditing, setProgressEditing] = useState(false)
  const [progressVal, setProgressVal] = useState(project.progressPercent)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const router = useRouter()

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count:
      t.id === 'milestones' ? project.milestones.length
      : t.id === 'tasks' ? project.tasks.length
      : t.id === 'documents' ? files.length
      : undefined,
  }))

  const totalPaid = project.payments.reduce((s, p) => s + p.amount, 0)

  async function handleUpdate(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setProject((prev) => ({ ...prev, ...json.data }))
      setEditOpen(false)
      router.refresh()
    }
  }

  async function saveProgress() {
    await handleUpdate({ progressPercent: progressVal })
    setProgressEditing(false)
  }

  async function handleAddPayment(data: Record<string, unknown>) {
    const res = await fetch(`/api/projects/${project.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setProject((prev) => ({ ...prev, payments: [json.data, ...prev.payments] }))
      setPaymentOpen(false)
    }
  }

  async function handleDeletePayment(id: string) {
    setDeletingPaymentId(id)
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProject((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) }))
      }
    } finally { setDeletingPaymentId(null) }
  }

  async function handleAddTask(data: Record<string, unknown>) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, projectId: project.id }),
    })
    if (res.ok) {
      const json = await res.json()
      setProject((prev) => ({ ...prev, tasks: [json.data, ...prev.tasks] }))
      setTaskOpen(false)
    }
  }

  async function handleDeleteTask(id: string) {
    setDeletingTaskId(id)
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProject((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
      }
    } finally { setDeletingTaskId(null) }
  }

  const delayDays =
    project.plannedEndDate && !project.actualEndDate
      ? Math.max(0, Math.floor((Date.now() - new Date(project.plannedEndDate).getTime()) / 86400000)) // eslint-disable-line react-hooks/purity
      : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <StatusBadge type="project" value={project.status} />
            {delayDays > 0 && (
              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                עיכוב {delayDays} ימים
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <Link href={`/clients/${project.client.id}`} className="flex items-center gap-1 hover:text-white">
              <User size={13} />
              {project.client.name}
            </Link>
            {project.address && <span className="flex items-center gap-1"><MapPin size={13} />{project.address}</span>}
            {project.projectManager && <span className="flex items-center gap-1"><User size={13} />{project.projectManager}</span>}
            {project.fieldTeam && (() => {
              try {
                const team: string[] = JSON.parse(project.fieldTeam)
                return team.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {team.join(', ')}
                  </span>
                ) : null
              } catch { return null }
            })()}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>עריכה</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 size={14} /></Button>
        </div>
      </div>

      {/* Progress bar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">התקדמות כללית</span>
          {progressEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={100}
                value={progressVal}
                onChange={(e) => setProgressVal(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-sm text-white text-center focus:outline-none"
              />
              <span className="text-gray-400 text-sm">%</span>
              <Button size="sm" onClick={saveProgress}>שמור</Button>
              <Button size="sm" variant="ghost" onClick={() => { setProgressEditing(false); setProgressVal(project.progressPercent) }}>ביטול</Button>
            </div>
          ) : (
            <button onClick={() => setProgressEditing(true)} className="text-xs text-blue-400 hover:text-blue-300">
              {project.progressPercent}% — ערוך
            </button>
          )}
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${project.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
          {project.startDate && <span>התחלה: {formatDate(project.startDate)}</span>}
          {project.plannedEndDate && <span>סיום מתוכנן: {formatDate(project.plannedEndDate)}</span>}
          {project.actualEndDate && <span>סיום בפועל: {formatDate(project.actualEndDate)}</span>}
        </div>
      </Card>

      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={handleTabChange} />

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <FinStat icon={DollarSign} label="ערך חוזה" value={formatCurrency(project.contractValue)} color="text-white" />
            <FinStat icon={TrendingUp} label='סה"כ שולם' value={formatCurrency(totalPaid)} color="text-green-300" />
            <FinStat icon={TrendingDown} label="יתרה" value={formatCurrency(project.contractValue - totalPaid)} color={(project.contractValue - totalPaid) > 0 ? 'text-yellow-300' : 'text-teal-300'} />
          </div>
          {project.notes && (
            <Card>
              <p className="text-xs text-gray-500 mb-2">הערות פרויקט</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{project.notes}</p>
            </Card>
          )}
        </div>
      )}

      {/* Milestones */}
      {activeTab === 'milestones' && (
        <Card>
          <MilestoneTimeline
            milestones={project.milestones}
            projectId={project.id}
            onUpdate={(ms) => setProject((prev) => ({ ...prev, milestones: ms }))}
          />
        </Card>
      )}

      {/* Financials */}
      {activeTab === 'financials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <FinStat icon={DollarSign} label="ערך חוזה" value={formatCurrency(project.contractValue)} />
            <FinStat icon={TrendingUp} label='סה"כ תשלומים' value={formatCurrency(totalPaid)} color="text-green-300" />
            <FinStat icon={TrendingDown} label="יתרה לתשלום" value={formatCurrency(project.contractValue - totalPaid)} color={(project.contractValue - totalPaid) > 0 ? 'text-yellow-300' : 'text-teal-300'} />
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-300">היסטוריית תשלומים</h3>
            <Button size="sm" onClick={() => setPaymentOpen(true)}>
              <Plus size={14} />
              רשום תשלום
            </Button>
          </div>

          {project.payments.length === 0 ? (
            <EmptyState icon={DollarSign} title="אין תשלומים רשומים" action={<Button size="sm" onClick={() => setPaymentOpen(true)}><Plus size={14} />רשום תשלום</Button>} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/60 border-b border-gray-700">
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">תאריך</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">סכום</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">אמצעי</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">אסמכתא</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {project.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-800/40 group transition-colors">
                      <td className="px-4 py-3 text-gray-300">{formatDate(p.date)}</td>
                      <td className="px-4 py-3 font-medium text-green-300">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-gray-400">{p.method || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{p.reference || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={deletingPaymentId === p.id}
                          className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
        </div>
      )}

      {/* Tasks */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setTaskOpen(true)}>
              <Plus size={14} />
              הוסף משימה
            </Button>
          </div>
          {project.tasks.length === 0 ? (
            <EmptyState icon={FolderKanban} title="אין משימות לפרויקט זה" action={<Button size="sm" onClick={() => setTaskOpen(true)}><Plus size={14} />הוסף משימה</Button>} />
          ) : (
            <div className="space-y-2">
              {project.tasks.map((task) => (
                <Card key={task.id}>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="priority" value={task.priority} />
                      <StatusBadge type="task" value={task.status} />
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={deletingTaskId === task.id}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {activeTab === 'documents' && (
        <ProjectFilesTab projectId={project.id} files={files} onFilesChange={setFiles} />
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="עריכת פרויקט" size="lg">
        <ProjectForm initialData={project} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="רישום תשלום" size="sm">
        <PaymentForm
          onSubmit={handleAddPayment}
          onCancel={() => setPaymentOpen(false)}
          methodOptions={[
            { value: '', label: 'בחר אמצעי תשלום' },
            ...lists.paymentMethods.map((m) => ({ value: m, label: m })),
          ]}
        />
      </Modal>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="משימה חדשה" size="sm">
        <TaskForm onSubmit={handleAddTask} onCancel={() => setTaskOpen(false)} priorityOptions={PRIORITY_OPTIONS} />
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
            if (res.ok) router.push('/projects')
          } finally { setDeleting(false) }
        }}
        title="מחיקת פרויקט"
        message={`האם למחוק את "${project.name}"? כל אבני הדרך, התשלומים והמשימות הקשורות יימחקו.`}
        confirmLabel="מחק פרויקט"
        loading={deleting}
      />
    </div>
  )
}

function FinStat({ icon: Icon, label, value, color = 'text-white' }: {
  icon: typeof DollarSign; label: string; value: string; color?: string
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-gray-500" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </Card>
  )
}

function PaymentForm({
  onSubmit,
  onCancel,
  methodOptions,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  methodOptions: { value: string; label: string }[]
}) {
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), method: '', reference: '', notes: '' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount) return
    setLoading(true)
    try { await onSubmit(form) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="סכום (₪) *" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
      <Input label="תאריך *" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
      <Select label="אמצעי תשלום" options={methodOptions} value={form.method} onChange={(e) => set('method', e.target.value)} />
      <Input label="אסמכתא / מספר צ'ק" placeholder="אופציונלי" value={form.reference} onChange={(e) => set('reference', e.target.value)} />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.amount} className="flex-1">שמור תשלום</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}

function TaskForm({
  onSubmit,
  onCancel,
  priorityOptions,
}: {
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  priorityOptions: { value: string; label: string }[]
}) {
  const [form, setForm] = useState({ title: '', assignedTo: '', dueDate: '', priority: 'MEDIUM' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      await onSubmit({ ...form, dueDate: form.dueDate ? new Date(form.dueDate) : undefined, status: 'PENDING' })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input label="כותרת *" placeholder="תיאור המשימה" value={form.title} onChange={(e) => set('title', e.target.value)} />
      <Input label="שיוך ל" placeholder="שם הנציג" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} />
      <Input label="תאריך יעד" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
      <Select label="עדיפות" options={priorityOptions} value={form.priority} onChange={(e) => set('priority', e.target.value)} />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!form.title} className="flex-1">צור משימה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}

// ─── Project Files Tab ────────────────────────────────────────────────────────

function ProjectFilesTab({
  projectId,
  files,
  onFilesChange,
}: {
  projectId: string
  files: ProjectFile[]
  onFilesChange: (files: ProjectFile[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'other')
      const res = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: fd })
      if (res.ok) {
        const json = await res.json()
        onFilesChange([json.data, ...files])
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId)
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })
      if (res.ok) onFilesChange(files.filter((f) => f.id !== fileId))
    } finally { setDeletingId(null) }
  }

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)

  return (
    <div>
      <div className="flex justify-end mb-3">
        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploading ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
          <Upload size={14} />
          {uploading ? 'מעלה...' : 'העלה קובץ'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {files.length === 0 ? (
        <EmptyState icon={FileIcon} title="אין מסמכים" action={
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white cursor-pointer">
            <Upload size={14} />העלה קובץ ראשון
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        } />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((f) => (
            <div key={f.id} className="group flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5">
              <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {isImage(f.name) ? <img src={f.url} alt="" className="w-full h-full object-cover" /> : <FileIcon size={16} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{f.name}</p>
                <p className="text-xs text-gray-500">{new Date(f.createdAt).toLocaleDateString('he-IL')}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={f.url} download={f.name} className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
                  <Download size={14} />
                </a>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deletingId === f.id}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
