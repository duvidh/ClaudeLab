'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Users, CheckSquare, Calendar } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type ModalType = 'lead' | 'task' | 'meeting' | null

const ACTIONS = [
  { type: 'meeting' as const, icon: Calendar, label: 'פגישה חדשה', color: 'bg-cyan-600 hover:bg-cyan-500' },
  { type: 'task' as const, icon: CheckSquare, label: 'משימה חדשה', color: 'bg-yellow-600 hover:bg-yellow-500' },
  { type: 'lead' as const, icon: Users, label: 'ליד חדש', color: 'bg-blue-600 hover:bg-blue-500' },
]

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)
  const [flash, setFlash] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function openModal(type: ModalType) {
    setOpen(false)
    setModal(type)
  }

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2500)
  }

  async function handleCreateLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fd.get('fullName'), primaryPhone: fd.get('primaryPhone') }),
    })
    if (res.ok) {
      const json = await res.json()
      setModal(null)
      router.push(`/leads/${json.data.id}`)
    }
  }

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const dueDate = fd.get('dueDate') as string
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: fd.get('title'),
        priority: fd.get('priority'),
        dueDate: dueDate ? new Date(dueDate) : undefined,
      }),
    })
    setModal(null)
    showFlash('משימה נוצרה')
  }

  async function handleCreateMeeting(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const date = fd.get('date') as string
    await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: fd.get('type'),
        summary: fd.get('summary') || undefined,
        date: date ? new Date(date) : new Date(),
      }),
    })
    setModal(null)
    showFlash('פגישה נרשמה')
  }

  return (
    <>
      {/* Flash toast */}
      {flash && (
        <div className="fixed bottom-24 end-6 z-50 bg-green-600 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-pulse">
          {flash}
        </div>
      )}

      <div ref={containerRef} className="fixed bottom-6 end-6 z-40 flex flex-col items-end gap-2">
        {/* Action options */}
        {open && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {ACTIONS.map((action) => (
              <button
                key={action.type}
                onClick={() => openModal(action.type)}
                className={`flex items-center gap-2 pe-3 ps-2 py-2 rounded-full text-xs font-semibold text-white shadow-lg transition-all ${action.color}`}
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all text-white ${
            open ? 'bg-gray-700 rotate-45' : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
          }`}
          title="פעולות מהירות"
        >
          {open ? <X size={20} /> : <Plus size={22} />}
        </button>
      </div>

      {/* Lead modal */}
      <Modal open={modal === 'lead'} onClose={() => setModal(null)} title="ליד חדש" size="sm">
        <form onSubmit={handleCreateLead} className="space-y-3">
          <Input label="שם מלא *" name="fullName" placeholder="ישראל ישראלי" required />
          <Input label="טלפון *" name="primaryPhone" placeholder="050-0000000" required />
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">צור ועבור לליד</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>ביטול</Button>
          </div>
        </form>
      </Modal>

      {/* Task modal */}
      <Modal open={modal === 'task'} onClose={() => setModal(null)} title="משימה חדשה" size="sm">
        <form onSubmit={handleCreateTask} className="space-y-3">
          <Input label="כותרת *" name="title" placeholder="מה צריך לעשות?" required />
          <Input label="תאריך יעד" name="dueDate" type="datetime-local" />
          <Select
            label="עדיפות"
            name="priority"
            options={[
              { value: 'LOW', label: 'נמוכה' },
              { value: 'MEDIUM', label: 'בינונית' },
              { value: 'HIGH', label: 'גבוהה' },
            ]}
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">צור משימה</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>ביטול</Button>
          </div>
        </form>
      </Modal>

      {/* Meeting modal */}
      <Modal open={modal === 'meeting'} onClose={() => setModal(null)} title="פגישה חדשה" size="sm">
        <form onSubmit={handleCreateMeeting} className="space-y-3">
          <Select
            label="סוג"
            name="type"
            options={[
              { value: 'פגישה', label: 'פגישה' },
              { value: 'שיחה', label: 'שיחה' },
            ]}
          />
          <Input label="תאריך ושעה *" name="date" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">נושא / סיכום</label>
            <textarea
              name="summary"
              rows={2}
              placeholder="נושא הפגישה..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1">שמור פגישה</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>ביטול</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
