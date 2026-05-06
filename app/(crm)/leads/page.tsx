'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, LayoutList, LayoutGrid, RefreshCw, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { LeadsKanban } from '@/components/leads/LeadsKanban'
import { LeadForm } from '@/components/leads/LeadForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'
import type { Lead } from '@/types'

const LEAD_STATUS_LABELS_HE: Record<string, string> = {
  NEW: 'חדש', CONTACTED: 'נוצר קשר', MEETING_SCHEDULED: 'פגישה נקבעה',
  QUOTE_SENT: 'הצעה נשלחה', WON: 'זכינו', LOST: 'אבד', CONVERTED: 'הומר',
}

function exportLeadsCSV(leads: Lead[]) {
  const headers = ['שם', 'טלפון', 'אימייל', 'עיר', 'סטטוס', 'מקור', 'נציג', 'תאריך יצירה']
  const rows = leads.map((l) => [
    l.fullName,
    l.primaryPhone,
    l.email ?? '',
    l.city ?? '',
    LEAD_STATUS_LABELS_HE[l.status] ?? l.status,
    l.leadSource ?? '',
    l.assignedRep ?? '',
    new Date(l.createdAt).toLocaleDateString('he-IL'),
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'NEW', label: 'חדש' },
  { value: 'CONTACTED', label: 'נוצר קשר' },
  { value: 'MEETING_SCHEDULED', label: 'פגישה נקבעה' },
  { value: 'QUOTE_SENT', label: 'הצעת מחיר נשלחה' },
  { value: 'WON', label: 'זכינו' },
  { value: 'LOST', label: 'אבד' },
  { value: 'CONVERTED', label: 'הומר ללקוח' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [statusFilter, setStatusFilter] = useState('')
  const [repFilter, setRepFilter] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/employees?status=ACTIVE')
      .then((r) => r.json())
      .then((j) => setEmployees(j.data ?? []))
      .catch(() => {})
  }, [])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (repFilter) params.set('rep', repFilter)
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/leads?${params}`)
      const json = await res.json()
      setLeads(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, repFilter, search])

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 300)
    return () => clearTimeout(timer)
  }, [fetchLeads])

  async function handleCreate(data: Record<string, unknown>) {
    const budget = data.budget ? parseFloat(data.budget as string) : undefined
    const estimatedSize = data.estimatedSize ? parseFloat(data.estimatedSize as string) : undefined
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, budget, estimatedSize }),
    })
    if (res.ok) {
      setCreateOpen(false)
      await fetchLeads()
    }
  }

  const activeLeads = leads.filter((l) => l.status !== 'CONVERTED' && l.status !== 'LOST')

  return (
    <div>
      <PageHeader
        title="לידים"
        subtitle={`${leads.length} לידים סה"כ · ${activeLeads.length} פעילים`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportLeadsCSV(leads)}
              disabled={leads.length === 0}
              title="ייצוא CSV"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
            </button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              ליד חדש
            </Button>
          </div>
        }
      />

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="חיפוש לפי שם, טלפון, עיר..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-44">
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        {employees.length > 0 && (
          <div className="w-40">
            <Select
              options={[
                { value: '', label: 'כל הנציגים' },
                ...employees.map((e) => ({ value: e.name, label: e.name })),
              ]}
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
            />
          </div>
        )}

        <button
          onClick={fetchLeads}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="רענן"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* View toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
          <button
            onClick={() => setView('table')}
            className={`p-1.5 rounded transition-colors ${view === 'table' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <LayoutList size={16} />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded transition-colors ${view === 'kanban' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="אין לידים עדיין"
          description="הוסף את הליד הראשון כדי להתחיל לנהל את המכירות שלך"
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              ליד חדש
            </Button>
          }
        />
      ) : view === 'table' ? (
        <LeadsTable leads={leads} onDelete={(id) => setLeads((prev) => prev.filter((l) => l.id !== id))} />
      ) : (
        <LeadsKanban leads={leads} />
      )}

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="ליד חדש"
        size="lg"
      >
        <LeadForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  )
}
