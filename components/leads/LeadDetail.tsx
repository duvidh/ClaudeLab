'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Briefcase,
  Ruler,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  FolderPlus,
  Upload,
  Download,
  File as FileIcon,
  MessageSquare,
  Users,
  ClipboardList,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { NotesList } from '@/components/leads/NotesList'
import { LeadForm } from '@/components/leads/LeadForm'
import { ConvertLeadButton } from '@/components/leads/ConvertLeadButton'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { LEAD_SOURCE_LABELS, CLIENT_TYPE_LABELS, URGENCY_LABELS } from '@/types'
import type { LeadWithRelations, LeadFile } from '@/types'

interface LeadDetailProps {
  lead: LeadWithRelations
}

const TABS = [
  { id: 'details', label: 'פרטים' },
  { id: 'activity', label: 'פעילות' },
  { id: 'notes', label: 'הערות' },
  { id: 'meetings', label: 'פגישות/שיחות' },
  { id: 'tasks', label: 'משימות' },
  { id: 'quotes', label: 'הצעות מחיר' },
  { id: 'documents', label: 'מסמכים' },
]

type EmployeeOption = { id: string; name: string; position: string | null }

export function LeadDetail({ lead: initialLead }: LeadDetailProps) {
  const [lead, setLead] = useState(initialLead)
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem(`tab-lead-${initialLead.id}`) ?? 'details' } catch { return 'details' }
  })
  const [quotesCount, setQuotesCount] = useState<number | undefined>(undefined)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])

  useEffect(() => {
    fetch('/api/employees?status=ACTIVE')
      .then((r) => r.json())
      .then((j) => setEmployees(j.data ?? []))
  }, [])

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    try { localStorage.setItem(`tab-lead-${lead.id}`, tab) } catch {}
  }
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const router = useRouter()

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count:
      t.id === 'notes'
        ? lead.notes.length
        : t.id === 'meetings'
        ? lead.meetings.length
        : t.id === 'tasks'
        ? lead.tasks.length
        : t.id === 'quotes'
        ? quotesCount
        : t.id === 'documents'
        ? (lead.files?.length ?? 0)
        : undefined,
  }))

  async function handleUpdate(data: Record<string, unknown>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setLead((prev: LeadWithRelations) => ({ ...prev, ...json.data }))
      setEditOpen(false)
      router.refresh()
    }
  }

  async function handleAssigneeChange(assignedToId: string) {
    const value = assignedToId || null
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId: value }),
    })
    if (res.ok) {
      const selected = employees.find((e) => e.id === assignedToId) ?? null
      setLead((prev: LeadWithRelations) => ({ ...prev, assignedToId: value, assignedTo: selected }))
    }
  }

  async function handleCreateProject(data: Record<string, unknown>) {
    if (!lead.client) return
    setCreatingProject(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, clientId: lead.client.id }),
      })
      if (res.ok) {
        const json = await res.json()
        router.push(`/projects/${json.data.id}`)
      }
    } finally {
      setCreatingProject(false)
      setCreateProjectOpen(false)
    }
  }

  async function handleAddNote(content: string) {
    const res = await fetch(`/api/leads/${lead.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author: 'נציג' }),
    })
    if (res.ok) {
      const json = await res.json()
      setLead((prev: LeadWithRelations) => ({ ...prev, notes: [json.data, ...prev.notes] }))
    }
  }

  const isConverted = lead.status === 'CONVERTED'

  return (
    <div>
      {/* Top section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">{lead.fullName}</h1>
            <StatusBadge type="lead" value={lead.status} />
            {isConverted && lead.client && (
              <Link
                href={`/clients/${lead.client.id}`}
                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full transition-colors"
              >
                <CheckCircle2 size={13} />
                לכרטיס הלקוח
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              נכנס {formatDate(lead.entryDate)}
            </span>
            {lead.assignedRep && (
              <span className="flex items-center gap-1">
                <User size={13} />
                {lead.assignedRep}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ConvertLeadButton
            leadId={lead.id}
            leadName={lead.fullName}
            disabled={isConverted}
          />
          {isConverted && lead.client && (
            <Button size="sm" onClick={() => setCreateProjectOpen(true)} loading={creatingProject}>
              <FolderPlus size={14} />
              צור פרויקט
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            עריכה
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 size={14} /></Button>
        </div>
      </div>

      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={handleTabChange} />

      {activeTab === 'details' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Contact info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">פרטי התקשרות</h3>
            <div className="space-y-2.5">
              <InfoRow icon={Phone} label="טלפון ראשי" value={lead.primaryPhone} linkType="phone" />
              {lead.secondaryPhone && (
                <InfoRow icon={Phone} label="טלפון משני" value={lead.secondaryPhone} linkType="phone" />
              )}
              {lead.email && <InfoRow icon={Mail} label="אימייל" value={lead.email} linkType="email" />}
              {lead.propertyAddress && (
                <InfoRow icon={MapPin} label="כתובת נכס" value={lead.propertyAddress} />
              )}
              {lead.city && <InfoRow icon={MapPin} label="עיר/אזור" value={lead.city} />}
            </div>
          </Card>

          {/* Lead info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">פרטי הליד</h3>
            <div className="space-y-2.5">
              <InfoRow icon={User} label="סוג לקוח" value={CLIENT_TYPE_LABELS[lead.clientType] ?? lead.clientType} />
              <InfoRow icon={Briefcase} label="מקור" value={LEAD_SOURCE_LABELS[lead.leadSource] ?? lead.leadSource} />
              <InfoRow icon={AlertTriangle} label="דחיפות" value={URGENCY_LABELS[lead.urgency] ?? lead.urgency} />
              {lead.nextMeetingDate && (
                <InfoRow icon={Calendar} label="פגישה הבאה" value={formatDate(lead.nextMeetingDate)} />
              )}
              {/* Assignee */}
              <div className="flex items-start gap-2">
                <Users size={14} className="text-gray-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">נציג אחראי</p>
                  <select
                    value={lead.assignedToId ?? ''}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— לא שויך —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}{emp.position ? ` · ${emp.position}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Project details */}
          <Card className="col-span-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">פרטי פרויקט מבוקש</h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2.5">
              {lead.workType && <InfoRow icon={Briefcase} label='סוג עבודה' value={lead.workType} />}
              {lead.estimatedSize != null && (
                <InfoRow icon={Ruler} label='גודל משוער' value={`${lead.estimatedSize} מ"ר`} />
              )}
              {lead.budget != null && (
                <InfoRow icon={DollarSign} label="תקציב" value={formatCurrency(lead.budget)} />
              )}
              <InfoRow
                icon={CheckCircle2}
                label="היתר בניה"
                value={lead.buildingPermit ? 'יש היתר' : 'אין היתר'}
              />
            </div>
            {lead.needDescription && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-1">תיאור צורך</p>
                <p className="text-sm text-gray-300 leading-relaxed">{lead.needDescription}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <LeadActivityFeed lead={lead} />
      )}

      {activeTab === 'notes' && (
        <NotesList notes={lead.notes} onAddNote={handleAddNote} />
      )}

      {activeTab === 'meetings' && (
        <MeetingsTab leadId={lead.id} initialMeetings={lead.meetings} />
      )}

      {activeTab === 'tasks' && (
        <LeadTasksTab lead={lead} employees={employees} />
      )}

      {activeTab === 'quotes' && (
        <LeadQuotesTab leadId={lead.id} onLoad={setQuotesCount} />
      )}

      {activeTab === 'documents' && (
        <LeadFilesTab leadId={lead.id} initialFiles={lead.files ?? []} />
      )}

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="עריכת ליד" size="lg">
        <LeadForm
          initialData={lead}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
            if (res.ok) router.push('/leads')
          } finally { setDeleting(false) }
        }}
        title="מחיקת ליד"
        message={`האם למחוק את "${lead.fullName}"? כל ההערות, הפגישות והמשימות הקשורות יימחקו.`}
        confirmLabel="מחק ליד"
        loading={deleting}
      />

      <Modal open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} title="פרויקט חדש" size="lg">
        <ProjectForm
          preselectedClientId={lead.client?.id}
          initialData={{ address: lead.propertyAddress ?? undefined }}
          onSubmit={handleCreateProject}
          onCancel={() => setCreateProjectOpen(false)}
        />
      </Modal>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  linkType,
}: {
  icon: typeof Phone
  label: string
  value: string
  linkType?: 'phone' | 'email'
}) {
  const href = linkType === 'phone' ? `tel:${value}` : linkType === 'email' ? `mailto:${value}` : undefined
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">{value}</a>
        ) : (
          <p className="text-sm text-gray-200">{value}</p>
        )}
      </div>
    </div>
  )
}

