'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Trash2, FolderPlus } from 'lucide-react'
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
  const sub = items.reduce((s: number, i: any) => s + (i.dimension1 ?? 1) * (i.dimension2 ?? 1) * i.unitPrice, 0)
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

  useEffect(() => {
    fetch(`/api/quotes/${id}`)
      .then((r) => r.json())
      .then((j) => { setQuote(j.data); setLoading(false) })
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
      </nav>

      <PageHeader
        title={`הצעת מחיר ${quote.quoteNumber}`}
        subtitle={`לקוח: ${quote.client?.name} ${quote.project ? `· פרויקט: ${quote.project.name}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Select
                options={STATUS_OPTIONS}
                value={quote.status}
                onChange={(e) => updateStatus(e.target.value)}
              />
            </div>
            <PDFExportButton quote={quote} />
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
