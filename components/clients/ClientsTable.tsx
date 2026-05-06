'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Mail, MapPin, FolderKanban, FileText, ChevronLeft, Building2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { DataTable } from '@/components/ui/DataTable'
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

function Th({ label, active, sortDir, onClick }: { label: string; active: boolean; sortDir: SortDir; onClick: () => void }) {
  return (
    <th onClick={onClick} className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none transition-colors">
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-600 dark:text-blue-400" /> : <ChevronDown size={12} className="text-blue-600 dark:text-blue-400" />
          : <ChevronDown size={12} className="opacity-0 group-hover:opacity-40" />}
      </span>
    </th>
  )
}

export function ClientsTable({ clients: initialClients, onDelete }: ClientsTableProps) {
  const [clients, setClients] = useState(initialClients)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openStatusId, setOpenStatusId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField | null>('joinDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const statusRef = useRef<HTMLDivElement>(null)
  const confirmClient = clients.find((c) => c.id === confirmId)

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {sorted.map((client) => {
          const totalContracts = client.projects.reduce((s, p) => s + p.contractValue, 0)
          return (
            <div key={client.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{client.name}</p>
                  {client.company && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Building2 size={11} className="shrink-0" />
                      {client.company}
                    </p>
                  )}
                </div>
                <div className="relative shrink-0" ref={openStatusId === client.id ? statusRef : undefined}>
                  <button
                    onClick={() => setOpenStatusId(openStatusId === client.id ? null : client.id)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400'
                    }`}>
                      {client.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </button>
                  {openStatusId === client.id && (
                    <div className="absolute top-full mt-1 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]">
                      {CLIENT_STATUS_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => handleStatusChange(client.id, opt.value)}
                          className={`w-full text-right px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            client.status === opt.value ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-3">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 col-span-2 truncate" onClick={(e) => e.stopPropagation()}>
                    <Mail size={11} className="shrink-0 text-gray-400" />
                    {client.email}
                  </a>
                )}
                {client.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} className="shrink-0 text-gray-400" />
                    {client.city}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <FolderKanban size={11} className="shrink-0 text-gray-400" />
                  {client._count.projects} פרויקטים
                  {client._count.quotes > 0 && (
                    <span className="flex items-center gap-0.5 text-gray-400 mr-1">
                      <FileText size={10} />{client._count.quotes}
                    </span>
                  )}
                </div>
                {totalContracts > 0 && (
                  <div className="col-span-2 font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrency(totalContracts)}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <Link href={`/clients/${client.id}`} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                  פרטים
                  <ChevronLeft size={14} />
                </Link>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(client.joinDate)}</span>
                  <button
                    onClick={() => setConfirmId(client.id)}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: standard table */}
      <div className="hidden md:block">
        <DataTable
          headers={[
            <Th key="name" label="לקוח" active={sortField === 'name'} sortDir={sortDir} onClick={() => toggleSort('name')} />,
            <Th key="city" label="עיר" active={sortField === 'city'} sortDir={sortDir} onClick={() => toggleSort('city')} />,
            'ת.ז / ח.פ',
            'קטגוריה',
            'פרויקטים',
            <Th key="contractValue" label="ערך חוזים" active={sortField === 'contractValue'} sortDir={sortDir} onClick={() => toggleSort('contractValue')} />,
            <Th key="status" label="סטטוס" active={sortField === 'status'} sortDir={sortDir} onClick={() => toggleSort('status')} />,
            <Th key="joinDate" label="תאריך הצטרפות" active={sortField === 'joinDate'} sortDir={sortDir} onClick={() => toggleSort('joinDate')} />,
            <th key="actions" className="px-4 py-3" />,
          ]}
          data={sorted}
          renderRow={(client) => {
            const totalContracts = client.projects.reduce((s, p) => s + p.contractValue, 0)
            return (
              <tr key={client.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                  {client.company && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <Building2 size={11} />
                      {client.company}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <Mail size={11} />
                      <a href={`mailto:${client.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        {client.email}
                      </a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {client.city && (
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <MapPin size={13} className="text-gray-400 dark:text-gray-500" />
                      {client.city}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{client.idNumber || '—'}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                  {client.category === 'BUSINESS' ? 'עסקי' : 'פרטי'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <FolderKanban size={13} className="text-gray-400 dark:text-gray-500" />
                    {client._count.projects}
                    {client._count.quotes > 0 && (
                      <span className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500 mr-2">
                        <FileText size={11} />
                        {client._count.quotes}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                  {totalContracts > 0 ? formatCurrency(totalContracts) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-block" ref={openStatusId === client.id ? statusRef : undefined}>
                    <button
                      onClick={() => setOpenStatusId(openStatusId === client.id ? null : client.id)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400'
                      }`}>
                        {client.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </button>
                    {openStatusId === client.id && (
                      <div className="absolute top-full mt-1 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]">
                        {CLIENT_STATUS_OPTIONS.map((opt) => (
                          <button key={opt.value} onClick={() => handleStatusChange(client.id, opt.value)}
                            className={`w-full text-right px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              client.status === opt.value ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(client.joinDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setConfirmId(client.id)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="מחק">
                      <Trash2 size={14} />
                    </button>
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs">
                      פרטים
                      <ChevronLeft size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          }}
        />
      </div>

      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        title="מחיקת לקוח" message={`האם למחוק את "${confirmClient?.name}"? כל הפרויקטים, הצעות המחיר והמשימות הקשורות יימחקו.`}
        confirmLabel="מחק" loading={deleting} />
    </>
  )
}
