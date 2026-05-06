'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Phone, Mail, MapPin, Building2, CreditCard,
  FolderKanban, Plus, FileText, User, Calendar, Trash2,
  Paperclip, Upload, Download, File as FileIcon, Receipt, CheckCircle2, Clock,
} from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ClientForm } from '@/components/clients/ClientForm'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { FinancialSummary } from '@/components/clients/FinancialSummary'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatCurrency } from '@/lib/utils'
import { detailTabKey, useUiStore } from '@/lib/store/uiStore'
import type { ClientFinancials } from '@/lib/calculations'
import type { Client, Project, Quote, Invoice, Task, Payment, Milestone, Meeting, ClientFile } from '@/types'

type ProjectWithPayments = Project & { payments: Payment[]; milestones: Milestone[] }
type QuoteWithProject = Quote & { project: Project | null }

type ClientWithRelations = Client & {
  projects: ProjectWithPayments[]
  quotes: QuoteWithProject[]
  invoices: Invoice[]
  tasks: Task[]
  meetings: Meeting[]
  files: ClientFile[]
  financials: ClientFinancials
}

const TABS = [
  { id: 'overview', label: 'סקירה' },
  { id: 'projects', label: 'פרויקטים' },
  { id: 'quotes', label: 'הצעות מחיר' },
  { id: 'payments', label: 'תשלומים' },
  { id: 'tasks', label: 'משימות' },
  { id: 'meetings', label: 'פגישות' },
  { id: 'invoices', label: 'חשבוניות' },
  { id: 'documents', label: 'מסמכים' },
]

interface ClientDetailProps {
  client: ClientWithRelations
}

