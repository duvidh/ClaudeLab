'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, User, Calendar, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { DataTable } from '@/components/ui/DataTable'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Project } from '@/types'

type ProjectWithClient = Project & {
  client: { id: string; name: string }
  payments: { amount: number }[]
  _count: { milestones: number; tasks: number }
}

interface ProjectsTableProps {
  projects: ProjectWithClient[]
  onDelete?: (id: string) => void
}

type SortField = 'name' | 'clientName' | 'status' | 'startDate' | 'progressPercent' | 'contractValue'
type SortDir = 'asc' | 'desc'

function Th({ label, active, sortDir, onClick }: { label: string; active: boolean; sortDir: SortDir; onClick: () => void }) {
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

export function ProjectsTable({ projects: initialProjects, onDelete }: ProjectsTableProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const confirmProject = projects.find((p) => p.id === confirmId)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    if (!sortField) return projects
    return [...projects].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortField === 'startDate') {
        va = a.startDate ? new Date(a.startDate).getTime() : 0
        vb = b.startDate ? new Date(b.startDate).getTime() : 0
      } else if (sortField === 'progressPercent') {
        va = a.progressPercent; vb = b.progressPercent
      } else if (sortField === 'contractValue') {
        va = a.contractValue; vb = b.contractValue
      } else if (sortField === 'clientName') {
        va = a.client.name.toLowerCase(); vb = b.client.name.toLowerCase()
      } else {
        va = ((a[sortField] as string) ?? '').toString().toLowerCase()
        vb = ((b[sortField] as string) ?? '').toString().toLowerCase()
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [projects, sortField, sortDir])

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${confirmId}`, { method: 'DELETE' })
      if (res.ok) { setProjects((prev) => prev.filter((p) => p.id !== confirmId)); onDelete?.(confirmId); setConfirmId(null) }
    } finally { setDeleting(false) }
  }

  if (projects.length === 0) return null

  return (
    <>
      <DataTable
        headers={[
          <Th key="name" label="שם פרויקט" active={sortField === 'name'} sortDir={sortDir} onClick={() => toggleSort('name')} />,
          <Th key="clientName" label="לקוח" active={sortField === 'clientName'} sortDir={sortDir} onClick={() => toggleSort('clientName')} />,
          'כתובת',
          'מנהל',
          <Th key="progressPercent" label="התקדמות" active={sortField === 'progressPercent'} sortDir={sortDir} onClick={() => toggleSort('progressPercent')} />,
          <Th key="contractValue" label="שולם / חוזה" active={sortField === 'contractValue'} sortDir={sortDir} onClick={() => toggleSort('contractValue')} />,
          <Th key="status" label="סטטוס" active={sortField === 'status'} sortDir={sortDir} onClick={() => toggleSort('status')} />,
          <Th key="startDate" label="התחלה" active={sortField === 'startDate'} sortDir={sortDir} onClick={() => toggleSort('startDate')} />,
          <th key="actions" className="px-4 py-3" />,
        ]}
        data={sorted}
        renderRow={(project) => (
          <tr key={project.id} className="hover:bg-gray-800/40 transition-colors group">
            <td className="px-4 py-3">
              <Link href={`/projects/${project.id}`} className="font-medium text-white hover:text-blue-300 transition-colors">
                {project.name}
              </Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/clients/${project.client.id}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                <User size={13} />
                {project.client.name}
              </Link>
            </td>
            <td className="px-4 py-3">
              {project.address && (
                <div className="flex items-center gap-1 text-gray-400">
                  <MapPin size={13} className="text-gray-600" />
                  {project.address}
                </div>
              )}
            </td>
            <td className="px-4 py-3 text-gray-400">{project.projectManager || '—'}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progressPercent}%` }} />
                </div>
                <span className="text-xs text-gray-400">{project.progressPercent}%</span>
              </div>
            </td>
            <td className="px-4 py-3">
              {project.contractValue > 0 ? (
                <div>
                  <div className="text-xs font-medium text-gray-200">
                    {formatCurrency(project.payments.reduce((s, p) => s + p.amount, 0))}
                    <span className="text-gray-500"> / {formatCurrency(project.contractValue)}</span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden w-24">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, (project.payments.reduce((s, p) => s + p.amount, 0) / project.contractValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : <span className="text-gray-500">—</span>}
            </td>
            <td className="px-4 py-3">
              <StatusBadge type="project" value={project.status} />
            </td>
            <td className="px-4 py-3">
              {project.startDate && (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Calendar size={11} />
                  {formatDate(project.startDate)}
                </div>
              )}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setConfirmId(project.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="מחק">
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        title="מחיקת פרויקט" message={`האם למחוק את "${confirmProject?.name}"? כל אבני הדרך, הצעות המחיר והתשלומים הקשורים יימחקו.`}
        confirmLabel="מחק" loading={deleting} />
    </>
  )
}
