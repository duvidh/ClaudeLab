'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Mail, MapPin, FolderKanban, FileText, ChevronLeft, Building2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
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

const CLIENT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'INACTIVE', label: 'לא פעיל' },
]

type SortField = 'name' | 'city' | 'status' | 'joinDate' | 'contractValue'
type SortDir = 'asc' | 'desc'

export function ClientsTable({ clients: initialClients, onDelete }: ClientsTableProps) {
  const [clients, setClients] = useState(initialClients)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openStatusId, setOpenStatusId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField | null>('joinDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const statusRef = useRef<HTMLDivElement>(null)
  const confirmClient = clients.find((c) => c.id === confirmId)

  useEffect(() => { setClients(initialClients) }, [initialClients])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusId(null)
    }
    if (openStatusId) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openStatusId])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    if (!sortField) return clients
    return [...clients].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortField === 'joinDate') {
        va = new Date(a.joinDate).getTime()
        vb = new Date(b.joinDate).getTime()
      } else if (sortField === 'contractValue') {
        va = a.projects.reduce((s, p) => s + p.contractValue, 0)
        vb = b.projects.reduce((s, p) => s + p.contractValue, 0)
      } else {
        va = ((a[sortField] as string) ?? '').toString().toLowerCase()
        vb = ((b[sortField] as string) ?? '').toString().toLowerCase()
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [clients, sortField, sortDir])

  async function handleStatusChange(id: string, status: string) {
    setOpenStatusId(null)
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setClients((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
  }

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${confirmId}`, { method: 'DELETE' })
      if (res.ok) { onDelete?.(confirmId); setConfirmId(null) }
    } finally { setDeleting(false) }
  }

  if (clients.length === 0) return null

  function Th({ field, label }: { field: SortField; label: string }) {
    const active = sortField === field
    return (
      <th
        onClick={() => toggleSort(field)}
        className="px-4 py-3 font-semibold text-gray-400 text-right cursor-pointer hover:text-white select-none transition-colors"
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active
            ? sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />
            : <ChevronDown size={12} className="opacity-0 group-hover:opacity-40" />}
        </span>
      </th>
    )
  }

  return (
    <>
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/60 border-b border-gray-700 group">
            <Th field="name" label="לקוח" />
            <Th field="city" label="עיר" />
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">ת.ז / ח.פ</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">קטגוריה</th>
            <th className="px-4 py-3 font-semibold text-gray-400 text-right">פרויקטים</th>
            <Th field="contractValue" label="ערך חוזים" />
            <Th field="status" label="סטטוס" />
            <Th field="joinDate" label="תאריך הצטרפות" />
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sorted.map((client) => {
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
                      <a href={`mailto:${client.email}`} className="hover:text-blue-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        {client.email}
                      </a>
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
                  <div className="relative inline-block" ref={openStatusId === client.id ? statusRef : undefined}>
                    <button
                      onClick={() => setOpenStatusId(openStatusId === client.id ? null : client.id)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {client.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </button>
                    {openStatusId === client.id && (
                      <div className="absolute top-full mt-1 right-0 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]">
                        {CLIENT_STATUS_OPTIONS.map((opt) => (
                          <button key={opt.value} onClick={() => handleStatusChange(client.id, opt.value)}
                            className={`w-full text-right px-3 py-1.5 text-sm transition-colors hover:bg-gray-700 ${
                              client.status === opt.value ? 'text-white font-medium' : 'text-gray-400'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
