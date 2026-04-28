'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ClientsTable } from '@/components/clients/ClientsTable'
import { ClientForm } from '@/components/clients/ClientForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserCheck } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'INACTIVE', label: 'לא פעיל' },
]

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/clients?${params}`)
      const json = await res.json()
      setClients(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300)
    return () => clearTimeout(timer)
  }, [fetchClients])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setCreateOpen(false)
      await fetchClients()
    }
  }

  return (
    <div>
      <PageHeader
        title="לקוחות"
        subtitle={`${clients.length} לקוחות`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            לקוח חדש
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="חיפוש לפי שם, אימייל, עיר..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-36">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <button
          onClick={fetchClients}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="אין לקוחות עדיין"
          description="לקוחות נוצרים בהמרת ליד, או ניתן להוסיף ידנית"
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              לקוח חדש
            </Button>
          }
        />
      ) : (
        <ClientsTable clients={clients} onDelete={(id) => setClients((prev) => prev.filter((c) => c.id !== id))} />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="לקוח חדש" size="lg">
        <ClientForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  )
}
