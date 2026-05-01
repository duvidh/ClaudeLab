'use client'

import { useState } from 'react'
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
  { id: 'documents', label: 'מסמכים' },
]

export function LeadDetail({ lead: initialLead }: LeadDetailProps) {
  const [lead, setLead] = useState(initialLead)
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem(`tab-lead-${initialLead.id}`) ?? 'details' } catch { return 'details' }
  })

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
      author: task.assignedTo,
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
