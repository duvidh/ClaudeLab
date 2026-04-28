'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ChevronLeft, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Quote } from '@/types'

type QuoteItem = { unitPrice: number; dimension1: number | null; dimension2: number | null }

type QuoteWithRelations = Quote & {
  client: { id: string; name: string }
  project?: { id: string; name: string } | null
  items: QuoteItem[]
  _count: { items: number }
}

function calcTotal(items: QuoteItem[], discount: number): number {
  const sub = items.reduce((s, i) => s + (i.dimension1 ?? 1) * (i.dimension2 ?? 1) * i.unitPrice, 0)
  const beforeVAT = Math.max(0, sub - discount)
  return beforeVAT * 1.17
}

export function QuotesTable({ quotes, onDelete }: { quotes: QuoteWithRelations[]; onDelete?: (id: string) => void }) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const confirmQuote = quotes.find((q) => q.id === confirmId)

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
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60 border-b border-gray-700">
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">מספר הצעה</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">לקוח</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">פרויקט</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">תאריך</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">תוקף</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">פריטים</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">סה"כ כולל מע"מ</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">סטטוס</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">גרסה</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-800/40 group transition-colors">
                <td className="px-4 py-3 font-medium text-blue-400">
                  <Link href={`/quotes/${quote.id}`} className="hover:underline flex items-center gap-1">
                    <FileText size={13} />
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/clients/${quote.client.id}`} className="text-gray-300 hover:text-white">
                    {quote.client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-400">{quote.project?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(quote.date)}</td>
                <td className="px-4 py-3 text-gray-400">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</td>
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
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        title="מחיקת הצעת מחיר" message={`האם למחוק את הצעת מחיר "${confirmQuote?.quoteNumber}"? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק" loading={deleting} />
    </>
  )
}
