'use client'

import { useState } from 'react'
import { Plus, UserPlus, FolderPlus, CheckSquare } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { LeadForm } from '@/components/leads/LeadForm'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { TaskForm } from '@/components/tasks/TaskForm'

type ActiveModal = 'lead' | 'project' | 'task' | null

interface DashboardQuickActionsProps {
  onCreated?: () => void
}

export function DashboardQuickActions({ onCreated }: DashboardQuickActionsProps) {
  const [active, setActive] = useState<ActiveModal>(null)

  function close() { setActive(null) }

  async function handleCreateLead(data: Record<string, unknown>) {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { close(); onCreated?.() }
  }

  async function handleCreateProject(data: Record<string, unknown>) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { close(); onCreated?.() }
  }

  async function handleCreateTask(data: Record<string, unknown>) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { close(); onCreated?.() }
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium me-1">פעולות מהירות</span>
        <QuickActionButton icon={UserPlus} label="ליד חדש" color="bg-blue-600 hover:bg-blue-700" onClick={() => setActive('lead')} />
        <QuickActionButton icon={FolderPlus} label="פרויקט חדש" color="bg-purple-600 hover:bg-purple-700" onClick={() => setActive('project')} />
        <QuickActionButton icon={CheckSquare} label="משימה חדשה" color="bg-yellow-600 hover:bg-yellow-700" onClick={() => setActive('task')} />
      </div>

      <Modal open={active === 'lead'} onClose={close} title="ליד חדש" size="lg">
        <LeadForm
          onSubmit={handleCreateLead}
          onCancel={close}
        />
      </Modal>

      <Modal open={active === 'project'} onClose={close} title="פרויקט חדש" size="lg">
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={close}
        />
      </Modal>

      <Modal open={active === 'task'} onClose={close} title="משימה חדשה" size="md">
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={close}
        />
      </Modal>
    </>
  )
}

function QuickActionButton({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ElementType
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors ${color}`}
    >
      <Plus size={13} />
      {label}
    </button>
  )
}
