'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, Calendar, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { DataTable } from '@/components/ui/DataTable'
import { formatDate } from '@/lib/utils'
import type { Lead } from '@/types'

const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'חדש' },
  { value: 'CONTACTED', label: 'יצרנו קשר' },
  { value: 'MEETING_SCHEDULED', label: 'נקבעה פגישה' },
  { value: 'QUOTE_SENT', label: 'הצעה נשלחה' },
  { value: 'WON', label: 'זכייה' },
  { value: 'LOST', label: 'הפסד' },
]

const URGENCY_ORDER: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }

type SortField = 'fullName' | 'city' | 'urgency' | 'status' | 'entryDate' | 'assignedRep'

function Th({ label, active, sortDir, onClick }: { label: string; active: boolean; sortDir: 'asc' | 'desc'; onClick: () => void }) {
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
type SortDir = 'asc' | 'desc'

interface LeadsTableProps {
  leads: Lead[]
  onDelete?: (id: string) => void
}

export function LeadsTable({ leads: initialLeads, onDelete }: LeadsTableProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openStatusId, setOpenStatusId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField | null>('entryDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const statusRef = useRef<HTMLDivElement>(null)

  const confirmLead = leads.find((l) => l.id === confirmId)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLeads(initialLeads) }, [initialLeads])

  useEffect(() => {
    if (!openStatusId) return
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusId(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openStatusId])

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    if (!sortField) return leads
    return [...leads].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortField === 'urgency') { va = URGENCY_ORDER[a.urgency] ?? 0; vb = URGENCY_ORDER[b.urgency] ?? 0 }
      else if (sortField === 'entryDate') { va = new Date(a.entryDate).getTime(); vb = new Date(b.entryDate).getTime() }
      else { va = (a[sortField] ?? '').toString().toLowerCase(); vb = (b[sortField] ?? '').toString().toLowerCase() }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [leads, sortField, sortDir])

  async function handleStatusChange(id: string, status: string) {
    setOpenStatusId(null)
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${confirmId}`, { method: 'DELETE' })
      if (res.ok) { setLeads((prev) => prev.filter((l) => l.id !== confirmId)); onDelete?.(confirmId); setConfirmId(null) }
    } finally { setDeleting(false) }
  }

  if (leads.length === 0) return null

  return (
    <>
      <DataTable
        headers={[
          <Th key="fullName" label="שם" active={sortField === 'fullName'} sortDir={sortDir} onClick={() => toggleSort('fullName')} />,
          'טלפון',
          <Th key="city" label="עיר" active={sortField === 'city'} sortDir={sortDir} onClick={() => toggleSort('city')} />,
          'סוג עבודה',
          <Th key="urgency" label="דחיפות" active={sortField === 'urgency'} sortDir={sortDir} onClick={() => toggleSort('urgency')} />,
          <Th key="status" label="סטטוס" active={sortField === 'status'} sortDir={sortDir} onClick={() => toggleSort('status')} />,
          <Th key="entryDate" label="תאריך כניסה" active={sortField === 'entryDate'} sortDir={sortDir} onClick={() => toggleSort('entryDate')} />,
          <Th key="assignedRep" label="נציג" active={sortField === 'assignedRep'} sortDir={sortDir} onClick={() => toggleSort('assignedRep')} />,
          <th key="actions" className="px-4 py-3" />,
        ]}
        data={sorted}
        renderRow={(lead) => (
          <tr key={lead.id} className="hover:bg-gray-800/40 transition-colors group">
            <td className="px-4 py-3">
              <Link href={`/leads/${lead.id}`} className="font-medium text-white hover:text-blue-300 transition-colors">
                {lead.fullName}
              </Link>
              {lead.email && (
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                  <Mail size={11} />
                  <a href={`mailto:${lead.email}`} className="hover:text-blue-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                    {lead.email}
                  </a>
                </div>
              )}
            </td>
            <td className="px-4 py-3">
              <a href={`tel:${lead.primaryPhone}`} className="flex items-center gap-1 text-gray-300 hover:text-blue-400 transition-colors">
                <Phone size={13} className="text-gray-500" />
                {lead.primaryPhone}
              </a>
            </td>
            <td className="px-4 py-3">
              {lead.city && (
                <div className="flex items-center gap-1 text-gray-300">
                  <MapPin size={13} className="text-gray-500" />
                  {lead.city}
                </div>
              )}
            </td>
            <td className="px-4 py-3 text-gray-300">{lead.workType || '—'}</td>
            <td className="px-4 py-3"><StatusBadge type="priority" value={lead.urgency} /></td>
            <td className="px-4 py-3">
              {lead.status === 'CONVERTED' ? (
                <StatusBadge type="lead" value={lead.status} />
              ) : (
                <div className="relative inline-block" ref={openStatusId === lead.id ? statusRef : undefined}>
                  <button onClick={() => setOpenStatusId(openStatusId === lead.id ? null : lead.id)} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <StatusBadge type="lead" value={lead.status} />
                  </button>
                  {openStatusId === lead.id && (
                    <div className="absolute top-full mt-1 right-0 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[150px]">
                      {LEAD_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(lead.id, opt.value)}
                          className={`w-full text-right px-3 py-1.5 text-xs hover:bg-gray-700 transition-colors ${lead.status === opt.value ? 'text-blue-400 font-medium' : 'text-gray-300'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <Calendar size={11} />
                {formatDate(lead.entryDate)}
              </div>
            </td>
            <td className="px-4 py-3 text-gray-400 text-xs">{lead.assignedRep || '—'}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setConfirmId(lead.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="מחק">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="מחיקת ליד"
        message={`האם למחוק את "${confirmLead?.fullName}"? פעולה זו אינה ניתנת לביטול.`}
        confirmLabel="מחק"
        loading={deleting}
      />
    </>
  )
}
