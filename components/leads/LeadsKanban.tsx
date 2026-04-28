'use client'

import Link from 'next/link'
import { Phone, MapPin } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LEAD_STATUS_LABELS, type Lead } from '@/types'

const KANBAN_COLUMNS = [
  'NEW',
  'CONTACTED',
  'MEETING_SCHEDULED',
  'QUOTE_SENT',
  'WON',
  'LOST',
] as const

const COLUMN_COLORS: Record<string, string> = {
  NEW: 'border-blue-500/40',
  CONTACTED: 'border-yellow-500/40',
  MEETING_SCHEDULED: 'border-purple-500/40',
  QUOTE_SENT: 'border-orange-500/40',
  WON: 'border-green-500/40',
  LOST: 'border-red-500/40',
}

const COLUMN_HEADER_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-300',
  CONTACTED: 'bg-yellow-500/10 text-yellow-300',
  MEETING_SCHEDULED: 'bg-purple-500/10 text-purple-300',
  QUOTE_SENT: 'bg-orange-500/10 text-orange-300',
  WON: 'bg-green-500/10 text-green-300',
  LOST: 'bg-red-500/10 text-red-300',
}

interface LeadsKanbanProps {
  leads: Lead[]
}

export function LeadsKanban({ leads }: LeadsKanbanProps) {
  const grouped = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status)
      return acc
    },
    {} as Record<string, Lead[]>
  )

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((status) => {
        const columnLeads = grouped[status] ?? []
        return (
          <div
            key={status}
            className={`flex-shrink-0 w-64 rounded-xl border ${COLUMN_COLORS[status]} bg-gray-800/30`}
          >
            {/* Column header */}
            <div className={`px-3 py-2.5 rounded-t-xl ${COLUMN_HEADER_COLORS[status]} flex items-center justify-between`}>
              <span className="text-xs font-semibold">
                {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS]}
              </span>
              <span className="text-xs opacity-70">{columnLeads.length}</span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {columnLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`}>
                  <div className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-3 cursor-pointer transition-colors">
                    <p className="text-sm font-medium text-white mb-1">{lead.fullName}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <Phone size={11} />
                      {lead.primaryPhone}
                    </div>
                    {lead.city && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <MapPin size={11} />
                        {lead.city}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {lead.workType && (
                        <span className="text-xs text-gray-500">{lead.workType}</span>
                      )}
                      <StatusBadge type="priority" value={lead.urgency} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
