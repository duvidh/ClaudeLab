'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
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
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            פרויקט חדש
          </Button>
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
    </div>
  )
}
