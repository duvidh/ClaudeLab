'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, ChevronLeft, Trash2, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { DataTable } from '@/components/ui/DataTable'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Quote } from '@/types'

type QuoteItem = { unitPrice: number; dimension1: number | null; dimension2: number | null }

type QuoteWithRelations = Quote & {
  client?: { id: string; name: string } | null
  lead?: { id: string; fullName: string } | null
  project?: { id: string; name: string } | null
  items: QuoteItem[]
  _count: { items: number }
}

function calcTotal(items: QuoteItem[], discount: number): number {
  const sub = items.reduce((s, i) => {
    const d2 = i.dimension2 != null ? i.dimension2 / 100 : 1
    return s + (i.dimension1 ?? 1) * d2 * i.unitPrice
  }, 0)
  const beforeVAT = Math.max(0, sub - discount)
  return beforeVAT * 1.17
}

function getExpirationStatus(quote: QuoteWithRelations): 'expired' | 'expiring-soon' | null {
  if (!quote.validUntil || !['DRAFT', 'SENT'].includes(quote.status)) return null
  const now = new Date()
  const valid = new Date(quote.validUntil)
  if (valid < now) return 'expired'
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  if (valid <= sevenDays) return 'expiring-soon'
  return null
}

type SortField = 'quoteNumber' | 'clientName' | 'date' | 'validUntil' | 'total' | 'status'
type SortDir = 'asc' | 'desc'

function Th({ label, active, sortDir, onClick }: { label: string; active: boolean; sortDir: SortDir; onClick: () => void }) {
  return (
    <th onClick={onClick} className="px-4 py-3 font-semibold text-gray-400 text-right cursor-pointer hover:text-white select-none transition-colors">
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />
          : <ChevronDown size={12} className="opacity-0 group-hover:opacity-40" />}
      </span>
    </th>
  )
}

export function QuotesTable({ quotes, onDelete }: { quotes: QuoteWithRelations[]; onDelete?: (id: string) => void }) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const confirmQuote = quotes.find((q) => q.id === confirmId)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    if (!sortField) return quotes
    return [...quotes].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortField === 'date') {
        va = new Date(a.date).getTime(); vb = new Date(b.date).getTime()
      } else if (sortField === 'validUntil') {
        va = a.validUntil ? new Date(a.validUntil).getTime() : 0
        vb = b.validUntil ? new Date(b.validUntil).getTime() : 0
      } else if (sortField === 'total') {
        va = calcTotal(a.items, a.discount); vb = calcTotal(b.items, b.discount)
      } else if (sortField === 'clientName') {
        va = (a.client?.name ?? a.lead?.fullName ?? '').toLowerCase()
        vb = (b.client?.name ?? b.lead?.fullName ?? '').toLowerCase()
      } else {
        va = ((a[sortField] as string) ?? '').toString().toLowerCase()
        vb = ((b[sortField] as string) ?? '').toString().toLowerCase()
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [quotes, sortField, sortDir])

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/quotes/${confirmId}`, { method: 'DELETE' })
      if (res.ok) { onDelete?.(confirmId); setConfirmId(null) }
    } finally { setDeleting(false) }
  }

  if (quotes.length === 0) return null

  return (
    <>
      <DataTable
        headers={[
          <Th key="quoteNumber" label="מספר הצעה" active={sortField === 'quoteNumber'} sortDir={sortDir} onClick={() => toggleSort('quoteNumber')} />,
          <Th key="clientName" label="לקוח" active={sortField === 'clientName'} sortDir={sortDir} onClick={() => toggleSort('clientName')} />,
          'פרויקט',
          <Th key="date" label="תאריך" active={sortField === 'date'} sortDir={sortDir} onClick={() => toggleSort('date')} />,
          <Th key="validUntil" label="תוקף" active={sortField === 'validUntil'} sortDir={sortDir} onClick={() => toggleSort('validUntil')} />,
          'פריטים',
          <Th key="total" label='סה"כ כולל מע"מ' active={sortField === 'total'} sortDir={sortDir} onClick={() => toggleSort('total')} />,
          <Th key="status" label="סטטוס" active={sortField === 'status'} sortDir={sortDir} onClick={() => toggleSort('status')} />,
          'גרסה',
          <th key="actions" className="px-4 py-3" />,
        ]}
        data={sorted}
        renderRow={(quote) => {
          const expStatus = getExpirationStatus(quote)
          return (
            <tr key={quote.id} className="hover:bg-gray-800/40 group transition-colors">
              <td className="px-4 py-3 font-medium text-blue-400">
                <Link href={`/quotes/${quote.id}`} className="hover:underline flex items-center gap-1">
                  <FileText size={13} />
                  {quote.quoteNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                {quote.client ? (
                  <Link href={`/clients/${quote.client.id}`} className="text-gray-300 hover:text-white">
                    {quote.client.name}
                  </Link>
                ) : quote.lead ? (
                  <Link href={`/leads/${quote.lead.id}`} className="text-gray-300 hover:text-white">
                    {quote.lead.fullName}
                  </Link>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-400">{quote.project?.name || '—'}</td>
              <td className="px-4 py-3 text-gray-400">{formatDate(quote.date)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {expStatus && (
                    <span title={expStatus === 'expired' ? 'פג תוקף' : 'פג תוקף בקרוב'}>
                      <AlertCircle
                        size={13}
                        className={expStatus === 'expired' ? 'text-red-400 shrink-0' : 'text-amber-400 shrink-0'}
                      />
                    </span>
                  )}
                  <span className={
                    expStatus === 'expired' ? 'text-red-400' :
                    expStatus === 'expiring-soon' ? 'text-amber-400' :
                    'text-gray-400'
                  }>
                    {quote.validUntil ? formatDate(quote.validUntil) : '—'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400">{quote._count.items}</td>
              <td className="px-4 py-3 font-medium text-gray-200">
                {quote.items.length > 0 ? formatCurrency(calcTotal(quote.items, quote.discount)) : '—'}
              </td>
              <td className="px-4 py-3"><StatusBadge type="quote" value={quote.status} /></td>
              <td className="px-4 py-3 text-gray-500">v{quote.version}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setConfirmId(quote.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="מחק">
                    <Trash2 size={14} />
                  </button>
                  <Link href={`/quotes/${quote.id}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs">
                    פתח
                    <ChevronLeft size={13} />
                  </Link>
                </div>
              </td>
            </tr>
          )
        }}
      />
      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        title="מחיקת הצעת מחיר" message={`האם למחוק את הצעת מחיר "${confirmQuote?.quoteNumber}"? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק" loading={deleting} />
    </>
  )
}
