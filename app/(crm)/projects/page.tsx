'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ProjectsTable } from '@/components/projects/ProjectsTable'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { FolderKanban } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'PLANNING', label: 'תכנון' },
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'PAUSED', label: 'מושהה' },
  { value: 'COMPLETED', label: 'הושלם' },
  { value: 'CANCELLED', label: 'בוטל' },
]

export default function ProjectsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false)
  const router = useRouter()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/projects?${params}`)
      const json = await res.json()
      setProjects(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300)
    return () => clearTimeout(timer)
  }, [fetchProjects])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setCreateOpen(false)
      await fetchProjects()
    }
  }

  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length

  return (
    <div>
      <PageHeader
        title="פרויקטים"
        subtitle={`${projects.length} פרויקטים · ${activeCount} פעילים`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCreateQuoteOpen(true)}>
              <FileText size={16} />
              הצעת מחיר חדשה
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              פרויקט חדש
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="חיפוש לפי שם, כתובת..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-36">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <button onClick={fetchProjects} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="אין פרויקטים עדיין"
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} />פרויקט חדש</Button>}
        />
      ) : (
        <ProjectsTable projects={projects} onDelete={(id) => setProjects((prev) => prev.filter((p) => p.id !== id))} />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="פרויקט חדש" size="lg">
        <ProjectForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={createQuoteOpen} onClose={() => setCreateQuoteOpen(false)} title="הצעת מחיר חדשה" size="sm">
        <CreateQuoteForm onClose={() => setCreateQuoteOpen(false)} onCreated={(id) => router.push(`/quotes/${id}`)} />
      </Modal>
    </div>
  )
}

function CreateQuoteForm({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [clientProjects, setClientProjects] = useState<{ id: string; name: string }[]>([])
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((j) => {
        setClients((j.data ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!clientId) { setClientProjects([]); setProjectId(''); return }
    fetch(`/api/projects?clientId=${clientId}`)
      .then((r) => r.json())
      .then((j) => {
        setClientProjects((j.data ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
        setProjectId('')
      })
  }, [clientId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId) return
    setLoading(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          projectId: projectId || undefined,
          validUntil: validUntil ? new Date(validUntil) : undefined,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        onCreated(json.data.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const clientOptions = [{ value: '', label: 'בחר לקוח...' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]
  const projectOptions = [{ value: '', label: 'ללא פרויקט ספציפי' }, ...clientProjects.map((p) => ({ value: p.id, label: p.name }))]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">בחר לקוח ופרויקט — ההצעה תיפתח לעריכה מיידית.</p>
      {fetching ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <Select label="לקוח *" options={clientOptions} value={clientId} onChange={(e) => setClientId(e.target.value)} />
          {clientProjects.length > 0 && (
            <Select label="פרויקט (אופציונלי)" options={projectOptions} value={projectId} onChange={(e) => setProjectId(e.target.value)} />
          )}
          <Input label="תוקף הצעה" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} disabled={!clientId} className="flex-1">צור הצעה ועבור לעריכה</Button>
        <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
      </div>
    </form>
  )
}
