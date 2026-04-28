'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import { LEAD_SOURCE_LABELS, CLIENT_TYPE_LABELS, URGENCY_LABELS } from '@/types'
import type { LeadWithRelations } from '@/types'

interface LeadDetailProps {
  lead: LeadWithRelations
}

const TABS = [
  { id: 'details', label: 'פרטים' },
  { id: 'notes', label: 'הערות' },
  { id: 'meetings', label: 'פגישות/שיחות' },
]

export function LeadDetail({ lead: initialLead }: LeadDetailProps) {
  const [lead, setLead] = useState(initialLead)
  const [activeTab, setActiveTab] = useState('details')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count:
      t.id === 'notes'
        ? lead.notes.length
        : t.id === 'meetings'
        ? lead.meetings.length
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
            {isConverted && (
              <span className="flex items-center gap-1 text-xs text-teal-400">
                <CheckCircle2 size={14} />
                הומר ללקוח
              </span>
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
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            עריכה
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 size={14} /></Button>
        </div>
      </div>

      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'details' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Contact info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">פרטי התקשרות</h3>
            <div className="space-y-2.5">
              <InfoRow icon={Phone} label="טלפון ראשי" value={lead.primaryPhone} />
              {lead.secondaryPhone && (
                <InfoRow icon={Phone} label="טלפון משני" value={lead.secondaryPhone} />
              )}
              {lead.email && <InfoRow icon={Mail} label="אימייל" value={lead.email} />}
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

      {activeTab === 'notes' && (
        <NotesList notes={lead.notes} onAddNote={handleAddNote} />
      )}

      {activeTab === 'meetings' && (
        <MeetingsTab leadId={lead.id} initialMeetings={lead.meetings} />
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
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-200">{value}</p>
      </div>
    </div>
  )
}

const MEETING_TYPE_OPTIONS = [
  { value: 'שיחה', label: 'שיחת טלפון' },
  { value: 'פגישה', label: 'פגישה' },
  { value: 'זום', label: 'זום / וידאו' },
  { value: 'ביקור', label: 'ביקור באתר' },
]

function MeetingsTab({ leadId, initialMeetings }: { leadId: string; initialMeetings: import('@/types').Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ type: 'פגישה', date: '', summary: '' })
  const [loading, setLoading] = useState(false)

  function setF(k: keyof typeof form, v: string) { setForm((p) => ({ ...p, [k]: v })) }

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

  return (
    <div>
      <div className="flex justify-end mb-3">
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
    </div>
  )
}