export function ClientDetail({ client: initialClient }: ClientDetailProps) {
  const [client, setClient] = useState(initialClient)
  const [files, setFiles] = useState<ClientFile[]>(initialClient.files)
  const clientTabKey = detailTabKey('client', client.id)
  const activeTab = useUiStore((s) => s.detailTabsByKey[clientTabKey] ?? 'overview')
  const setDetailTab = useUiStore((s) => s.setDetailTab)

  function handleTabChange(tab: string) {
    setDetailTab(clientTabKey, tab)
  }
  const [editOpen, setEditOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newQuoteOpen, setNewQuoteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count:
      t.id === 'projects' ? client.projects.length
      : t.id === 'quotes' ? client.quotes.length
      : t.id === 'tasks' ? client.tasks.length
      : t.id === 'meetings' ? client.meetings.length
      : t.id === 'invoices' ? client.invoices.length
      : t.id === 'documents' ? client.files.length
      : undefined,
  }))

  const phones: string[] = (() => {
    try { return JSON.parse(client.phones) } catch { return [] }
  })()

  async function handleUpdate(data: Record<string, unknown>) {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setClient((prev) => ({ ...prev, ...json.data }))
      setEditOpen(false)
      router.refresh()
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/clients')
    } finally { setDeleting(false) }
  }

  async function handleNewProject(data: Record<string, unknown>) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, clientId: client.id }),
    })
    if (res.ok) {
      setNewProjectOpen(false)
      const json = await res.json()
      router.push(`/projects/${json.data.id}`)
    }
  }

  async function handleNewQuote(data: Record<string, unknown>) {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, clientId: client.id }),
    })
    if (res.ok) {
      setNewQuoteOpen(false)
      const json = await res.json()
      router.push(`/quotes/${json.data.id}`)
    }
  }

  async function handlePaymentAdded() {
    // Re-fetch to get updated financials
    const res = await fetch(`/api/clients/${client.id}`)
    if (res.ok) {
      const json = await res.json()
      setClient(json.data)
    }
    setPaymentOpen(false)
  }

  const allPayments = client.projects.flatMap((p) =>
    p.payments.map((pay) => ({ ...pay, projectName: p.name }))
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base font-bold text-white">
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
              {client.company && (
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Building2 size={13} />
                  {client.company}
                </p>
              )}
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              client.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {client.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1 mr-13">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              לקוח מ-{formatDate(client.joinDate)}
            </span>
            <span className="text-xs text-gray-600">
              {client.category === 'BUSINESS' ? 'עסקי' : 'פרטי'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="success" size="sm" onClick={() => setPaymentOpen(true)}>
            <Plus size={14} />
            תשלום חדש
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>עריכה</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Financial summary */}
      <div className="mb-6">
        <FinancialSummary financials={client.financials} />
      </div>

      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={handleTabChange} />

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">פרטי התקשרות</h3>
            <div className="space-y-2.5">
              {phones.map((p, i) => (
                <InfoRow key={i} icon={Phone} label={`טלפון ${i + 1}`} value={p} linkType="phone" />
              ))}
              {client.email && <InfoRow icon={Mail} label="אימייל" value={client.email} linkType="email" />}
              {client.address && <InfoRow icon={MapPin} label="כתובת הנכס" value={client.address} />}
              {client.city && <InfoRow icon={MapPin} label="עיר" value={client.city} />}
              {client.mailingAddress && (
                <InfoRow icon={MapPin} label="כתובת למשלוח" value={client.mailingAddress} />
              )}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">פרטים נוספים</h3>
            <div className="space-y-2.5">
              {client.idNumber && <InfoRow icon={User} label="ת.ז / ח.פ" value={client.idNumber} />}
              {client.paymentMethod && (
                <InfoRow icon={CreditCard} label="שיטת תשלום" value={client.paymentMethod} />
              )}
            </div>
            {client.notes && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-1">הערות</p>
                <p className="text-sm text-gray-300 leading-relaxed">{client.notes}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Projects tab */}
      {activeTab === 'projects' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setNewProjectOpen(true)}>
              <Plus size={14} />
              פרויקט חדש
            </Button>
          </div>
          {client.projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="אין פרויקטים" description="פרויקטים ישויכו ללקוח זה בעת יצירתם" action={<Button size="sm" onClick={() => setNewProjectOpen(true)}><Plus size={14} />פרויקט חדש</Button>} />
          ) : (
            <div className="space-y-3">
              {client.projects.map((project) => {
                const paid = project.payments.reduce((s, p) => s + p.amount, 0)
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover:border-gray-600 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white mb-1">{project.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {project.address && (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} />
                                {project.address}
                              </span>
                            )}
                            {project.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {formatDate(project.startDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-left flex flex-col items-end gap-1.5">
                          <StatusBadge type="project" value={project.status} />
                          <span className="text-xs text-gray-400">
                            {formatCurrency(paid)} / {formatCurrency(project.contractValue)}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>התקדמות</span>
                          <span>{project.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${project.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quotes tab */}
      {activeTab === 'quotes' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setNewQuoteOpen(true)}>
              <Plus size={14} />
              הצעת מחיר חדשה
            </Button>
          </div>
          {client.quotes.length === 0 ? (
            <EmptyState icon={FileText} title="אין הצעות מחיר" action={<Button size="sm" onClick={() => setNewQuoteOpen(true)}><Plus size={14} />הצעת מחיר חדשה</Button>} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/60 border-b border-gray-700">
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">מספר הצעה</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">פרויקט</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">תאריך</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">סטטוס</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">גרסה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {client.quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-medium text-blue-400">
                        <Link href={`/quotes/${quote.id}`} className="hover:underline">
                          {quote.quoteNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{quote.project?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(quote.date)}</td>
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
      )}

      {/* Payments tab */}
      {activeTab === 'payments' && (
        <div>
          {allPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="אין תשלומים"
              action={
                <Button size="sm" onClick={() => setPaymentOpen(true)}>
                  <Plus size={14} />
                  תשלום חדש
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/60 border-b border-gray-700">
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">תאריך</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">פרויקט</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">סכום</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">אמצעי תשלום</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">אסמכתא</th>
                    <th className="px-4 py-3 font-semibold text-gray-400 text-right">הערות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {allPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 text-gray-300">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 text-gray-300">{payment.projectName}</td>
                      <td className="px-4 py-3 font-medium text-green-300">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-gray-400">{payment.method || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{payment.reference || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{payment.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div>
          {client.tasks.length === 0 ? (
            <EmptyState icon={FileText} title="אין משימות" />
          ) : (
            <div className="space-y-2">
              {client.tasks.map((task) => (
                <Card key={task.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="priority" value={task.priority} />
                      <StatusBadge type="task" value={task.status} />
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">{formatDate(task.dueDate)}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meetings tab */}
      {activeTab === 'meetings' && (
        <ClientMeetingsTab clientId={client.id} initialMeetings={client.meetings} />
      )}

      {/* Invoices tab */}
      {activeTab === 'invoices' && (
        <ClientInvoicesTab clientId={client.id} initialInvoices={client.invoices} />
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <ClientFilesTab
          clientId={client.id}
          files={files}
          onAdd={(f) => setFiles((prev) => [f, ...prev])}
          onDelete={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
        />
      )}

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="עריכת לקוח" size="lg">
        <ClientForm initialData={client} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
      </Modal>

      {/* New Project modal */}
      <Modal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} title="פרויקט חדש" size="lg">
        <ProjectForm
          preselectedClientId={client.id}
          initialData={{ address: [client.address, client.city].filter(Boolean).join(', ') || undefined }}
          onSubmit={handleNewProject}
          onCancel={() => setNewProjectOpen(false)}
        />
      </Modal>

      {/* New Quote modal */}
      <Modal open={newQuoteOpen} onClose={() => setNewQuoteOpen(false)} title="הצעת מחיר חדשה" size="sm">
        <NewQuoteFromClientForm clientId={client.id} projects={client.projects} onSubmit={handleNewQuote} onCancel={() => setNewQuoteOpen(false)} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="מחיקת לקוח" message={`האם למחוק את "${client.name}"? כל הפרויקטים, הצעות המחיר והמשימות יימחקו לצמיתות.`}
        confirmLabel="מחק לקוח" loading={deleting} />

      {/* Payment modal */}
      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="רישום תשלום" size="sm">
        <PaymentForm
          clientId={client.id}
          projects={client.projects}
          onSuccess={handlePaymentAdded}
          onCancel={() => setPaymentOpen(false)}
        />
      </Modal>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, linkType }: { icon: typeof Phone; label: string; value: string; linkType?: 'phone' | 'email' }) {
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

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'בחר אמצעי תשלום' },
  { value: 'מזומן', label: 'מזומן' },
  { value: 'העברה בנקאית', label: 'העברה בנקאית' },
  { value: "צ'ק", label: "צ'ק" },
  { value: 'כרטיס אשראי', label: 'כרטיס אשראי' },
]

function PaymentForm({
  clientId,
  projects,
  onSuccess,
  onCancel,
}: {
  clientId: string
  projects: Project[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? '',
    amount: '',
    method: '',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Select
        label="פרויקט *"
        options={projectOptions}
        value={form.projectId}
        onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
        placeholder={projects.length === 0 ? 'אין פרויקטים' : undefined}
      />
      <Input
        label="סכום (₪) *"
        type="number"
        placeholder="10000"
        value={form.amount}
        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
      />
      <Input
        label="תאריך"
        type="date"
        value={form.date}
        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
      />
      <Select
        label="אמצעי תשלום"
        options={PAYMENT_METHOD_OPTIONS}
        value={form.method}
        onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
      />
      <Input
        label="אסמכתא / מס׳ שיק"
        placeholder="1234"
        value={form.reference}
        onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
      />
      <Input
        label="הערות"
        placeholder="הערות לתשלום..."
        value={form.notes}
        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
      />
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} disabled={!form.amount || !form.projectId} className="flex-1">
          רשום תשלום
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
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

function ClientMeetingsTab({ clientId, initialMeetings }: { clientId: string; initialMeetings: Meeting[] }) {
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
        body: JSON.stringify({ ...form, clientId }),
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
          clientId,
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
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{meeting.type}</p>
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
          <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block">
            סיכום / הערות
            <textarea
              value={form.summary}
              onChange={(e) => setF('summary', e.target.value)}
              rows={3}
              className="mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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

const FILE_TYPE_OPTIONS = [
  { value: 'contract', label: 'חוזה' },
  { value: 'permit', label: 'היתר בניה' },
  { value: 'plan', label: 'תכנית' },
  { value: 'photo', label: 'תמונה' },
  { value: 'other', label: 'אחר' },
]
const FILE_TYPE_LABELS: Record<string, string> = {
  contract: 'חוזה', permit: 'היתר', plan: 'תכנית', photo: 'תמונה', other: 'אחר',
}
const FILE_TYPE_COLORS: Record<string, string> = {
  contract: 'bg-blue-500/20 text-blue-300',
  permit: 'bg-yellow-500/20 text-yellow-300',
  plan: 'bg-purple-500/20 text-purple-300',
  photo: 'bg-green-500/20 text-green-300',
  other: 'bg-gray-500/20 text-gray-400',
}

function ClientFilesTab({
  clientId,
  files,
  onAdd,
  onDelete,
}: {
  clientId: string
  files: ClientFile[]
  onAdd: (f: ClientFile) => void
  onDelete: (id: string) => void
}) {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [fileType, setFileType] = useState('other')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('type', fileType)
      const res = await fetch(`/api/clients/${clientId}/files`, { method: 'POST', body: fd })
      if (res.ok) {
        const json = await res.json()
        onAdd(json.data)
        setUploadOpen(false)
        setSelectedFile(null)
        setFileType('other')
      }
    } finally { setUploading(false) }
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId)
    try {
      const res = await fetch(`/api/clients/${clientId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })
      if (res.ok) onDelete(fileId)
    } finally { setDeletingId(null) }
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload size={14} />
          העלה מסמך
        </Button>
      </div>

      {files.length === 0 ? (
        <EmptyState icon={Paperclip} title="אין מסמכים" description="העלה חוזים, היתרים, תכניות ותמונות הקשורים ללקוח" action={<Button size="sm" onClick={() => setUploadOpen(true)}><Upload size={14} />העלה מסמך</Button>} />
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileIcon size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(file.createdAt)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${FILE_TYPE_COLORS[file.fileType ?? ''] ?? FILE_TYPE_COLORS.other}`}>
                    {FILE_TYPE_LABELS[file.fileType ?? ''] ?? file.fileType ?? 'אחר'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={file.url}
                    download={file.name}
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                    title="הורד"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="מחק"
                  >
                    <Trash2 size={13} />
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
            <label className="text-sm text-gray-300 font-medium block mb-1">קובץ *</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
            />
          </div>
          <Select
            label="סוג מסמך"
            options={FILE_TYPE_OPTIONS}
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={uploading} disabled={!selectedFile} className="flex-1">העלה</Button>
            <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function NewQuoteFromClientForm({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clientId: _clientId,
  projects,
  onSubmit,
  onCancel,
}: {
  clientId: string
  projects: { id: string; name: string }[]
  onSubmit: (d: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? '',
    paymentTerms: '',
    validUntil: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        projectId: form.projectId || undefined,
        paymentTerms: form.paymentTerms || undefined,
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
      })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {projects.length > 0 && (
        <Select
          label="שייך לפרויקט"
          options={[{ value: '', label: 'ללא פרויקט' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
          value={form.projectId}
          onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
        />
      )}
      <Input label="תוקף הצעה" type="date" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} />
      <Input label="תנאי תשלום" placeholder="30% מקדמה, 70% סיום" value={form.paymentTerms} onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))} />
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} className="flex-1">צור הצעה ועבור לעריכה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}

function ClientInvoicesTab({
  clientId,
  initialInvoices,
}: {
  clientId: string
  initialInvoices: Invoice[]
}) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), dueDate: '' })

  async function markPaid(inv: Invoice) {
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaid: !inv.isPaid }),
    })
    if (res.ok) {
      const json = await res.json()
      setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, isPaid: json.data.isPaid } : i))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount) return
    setCreating(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          amount: form.amount,
          date: form.date || undefined,
          dueDate: form.dueDate || undefined,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setInvoices((prev) => [json.data, ...prev])
        setCreateOpen(false)
        setForm({ amount: '', date: new Date().toISOString().slice(0, 10), dueDate: '' })
      }
    } finally { setCreating(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">חשבוניות לתשלום עבור לקוח זה</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={13} />
          חשבונית חדשה
        </Button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="אין חשבוניות" action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={13} />חשבונית חדשה</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700 text-gray-400 text-xs">
                <th className="px-4 py-3 font-semibold text-right">מספר</th>
                <th className="px-4 py-3 font-semibold text-right">סכום</th>
                <th className="px-4 py-3 font-semibold text-right">תאריך</th>
                <th className="px-4 py-3 font-semibold text-right">פירעון</th>
                <th className="px-4 py-3 font-semibold text-right">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {invoices.map((inv) => {
                const isOverdue = !inv.isPaid && inv.dueDate && new Date(inv.dueDate) < new Date()
                return (
                  <tr key={inv.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{inv.number}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-2.5 text-gray-400">{formatDate(inv.date)}</td>
                    <td className="px-4 py-2.5">
                      {inv.dueDate ? (
                        <span className={isOverdue ? 'text-red-400' : 'text-gray-400'}>{formatDate(inv.dueDate)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => markPaid(inv)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                          inv.isPaid
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                        }`}
                      >
                        {inv.isPaid ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {inv.isPaid ? 'שולמה' : 'ממתינה'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="חשבונית חדשה" size="sm">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="סכום *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="תאריך" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            <Input label="תאריך פירעון" type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={creating} disabled={!form.amount} className="flex-1">צור חשבונית</Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
