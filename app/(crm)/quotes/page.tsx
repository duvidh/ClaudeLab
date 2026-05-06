'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { QuotesTable } from '@/components/quotes/QuotesTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'DRAFT', label: 'טיוטה' },
  { value: 'SENT', label: 'נשלחה' },
  { value: 'APPROVED', label: 'אושרה' },
  { value: 'REJECTED', label: 'נדחתה' },
  { value: 'EXPIRED', label: 'פג תוקף' },
]

export default function QuotesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const router = useRouter()

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/quotes?${params}`)
      const json = await res.json()
      setQuotes(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setCreateOpen(false)
      router.push(`/quotes/${json.data.id}`)
    }
  }

  return (
    <div>
      <PageHeader
        title='הצעות מחיר'
        subtitle={`${quotes.length} הצעות`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            הצעה חדשה
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-44">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <button onClick={fetchQuotes} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState icon={FileText} title='אין הצעות מחיר עדיין' action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />הצעה חדשה</Button>} />
      ) : (
        <QuotesTable quotes={quotes} onDelete={(id) => setQuotes((prev) => prev.filter((q) => q.id !== id))} />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title='הצעת מחיר חדשה' size="md">
        <NewQuoteForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}

function NewQuoteForm({ onSubmit, onCancel }: { onSubmit: (d: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([])
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(j => setClients((j.data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))))
  }, [])

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/projects?clientId=${clientId}`).then(r => r.json()).then(j => setProjects((j.data ?? []).map((p: { id: string; name: string }) => ({ value: p.id, label: p.name }))))
  }, [clientId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) return
    setLoading(true)
    try {
      await onSubmit({ clientId, projectId: projectId || undefined, validUntil: validUntil ? new Date(validUntil) : undefined, paymentTerms })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Select label="לקוח *" options={clients} value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="בחר לקוח" />
      {projects.length > 0 && (
        <Select label="פרויקט (אופציונלי)" options={projects} value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="בחר פרויקט" />
      )}
      <Input label="תוקף הצעה" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
      <Input label="תנאי תשלום" placeholder="30 ימים נטו" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} disabled={!clientId} className="flex-1">צור הצעה</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}
