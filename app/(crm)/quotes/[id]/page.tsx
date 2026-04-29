'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Trash2, FolderPlus, Copy, Send, CheckCircle, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { QuoteCalculator } from '@/components/quotes/QuoteCalculator'
import { PDFExportButton } from '@/components/quotes/PDFExportButton'
import { formatDate } from '@/lib/utils'

function calcTotal(items: { unitPrice: number; dimension1: number | null; dimension2: number | null }[], discount: number) {
  const sub = items.reduce((s: number, i: any) => {
    const d2 = i.dimension2 != null ? i.dimension2 / 100 : 1
    return s + (i.dimension1 ?? 1) * d2 * i.unitPrice
  }, 0)
  return Math.max(0, sub - discount) * 1.17
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'טיוטה' },
  { value: 'SENT', label: 'נשלחה' },
  { value: 'APPROVED', label: 'אושרה' },
  { value: 'REJECTED', label: 'נדחתה' },
  { value: 'EXPIRED', label: 'פג תוקף' },
]

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [duplicating, setDuplicating] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [sendingQuote, setSendingQuote] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    fetch(`/api/quotes/${id}`)
      .then((r) => r.json())
      .then((j) => { setQuote(j.data); setNotes(j.data?.notes ?? ''); setLoading(false) })
  }, [id])

  async function updateStatus(status: string) {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const json = await res.json()
      setQuote((prev: any) => ({ ...prev, status: json.data.status }))
    }
  }

  async function handleSend() {
    setSendingQuote(true)
    try {
      const updates: Record<string, unknown> = { status: 'SENT' }
      if (!quote.validUntil) {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        updates.validUntil = d
      }
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const json = await res.json()
        setQuote((prev: any) => ({ ...prev, status: json.data.status, validUntil: json.data.validUntil }))
        setActionMsg('ההצעה סומנה כנשלחה')
        setTimeout(() => setActionMsg(''), 3000)
      }
    } finally { setSendingQuote(false) }
  }

  async function handleApprove() {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    })
    if (res.ok) {
      setQuote((prev: any) => ({ ...prev, status: 'APPROVED' }))
      setActionMsg('ההצעה אושרה!')
      setTimeout(() => setActionMsg(''), 3000)
    }
  }

  async function handleReject() {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED' }),
    })
    if (res.ok) {
      setQuote((prev: any) => ({ ...prev, status: 'REJECTED' }))
    }
  }

  async function handleDuplicate() {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/quotes/${id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        const json = await res.json()
        router.push(`/quotes/${json.data.id}`)
      }
    } finally { setDuplicating(false) }
  }

  async function saveNotes() {
    if (savingNotes) return
    setSavingNotes(true)
    try {
      await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
    } finally { setSavingNotes(false) }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName) return
    setCreatingProject(true)
    try {
      const contractValue = quote.items?.length > 0 ? calcTotal(quote.items, quote.discount ?? 0) : 0
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, clientId: quote.clientId, contractValue }),
      })
      if (!projRes.ok) return
      const projJson = await projRes.json()
      const newProjectId = projJson.data.id
      await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: newProjectId }),
      })
      router.push(`/projects/${newProjectId}`)
    } finally { setCreatingProject(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!quote) return <p className="text-gray-500 text-center py-24">הצעת מחיר לא נמצאה</p>

  return (
    <div>
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <Link href="/quotes" className="hover:text-white transition-colors">הצעות מחיר</Link>
        <ChevronRight size={14} />
        <span className="text-gray-300">{quote.quoteNumber}</span>
        {actionMsg && (
          <span className="ms-4 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full animate-pulse">
            {actionMsg}
          </span>
        )}
      </nav>

      <PageHeader
        title={`הצעת מחיר ${quote.quoteNumber}`}
        subtitle={`לקוח: ${quote.client?.name} ${quote.project ? `· פרויקט: ${quote.project.name}` : ''}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary workflow actions */}
            {quote.status === 'DRAFT' && (
              <Button size="sm" onClick={handleSend} loading={sendingQuote} className="gap-1.5 bg-blue-600 hover:bg-blue-500">
                <Send size={13} />
                שלח הצעה
              </Button>
            )}
            {quote.status === 'SENT' && (
              <>
                <Button size="sm" onClick={handleApprove} className="gap-1.5 bg-green-600 hover:bg-green-500">
                  <CheckCircle size={13} />
                  אשר הצעה
                </Button>
                <Button size="sm" variant="secondary" onClick={handleReject} className="gap-1.5">
                  <XCircle size={13} />
                  דחה
                </Button>
              </>
            )}
            {/* Status dropdown for manual override */}
            <div className="w-36">
              <Select
                options={STATUS_OPTIONS}
                value={quote.status}
                onChange={(e) => updateStatus(e.target.value)}
              />
            </div>
            <PDFExportButton quote={quote} clientId={quote.clientId} />
            <Button variant="secondary" size="sm" onClick={handleDuplicate} loading={duplicating}>
              <Copy size={14} />
              שכפל
            </Button>
            {quote.status === 'APPROVED' && !quote.projectId && (
              <Button size="sm" onClick={() => { setProjectName(`פרויקט - ${quote.client?.name}`); setProjectOpen(true) }}>
                <FolderPlus size={14} />
                פתח פרויקט
              </Button>
            )}
            {quote.projectId && (
              <Button variant="secondary" size="sm" onClick={() => router.push(`/projects/${quote.projectId}`)}>
                <FolderPlus size={14} />
                לפרויקט
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 size={14} /></Button>
          </div>
        }
      />

      {/* Meta info */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card>
          <p className="text-xs text-gray-500 mb-1">תאריך</p>
          <p className="text-sm font-medium text-white">{formatDate(quote.date)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">תוקף</p>
          <p className="text-sm font-medium text-white">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">סטטוס</p>
          <StatusBadge type="quote" value={quote.status} />
        </Card>
        <Card>
          <p className="text-xs text-gray-500 mb-1">גרסה</p>
          <p className="text-sm font-medium text-white">v{quote.version}</p>
        </Card>
      </div>

      {/* Calculator */}
      <Card>
        <h2 className="text-base font-semibold text-white mb-4">פירוט פריטים</h2>
        <QuoteCalculator
          quoteId={quote.id}
          initialItems={quote.items ?? []}
          initialDiscount={quote.discount ?? 0}
        />
      </Card>

      {/* Notes */}
      <Card className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-300">הערות כלליות</h3>
          {savingNotes && <span className="text-xs text-gray-500">שומר...</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          placeholder="הערות, תנאי תשלום, הגבלות..."
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      {/* Payment terms */}
      {quote.paymentTerms && (
        <div className="mt-4 text-sm text-gray-400">
          <span className="font-medium text-gray-300">תנאי תשלום: </span>{quote.paymentTerms}
        </div>
      )}

      <Modal open={projectOpen} onClose={() => setProjectOpen(false)} title="פתיחת פרויקט מהצעה" size="sm">
        <form onSubmit={handleCreateProject} className="space-y-3">
          <p className="text-sm text-gray-400">ייצור פרויקט חדש ללקוח <span className="text-white font-medium">{quote.client?.name}</span> עם ערך חוזה לפי סכום ההצעה.</p>
          <Input
            label="שם הפרויקט *"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="שם הפרויקט"
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={creatingProject} disabled={!projectName} className="flex-1">פתח פרויקט</Button>
            <Button type="button" variant="secondary" onClick={() => setProjectOpen(false)}>ביטול</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleting(true)
          try {
            const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
            if (res.ok) router.push('/quotes')
          } finally { setDeleting(false) }
        }}
        title="מחיקת הצעת מחיר"
        message={`האם למחוק את הצעת מחיר "${quote.quoteNumber}"? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק"
        loading={deleting}
      />
    </div>
  )
}
