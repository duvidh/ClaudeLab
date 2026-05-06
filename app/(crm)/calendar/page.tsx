'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Calendar, Users, CheckSquare, FolderOpen, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type CalendarMeeting = {
  id: string
  date: string
  type: string
  summary: string | null
  lead: { id: string; fullName: string } | null
  client: { id: string; name: string } | null
}

type CalendarTask = {
  id: string
  title: string
  dueDate: string
  priority: string
  status: string
  client: { id: string; name: string } | null
  project: { id: string; name: string } | null
}

type CalendarProject = {
  id: string
  name: string
  startDate: string | null
  plannedEndDate: string | null
  status: string
}

type CalendarData = {
  meetings: CalendarMeeting[]
  tasks: CalendarTask[]
  projects: CalendarProject[]
}

type DayEvent = {
  type: 'meeting' | 'task' | 'project-start' | 'project-end'
  id: string
  label: string
  subLabel?: string
  priority?: string
}

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
const HEBREW_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

const EVENT_STYLES = {
  meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
  task: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30',
  'project-start': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-500/30',
  'project-end': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-500/30',
}

const EVENT_ICONS = {
  meeting: Users,
  task: CheckSquare,
  'project-start': FolderOpen,
  'project-end': FolderOpen,
}

function buildDayMap(year: number, month: number, data: CalendarData): Record<number, DayEvent[]> {
  const map: Record<number, DayEvent[]> = {}

  function addEvent(dateStr: string | null | undefined, event: DayEvent) {
    if (!dateStr) return
    const d = new Date(dateStr)
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate()
      if (!map[day]) map[day] = []
      map[day].push(event)
    }
  }

  for (const m of data.meetings) {
    addEvent(m.date, {
      type: 'meeting',
      id: m.id,
      label: m.lead?.fullName ?? m.client?.name ?? m.type,
      subLabel: m.summary ?? undefined,
    })
  }

  for (const t of data.tasks) {
    addEvent(t.dueDate, {
      type: 'task',
      id: t.id,
      label: t.title,
      subLabel: t.client?.name ?? t.project?.name ?? undefined,
      priority: t.priority,
    })
  }

  for (const p of data.projects) {
    if (p.startDate) {
      addEvent(p.startDate, {
        type: 'project-start',
        id: p.id,
        label: p.name,
        subLabel: 'התחלה',
      })
    }
    if (p.plannedEndDate) {
      addEvent(p.plannedEndDate, {
        type: 'project-end',
        id: p.id,
        label: p.name,
        subLabel: 'תאריך סיום',
      })
    }
  }

  return map
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [data, setData] = useState<CalendarData>({ meetings: [], tasks: [], projects: [] })
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Quick-add modal state
  const [createType, setCreateType] = useState<'meeting' | 'task' | null>(null)
  const [creating, setCreating] = useState(false)
  const [meetingType, setMeetingType] = useState('פגישה')
  const [meetingSummary, setMeetingSummary] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('MEDIUM')

  async function loadCalendar(y: number, m: number) {
    setLoading(true)
    setSelectedDay(null)
    const res = await fetch(`/api/calendar?year=${y}&month=${m}`)
    const json = await res.json()
    setData(json.data ?? { meetings: [], tasks: [], projects: [] })
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCalendar(year, month)
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth() + 1)
    setSelectedDay(today.getDate())
  }

  function openCreate(type: 'meeting' | 'task') {
    setCreateType(type)
    setMeetingType('פגישה')
    setMeetingSummary('')
    setTaskTitle('')
    setTaskPriority('MEDIUM')
  }

  function closeCreate() {
    setCreateType(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDay) return
    setCreating(true)
    try {
      const date = new Date(year, month - 1, selectedDay, 9, 0)
      if (createType === 'meeting') {
        await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, type: meetingType, summary: meetingSummary || undefined }),
        })
      } else {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: taskTitle, dueDate: date, priority: taskPriority }),
        })
      }
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`)
      const json = await res.json()
      setData(json.data ?? { meetings: [], tasks: [], projects: [] })
      closeCreate()
    } finally {
      setCreating(false)
    }
  }

  const dayEvents = buildDayMap(year, month, data)

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day

  const selectedEvents = selectedDay ? (dayEvents[selectedDay] ?? []) : []
  const totalEvents = data.meetings.length + data.tasks.length + data.projects.length

  return (
    <div>
      <PageHeader
        title="יומן"
        subtitle={`${HEBREW_MONTHS[month - 1]} ${year} · ${totalEvents} אירועים`}
      />

      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ChevronRight size={18} />
              </button>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white text-lg">
                  {HEBREW_MONTHS[month - 1]} {year}
                </span>
                <button
                  onClick={goToday}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/40 hover:border-blue-400 rounded px-2 py-0.5 transition-colors"
                >
                  היום
                </button>
              </div>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
              {HEBREW_DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }, (_, i) => {
                  const day = i - firstDay + 1
                  const isValid = day >= 1 && day <= daysInMonth
                  const events = isValid ? (dayEvents[day] ?? []) : []
                  const isSelected = isValid && selectedDay === day
                  const isTodayCell = isValid && isToday(day)

                  return (
                    <div
                      key={i}
                      onClick={() => isValid && setSelectedDay(day === selectedDay ? null : day)}
                      className={`min-h-[90px] border-b border-r border-gray-100 dark:border-gray-800 p-1.5 transition-colors ${
                        isValid ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40' : 'opacity-30'
                      } ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10 ring-1 ring-inset ring-blue-500/40' : ''}`}
                    >
                      {isValid && (
                        <>
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                            isTodayCell ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-400'
                          }`}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {events.slice(0, 3).map((ev, idx) => {
                              const Icon = EVENT_ICONS[ev.type]
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-1 text-[10px] rounded px-1 py-0.5 border truncate ${EVENT_STYLES[ev.type]}`}
                                >
                                  <Icon size={9} className="shrink-0" />
                                  <span className="truncate">{ev.label}</span>
                                </div>
                              )
                            })}
                            {events.length > 3 && (
                              <div className="text-[10px] text-gray-500 px-1">+{events.length - 3} נוספים</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500/40 inline-block" />פגישות</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-yellow-500/40 inline-block" />משימות</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500/40 inline-block" />התחלת פרויקט</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/40 inline-block" />סיום פרויקט</span>
          </div>
        </div>

        <div className="w-72 shrink-0">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {selectedDay
                  ? `${selectedDay} ${HEBREW_MONTHS[month - 1]}`
                  : 'בחר יום לפרטים'}
              </span>
            </div>

            {selectedDay !== null && (
              <div className="flex gap-1.5 mb-4">
                <button
                  onClick={() => openCreate('meeting')}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-lg text-blue-600 dark:text-blue-300 transition-colors"
                >
                  <Plus size={11} /> פגישה
                </button>
                <button
                  onClick={() => openCreate('task')}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg text-yellow-600 dark:text-yellow-300 transition-colors"
                >
                  <Plus size={11} /> משימה
                </button>
              </div>
            )}

            {selectedDay === null ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                לחץ על יום בלוח כדי לראות את האירועים שלו
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                אין אירועים ביום זה
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev, idx) => {
                  const Icon = EVENT_ICONS[ev.type]
                  return (
                    <div key={idx} className={`rounded-lg border p-2.5 ${EVENT_STYLES[ev.type]}`}>
                      <div className="flex items-start gap-2">
                        <Icon size={14} className="shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-snug">{ev.label}</p>
                          {ev.subLabel && (
                            <p className="text-[11px] opacity-70 mt-0.5 truncate">{ev.subLabel}</p>
                          )}
                          <p className="text-[10px] opacity-50 mt-1">
                            {ev.type === 'meeting' ? 'פגישה' :
                             ev.type === 'task' ? 'משימה' :
                             ev.type === 'project-start' ? 'התחלת פרויקט' : 'סיום פרויקט'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="mt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">סיכום חודש</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Users size={13} />פגישות</span>
                <span className="font-semibold text-blue-600 dark:text-blue-300">{data.meetings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><CheckSquare size={13} />משימות פתוחות</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-300">{data.tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FolderOpen size={13} />פרויקטים</span>
                <span className="font-semibold text-green-600 dark:text-green-300">{data.projects.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick-add modal */}
      <Modal
        open={createType !== null}
        onClose={closeCreate}
        title={`הוסף ${createType === 'meeting' ? 'פגישה' : 'משימה'} — ${selectedDay} ${HEBREW_MONTHS[month - 1]}`}
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          {createType === 'meeting' ? (
            <>
              <Select
                label="סוג"
                options={[
                  { value: 'פגישה', label: 'פגישה' },
                  { value: 'שיחה', label: 'שיחה' },
                ]}
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">סיכום / נושא</label>
                <textarea
                  value={meetingSummary}
                  onChange={(e) => setMeetingSummary(e.target.value)}
                  rows={2}
                  placeholder="נושא הפגישה..."
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              <Input
                label="כותרת משימה *"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="מה צריך לעשות?"
                required
              />
              <Select
                label="עדיפות"
                options={[
                  { value: 'LOW', label: 'נמוכה' },
                  { value: 'MEDIUM', label: 'בינונית' },
                  { value: 'HIGH', label: 'גבוהה' },
                ]}
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
              />
            </>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              loading={creating}
              disabled={createType === 'task' && !taskTitle}
              className="flex-1"
            >
              הוסף
            </Button>
            <Button type="button" variant="secondary" onClick={closeCreate}>ביטול</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