// ─── Tasks tab ───────────────────────────────────────────────────────────────

type LeadTask = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  taskType: string
  dueDate: string | null
  assignedTo: string | null
  employee?: { id: string; name: string } | null
}

const TASK_STATUS_CYCLE: Record<string, string> = { PENDING: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'PENDING' }
const TASK_STATUS_LABEL: Record<string, string> = { PENDING: 'ממתין', IN_PROGRESS: 'בביצוע', DONE: 'הושלם' }
const TASK_PRIORITY_LABEL: Record<string, string> = { HIGH: 'גבוהה', MEDIUM: 'בינונית', LOW: 'נמוכה' }
const TASK_TYPE_OPTS = [
  { value: 'TASK', label: 'משימה' }, { value: 'CALL', label: 'שיחה' },
  { value: 'MEETING', label: 'פגישה' }, { value: 'EMAIL', label: 'אימייל' },
  { value: 'FOLLOWUP', label: 'מעקב' }, { value: 'OTHER', label: 'אחר' },
]
const TASK_PRIORITY_OPTS = [
  { value: 'HIGH', label: 'גבוהה' }, { value: 'MEDIUM', label: 'בינונית' }, { value: 'LOW', label: 'נמוכה' },
]

function LeadTasksTab({ lead, employees }: { lead: LeadWithRelations; employees: EmployeeOption[] }) {
  const [tasks, setTasks] = useState<LeadTask[]>((lead.tasks ?? []) as LeadTask[])
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ title: '', taskType: 'TASK', priority: 'MEDIUM', dueDate: '', employeeId: '' })
  const [submitting, setSubmitting] = useState(false)

  function setF(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const selectedEmp = employees.find((emp) => emp.id === form.employeeId)
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          taskType: form.taskType,
          priority: form.priority,
          dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
          employeeId: form.employeeId || undefined,
          assignedTo: selectedEmp?.name || undefined,
          leadId: lead.id,
          status: 'PENDING',
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setTasks((prev) => [json.data, ...prev])
        setForm({ title: '', taskType: 'TASK', priority: 'MEDIUM', dueDate: '', employeeId: '' })
        setAddOpen(false)
      }
    } finally { setSubmitting(false) }
  }

  async function cycleStatus(task: LeadTask) {
    const nextStatus = TASK_STATUS_CYCLE[task.status] ?? 'PENDING'
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (res.ok) setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t))
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const pending = tasks.filter((t) => t.status !== 'DONE').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{tasks.length} משימות · {pending} פתוחות</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          משימה חדשה
        </Button>
      </div>

      {addOpen && (
        <Card className="mb-4 border border-blue-500/30">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input
              label="כותרת *"
              placeholder="תיאור המשימה..."
              value={form.title}
              onChange={(e) => setF('title', e.target.value)}
              autoFocus
            />
            <div className="grid grid-cols-3 gap-3">
              <Select label="סוג" options={TASK_TYPE_OPTS} value={form.taskType} onChange={(e) => setF('taskType', e.target.value)} />
              <Select label="עדיפות" options={TASK_PRIORITY_OPTS} value={form.priority} onChange={(e) => setF('priority', e.target.value)} />
              <Input label="תאריך יעד" type="date" value={form.dueDate} onChange={(e) => setF('dueDate', e.target.value)} />
            </div>
            {employees.length > 0 && (
              <Select
                label="שיוך לעובד"
                options={[{ value: '', label: 'ללא שיוך' }, ...employees.map((e) => ({ value: e.id, label: `${e.name}${e.position ? ` · ${e.position}` : ''}` }))]}
                value={form.employeeId}
                onChange={(e) => setF('employeeId', e.target.value)}
              />
            )}
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={submitting} disabled={!form.title.trim()} size="sm" className="flex-1">הוסף משימה</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setAddOpen(false)}>ביטול</Button>
            </div>
          </form>
        </Card>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-10">
          <ClipboardList size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 text-sm mb-3">אין משימות לליד זה</p>
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            הוסף משימה ראשונה
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date()
            return (
              <Card key={task.id} className="flex items-start gap-3 group">
                <button
                  onClick={() => cycleStatus(task)}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.status === 'DONE' ? 'border-green-400 bg-green-400/20 text-green-400' :
                    task.status === 'IN_PROGRESS' ? 'border-blue-400 bg-blue-400/10 text-blue-400' :
                    'border-gray-600 hover:border-gray-400'
                  }`}
                  title={`עבור ל${TASK_STATUS_LABEL[TASK_STATUS_CYCLE[task.status] ?? 'PENDING']}`}
                >
                  {task.status === 'DONE' && <CheckCircle2 size={11} />}
                  {task.status === 'IN_PROGRESS' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-white'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      task.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{TASK_PRIORITY_LABEL[task.priority] ?? task.priority}</span>
                    <span className="bg-gray-700 px-1.5 py-0.5 rounded">{TASK_STATUS_LABEL[task.status] ?? task.status}</span>
                    {(task.employee?.name ?? task.assignedTo) && <span>→ {task.employee?.name ?? task.assignedTo}</span>}
                    {task.dueDate && (
                      <span className={isOverdue ? 'text-red-400' : ''}>
                        {formatDate(task.dueDate)}
                        {isOverdue && ' (באיחור)'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LeadQuotesTab({ leadId, onLoad }: { leadId: string; onLoad: (count: number) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/quotes?leadId=${leadId}`)
      .then((r) => r.json())
      .then((j) => {
        const data = j.data ?? []
        setQuotes(data)
        onLoad(data.length)
        setLoading(false)
      })
  }, [leadId, onLoad])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Link href={`/quotes/new?leadId=${leadId}`}>
          <Button size="sm" className="gap-1.5">
            <Plus size={14} />
            הצעת מחיר חדשה
          </Button>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-sm mb-3">אין הצעות מחיר עדיין</p>
          <Link href={`/quotes/new?leadId=${leadId}`}>
            <Button size="sm" variant="secondary">
              <Plus size={14} />
              צור הצעה ראשונה
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700">
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">מספר הצעה</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">תאריך</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">תוקף עד</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">סטטוס</th>
                <th className="px-4 py-3 font-semibold text-gray-400 text-right">גרסה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-medium text-blue-400">
                    <Link href={`/quotes/${quote.id}`} className="hover:underline">
                      {quote.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(quote.date)}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {quote.validUntil ? formatDate(quote.validUntil) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge type="quote" value={quote.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">v{quote.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LeadFilesTab({ leadId, initialFiles }: { leadId: string; initialFiles: LeadFile[] }) {
  const [files, setFiles] = useState<LeadFile[]>(initialFiles)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch(`/api/leads/${leadId}/files`, { method: 'POST', body: formData })
      if (res.ok) {
        const json = await res.json()
        setFiles((prev) => [json.data, ...prev])
        setUploadOpen(false)
        setSelectedFile(null)
      }
    } finally { setUploading(false) }
  }

  async function handleDelete(fileId: string) {
    const res = await fetch(`/api/leads/${leadId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    })
    if (res.ok) setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload size={14} />
          העלאת קובץ
        </Button>
      </div>
      {files.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">אין מסמכים מצורפים</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileIcon size={16} className="text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(file.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={file.url}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                    title="הורד"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="מחק"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="העלאת מסמך" size="sm">
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="text-sm text-gray-300 font-medium block mb-1">בחר קובץ</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-400 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={uploading} disabled={!selectedFile} className="flex-1">העלה</Button>
            <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const MEETING_TYPE_OPTIONS = [
  { value: 'שיחה', label: 'שיחת טלפון' },
  { value: 'פגישה', label: 'פגישה' },
  { value: 'זום', label: 'זום / וידאו' },
  { value: 'ביקור', label: 'ביקור באתר' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'נמוכה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'HIGH', label: 'גבוהה' },
]

function MeetingsTab({ leadId, initialMeetings }: { leadId: string; initialMeetings: import('@/types').Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings)
  const [addOpen, setAddOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [form, setForm] = useState({ type: 'פגישה', date: '', summary: '' })
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', priority: 'MEDIUM', assignedTo: '' })
  const [loading, setLoading] = useState(false)
  const [taskLoading, setTaskLoading] = useState(false)

  function setF(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }
  function setTF(k: keyof typeof taskForm, v: string) { setTaskForm((p) => ({ ...p, [k]: v })) }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date) return
    setLoading(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, leadId }),
      })
      if (res.ok) {
        const json = await res.json()
        setMeetings((prev) => [json.data, ...prev])
        setAddOpen(false)
        setForm({ type: 'פגישה', date: '', summary: '' })
      }
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch('/api/meetings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setMeetings((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskForm.title) return
    setTaskLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskForm.title,
          dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
          priority: taskForm.priority,
          assignedTo: taskForm.assignedTo || undefined,
          leadId,
        }),
      })
      if (res.ok) {
        setTaskOpen(false)
        setTaskForm({ title: '', dueDate: '', priority: 'MEDIUM', assignedTo: '' })
      }
    } finally { setTaskLoading(false) }
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3">
        <Button size="sm" variant="secondary" onClick={() => setTaskOpen(true)}>
          <Plus size={14} />
          צור משימה
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          הוסף פגישה/שיחה
        </Button>
      </div>
      {meetings.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">אין פגישות/שיחות רשומות</p>
      ) : (
        <div className="space-y-2">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{meeting.type}</p>
                    {meeting.summary && (
                      <p className="text-sm text-gray-400 mt-1">{meeting.summary}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{formatDate(meeting.date)}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(meeting.id)} className="text-gray-600 hover:text-red-400 p-1 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="הוסף פגישה / שיחה" size="sm">
        <form onSubmit={handleAdd} className="space-y-3">
          <Select label="סוג" options={MEETING_TYPE_OPTIONS} value={form.type} onChange={(e) => setF('type', e.target.value)} />
          <Input label="תאריך ושעה *" type="datetime-local" value={form.date} onChange={(e) => setF('date', e.target.value)} />
          <label className="text-sm text-gray-300 font-medium block">
            סיכום / הערות
            <textarea
              value={form.summary}
              onChange={(e) => setF('summary', e.target.value)}
              rows={3}
              className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={loading} disabled={!form.date} className="flex-1">שמור</Button>
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="משימה חדשה" size="sm">
        <form onSubmit={handleAddTask} className="space-y-3">
          <Input label="כותרת *" placeholder="תאר את המשימה..." value={taskForm.title} onChange={(e) => setTF('title', e.target.value)} />
          <Input label="תאריך יעד" type="datetime-local" value={taskForm.dueDate} onChange={(e) => setTF('dueDate', e.target.value)} />
          <Select label="עדיפות" options={PRIORITY_OPTIONS} value={taskForm.priority} onChange={(e) => setTF('priority', e.target.value)} />
          <Input label="הקצאה" placeholder="שם נציג..." value={taskForm.assignedTo} onChange={(e) => setTF('assignedTo', e.target.value)} />
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={taskLoading} disabled={!taskForm.title} className="flex-1">צור משימה</Button>
            <Button type="button" variant="secondary" onClick={() => setTaskOpen(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

type ActivityEvent = {
  id: string
  type: 'created' | 'note' | 'meeting' | 'task' | 'converted' | 'status'
  title: string
  detail?: string
  date: string | Date
  author?: string
}

const ACTIVITY_ICON: Record<ActivityEvent['type'], React.ElementType> = {
  created: Sparkles,
  note: MessageSquare,
  meeting: Users,
  task: ClipboardList,
  converted: ArrowRightLeft,
  status: CheckCircle2,
}

const ACTIVITY_COLOR: Record<ActivityEvent['type'], string> = {
  created: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  note: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  meeting: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  task: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  converted: 'bg-green-500/20 text-green-400 border-green-500/30',
  status: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

function LeadActivityFeed({ lead }: { lead: LeadWithRelations }) {
  const events: ActivityEvent[] = []

  events.push({
    id: 'created',
    type: 'created',
    title: 'ליד נוצר',
    detail: `${lead.fullName} נוסף למערכת`,
    date: lead.createdAt,
  })

  for (const note of lead.notes ?? []) {
    events.push({
      id: `note-${note.id}`,
      type: 'note',
      title: 'הערה נוספה',
      detail: note.content.length > 80 ? note.content.slice(0, 80) + '…' : note.content,
      date: note.createdAt,
      author: note.author,
    })
  }

  for (const meeting of lead.meetings ?? []) {
    events.push({
      id: `meeting-${meeting.id}`,
      type: 'meeting',
      title: meeting.type === 'שיחה' ? 'שיחה נרשמה' : 'פגישה נרשמה',
      detail: meeting.summary ?? meeting.type,
      date: meeting.date,
    })
  }

  for (const task of lead.tasks ?? []) {
    events.push({
      id: `task-${task.id}`,
      type: 'task',
      title: 'משימה נוצרה',
      detail: task.title,
      date: task.createdAt,
      author: task.assignedTo ?? undefined,
    })
  }

  if (lead.convertedAt) {
    events.push({
      id: 'converted',
      type: 'converted',
      title: 'הומר ללקוח',
      detail: lead.client ? `לקוח: ${lead.client.name}` : undefined,
      date: lead.convertedAt,
    })
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (events.length === 0) {
    return <p className="text-center text-gray-500 text-sm py-8">אין פעילות עדיין</p>
  }

  return (
    <div className="relative">
      <div className="absolute end-[18px] top-0 bottom-0 w-px bg-gray-700" />
      <div className="space-y-1">
        {events.map((ev) => {
          const Icon = ACTIVITY_ICON[ev.type]
          const colorClass = ACTIVITY_COLOR[ev.type]
          return (
            <div key={ev.id} className="flex items-start gap-3 pe-10 py-1.5">
              <div className="flex-1 min-w-0">
                <div className={`rounded-lg border px-3 py-2.5 ${colorClass}`}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold">{ev.title}</span>
                    <span className="text-[10px] opacity-60 shrink-0">
                      {new Date(ev.date).toLocaleString('he-IL', {
                        day: 'numeric', month: 'short', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {ev.detail && <p className="text-[11px] opacity-75 leading-relaxed">{ev.detail}</p>}
                  {ev.author && <p className="text-[10px] opacity-50 mt-0.5">נציג: {ev.author}</p>}
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon size={13} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
