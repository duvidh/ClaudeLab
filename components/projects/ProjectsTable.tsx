'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, User, Calendar, ChevronLeft, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
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

export function ProjectsTable({ projects, onDelete }: ProjectsTableProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const confirmProject = projects.find((p) => p.id === confirmId)

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${confirmId}`, { method: 'DELETE' })
      if (res.ok) { onDelete?.(confirmId); setConfirmId(null) }
    } finally { setDeleting(false) }
  }

  if (projects.length === 0) return null

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/60 border-b border-gray-700">
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">שם פרויקט</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">לקוח</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">כתובת</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">מנהל</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">התקדמות</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">שולם / חוזה</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">סטטוס</th>
              <th className="px-4 py-3 font-semibold text-gray-400 text-right">התחלה</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-800/40 transition-colors group">
                <td className="px-4 py-3 font-medium text-white">{project.name}</td>
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
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs">
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
      <ConfirmModal open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete}
        title="מחיקת פרויקט" message={`האם למחוק את "${confirmProject?.name}"? כל אבני הדרך, הצעות המחיר והתשלומים הקשורים יימחקו.`}
        confirmLabel="מחק" loading={deleting} />
    </>
  )
}
