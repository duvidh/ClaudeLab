'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, Calendar, ChevronLeft, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
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

interface LeadsTableProps {
  leads: Lead[]
  onDelete?: (id: string) => void
}

export function LeadsTable({ leads: initialLeads, onDelete }: LeadsTableProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openStatusId, setOpenStatusId] = useState<string | null>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  const confirmLead = leads.find((l) => l.id === confirmId)

  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  useEffect(() => {
    if (!openStatusId) return
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setOpenStatusId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openStatusId])

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
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== confirmId))
        onDelete?.(confirmId)
        setConfirmId(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  if (leads.length === 0) return null

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60 border-b border-gray-700">
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">שם</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">טלפון</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">עיר</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">סוג עבודה</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">דחיפות</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">סטטוס</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">תאריך כניסה</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">נציג</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-800/40 transition-colors group">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{lead.fullName}</div>
                  {lead.email && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <Mail size={11} />
                      {lead.email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-300">
                    <Phone size={13} className="text-gray-500" />
                    {lead.primaryPhone}
                  </div>
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
                <td className="px-4 py-3">
                  <StatusBadge type="priority" value={lead.urgency} />
                </td>
                <td className="px-4 py-3">
                  {lead.status === 'CONVERTED' ? (
                    <StatusBadge type="lead" value={lead.status} />
                  ) : (
                    <div className="relative inline-block" ref={openStatusId === lead.id ? statusRef : undefined}>
                      <button
                        onClick={() => setOpenStatusId(openStatusId === lead.id ? null : lead.id)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
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
                    <button
                      onClick={() => setConfirmId(lead.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="מחק"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                    >
                      פרטים
                      <ChevronLeft size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
