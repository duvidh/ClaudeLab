'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MapPin, FolderKanban, FileText, ChevronLeft, Building2, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Client } from '@/types'

type ClientWithCounts = Client & {
  _count: { projects: number; quotes: number; invoices: number }
  projects: { contractValue: number }[]
}

interface ClientsTableProps {
  clients: ClientWithCounts[]
  onDelete?: (id: string) => void
}

export function ClientsTable({ clients, onDelete }: ClientsTableProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const confirmClient = clients.find((c) => c.id === confirmId)

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${confirmId}`, { method: 'DELETE' })
      if (res.ok) { onDelete?.(confirmId); setConfirmId(null) }
    } finally { setDeleting(false) }
  }

  if (clients.length === 0) return null

  return (
    <>
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/60 border-b border-gray-700">
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">לקוח</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">עיר</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">ת.ז / ח.פ</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">קטגוריה</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">פרויקטים</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">ערך חוזים</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">סטטוס</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">תאריך הצטרפות</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {clients.map((client) => {
            const totalContracts = client.projects.reduce((s, p) => s + p.contractValue, 0)
            return (
              <tr key={client.id} className="hover:bg-gray-800/40 transition-colors group">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{client.name}</div>
                  {client.company && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <Building2 size={11} />
                      {client.company}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <Mail size={11} />
                      {client.email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {client.city && (
                    <div className="flex items-center gap-1 text-gray-300">
                      <MapPin size={13} className="text-gray-500" />
                      {client.city}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">{client.idNumber || '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">
                  {client.category === 'BUSINESS' ? 'עסקי' : 'פרטי'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-300">
                    <FolderKanban size={13} className="text-gray-500" />
                    {client._count.projects}
                    {client._count.quotes > 0 && (
                      <span className="flex items-center gap-0.5 text-gray-500 mr-2">
                        <FileText size={11} />
                        {client._count.quotes}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-200">
                  {totalContracts > 0 ? formatCurrency(totalContracts) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {client.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(client.joinDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setConfirmId(client.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="מחק">
                      <Trash2 size={14} />
                    </button>
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs">
                      פרטים
                      <ChevronLeft size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
      title="מחיקת לקוח" message={`האם למחוק את "${confirmClient?.name}"? כל הפרויקטים, הצעות המחיר והמשימות הקשורות יימחקו.`}
      confirmLabel="מחק" loading={deleting} />
    </>
  )
}
